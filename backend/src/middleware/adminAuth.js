import AdminSession from '../models/AdminSession.js';
import AdminActivity from '../models/AdminActivity.js';
import ThyrocareRefreshService from '../services/thyrocareRefreshService.js';

const adminAuth = async (req, res, next) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  const currentTime = new Date();

  try {
    const apiKey = req.body?.apiKey || req.headers['x-api-key'];
    
    console.log('🔐 ADMIN AUTH - STARTING VALIDATION:', {
      timestamp: currentTime.toISOString(),
      endpoint: req.path,
      method: req.method,
      ipAddress: ipAddress,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
    });
    
    if (!apiKey) {
      console.log('❌ ADMIN AUTH - No API key provided in request');
      return res.status(401).json({
        success: false,
        error: 'API key is required for admin access'
      });
    }

    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      console.log('❌ ADMIN AUTH - Invalid API key format:', apiKey);
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    console.log('🔍 ADMIN AUTH - Looking up session in database...');
    const session = await AdminSession.findActiveByApiKey(apiKey);
    
    if (!session) {
      console.log('❌ ADMIN AUTH - No active session found for API key:', apiKey.substring(0, 10) + '...');
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired API key'
      });
    }

    console.log('✅ ADMIN AUTH - Session found, validating tokens...');
    
    // Enhanced validation logging
    const validationDetails = {
      isActive: session.isActive,
      isApiKeyExpired: session.isApiKeyExpired(),
      isAccessTokenExpired: session.isAccessTokenExpired(),
      isSessionExpired: session.isSessionExpired(),
      currentTime: currentTime.toISOString(),
      apiKeyExpiresAt: session.apiKeyExpiresAt?.toISOString(),
      accessTokenExpiresAt: session.accessTokenExpiresAt?.toISOString(),
      sessionExpiresAt: session.sessionExpiresAt?.toISOString()
    };

    console.log('📊 ADMIN AUTH - VALIDATION DETAILS:', validationDetails);

    if (!session.isValid()) {
      console.log('🔄 ADMIN AUTH - Session expired, attempting automatic refresh...');
      
      try {
        // Try to automatically refresh the API key
        const newApiKey = await ThyrocareRefreshService.getOrRefreshApiKey();
        
        console.log('✅ ADMIN AUTH - Automatic refresh successful, updating request with new API key');
        
        // Update the request with the new API key
        req.adminSession = await AdminSession.findActiveByApiKey(newApiKey);
        req.admin = req.adminSession.adminId;
        req.adminApiKey = newApiKey;
        
        // Add the new API key to the response headers for the admin
        res.set('X-New-Api-Key', newApiKey);
        
        console.log('✅ ADMIN AUTH - Session refreshed automatically:', {
          admin: req.adminSession.adminId.name,
          newApiKey: newApiKey.substring(0, 10) + '...'
        });
        
      } catch (refreshError) {
        console.error('❌ ADMIN AUTH - Automatic refresh failed:', refreshError);
        return res.status(401).json({
          success: false,
          error: 'Session expired and automatic refresh failed. Please login again.'
        });
      }
    }

    console.log('✅ ADMIN AUTH - All tokens valid, refreshing session usage...');
    await session.refreshUsage();

    req.adminSession = session;
    req.admin = session.adminId;
    req.adminApiKey = apiKey;

    await AdminActivity.logActivity({
      adminId: session.adminId._id,
      sessionId: session._id,
      action: 'API_CALL',
      description: `Admin ${session.adminId.name} accessed ${req.path}`,
      endpoint: req.path,
      method: req.method,
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        userType: session.adminId.userType,
        resource: req.path.split('/').pop()
      }
    });

    console.log('✅ ADMIN AUTH - SUCCESS:', {
      admin: session.adminId.name,
      apiKey: apiKey.substring(0, 10) + '...',
      endpoint: req.path,
      responseTime: Date.now() - startTime + 'ms'
    });
    
    next();
    
  } catch (error) {
    console.error('❌ ADMIN AUTH - ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

export default adminAuth;
