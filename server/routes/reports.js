const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { isAuthenticated, isProfileComplete } = require('../middleware/auth');
const { notifyAdmins } = require('../socket/index');

// ─── Submit a report ───────────────────────────────────────────────────────────
router.post('/', isAuthenticated, isProfileComplete, async (req, res) => {
    try {
        const { productId, reason, details } = req.body;

        if (!productId || !reason) {
            return res.status(400).json({ success: false, message: 'Product and reason are required' });
        }

        // Prevent duplicate reports from same user
        const existing = await Report.findOne({
            productId,
            reporterId: req.user._id,
            status: 'pending'
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already reported this listing' });
        }

        const report = await Report.create({
            productId,
            reporterId: req.user._id,
            reason,
            details: details || ''
        });

        await report.populate([
            { path: 'productId', select: 'title' },
            { path: 'reporterId', select: 'name' }
        ]);

        // Notify admins via socket
        notifyAdmins('newReport', {
            report,
            message: `New report: "${report.productId.title}" reported by ${report.reporterId.name}`
        });

        res.status(201).json({
            success: true,
            message: 'Report submitted. Admin will review it shortly.'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
