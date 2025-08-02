import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['Credit', 'Debit'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String, required: true },
  date: { type: Date, default: Date.now },
  // Additional fields for proof of payment
  transactionId: { type: String, unique: true, required: true }, // Unique transaction ID
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Completed' },
  fromAccount: { type: String }, // Source account number
  toAccount: { type: String }, // Destination account number
  description: { type: String }, // Transaction description
  balanceAfter: { type: Number }, // Account balance after transaction
  fee: { type: Number, default: 0 }, // Transaction fee
  proofGenerated: { type: Boolean, default: false }, // Track if proof was generated
});

// Index for better query performance
transactionSchema.index({ accountId: 1, date: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ fromAccount: 1 });
transactionSchema.index({ toAccount: 1 });

export default mongoose.model('Transaction', transactionSchema);
