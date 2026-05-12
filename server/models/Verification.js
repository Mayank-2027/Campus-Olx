const mongoose = require('mongoose');

// Stores pending seller verification requests (temp photo path only)
const verificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    tempPhotoPath: {
        type: String,
        required: true
    },
    tempPhotoFilename: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed'],
        default: 'pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Verification', verificationSchema);
