import express from 'express';
import axios from 'axios';
import adminAuth from '../middleware/adminAuth.js';
import Admin from '../models/Admin.js';
import AdminSession from '../models/AdminSession.js';
import AdminActivity from '../models/AdminActivity.js';

const router = express.Router();

const handleExistingSession = async (admin, existingSession, req, res, startTime, ipAddress, userAgent) => {
  const session = await AdminSession.createFromThyroCare(
    admin._id, 
    {
      apiKey: existingSession.thyrocareApiKey,
      accessToken: existingSession.thyrocareAccessToken,
      respId: existingSession.thyrocareRespId,
      response: 'Success'
    }, 
    ipAddress, 
    userAgent
  );
  
  await AdminActivity.logActivity({
    adminId: admin._id,
    sessionId: session._id,
    action: 'LOGIN',
    description: `Admin ${admin.name} logged in with cached session`,
    endpoint: '/api/admin/login',
    method: 'POST',
    ipAddress: ipAddress,
    userAgent: userAgent,
    statusCode: 200,
    responseTime: Date.now() - startTime,
    metadata: {
      userType: admin.userType,
      respId: admin.respId,
      loginType: 'CACHED_SESSION'
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
      apiKeyExpiresAt: session.apiKeyExpiresAt,
      sessionExpiresAt: session.sessionExpiresAt,
      loginType: 'CACHED_SESSION'
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
    
    // Update password in our database
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
  // Fix deprecated connection property
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

    console.log('Fetching products from ThyroCare API:', { 
      productType, 
      admin: req.admin.name,
      sessionId: req.adminSession._id 
    });

    const thyrocareApiUrl = (process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud').trim();

    const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
      ProductType: productType,
      ApiKey: req.adminApiKey
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('ThyroCare products API response:', {
      status: response.status,
      data: response.data
    });

    req.adminSession.lastProductFetch = new Date();
    await req.adminSession.save();

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'PRODUCT_FETCH',
      description: `Admin ${req.admin.name} fetched ${productType} products`,
      resource: 'products',
      endpoint: '/api/admin/products',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        productType: productType,
        productCount: response.data.master ? 
          Object.values(response.data.master).flat().length : 0
      }
    });

    res.json(response.data);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Products proxy error');

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch products: ${error.message}`,
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

export default router;
