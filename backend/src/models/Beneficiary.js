import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Beneficiary name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: String,
    trim: true,
    maxlength: [3, 'Age cannot exceed 3 characters']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  relationship: {
    type: String,
    enum: ['Self', 'Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Other'],
    default: 'Self'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one default beneficiary per user
beneficiarySchema.pre('save', function(next) {
  if (this.isDefault) {
    mongoose.model('Beneficiary').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    ).exec();
  }
  this.updatedAt = Date.now();
  next();
});

// Index for performance
beneficiarySchema.index({ userId: 1, isDefault: 1 });

export default mongoose.model('Beneficiary', beneficiarySchema);
