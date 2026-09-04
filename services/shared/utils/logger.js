const winston = require('winston');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels & colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Winston format definition
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `[${info.timestamp}] [${info.service || 'campus-olx'}] [${info.level.toUpperCase()}]: ${info.message}`
    )
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        (info) => `[${info.timestamp}] [${info.service || 'service'}] ${info.level}: ${info.message}`
    )
);

const createLogger = (serviceName = 'campus-olx') => {
    const transports = [
        new winston.transports.Console({
            format: consoleFormat
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format
        })
    ];

    const logger = winston.createLogger({
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        levels,
        defaultMeta: { service: serviceName },
        transports,
    });

    return logger;
};

// Morgan HTTP Access Logger stream setup
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });

const getMorganMiddleware = (serviceName = 'campus-olx') => {
    const logger = createLogger(serviceName);
    return morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms', {
        stream: {
            write: (message) => {
                const trimmedMsg = message.trim();
                logger.http(trimmedMsg);
                accessLogStream.write(`[${new Date().toISOString()}] [${serviceName}] ${trimmedMsg}\n`);
            }
        }
    });
};

module.exports = { createLogger, getMorganMiddleware };
