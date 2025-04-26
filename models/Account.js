import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountType: { type: String, enum: ['Savings', 'Checking'], required: true },
  balance: { type: Number, required: true, default: 0 },
  name: { type: String, default: 'Unnamed Account' }, // Add name field with default value
  accountNumber: { type: String, unique: true, required: true }, // Add accountNumber field
  isPrimary: { type: Boolean, default: false }, // Indicates if the account is the primary account
});

export default mongoose.model('Account', accountSchema);
