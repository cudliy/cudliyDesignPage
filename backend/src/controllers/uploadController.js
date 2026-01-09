import multer from 'multer';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import awsService from '../services/awsService.js'; // Now using R2Service

// Configure multer for memory storage (we'll upload directly to AWS S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and 3D model files
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'model/gltf-binary',
      'model/gltf+json',
      'application/sla',
      'application/octet-stream'
    ];
    
    // Check file extension for 3D models
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.glb', '.gltf', '.stl', '.obj', '.ply'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type not allowed: ${file.mimetype}`, 400), false);
    }
  }
});

// Upload single image
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided', 400));
    }

    const { originalname, buffer, mimetype } = req.file;
    
    // Upload to AWS S3
    const s3Url = await awsService.uploadImage(buffer, originalname, mimetype);
    
    logger.info(`Image uploaded successfully: ${originalname} -> ${s3Url}`);

    res.json({
      success: true,
      data: {
        originalName: originalname,
        fileName: s3Url.split('/').pop(),
        url: s3Url,
        size: buffer.length,
        contentType: mimetype
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    logger.error('Image upload error:', error);
    next(new AppError(error.message || 'Failed to upload image', 500));
  }
};

// Upload single 3D model
export const upload3DModel = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No 3D model file provided', 400));
    }

    const { originalname, buffer, mimetype } = req.file;
    
    // Determine content type based on file extension
    let contentType = mimetype;
    if (originalname.toLowerCase().endsWith('.glb')) {
      contentType = 'model/gltf-binary';
    } else if (originalname.toLowerCase().endsWith('.gltf')) {
      contentType = 'model/gltf+json';
    } else if (originalname.toLowerCase().endsWith('.stl')) {
      contentType = 'application/sla';
    }
    
    // Upload to AWS S3
    const s3Url = await awsService.upload3DModel(buffer, originalname, contentType);
    
    logger.info(`3D model uploaded successfully: ${originalname} -> ${s3Url}`);

    res.json({
      success: true,
      data: {
        originalName: originalname,
        fileName: s3Url.split('/').pop(),
        url: s3Url,
        size: buffer.length,
        contentType: contentType
      },
      message: '3D model uploaded successfully'
    });

  } catch (error) {
    logger.error('3D model upload error:', error);
    next(new AppError(error.message || 'Failed to upload 3D model', 500));
  }
};

// Upload multiple files (images and models)
export const uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files provided', 400));
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const { originalname, buffer, mimetype } = file;
        
        // Determine if it's an image or 3D model
        const isImage = mimetype.startsWith('image/') || 
                       originalname.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
        
        let s3Url;
        if (isImage) {
          s3Url = await awsService.uploadImage(buffer, originalname, mimetype);
        } else {
          // 3D model
          let contentType = mimetype;
          if (originalname.toLowerCase().endsWith('.glb')) {
            contentType = 'model/gltf-binary';
          } else if (originalname.toLowerCase().endsWith('.gltf')) {
            contentType = 'model/gltf+json';
          } else if (originalname.toLowerCase().endsWith('.stl')) {
            contentType = 'application/sla';
          }
          s3Url = await awsService.upload3DModel(buffer, originalname, contentType);
        }
        
        uploadedFiles.push({
          originalName: originalname,
          fileName: s3Url.split('/').pop(),
          url: s3Url,
          size: buffer.length,
          contentType: mimetype,
          type: isImage ? 'image' : '3d_model'
        });
        
        logger.info(`File uploaded successfully: ${originalname} -> ${s3Url}`);
        
      } catch (error) {
        logger.error(`Failed to upload file ${file.originalname}:`, error);
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: uploadedFiles.length > 0,
      data: {
        uploadedFiles,
        errors,
        totalUploaded: uploadedFiles.length,
        totalErrors: errors.length
      },
      message: `Uploaded ${uploadedFiles.length} files successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (error) {
    logger.error('Multiple files upload error:', error);
    next(new AppError(error.message || 'Failed to upload files', 500));
  }
};

// Delete file from AWS S3
export const deleteFile = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return next(new AppError('File name is required', 400));
    }

    const deleted = await awsService.deleteFile(fileName);
    
    if (deleted) {
      logger.info(`File deleted successfully: ${fileName}`);
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.json({
        success: false,
        message: 'File not found or already deleted'
      });
    }

  } catch (error) {
    logger.error('File deletion error:', error);
    next(new AppError(error.message || 'Failed to delete file', 500));
  }
};

// List files in AWS S3 bucket
export const listFiles = async (req, res, next) => {
  try {
    const { prefix } = req.query;
    
    const files = await awsService.listFiles(prefix);
    
    res.json({
      success: true,
      data: {
        files,
        totalCount: files.length,
        prefix: prefix || ''
      },
      message: 'Files retrieved successfully'
    });

  } catch (error) {
    logger.error('List files error:', error);
    next(new AppError(error.message || 'Failed to list files', 500));
  }
};

// Get file metadata
export const getFileMetadata = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return next(new AppError('File name is required', 400));
    }

    const metadata = await awsService.getFileMetadata(fileName);
    
    res.json({
      success: true,
      data: {
        fileName,
        metadata
      },
      message: 'File metadata retrieved successfully'
    });

  } catch (error) {
    logger.error('Get file metadata error:', error);
    next(new AppError(error.message || 'Failed to get file metadata', 500));
  }
};

// Export multer middleware for use in routes
export { upload };