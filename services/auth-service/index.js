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

const logger = createLogger('auth-service');
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
app.use(getMorganMiddleware('auth-service'));

// Passport setup
require('../../server/middleware/passport')(passport);
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('../../server/routes/auth');
const userRoutes = require('../../server/routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Auth Service Error: ${err.message}`);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Auth Service Error' });
});

// ─── DB & Server Startup ──────────────────────────────────────────────────────
const PORT = process.env.AUTH_SERVICE_PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/campusolx';

async function startServer() {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        logger.info('✅ Auth Service connected to MongoDB');

        await connectRedis();
        await connectRabbitMQ();

        app.listen(PORT, () => {
            logger.info(`🚀 Auth Service running on port ${PORT}`);
        });
    } catch (err) {
        logger.error(`❌ Auth Service startup failed: ${err.message}`);
        process.exit(1);
    }
}

startServer();

module.exports = app;
