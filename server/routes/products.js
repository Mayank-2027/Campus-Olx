const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuthenticated, isProfileComplete, isVerifiedSeller } = require('../middleware/auth');
const { productUpload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// ─── Get all listings (browse) ────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
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

        res.json({
            success: true,
            products,
            total,
            pages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        });
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
        const product = await Product.findById(req.params.id)
            .populate('sellerId', 'name profilePic isVerifiedSeller year branchFull');
        if (!product || product.isHidden) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        // Increment view count
        await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
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
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
