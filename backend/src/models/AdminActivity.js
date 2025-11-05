import mongoose from 'mongoose';

const adminActivitySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminSession',
    required: true
  },
  
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'SESSION_EXPIRED',
      'PRODUCT_FETCH',
      'ORDER_VIEW',
      'ORDER_CREATE',
      'ORDER_UPDATE',
      'REPORT_VIEW',
      'SETTINGS_UPDATE',
      'PROFILE_UPDATE',
      'API_CALL',
      'ERROR',
      'OTHER',
      'USERS_FETCH',
      'USERS_VIEW',
      'PRICING_UPDATE'
    ]
  },
  description: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    default: ''
  },
  resourceId: {
    type: String,
    default: null
  },
  
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  
  statusCode: {
    type: Number,
    default: null
  },
  responseTime: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

adminActivitySchema.index({ adminId: 1, createdAt: -1 });
adminActivitySchema.index({ sessionId: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });
adminActivitySchema.index({ resource: 1, createdAt: -1 });
adminActivitySchema.index({ endpoint: 1, createdAt: -1 });
adminActivitySchema.index({ ipAddress: 1, createdAt: -1 });
adminActivitySchema.index({ createdAt: -1 });

adminActivitySchema.statics.logActivity = async function(data) {
  try {
    const activity = new this({
      adminId: data.adminId,
      sessionId: data.sessionId,
      action: data.action,
      description: data.description,
      resource: data.resource || '',
      resourceId: data.resourceId || null,
      endpoint: data.endpoint,
      method: data.method,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent || '',
      statusCode: data.statusCode || null,
      responseTime: data.responseTime || null,
      errorMessage: data.errorMessage || null,
      metadata: data.metadata || {}
    });

    await activity.save();
    return activity;
  } catch (error) {
    console.error('Failed to log admin activity:', error);
    throw error;
  }
};

adminActivitySchema.statics.getRecentActivities = async function(adminId, limit = 50) {
  return await this.find({ adminId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sessionId', 'ipAddress userAgent createdAt')
    .lean();
};

adminActivitySchema.statics.getActivitiesByAction = async function(adminId, action, limit = 100) {
  return await this.find({ adminId, action })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sessionId', 'ipAddress userAgent createdAt')
    .lean();
};

adminActivitySchema.statics.cleanupOldActivities = async function() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const result = await this.deleteMany({
    createdAt: { $lt: ninetyDaysAgo }
  });
  
  return result.deletedCount;
};

adminActivitySchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  });
});

adminActivitySchema.set('toJSON', { virtuals: true });
adminActivitySchema.set('toObject', { virtuals: true });

export default mongoose.model('AdminActivity', adminActivitySchema);
