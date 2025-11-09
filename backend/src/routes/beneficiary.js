import express from 'express';
import Beneficiary from '../models/Beneficiary.js';
import { optionalAuth } from '../routes/cart.js';

const router = express.Router();

// Get all beneficiaries for current user
router.get('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      // If no user (invalid token), return empty array
      return res.json({
        success: true,
        beneficiaries: []
      });
    }
    
    const beneficiaries = await Beneficiary.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      beneficiaries: beneficiaries.map(beneficiary => ({
        id: beneficiary._id.toString(),
        name: beneficiary.name,
        age: beneficiary.age,
        gender: beneficiary.gender,
        relationship: beneficiary.relationship,
        isDefault: beneficiary.isDefault,
        createdAt: beneficiary.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beneficiaries'
    });
  }
});

// Add new beneficiary
router.post('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      // If no user (invalid token), return success but don't save to database
      return res.json({
        success: true,
        message: 'Beneficiary would be saved to localStorage only'
      });
    }

    const { name, age, gender, relationship, isDefault } = req.body;

    if (!name || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Name and gender are required'
      });
    }

    const beneficiary = new Beneficiary({
      userId: req.user.id,
      name,
      age,
      gender,
      relationship: relationship || 'Self',
      isDefault: isDefault || false
    });

    await beneficiary.save();

    res.status(201).json({
      success: true,
      message: 'Beneficiary added successfully',
      beneficiary: {
        id: beneficiary._id.toString(),
        name: beneficiary.name,
        age: beneficiary.age,
        gender: beneficiary.gender,
        relationship: beneficiary.relationship,
        isDefault: beneficiary.isDefault,
        createdAt: beneficiary.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add beneficiary'
    });
  }
});

// Update beneficiary
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      // If no user (invalid token), return success but don't update database
      return res.json({
        success: true,
        message: 'Beneficiary would be updated in localStorage only'
      });
    }

    const { name, age, gender, relationship, isDefault } = req.body;
    const beneficiaryId = req.params.id;

    const beneficiary = await Beneficiary.findOne({ _id: beneficiaryId, userId: req.user.id });

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found'
      });
    }

    // Update fields
    if (name) beneficiary.name = name;
    if (age !== undefined) beneficiary.age = age;
    if (gender) beneficiary.gender = gender;
    if (relationship) beneficiary.relationship = relationship;
    if (isDefault !== undefined) beneficiary.isDefault = isDefault;

    await beneficiary.save();

    res.json({
      success: true,
      message: 'Beneficiary updated successfully',
      beneficiary: {
        id: beneficiary._id.toString(),
        name: beneficiary.name,
        age: beneficiary.age,
        gender: beneficiary.gender,
        relationship: beneficiary.relationship,
        isDefault: beneficiary.isDefault,
        createdAt: beneficiary.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update beneficiary'
    });
  }
});

// Delete beneficiary
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      // If no user (invalid token), return success but don't delete from database
      return res.json({
        success: true,
        message: 'Beneficiary would be deleted from localStorage only'
      });
    }

    const beneficiaryId = req.params.id;

    const beneficiary = await Beneficiary.findOneAndDelete({ 
      _id: beneficiaryId, 
      userId: req.user.id 
    });

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found'
      });
    }

    res.json({
      success: true,
      message: 'Beneficiary deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete beneficiary'
    });
  }
});

// Set default beneficiary
router.patch('/:id/default', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      // If no user (invalid token), return success but don't update database
      return res.json({
        success: true,
        message: 'Default beneficiary would be set in localStorage only'
      });
    }

    const beneficiaryId = req.params.id;

    const beneficiary = await Beneficiary.findOne({ _id: beneficiaryId, userId: req.user.id });

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found'
      });
    }

    // Set all beneficiaries to non-default first
    await Beneficiary.updateMany(
      { userId: req.user.id },
      { $set: { isDefault: false } }
    );

    // Set this beneficiary as default
    beneficiary.isDefault = true;
    await beneficiary.save();

    res.json({
      success: true,
      message: 'Default beneficiary set successfully',
      beneficiary: {
        id: beneficiary._id.toString(),
        name: beneficiary.name,
        age: beneficiary.age,
        gender: beneficiary.gender,
        relationship: beneficiary.relationship,
        isDefault: beneficiary.isDefault,
        createdAt: beneficiary.createdAt
      }
    });
  } catch (error) {
    console.error('Error setting default beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default beneficiary'
    });
  }
});

export default router;
