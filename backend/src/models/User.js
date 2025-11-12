import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String
  },
  googleAuth: {
    googleId: String,
    email: String,
    name: String,
    picture: String
  },
  appleAuth: {
    appleId: String,
    email: String
  },
  preferences: {
    defaultStyle: String,
    defaultMaterial: String,
    defaultSize: String,
    preferredProduction: String
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'pro', 'enterprise'],
      default: 'free'
    },
    expiresAt: Date,
    features: [String],
    stripeSubscriptionId: String,
    status: String
  },
  usage: {
    imagesGenerated: { type: Number, default: 0 },
    modelsGenerated: { type: Number, default: 0 },
    lastUsed: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
