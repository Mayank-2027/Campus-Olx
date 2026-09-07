const { getRedisClient, isConnected } = require('../config/redis');

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Retrieve parsed JSON value from Redis
 */
const getCache = async (key) => {
    if (!isConnected()) return null;
    try {
        const client = getRedisClient();
        const data = await client.get(key);
        if (!data) return null;
        return JSON.parse(data);
    } catch (err) {
        return null;
    }
};

/**
 * Store value as JSON in Redis with expiration
 */
const setCache = async (key, value, ttlSeconds = DEFAULT_TTL) => {
    if (!isConnected()) return false;
    try {
        const client = getRedisClient();
        const stringified = JSON.stringify(value);
        await client.set(key, stringified, 'EX', ttlSeconds);
        return true;
    } catch (err) {
        return false;
    }
};

/**
 * Delete a specific key from Redis
 */
const delCache = async (key) => {
    if (!isConnected()) return false;
    try {
        const client = getRedisClient();
        await client.del(key);
        return true;
    } catch (err) {
        return false;
    }
};

/**
 * Delete all keys matching a glob pattern using SCAN
 */
const delCacheByPattern = async (pattern) => {
    if (!isConnected()) return false;
    try {
        const client = getRedisClient();
        const stream = client.scanStream({
            match: pattern,
            count: 100
        });

        const keysToDelete = [];
        stream.on('data', (keys) => {
            keysToDelete.push(...keys);
        });

        return new Promise((resolve) => {
            stream.on('end', async () => {
                if (keysToDelete.length > 0) {
                    await client.del(...keysToDelete);
                }
                resolve(true);
            });
            stream.on('error', () => {
                resolve(false);
            });
        });
    } catch (err) {
        return false;
    }
};

/**
 * Invalidate product related cache (lists, detail, and landing stats)
 */
const invalidateProductCache = async (productId = null) => {
    await delCacheByPattern('products:list:*');
    await delCache('public:stats');
    if (productId) {
        await delCache(`products:detail:${productId}`);
    }
};

/**
 * Track product view in Redis sorted set
 */
const trackProductView = async (productId) => {
    if (!isConnected() || !productId) return;
    try {
        const client = getRedisClient();
        await client.zincrby('products:views', 1, productId.toString());
    } catch (err) {
        // Silently catch error
    }
};

/**
 * Get top N popular product IDs from sorted set
 */
const getPopularProductIds = async (limit = 10) => {
    if (!isConnected()) return [];
    try {
        const client = getRedisClient();
        const productIds = await client.zrevrange('products:views', 0, limit - 1);
        return productIds;
    } catch (err) {
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
