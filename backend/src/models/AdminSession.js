import mongoose from 'mongoose';

const adminSessionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  thyrocareApiKey: {
    type: String,
    required: true
  },
  thyrocareAccessToken: {
    type: String,
    required: true
  },
  thyrocareRespId: {
    type: String,
    required: true
  },
  
  sessionToken: {
    type: String,
    unique: true,
    sparse: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  
  apiKeyExpiresAt: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
  },
  accessTokenExpiresAt: {
    type: Date,
    required: true
  },
  sessionExpiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  },
  
  requestCount: {
    type: Number,
    default: 0
  },
  lastProductFetch: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

adminSessionSchema.index({ adminId: 1 });
adminSessionSchema.index({ thyrocareApiKey: 1 });
adminSessionSchema.index({ apiKeyExpiresAt: 1 });
adminSessionSchema.index({ sessionExpiresAt: 1 });
adminSessionSchema.index({ isActive: 1 });

adminSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

adminSessionSchema.statics.createFromThyroCare = async function(adminId, thyrocareData, ipAddress, userAgent = '') {
  try {
    // Set both API key and session to expire at 00:00 IST
    const apiKeyExpiresAt = new Date();
    apiKeyExpiresAt.setDate(apiKeyExpiresAt.getDate() + 1);
    apiKeyExpiresAt.setHours(0, 0, 0, 0); // 00:00 IST
    
    const accessTokenExpiresAt = new Date(thyrocareData.exp * 1000 || Date.now() + 3600000); // 1 hour default
    
    // Align session expiry with API key expiry (00:00 IST)
    const sessionExpiresAt = new Date(apiKeyExpiresAt);
    
    const session = new this({
      adminId: adminId,
      thyrocareApiKey: thyrocareData.apiKey,
      thyrocareAccessToken: thyrocareData.accessToken,
      thyrocareRespId: thyrocareData.respId,
      ipAddress: ipAddress,
      userAgent: userAgent,
      apiKeyExpiresAt: apiKeyExpiresAt,
      accessTokenExpiresAt: accessTokenExpiresAt,
      sessionExpiresAt: sessionExpiresAt, // Same as API key expiry
      isActive: true
    });

    console.log('🆕 Creating new session with aligned expiry:', {
      adminId: adminId,
      apiKey: thyrocareData.apiKey.substring(0, 10) + '...',
      apiKeyExpiresAt: apiKeyExpiresAt.toISOString(),
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      sessionExpiresAt: sessionExpiresAt.toISOString()
    });

    await session.save();
    
    console.log('✅ Session created successfully:', {
      sessionId: session._id,
      apiKey: session.thyrocareApiKey.substring(0, 10) + '...'
    });
    
    return session;
  } catch (error) {
    console.error('❌ Error creating session:', error);
    throw error;
  }
};

// Method to check if API key is expired
adminSessionSchema.methods.isApiKeyExpired = function() {
  return new Date() > this.apiKeyExpiresAt;
};

// Method to check if access token is expired
adminSessionSchema.methods.isAccessTokenExpired = function() {
  return new Date() > this.accessTokenExpiresAt;
};

// Method to check if session is expired
adminSessionSchema.methods.isSessionExpired = function() {
  return new Date() > this.sessionExpiresAt;
};

// Method to check if session is valid
// Only validates API key and session expiry - access token expiry handled separately
adminSessionSchema.methods.isValid = function() {
  return this.isActive && 
         !this.isApiKeyExpired() && 
         !this.isSessionExpired();
};

// Method to refresh session usage
adminSessionSchema.methods.refreshUsage = async function() {
  this.lastUsedAt = new Date();
  this.requestCount += 1;
  await this.save();
};

// Static method to find active session by API key
adminSessionSchema.statics.findActiveByApiKey = async function(apiKey) {
  const currentTime = new Date();
  
  console.log('🔍 ADMIN SESSION - LOOKUP STARTED:', {
    apiKeyPrefix: apiKey.substring(0, 10) + '...',
    currentTime: currentTime.toISOString(),
    query: { 
      thyrocareApiKey: apiKey,
      isActive: true  // Only look for active sessions
    }
  });
  
  // Find the most recent ACTIVE session with this API key
  const activeSession = await this.findOne({ 
    thyrocareApiKey: apiKey,
    isActive: true 
  })
  .sort({ createdAt: -1 }) // Get the most recent session
  .populate('adminId');
  
  if (!activeSession) {
    console.log('❌ ADMIN SESSION - No ACTIVE session found for this API key');
    
    // Check if there are any inactive sessions for debugging
    const inactiveSession = await this.findOne({ thyrocareApiKey: apiKey, isActive: false })
      .sort({ createdAt: -1 })
      .populate('adminId');
    
    if (inactiveSession) {
      console.log('⚠️ ADMIN SESSION - Found INACTIVE session:', {
        sessionId: inactiveSession._id,
        admin: inactiveSession.adminId?.name,
        isActive: inactiveSession.isActive,
        createdAt: inactiveSession.createdAt?.toISOString(),
        reason: 'Session was deactivated (likely due to new login)'
      });
    }
    
    return null;
  }
  
  console.log('✅ ADMIN SESSION - Active session found in database:', {
    sessionId: activeSession._id,
    admin: activeSession.adminId?.name,
    isActive: activeSession.isActive,
    apiKeyExpiresAt: activeSession.apiKeyExpiresAt?.toISOString(),
    accessTokenExpiresAt: activeSession.accessTokenExpiresAt?.toISOString(),
    sessionExpiresAt: activeSession.sessionExpiresAt?.toISOString(),
    createdAt: activeSession.createdAt?.toISOString(),
    lastUsedAt: activeSession.lastUsedAt?.toISOString()
  });
  
  // Detailed token validation logging
  const apiKeyExpired = activeSession.isApiKeyExpired();
  const accessTokenExpired = activeSession.isAccessTokenExpired();
  const sessionExpired = activeSession.isSessionExpired();
  
  console.log('📊 ADMIN SESSION - TOKEN VALIDATION:', {
    isActive: activeSession.isActive,
    apiKeyExpired: apiKeyExpired,
    accessTokenExpired: accessTokenExpired,
    sessionExpired: sessionExpired,
    currentTime: currentTime.toISOString(),
    timeUntilApiKeyExpiry: activeSession.apiKeyExpiresAt ? Math.floor((activeSession.apiKeyExpiresAt - currentTime) / 1000) + 's' : 'N/A',
    timeUntilAccessTokenExpiry: activeSession.accessTokenExpiresAt ? Math.floor((activeSession.accessTokenExpiresAt - currentTime) / 1000) + 's' : 'N/A',
    timeUntilSessionExpiry: activeSession.sessionExpiresAt ? Math.floor((activeSession.sessionExpiresAt - currentTime) / 1000) + 's' : 'N/A'
  });
  
  // Check if session is valid using the isValid method
  if (activeSession.isValid()) {
    console.log('✅ ADMIN SESSION - Session is VALID and ACTIVE');
    return activeSession;
  }
  
  // If session exists but is not valid, log the specific reasons
  console.log('❌ ADMIN SESSION - Session exists but is INVALID:', {
    reason: 'One or more validation checks failed',
    validationChecks: {
      isActive: activeSession.isActive,
      isApiKeyExpired: apiKeyExpired,
      isAccessTokenExpired: accessTokenExpired,
      isSessionExpired: sessionExpired
    },
    failedChecks: [
      !activeSession.isActive && 'isActive=false',
      apiKeyExpired && 'apiKeyExpired',
      accessTokenExpired && 'accessTokenExpired',
      sessionExpired && 'sessionExpired'
    ].filter(Boolean)
  });
  
  return null;
};

// Static method to cleanup expired sessions
adminSessionSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      $or: [
        { apiKeyExpiresAt: { $lt: new Date() } },
        { accessTokenExpiresAt: { $lt: new Date() } },
        { sessionExpiresAt: { $lt: new Date() } }
      ],
      isActive: true
    },
    {
      isActive: false
    }
  );
  
  return result.modifiedCount;
};

// Static method to deactivate all previous sessions for an admin
adminSessionSchema.statics.deactivatePreviousSessions = async function(adminId) {
  try {
    const result = await this.updateMany(
      {
        adminId: adminId,
        isActive: true
      },
      {
        isActive: false,
        updatedAt: new Date()
      }
    );

    console.log('🔄 Deactivated previous sessions:', {
      adminId: adminId,
      deactivatedCount: result.modifiedCount
    });

    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error deactivating previous sessions:', error);
    throw error;
  }
};

// Static method to create a single active session (deactivates previous ones)
adminSessionSchema.statics.createSingleActiveSession = async function(adminId, thyrocareData, ipAddress, userAgent = '') {
  try {
    // Step 1: Deactivate all previous sessions for this admin
    await this.deactivatePreviousSessions(adminId);

    // Step 2: Create new session using existing logic
    const session = await this.createFromThyroCare(adminId, thyrocareData, ipAddress, userAgent);

    console.log('✅ Created single active session:', {
      sessionId: session._id,
      adminId: adminId,
      apiKey: session.thyrocareApiKey.substring(0, 10) + '...'
    });

    return session;
  } catch (error) {
    console.error('❌ Error creating single active session:', error);
    throw error;
  }
};

export default mongoose.model('AdminSession', adminSessionSchema);
