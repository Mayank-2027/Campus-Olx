const express = require('express');
const http = require('http');
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
const initSocket = require('../../server/socket/index');

const logger = createLogger('chat-service');
const app = express();
const server = http.createServer(app);

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Initialize Socket.IO server
initSocket(server);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(getMorganMiddleware('chat-service'));

// Passport setup for auth middleware
require('../../server/middleware/passport')(passport);
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
const chatRoutes = require('../../server/routes/chats');
app.use('/api/chats', chatRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'chat-service', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Chat Service Error: ${err.message}`);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Chat Service Error' });
});

// ─── DB & Server Startup ──────────────────────────────────────────────────────
const PORT = process.env.CHAT_SERVICE_PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/campusolx';

async function startServer() {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        logger.info('✅ Chat Service connected to MongoDB');

        await connectRedis();
        await connectRabbitMQ();

        server.listen(PORT, () => {
            logger.info(`🚀 Chat Service & Socket.IO running on port ${PORT}`);
        });
    } catch (err) {
        logger.error(`❌ Chat Service startup failed: ${err.message}`);
        process.exit(1);
    }
}

startServer();

module.exports = app;
