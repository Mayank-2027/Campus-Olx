const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });

const { CLIENT_URL } = require('../../server/config/urls');
const { createLogger, getMorganMiddleware } = require('../shared/utils/logger');
const { connectRedis } = require('../shared/config/redis');
const { subscribeQueue } = require('../shared/config/rabbitmq');
const Notification = require('../../server/models/Notification');

const logger = createLogger('notification-service');
const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(getMorganMiddleware('notification-service'));

// ─── Nodemailer Transporter Setup ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER || 'campusolx_demo',
        pass: process.env.SMTP_PASS || 'demo_pass'
    }
});

const sendEmail = async (to, subject, text, html) => {
    try {
        if (!process.env.SMTP_USER) {
            logger.info(`📧 [MOCK EMAIL DISPATCH] To: ${to} | Subject: "${subject}" | Content: "${text}"`);
            return true;
        }
        await transporter.sendMail({
            from: '"Campus OLX Notifications" <no-reply@campusolx.com>',
            to,
            subject,
            text,
            html
        });
        logger.info(`📧 Email sent successfully to ${to}`);
        return true;
    } catch (err) {
        logger.error(`Failed to send email to ${to}: ${err.message}`);
        return false;
    }
};

// ─── Event Handlers ───────────────────────────────────────────────────────────
const handleUserRegistered = async (eventData) => {
    const { userId, name, email, enrollmentNo } = eventData.data;
    logger.info(`Processing USER_REGISTERED event for User: ${name} (${email})`);

    const title = 'Welcome to Campus OLX!';
    const message = `Hi ${name}, welcome to Campus OLX! Your enrollment ${enrollmentNo} is verified.`;

    await Notification.create({
        recipientId: userId,
        type: 'USER_REGISTERED',
        title,
        message,
        data: eventData.data
    });

    if (email) {
        await sendEmail(email, title, message, `<h2>${title}</h2><p>${message}</p>`);
    }
};

const handleMessageSent = async (eventData) => {
    const { chatId, senderId, message } = eventData.data;
    logger.info(`Processing MESSAGE_SENT event for Chat: ${chatId}`);

    await Notification.create({
        type: 'MESSAGE_SENT',
        title: 'New Chat Message Received',
        message: `You have a new message: "${message.substring(0, 40)}..."`,
        data: eventData.data
    });
};

const handleProductCreated = async (eventData) => {
    const { productId, title, price, category, sellerName } = eventData.data;
    logger.info(`Processing PRODUCT_CREATED event for Product: "${title}" by ${sellerName}`);

    const notifTitle = 'New Product Listed on Campus OLX!';
    const notifMsg = `${sellerName} listed a new ${category} item: "${title}" for ₹${price}.`;

    await Notification.create({
        type: 'PRODUCT_CREATED',
        title: notifTitle,
        message: notifMsg,
        data: eventData.data
    });
};

const setupEventSubscriptions = async () => {
    const queueName = 'notification_service_queue';
    const routingKeys = ['USER_REGISTERED', 'MESSAGE_SENT', 'PRODUCT_CREATED'];

    console.log('[NOTIF DEBUG] Setting up RabbitMQ queue subscriptions for:', routingKeys);

    await subscribeQueue(queueName, routingKeys, async (eventData) => {
        console.log('[NOTIF DEBUG] 📩 RabbitMQ message received! Event:', eventData.event, '| Data:', JSON.stringify(eventData.data));
        switch (eventData.event) {
            case 'USER_REGISTERED':
                await handleUserRegistered(eventData);
                break;
            case 'MESSAGE_SENT':
                await handleMessageSent(eventData);
                break;
            case 'PRODUCT_CREATED':
                await handleProductCreated(eventData);
                break;
            default:
                logger.warn(`Unknown event type received: ${eventData.event}`);
        }
        console.log('[NOTIF DEBUG] ✅ Event processed:', eventData.event);
    });
};

// ─── Notification API Routes ──────────────────────────────────────────────────
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, count: notifications.length, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'notification-service', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Notification Service Error: ${err.message}`);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Notification Service Error' });
});

// ─── DB & Server Startup ──────────────────────────────────────────────────────
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 5004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusolx';

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info('✅ Notification Service connected to MongoDB');

        await connectRedis();
        await setupEventSubscriptions();

        app.listen(PORT, () => {
            logger.info(`🚀 Notification Service running on port ${PORT}`);
        });
    } catch (err) {
        logger.error(`❌ Notification Service startup failed: ${err.message}`);
        process.exit(1);
    }
}

startServer();

module.exports = app;
