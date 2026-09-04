const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });

const { CLIENT_URL } = require('../../server/config/urls');
const { createLogger, getMorganMiddleware } = require('../shared/utils/logger');

const logger = createLogger('api-gateway');
const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// ─── Security & Performance Middleware ───────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
}));
app.use(compression());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Cache']
}));

// Morgan Access Logger
app.use(getMorganMiddleware('api-gateway'));

// Target Service URLs (configurable via environment variables)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:5003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';

logger.info(`Routing Topology:`);
logger.info(`  [Auth Service]         /api/auth, /api/users -> ${AUTH_SERVICE_URL}`);
logger.info(`  [Product Service]      /api/products, /api/reports, /api/lost-found, /api/admin, /api/upload -> ${PRODUCT_SERVICE_URL}`);
logger.info(`  [Chat Service]         /api/chats, /socket.io -> ${CHAT_SERVICE_URL}`);
logger.info(`  [Notification Service] /api/notifications -> ${NOTIFICATION_SERVICE_URL}`);

// Proxy options builder with pathFilter to avoid Express path stripping
const createServiceProxy = (target, pathFilter, serviceName) => {
    return createProxyMiddleware({
        target,
        pathFilter,
        changeOrigin: true,
        ws: true,
        on: {
            proxyReq: (proxyReq, req) => {
                logger.debug(`[Gateway Routing] ${req.method} ${req.originalUrl} -> ${serviceName}`);
            },
            error: (err, req, res) => {
                logger.error(`[Gateway Proxy Error] ${serviceName} target (${target}) failed: ${err.message}`);
                if (!res.headersSent) {
                    res.status(503).json({
                        success: false,
                        message: `Service ${serviceName} is temporarily unavailable`,
                        error: err.message
                    });
                }
            }
        }
    });
};

// Gateway Health Check (defined before proxies)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'api-gateway',
        services: {
            auth: AUTH_SERVICE_URL,
            product: PRODUCT_SERVICE_URL,
            chat: CHAT_SERVICE_URL,
            notification: NOTIFICATION_SERVICE_URL
        },
        timestamp: new Date()
    });
});

// ─── Route Mapping ────────────────────────────────────────────────────────────

// 1. Auth Service Routes
app.use(createServiceProxy(AUTH_SERVICE_URL, ['/api/auth', '/api/users'], 'Auth Service'));

// 2. Chat Service Routes & Socket.IO
app.use(createServiceProxy(CHAT_SERVICE_URL, ['/api/chats', '/socket.io'], 'Chat Service'));

// 3. Notification Service Routes
app.use(createServiceProxy(NOTIFICATION_SERVICE_URL, ['/api/notifications'], 'Notification Service'));

// 4. Product Service Routes (Catch-all for product, reports, admin, upload, lost-found, etc.)
app.use(createServiceProxy(PRODUCT_SERVICE_URL, [
    '/api/products',
    '/api/reports',
    '/api/lost-found',
    '/api/admin',
    '/api/upload',
    '/uploads'
], 'Product Service'));

// Fallback 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found on API Gateway' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`API Gateway Error: ${err.message}`);
    res.status(500).json({ success: false, message: 'API Gateway Internal Error' });
});

// ─── Server Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`🌐 API Gateway listening on port ${PORT}`);
});

module.exports = app;
