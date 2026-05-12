const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { productUpload, uploadToCloudinary } = require('../middleware/upload');

// Upload product images to Cloudinary
router.post('/product-images', isAuthenticated,
    productUpload.array('images', 5),
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No files uploaded' });
            }

            const urls = [];
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer);
                urls.push(result.secure_url);
            }

            res.json({ success: true, urls });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Upload failed' });
        }
    }
);

module.exports = router;
