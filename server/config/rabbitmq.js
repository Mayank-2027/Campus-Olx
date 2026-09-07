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

    if (!rabbitUrl) {
        console.warn('⚠️ RABBITMQ_URL not set. Async message queue disabled.');
        return null;
    }

    try {
        connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();

        // Assert queues are durable so they survive RabbitMQ restarts
        for (const q of Object.values(QUEUES)) {
            await channel.assertQueue(q, { durable: true });
        }

        isRabbitConnected = true;
        console.log('✅ RabbitMQ connected successfully');
        console.log(`📬 Queues ready: ${Object.values(QUEUES).join(', ')}`);

        connection.on('error', (err) => {
            console.warn('⚠️ RabbitMQ connection error:', err.message);
            isRabbitConnected = false;
            channel = null;
        });

        connection.on('close', () => {
            console.warn('⚠️ RabbitMQ connection closed. Will not auto-reconnect.');
            isRabbitConnected = false;
            channel = null;
        });

        return { connection, channel };
    } catch (err) {
        console.warn('⚠️ RabbitMQ connection failed:', err.message);
        console.warn('   → Queue tasks will be handled synchronously (no async processing).');
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

