import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController.js';
import { uploadLimiter } from '../utils/rateLimiter.js';
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

// Upload routes
router.post('/image', 
  uploadLimiter,
  upload.single('image'), 
  uploadImage
);

export default router;
