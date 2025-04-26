import { jsPDF } from 'jspdf'; // Correct import for jsPDF in Node.js
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Profile from '../models/Profile.js'; // Import the Profile model
import nodemailer from 'nodemailer';

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
    console.error('Error creating account:', error.message);
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
    console.error('Error fetching transactions:', error.message);
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
    console.error('Error fetching accounts:', error.message);
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
    // Define Color Palette
    const COLOR_PRIMARY_ACCENT_MINT = '#A8E6CF'; // Not used directly in this version, but defined
    const COLOR_SECONDARY_ACCENT_TEAL = '#2D7A8A';
    const COLOR_TERTIARY_ACCENT_PEACH = '#FFD3B6'; // Not used directly in this version, but defined
    const COLOR_TEXT_DARK_CHARCOAL = '#333333';
    const COLOR_TEXT_MEDIUM_GREY = '#666666';
    const COLOR_WHITE = '#FFFFFF'; // jsPDF default background

    const accountId = req.params.accountId;
    const account = await Account.findById(accountId).populate('userId'); // Populate user details
    if (!account) {
      console.error(`Account not found for ID: ${accountId}`);
      return res.status(404).json({ message: 'Account not found' });
    }

    const profile = await Profile.findOne({ userId: account.userId._id }); // Fetch the user's profile
    if (!profile) {
      console.error(`Profile not found for user ID: ${account.userId._id}`);
      return res.status(404).json({ message: 'Profile not found' });
    }

    const transactions = await Transaction.find({ accountId }).sort({ date: -1 });
    if (!transactions.length) {
      console.error(`No transactions found for account ID: ${accountId}`);
      // Consider if you want to send an empty statement or an error
    }

    const doc = new jsPDF();
    doc.setFont('helvetica'); // Set default font

    // Add Bank Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL); // Deep Teal
    doc.text('YourBank', 105, 15, { align: 'center' });
    doc.setFontSize(10); // Smaller size for address
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_MEDIUM_GREY); // Medium Grey
    doc.text('123 Bank Street, Financial City, 10001', 105, 22, { align: 'center' });
    doc.text('Phone: +1 234 567 890 | Email: support@yourbank.com', 105, 28, { align: 'center' });

    // Reset text color for subsequent sections
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal

    // Add Client Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL); // Deep Teal
    doc.text('Client Information', 10, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal
    doc.text(`Name: ${account.userId.name}`, 10, 48);
    doc.text(`Address: ${profile.address || 'N/A'}`, 10, 54); // Use address from the profile

    // Add Account Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL); // Deep Teal
    doc.text('Account Information', 10, 66);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal
    doc.text(`Account Name: ${account.name}`, 10, 74);
    doc.text(`Account Number: ${account.accountNumber}`, 10, 80);
    doc.text(`Balance: R ${account.balance.toFixed(2)}`, 10, 86); // Ensure balance is formatted

    // Add Transactions Table Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL); // Deep Teal
    doc.text('Transaction History', 10, 98);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal for table headers
    // Optional: Add a light background fill for the header row
    // doc.setFillColor(247, 249, 250); // Light Grey #F7F9FA
    // doc.rect(10, 100, 190, 8, 'F'); // Draw background rectangle
    doc.text('Date', 10, 106);
    doc.text('Reference', 60, 106);
    doc.text('Amount (R)', 190, 106, { align: 'right' }); // Align amount right

    // Add Transactions Table Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL); // Dark Charcoal for table data
    let y = 114;
    transactions.forEach((transaction, index) => {
      // Optional: Alternate row background color
      // if (index % 2 === 0) {
      //   doc.setFillColor(255, 255, 255); // White
      // } else {
      //   doc.setFillColor(247, 249, 250); // Light Grey #F7F9FA
      // }
      // doc.rect(10, y - 5, 190, 8, 'F'); // Draw background rectangle for row

      doc.text(new Date(transaction.date).toLocaleDateString(), 10, y);
      doc.text(transaction.reference || 'N/A', 60, y, { maxWidth: 100 }); // Add max width for long refs
      doc.text(transaction.amount.toFixed(2), 190, y, { align: 'right' }); // Align amount right
      y += 8;
      if (y > 280) { // Check for page break
        doc.addPage();
        y = 20; // Reset y position for new page
        // Optional: Redraw headers on new page
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
        doc.text('Date', 10, y);
        doc.text('Reference', 60, y);
        doc.text('Amount (R)', 190, y, { align: 'right' });
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
      }
    });

    // Generate PDF Buffer
    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=BankStatement.pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Error generating PDF:', error.message, error.stack);
    res.status(500).json({ message: 'Server error while generating PDF', error: error.message });
  }
};

export const emailStatement = async (req, res) => {
  try {
    // Define Color Palette (same as generateStatementPDF)
    const COLOR_SECONDARY_ACCENT_TEAL = '#2D7A8A';
    const COLOR_TEXT_DARK_CHARCOAL = '#333333';
    const COLOR_TEXT_MEDIUM_GREY = '#666666';

    const accountId = req.params.accountId;
    // Populate user details to get name and potentially email (though email comes from req.user)
    // Also populate profile to get address
    const account = await Account.findById(accountId).populate('userId');
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const profile = await Profile.findOne({ userId: account.userId._id });
    // Handle case where profile might not exist yet
    const userAddress = profile ? profile.address : 'N/A';

    const transactions = await Transaction.find({ accountId }).sort({ date: -1 });

    // --- PDF Generation with Styling (mirrors generateStatementPDF) ---
    const doc = new jsPDF();
    doc.setFont('helvetica'); // Set default font

    // Add Bank Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL);
    doc.text('YourBank', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_MEDIUM_GREY);
    doc.text('123 Bank Street, Financial City, 10001', 105, 22, { align: 'center' });
    doc.text('Phone: +1 234 567 890 | Email: support@yourbank.com', 105, 28, { align: 'center' });

    // Reset text color
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);

    // Add Client Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL);
    doc.text('Client Information', 10, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
    doc.text(`Name: ${account.userId.name}`, 10, 48);
    doc.text(`Address: ${userAddress}`, 10, 54);

    // Add Account Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL);
    doc.text('Account Information', 10, 66);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
    doc.text(`Account Name: ${account.name}`, 10, 74);
    doc.text(`Account Number: ${account.accountNumber}`, 10, 80);
    doc.text(`Balance: R ${account.balance.toFixed(2)}`, 10, 86);

    // Add Transactions Table Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SECONDARY_ACCENT_TEAL);
    doc.text('Transaction History', 10, 98);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
    doc.text('Date', 10, 106);
    doc.text('Reference', 60, 106);
    doc.text('Amount (R)', 190, 106, { align: 'right' });

    // Add Transactions Table Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
    let y = 114;
    transactions.forEach((transaction) => {
      doc.text(new Date(transaction.date).toLocaleDateString(), 10, y);
      doc.text(transaction.reference || 'N/A', 60, y, { maxWidth: 100 });
      doc.text(transaction.amount.toFixed(2), 190, y, { align: 'right' });
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
        // Redraw headers on new page
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
        doc.text('Date', 10, y);
        doc.text('Reference', 60, y);
        doc.text('Amount (R)', 190, y, { align: 'right' });
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLOR_TEXT_DARK_CHARCOAL);
      }
    });
    // --- End PDF Generation ---

    const pdfBuffer = doc.output('arraybuffer');

    // Ensure email configuration is present
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials are not configured in environment variables.');
      return res.status(500).json({ message: 'Email service not configured.' });
    }
    if (!req.user || !req.user.email) {
      console.error('User email not found in request.');
      return res.status(400).json({ message: 'User email not available.' });
    }


    const transporter = nodemailer.createTransport({
      // Consider using a more robust email service for production
      service: 'gmail', // Or another service like SendGrid, Mailgun
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"YourBank" <${process.env.EMAIL_USER}>`, // Use a display name
      to: req.user.email, // Send to the logged-in user's email
      subject: `Your Bank Statement for Account ${account.accountNumber}`, // More specific subject
      text: `Dear ${account.userId.name},\n\nPlease find your bank statement for account ${account.name} (${account.accountNumber}) attached.\n\nRegards,\nYourBank`, // Improved text body
      attachments: [
        {
          filename: `BankStatement_${account.accountNumber}_${new Date().toISOString().split('T')[0]}.pdf`, // More specific filename
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf'
        },
      ],
    });

    res.status(200).json({ message: 'Bank statement emailed successfully.' });
  } catch (error) {
    console.error('Error emailing statement:', error.message, error.stack); // Log stack trace
    res.status(500).json({ message: 'Server error while emailing statement', error: error.message });
  }
};