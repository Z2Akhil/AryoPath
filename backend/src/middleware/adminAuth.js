import AdminSession from '../models/AdminSession.js';
import AdminActivity from '../models/AdminActivity.js';

const adminAuth = async (req, res, next) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const apiKey = req.body?.apiKey || req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required for admin access'
      });
    }

    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    const session = await AdminSession.findActiveByApiKey(apiKey);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired API key'
      });
    }

    if (!session.isValid()) {
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
