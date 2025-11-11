import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware specifically for ThyroCare API calls
 * Prevents burst calls that could trigger WAF/Cloudflare protection
 */

// In-memory store for tracking login attempts (for more granular control)
const loginAttempts = new Map();

/**
 * Clean up old login attempts periodically
 */
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  for (const [key, attempt] of loginAttempts.entries()) {
    if (attempt.lastAttempt < fiveMinutesAgo) {
      loginAttempts.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Custom rate limiter for ThyroCare login attempts
 */
const thyrocareLoginRateLimit = (req, res, next) => {
  const identifier = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const username = req.body?.username;
  const key = username ? `${identifier}:${username}` : identifier;
  
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  // Get or create attempt record
  let attempt = loginAttempts.get(key);
  if (!attempt) {
    attempt = {
      count: 0,
      lastAttempt: now,
      blockedUntil: null
    };
    loginAttempts.set(key, attempt);
  }
  
  // Check if currently blocked
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    const remainingTime = Math.ceil((attempt.blockedUntil - now) / 1000);
    console.warn(`🚫 Rate limit blocked: ${username || 'unknown'} from ${identifier} for ${remainingTime}s`);
    
    return res.status(429).json({
      success: false,
      error: `Too many login attempts. Please try again in ${remainingTime} seconds.`,
      retryAfter: remainingTime
    });
  }
  
  // Reset count if last attempt was more than 5 minutes ago
  if (attempt.lastAttempt < fiveMinutesAgo) {
    attempt.count = 0;
    attempt.blockedUntil = null;
  }
  
  // Check rate limit
  if (attempt.count >= 3) { // Max 3 attempts per 5 minutes
    attempt.blockedUntil = now + 5 * 60 * 1000; // Block for 5 minutes
    loginAttempts.set(key, attempt);
    
    console.warn(`🚫 Rate limit exceeded: ${username || 'unknown'} from ${identifier}`);
    
    return res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again in 5 minutes.',
      retryAfter: 300
    });
  }
  
  // Increment attempt count
  attempt.count++;
  attempt.lastAttempt = now;
  loginAttempts.set(key, attempt);
  
  console.log(`📊 Rate limit: ${username || 'unknown'} attempt ${attempt.count}/3`);
  
  next();
};

/**
 * Standard rate limiter for ThyroCare API calls (using express-rate-limit)
 */
const thyrocareApiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many API requests to ThyroCare. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + username if available for more granular limiting
    const identifier = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const username = req.body?.username || req.admin?.username || 'unknown';
    return `${identifier}:${username}`;
  },
  handler: (req, res) => {
    console.warn(`🚫 API rate limit exceeded: ${req.body?.username || 'unknown'} from ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many API requests to ThyroCare. Please try again in 5 minutes.'
    });
  }
});

/**
 * Get rate limit status for debugging
 */
const getRateLimitStatus = (req, res) => {
  const identifier = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const username = req.body?.username;
  const key = username ? `${identifier}:${username}` : identifier;
  
  const attempt = loginAttempts.get(key);
  
  return res.json({
    identifier,
    username,
    rateLimitStatus: attempt ? {
      attempts: attempt.count,
      lastAttempt: attempt.lastAttempt,
      blockedUntil: attempt.blockedUntil,
      isBlocked: attempt.blockedUntil && Date.now() < attempt.blockedUntil
    } : 'No recent attempts'
  });
};

export {
  thyrocareLoginRateLimit,
  thyrocareApiRateLimit,
  getRateLimitStatus
};
