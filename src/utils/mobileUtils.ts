// Mobile utility functions for better mobile compatibility

export const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOSDevice = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const isAndroidDevice = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

export const getMobileStorageLimit = (): number => {
  // Conservative storage limits for mobile devices
  if (isIOSDevice()) {
    return 2 * 1024 * 1024; // 2MB for iOS (very conservative)
  } else if (isAndroidDevice()) {
    return 3 * 1024 * 1024; // 3MB for Android
  }
  return 5 * 1024 * 1024; // 5MB for other mobile devices
};

export const compressImageForMobile = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions to reduce file size
      let { width, height } = img;
      const maxDimension = 1200; // Max dimension for mobile
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        0.8 // 80% quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
};

export const validateMobileStorage = (dataSize: number): { isValid: boolean; message?: string } => {
  const limit = getMobileStorageLimit();
  
  if (dataSize > limit) {
    return {
      isValid: false,
      message: `Data too large for mobile storage (${Math.round(dataSize / 1024 / 1024)}MB > ${Math.round(limit / 1024 / 1024)}MB). Please select fewer or smaller images.`
    };
  }
  
  return { isValid: true };
};

export const clearMobileStorage = (): void => {
  try {
    // Clear specific mobile-related storage
    sessionStorage.removeItem('share_images');
    
    // Clear any large items that might be taking up space
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      const item = sessionStorage.getItem(key);
      if (item && item.length > 100000) { // Items larger than 100KB
        console.log(`Clearing large storage item: ${key} (${Math.round(item.length / 1024)}KB)`);
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error clearing mobile storage:', error);
  }
};