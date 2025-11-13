import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Our system order ID
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Admin information (for DSA reference)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Package information
  package: {
    code: {
      type: [String],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    originalPrice: {
      type: Number
    },
    discountPercentage: {
      type: Number
    }
  },
  
  // Beneficiary data
  beneficiaries: [{
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    leadId: {
      type: String // Thyrocare lead ID
    }
  }],
  
  // Contact information
  contactInfo: {
    email: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true
    },
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        required: true
      },
      landmark: {
        type: String
      }
    }
  },
  
  // Appointment details
  appointment: {
    date: {
      type: String,
      required: true
    },
    slot: {
      type: String,
      required: true
    },
    slotId: {
      type: String
    }
  },
  
  // Thyrocare order information
  thyrocare: {
    orderNo: {
      type: String // Thyrocare order number (VL7E034C format)
    },
    status: {
      type: String,
      enum: ['YET TO ASSIGN', 'ASSIGNED', 'ACCEPTED', 'SERVICED', 'DONE', 'FAILED'],
      default: 'YET TO ASSIGN'
    },
    statusHistory: [{
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String
      }
    }],
    response: {
      type: mongoose.Schema.Types.Mixed // Store full Thyrocare response
    },
    error: {
      type: String // Store error message if order creation failed
    },
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: {
      type: Date
    }
  },
  
  // Report information
  reports: [{
    beneficiaryName: {
      type: String,
      required: true
    },
    leadId: {
      type: String,
      required: true
    },
    reportUrl: {
      type: String
    },
    reportDownloaded: {
      type: Boolean,
      default: false
    },
    downloadedAt: {
      type: Date
    },
    reportPath: {
      type: String // Local path to stored PDF
    }
  }],
  
  // Payment information
  payment: {
    type: {
      type: String,
      enum: ['POSTPAID', 'PREPAID'],
      default: 'POSTPAID'
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING'
    }
  },
  
  // Order status in our system
  status: {
    type: String,
    enum: ['PENDING', 'CREATED', 'FAILED', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING'
  },
  
  // Additional metadata
  notes: {
    type: String
  },
  source: {
    type: String,
    default: 'AryoPath'
  },
  
  // Timestamps
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

// Indexes for faster queries
orderSchema.index({ orderId: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ adminId: 1 });
orderSchema.index({ 'thyrocare.orderNo': 1 });
orderSchema.index({ 'thyrocare.status': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'contactInfo.mobile': 1 });
orderSchema.index({ 'contactInfo.email': 1 });

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to generate order ID
orderSchema.statics.generateOrderId = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${timestamp.slice(-6)}${random}`;
};

// Method to update Thyrocare status
orderSchema.methods.updateThyrocareStatus = async function(newStatus, notes = '') {
  this.thyrocare.status = newStatus;
  this.thyrocare.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes: notes
  });
  
  // Update our system status based on Thyrocare status
  if (newStatus === 'DONE') {
    this.status = 'COMPLETED';
  } else if (newStatus === 'FAILED') {
    this.status = 'FAILED';
  } else if (this.status === 'PENDING' && newStatus !== 'YET TO ASSIGN') {
    this.status = 'CREATED';
  }
  
  await this.save();
};

// Method to add report information
orderSchema.methods.addReport = async function(beneficiaryName, leadId, reportUrl = null) {
  const reportIndex = this.reports.findIndex(report => 
    report.beneficiaryName === beneficiaryName && report.leadId === leadId
  );
  
  if (reportIndex >= 0) {
    // Update existing report
    this.reports[reportIndex].reportUrl = reportUrl;
    if (reportUrl) {
      this.reports[reportIndex].reportDownloaded = false;
    }
  } else {
    // Add new report
    this.reports.push({
      beneficiaryName,
      leadId,
      reportUrl,
      reportDownloaded: false
    });
  }
  
  await this.save();
};

// Method to mark report as downloaded
orderSchema.methods.markReportDownloaded = async function(leadId, reportPath = null) {
  const report = this.reports.find(r => r.leadId === leadId);
  if (report) {
    report.reportDownloaded = true;
    report.downloadedAt = new Date();
    if (reportPath) {
      report.reportPath = reportPath;
    }
    await this.save();
  }
};

// Static method to find orders by status
orderSchema.statics.findByStatus = async function(status) {
  return await this.find({ status }).populate('userId adminId');
};

// Static method to find orders by Thyrocare status
orderSchema.statics.findByThyrocareStatus = async function(thyrocareStatus) {
  return await this.find({ 'thyrocare.status': thyrocareStatus }).populate('userId adminId');
};

// Static method to find orders by user
orderSchema.statics.findByUser = async function(userId) {
  return await this.find({ userId }).populate('adminId').sort({ createdAt: -1 });
};

// Static method to find orders by admin
orderSchema.statics.findByAdmin = async function(adminId) {
  return await this.find({ adminId }).populate('userId').sort({ createdAt: -1 });
};

export default mongoose.model('Order', orderSchema);
