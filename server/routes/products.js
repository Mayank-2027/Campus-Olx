const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuthenticated, isProfileComplete, isVerifiedSeller } = require('../middleware/auth');
const { productUpload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const { getCache, setCache, invalidateProductCache, trackProductView, getPopularProductIds } = require('../../services/shared/utils/cache');
const { publishEvent } = require('../../services/shared/config/rabbitmq');

// Helper to construct query cache key
const getProductsCacheKey = (query) => {
    const sortedKeys = Object.keys(query).sort();
    const queryString = sortedKeys.map(k => `${k}=${query[k]}`).join('&');
    return `products:list:${queryString || 'default'}`;
};

// ─── Get popular / frequently viewed products ────────────────────────────────
router.get('/popular/viewed', async (req, res) => {
    try {
        const cacheKey = 'products:popular';
        const cached = await getCache(cacheKey);
        if (cached) {
            res.setHeader('X-Cache', 'HIT');
            return res.json({ success: true, products: cached, source: 'redis-cache' });
        }

        const popularIds = await getPopularProductIds(10);
        let products = [];

        if (popularIds.length > 0) {
            products = await Product.find({ _id: { $in: popularIds }, status: 'available', isHidden: false })
                .populate('sellerId', 'name profilePic isVerifiedSeller');
        } else {
            // Fallback to highest viewCount in DB
            products = await Product.find({ status: 'available', isHidden: false })
                .sort({ viewCount: -1 })
                .limit(10)
                .populate('sellerId', 'name profilePic isVerifiedSeller');
        }

        await setCache(cacheKey, products, 300); // 5 min TTL
        res.setHeader('X-Cache', 'MISS');
        res.json({ success: true, products, source: 'mongodb' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Get all listings (browse & search) with Redis Caching ────────────────────
router.get('/', async (req, res) => {
    try {
        const cacheKey = getProductsCacheKey(req.query);
        const cachedData = await getCache(cacheKey);

        if (cachedData) {
            res.setHeader('X-Cache', 'HIT');
            return res.json({
                ...cachedData,
                source: 'redis-cache'
            });
        }

        const {
            search, category, condition, minPrice, maxPrice,
            sort = 'newest', page = 1, limit = 12
        } = req.query;

        const filter = {
            status: 'available',
            isHidden: false
        };

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) filter.category = category;
        if (condition) filter.condition = condition;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            'price-low': { price: 1 },
            'price-high': { price: -1 }
        };

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('sellerId', 'name profilePic isVerifiedSeller')
            .sort(sortOptions[sort] || sortOptions.newest)
            .skip(skip)
            .limit(Number(limit));

        const responsePayload = {
            success: true,
            products,
            total,
            pages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        };

        // Cache response for 5 minutes
        await setCache(cacheKey, responsePayload, 300);

        res.setHeader('X-Cache', 'MISS');
        res.json({
            ...responsePayload,
            source: 'mongodb'
        });
    } catch (err) {
        console.error('GET /products error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─── My listings ───────────────────────────────────────────────────────────────
router.get('/seller/my-listings', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { sellerId: req.user._id };
        if (status) filter.status = status;
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Get single product with Redis Caching ─────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const cacheKey = `products:detail:${productId}`;

        // Track product view in Redis sorted set asynchronously
        trackProductView(productId).catch(() => {});

        const cachedProduct = await getCache(cacheKey);
        if (cachedProduct) {
            // Increment view count in MongoDB
            Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } }).exec();
            res.setHeader('X-Cache', 'HIT');
            return res.json({ success: true, product: cachedProduct, source: 'redis-cache' });
        }

        const product = await Product.findById(productId)
            .populate('sellerId', 'name profilePic isVerifiedSeller year branchFull');

        if (!product || product.isHidden) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Increment view count in MongoDB
        await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });

        // Cache single product details
        await setCache(cacheKey, product, 600); // 10 min TTL

        res.setHeader('X-Cache', 'MISS');
        res.json({ success: true, product, source: 'mongodb' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Create listing (Invalidates Cache + Publishes Event) ─────────────────────
router.post('/', isAuthenticated, isProfileComplete, isVerifiedSeller,
    productUpload.array('images', 5),
    async (req, res) => {
        try {
            const { title, description, category, price, mrp, condition, availableFrom } = req.body;

            if (!title || !description || !category || !price || !condition) {
                return res.status(400).json({ success: false, message: 'All required fields must be filled' });
            }

            // Upload images to Cloudinary
            const imageUrls = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const result = await uploadToCloudinary(file.buffer);
                    imageUrls.push(result.secure_url);
                }
            }

            const product = await Product.create({
                sellerId: req.user._id,
                title,
                description,
                category,
                price: Number(price),
                mrp: mrp ? Number(mrp) : null,
                condition,
                images: imageUrls,
                availableFrom: availableFrom ? new Date(availableFrom) : null
            });

            // 1. Invalidate Redis cache
            await invalidateProductCache();

            // 2. Publish PRODUCT_CREATED event to RabbitMQ
            publishEvent('PRODUCT_CREATED', {
                productId: product._id,
                title: product.title,
                price: product.price,
                category: product.category,
                sellerId: req.user._id,
                sellerName: req.user.name
            }).catch(err => console.error('RabbitMQ publish error:', err));

            res.status(201).json({ success: true, product });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Failed to create listing' });
        }
    }
);

// ─── Update listing (Invalidates Cache) ────────────────────────────────────────
router.put('/:id', isAuthenticated, isProfileComplete, isVerifiedSeller, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (product.sellerId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { title, description, category, price, mrp, condition, availableFrom, status } = req.body;
        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            { title, description, category, price, mrp, condition, availableFrom, status },
            { new: true }
        );

        // Invalidate Redis Cache for products
        await invalidateProductCache(req.params.id);

        res.json({ success: true, product: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Delete listing (Invalidates Cache) ────────────────────────────────────────
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (product.sellerId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Delete images from Cloudinary
        for (const img of product.images) {
            await deleteFromCloudinary(img);
        }
        await Product.findByIdAndDelete(req.params.id);

        // Invalidate Redis Cache
        await invalidateProductCache(req.params.id);

        res.json({ success: true, message: 'Listing deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Mark as sold (Invalidates Cache) ──────────────────────────────────────────
router.patch('/:id/mark-sold', isAuthenticated, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        product.status = 'sold';
        await product.save();

        // Invalidate Redis Cache
        await invalidateProductCache(req.params.id);

        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
