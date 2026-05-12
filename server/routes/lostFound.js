const express = require('express');
const router = express.Router();
const LostFound = require('../models/LostFound');
const { isAuthenticated, isProfileComplete } = require('../middleware/auth');
const { productUpload, uploadToCloudinary } = require('../middleware/upload');

// ─── Get all lost/found items ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { type, status, page = 1, limit = 12 } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;

        const total = await LostFound.countDocuments(filter);
        const items = await LostFound.find(filter)
            .populate('reporterId', 'name profilePic year')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ success: true, items, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Report lost item ──────────────────────────────────────────────────────────
router.post('/report-lost', isAuthenticated, isProfileComplete,
    productUpload.array('images', 3),
    async (req, res) => {
        try {
            const { itemName, description, location, date, contactInfo } = req.body;

            if (!itemName || !description || !location || !date) {
                return res.status(400).json({ success: false, message: 'All required fields must be filled' });
            }

            const imageUrls = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const result = await uploadToCloudinary(file.buffer, 'campus-olx/lost-found');
                    imageUrls.push(result.secure_url);
                }
            }

            const item = await LostFound.create({
                type: 'lost',
                itemName,
                description,
                location,
                date: new Date(date),
                reporterId: req.user._id,
                images: imageUrls,
                contactInfo: contactInfo || ''
            });

            res.status(201).json({ success: true, item });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
);

// ─── Report found item ──────────────────────────────────────────────────────────
router.post('/report-found', isAuthenticated, isProfileComplete,
    productUpload.array('images', 3),
    async (req, res) => {
        try {
            const { itemName, description, location, date, handedOverTo, contactInfo } = req.body;

            if (!itemName || !description || !location || !date) {
                return res.status(400).json({ success: false, message: 'All required fields must be filled' });
            }

            const imageUrls = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const result = await uploadToCloudinary(file.buffer, 'campus-olx/lost-found');
                    imageUrls.push(result.secure_url);
                }
            }

            const item = await LostFound.create({
                type: 'found',
                itemName,
                description,
                location,
                date: new Date(date),
                reporterId: req.user._id,
                images: imageUrls,
                handedOverTo: handedOverTo || '',
                contactInfo: contactInfo || ''
            });

            res.status(201).json({ success: true, item });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
);

// ─── Claim item ────────────────────────────────────────────────────────────────
router.patch('/:id/claim', isAuthenticated, isProfileComplete, async (req, res) => {
    try {
        const item = await LostFound.findByIdAndUpdate(
            req.params.id,
            { status: 'claimed', claimedBy: req.user._id },
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Delete lost/found item (owner or admin) ───────────────────────────────────
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const item = await LostFound.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const isOwner = item.reporterId.toString() === req.user._id.toString();
        if (!isOwner && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
        }

        await item.deleteOne();
        res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
