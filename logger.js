// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

// Custom log format
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Determine the log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Create Winston logger
const logger = createLogger({
  level: logLevel, // Set log level based on environment
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat
      )
    }),
    // Uncomment below to log to a file in production
    // new transports.File({ filename: 'combined.log' })
  ],
  exceptionHandlers: [
    new transports.Console(),
    // new transports.File({ filename: 'exceptions.log' })
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;
