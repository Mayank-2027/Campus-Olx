const Redis = require('ioredis');
const { createLogger } = require('../utils/logger');
const logger = createLogger('redis');

let redisClient = null;

const getRedisClient = () => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
        
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 200, 2000);
                logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
                return delay;
            }
        });

        redisClient.on('connect', () => logger.info('⚡ Redis connected successfully'));
        redisClient.on('error', (err) => logger.error(`❌ Redis error: ${err.message}`));
    }
    return redisClient;
};

const connectRedis = async () => {
    try {
        const client = getRedisClient();
        if (client.status === 'wait') {
            await client.connect();
        }
        return client;
    } catch (err) {
        logger.error(`Failed to connect to Redis: ${err.message}`);
        return null;
    }
};

module.exports = { getRedisClient, connectRedis };
