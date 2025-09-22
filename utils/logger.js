import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Winston Logger Configuration
 * 
 * Logs are written to:
 * - Console: Colorized output for development
 * - File: logs/app.log in JSON format for production analysis
 * 
 * Log Levels: error, warn, info, http, verbose, debug, silly
 * Production logs: error, warn, info
 * Development logs: all levels with colors
 */

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'yourbank-backend' },
  transports: [
    // Write all logs to console with colors
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Write all logs to app.log file in JSON format
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'app.log'),
      format: logFormat
    }),
    
    // Write error logs to error.log file
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
      format: logFormat
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'exceptions.log'),
      format: logFormat
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'rejections.log'),
      format: logFormat
    })
  ]
});

export default logger;