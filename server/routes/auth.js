const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL}/login?error=domain_mismatch`
    }),
    (req, res) => {
        // Check if profile is complete
        if (!req.user.isProfileComplete) {
            return res.redirect(`${process.env.CLIENT_URL}/complete-profile`);
        }
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }
);

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', isAuthenticated, (req, res) => {
    res.json({
        success: true,
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            profilePic: req.user.profilePic,
            enrollmentNo: req.user.enrollmentNo,
            year: req.user.year,
            branch: req.user.branch,
            branchFull: req.user.branchFull,
            joiningYear: req.user.joiningYear,
            isProfileComplete: req.user.isProfileComplete,
            isVerifiedSeller: req.user.isVerifiedSeller,
            verificationStatus: req.user.verificationStatus,
            isAdmin: req.user.isAdmin,
            isBanned: req.user.isBanned,
            createdAt: req.user.createdAt
        }
    });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });
});

// ─── Check auth status (for frontend) ────────────────────────────────────────
router.get('/status', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.json({
            isAuthenticated: true,
            isProfileComplete: req.user.isProfileComplete,
            isAdmin: req.user.isAdmin
        });
    }
    res.json({ isAuthenticated: false });
});

module.exports = router;
