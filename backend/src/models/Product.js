import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  stripeProductId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['subscription', 'one_time', 'credit_pack'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['subscription', 'credits', 'premium_features', 'addons'],
    required: true,
    index: true
  },
  pricing: [{
    stripePriceId: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
      uppercase: true
    },
    interval: {
      type: String,
      enum: ['month', 'year', 'one_time'],
      required: true
    },
    intervalCount: {
      type: Number,
      default: 1
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  features: [{
    name: String,
    description: String,
    included: Boolean,
    limit: Number,
    unit: String
  }],
  limits: {
    imagesPerMonth: { type: Number, default: 0 },
    modelsPerMonth: { type: Number, default: 0 },
    storageGB: { type: Number, default: 0 },
    prioritySupport: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    teamMembers: { type: Number, default: 1 }
  },
  metadata: {
    popular: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    new: { type: Boolean, default: false },
    comingSoon: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ type: 1, category: 1, isActive: 1 });
productSchema.index({ 'metadata.popular': 1, isActive: 1 });
productSchema.index({ 'metadata.recommended': 1, isActive: 1 });
productSchema.index({ sortOrder: 1 });

export default mongoose.model('Product', productSchema);
