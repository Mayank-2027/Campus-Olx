/**
 * Notification Event Handlers — runs inside server.js
 *
 * This module subscribes to RabbitMQ events and:
 *   1. Saves Notification to MongoDB
 *   2. Emits `newNotification` via Socket.IO to the recipient in real-time
 *
 * This replaces the standalone notification-service for single-process deployments (Render/Vercel).
 */

const Notification = require('../models/Notification');
const Chat = require('../models/Chat');

/**
 * Setup all RabbitMQ event subscriptions.
 * Call this after MongoDB is connected and Socket.IO is initialized.
 * @param {Function} getIO - getter for the Socket.IO instance
 */
const setupNotificationHandlers = async (getIO) => {
    try {
        const { subscribeQueue } = require('../../services/shared/config/rabbitmq');
        const { connectRedis } = require('../../services/shared/config/redis');

        // Connect Redis (for cache, non-fatal if it fails)
        try {
            await connectRedis();
            console.log('[NOTIF] ⚡ Redis connected for notification handler');
        } catch (err) {
            console.warn('[NOTIF] ⚠️  Redis connection failed (non-fatal):', err.message);
        }

        const queueName = 'campus_olx_notification_queue';
        const routingKeys = ['USER_REGISTERED', 'MESSAGE_SENT', 'PRODUCT_CREATED'];

        console.log('[NOTIF] 🐇 Setting up RabbitMQ subscriptions for:', routingKeys);

        await subscribeQueue(queueName, routingKeys, async (eventData) => {
            console.log('[NOTIF] 📩 Event received:', eventData.event, '| data:', JSON.stringify(eventData.data));
            try {
                await handleEvent(eventData, getIO);
            } catch (err) {
                console.error('[NOTIF] ❌ Error handling event:', eventData.event, err.message);
            }
        });

        console.log('[NOTIF] ✅ Notification event handlers ready');
    } catch (err) {
        // Non-fatal: RabbitMQ may not be available in dev/simple Render deployments
        console.warn('[NOTIF] ⚠️  RabbitMQ not available, notifications via queue disabled:', err.message);
    }
};

/**
 * Route each event to the correct handler
 */
const handleEvent = async (eventData, getIO) => {
    switch (eventData.event) {
        case 'USER_REGISTERED':
            await handleUserRegistered(eventData.data, getIO);
            break;
        case 'MESSAGE_SENT':
            await handleMessageSent(eventData.data, getIO);
            break;
        case 'PRODUCT_CREATED':
            await handleProductCreated(eventData.data, getIO);
            break;
        default:
            console.warn('[NOTIF] Unknown event type:', eventData.event);
    }
};

/**
 * USER_REGISTERED — Welcome notification to the newly registered user
 */
const handleUserRegistered = async (data, getIO) => {
    const { userId, name } = data;
    const title = 'Welcome to Campus OLX! 🎉';
    const message = `Hi ${name}, your profile is complete. Start buying and selling on Campus OLX!`;

    const notif = await Notification.create({
        recipientId: userId,
        type: 'USER_REGISTERED',
        title,
        message,
        data
    });

    console.log('[NOTIF] ✅ USER_REGISTERED notification saved. Emitting to userId:', userId);
    emitToUser(getIO, userId, notif);
};

/**
 * MESSAGE_SENT — Notify the OTHER participant in the chat (not the sender)
 */
const handleMessageSent = async (data, getIO) => {
    const { chatId, senderId, message } = data;

    // Find the chat to get the OTHER participant
    const chat = await Chat.findById(chatId).select('participants').lean();
    if (!chat) {
        console.warn('[NOTIF] MESSAGE_SENT: Chat not found:', chatId);
        return;
    }

    // Recipient = the participant who is NOT the sender
    const recipientId = chat.participants.find(
        p => p.toString() !== senderId.toString()
    );

    if (!recipientId) {
        console.warn('[NOTIF] MESSAGE_SENT: Could not determine recipient for chat:', chatId);
        return;
    }

    const preview = message ? message.substring(0, 60) + (message.length > 60 ? '...' : '') : 'New message';
    const title = 'New Message 💬';
    const notifMessage = `You have a new message: "${preview}"`;

    const notif = await Notification.create({
        recipientId,
        type: 'MESSAGE_SENT',
        title,
        message: notifMessage,
        data
    });

    console.log('[NOTIF] ✅ MESSAGE_SENT notification saved. Emitting to recipientId:', recipientId);
    emitToUser(getIO, recipientId.toString(), notif);
};

/**
 * PRODUCT_CREATED — Broadcast to all admins (new listing alert)
 */
const handleProductCreated = async (data, getIO) => {
    const { productId, title, price, category, sellerName, sellerId } = data;

    const notifTitle = 'New Listing Created 🏷️';
    const notifMsg = `${sellerName} listed "${title}" in ${category} for ₹${price}`;

    const notif = await Notification.create({
        recipientId: sellerId || null,
        type: 'PRODUCT_CREATED',
        title: notifTitle,
        message: notifMsg,
        data
    });

    // Emit back to the seller as confirmation
    if (sellerId) {
        console.log('[NOTIF] ✅ PRODUCT_CREATED notification saved. Emitting to sellerId:', sellerId);
        emitToUser(getIO, sellerId.toString(), notif);
    }

    // Also broadcast to admins
    const io = getIO();
    if (io) {
        console.log('[NOTIF] 📢 Broadcasting new listing to admin_room');
        io.to('admin_room').emit('newNotification', {
            _id: notif._id,
            title: notifTitle,
            message: notifMsg,
            type: 'PRODUCT_CREATED',
            data,
            createdAt: notif.createdAt
        });
    }
};

/**
 * Helper: emit `newNotification` socket event to a specific user
 */
const emitToUser = (getIO, userId, notif) => {
    const io = getIO();
    if (!io) {
        console.warn('[NOTIF] emitToUser: Socket.IO not initialized yet');
        return;
    }

    // Emit directly to the user's personal room (userId as room name)
    console.log(`[NOTIF] 📢 Emitting newNotification to room "${userId}"`);
    io.to(userId.toString()).emit('newNotification', {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        data: notif.data,
        isRead: false,
        createdAt: notif.createdAt
    });
};

module.exports = { setupNotificationHandlers };
