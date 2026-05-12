const path = require('path');
const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');
const LostFound = require('../models/LostFound');
const AdminLog = require('../models/AdminLog');
const Verification = require('../models/Verification');
const { deleteTempFile } = require('../middleware/upload');
const { notifyAdmins, notifyUser } = require('../socket');

// Helper: persist an admin action
const logAction = (adminId, action, targetType, targetId, details = '') =>
    AdminLog.create({ adminId, action, targetType, targetId, details });

// SELLER VERIFICATION
exports.submitVerification = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an ID photo' });
        }

        const existing = await Verification.findOne({ userId: req.user._id });
        if (existing && existing.status === 'pending') {
            deleteTempFile(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'You already have a pending verification request'
            });
        }

        if (existing) {
            deleteTempFile(existing.tempPhotoPath);
            await Verification.deleteOne({ userId: req.user._id });
        }

        const verification = await Verification.create({
            userId: req.user._id,
            tempPhotoPath: req.file.path,
            tempPhotoFilename: req.file.filename
        });

        await User.findByIdAndUpdate(req.user._id, { verificationStatus: 'pending' });

        const user = await User.findById(req.user._id).select('name email enrollmentNo year');
        notifyAdmins('newVerification', {
            verificationId: verification._id,
            user,
            message: `New verification request from ${user.name}`
        });

        res.json({
            success: true,
            message: 'Verification submitted successfully. Admin will review shortly.'
        });
    } catch (err) {
        if (req.file) deleteTempFile(req.file.path);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getStats = async (_req, res) => {
    try {
        const [users, pendingVerifications, pendingReports, listings, lostFoundItems] = await Promise.all([
            User.countDocuments(),
            Verification.countDocuments({ status: 'pending' }),
            Report.countDocuments({ status: 'pending' }),
            Product.countDocuments({ isHidden: false }),
            LostFound.countDocuments()
        ]);
        res.json({ success: true, stats: { users, pendingVerifications, pendingReports, listings, lostFoundItems } });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPendingVerifications = async (_req, res) => {
    try {
        const verifications = await Verification.find({ status: 'pending' })
            .populate('userId', 'name email enrollmentNo year branchFull profilePic')
            .sort({ submittedAt: 1 });
        res.json({ success: true, verifications });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getVerificationPhoto = async (req, res) => {
    try {
        const verification = await Verification.findById(req.params.id);
        if (!verification) return res.status(404).json({ success: false, message: 'Not found' });
        res.sendFile(path.resolve(verification.tempPhotoPath));
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.approveVerification = async (req, res) => {
    try {
        const verification = await Verification.findById(req.params.id).populate('userId');
        if (!verification) return res.status(404).json({ success: false, message: 'Not found' });

        deleteTempFile(verification.tempPhotoPath);

        await User.findByIdAndUpdate(verification.userId._id, {
            isVerifiedSeller: true,
            verificationStatus: 'approved'
        });

        await Verification.findByIdAndDelete(verification._id);

        await logAction(req.user._id, 'APPROVE_VERIFICATION', 'verification', verification.userId._id,
            `Approved seller verification for ${verification.userId.name}`);

        notifyUser(verification.userId._id.toString(), 'verificationApproved', {
            message: '🎉 Congratulations! You are now a verified seller!'
        });

        res.json({ success: true, message: 'Verification approved. ID photo has been permanently deleted.' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.rejectVerification = async (req, res) => {
    try {
        const { reason } = req.body;
        const verification = await Verification.findById(req.params.id).populate('userId');
        if (!verification) return res.status(404).json({ success: false, message: 'Not found' });

        deleteTempFile(verification.tempPhotoPath);

        await User.findByIdAndUpdate(verification.userId._id, {
            verificationStatus: 'rejected',
            verificationRejectedReason: reason || 'Photo not clear'
        });

        await Verification.findByIdAndDelete(verification._id);

        await logAction(req.user._id, 'REJECT_VERIFICATION', 'verification', verification.userId._id,
            `Rejected: ${reason || 'Photo not clear'}`);

        notifyUser(verification.userId._id.toString(), 'verificationRejected', {
            message: `Verification rejected: ${reason || 'Photo not clear'}. You can try again.`
        });

        res.json({ success: true, message: 'Verification rejected. ID photo has been permanently deleted.' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// REPORTS
exports.getReports = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const reports = await Report.find(filter)
            .populate('productId', 'title sellerId')
            .populate('reporterId', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, reports });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.dismissReport = async (req, res) => {
    try {
        await Report.findByIdAndUpdate(req.params.id, {
            status: 'dismissed',
            action: 'none',
            reviewedBy: req.user._id,
            reviewedAt: new Date()
        });
        res.json({ success: true, message: 'Report dismissed' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.removeListing = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('productId');
        if (!report) return res.status(404).json({ success: false, message: 'Not found' });

        await Product.findByIdAndUpdate(report.productId._id, { isHidden: true });
        await Report.findByIdAndUpdate(req.params.id, {
            status: 'resolved',
            action: 'removed',
            reviewedBy: req.user._id,
            reviewedAt: new Date()
        });
        await logAction(req.user._id, 'REMOVE_LISTING', 'product', report.productId._id, 'Removed due to report');
        res.json({ success: true, message: 'Listing removed' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.banUserFromReport = async (req, res) => {
    try {
        const { reason } = req.body;
        const report = await Report.findById(req.params.id).populate('productId');
        if (!report) return res.status(404).json({ success: false, message: 'Not found' });

        const product = await Product.findById(report.productId._id);
        if (product) {
            await User.findByIdAndUpdate(product.sellerId, {
                isBanned: true,
                banReason: reason || 'Violated community guidelines'
            });
            await Product.updateMany({ sellerId: product.sellerId }, { isHidden: true });
        }

        await Report.findByIdAndUpdate(req.params.id, {
            status: 'resolved',
            action: 'banned',
            reviewedBy: req.user._id,
            reviewedAt: new Date()
        });
        await logAction(req.user._id, 'BAN_USER', 'user', product?.sellerId, reason);
        res.json({ success: true, message: 'User banned and all listings hidden' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// USER MANAGEMENT
exports.getUsers = async (req, res) => {
    try {
        const { search, filter, page = 1, limit = 20 } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { enrollmentNo: { $regex: search, $options: 'i' } }
            ];
        }
        if (filter === 'verified') query.isVerifiedSeller = true;
        if (filter === 'unverified') query.isVerifiedSeller = false;
        if (filter === 'banned') query.isBanned = true;
        if (filter === 'admin') query.isAdmin = true;

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.banUser = async (req, res) => {
    try {
        const { reason } = req.body;
        await User.findByIdAndUpdate(req.params.id, { isBanned: true, banReason: reason });
        await Product.updateMany({ sellerId: req.params.id }, { isHidden: true });
        await logAction(req.user._id, 'BAN_USER', 'user', req.params.id, reason);
        res.json({ success: true, message: 'User banned' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.unbanUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isBanned: false, banReason: '' });
        await logAction(req.user._id, 'UNBAN_USER', 'user', req.params.id, '');
        res.json({ success: true, message: 'User unbanned' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.makeAdmin = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isAdmin: true });
        await logAction(req.user._id, 'MAKE_ADMIN', 'user', req.params.id, '');
        res.json({ success: true, message: 'User promoted to admin' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// LOST & FOUND
exports.getLostFound = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const items = await LostFound.find(filter)
            .populate('reporterId', 'name email')
            .populate('claimedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, items });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.verifyLostFoundClaim = async (req, res) => {
    try {
        await LostFound.findByIdAndUpdate(req.params.id, {
            status: 'returned',
            verifiedBy: req.user._id
        });
        await logAction(req.user._id, 'VERIFY_CLAIM', 'lostfound', req.params.id, '');
        res.json({ success: true, message: 'Claim verified and item marked as returned' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteLostFound = async (req, res) => {
    try {
        const item = await LostFound.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        await item.deleteOne();
        await logAction(req.user._id, 'DELETE_LOST_FOUND', 'lostfound', req.params.id, item.itemName || '');

        res.json({ success: true, message: 'Item deleted' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// LOGS
exports.getLogs = async (req, res) => {
    try {
        const { page = 1, limit = 30, action } = req.query;
        const filter = action ? { action } : {};
        const total = await AdminLog.countDocuments(filter);
        const logs = await AdminLog.find(filter)
            .populate('adminId', 'name email')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ success: true, logs, total, pages: Math.ceil(total / limit) });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

