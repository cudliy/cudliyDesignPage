import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const orderSchema = new mongoose.Schema({
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
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  items: [{
    designId: String,
    designTitle: String,
    designImage: String,
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    totalPrice: Number
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
    },
    estimatedDelivery: Date
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
    status: String,
    transactionId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  production: {
    status: {
      type: String,
      enum: ['queued', 'printing', 'post_processing', 'quality_check', 'packaging', 'ready_for_shipping'],
      default: 'queued'
    },
    estimatedCompletion: Date,
    actualCompletion: Date,
    notes: String
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    shippedAt: Date,
    deliveredAt: Date
  },
  metadata: {
    source: String, // web, mobile, api
    userAgent: String,
    ipAddress: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'production.status': 1 });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `CUD-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
