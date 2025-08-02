import express from 'express';
import { getProfile, updateProfile, getProfileByUserId } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Endpoints for managing user profiles
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the profile
 *         userId:
 *           type: string
 *           description: The user ID this profile is linked to
 *         idNumber:
 *           type: string
 *           description: Client ID number
 *         cellphone:
 *           type: string
 *           description: Cellphone number
 *         address:
 *           type: string
 *           description: Address
 *         title:
 *           type: string
 *           enum: [Mr, Mrs, Miss, Ms, Dr]
 *           description: Title
 *         gender:
 *           type: string
 *           enum: [Male, Female]
 *           description: Gender
 *         employmentStatus:
 *           type: string
 *           enum: [Employed, Unemployed, Self-Employed, Student]
 *           description: Employment status
 *         profilePicture:
 *           type: string
 *           description: Profile picture URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Profile creation timestamp
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Retrieve the profile linked with the authenticated user
 *     description: Returns the profile information associated with the currently authenticated user.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */

/**
 * @swagger
 * /api/profile/{userId}:
 *   get:
 *     summary: Retrieve a profile by userId
 *     description: Returns the profile information associated with the given userId.
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The user ID of the profile to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found
 */

const router = express.Router();

// GET /api/profile/:userId - Get the profile by userId (public)
router.get('/:userId', getProfileByUserId);

// GET /api/profile - Get the profile linked with the authenticated user
router.get('/', protect, getProfile);

// PUT /api/profile - Update the profile linked with the authenticated user
router.put('/', protect, updateProfile);

export default router;
