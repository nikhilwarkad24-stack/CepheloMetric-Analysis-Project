import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  photoURL: {
    type: String,
  },
  // Local auth fields
  passwordHash: {
    type: String,
  },
  salt: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Subscription and usage tracking
  subscriptionStatus: {
    type: String,
    enum: ['free', 'standard', 'premium'],
    default: 'free',
  },
  analysisCount: {
    type: Number,
    default: 0,
  },
  analysisLimit: {
    // null means unlimited
    type: Number,
    default: 3,
  },
});

// Clear old model if it exists and recreate
delete (mongoose.models as any).User;
export const User = mongoose.model('User', userSchema);

// Analysis model: stores saved analyses per user
const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  createdAt: { type: Date, default: Date.now },
  landmarks: { type: mongoose.Schema.Types.Mixed },
  analysis: { type: mongoose.Schema.Types.Mixed },
  meta: { type: mongoose.Schema.Types.Mixed },
});

delete (mongoose.models as any).Analysis;
export const Analysis = mongoose.model('Analysis', analysisSchema);

// Payment model: keeps records of purchases
const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String },
  orderId: { type: String },
  paymentId: { type: String },
  amount: { type: Number },
  currency: { type: String },
  plan: { type: String },
  status: { type: String },
  createdAt: { type: Date, default: Date.now },
});

delete (mongoose.models as any).Payment;
export const Payment = mongoose.model('Payment', paymentSchema);
