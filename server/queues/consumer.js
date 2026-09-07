const { getChannel, isConnected, QUEUES } = require('../config/rabbitmq');
const { notifyUser, notifyAdmins } = require('../socket/index');
const AdminLog = require('../models/AdminLog');

/**
 * Handle incoming notification jobs
 */
const processNotification = async (data) => {
    const { type, recipientId, event, payload, forAdmin } = data;

    if (forAdmin) {
        notifyAdmins(event || 'admin_notification', payload || data);
    } else if (recipientId) {
        notifyUser(recipientId, event || 'notification', payload || data);
    }
};

/**
 * Handle incoming activity / admin log jobs
 */
const processActivityLog = async (data) => {
    try {
        const { adminId, action, targetType, targetId, details } = data;
        if (adminId && action && targetType && targetId) {
            await AdminLog.create({
                adminId,
                action,
                targetType,
                targetId,
                details: details || ''
            });
        }
    } catch (err) {
        console.error('⚠️ Failed to save activity log in background worker:', err.message);
    }
};

/**
 * Start queue consumers
 */
const startQueueConsumers = async () => {
    if (!isConnected()) {
        return;
    }

    try {
        const channel = getChannel();

        // 1. Notifications consumer
        await channel.consume(QUEUES.NOTIFICATIONS, async (msg) => {
            if (msg !== null) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    await processNotification(data);
                    channel.ack(msg);
                } catch (err) {
                    console.error('⚠️ Error processing notification from queue:', err.message);
                    channel.nack(msg, false, false); // Don't requeue malformed messages
                }
            }
        });

        // 2. Activity logs consumer
        await channel.consume(QUEUES.ACTIVITY_LOGS, async (msg) => {
            if (msg !== null) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    await processActivityLog(data);
                    channel.ack(msg);
                } catch (err) {
                    console.error('⚠️ Error processing activity log from queue:', err.message);
                    channel.nack(msg, false, false);
                }
            }
        });

        console.log('👷 Background queue workers started');
    } catch (err) {
        console.warn('⚠️ Could not start queue consumers:', err.message);
    }
};

module.exports = {
    startQueueConsumers,
    processNotification,
    processActivityLog
};
