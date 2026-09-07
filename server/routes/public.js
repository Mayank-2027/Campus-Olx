const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { getCache, setCache } = require('../utils/cache');

router.get('/public-stats', async (req, res) => {
    try {
        const cachedStats = await getCache('public:stats');
        if (cachedStats) {
            return res.json({ success: true, stats: cachedStats, source: 'cache' });
        }

        const users = await User.countDocuments();
        const listings = await Product.countDocuments({
            status: 'available',
            isHidden: false
        });
        const trades = await Product.countDocuments({
            status: 'sold'
        });

        const stats = {
            users,
            listings,
            trades,
            fees: 0
        };

        // Cache landing stats for 10 minutes (600 seconds)
        await setCache('public:stats', stats, 600);

        res.json({
            success: true,
            stats
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

