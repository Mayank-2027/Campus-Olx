const { getChannel, isConnected, QUEUES } = require('../config/rabbitmq');

/**
 * Publish a message to a RabbitMQ queue with non-blocking fallback
 */
const publishToQueue = async (queueName, data, fallbackFn = null) => {
    try {
        if (isConnected()) {
            const channel = getChannel();
            const message = Buffer.from(JSON.stringify(data));
            channel.sendToQueue(queueName, message, { persistent: true });
            return true;
        }
    } catch (err) {
        console.warn(`⚠️ Failed to publish to RabbitMQ queue ${queueName}:`, err.message);
    }

    // Direct synchronous/local fallback if RabbitMQ is not connected or fails
    if (typeof fallbackFn === 'function') {
        try {
            await fallbackFn(data);
        } catch (fallbackErr) {
            console.error('⚠️ Fallback execution error:', fallbackErr.message);
        }
    }
    return false;
};

/**
 * Helper to publish a notification event
 */
const publishNotification = (data, fallbackFn = null) => {
    return publishToQueue(QUEUES.NOTIFICATIONS, data, fallbackFn);
};

/**
 * Helper to publish an activity log event
 */
const publishActivityLog = (data, fallbackFn = null) => {
    return publishToQueue(QUEUES.ACTIVITY_LOGS, data, fallbackFn);
};

module.exports = {
    publishToQueue,
    publishNotification,
    publishActivityLog
};
