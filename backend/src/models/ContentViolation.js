import mongoose from 'mongoose';

const contentViolationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  violationType: {
    type: String,
    enum: ['inappropriate_content', 'repeated_violations', 'explicit_content', 'hate_speech', 'violence'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000 // Store truncated version for analysis
  },
  detectedTerms: [{
    type: String
  }],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  action: {
    type: String,
    enum: ['blocked', 'warned', 'flagged', 'account_suspended'],
    required: true
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: String,
    required: false
  },
  resolvedAt: {
    type: Date,
    required: false
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
contentViolationSchema.index({ userId: 1, createdAt: -1 });
contentViolationSchema.index({ violationType: 1, severity: 1 });
contentViolationSchema.index({ createdAt: -1 });

// Static method to get user violation count
contentViolationSchema.statics.getUserViolationCount = async function(userId, timeframe = 24) {
  const since = new Date(Date.now() - (timeframe * 60 * 60 * 1000)); // hours ago
  return await this.countDocuments({
    userId,
    createdAt: { $gte: since },
    isResolved: false
  });
};

// Static method to check if user should be blocked
contentViolationSchema.statics.shouldBlockUser = async function(userId) {
  const violations24h = await this.getUserViolationCount(userId, 24);
  const violations7d = await this.getUserViolationCount(userId, 24 * 7);
  
  // Block if:
  // - 3+ violations in 24 hours
  // - 10+ violations in 7 days
  // - Any critical severity violation
  const criticalViolation = await this.findOne({
    userId,
    severity: 'critical',
    isResolved: false
  });
  
  return violations24h >= 3 || violations7d >= 10 || !!criticalViolation;
};

// Static method to get recommended action
contentViolationSchema.statics.getRecommendedAction = async function(userId, severity) {
  const violations24h = await this.getUserViolationCount(userId, 24);
  const violations7d = await this.getUserViolationCount(userId, 24 * 7);
  
  if (severity === 'critical') {
    return 'account_suspended';
  }
  
  if (violations24h >= 3) {
    return 'account_suspended';
  }
  
  if (violations24h >= 2 || violations7d >= 5) {
    return 'blocked';
  }
  
  if (violations24h >= 1 || violations7d >= 3) {
    return 'warned';
  }
  
  return 'flagged';
};

export default mongoose.model('ContentViolation', contentViolationSchema);