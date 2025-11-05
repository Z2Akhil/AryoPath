import express from 'express';
import Test from '../models/Test.js';
import Profile from '../models/Profile.js';
import Offer from '../models/Offer.js';

const router = express.Router();

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

export default router;
