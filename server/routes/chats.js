const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Product = require('../models/Product');
const { isAuthenticated, isProfileComplete } = require('../middleware/auth');
const { getIO } = require('../socket/index');

// ─── Get or create chat ────────────────────────────────────────────────────────
router.post('/start', isAuthenticated, isProfileComplete, async (req, res) => {
    try {
        const { sellerId, productId } = req.body;
        const buyerId = req.user._id.toString();

        if (buyerId === sellerId) {
            return res.status(400).json({ success: false, message: 'You cannot chat with yourself' });
        }

        // Check if chat already exists
        let chat = await Chat.findOne({
            productId,
            participants: { $all: [buyerId, sellerId] }
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [buyerId, sellerId],
                productId
            });
            // Increment chat count on product
            await Product.findByIdAndUpdate(productId, { $inc: { chatCount: 1 } });
        }

        await chat.populate([
            { path: 'participants', select: 'name profilePic isVerifiedSeller' },
            { path: 'productId', select: 'title images price status' }
        ]);

        res.json({ success: true, chat });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Get all chats for current user ───────────────────────────────────────────
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user._id })
            .populate('participants', 'name profilePic')
            .populate('productId', 'title images price status')
            .sort({ lastMessageAt: -1 });

        // Add unread count for each chat
        const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
            const unreadCount = await Message.countDocuments({
                chatId: chat._id,
                readBy: { $ne: req.user._id },
                senderId: { $ne: req.user._id }
            });
            return { ...chat.toJSON(), unreadCount };
        }));

        res.json({ success: true, chats: chatsWithUnread });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Get messages in a chat ────────────────────────────────────────────────────
router.get('/:chatId/messages', isAuthenticated, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

        // Ensure user is participant
        if (!chat.participants.includes(req.user._id.toString())) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const messages = await Message.find({ chatId: req.params.chatId })
            .populate('senderId', 'name profilePic')
            .sort({ createdAt: 1 });

        // Mark all messages as read
        await Message.updateMany(
            { chatId: req.params.chatId, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );

        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Send message ──────────────────────────────────────────────────────────────
router.post('/:chatId/messages', isAuthenticated, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message cannot be empty' });
        }

        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

        const isParticipant = chat.participants.some(
            p => p.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const newMessage = await Message.create({
            chatId: req.params.chatId,
            senderId: req.user._id,
            message: message.trim(),
            readBy: [req.user._id]
        });

        await newMessage.populate('senderId', 'name profilePic');

        // Update chat's last message
        await Chat.findByIdAndUpdate(req.params.chatId, {
            lastMessage: message.trim().substring(0, 50),
            lastMessageAt: new Date()
        });

        // Emit via socket
        const io = getIO();
        if (io) {
            io.to(`chat_${req.params.chatId}`).emit('newMessage', newMessage);
        }

        // Publish MESSAGE_SENT event to RabbitMQ for offline notification processing
        const { publishEvent } = require('../../services/shared/config/rabbitmq');
        publishEvent('MESSAGE_SENT', {
            chatId: req.params.chatId,
            senderId: req.user._id,
            messageId: newMessage._id,
            message: newMessage.message,
            timestamp: newMessage.createdAt
        }).catch(err => console.error('RabbitMQ publish error:', err));

        res.status(201).json({ success: true, message: newMessage });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
