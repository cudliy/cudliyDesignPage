// Cloudflare R2 Storage Service

export class CloudflareR2Service {
  /**
   * Upload a file to Cloudflare R2 via backend API
   */
  async uploadFile(file: File): Promise<string> {
    try {
      console.log('Uploading file to R2:', file.name);
      
      const formData = new FormData();
      formData.append('images', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/upload-images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.urls && result.urls.length > 0) {
        console.log('R2 upload successful:', result.urls[0]);
        return result.urls[0];
      } else {
        throw new Error('Upload failed: No URL returned');
      }
    } catch (error) {
      console.error('Error uploading to R2:', error);
      
      // Fallback to base64 conversion
      console.log('Falling back to base64 conversion');
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }

  /**
   * Convert blob URL to File object (with better error handling)
   */
  async blobUrlToFile(blobUrl: string, fileName: string): Promise<File> {
    try {
      // First try to fetch the blob URL
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Empty blob received');
      }
      
      return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
    } catch (error) {
      console.error('Error converting blob URL to file:', error);
      throw error;
    }
  }

  /**
   * Convert base64 data URL to Blob
   */
  dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Process and upload images (now expects base64 data URLs)
   */
  async processAndUploadImages(images: Array<{ id: string; url: string; selected: boolean }>): Promise<Array<{ id: string; url: string; selected: boolean }>> {
    try {
      console.log('Processing images for R2 upload...');
      console.log(`Processing ${images.length} images`);
      
      const processedImages = await Promise.all(
        images.map(async (image, index) => {
          try {
            if (image.url.startsWith('data:')) {
              console.log(`Uploading base64 image ${index + 1} to R2...`);
              
              // Convert base64 data URL to Blob directly (no fetch needed)
              const blob = this.dataURLToBlob(image.url);
              const file = new File([blob], `image-${index}.jpg`, { type: blob.type || 'image/jpeg' });
              
              console.log(`File ${index + 1} size:`, file.size, 'bytes');
              
              // Upload to R2
              const uploadedUrl = await this.uploadFile(file);
              
              console.log(`Image ${index + 1} uploaded to R2 successfully:`, uploadedUrl);
              
              return {
                ...image,
                url: uploadedUrl
              };
            } else if (image.url.startsWith('blob:')) {
              console.log(`Converting and uploading blob URL ${index + 1}...`);
              
              // Convert blob URL to File
              const file = await this.blobUrlToFile(image.url, `image-${index}.jpg`);
              console.log(`File ${index + 1} size:`, file.size, 'bytes');
              
              // Upload to R2
              const uploadedUrl = await this.uploadFile(file);
              
              console.log(`Image ${index + 1} uploaded to R2 successfully:`, uploadedUrl);
              
              return {
                ...image,
                url: uploadedUrl
              };
            }
            
            // Already a regular URL
            console.log(`Image ${index + 1} already processed`);
            return image;
          } catch (error) {
            console.error(`Error processing image ${index + 1}:`, error);
            
            // Fallback: keep original URL (might be base64)
            console.log(`Image ${index + 1} keeping original URL as fallback`);
            return image;
          }
        })
      );

      console.log('All images processed for R2');
      console.log('Final URLs:', processedImages.map(img => ({ 
        id: img.id, 
        urlType: img.url.startsWith('data:') ? 'base64' : img.url.startsWith('https://') ? 'R2' : 'unknown'
      })));
      
      return processedImages;
    } catch (error) {
      console.error('Error processing images for R2:', error);
      throw error;
    }
  }
}

export const r2Service = new CloudflareR2Service();