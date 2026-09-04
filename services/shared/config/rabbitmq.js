const amqp = require('amqplib');
const { createLogger } = require('../utils/logger');
const logger = createLogger('rabbitmq');

const EXCHANGE_NAME = 'campus_olx_events';
const EXCHANGE_TYPE = 'topic';

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
    if (channel) return channel;

    const rabbitUrl = process.env.RABBITMQ_URL || `amqp://${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}`;

    let retries = 5;
    while (retries > 0) {
        try {
            logger.info(`Connecting to RabbitMQ at ${rabbitUrl}...`);
            connection = await amqp.connect(rabbitUrl);
            channel = await connection.createChannel();
            
            // Declare Topic Exchange
            await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
            
            logger.info('🐇 RabbitMQ connected and Exchange asserted successfully');

            connection.on('error', (err) => {
                logger.error(`RabbitMQ connection error: ${err.message}`);
                channel = null;
                connection = null;
            });

            connection.on('close', () => {
                logger.warn('RabbitMQ connection closed');
                channel = null;
                connection = null;
            });

            return channel;
        } catch (err) {
            retries--;
            logger.warn(`RabbitMQ connection failed: ${err.message}. Retries left: ${retries}`);
            if (retries === 0) {
                logger.error('Failed to connect to RabbitMQ after maximum retries');
                return null;
            }
            await new Promise(res => setTimeout(res, 3000));
        }
    }
};

/**
 * Publish an event to the RabbitMQ exchange
 * @param {string} routingKey - Event key e.g. USER_REGISTERED, MESSAGE_SENT, PRODUCT_CREATED
 * @param {object} data - Event payload data
 */
const publishEvent = async (routingKey, data) => {
    try {
        const ch = await connectRabbitMQ();
        if (!ch) {
            logger.warn(`Skipping event publish [${routingKey}]: RabbitMQ channel not available`);
            return false;
        }

        const messageBuffer = Buffer.from(JSON.stringify({
            event: routingKey,
            data,
            timestamp: new Date().toISOString()
        }));

        ch.publish(EXCHANGE_NAME, routingKey, messageBuffer, { persistent: true });
        logger.info(`📤 Event Published -> RoutingKey: [${routingKey}]`);
        return true;
    } catch (err) {
        logger.error(`Error publishing event [${routingKey}]: ${err.message}`);
        return false;
    }
};

/**
 * Subscribe a queue to specific routing keys on the RabbitMQ exchange
 * @param {string} queueName - Name of the durable queue
 * @param {Array<string>} routingKeys - List of routing keys to bind e.g. ['USER_REGISTERED', 'MESSAGE_SENT', 'PRODUCT_CREATED']
 * @param {Function} handler - Callback function (eventData, rawMessage)
 */
const subscribeQueue = async (queueName, routingKeys = [], handler) => {
    try {
        const ch = await connectRabbitMQ();
        if (!ch) {
            logger.error(`Cannot subscribe queue [${queueName}]: RabbitMQ channel unavailable`);
            return false;
        }

        // Assert durable queue
        await ch.assertQueue(queueName, { durable: true });

        // Bind queue to exchange for each routing key
        for (const key of routingKeys) {
            await ch.bindQueue(queueName, EXCHANGE_NAME, key);
            logger.info(`Bound Queue [${queueName}] to RoutingKey [${key}]`);
        }

        ch.prefetch(1); // Fair dispatch
        logger.info(`📥 Listening for messages on Queue [${queueName}]...`);

        ch.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    const parsed = JSON.parse(msg.content.toString());
                    logger.info(`📩 Message Received on Queue [${queueName}] -> Event: [${parsed.event}]`);
                    await handler(parsed, msg);
                    ch.ack(msg);
                } catch (handlerErr) {
                    logger.error(`Error processing queue message [${queueName}]: ${handlerErr.message}`);
                    ch.nack(msg, false, false); // Don't requue malformed messages
                }
            }
        });

        return true;
    } catch (err) {
        logger.error(`Error subscribing queue [${queueName}]: ${err.message}`);
        return false;
    }
};

module.exports = {
    connectRabbitMQ,
    publishEvent,
    subscribeQueue,
    EXCHANGE_NAME
};
