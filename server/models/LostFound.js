const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['lost', 'found'],
        required: true,
        index: true
    },
    itemName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: {
        type: [String], // Cloudinary URLs
        default: []
    },
    status: {
        type: String,
        enum: ['open', 'claimed', 'returned'],
        default: 'open',
        index: true
    },
    handedOverTo: {
        type: String,
        default: ''
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    contactInfo: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LostFound', lostFoundSchema);
