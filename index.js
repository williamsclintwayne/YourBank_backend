import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import beneficiaryRoutes from './routes/beneficiaryRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import profileRoutes from './routes/profileRoutes.js'; // Import profileRoutes
import notificationRoutes from './routes/notificationRoutes.js'; // Import notification routes
import proofOfPaymentRoutes from './routes/proofOfPaymentRoutes.js'; // Import proof of payment routes
import startCleanupJob from './jobs/cleanupJob.js'; // Import cleanup job

dotenv.config();
connectDB();

// Start scheduled jobs
startCleanupJob();

const app = express();
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
app.use('/api/profile', profileRoutes); // Register profileRoutes
app.use('/api/notifications', notificationRoutes); // Register notification routes
app.use('/api/proof-of-payment', proofOfPaymentRoutes); // Register proof of payment routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
