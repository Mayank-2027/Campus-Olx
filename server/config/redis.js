const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

const initRedis = () => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ REDIS_URL not provided. Redis caching disabled.');
        return null;
    }

    const url = redisUrl || 'redis://127.0.0.1:6379';

    try {
        redisClient = new Redis(url, {
            maxRetriesPerRequest: 1,
            retryStrategy(times) {
                if (times > 5) {
                    return 30000;
                }
                return Math.min(times * 500, 3000);
            },
            lazyConnect: true,
            enableOfflineQueue: false
        });

        redisClient.on('connect', () => {
            isRedisConnected = true;
            console.log('✅ Redis connected successfully');
        });

        redisClient.on('ready', () => {
            isRedisConnected = true;
        });

        redisClient.on('error', (err) => {
            isRedisConnected = false;
            if (process.env.DEBUG_REDIS === 'true') {
                console.warn('⚠️ Redis error:', err.message);
            }
        });

        redisClient.on('close', () => {
            isRedisConnected = false;
        });

        redisClient.connect().catch((err) => {
            console.warn('⚠️ Redis connection failed (cache will be bypassed):', err.message);
        });

        return redisClient;
    } catch (err) {
        console.warn('⚠️ Could not initialize Redis client:', err.message);
        return null;
    }
};

const getRedisClient = () => redisClient;
const isConnected = () => isRedisConnected && redisClient && redisClient.status === 'ready';

module.exports = {
    initRedis,
    getRedisClient,
    isConnected
};
