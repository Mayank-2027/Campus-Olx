const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated, isProfileComplete } = require('../middleware/auth');

// ─── Complete Profile (first-time users) ──────────────────────────────────────
router.post('/complete-profile', isAuthenticated, async (req, res) => {
    try {
        const { name, enrollmentNo, year } = req.body;

        if (!name || !enrollmentNo || !year) {
            return res.status(400).json({
                success: false,
                message: 'Name, enrollment number, and year are required'
            });
        }

        // Validate enrollment format
        if (!enrollmentNo.startsWith('0201')) {
            return res.status(400).json({
                success: false,
                message: 'Enrollment number must start with 0201'
            });
        }

        // Parse enrollment to extract branch and joining year
        const parsed = User.parseEnrollment(enrollmentNo);
        if (!parsed) {
            return res.status(400).json({
                success: false,
                message: 'Invalid enrollment number format. Expected: 0201[BRANCH][YEAR][ROLL] e.g. 0201IT231062'
            });
        }

        // Check if enrollment already in use by another user
        const existing = await User.findOne({
            enrollmentNo: enrollmentNo.toUpperCase(),
            _id: { $ne: req.user._id }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'This enrollment number is already registered'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                name,
                enrollmentNo: enrollmentNo.toUpperCase(),
                year,
                branch: parsed.branch,
                branchFull: parsed.branchFull,
                joiningYear: parsed.joiningYear,
                isProfileComplete: true
            },
            { new: true }
        );

        const { publishEvent } = require('../../services/shared/config/rabbitmq');
        publishEvent('USER_REGISTERED', {
            userId: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            enrollmentNo: updatedUser.enrollmentNo,
            branchFull: updatedUser.branchFull
        }).catch(err => console.error('RabbitMQ publish error:', err));

        res.json({
            success: true,
            message: 'Profile completed successfully!',
            user: updatedUser
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put('/profile', isAuthenticated, isProfileComplete, async (req, res) => {
    try {
        const { name, year } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name, year },
            { new: true }
        );
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Get public user profile ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name profilePic year branchFull isVerifiedSeller createdAt');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Validate enrollment (real-time helper) ───────────────────────────────────
router.post('/validate-enrollment', async (req, res) => {
    try {
        const { enrollmentNo } = req.body;
        const parsed = User.parseEnrollment(enrollmentNo);
        if (!parsed) {
            return res.json({ valid: false, message: 'Invalid enrollment format' });
        }
        const existing = await User.findOne({ enrollmentNo: enrollmentNo.toUpperCase() });
        if (existing) {
            return res.json({ valid: false, message: 'Enrollment already registered' });
        }
        res.json({ valid: true, ...parsed });
    } catch (err) {
        res.status(500).json({ valid: false, message: 'Server error' });
    }
});

module.exports = router;
