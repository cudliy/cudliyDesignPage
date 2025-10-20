import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const checkoutSchema = new mongoose.Schema({
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
  designId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'shipping_info', 'billing_info', 'payment_info', 'completed', 'abandoned'],
    default: 'draft',
    index: true
  },
  items: [{
    designId: String,
    designTitle: String,
    designImage: String,
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    totalPrice: Number,
    attributes: {
      size: { type: String, enum: ['S', 'M', 'L'], default: 'M' }
    }
  }],
  pricing: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  shipping: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard'
    }
  },
  billing: {
    firstName: String,
    lastName: String,
    email: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    sameAsShipping: { type: Boolean, default: true }
  },
  payment: {
    method: String,
    paymentIntentId: String,
    clientSecret: String,
    status: String
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better performance
checkoutSchema.index({ userId: 1, status: 1 });
checkoutSchema.index({ sessionId: 1 });
checkoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Checkout', checkoutSchema);
