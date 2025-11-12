import mongoose from "mongoose";
import validator from "validator";

const smsHistorySchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return validator.isMobilePhone(v, "any", { strictMode: false });
      },
      message: "Invalid mobile number",
    },
  },
  messageType: {
    type: String,
    enum: ["otp", "notification", "promotional", "transactional"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    default: null,
  },
  purpose: {
    type: String,
    enum: ["verification", "forgot_password", "notification", "alert", "marketing"],
    default: "verification",
  },
  status: {
    type: String,
    enum: ["pending", "sent", "delivered", "failed", "unknown"],
    default: "pending",
  },
  requestId: {
    type: String,
    default: null,
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  cost: {
    type: Number,
    default: 0,
  },
  provider: {
    type: String,
    default: "fast2sms",
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
smsHistorySchema.index({ mobileNumber: 1, sentAt: -1 });
smsHistorySchema.index({ status: 1, sentAt: -1 });
smsHistorySchema.index({ messageType: 1, sentAt: -1 });
smsHistorySchema.index({ purpose: 1, sentAt: -1 });
smsHistorySchema.index({ requestId: 1 });

// Update the updatedAt field before saving
smsHistorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to create SMS history record
smsHistorySchema.statics.createRecord = async function(data) {
  try {
    const record = new this(data);
    await record.save();
    return record;
  } catch (error) {
    console.error('Error creating SMS history record:', error);
    throw error;
  }
};

// Static method to update SMS status
smsHistorySchema.statics.updateStatus = async function(requestId, status, apiResponse = null, errorMessage = null) {
  try {
    const updateData = {
      status,
      updatedAt: Date.now()
    };

    if (apiResponse) {
      updateData.apiResponse = apiResponse;
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    if (status === 'delivered') {
      updateData.deliveredAt = Date.now();
    }

    const record = await this.findOneAndUpdate(
      { requestId },
      updateData,
      { new: true }
    );

    return record;
  } catch (error) {
    console.error('Error updating SMS status:', error);
    throw error;
  }
};

// Static method to get SMS statistics
smsHistorySchema.statics.getStatistics = async function(startDate = null, endDate = null) {
  try {
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.sentAt = {};
      if (startDate) matchStage.sentAt.$gte = new Date(startDate);
      if (endDate) matchStage.sentAt.$lte = new Date(endDate);
    }

    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      },
      {
        $group: {
          _id: null,
          totalSMS: { $sum: '$count' },
          totalCost: { $sum: '$totalCost' },
          statusBreakdown: {
            $push: {
              status: '$_id',
              count: '$count',
              cost: '$totalCost'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalSMS: 1,
          totalCost: 1,
          statusBreakdown: 1
        }
      }
    ]);

    return stats[0] || { totalSMS: 0, totalCost: 0, statusBreakdown: [] };
  } catch (error) {
    console.error('Error getting SMS statistics:', error);
    throw error;
  }
};

// Static method to get paginated SMS history
smsHistorySchema.statics.getPaginatedHistory = async function(
  page = 1, 
  limit = 10, 
  filters = {}
) {
  try {
    const skip = (page - 1) * limit;
    
    // Build filter query
    const query = {};
    
    if (filters.mobileNumber) {
      query.mobileNumber = { $regex: filters.mobileNumber, $options: 'i' };
    }
    
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    
    if (filters.messageType && filters.messageType !== 'all') {
      query.messageType = filters.messageType;
    }
    
    if (filters.purpose && filters.purpose !== 'all') {
      query.purpose = filters.purpose;
    }
    
    if (filters.startDate || filters.endDate) {
      query.sentAt = {};
      if (filters.startDate) query.sentAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.sentAt.$lte = new Date(filters.endDate);
    }

    const [records, totalCount] = await Promise.all([
      this.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      records,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting paginated SMS history:', error);
    throw error;
  }
};

export default mongoose.model("SMSHistory", smsHistorySchema);
