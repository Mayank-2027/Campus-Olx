const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { CLIENT_URL } = require('../config/urls');

const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};

const { generateToken } = require('../utils/jwt');

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false // Disable sessions
}));

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${CLIENT_URL}/login?error=domain_mismatch`,
        session: false // Disable sessions
    }),
    (req, res) => {
        // Generate JWT
        const token = generateToken(req.user._id);

        // Redirect back to frontend with token
        // Frontend will catch this token and store it in localStorage
        res.redirect(`${CLIENT_URL}/login-success?token=${token}`);
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
    // With JWT, logout is handled on the client by removing the token
    res.json({ success: true, message: 'Logged out successfully' });
});

// ─── Check auth status (for frontend) ────────────────────────────────────────
router.get('/status', isAuthenticated, (req, res) => {
    // If it reaches here, the isAuthenticated middleware already verified the JWT
    res.json({
        success: true,
        isAuthenticated: true,
        isProfileComplete: req.user.isProfileComplete,
        isAdmin: req.user.isAdmin,
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

module.exports = router;
