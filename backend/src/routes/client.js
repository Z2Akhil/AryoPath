import express from 'express';
import Test from '../models/Test.js';
import Profile from '../models/Profile.js';
import Offer from '../models/Offer.js';
import ThyrocareRefreshService from '../services/thyrocareRefreshService.js';
import axios from 'axios';

const router = express.Router();

// ThyroCare API base URL
const THYROCARE_BASE_URL = process.env.THYROCARE_API_URL || 'https://thyrocare-api.com';

/**
 * Get all products for client
 * @param {string} type - "ALL", "TESTS", "PROFILE", "OFFER"
 */
router.get('/products', async (req, res) => {
  try {
    const { type = 'ALL' } = req.query;
    const productType = type.toUpperCase();

    let products = [];

    switch (productType) {
      case 'TESTS':
        const tests = await Test.find({ isActive: true });
        products = tests.map(test => test.getCombinedData());
        break;

      case 'PROFILE':
        const profiles = await Profile.find({ isActive: true });
        products = profiles.map(profile => profile.getCombinedData());
        break;

      case 'OFFER':
        const offers = await Offer.find({ isActive: true });
        products = offers.map(offer => offer.getCombinedData());
        break;

      case 'ALL':
      default:
        const [allTests, allProfiles, allOffers] = await Promise.all([
          Test.find({ isActive: true }),
          Profile.find({ isActive: true }),
          Offer.find({ isActive: true })
        ]);

        products = [
          ...allTests.map(test => test.getCombinedData()),
          ...allProfiles.map(profile => profile.getCombinedData()),
          ...allOffers.map(offer => offer.getCombinedData())
        ];
        break;
    }

    res.json({
      success: true,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Error fetching products for client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

/**
 * Get product by code for client
 */
router.get('/products/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Try to find product in all collections
    const [test, profile, offer] = await Promise.all([
      Test.findOne({ code, isActive: true }),
      Profile.findOne({ code, isActive: true }),
      Offer.findOne({ code, isActive: true })
    ]);

    const product = test || profile || offer;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: product.getCombinedData()
    });

  } catch (error) {
    console.error('Error fetching product by code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

/**
 * Search products by name for client
 */
router.get('/products/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const searchRegex = new RegExp(query, 'i');

    const [tests, profiles, offers] = await Promise.all([
      Test.find({ 
        isActive: true,
        $or: [
          { name: searchRegex },
          { 'thyrocareData.aliasName': searchRegex },
          { 'thyrocareData.testNames': searchRegex }
        ]
      }),
      Profile.find({ 
        isActive: true,
        $or: [
          { name: searchRegex },
          { 'thyrocareData.aliasName': searchRegex },
          { 'thyrocareData.testNames': searchRegex }
        ]
      }),
      Offer.find({ 
        isActive: true,
        $or: [
          { name: searchRegex },
          { 'thyrocareData.aliasName': searchRegex },
          { 'thyrocareData.testNames': searchRegex }
        ]
      })
    ]);

    const products = [
      ...tests.map(test => test.getCombinedData()),
      ...profiles.map(profile => profile.getCombinedData()),
      ...offers.map(offer => offer.getCombinedData())
    ];

    res.json({
      success: true,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
});


/**
 * Check pincode availability - proxy to ThyroCare API
 */
router.get('/pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: 'Pincode is required'
      });
    }

    const apiKey = await ThyrocareRefreshService.getOrRefreshApiKey();

    const response = await axios.post(`${THYROCARE_BASE_URL}/api/TechsoApi/PincodeAvailability`, {
      ApiKey: apiKey,
      Pincode: pincode
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error checking pincode availability:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: 'ThyroCare API error',
        error: error.response.data
      });
    } else if (error.message.includes('No active ThyroCare session')) {
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable - no active session'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to check pincode availability',
        error: error.message
      });
    }
  }
});

/**
 * Get appointment slots - proxy to ThyroCare API
 */
router.post('/appointment-slots', async (req, res) => {
  try {
    const { pincode, date, patients, items } = req.body;

    // Validate required fields
    if (!pincode || !date || !patients || !items) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: pincode, date, patients, items'
      });
    }

    // Get active API key
    const apiKey = await ThyrocareRefreshService.getOrRefreshApiKey();

    // Prepare request for ThyroCare
    const thyrocareRequest = {
      ApiKey: apiKey,
      Pincode: pincode,
      Date: date,
      BenCount: patients.length,
      Patients: patients,
      Items: items
    };

    // Call ThyroCare API
    const response = await axios.post(`${THYROCARE_BASE_URL}/api/TechsoApi/GetAppointmentSlots`, thyrocareRequest);

    // Return ThyroCare response directly
    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error fetching appointment slots:', error);
    
    if (error.response) {
      // ThyroCare API error
      res.status(error.response.status).json({
        success: false,
        message: 'ThyroCare API error',
        error: error.response.data
      });
    } else if (error.message.includes('No active ThyroCare session')) {
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable - no active session'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch appointment slots',
        error: error.message
      });
    }
  }
});

export default router;
