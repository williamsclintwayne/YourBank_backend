import mongoose from 'mongoose';

const beneficiarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the user
  name: { type: String, required: true }, // Beneficiary name
  accountNumber: { type: String, required: true }, // Beneficiary account number
  createdAt: { type: Date, default: Date.now }, // Timestamp for when the beneficiary was added
});

export default mongoose.model('Beneficiary', beneficiarySchema);
