const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { isAuthenticated } = require('../middleware/auth');

// ─── Get notifications for the logged-in user ─────────────────────────────────
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(30);

        const unreadCount = await Notification.countDocuments({
            recipientId: req.user._id,
            isRead: false
        });

        res.json({ success: true, notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Mark a notification as read ─────────────────────────────────────────────
router.patch('/:id/read', isAuthenticated, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user._id },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Mark all notifications as read ──────────────────────────────────────────
router.patch('/read-all', isAuthenticated, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
