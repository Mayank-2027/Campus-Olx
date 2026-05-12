const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

router.get('/public-stats', async (req, res) => {
    try {
        const users = await User.countDocuments();
        const listings = await Product.countDocuments({
            status: 'available',
            isHidden: false
        });
        const trades = await Product.countDocuments({
            status: 'sold'
        });

        res.json({
            success: true,
            stats: {
                users,
                listings,
                trades,
                fees: 0
            }
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        });
    }
});

module.exports = router;
