import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminSchema = new mongoose.Schema({
  // Basic identification
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },

  // ThyroCare specific fields
  thyrocareUserId: {
    type: String,
    unique: true,
    sparse: true
  },
  userType: {
    type: String,
    enum: ['DSA', 'NSA', 'OTHER'],
    default: 'DSA'
  },
  userTypeId: {
    type: Number,
    default: 3
  },
  respId: {
    type: String,
    unique: true,
    sparse: true
  },
  verKey: {
    type: String
  },

  // Status and permissions
  status: {
    type: Boolean,
    default: true
  },
  isPrepaid: {
    type: String,
    enum: ['Y', 'N'],
    default: 'Y'
  },
  trackingPrivilege: {
    type: String,
    enum: ['Y', 'N'],
    default: 'N'
  },
  otpAccess: {
    type: String,
    enum: ['Y', 'N'],
    default: 'N'
  },

  // Additional info
  address: {
    type: String,
    trim: true
  },
  loyaltyDiscount: {
    type: Number,
    default: null
  },
  dsaWebLink: {
    type: String,
    default: null
  },
  assignType: {
    type: String,
    default: null
  },
  exceptionalPincode: {
    type: String,
    default: null
  },
  hcLchc: {
    type: String,
    default: null
  },

  // Our system fields
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
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

// Index for faster queries (only add indexes not covered by unique constraints)
adminSchema.index({ mobile: 1 });
adminSchema.index({ status: 1, isActive: 1 });

// Update the updatedAt field before saving
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find by ThyroCare response
adminSchema.statics.findOrCreateFromThyroCare = async function(thyrocareData, username) {
  try {
    // Try to find existing admin by email or mobile
    let admin = await this.findOne({
      $or: [
        { email: thyrocareData.email?.toLowerCase() },
        { mobile: thyrocareData.mobile },
        { thyrocareUserId: thyrocareData.respId }
      ]
    });

    if (admin) {
      // Update existing admin with latest data
      admin.name = thyrocareData.name || admin.name;
      admin.userType = thyrocareData.userType || admin.userType;
      admin.userTypeId = thyrocareData.userTypeId || admin.userTypeId;
      admin.respId = thyrocareData.respId || admin.respId;
      admin.verKey = thyrocareData.verKey || admin.verKey;
      admin.status = thyrocareData.status !== undefined ? thyrocareData.status : admin.status;
      admin.isPrepaid = thyrocareData.isPrepaid || admin.isPrepaid;
      admin.trackingPrivilege = thyrocareData.trackingPrivilege || admin.trackingPrivilege;
      admin.otpAccess = thyrocareData.otpAccess || admin.otpAccess;
      admin.lastLogin = new Date();
      admin.loginCount += 1;

      await admin.save();
      return admin;
    } else {
      // Create new admin
      admin = new this({
        username: username,
        email: thyrocareData.email?.toLowerCase(),
        mobile: thyrocareData.mobile,
        name: thyrocareData.name,
        thyrocareUserId: thyrocareData.respId,
        userType: thyrocareData.userType,
        userTypeId: thyrocareData.userTypeId,
        respId: thyrocareData.respId,
        verKey: thyrocareData.verKey,
        status: thyrocareData.status !== undefined ? thyrocareData.status : true,
        isPrepaid: thyrocareData.isPrepaid || 'Y',
        trackingPrivilege: thyrocareData.trackingPrivilege || 'N',
        otpAccess: thyrocareData.otpAccess || 'N',
        lastLogin: new Date(),
        loginCount: 1
      });

      await admin.save();
      return admin;
    }
  } catch (error) {
    throw error;
  }
};

// Method to verify password
adminSchema.methods.verifyPassword = async function(password) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(password, this.password);
};

// Method to update password
adminSchema.methods.updatePassword = async function(password) {
  const saltRounds = 12;
  this.password = await bcrypt.hash(password, saltRounds);
  await this.save();
};

// Static method to find admin by username
adminSchema.statics.findByUsername = async function(username) {
  return await this.findOne({ username });
};

export default mongoose.model('Admin', adminSchema);
