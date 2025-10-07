import dotenv from 'dotenv';
dotenv.config();

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import axios from 'axios';
import logger from '../utils/logger.js';

class StorageService {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    this.bucketName = process.env.AWS_BUCKET_NAME;
  }

  async uploadFile(buffer, filename, contentType, metadata = {}) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
        ACL: 'public-read',
        Metadata: metadata
      });

      await this.s3Client.send(command);

      const publicUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
      logger.info(`File uploaded successfully to S3: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      logger.error('S3 Upload Error:', error);
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
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filename
      });
      
      await this.s3Client.send(command);
      logger.info(`File deleted from S3: ${filename}`);
    } catch (error) {
      logger.error('File Deletion Error:', error);
      throw error;
    }
  }

  async getSignedUrl(filename, expiration = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filename
      });
      
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiration
      });
      
      return url;
    } catch (error) {
      logger.error('Signed URL Error:', error);
      throw error;
    }
  }
}

export default new StorageService();
