import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['Credit', 'Debit'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model('Transaction', transactionSchema);
