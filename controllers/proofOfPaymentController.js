import ProofOfPaymentService from '../services/proofOfPaymentService.js';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';

// Generate proof of payment for a specific transaction
export const generateProof = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    // Verify transaction belongs to user
    const transaction = await Transaction.findOne({ transactionId })
      .populate('accountId');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user owns this transaction
    if (transaction.accountId.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate proof of payment
    const proofData = await ProofOfPaymentService.createProofOfPayment(transactionId);

    res.status(200).json({
      message: 'Proof of payment generated successfully',
      transactionId,
      fileName: proofData.fileName,
      downloadUrl: `/api/proof-of-payment/download/${transactionId}`
    });

  } catch (error) {
    console.error('Error generating proof:', error.message);
    res.status(500).json({ 
      message: 'Failed to generate proof of payment', 
      error: error.message 
    });
  }
};

// Download proof of payment PDF
export const downloadProof = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    // Verify transaction belongs to user
    const transaction = await Transaction.findOne({ transactionId })
      .populate('accountId');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user owns this transaction
    if (transaction.accountId.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get proof as buffer
    const proofBuffer = await ProofOfPaymentService.getProofAsBuffer(transactionId);

    // Set response headers for PDF download
    res.setHeader('Content-Type', proofBuffer.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${proofBuffer.fileName}"`);
    res.setHeader('Content-Length', proofBuffer.buffer.length);

    // Send PDF buffer
    res.send(proofBuffer.buffer);

  } catch (error) {
    console.error('Error downloading proof:', error.message);
    res.status(500).json({ 
      message: 'Failed to download proof of payment', 
      error: error.message 
    });
  }
};

// View proof of payment in browser
export const viewProof = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    // Verify transaction belongs to user
    const transaction = await Transaction.findOne({ transactionId })
      .populate('accountId');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user owns this transaction
    if (transaction.accountId.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get proof as buffer
    const proofBuffer = await ProofOfPaymentService.getProofAsBuffer(transactionId);

    // Set response headers for PDF viewing
    res.setHeader('Content-Type', proofBuffer.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${proofBuffer.fileName}"`);
    res.setHeader('Content-Length', proofBuffer.buffer.length);

    // Send PDF buffer
    res.send(proofBuffer.buffer);

  } catch (error) {
    console.error('Error viewing proof:', error.message);
    res.status(500).json({ 
      message: 'Failed to view proof of payment', 
      error: error.message 
    });
  }
};

// Get transaction history with proof status
export const getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const history = await ProofOfPaymentService.getTransactionHistory(
      req.user.id, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json(history);

  } catch (error) {
    console.error('Error getting transaction history:', error.message);
    res.status(500).json({ 
      message: 'Failed to get transaction history', 
      error: error.message 
    });
  }
};

// Verify transaction (public endpoint for QR code verification)
export const verifyTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const verification = await ProofOfPaymentService.verifyTransaction(transactionId);

    res.status(200).json(verification);

  } catch (error) {
    console.error('Error verifying transaction:', error.message);
    res.status(500).json({ 
      message: 'Failed to verify transaction', 
      error: error.message 
    });
  }
};

// Get proof status for a transaction
export const getProofStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    // Verify transaction belongs to user
    const transaction = await Transaction.findOne({ transactionId })
      .populate('accountId');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user owns this transaction
    if (transaction.accountId.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      transactionId,
      proofGenerated: transaction.proofGenerated,
      canGenerateProof: transaction.status === 'Completed',
      status: transaction.status,
      amount: Math.abs(transaction.amount),
      date: transaction.date,
      reference: transaction.reference
    });

  } catch (error) {
    console.error('Error getting proof status:', error.message);
    res.status(500).json({ 
      message: 'Failed to get proof status', 
      error: error.message 
    });
  }
};

// Bulk generate proofs for multiple transactions
export const bulkGenerateProofs = async (req, res) => {
  try {
    const { transactionIds } = req.body;
    
    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({ message: 'Transaction IDs array is required' });
    }

    if (transactionIds.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 transactions allowed per bulk request' });
    }

    const results = [];

    for (const transactionId of transactionIds) {
      try {
        // Verify transaction belongs to user
        const transaction = await Transaction.findOne({ transactionId })
          .populate('accountId');
        
        if (!transaction || transaction.accountId.userId.toString() !== req.user.id) {
          results.push({
            transactionId,
            success: false,
            error: 'Transaction not found or access denied'
          });
          continue;
        }

        // Generate proof
        const proofData = await ProofOfPaymentService.createProofOfPayment(transactionId);
        
        results.push({
          transactionId,
          success: true,
          fileName: proofData.fileName,
          downloadUrl: `/api/proof-of-payment/download/${transactionId}`
        });

      } catch (error) {
        results.push({
          transactionId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      message: `Bulk generation completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: transactionIds.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error in bulk proof generation:', error.message);
    res.status(500).json({ 
      message: 'Failed to bulk generate proofs', 
      error: error.message 
    });
  }
};
