import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createAccount, getAccounts, getAccountTransactions, generateStatementPDF, emailStatement } from '../controllers/accountController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Account management
 */

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts for the logged-in user
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               accountType:
 *                 type: string
 *               initialDeposit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/accounts/{accountId}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the account to delete
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/accounts/{accountId}:
 *   get:
 *     summary: Get account details
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account details retrieved successfully
 *       404:
 *         description: Account not found
 */

router.get('/', protect, getAccounts);

// Create a new account
router.post('/', protect, createAccount);

// Fetch transactions for a specific account
router.get('/:accountId/transactions', protect, getAccountTransactions);

router.get('/:accountId/statement/pdf', protect, generateStatementPDF);
router.post('/:accountId/statement/email', protect, emailStatement);

export default router;
