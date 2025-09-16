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
// Rate limiting and validation removed for guest access
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

// Design routes - No authentication or rate limiting for guest access
router.post('/generate-images', generateImages);
router.post('/generate-3d-model', generate3DModel);

router.get('/:designId', getDesign);
router.get('/user/:userId/designs', getUserDesigns);
router.delete('/:designId', deleteDesign);
router.patch('/:designId', updateDesign);

export default router;
