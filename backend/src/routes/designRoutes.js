import express from 'express';
import multer from 'multer';
import { 
  generateImages, 
  generate3DModel, 
  getDesign, 
  getUserDesigns, 
  deleteDesign, 
  updateDesign 
} from '../controllers/designController.js';
import { imageLimiter, modelLimiter } from '../utils/rateLimiter.js';
import { generateImagesSchema, generate3DSchema } from '../utils/validation.js';
import { AppError } from '../utils/errorHandler.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 400), false);
    }
  }
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }
    next();
  };
};

// Design routes
router.post('/generate-images', 
  imageLimiter,
  validateRequest(generateImagesSchema),
  generateImages
);

router.post('/generate-3d-model',
  modelLimiter,
  validateRequest(generate3DSchema),
  generate3DModel
);

router.get('/:designId', getDesign);
router.get('/user/:userId/designs', getUserDesigns);
router.delete('/:designId', deleteDesign);
router.patch('/:designId', updateDesign);

export default router;
