const { getRedisClient } = require('../config/redis');
const { createLogger } = require('./logger');
const logger = createLogger('cache-utility');

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get value from Redis cache by key
 */
const getCache = async (key) => {
    try {
        const client = getRedisClient();
        const data = await client.get(key);
        if (!data) return null;
        logger.debug(`Cache HIT for key: ${key}`);
        return JSON.parse(data);
    } catch (err) {
        logger.error(`Error reading cache key ${key}: ${err.message}`);
        return null;
    }
};

/**
 * Set value in Redis cache with TTL
 */
const setCache = async (key, value, ttlSeconds = DEFAULT_TTL) => {
    try {
        const client = getRedisClient();
        const stringified = JSON.stringify(value);
        await client.set(key, stringified, 'EX', ttlSeconds);
        logger.debug(`Cache SET for key: ${key} (TTL: ${ttlSeconds}s)`);
        return true;
    } catch (err) {
        logger.error(`Error setting cache key ${key}: ${err.message}`);
        return false;
    }
};

/**
 * Delete a specific key from Redis cache
 */
const delCache = async (key) => {
    try {
        const client = getRedisClient();
        await client.del(key);
        logger.debug(`Cache DEL for key: ${key}`);
        return true;
    } catch (err) {
        logger.error(`Error deleting cache key ${key}: ${err.message}`);
        return false;
    }
};

/**
 * Delete keys matching pattern using SCAN
 */
const delCacheByPattern = async (pattern) => {
    try {
        const client = getRedisClient();
        let stream = client.scanStream({
            match: pattern,
            count: 100
        });

        let keysToDelete = [];
        stream.on('data', (resultKeys) => {
            keysToDelete.push(...resultKeys);
        });

        return new Promise((resolve) => {
            stream.on('end', async () => {
                if (keysToDelete.length > 0) {
                    await client.del(...keysToDelete);
                    logger.info(`Invalidated ${keysToDelete.length} cache keys matching pattern: ${pattern}`);
                }
                resolve(true);
            });
        });
    } catch (err) {
        logger.error(`Error deleting cache pattern ${pattern}: ${err.message}`);
        return false;
    }
};

/**
 * Invalidate product related cache (lists and specific product detail)
 */
const invalidateProductCache = async (productId = null) => {
    logger.info(`Invalidating product cache${productId ? ` for ID: ${productId}` : ''}`);
    await delCacheByPattern('products:list:*');
    if (productId) {
        await delCache(`products:detail:${productId}`);
    }
    await delCache('products:popular');
};

/**
 * Track product view in Redis sorted set and update total view count
 */
const trackProductView = async (productId) => {
    try {
        const client = getRedisClient();
        // Increment score in sorted set of popular products
        await client.zincrby('products:views', 1, productId.toString());
        logger.debug(`Tracked view for product: ${productId}`);
    } catch (err) {
        logger.error(`Error tracking product view for ${productId}: ${err.message}`);
    }
};

/**
 * Get top N frequently viewed product IDs
 */
const getPopularProductIds = async (limit = 10) => {
    try {
        const client = getRedisClient();
        // Get product IDs ordered by view count descending
        const productIds = await client.zrevrange('products:views', 0, limit - 1);
        return productIds;
    } catch (err) {
        logger.error(`Error getting popular product IDs: ${err.message}`);
        return [];
    }
};

module.exports = {
    getCache,
    setCache,
    delCache,
    delCacheByPattern,
    invalidateProductCache,
    trackProductView,
    getPopularProductIds
};
