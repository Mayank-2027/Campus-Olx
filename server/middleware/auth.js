// Auth middleware: ensures user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        if (req.user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned. Reason: ' + req.user.banReason
            });
        }
        return next();
    }
    return res.status(401).json({ success: false, message: 'Please login to continue' });
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
