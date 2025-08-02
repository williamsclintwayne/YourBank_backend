import Notification from '../models/Notification.js';
import NotificationService from '../services/notificationService.js';

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments({ userId: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      isRead: false 
    });
    
    res.status(200).json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Test notification endpoint (for development)
export const sendTestNotification = async (req, res) => {
  try {
    const { type = 'test', title, message, sendEmail = true, sendSMS = false } = req.body;
    
    const result = await NotificationService.createNotification(
      req.user.id,
      type,
      title || 'Test Notification',
      message || 'This is a test notification from YourBank.',
      { testData: true },
      sendEmail,
      sendSMS
    );
    
    res.status(200).json({
      message: 'Test notification sent',
      result
    });
  } catch (error) {
    console.error('Error sending test notification:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).select('notificationPreferences phoneNumber');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      preferences: user.notificationPreferences,
      phoneNumber: user.phoneNumber
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { email, sms, phoneNumber, carrier } = req.body;
    
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update preferences
    if (typeof email !== 'undefined') {
      user.notificationPreferences.email = email;
    }
    
    if (typeof sms !== 'undefined') {
      user.notificationPreferences.sms = sms;
    }
    
    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
    }
    
    if (carrier) {
      user.carrier = carrier; // We'll add this field to User model if needed
    }
    
    await user.save();
    
    res.status(200).json({
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences,
      phoneNumber: user.phoneNumber
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
