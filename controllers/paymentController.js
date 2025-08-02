import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js'; // Import the Transaction model
import NotificationService from '../services/notificationService.js';
import ProofOfPaymentService from '../services/proofOfPaymentService.js';

export const makePayment = async (req, res) => {
  const { beneficiaryAccountNumber, amount, fromAccountId, reference } = req.body;

  if (!beneficiaryAccountNumber || !amount || !fromAccountId || !reference) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find the sender's account with user details
    const senderAccount = await Account.findById(fromAccountId).populate('userId');
    if (!senderAccount) {
      return res.status(404).json({ message: 'Sender account not found' });
    }

    // Check if the sender has sufficient balance
    if (senderAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Find the beneficiary's account with user details
    const beneficiaryAccount = await Account.findOne({ accountNumber: beneficiaryAccountNumber }).populate('userId');
    if (!beneficiaryAccount) {
      return res.status(404).json({ message: 'Beneficiary account not found' });
    }

    // Generate unique transaction IDs
    const debitTransactionId = ProofOfPaymentService.generateTransactionId();
    const creditTransactionId = ProofOfPaymentService.generateTransactionId();

    // Deduct the amount from the sender's account
    senderAccount.balance -= amount;
    await senderAccount.save();

    // Add the amount to the beneficiary's account
    beneficiaryAccount.balance += amount;
    await beneficiaryAccount.save();

    // Record the transaction for the sender (Debit)
    const debitTransaction = await Transaction.create({
      accountId: senderAccount._id,
      type: 'Debit',
      amount: -amount,
      reference,
      transactionId: debitTransactionId,
      status: 'Completed',
      fromAccount: senderAccount.accountNumber,
      toAccount: beneficiaryAccount.accountNumber,
      description: `Payment to ${beneficiaryAccount.accountNumber}`,
      balanceAfter: senderAccount.balance,
      fee: 0, // No fees for now
    });

    // Record the transaction for the beneficiary (Credit)
    const creditTransaction = await Transaction.create({
      accountId: beneficiaryAccount._id,
      type: 'Credit',
      amount,
      reference: `Received from ${senderAccount.accountNumber}`,
      transactionId: creditTransactionId,
      status: 'Completed',
      fromAccount: senderAccount.accountNumber,
      toAccount: beneficiaryAccount.accountNumber,
      description: `Payment received from ${senderAccount.accountNumber}`,
      balanceAfter: beneficiaryAccount.balance,
      fee: 0,
    });

    // Send notifications to both parties
    await NotificationService.sendPaymentNotifications(
      senderAccount,
      beneficiaryAccount,
      amount,
      reference
    );

    res.status(200).json({ 
      message: 'Payment successful',
      transactionDetails: {
        debitTransactionId,
        creditTransactionId,
        amount,
        senderBalance: senderAccount.balance,
        beneficiaryBalance: beneficiaryAccount.balance,
        canGenerateProof: true
      }
    });
  } catch (error) {
    console.error('Error making payment:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
