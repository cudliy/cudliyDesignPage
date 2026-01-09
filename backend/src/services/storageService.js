import dotenv from 'dotenv';
dotenv.config();

import sharp from 'sharp';
import axios from 'axios';
import logger from '../utils/logger.js';

class StorageService {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.bucketName = process.env.CLOUDFLARE_BUCKET_NAME || 'cudily-main';
    
    if (!this.accountId || !this.apiToken) {
      logger.error('Cloudflare R2 credentials not found. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.');
      throw new Error('Cloudflare R2 not configured');
    }
    
    logger.info(`Storage Service using Cloudflare R2 with bucket: ${this.bucketName}`);
  }

  async uploadFile(buffer, filename, contentType, metadata = {}) {
    try {
      const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${filename}`;
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': contentType,
        },
        body: buffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare R2 upload failed: ${response.statusText} - ${errorText}`);
      }

      const publicUrl = `https://pub-1ed89e0d7a8c4a12b06428c0c9047120.r2.dev/${filename}`;
      logger.info(`File uploaded successfully to Cloudflare R2: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      logger.error('Cloudflare R2 Upload Error:', error);
      throw error;
    }
  }

  async uploadImage(buffer, filename, options = {}) {
    try {
      // Process image with Sharp
      let processedBuffer = buffer;
      
      if (options.resize) {
        processedBuffer = await sharp(buffer)
          .resize(options.resize.width, options.resize.height, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: options.quality || 90 })
          .toBuffer();
      }

      // Generate thumbnail if requested
      let thumbnailUrl = null;
      if (options.generateThumbnail) {
        const thumbnailBuffer = await sharp(processedBuffer)
          .resize(300, 300, { fit: 'inside' })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const thumbnailFilename = `thumbnails/thumb-${filename}`;
        thumbnailUrl = await this.uploadFile(thumbnailBuffer, thumbnailFilename, 'image/jpeg');
      }

      const imageUrl = await this.uploadFile(processedBuffer, filename, 'image/jpeg');

      return {
        imageUrl,
        thumbnailUrl,
        filename
      };
    } catch (error) {
      logger.error('Image Upload Error:', error);
      throw error;
    }
  }

  async downloadFile(url) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('File Download Error:', error);
      throw error;
    }
  }

  async deleteFile(filename) {
    try {
      const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${filename}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Cloudflare R2 delete failed: ${response.statusText}`);
      }

      logger.info(`File deleted from Cloudflare R2: ${filename}`);
    } catch (error) {
      logger.error('File Deletion Error:', error);
      throw error;
    }
  }

  async getSignedUrl(filename, expiration = 3600) {
    // For Cloudflare R2, return the public URL
    return `https://pub-1ed89e0d7a8c4a12b06428c0c9047120.r2.dev/${filename}`;
  }
}

export default new StorageService();
