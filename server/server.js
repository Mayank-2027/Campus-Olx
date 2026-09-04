const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const path = require('path');
require('dotenv').config();
const { BASE_URL, CLIENT_URL } = require('./config/urls');

// Import socket handler
const initSocket = require('./socket/index');
const { getIO } = require('./socket/index');
const { setupNotificationHandlers } = require('./notifications/eventHandlers');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const chatRoutes = require('./routes/chats');
const reportRoutes = require('./routes/reports');
const lostFoundRoutes = require('./routes/lostFound');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const publicRoutes = require('./routes/public');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Initialize socket.io
initSocket(server);

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files (temp uploads) ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Passport ────────────────────────────────────────────────────────────────
require('./middleware/passport')(passport);
app.use(passport.initialize());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', publicRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Campus OLX API is running' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// ─── MongoDB Connection & Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected successfully');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 API available at ${BASE_URL}/api`);
        });
        // Start notification event handlers (RabbitMQ subscribers + socket emit)
        await setupNotificationHandlers(getIO);
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

module.exports = app;
