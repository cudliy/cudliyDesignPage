import express from 'express';
import { 
  uploadImage, 
  upload3DModel, 
  uploadMultipleFiles, 
  deleteFile, 
  listFiles, 
  getFileMetadata,
  upload 
} from '../controllers/uploadController.js';

const router = express.Router();

// Upload single image
router.post('/image', upload.single('image'), uploadImage);

// Upload single 3D model
router.post('/model', upload.single('model'), upload3DModel);

// Upload multiple files (images and models)
router.post('/multiple', upload.array('files', 10), uploadMultipleFiles);

// Delete file from GCS
router.delete('/file/:fileName', deleteFile);

// List files in bucket
router.get('/files', listFiles);

// Get file metadata
router.get('/file/:fileName/metadata', getFileMetadata);

export default router;