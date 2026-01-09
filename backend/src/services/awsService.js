import dotenv from 'dotenv';
dotenv.config();

import logger from '../utils/logger.js';

class R2Service {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.bucketName = process.env.CLOUDFLARE_BUCKET_NAME || 'cudily-main';
    
    if (!this.accountId || !this.apiToken) {
      logger.error('Cloudflare R2 credentials not found. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.');
      throw new Error('Cloudflare R2 not configured');
    }
    
    logger.info(`Cloudflare R2 initialized with bucket: ${this.bucketName}`);
  }

  /**
   * Upload a file to Cloudflare R2
   * @param {Buffer|Stream} fileData - The file data to upload
   * @param {string} fileName - The name of the file in the bucket
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - The public URL of the uploaded file
   */
  async uploadFile(fileData, fileName, options = {}) {
    try {
      const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${fileName}`;
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': options.contentType || 'application/octet-stream',
        },
        body: fileData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare R2 upload failed: ${response.statusText} - ${errorText}`);
      }

      const publicUrl = `https://pub-1ed89e0d7a8c4a12b06428c0c9047120.r2.dev/${fileName}`;
      logger.info(`File uploaded successfully to Cloudflare R2: ${fileName} -> ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      logger.error(`Failed to upload file ${fileName} to Cloudflare R2:`, error);
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
    const r2FileName = `images/${timestamp}_${sanitizedFileName}`;

    return this.uploadFile(imageBuffer, r2FileName, {
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
    const r2FileName = `models/${timestamp}_${sanitizedFileName}`;

    return this.uploadFile(modelBuffer, r2FileName, {
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
   * @param {string} fileName - The name for the file in R2
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - The public URL of the uploaded file
   */
  async uploadFromUrl(fileUrl, fileName, options = {}) {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file from ${fileUrl}: ${response.statusText}`);
      }

      const fileBuffer = Buffer.from(await response.arrayBuffer());
      
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
   * Delete a file from Cloudflare R2
   * @param {string} fileName - The name of the file to delete
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteFile(fileName) {
    try {
      const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${fileName}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Cloudflare R2 delete failed: ${response.statusText}`);
      }

      logger.info(`File deleted successfully from Cloudflare R2: ${fileName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in R2
   * @param {string} fileName - The name of the file to check
   * @returns {Promise<boolean>} - True if file exists
   */
  async fileExists(fileName) {
    try {
      const checkUrl = `https://pub-1ed89e0d7a8c4a12b06428c0c9047120.r2.dev/${fileName}`;
      const response = await fetch(checkUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata (limited support for R2)
   * @param {string} fileName - The name of the file
   * @returns {Promise<Object>} - File metadata
   */
  async getFileMetadata(fileName) {
    return {
      publicUrl: `https://pub-1ed89e0d7a8c4a12b06428c0c9047120.r2.dev/${fileName}`,
      storage: 'cloudflare-r2',
      fileName: fileName
    };
  }

  /**
   * Get public URL for a file
   * @param {string} fileName - The name of the file
   * @returns {string} - The public URL
   */
  getPublicUrl(fileName) {
    return `https://pub-1ed89e0d7a8c4a12b06428c0c9047120.r2.dev/${fileName}`;
  }

  /**
   * Generate a signed URL (for R2, returns public URL)
   * @param {string} fileName - The name of the file
   * @param {Object} options - Options (not used for R2 public URLs)
   * @returns {Promise<string>} - The public URL
   */
  async getSignedUrl(fileName, options = {}) {
    return this.getPublicUrl(fileName);
  }
}

// Export singleton instance
export const r2Service = new R2Service();
export default r2Service;

