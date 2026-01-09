import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const giftSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  designId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  recipientEmail: {
    type: String,
    required: false
  },
  message: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['birthday', 'gender-reveal', 'pet-memorial', 'marriage-proposal', 'graduation', 'corporate', 'others', ''],
    default: ''
  },
  shareLink: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['created', 'sent', 'viewed', 'downloaded'],
    default: 'created'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  viewedAt: Date,
  downloadedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    viewedFrom: String
  }
}, {
  timestamps: true
});

// Index for cleanup of expired gifts
giftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Gift', giftSchema);