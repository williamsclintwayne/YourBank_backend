import User from '../models/User.js';
import Profile from '../models/Profile.js'; // Import the Profile model
import Account from '../models/Account.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  const { name, email, password, idNumber, cellphone, address, title, gender, employmentStatus } = req.body;

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Create a profile for the user
    await Profile.create({
      userId: user._id,
      idNumber,
      cellphone,
      address,
      title,
      gender,
      employmentStatus,
    });

    // Create a Main Savings account for the user
    await Account.create({
      userId: user._id,
      accountType: 'Savings',
      name: 'Main Savings Account',
      balance: 0,
      accountNumber: '1' + Math.floor(100000000 + Math.random() * 900000000).toString(),
      isPrimary: true, // Mark this account as the primary account
    });

    // Generate a token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login a user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { address, cellphone, employmentStatus } = req.body;

  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update profile fields
    profile.address = address || profile.address;
    profile.cellphone = cellphone || profile.cellphone;
    profile.employmentStatus = employmentStatus || profile.employmentStatus;

    await profile.save();
    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};