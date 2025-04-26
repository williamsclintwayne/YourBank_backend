import Beneficiary from '../models/Beneficiary.js';

// Get all beneficiaries for the logged-in user
export const getBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ userId: req.user.id });
    res.status(200).json(beneficiaries);
  } catch (error) {
    console.error('Error fetching beneficiaries:', error.message);
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
    console.error('Error adding beneficiary:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
