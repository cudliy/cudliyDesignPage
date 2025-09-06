import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import storageService from '../services/storageService.js';

// Upload Custom Image
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided', 400));
    }

    const filename = `uploads/${Date.now()}-${uuidv4()}.jpg`;
    const uploadResult = await storageService.uploadImage(
      req.file.buffer, 
      filename, 
      {
        resize: { width: 1024, height: 1024 },
        quality: 90,
        generateThumbnail: true
      }
    );

    logger.info(`Image uploaded successfully: ${uploadResult.imageUrl}`);

    res.json({
      success: true,
      data: {
        image_url: uploadResult.imageUrl,
        thumbnail_url: uploadResult.thumbnailUrl,
        filename: uploadResult.filename,
        message: 'Image uploaded successfully'
      }
    });

  } catch (error) {
    logger.error('Upload Image Error:', error);
    next(new AppError('Failed to upload image', 500));
  }
};
