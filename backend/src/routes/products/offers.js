import express from 'express';
import axios from 'axios';
import adminAuth from '../../middleware/adminAuth.js';
import Offer from '../../models/Offer.js';
import AdminActivity from '../../models/AdminActivity.js';

const router = express.Router();

// GET /api/products/offers - Fetch all OFFER products
router.get('/', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    console.log('Fetching OFFER products with custom pricing');

    const thyrocareApiUrl = (process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud').trim();

    // Fetch OFFER products from ThyroCare API
    const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
      ProductType: 'OFFER',
      ApiKey: req.adminApiKey
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('ThyroCare OFFER products API response received');

    if (response.data.response !== 'Success') {
      throw new Error('Invalid response from ThyroCare API: ' + (response.data.response || 'No response field'));
    }

    // Extract OFFER products
    const master = response.data.master || {};
    const thyrocareProducts = master.offer || master.offers || master.OFFER || master.OFFERS || [];
    
    console.log(`Processing ${thyrocareProducts.length} OFFER products from ThyroCare`);

    // Sync ThyroCare products with our database and get combined data
    const combinedProducts = [];
    let processedCount = 0;
    let errorCount = 0;
    
    for (const thyrocareProduct of thyrocareProducts) {
      try {
        console.log(`Processing OFFER product ${processedCount + 1}/${thyrocareProducts.length}:`, {
          code: thyrocareProduct.code,
          name: thyrocareProduct.name,
          type: thyrocareProduct.type
        }); 
        
        // Use Offer model for OFFER products
        const product = await Offer.findOrCreateFromThyroCare(thyrocareProduct);
        
        // Get combined data for frontend
        const combinedData = product.getCombinedData();
        combinedProducts.push(combinedData);
        processedCount++;
        
        console.log(`Successfully processed OFFER product: ${thyrocareProduct.code}`);
      } catch (error) {
        console.error(`Error processing OFFER product ${thyrocareProduct.code}:`, error);
        console.error('Problematic OFFER product data:', thyrocareProduct);
        errorCount++;
        // Continue with other products even if one fails
      }
    }

    console.log(`OFFER products processing complete: ${processedCount} successful, ${errorCount} errors`);

    req.adminSession.lastProductFetch = new Date();
    await req.adminSession.save();

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'PRODUCT_FETCH',
      description: `Admin ${req.admin.name} fetched OFFER products with custom pricing`,
      resource: 'products',
      endpoint: '/api/products/offers',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        productType: 'OFFER',
        productCount: combinedProducts.length,
        thyrocareProductCount: thyrocareProducts.length,
        processedCount: processedCount,
        errorCount: errorCount
      }
    });

    res.json({
      success: true,
      products: combinedProducts,
      response: 'Success',
      metadata: {
        totalProducts: combinedProducts.length,
        productType: 'OFFER',
        processedCount: processedCount,
        errorCount: errorCount
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('OFFER products fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch OFFER products: ${error.message}`,
      resource: 'products',
      endpoint: '/api/products/offers',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: error.response?.status || 500,
      responseTime: responseTime,
      errorMessage: error.message,
      metadata: {
        productType: 'OFFER',
        errorType: error.response ? 'API_ERROR' : 'NETWORK_ERROR'
      }
    });

    if (error.response) {
      console.error('ThyroCare API error response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.response || 'Failed to fetch OFFER products'
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Failed to fetch OFFER products: Network error'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch OFFER products: An unexpected error occurred'
      });
    }
  }
});

export default router;
