const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Auth middleware: ensures user is logged in via JWT
const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication token missing' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-__v');

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned. Reason: ' + user.banReason
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Session expired, please login again' });
        }
        return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
};

// Auth middleware: ensures profile is complete
const isProfileComplete = (req, res, next) => {
    if (!req.user.isProfileComplete) {
        return res.status(403).json({
            success: false,
            message: 'Please complete your profile first',
            redirect: '/complete-profile'
        });
    }
    return next();
};

// Auth middleware: ensures user is a verified seller
const isVerifiedSeller = (req, res, next) => {
    if (!req.user.isVerifiedSeller && !req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Only verified sellers can perform this action'
        });
    }
    return next();
};

// Auth middleware: ensures user is an admin
const isAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    return next();
};

module.exports = { isAuthenticated, isProfileComplete, isVerifiedSeller, isAdmin };
