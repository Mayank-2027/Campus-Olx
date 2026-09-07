const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

const initRedis = () => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        console.warn('⚠️ REDIS_URL not set. Redis caching disabled.');
        return null;
    }

    try {
        redisClient = new Redis(redisUrl, {
            retryStrategy(times) {
                if (times > 5) {
                    console.warn('⚠️ Redis: max retries exceeded, will retry every 30s');
                    return 30000;
                }
                return Math.min(times * 500, 3000);
            },
            lazyConnect: false,        // Connect immediately on init
            enableOfflineQueue: false  // Don't queue commands when offline
        });

        redisClient.on('connect', () => {
            isRedisConnected = true;
            console.log('✅ Redis connected successfully');
        });

        redisClient.on('ready', () => {
            isRedisConnected = true;
            console.log('✅ Redis is ready');
        });

        redisClient.on('error', (err) => {
            isRedisConnected = false;
            console.warn('⚠️ Redis error:', err.message);
        });

        redisClient.on('close', () => {
            isRedisConnected = false;
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });

        return redisClient;
    } catch (err) {
        console.warn('⚠️ Could not initialize Redis client:', err.message);
        return null;
    }
};

const getRedisClient = () => redisClient;

// Use the boolean flag — avoids timing issues with .status string checks
const isConnected = () => isRedisConnected && redisClient !== null;

module.exports = {
    initRedis,
    getRedisClient,
    isConnected
};

