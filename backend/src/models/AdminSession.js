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
    const apiKeyExpiresAt = new Date();
    apiKeyExpiresAt.setDate(apiKeyExpiresAt.getDate() + 1);
    apiKeyExpiresAt.setHours(0, 0, 0, 0);
    
    const accessTokenExpiresAt = new Date(thyrocareData.exp * 1000 || Date.now() + 3600000); // 1 hour default
    
    const session = new this({
      adminId: adminId,
      thyrocareApiKey: thyrocareData.apiKey,
      thyrocareAccessToken: thyrocareData.accessToken,
      thyrocareRespId: thyrocareData.respId,
      ipAddress: ipAddress,
      userAgent: userAgent,
      apiKeyExpiresAt: apiKeyExpiresAt,
      accessTokenExpiresAt: accessTokenExpiresAt,
      sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true
    });

    await session.save();
    return session;
  } catch (error) {
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
adminSessionSchema.methods.isValid = function() {
  return this.isActive && 
         !this.isApiKeyExpired() && 
         !this.isAccessTokenExpired() && 
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
  return await this.findOne({
    thyrocareApiKey: apiKey,
    isActive: true,
    apiKeyExpiresAt: { $gt: new Date() },
    accessTokenExpiresAt: { $gt: new Date() },
    sessionExpiresAt: { $gt: new Date() }
  }).populate('adminId');
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

export default mongoose.model('AdminSession', adminSessionSchema);
