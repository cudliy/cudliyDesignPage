import dotenv from 'dotenv'
dotenv.config()
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import axios from 'axios';
import logger from '../utils/logger.js';

class StorageService {
  constructor() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
    });
    this.bucket = this.storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
  }

  async uploadFile(buffer, filename, contentType, metadata = {}) {
    try {
      const file = this.bucket.file(filename);
      const stream = file.createWriteStream({
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000',
          ...metadata
        },
        public: true
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          logger.error('GCS Upload Error:', error);
          reject(error);
        });
        
        stream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filename}`;
          logger.info(`File uploaded successfully: ${publicUrl}`);
          resolve(publicUrl);
        });
        
        stream.end(buffer);
      });
    } catch (error) {
      logger.error('Storage Service Error:', error);
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
      await this.bucket.file(filename).delete();
      logger.info(`File deleted: ${filename}`);
    } catch (error) {
      logger.error('File Deletion Error:', error);
      throw error;
    }
  }

  async getSignedUrl(filename, expiration = 3600) {
    try {
      const [url] = await this.bucket.file(filename).getSignedUrl({
        action: 'read',
        expires: Date.now() + expiration * 1000
      });
      return url;
    } catch (error) {
      logger.error('Signed URL Error:', error);
      throw error;
    }
  }
}

export default new StorageService();
