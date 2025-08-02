import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateProof,
  downloadProof,
  viewProof,
  getTransactionHistory,
  verifyTransaction,
  getProofStatus,
  bulkGenerateProofs
} from '../controllers/proofOfPaymentController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProofOfPayment:
 *       type: object
 *       properties:
 *         transactionId:
 *           type: string
 *           description: Unique transaction identifier
 *         fileName:
 *           type: string
 *           description: Generated PDF file name
 *         downloadUrl:
 *           type: string
 *           description: URL to download the proof
 */

/**
 * @swagger
 * /api/proof-of-payment/generate/{transactionId}:
 *   post:
 *     summary: Generate proof of payment for a transaction
 *     tags: [Proof of Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Proof generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProofOfPayment'
 *       404:
 *         description: Transaction not found
 *       403:
 *         description: Access denied
 */
router.post('/generate/:transactionId', protect, generateProof);

/**
 * @swagger
 * /api/proof-of-payment/download/{transactionId}:
 *   get:
 *     summary: Download proof of payment PDF
 *     tags: [Proof of Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Transaction not found
 *       403:
 *         description: Access denied
 */
router.get('/download/:transactionId', protect, downloadProof);

/**
 * @swagger
 * /api/proof-of-payment/view/{transactionId}:
 *   get:
 *     summary: View proof of payment PDF in browser
 *     tags: [Proof of Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: PDF file for viewing
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Transaction not found
 *       403:
 *         description: Access denied
 */
router.get('/view/:transactionId', protect, viewProof);

/**
 * @swagger
 * /api/proof-of-payment/history:
 *   get:
 *     summary: Get transaction history with proof status
 *     tags: [Proof of Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/history', protect, getTransactionHistory);

/**
 * @swagger
 * /api/proof-of-payment/status/{transactionId}:
 *   get:
 *     summary: Get proof status for a transaction
 *     tags: [Proof of Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Proof status retrieved successfully
 *       404:
 *         description: Transaction not found
 *       403:
 *         description: Access denied
 */
router.get('/status/:transactionId', protect, getProofStatus);

/**
 * @swagger
 * /api/proof-of-payment/bulk-generate:
 *   post:
 *     summary: Bulk generate proofs for multiple transactions
 *     tags: [Proof of Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 description: Array of transaction IDs (max 10)
 *     responses:
 *       200:
 *         description: Bulk generation completed
 *       400:
 *         description: Invalid request data
 */
router.post('/bulk-generate', protect, bulkGenerateProofs);

/**
 * @swagger
 * /api/proof-of-payment/verify/{transactionId}:
 *   get:
 *     summary: Verify transaction (public endpoint for QR code verification)
 *     tags: [Proof of Payment]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction verification result
 *       404:
 *         description: Transaction not found
 */
router.get('/verify/:transactionId', verifyTransaction); // Public endpoint

export default router;
