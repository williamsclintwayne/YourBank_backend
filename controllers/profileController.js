import Profile from '../models/Profile.js';
import mongoose from 'mongoose';

export const getProfile = async (req, res) => {
  try {
    let userId = req.user.userId || req.user._id; // Use userId or _id from req.user

    // Ensure userId is a string for comparison
    if (typeof userId === 'object' && userId.toString) {
      userId = userId.toString();
    }

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const {
      _id,
      userId: profileUserId,
      idNumber,
      cellphone,
      address,
      title,
      gender,
      employmentStatus,
      profilePicture,
      createdAt
    } = profile;
    res.json({
      _id,
      userId: profileUserId,
      idNumber,
      cellphone,
      address,
      title,
      gender,
      employmentStatus,
      profilePicture,
      createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { address, cellphone, employmentStatus } = req.body;

  try {
    let userId = req.user.userId || req.user._id; // Use userId or _id from req.user
    if (typeof userId === 'object' && userId.toString) {
      userId = userId.toString();
    }
    console.log('Update profile for userId:', userId);
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      console.log('Profile not found for userId:', userId);
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update profile fields
    profile.address = address || profile.address;
    profile.cellphone = cellphone || profile.cellphone;
    profile.employmentStatus = employmentStatus || profile.employmentStatus;

    await profile.save();
    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfileByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId format' });
    }

    const query = { userId: new mongoose.Types.ObjectId(userId) };

    const profile = await Profile.findOne(query);
    if (!profile) {
      // Log all userIds in the collection for debugging
      const allProfiles = await Profile.find({});
      return res.status(404).json({ message: 'Profile not found' });
    }

    const {
      _id,
      userId: profileUserId,
      idNumber,
      cellphone,
      address,
      title,
      gender,
      employmentStatus,
      profilePicture,
      createdAt
    } = profile;
    res.json({
      _id,
      userId: profileUserId,
      idNumber,
      cellphone,
      address,
      title,
      gender,
      employmentStatus,
      profilePicture,
      createdAt
    });
  } catch (error) {
    console.error('Error in getProfileByUserId:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
