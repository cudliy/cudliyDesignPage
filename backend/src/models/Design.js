import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const designSchema = new mongoose.Schema({
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
  creationId: {
    type: String,
    required: true
  },
  sessionId: String,
  
  // User Input
  originalText: {
    type: String,
    required: true
  },
  userSelections: {
    color: String,
    size: String,
    style: String,
    material: String,
    production: String,
    details: [String],
    customDimensions: {
      width: String,
      height: String
    }
  },
  
  // AI Generation
  generatedPrompt: String,
  generatedImages: [{
    url: String,
    prompt: String,
    index: Number,
    selected: { type: Boolean, default: false }
  }],
  selectedImageIndex: Number,
  // Legacy support for images field
  images: [{
    url: String,
    prompt: String,
    selected: { type: Boolean, default: false }
  }],
  
  // 3D Model Data
  generated3DModel: {
    url: String,
    prompt: String,
    format: String
  },
  modelFiles: {
    originalImage: String,
    processedImage: String,
    modelFile: String,
    storedModelUrl: String,
    gaussianPly: String,
    colorVideo: String,
    thumbnails: [String]
  },
  
  // Generation Options
  generationOptions: {
    seed: Number,
    textureSize: Number,
    meshSimplify: Number,
    generateColor: Boolean,
    generateModel: Boolean,
    randomizeSeed: Boolean,
    generateNormal: Boolean,
    saveGaussianPly: Boolean,
    ssSamplingSteps: Number,
    slatSamplingSteps: Number,
    returnNoBackground: Boolean,
    ssGuidanceStrength: Number,
    slatGuidanceStrength: Number
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  processingSteps: [{
    step: String,
    status: String,
    timestamp: Date,
    duration: Number,
    error: String
  }],
  
  // Sharing and Collaboration
  isPublic: { type: Boolean, default: false },
  tags: [String],
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  
  // Versioning
  parentDesignId: String,
  version: { type: Number, default: 1 },
  
  // File Management
  fileSize: Number,
  downloadCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes for better performance
designSchema.index({ userId: 1, createdAt: -1 });
designSchema.index({ status: 1 });
designSchema.index({ isPublic: 1, likes: -1 });
designSchema.index({ tags: 1 });

export default mongoose.model('Design', designSchema);
