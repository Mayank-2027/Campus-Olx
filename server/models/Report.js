const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'Fake item (doesn\'t exist)',
            'Wrong price (misleading)',
            'Scam/fraud attempt',
            'Offensive content',
            'Duplicate listing',
            'Other'
        ]
    },
    details: {
        type: String,
        default: '',
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending',
        index: true
    },
    action: {
        type: String,
        enum: ['none', 'removed', 'banned'],
        default: 'none'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
