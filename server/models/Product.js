const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    category: {
        type: String,
        required: true,
        enum: ['Books', 'Electronics', 'Furniture', 'Cycles', 'Stationery', 'Others']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    mrp: {
        type: Number,
        default: null,
        min: 0
    },
    condition: {
        type: String,
        required: true,
        enum: ['New', 'Like New', 'Used']
    },
    images: {
        type: [String], // Cloudinary URLs
        default: []
    },
    status: {
        type: String,
        enum: ['available', 'sold', 'pending'],
        default: 'available',
        index: true
    },
    availableFrom: {
        type: Date,
        default: null
    },
    isHidden: {
        type: Boolean,
        default: false,
        index: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    chatCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    autoIndex: false
});

// Index for search and filtering
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1, isHidden: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
