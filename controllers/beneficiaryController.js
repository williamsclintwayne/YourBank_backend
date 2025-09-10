import Beneficiary from '../models/Beneficiary.js';
import logger from '../utils/logger.js';

// Get all beneficiaries for the logged-in user
export const getBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ userId: req.user.id });
    res.status(200).json(beneficiaries);
  } catch (error) {
    logger.error('Error fetching beneficiaries:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ip: req.ip
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new beneficiary
export const addBeneficiary = async (req, res) => {
  const { name, accountNumber } = req.body;

  if (!name || !accountNumber) {
    return res.status(400).json({ message: 'Name and account number are required' });
  }

  try {
    const beneficiary = await Beneficiary.create({
      userId: req.user.id,
      name,
      accountNumber,
    });
    res.status(201).json(beneficiary);
  } catch (error) {
    logger.error('Error adding beneficiary:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      beneficiaryName: name,
      accountNumber,
      ip: req.ip
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
