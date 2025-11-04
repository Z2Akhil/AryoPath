import express from 'express';
import axios from 'axios';
import adminAuth from '../../middleware/adminAuth.js';
import Profile from '../../models/Profile.js';
import AdminActivity from '../../models/AdminActivity.js';

const router = express.Router();

// GET /api/products/profiles - Fetch all PROFILE products
router.get('/', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    console.log('Fetching PROFILE products with custom pricing');

    const thyrocareApiUrl = (process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud').trim();

    // Fetch PROFILE products from ThyroCare API
    const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
      ProductType: 'PROFILE',
      ApiKey: req.adminApiKey
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('ThyroCare PROFILE products API response received');

    if (response.data.response !== 'Success') {
      throw new Error('Invalid response from ThyroCare API: ' + (response.data.response || 'No response field'));
    }

    // Extract PROFILE products
    const master = response.data.master || {};
    const thyrocareProducts = master.profile || master.PROFILE || [];
    
    console.log(`Processing ${thyrocareProducts.length} PROFILE products from ThyroCare`);

    // Sync ThyroCare products with our database and get combined data
    const combinedProducts = [];
    let processedCount = 0;
    let errorCount = 0;
    
    for (const thyrocareProduct of thyrocareProducts) {
      try {
        console.log(`Processing PROFILE product ${processedCount + 1}/${thyrocareProducts.length}:`, {
          code: thyrocareProduct.code,
          name: thyrocareProduct.name,
          type: thyrocareProduct.type
        });
        
        // Use Profile model for PROFILE products
        const product = await Profile.findOrCreateFromThyroCare(thyrocareProduct);
        
        // Get combined data for frontend
        const combinedData = product.getCombinedData();
        combinedProducts.push(combinedData);
        processedCount++;
        
        console.log(`Successfully processed PROFILE product: ${thyrocareProduct.code}`);
      } catch (error) {
        console.error(`Error processing PROFILE product ${thyrocareProduct.code}:`, error);
        console.error('Problematic PROFILE product data:', thyrocareProduct);
        errorCount++;
        // Continue with other products even if one fails
      }
    }

    console.log(`PROFILE products processing complete: ${processedCount} successful, ${errorCount} errors`);

    req.adminSession.lastProductFetch = new Date();
    await req.adminSession.save();

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'PRODUCT_FETCH',
      description: `Admin ${req.admin.name} fetched PROFILE products with custom pricing`,
      resource: 'products',
      endpoint: '/api/products/profiles',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        productType: 'PROFILE',
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
        productType: 'PROFILE',
        processedCount: processedCount,
        errorCount: errorCount
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('PROFILE products fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch PROFILE products: ${error.message}`,
      resource: 'products',
      endpoint: '/api/products/profiles',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: error.response?.status || 500,
      responseTime: responseTime,
      errorMessage: error.message,
      metadata: {
        productType: 'PROFILE',
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
        error: error.response.data?.response || 'Failed to fetch PROFILE products'
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Failed to fetch PROFILE products: Network error'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch PROFILE products: An unexpected error occurred'
      });
    }
  }
});

export default router;
