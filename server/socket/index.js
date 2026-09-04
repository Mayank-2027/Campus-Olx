const { Server } = require('socket.io');
const { CLIENT_URL } = require('../config/urls');

let io;
const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: CLIENT_URL,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('🔌 Socket connected:', socket.id);

        // User joins with their userId
        socket.on('join', (userId) => {
            if (userId) {
                onlineUsers.set(userId.toString(), socket.id);
                socket.userId = userId.toString();
                socket.join(userId.toString()); // Join personal room
                console.log(`👤 [SOCKET DEBUG] User ${userId} joined socket. SocketId: ${socket.id}. Online users: ${onlineUsers.size}`);
            }
        });

        // Join a chat room
        socket.on('joinChat', (chatId) => {
            socket.join(`chat_${chatId}`);
        });

        // Leave a chat room
        socket.on('leaveChat', (chatId) => {
            socket.leave(`chat_${chatId}`);
        });

        // New message in a chat
        socket.on('sendMessage', ({ chatId, message }) => {
            socket.to(`chat_${chatId}`).emit('newMessage', message);
        });

        // Typing indicator
        socket.on('typing', ({ chatId, userId, isTyping }) => {
            socket.to(`chat_${chatId}`).emit('userTyping', { userId, isTyping });
        });

        // Admin joins admin room for notifications
        socket.on('joinAdmin', () => {
            socket.join('admin_room');
            console.log('👑 Admin joined admin room');
        });

        // Disconnect
        socket.on('disconnect', () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                console.log(`👤 User ${socket.userId} disconnected`);
            }
        });
    });

    return io;
};

// Notify all admins of a new verification request
const notifyAdmins = (event, data) => {
    if (io) {
        console.log(`📢 [SOCKET DEBUG] notifyAdmins() called. Event: "${event}". Data:`, JSON.stringify(data));
        io.to('admin_room').emit(event, data);
    } else {
        console.warn('[SOCKET DEBUG] notifyAdmins() called but io is not initialized!');
    }
};

// Notify a specific user
const notifyUser = (userId, event, data) => {
    if (io) {
        const socketId = onlineUsers.get(userId.toString());
        console.log(`📢 [SOCKET DEBUG] notifyUser() called. UserId: ${userId}. Event: "${event}". SocketId found: ${socketId || 'NONE (user offline)'}. Online users map:`, [...onlineUsers.entries()]);
        if (socketId) {
            console.log(`✅ [SOCKET DEBUG] Emitting "${event}" to socketId ${socketId}`);
            io.to(socketId).emit(event, data);
        } else {
            console.warn(`⚠️ [SOCKET DEBUG] User ${userId} is NOT in onlineUsers map. Notification NOT delivered.`);
        }
    } else {
        console.warn('[SOCKET DEBUG] notifyUser() called but io is not initialized!');
    }
};

const getIO = () => io;

module.exports = initSocket;
module.exports.notifyAdmins = notifyAdmins;
module.exports.notifyUser = notifyUser;
module.exports.getIO = getIO;
module.exports.onlineUsers = onlineUsers;
