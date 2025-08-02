import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProofOfPaymentService {
  constructor() {
    // Ensure receipts directory exists
    this.receiptsDir = path.join(process.cwd(), 'receipts');
    if (!fs.existsSync(this.receiptsDir)) {
      fs.mkdirSync(this.receiptsDir, { recursive: true });
    }
  }

  /**
   * Generate a unique transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `YB${timestamp.slice(-8)}${random}`;
  }

  /**
   * Generate QR code for transaction verification
   */
  async generateQRCode(transactionData) {
    try {
      const qrData = {
        transactionId: transactionData.transactionId,
        amount: transactionData.amount,
        date: transactionData.date,
        reference: transactionData.reference,
        verification: `https://yourbank.com/verify/${transactionData.transactionId}`
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Generate PDF proof of payment
   */
  async generatePDFProof(transactionData, senderData, recipientData) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Colors
      const primaryColor = [30, 64, 175]; // Blue
      const secondaryColor = [107, 114, 128]; // Gray
      const successColor = [5, 150, 105]; // Green

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Logo/Bank Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('YourBank', 20, 25);

      // Proof of Payment Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('PROOF OF PAYMENT', pageWidth - 20, 25, { align: 'right' });

      // Transaction Status
      doc.setFillColor(...successColor);
      doc.roundedRect(20, 50, 60, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPLETED', 50, 58.5, { align: 'center' });

      // Transaction Details Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction Details', 20, 80);

      // Transaction ID
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Transaction ID:', 20, 95);
      doc.setFont('helvetica', 'bold');
      doc.text(transactionData.transactionId, 70, 95);

      // Date and Time
      doc.setFont('helvetica', 'normal');
      doc.text('Date & Time:', 20, 105);
      doc.setFont('helvetica', 'bold');
      doc.text(this.formatDate(transactionData.date), 70, 105);

      // Reference
      doc.setFont('helvetica', 'normal');
      doc.text('Reference:', 20, 115);
      doc.setFont('helvetica', 'bold');
      doc.text(transactionData.reference, 70, 115);

      // Amount
      doc.setFont('helvetica', 'normal');
      doc.text('Amount:', 20, 125);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...successColor);
      doc.text(this.formatCurrency(transactionData.amount), 70, 125);

      // Fee (if applicable)
      if (transactionData.fee && transactionData.fee > 0) {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text('Transaction Fee:', 20, 135);
        doc.setFont('helvetica', 'bold');
        doc.text(this.formatCurrency(transactionData.fee), 70, 135);
      }

      // Sender Information
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Sender Information', 20, 155);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Name:', 20, 170);
      doc.setFont('helvetica', 'bold');
      doc.text(senderData.name, 70, 170);

      doc.setFont('helvetica', 'normal');
      doc.text('Account:', 20, 180);
      doc.setFont('helvetica', 'bold');
      doc.text(senderData.accountNumber, 70, 180);

      doc.setFont('helvetica', 'normal');
      doc.text('Account Type:', 20, 190);
      doc.setFont('helvetica', 'bold');
      doc.text(senderData.accountType, 70, 190);

      // Recipient Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recipient Information', 20, 210);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Name:', 20, 225);
      doc.setFont('helvetica', 'bold');
      doc.text(recipientData.name, 70, 225);

      doc.setFont('helvetica', 'normal');
      doc.text('Account:', 20, 235);
      doc.setFont('helvetica', 'bold');
      doc.text(recipientData.accountNumber, 70, 235);

      doc.setFont('helvetica', 'normal');
      doc.text('Account Type:', 20, 245);
      doc.setFont('helvetica', 'bold');
      doc.text(recipientData.accountType, 70, 245);

      // Generate and add QR Code
      const qrCode = await this.generateQRCode(transactionData);
      if (qrCode) {
        doc.addImage(qrCode, 'PNG', pageWidth - 60, 150, 40, 40);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...secondaryColor);
        doc.text('Scan to verify', pageWidth - 40, 200, { align: 'center' });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text('This is a computer-generated receipt and does not require a signature.', 20, pageHeight - 30);
      doc.text('For support, contact: support@yourbank.com | +27 11 123 4567', 20, pageHeight - 20);
      doc.text(`Generated on: ${this.formatDate(new Date())}`, 20, pageHeight - 10);

      // Security watermark
      doc.setGState(doc.GState({ opacity: 0.1 }));
      doc.setFontSize(40);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('YOURBANK', pageWidth / 2, pageHeight / 2, { 
        align: 'center',
        angle: 45 
      });

      return doc;
    } catch (error) {
      console.error('Error generating PDF proof:', error);
      throw new Error('Failed to generate PDF proof of payment');
    }
  }

  /**
   * Create proof of payment for a transaction
   */
  async createProofOfPayment(transactionId) {
    try {
      // Get transaction with account and user details
      const transaction = await Transaction.findOne({ transactionId })
        .populate({
          path: 'accountId',
          populate: {
            path: 'userId',
            model: 'User'
          }
        });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get sender account details
      const senderAccount = transaction.accountId;
      const senderUser = senderAccount.userId;

      // Get recipient account details (for debit transactions)
      let recipientAccount = null;
      let recipientUser = null;

      if (transaction.type === 'Debit' && transaction.toAccount) {
        recipientAccount = await Account.findOne({ accountNumber: transaction.toAccount })
          .populate('userId');
        
        if (recipientAccount) {
          recipientUser = recipientAccount.userId;
        }
      }

      // Prepare transaction data
      const transactionData = {
        transactionId: transaction.transactionId,
        amount: Math.abs(transaction.amount),
        date: transaction.date,
        reference: transaction.reference,
        type: transaction.type,
        status: transaction.status,
        fee: transaction.fee || 0
      };

      // Prepare sender data
      const senderData = {
        name: senderUser.name,
        email: senderUser.email,
        accountNumber: senderAccount.accountNumber,
        accountType: senderAccount.accountType
      };

      // Prepare recipient data
      const recipientData = recipientUser ? {
        name: recipientUser.name,
        accountNumber: recipientAccount.accountNumber,
        accountType: recipientAccount.accountType
      } : {
        name: 'External Account',
        accountNumber: transaction.toAccount || 'N/A',
        accountType: 'External'
      };

      // Generate PDF
      const pdf = await this.generatePDFProof(transactionData, senderData, recipientData);

      // Save PDF to file
      const fileName = `proof_${transactionId}_${Date.now()}.pdf`;
      const filePath = path.join(this.receiptsDir, fileName);
      
      fs.writeFileSync(filePath, pdf.output('arraybuffer'));

      // Mark proof as generated
      await Transaction.findOneAndUpdate(
        { transactionId },
        { proofGenerated: true }
      );

      return {
        success: true,
        filePath,
        fileName,
        transactionData,
        senderData,
        recipientData
      };

    } catch (error) {
      console.error('Error creating proof of payment:', error);
      throw error;
    }
  }

  /**
   * Get proof of payment as buffer
   */
  async getProofAsBuffer(transactionId) {
    try {
      const proofData = await this.createProofOfPayment(transactionId);
      const pdfBuffer = fs.readFileSync(proofData.filePath);
      
      return {
        buffer: pdfBuffer,
        fileName: proofData.fileName,
        mimeType: 'application/pdf'
      };
    } catch (error) {
      console.error('Error getting proof as buffer:', error);
      throw error;
    }
  }

  /**
   * Verify transaction proof
   */
  async verifyTransaction(transactionId) {
    try {
      const transaction = await Transaction.findOne({ transactionId })
        .populate({
          path: 'accountId',
          populate: {
            path: 'userId',
            model: 'User'
          }
        });

      if (!transaction) {
        return {
          valid: false,
          message: 'Transaction not found'
        };
      }

      return {
        valid: true,
        transaction: {
          id: transaction.transactionId,
          amount: Math.abs(transaction.amount),
          date: transaction.date,
          reference: transaction.reference,
          status: transaction.status,
          sender: transaction.accountId.userId.name,
          senderAccount: transaction.accountId.accountNumber
        }
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return {
        valid: false,
        message: 'Verification failed'
      };
    }
  }

  /**
   * Get transaction history with proof status
   */
  async getTransactionHistory(userId, page = 1, limit = 20) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's accounts
      const accounts = await Account.find({ userId }).select('_id');
      const accountIds = accounts.map(acc => acc._id);

      // Get transactions
      const transactions = await Transaction.find({ accountId: { $in: accountIds } })
        .populate('accountId')
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Transaction.countDocuments({ accountId: { $in: accountIds } });

      // Format transactions
      const formattedTransactions = transactions.map(transaction => ({
        id: transaction._id,
        transactionId: transaction.transactionId,
        type: transaction.type,
        amount: transaction.amount,
        reference: transaction.reference,
        date: transaction.date,
        status: transaction.status,
        accountNumber: transaction.accountId.accountNumber,
        proofGenerated: transaction.proofGenerated,
        canGenerateProof: transaction.status === 'Completed'
      }));

      return {
        transactions: formattedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total
        }
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Clean up old receipt files (older than 30 days)
   */
  async cleanupOldReceipts() {
    try {
      const files = fs.readdirSync(this.receiptsDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.receiptsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old receipt: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old receipts:', error);
    }
  }
}

export default new ProofOfPaymentService();
