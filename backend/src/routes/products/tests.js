import express from 'express';
import axios from 'axios';
import adminAuth from '../../middleware/adminAuth.js';
import Test from '../../models/Test.js';
import AdminActivity from '../../models/AdminActivity.js';

const router = express.Router();

// GET /api/products/tests - Fetch all TEST products
router.get('/', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    console.log('Fetching TEST products with custom pricing');

    const thyrocareApiUrl = (process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud').trim();

    // Fetch TEST products from ThyroCare API
    const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
      ProductType: 'TEST',
      ApiKey: req.adminApiKey
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('ThyroCare TEST products API response received');

    if (response.data.response !== 'Success') {
      throw new Error('Invalid response from ThyroCare API: ' + (response.data.response || 'No response field'));
    }

    // Extract TEST products
    const master = response.data.master || {};
    const thyrocareProducts = master.tests || master.TESTS || [];
    
    console.log(`Processing ${thyrocareProducts.length} TEST products from ThyroCare`);

    // Sync ThyroCare products with our database and get combined data
    const combinedProducts = [];
    let processedCount = 0;
    let errorCount = 0;
    
    for (const thyrocareProduct of thyrocareProducts) {
      try {
        console.log(`Processing TEST product ${processedCount + 1}/${thyrocareProducts.length}:`, {
          code: thyrocareProduct.code,
          name: thyrocareProduct.name,
          type: thyrocareProduct.type
        });
        
        // Use Test model for TEST products
        const product = await Test.findOrCreateFromThyroCare(thyrocareProduct);
        
        // Get combined data for frontend
        const combinedData = product.getCombinedData();
        combinedProducts.push(combinedData);
        processedCount++;
        
        console.log(`Successfully processed TEST product: ${thyrocareProduct.code}`);
      } catch (error) {
        console.error(`Error processing TEST product ${thyrocareProduct.code}:`, error);
        console.error('Problematic TEST product data:', thyrocareProduct);
        errorCount++;
        // Continue with other products even if one fails
      }
    }

    console.log(`TEST products processing complete: ${processedCount} successful, ${errorCount} errors`);

    req.adminSession.lastProductFetch = new Date();
    await req.adminSession.save();

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'PRODUCT_FETCH',
      description: `Admin ${req.admin.name} fetched TEST products with custom pricing`,
      resource: 'products',
      endpoint: '/api/products/tests',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        productType: 'TEST',
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
        productType: 'TEST',
        processedCount: processedCount,
        errorCount: errorCount
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('TEST products fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch TEST products: ${error.message}`,
      resource: 'products',
      endpoint: '/api/products/tests',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: error.response?.status || 500,
      responseTime: responseTime,
      errorMessage: error.message,
      metadata: {
        productType: 'TEST',
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
        error: error.response.data?.response || 'Failed to fetch TEST products'
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Failed to fetch TEST products: Network error'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch TEST products: An unexpected error occurred'
      });
    }
  }
});

export default router;
