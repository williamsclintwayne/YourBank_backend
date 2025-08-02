import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendTestNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Notification CRUD operations
router.get('/', getNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

// Notification preferences
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);

// Test endpoint (for development)
router.post('/test', sendTestNotification);

export default router;
