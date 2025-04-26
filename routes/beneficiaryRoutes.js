import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getBeneficiaries, addBeneficiary } from '../controllers/beneficiaryController.js';

const router = express.Router();

// Get all beneficiaries for the logged-in user
router.get('/', protect, getBeneficiaries);

// Add a new beneficiary
router.post('/', protect, addBeneficiary);

export default router;
