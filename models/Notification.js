import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['payment_sent', 'payment_received', 'account_created', 'low_balance', 'login_alert'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  sentViaEmail: { type: Boolean, default: false },
  sentViaSMS: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed }, // Additional data like transaction details
  createdAt: { type: Date, default: Date.now },
});

// Index for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
