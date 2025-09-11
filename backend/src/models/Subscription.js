import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const subscriptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripeCustomerId: {
    type: String,
    required: true,
    index: true
  },
  stripePriceId: {
    type: String,
    required: true
  },
  productId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'],
    required: true,
    index: true
  },
  plan: {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['free', 'premium', 'pro', 'enterprise'],
      required: true
    },
    price: {
      amount: Number,
      currency: String,
      interval: String, // month, year
      intervalCount: Number
    },
    features: [String],
    limits: {
      imagesPerMonth: Number,
      modelsPerMonth: Number,
      storageGB: Number,
      prioritySupport: Boolean,
      customBranding: Boolean,
      apiAccess: Boolean
    }
  },
  billing: {
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialStart: Date,
    trialEnd: Date,
    cancelAtPeriodEnd: Boolean,
    canceledAt: Date,
    cancelationReason: String
  },
  paymentMethod: {
    type: String,
    last4: String,
    brand: String,
    expMonth: Number,
    expYear: Number
  },
  usage: {
    imagesGenerated: { type: Number, default: 0 },
    modelsGenerated: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 }, // in bytes
    lastReset: Date
  },
  metadata: {
    source: String, // web, mobile, api
    referrer: String,
    campaign: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ 'plan.type': 1, status: 1 });
subscriptionSchema.index({ 'billing.currentPeriodEnd': 1 });
subscriptionSchema.index({ status: 1, 'billing.currentPeriodEnd': 1 });

// Auto-update usage reset
subscriptionSchema.pre('save', function(next) {
  if (this.isModified('billing.currentPeriodStart')) {
    this.usage.imagesGenerated = 0;
    this.usage.modelsGenerated = 0;
    this.usage.lastReset = new Date();
  }
  next();
});

export default mongoose.model('Subscription', subscriptionSchema);
