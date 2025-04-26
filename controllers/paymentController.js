import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js'; // Import the Transaction model

export const makePayment = async (req, res) => {
  const { beneficiaryAccountNumber, amount, fromAccountId, reference } = req.body;

  if (!beneficiaryAccountNumber || !amount || !fromAccountId || !reference) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find the sender's account
    const senderAccount = await Account.findById(fromAccountId);
    if (!senderAccount) {
      return res.status(404).json({ message: 'Sender account not found' });
    }

    // Check if the sender has sufficient balance
    if (senderAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Find the beneficiary's account
    const beneficiaryAccount = await Account.findOne({ accountNumber: beneficiaryAccountNumber });
    if (!beneficiaryAccount) {
      return res.status(404).json({ message: 'Beneficiary account not found' });
    }

    // Deduct the amount from the sender's account
    senderAccount.balance -= amount;
    await senderAccount.save();

    // Add the amount to the beneficiary's account
    beneficiaryAccount.balance += amount;
    await beneficiaryAccount.save();

    // Record the transaction for the sender
    await Transaction.create({
      accountId: senderAccount._id,
      type: 'Debit',
      amount: -amount,
      reference,
    });

    // Record the transaction for the beneficiary
    await Transaction.create({
      accountId: beneficiaryAccount._id,
      type: 'Credit',
      amount,
      reference: `Received from ${senderAccount.accountNumber}`,
    });

    res.status(200).json({ message: 'Payment successful' });
  } catch (error) {
    console.error('Error making payment:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
