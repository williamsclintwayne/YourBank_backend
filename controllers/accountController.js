import { jsPDF } from 'jspdf'; // Correct import for jsPDF in Node.js
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Profile from '../models/Profile.js'; // Import the Profile model
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Create a new account
export const createAccount = async (req, res) => {
  const { name, accountType, initialDeposit } = req.body;

  if (!name || !accountType) {
    return res.status(400).json({ message: 'Account name and type are required' });
  }

  try {
    // Create the account
    const account = await Account.create({
      userId: req.user.id,
      name,
      accountType,
      balance: initialDeposit || 0,
      accountNumber: '1' + Math.floor(100000000 + Math.random() * 900000000).toString(), // Generate unique account number
    });

    res.status(201).json(account);
  } catch (error) {
    logger.error('Error creating account:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      accountName: name,
      accountType,
      ip: req.ip
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch transactions for a specific account
export const getAccountTransactions = async (req, res) => {
  try {
    const accountId = req.params.accountId;

    // Fetch account details
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Fetch transactions for the account
    const transactions = await Transaction.find({ accountId }).sort({ date: -1 });

    res.status(200).json({
      accountName: account.name,
      accountNumber: account.accountNumber, // Include account number in the response
      balance: account.balance,
      transactions,
    });
  } catch (error) {
    logger.error('Error fetching transactions:', {
      error: error.message,
      stack: error.stack,
      accountId: req.params.accountId,
      userId: req.user?.id,
      ip: req.ip
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all accounts for a user
export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    if (!accounts) {
      return res.status(404).json({ message: 'No accounts found for this user.' });
    }
    res.status(200).json(accounts);
  } catch (error) {
    logger.error('Error fetching accounts:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ip: req.ip
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.accountId);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Prevent deletion of the Main Savings account
    if (account.isPrimary) {
      return res.status(400).json({ message: 'The Main Savings Account cannot be deleted.' });
    }

    await account.remove();
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const generateStatementPDF = async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const account = await Account.findById(accountId).populate('userId'); // Populate user details
    if (!account) {
      logger.warn(`Account not found for statement generation`, {
        accountId,
        userId: req.user?.id,
        ip: req.ip
      });
      return res.status(404).json({ message: 'Account not found' });
    }

    const profile = await Profile.findOne({ userId: account.userId._id }); // Fetch the user's profile
    if (!profile) {
      logger.warn(`Profile not found for statement generation`, {
        userId: account.userId._id,
        accountId,
        ip: req.ip
      });
      return res.status(404).json({ message: 'Profile not found' });
    }

    const transactions = await Transaction.find({ accountId }).sort({ date: -1 });
    if (!transactions.length) {
      logger.info(`No transactions found for account statement`, {
        accountId,
        userId: account.userId._id
      });
    }

    const doc = new jsPDF();

    // Add Bank Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('YourBank', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('123 Bank Street, Financial City, 10001', 105, 22, { align: 'center' });
    doc.text('Phone: +1 234 567 890 | Email: support@yourbank.com', 105, 28, { align: 'center' });

    // Add Client Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Information', 10, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${account.userId.name}`, 10, 48);
    doc.text(`Address: ${profile.address || 'N/A'}`, 10, 54); // Use address from the profile

    // Add Account Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Information', 10, 66);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Account Name: ${account.name}`, 10, 74);
    doc.text(`Account Number: ${account.accountNumber}`, 10, 80);
    doc.text(`Balance: R ${account.balance}`, 10, 86);

    // Add Transactions Table Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction History', 10, 98);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 10, 106);
    doc.text('Reference', 60, 106);
    doc.text('Amount (R)', 160, 106);

    // Add Transactions Table Rows
    doc.setFont('helvetica', 'normal');
    let y = 114;
    transactions.forEach((transaction) => {
      doc.text(new Date(transaction.date).toLocaleDateString(), 10, y);
      doc.text(transaction.reference, 60, y);
      doc.text(transaction.amount.toFixed(2), 160, y, { align: 'right' });
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    // Generate PDF Buffer
    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=BankStatement.pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    logger.error('Error generating PDF statement:', {
      error: error.message,
      stack: error.stack,
      accountId: req.params.accountId,
      userId: req.user?.id,
      ip: req.ip
    });
    res.status(500).json({ message: 'Server error while generating PDF', error: error.message });
  }
};

export const emailStatement = async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const transactions = await Transaction.find({ accountId }).sort({ date: -1 });

    const doc = new jsPDF();
    doc.text(`Bank Statement for ${account.name}`, 10, 10);
    doc.text(`Account Number: ${account.accountNumber}`, 10, 20);
    doc.text(`Balance: R ${account.balance}`, 10, 30);

    let y = 40;
    transactions.forEach((transaction) => {
      doc.text(
        `${new Date(transaction.date).toLocaleDateString()} - ${transaction.reference} - R ${transaction.amount}`,
        10,
        y
      );
      y += 10;
    });

    const pdfBuffer = doc.output('arraybuffer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject: 'Your Bank Statement',
      text: 'Please find your bank statement attached.',
      attachments: [
        {
          filename: 'BankStatement.pdf',
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    res.status(200).json({ message: 'Bank statement emailed successfully.' });
  } catch (error) {
    logger.error('Error emailing bank statement:', {
      error: error.message,
      stack: error.stack,
      accountId: req.params.accountId,
      userId: req.user?.id,
      email: req.body.email,
      ip: req.ip
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};