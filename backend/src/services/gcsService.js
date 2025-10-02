import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GCSService {
  constructor() {
    this.storage = null;
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'cudliy-img';
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'cudliy';
    
    this.initializeStorage();
  }

  initializeStorage() {
    try {
      // Check if we have individual service account environment variables
      const hasIndividualVars = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_TYPE && 
                               process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_PRIVATE_KEY;
      
      if (hasIndividualVars) {
        // Use individual environment variables
        const serviceAccountKey = {
          type: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_TYPE,
          project_id: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_PROJECT_ID || this.projectId,
          private_key_id: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_CLIENT_ID,
          auth_uri: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_AUTH_URI,
          token_uri: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_TOKEN_URI
        };
        
        this.storage = new Storage({
          projectId: this.projectId,
          credentials: serviceAccountKey
        });
        logger.info('GCS initialized with individual service account environment variables');
      } else if (process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
        // Use base64 encoded service account key
        const serviceAccountKey = JSON.parse(Buffer.from(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY, 'base64').toString());
        this.storage = new Storage({
          projectId: this.projectId,
          credentials: serviceAccountKey
        });
        logger.info('GCS initialized with base64 encoded service account key');
      } else if (process.env.GOOGLE_CLOUD_KEY_FILE) {
        // Use service account key file
        let fullKeyPath;
        if (process.env.GOOGLE_CLOUD_KEY_FILE.startsWith('/')) {
          // Absolute path (Railway production)
          fullKeyPath = process.env.GOOGLE_CLOUD_KEY_FILE;
        } else {
          // Relative path (local development)
          fullKeyPath = path.resolve(__dirname, '../../..', process.env.GOOGLE_CLOUD_KEY_FILE);
        }
        this.storage = new Storage({
          projectId: this.projectId,
          keyFilename: fullKeyPath
        });
        logger.info(`GCS initialized with key file: ${fullKeyPath}`);
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Use environment variable for credentials
        this.storage = new Storage({
          projectId: this.projectId,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
        logger.info('GCS initialized with GOOGLE_APPLICATION_CREDENTIALS');
      } else {
        // Use default credentials (for production environments like Google Cloud Run)
        this.storage = new Storage({
          projectId: this.projectId
        });
        logger.info('GCS initialized with default credentials');
      }
    } catch (error) {
      logger.error('Failed to initialize Google Cloud Storage:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Google Cloud Storage
   * @param {Buffer|Stream} fileData - The file data to upload
   * @param {string} fileName - The name of the file in the bucket
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - The public URL of the uploaded file
   */
  async uploadFile(fileData, fileName, options = {}) {
    if (!this.storage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const uploadOptions = {
        metadata: {
          cacheControl: 'public, max-age=31536000', // 1 year cache
          contentType: options.contentType || 'application/octet-stream',
          metadata: {
            uploadedAt: new Date().toISOString(),
            ...options.metadata
          }
        },
        public: true, // Make file publicly accessible
        ...options
      };

      // Upload the file
      await file.save(fileData, uploadOptions);

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      
      logger.info(`File uploaded successfully: ${fileName} -> ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      logger.error(`Failed to upload file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Upload an image file
   * @param {Buffer} imageBuffer - The image data
   * @param {string} fileName - The name for the image file
   * @param {string} contentType - The MIME type of the image
   * @returns {Promise<string>} - The public URL of the uploaded image
   */
  async uploadImage(imageBuffer, fileName, contentType = 'image/jpeg') {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const gcsFileName = `images/${timestamp}_${sanitizedFileName}`;

    return this.uploadFile(imageBuffer, gcsFileName, {
      contentType,
      metadata: {
        type: 'image',
        originalName: fileName
      }
    });
  }

  /**
   * Upload a 3D model file
   * @param {Buffer} modelBuffer - The 3D model data
   * @param {string} fileName - The name for the model file
   * @param {string} contentType - The MIME type of the model
   * @returns {Promise<string>} - The public URL of the uploaded model
   */
  async upload3DModel(modelBuffer, fileName, contentType = 'application/octet-stream') {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const gcsFileName = `models/${timestamp}_${sanitizedFileName}`;

    return this.uploadFile(modelBuffer, gcsFileName, {
      contentType,
      metadata: {
        type: '3d_model',
        originalName: fileName
      }
    });
  }

  /**
   * Upload a file from a URL
   * @param {string} fileUrl - The URL of the file to download and upload
   * @param {string} fileName - The name for the file in GCS
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - The public URL of the uploaded file
   */
  async uploadFromUrl(fileUrl, fileName, options = {}) {
    try {
      // Download the file from the URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file from ${fileUrl}: ${response.statusText}`);
      }

      const fileBuffer = Buffer.from(await response.arrayBuffer());
      
      // Determine content type from response headers or file extension
      let contentType = response.headers.get('content-type') || 'application/octet-stream';
      if (fileName.endsWith('.glb')) {
        contentType = 'model/gltf-binary';
      } else if (fileName.endsWith('.gltf')) {
        contentType = 'model/gltf+json';
      } else if (fileName.endsWith('.stl')) {
        contentType = 'application/sla';
      }

      return this.uploadFile(fileBuffer, fileName, {
        ...options,
        contentType,
        metadata: {
          sourceUrl: fileUrl,
          downloadedAt: new Date().toISOString(),
          ...options.metadata
        }
      });

    } catch (error) {
      logger.error(`Failed to upload file from URL ${fileUrl}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   * @param {string} fileName - The name of the file to delete
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteFile(fileName) {
    if (!this.storage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      await file.delete();
      logger.info(`File deleted successfully: ${fileName}`);
      return true;

    } catch (error) {
      logger.error(`Failed to delete file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in the bucket
   * @param {string} fileName - The name of the file to check
   * @returns {Promise<boolean>} - True if file exists
   */
  async fileExists(fileName) {
    if (!this.storage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      const [exists] = await file.exists();
      return exists;

    } catch (error) {
      logger.error(`Failed to check if file exists ${fileName}:`, error);
      return false;
    }
  }

  /**
   * Get file metadata
   * @param {string} fileName - The name of the file
   * @returns {Promise<Object>} - File metadata
   */
  async getFileMetadata(fileName) {
    if (!this.storage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      const [metadata] = await file.getMetadata();
      return metadata;

    } catch (error) {
      logger.error(`Failed to get metadata for file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * List files in the bucket with optional prefix
   * @param {string} prefix - Optional prefix to filter files
   * @returns {Promise<Array>} - List of files
   */
  async listFiles(prefix = '') {
    if (!this.storage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({ prefix });
      
      return files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        timeCreated: file.metadata.timeCreated,
        publicUrl: `https://storage.googleapis.com/${this.bucketName}/${file.name}`
      }));

    } catch (error) {
      logger.error(`Failed to list files with prefix ${prefix}:`, error);
      throw error;
    }
  }

  /**
   * Generate a signed URL for private file access
   * @param {string} fileName - The name of the file
   * @param {Object} options - Signed URL options
   * @returns {Promise<string>} - The signed URL
   */
  async getSignedUrl(fileName, options = {}) {
    if (!this.storage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + (options.expiresIn || 60 * 60 * 1000), // Default 1 hour
        ...options
      });

      return signedUrl;

    } catch (error) {
      logger.error(`Failed to generate signed URL for file ${fileName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const gcsService = new GCSService();
export default gcsService;
