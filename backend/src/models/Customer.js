import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const customerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripeCustomerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: String,
  phone: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  taxId: String,
  defaultPaymentMethod: {
    id: String,
    type: String,
    last4: String,
    brand: String,
    expMonth: Number,
    expYear: Number
  },
  paymentMethods: [{
    id: String,
    type: String,
    last4: String,
    brand: String,
    expMonth: Number,
    expYear: Number,
    isDefault: Boolean,
    createdAt: Date
  }],
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  metadata: {
    source: String,
    referrer: String,
    campaign: String,
    userAgent: String,
    ipAddress: String
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false },
    invoiceEmails: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Indexes for better performance
customerSchema.index({ stripeCustomerId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ 'address.country': 1 });

export default mongoose.model('Customer', customerSchema);
