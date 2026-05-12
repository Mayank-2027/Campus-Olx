const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { idUpload } = require('../middleware/upload');
const {
    submitVerification,
    getStats,
    getPendingVerifications,
    getVerificationPhoto,
    approveVerification,
    rejectVerification,
    getReports,
    dismissReport,
    removeListing,
    banUserFromReport,
    getUsers,
    banUser,
    unbanUser,
    makeAdmin,
    getLostFound,
    verifyLostFoundClaim,
    deleteLostFound,
    getLogs
} = require('../controllers/adminController');

// Public (auth required) — seller verification submit
router.post(
    '/verify/submit',
    isAuthenticated,
    idUpload.single('idPhoto'),
    submitVerification
);

// Admin-only routes
router.get('/stats', isAuthenticated, isAdmin, getStats);

router.get('/verifications', isAuthenticated, isAdmin, getPendingVerifications);
router.get('/verifications/:id/photo', isAuthenticated, isAdmin, getVerificationPhoto);
router.post('/verifications/:id/approve', isAuthenticated, isAdmin, approveVerification);
router.post('/verifications/:id/reject', isAuthenticated, isAdmin, rejectVerification);

router.get('/reports', isAuthenticated, isAdmin, getReports);
router.post('/reports/:id/dismiss', isAuthenticated, isAdmin, dismissReport);
router.post('/reports/:id/remove-listing', isAuthenticated, isAdmin, removeListing);
router.post('/reports/:id/ban-user', isAuthenticated, isAdmin, banUserFromReport);

router.get('/users', isAuthenticated, isAdmin, getUsers);
router.patch('/users/:id/ban', isAuthenticated, isAdmin, banUser);
router.patch('/users/:id/unban', isAuthenticated, isAdmin, unbanUser);
router.patch('/users/:id/make-admin', isAuthenticated, isAdmin, makeAdmin);

router.get('/lost-found', isAuthenticated, isAdmin, getLostFound);
router.patch('/lost-found/:id/verify-claim', isAuthenticated, isAdmin, verifyLostFoundClaim);
router.delete('/lost-found/:id', isAuthenticated, isAdmin, deleteLostFound);

router.get('/logs', isAuthenticated, isAdmin, getLogs);

module.exports = router;
