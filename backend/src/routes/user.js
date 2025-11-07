import express from 'express';
import auth from '../middleware/auth.js';
import {apiRateLimit} from '../middleware/rateLimit.js';
import User from '../models/User.js';
import validator from 'validator';

const router = express.Router();

router.use(apiRateLimit);
router.use(auth);

router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to your dashboard!',
    user: {
      id: req.user._id,
      mobileNumber: req.user.mobileNumber
    },
    data: {
      stats: {
        visits: 150,
        messages: 25,
        notifications: 3
      }
    }
  });
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        email: user.email,
        address: user.address,
        city: user.city,
        state: user.state,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

router.put('/profile', async (req, res) => {
  try {
    console.log('User Route: PUT /profile - Request received');
    console.log('User Route: Request body:', req.body);
    console.log('User Route: Authenticated user:', req.user ? req.user.mobileNumber : 'No user');
    
    const { firstName, lastName, email, address, city, state } = req.body;
    
    // Validate email if provided
    if (email && !validator.isEmail(email)) {
      console.log('User Route: Invalid email provided:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Validate firstName and lastName if provided
    if (firstName !== undefined && (!firstName.trim() || firstName.trim().length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'First name must be between 1 and 50 characters'
      });
    }

    if (lastName !== undefined && (!lastName.trim() || lastName.trim().length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be between 1 and 50 characters'
      });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        email: user.email,
        address: user.address,
        city: user.city,
        state: user.state,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

export default router;
