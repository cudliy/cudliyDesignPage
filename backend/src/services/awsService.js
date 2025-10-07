import dotenv from 'dotenv';
dotenv.config();

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from '../utils/logger.js';

class AWSService {
  constructor() {
    this.s3Client = null;
    this.bucketName = process.env.AWS_BUCKET_NAME;
    this.region = process.env.AWS_REGION;
    
    this.initializeS3();
  }

  initializeS3() {
    try {
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
      }

      if (!this.bucketName) {
        throw new Error('AWS_BUCKET_NAME not found in environment variables.');
      }

      if (!this.region) {
        throw new Error('AWS_REGION not found in environment variables.');
      }

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      logger.info(`AWS S3 initialized successfully with bucket: ${this.bucketName} in region: ${this.region}`);
    } catch (error) {
      logger.error('Failed to initialize AWS S3:', error);
      throw error;
    }
  }

  /**
   * Upload a file to AWS S3
   * @param {Buffer|Stream} fileData - The file data to upload
   * @param {string} fileName - The name of the file in the bucket
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - The public URL of the uploaded file
   */
  async uploadFile(fileData, fileName, options = {}) {
    if (!this.s3Client) {
      throw new Error('AWS S3 not initialized');
    }

    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileData,
        ContentType: options.contentType || 'application/octet-stream',
        CacheControl: options.cacheControl || 'public, max-age=31536000', // 1 year cache
        ACL: 'public-read', // Make file publicly accessible
        Metadata: {
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      };

      // Use multipart upload for better performance and reliability
      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams
      });

      await upload.done();

      // Generate public URL
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
      
      logger.info(`File uploaded successfully to S3: ${fileName} -> ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      logger.error(`Failed to upload file ${fileName} to S3:`, error);
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
    const s3FileName = `images/${timestamp}_${sanitizedFileName}`;

    return this.uploadFile(imageBuffer, s3FileName, {
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
    const s3FileName = `models/${timestamp}_${sanitizedFileName}`;

    return this.uploadFile(modelBuffer, s3FileName, {
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
   * @param {string} fileName - The name for the file in S3
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
   * Delete a file from AWS S3
   * @param {string} fileName - The name of the file to delete
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteFile(fileName) {
    if (!this.s3Client) {
      throw new Error('AWS S3 not initialized');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });
      
      await this.s3Client.send(command);
      logger.info(`File deleted successfully from S3: ${fileName}`);
      return true;

    } catch (error) {
      logger.error(`Failed to delete file ${fileName} from S3:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in the bucket
   * @param {string} fileName - The name of the file to check
   * @returns {Promise<boolean>} - True if file exists
   */
  async fileExists(fileName) {
    if (!this.s3Client) {
      throw new Error('AWS S3 not initialized');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });
      
      await this.s3Client.send(command);
      return true;

    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
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
    if (!this.s3Client) {
      throw new Error('AWS S3 not initialized');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });
      
      const response = await this.s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
        etag: response.ETag
      };

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
    if (!this.s3Client) {
      throw new Error('AWS S3 not initialized');
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix
      });
      
      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      return response.Contents.map(file => ({
        name: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        etag: file.ETag,
        publicUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${file.Key}`
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
    if (!this.s3Client) {
      throw new Error('AWS S3 not initialized');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });
      
      const expiresIn = options.expiresIn || 3600; // Default 1 hour in seconds
      
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn
      });

      return signedUrl;

    } catch (error) {
      logger.error(`Failed to generate signed URL for file ${fileName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const awsService = new AWSService();
export default awsService;

