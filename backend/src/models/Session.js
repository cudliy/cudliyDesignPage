import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const sessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  userId: String,
  creationId: String,
  
  // Session Data
  originalText: String,
  userSelections: {
    color: String,
    size: String,
    style: String,
    material: String,
    production: String,
    details: [String]
  },
  
  // Generation Progress
  currentStep: {
    type: String,
    enum: ['prompt_generation', 'image_generation', 'image_selection', '3d_generation', 'completed'],
    default: 'prompt_generation'
  },
  
  // Temporary Data
  generatedPrompts: [String],
  generatedImages: [String],
  selectedImageUrl: String,
  
  // Metadata
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
}, {
  timestamps: true
});

// Auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
