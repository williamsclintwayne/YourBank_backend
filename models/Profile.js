import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model
  idNumber: { type: String, required: true }, // Client ID number
  cellphone: { type: String, required: true }, // Cellphone number
  address: { type: String, required: true }, // Address
  title: { type: String, enum: ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'], required: true }, // Updated enum for Title
  gender: { type: String, enum: ['Male', 'Female'], required: true }, // Gender
  employmentStatus: { type: String, enum: ['Employed', 'Unemployed', 'Self-Employed', 'Student'], required: true }, // Updated enum for Employment Status
  profilePicture: { type: String, default: '' }, // Profile picture URL
  createdAt: { type: Date, default: Date.now }, // Timestamp for profile creation
});

export default mongoose.model('Profile', profileSchema);
