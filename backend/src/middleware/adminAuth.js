import AdminSession from '../models/AdminSession.js';
import AdminActivity from '../models/AdminActivity.js';

const adminAuth = async (req, res, next) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const apiKey = req.body?.apiKey || req.headers['x-api-key'];
    
    console.log('Admin auth middleware checking API key:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      endpoint: req.path,
      method: req.method
    });
    
    if (!apiKey) {
      console.log('No API key provided in request');
      return res.status(401).json({
        success: false,
        error: 'API key is required for admin access'
      });
    }

    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      console.log('Invalid API key format:', apiKey);
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    const session = await AdminSession.findActiveByApiKey(apiKey);
    
    if (!session) {
      console.log('No active session found for API key:', apiKey.substring(0, 10) + '...');
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired API key'
      });
    }

    if (!session.isValid()) {
      console.log('Session is not valid:', {
        isActive: session.isActive,
        isApiKeyExpired: session.isApiKeyExpired(),
        isAccessTokenExpired: session.isAccessTokenExpired(),
        isSessionExpired: session.isSessionExpired()
      });
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please login again.'
      });
    }

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

    console.log('Admin authentication successful:', {
      admin: session.adminId.name,
      apiKey: apiKey.substring(0, 10) + '...',
      endpoint: req.path
    });
    
    next();
    
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

export default adminAuth;
