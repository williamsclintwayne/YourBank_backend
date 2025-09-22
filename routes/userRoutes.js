import express from 'express';
<<<<<<< Updated upstream
import { registerUser, loginUser } from '../controllers/userController.js';
=======
import { registerUser, loginUser, updateProfile, getProfile, getProfileByUserId } from '../controllers/userController.js';
>>>>>>> Stashed changes
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get the profile of the logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.post('/register', registerUser);
router.post('/login', loginUser);

<<<<<<< Updated upstream
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user; // `protect` middleware attaches the user to the request
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ userId: user });
  } catch (error) {
    console.error('Error in /profile route:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
=======
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get the profile of the logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/profile', protect, getProfile);

// Get a user's profile by userId
/**
 * @swagger
 * /api/users/{userId}/profile:
 *   get:
 *     summary: Get a user's profile by userId
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's Mongo ObjectId
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       400:
 *         description: Invalid userId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/:userId/profile',getProfileByUserId);
>>>>>>> Stashed changes

export default router;
