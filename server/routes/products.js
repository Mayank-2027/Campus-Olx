const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuthenticated, isProfileComplete, isVerifiedSeller } = require('../middleware/auth');
const { productUpload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const {
    getCache,
    setCache,
    invalidateProductCache,
    trackProductView,
    getPopularProductIds
} = require('../utils/cache');

// ─── Get popular / trending listings ─────────────────────────────────────────
router.get('/popular', async (req, res) => {
    try {
        const cachedPopular = await getCache('products:popular');
        if (cachedPopular) {
            return res.json({ success: true, products: cachedPopular, source: 'cache' });
        }

        const popularIds = await getPopularProductIds(8);
        let products = [];

        if (popularIds && popularIds.length > 0) {
            products = await Product.find({
                _id: { $in: popularIds },
                status: 'available',
                isHidden: false
            }).populate('sellerId', 'name profilePic isVerifiedSeller');
        }

        // If not enough views recorded yet, fallback to top viewCount products
        if (products.length < 4) {
            products = await Product.find({ status: 'available', isHidden: false })
                .populate('sellerId', 'name profilePic isVerifiedSeller')
                .sort({ viewCount: -1, createdAt: -1 })
                .limit(8);
        }

        await setCache('products:popular', products, 180); // 3 minutes
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Get all listings (browse with cache) ─────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const {
            search, category, condition, minPrice, maxPrice,
            sort = 'newest', page = 1, limit = 12
        } = req.query;

        // Try Redis cache for browse queries
        const cacheKey = `products:list:${JSON.stringify(req.query)}`;
        const cachedResult = await getCache(cacheKey);
        if (cachedResult) {
            return res.json({ ...cachedResult, source: 'cache' });
        }

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

        // Cache result for 2 minutes (120 seconds)
        await setCache(cacheKey, responsePayload, 120);

        res.json(responsePayload);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
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

// ─── Get single product ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        // Asynchronously track view in Redis analytics
        trackProductView(productId);

        const cacheKey = `products:detail:${productId}`;
        const cachedProduct = await getCache(cacheKey);

        if (cachedProduct) {
            // Asynchronously increment DB view count
            Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } }).exec();
            return res.json({ success: true, product: cachedProduct, source: 'cache' });
        }

        const product = await Product.findById(productId)
            .populate('sellerId', 'name profilePic isVerifiedSeller year branchFull');

        if (!product || product.isHidden) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Increment view count in MongoDB
        await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });

        // Cache single product for 5 minutes (300 seconds)
        await setCache(cacheKey, product, 300);

        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Create listing ────────────────────────────────────────────────────────────
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

            // Invalidate product listings cache
            await invalidateProductCache();

            res.status(201).json({ success: true, product });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Failed to create listing' });
        }
    }
);

// ─── Update listing ────────────────────────────────────────────────────────────
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

        // Invalidate cache for this product and listings
        await invalidateProductCache(req.params.id);

        res.json({ success: true, product: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Delete listing ────────────────────────────────────────────────────────────
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

        // Invalidate cache
        await invalidateProductCache(req.params.id);

        res.json({ success: true, message: 'Listing deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Mark as sold ──────────────────────────────────────────────────────────────
router.patch('/:id/mark-sold', isAuthenticated, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        product.status = 'sold';
        await product.save();

        // Invalidate cache
        await invalidateProductCache(req.params.id);

        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
