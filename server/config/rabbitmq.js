const amqp = require('amqplib');

let connection = null;
let channel = null;
let isRabbitConnected = false;

const QUEUES = {
    NOTIFICATIONS: 'notifications_queue',
    ACTIVITY_LOGS: 'activity_logs_queue'
};

const initRabbitMQ = async () => {
    const rabbitUrl = process.env.RABBITMQ_URL;

    if (!rabbitUrl && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ RABBITMQ_URL not provided. Async message queue disabled.');
        return null;
    }

    const url = rabbitUrl || 'amqp://127.0.0.1:5672';

    try {
        connection = await amqp.connect(url);
        channel = await connection.createChannel();

        // Assert queues are durable
        for (const q of Object.values(QUEUES)) {
            await channel.assertQueue(q, { durable: true });
        }

        isRabbitConnected = true;
        console.log('✅ RabbitMQ connected successfully');

        connection.on('error', (err) => {
            console.warn('⚠️ RabbitMQ connection error:', err.message);
            isRabbitConnected = false;
        });

        connection.on('close', () => {
            isRabbitConnected = false;
        });

        return { connection, channel };
    } catch (err) {
        console.warn('⚠️ RabbitMQ connection failed (queue tasks will run locally or bypass):', err.message);
        isRabbitConnected = false;
        return null;
    }
};

const getChannel = () => channel;
const isConnected = () => isRabbitConnected && channel !== null;

module.exports = {
    initRabbitMQ,
    getChannel,
    isConnected,
    QUEUES
};
