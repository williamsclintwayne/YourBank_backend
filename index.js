/**
 * YourBank Backend API
 * 
 * LOGGING STRUCTURE:
 * =================
 * 
 * This application uses Winston for structured logging and Morgan for HTTP request logging.
 * 
 * Log Files Location: ./logs/
 * - app.log: All application logs in JSON format
 * - error.log: Error-level logs only in JSON format  
 * - exceptions.log: Uncaught exceptions
 * - rejections.log: Unhandled promise rejections
 * 
 * Log Levels: error, warn, info, http, verbose, debug, silly
 * Console Output: Colorized output for development
 * Production: Logs error, warn, info levels to files
 * Development: All levels with colors to console
 * 
 * HTTP Request Logging: Morgan 'combined' format via Winston
 * Error Handling: All unhandled errors logged with context (user, IP, etc.)
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import userRoutes from './routes/userRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import beneficiaryRoutes from './routes/beneficiaryRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();
connectDB();

const app = express();

// Logging middleware - Morgan for HTTP request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(express.json());
app.use(cors());

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'YourBank API',
      version: '1.0.0',
      description: 'API documentation for YourBank backend',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/payments', paymentRoutes);

// Global error handler - logs all unhandled errors
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('Logging configured - check logs/ directory for log files');
});
