const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });

const { CLIENT_URL } = require('../../server/config/urls');
const { createLogger, getMorganMiddleware } = require('../shared/utils/logger');
const { connectRedis } = require('../shared/config/redis');
const { connectRabbitMQ } = require('../shared/config/rabbitmq');

const logger = createLogger('product-service');
const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(getMorganMiddleware('product-service'));

// Passport setup for auth check middleware
require('../../server/middleware/passport')(passport);
app.use(passport.initialize());

// Static Uploads Fallback
app.use('/uploads', express.static(path.join(__dirname, '../../server/uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
const productRoutes = require('../../server/routes/products');
const reportRoutes = require('../../server/routes/reports');
const lostFoundRoutes = require('../../server/routes/lostFound');
const adminRoutes = require('../../server/routes/admin');
const uploadRoutes = require('../../server/routes/upload');
const publicRoutes = require('../../server/routes/public');

app.use('/api/products', productRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', publicRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'product-service', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Product Service Error: ${err.message}`);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Product Service Error' });
});

// ─── DB & Server Startup ──────────────────────────────────────────────────────
const PORT = process.env.PRODUCT_SERVICE_PORT || 5002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/campusolx';

async function startServer() {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        logger.info('✅ Product Service connected to MongoDB');

        await connectRedis();
        await connectRabbitMQ();

        app.listen(PORT, () => {
            logger.info(`🚀 Product Service running on port ${PORT}`);
        });
    } catch (err) {
        logger.error(`❌ Product Service startup failed: ${err.message}`);
        process.exit(1);
    }
}

startServer();

module.exports = app;
