import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const paymentSchema = new mongoose.Schema({
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
  stripePaymentIntentId: {
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
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'requires_action'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'],
      required: true
    },
    last4: String,
    brand: String,
    expMonth: Number,
    expYear: Number,
    fingerprint: String
  },
  description: String,
  metadata: {
    designId: String,
    sessionId: String,
    creationId: String,
    subscriptionId: String,
    productId: String
  },
  receipt: {
    url: String,
    email: String
  },
  refunds: [{
    id: String,
    amount: Number,
    reason: String,
    status: String,
    createdAt: Date
  }],
  failureReason: String,
  failureCode: String,
  clientSecret: String,
  nextAction: {
    type: String,
    redirectUrl: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ stripeCustomerId: 1 });
paymentSchema.index({ 'metadata.designId': 1 });
paymentSchema.index({ 'metadata.subscriptionId': 1 });

export default mongoose.model('Payment', paymentSchema);
