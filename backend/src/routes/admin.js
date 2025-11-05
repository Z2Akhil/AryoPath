import express from 'express';
import axios from 'axios';
import adminAuth from '../middleware/adminAuth.js';
import Admin from '../models/Admin.js';
import AdminSession from '../models/AdminSession.js';
import AdminActivity from '../models/AdminActivity.js';
import Test from '../models/Test.js';
import Profile from '../models/Profile.js';
import Offer from '../models/Offer.js';

const router = express.Router();

const handleExistingSession = async (admin, existingSession, req, res, startTime, ipAddress, userAgent) => {
  console.log('🔄 Reusing existing session:', {
    sessionId: existingSession._id,
    apiKey: existingSession.thyrocareApiKey.substring(0, 10) + '...',
    admin: admin.name
  });
  
  if (existingSession.isApiKeyExpired()) {
    return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, req.body.username, req.body.password);
  }

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + istOffset);
  const sessionCreatedIST = new Date(existingSession.createdAt.getTime() + istOffset);
  
  const hasCrossedMidnight = nowIST.getDate() !== sessionCreatedIST.getDate() || 
                            nowIST.getMonth() !== sessionCreatedIST.getMonth() || 
                            nowIST.getFullYear() !== sessionCreatedIST.getFullYear();
  
  if (hasCrossedMidnight) {
    console.log('❌ ThyroCare API key has expired (crossed midnight), forcing fresh ThyroCare API call');
    console.log('Session created IST:', sessionCreatedIST);
    console.log('Current time IST:', nowIST);
    return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, req.body.username, req.body.password);
  }

  await existingSession.refreshUsage();
  
  
  await AdminActivity.logActivity({
    adminId: admin._id,
    sessionId: existingSession._id,
    action: 'LOGIN',
    description: `Admin ${admin.name} logged in with refreshed session`,
    endpoint: '/api/admin/login',
    method: 'POST',
    ipAddress: ipAddress,
    userAgent: userAgent,
    statusCode: 200,
    responseTime: Date.now() - startTime,
    metadata: {
      userType: admin.userType,
      respId: admin.respId,
      loginType: 'REFRESHED_SESSION'
    }
  });

  return res.json({
    success: true,
    apiKey: existingSession.thyrocareApiKey,
    accessToken: existingSession.thyrocareAccessToken,
    respId: existingSession.thyrocareRespId,
    response: 'Success',
    adminProfile: {
      name: admin.name,
      email: admin.email,
      mobile: admin.mobile,
      userType: admin.userType,
      role: admin.role,
      lastLogin: admin.lastLogin,
      loginCount: admin.loginCount,
      status: admin.status ? 'Active' : 'Inactive',
      accountCreated: admin.createdAt,
      thyrocareUserId: admin.thyrocareUserId,
      respId: admin.respId,
      verKey: admin.verKey,
      isPrepaid: admin.isPrepaid,
      trackingPrivilege: admin.trackingPrivilege,
      otpAccess: admin.otpAccess
    },
    sessionInfo: {
      apiKeyExpiresAt: existingSession.apiKeyExpiresAt,
      sessionExpiresAt: existingSession.sessionExpiresAt,
      loginType: 'REFRESHED_SESSION'
    }
  });
};

const handleThyroCareLogin = async (req, res, startTime, ipAddress, userAgent, username, password) => {
  const thyrocareApiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';
  
  console.log('Making ThyroCare API call for login...');
  const response = await axios.post(`${thyrocareApiUrl}/api/Login/Login`, {
    username,
    password,
    portalType: 'DSAPortal',
    userType: 'DSA'
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log('ThyroCare API response:', {
    status: response.status,
    data: response.data
  });

  if (response.data.response === 'Success' && response.data.apiKey) {
    const thyrocareData = response.data;
    
    const admin = await Admin.findOrCreateFromThyroCare(thyrocareData, username);
    
    await admin.updatePassword(password);
    
    const session = await AdminSession.createFromThyroCare(
      admin._id, 
      thyrocareData, 
      ipAddress, 
      userAgent
    );
    
    await AdminActivity.logActivity({
      adminId: admin._id,
      sessionId: session._id,
      action: 'LOGIN',
      description: `Admin ${admin.name} logged in with fresh ThyroCare API call`,
      endpoint: '/api/admin/login',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        userType: thyrocareData.userType,
        respId: thyrocareData.respId,
        loginType: 'FRESH_THYROCARE'
      }
    });

    return res.json({
      success: true,
      apiKey: thyrocareData.apiKey,
      accessToken: thyrocareData.accessToken,
      respId: thyrocareData.respId,
      response: thyrocareData.response,
      adminProfile: {
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        userType: admin.userType,
        role: admin.role,
        lastLogin: admin.lastLogin,
        loginCount: admin.loginCount,
        status: admin.status ? 'Active' : 'Inactive',
        accountCreated: admin.createdAt,
        thyrocareUserId: admin.thyrocareUserId,
        respId: admin.respId,
        verKey: admin.verKey,
        isPrepaid: admin.isPrepaid,
        trackingPrivilege: admin.trackingPrivilege,
        otpAccess: admin.otpAccess
      },
      sessionInfo: {
        apiKeyExpiresAt: session.apiKeyExpiresAt,
        sessionExpiresAt: session.sessionExpiresAt,
        loginType: 'FRESH_THYROCARE'
      }
    });
  } else {
    return res.status(400).json({
      success: false,
      error: response.data.response || 'Login failed: Invalid credentials'
    });
  }
};

router.post('/login', async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { username, password } = req.body;

    console.log('Received admin login request:', { username, ipAddress });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Step 1: Check if admin exists in our database
    const existingAdmin = await Admin.findByUsername(username);
    
    if (existingAdmin && existingAdmin.password) {
      // Step 2: Verify password against stored hash
      const isPasswordValid = await existingAdmin.verifyPassword(password);
      
      if (isPasswordValid) {
        // Step 3: Check for active sessions with same IP and valid API key
        const sameIpSession = await AdminSession.findOne({
          adminId: existingAdmin._id,
          ipAddress: ipAddress,
          isActive: true,
          apiKeyExpiresAt: { $gt: new Date() }
        });

        if (sameIpSession) {
          console.log('Reusing existing session for same IP');
          return await handleExistingSession(existingAdmin, sameIpSession, req, res, startTime, ipAddress, userAgent);
        }

        // Step 4: Check for active sessions with different IP
        const differentIpSession = await AdminSession.findOne({
          adminId: existingAdmin._id,
          ipAddress: { $ne: ipAddress },
          isActive: true,
          apiKeyExpiresAt: { $gt: new Date() }
        });

        if (differentIpSession) {
          console.log('Different IP detected, forcing fresh ThyroCare API call');
          // Different IP - force fresh ThyroCare call for security
          return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, username, password);
        }

        // Step 5: No active sessions found, check for any expired sessions we can reuse
        const expiredSession = await AdminSession.findOne({
          adminId: existingAdmin._id,
          isActive: true
        }).sort({ apiKeyExpiresAt: -1 });

        if (expiredSession && expiredSession.isApiKeyExpired()) {
          console.log('All sessions expired, forcing fresh ThyroCare API call');
          return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, username, password);
        }
      }
    }

    // Step 6: Fallback to original ThyroCare API call
    console.log('No cached session available, making fresh ThyroCare API call');
    return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, username, password);

  } catch (error) {
    console.error('Admin login proxy error:', error);

    if (error.response) {
      console.error('ThyroCare API error response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.response || error.response.data?.message || 'Login failed: Invalid credentials'
      });
    } else if (error.request) {
      return res.status(503).json({
        success: false,
        error: 'Login failed: Network error. Please check your connection.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Login failed: An unexpected error occurred.'
      });
    }
  }
});

// Product endpoint - fetches from Thyrocare API and combines with our database
router.post('/products', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { productType } = req.body;

    if (!productType) {
      return res.status(400).json({
        success: false,
        error: 'Product type is required'
      });
    }

    console.log('Fetching products with custom pricing from Thyrocare API and database');

    const thyrocareApiUrl = (process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud').trim();

    // Step 1: Fetch products from ThyroCare API
    const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
      ProductType: productType,
      ApiKey: req.adminApiKey
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('ThyroCare products API response received');

    if (response.data.response !== 'Success') {
      throw new Error('Invalid response from ThyroCare API: ' + (response.data.response || 'No response field'));
    }

    // Step 2: Extract products based on type
    let thyrocareProducts = [];
    const master = response.data.master || {};
    
    switch (productType.toUpperCase()) {
      case 'OFFER':
        thyrocareProducts = master.offer || master.offers || master.OFFER || master.OFFERS || [];
        console.log(`OFFER products count: ${thyrocareProducts.length} items`);
        break;
      case 'TEST':
        thyrocareProducts = master.tests || master.TESTS || [];
        console.log(`TEST products: ${thyrocareProducts.length} items`);
        break;
      case 'PROFILE':
        thyrocareProducts = master.profile || master.PROFILE || [];
        console.log(`PROFILE products: ${thyrocareProducts.length} items`);
        break;
      case 'ALL':
        thyrocareProducts = [
          ...(master.offer || master.offers || master.OFFER || master.OFFERS || []),
          ...(master.tests || master.TESTS || []),
          ...(master.profile || master.PROFILE || [])
        ];
        console.log(`ALL products: ${thyrocareProducts.length} items`);
        break;
      default:
        thyrocareProducts = [];
        console.log(`Unknown product type: ${productType}`);
    }

    console.log(`Processing ${thyrocareProducts.length} products from ThyroCare`);

    // Step 3: Sync ThyroCare products with our database and get combined data
    const combinedProducts = [];
    let processedCount = 0;
    let errorCount = 0;
    
    for (const thyrocareProduct of thyrocareProducts) {
      try {
        console.log(`Processing product ${processedCount + 1}/${thyrocareProducts.length}:`, {
          code: thyrocareProduct.code,
          name: thyrocareProduct.name,
          type: thyrocareProduct.type
        });
        
        let product;
        
        // Use the appropriate model based on product type
        switch (thyrocareProduct.type?.toUpperCase()) {
          case 'TEST':
            product = await Test.findOrCreateFromThyroCare(thyrocareProduct);
            break;
          case 'PROFILE':
            product = await Profile.findOrCreateFromThyroCare(thyrocareProduct);
            break;
          case 'POP':
            product = await Profile.findOrCreateFromThyroCare(thyrocareProduct);
            break;
          case 'OFFER':
            product = await Offer.findOrCreateFromThyroCare(thyrocareProduct);
            break;
          default:
            console.warn(`Unknown product type: ${thyrocareProduct.type}, defaulting to Test model`);
            product = await Test.findOrCreateFromThyroCare(thyrocareProduct);
        }
        
        // Get combined data for frontend
        const combinedData = product.getCombinedData();
        combinedProducts.push(combinedData);
        processedCount++;
        
        console.log(`Successfully processed product: ${thyrocareProduct.code}`);
      } catch (error) {
        console.error(`Error processing product ${thyrocareProduct.code}:`, error);
        console.error('Problematic product data:', thyrocareProduct);
        errorCount++;
        // Continue with other products even if one fails
      }
    }

    console.log(`Processing complete: ${processedCount} successful, ${errorCount} errors`);

    req.adminSession.lastProductFetch = new Date();
    await req.adminSession.save();

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'PRODUCT_FETCH',
      description: `Admin ${req.admin.name} fetched ${productType} products with custom pricing`,
      resource: 'products',
      endpoint: '/api/admin/products',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        productType: productType,
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
        productType: productType,
        processedCount: processedCount,
        errorCount: errorCount
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Enhanced products proxy error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch products with custom pricing: ${error.message}`,
      resource: 'products',
      endpoint: '/api/admin/products',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: error.response?.status || 500,
      responseTime: responseTime,
      errorMessage: error.message,
      metadata: {
        productType: req.body.productType,
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
        error: error.response.data?.response || 'Failed to fetch products'
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Failed to fetch products: Network error'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products: An unexpected error occurred'
      });
    }
  }
});

// New endpoint to update custom pricing
router.put('/products/pricing', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { code, discount } = req.body;

    if (!code || discount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Product code and discount are required'
      });
    }

    console.log('Updating custom pricing:', { 
      code, 
      discount,
      admin: req.admin.name,
      sessionId: req.adminSession._id 
    });

    // Update custom pricing in database - try each model to find the product
    let updatedProduct;
    let found = false;
    
    // Try Test model first
    try {
      updatedProduct = await Test.updateCustomPricing(code, discount);
      found = true;
    } catch (error) {
      // Product not found in Test model, continue to next model
    }
    
    // Try Profile model if not found
    if (!found) {
      try {
        updatedProduct = await Profile.updateCustomPricing(code, discount);
        found = true;
      } catch (error) {
        // Product not found in Profile model, continue to next model
      }
    }
    
    // Try Offer model if not found
    if (!found) {
      try {
        updatedProduct = await Offer.updateCustomPricing(code, discount);
        found = true;
      } catch (error) {
        // Product not found in any model
        throw new Error('Product not found');
      }
    }

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'PRICING_UPDATE',
      description: `Admin ${req.admin.name} updated pricing for product ${code}`,
      resource: 'products',
      endpoint: '/api/admin/products/pricing',
      method: 'PUT',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        productCode: code,
        discount: discount,
        sellingPrice: updatedProduct.sellingPrice
      }
    });

    res.json({
      success: true,
      product: updatedProduct,
      message: 'Pricing updated successfully'
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Pricing update error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to update pricing: ${error.message}`,
      resource: 'products',
      endpoint: '/api/admin/products/pricing',
      method: 'PUT',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message,
      metadata: {
        productCode: req.body.code,
        discount: req.body.discount
      }
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update pricing'
    });
  }
});

export default router;
