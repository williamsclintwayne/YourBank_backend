import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { makePayment } from '../controllers/paymentController.js';

const router = express.Router();

// Make a payment
router.post('/', protect, makePayment);

export default router;
