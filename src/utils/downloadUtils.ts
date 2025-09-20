// Utility functions for downloading files

/**
 * Download a file from a URL
 * @param url - The URL of the file to download
 * @param filename - The name to save the file as
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    
    // Add to DOM temporarily and click
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
};

/**
 * Download a file by fetching it first (for CORS issues)
 * @param url - The URL of the file to download
 * @param filename - The name to save the file as
 */
export const downloadFileWithFetch = async (url: string, filename: string): Promise<void> => {
  try {
    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get the blob
    const blob = await response.blob();
    
    // Create object URL
    const blobUrl = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    
    // Add to DOM temporarily and click
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file with fetch:', error);
    throw new Error('Failed to download file');
  }
};

/**
 * Download a 3D model file
 * @param modelUrl - The URL of the 3D model
 * @param designId - The design ID for naming
 * @param fileType - The type of model file (glb, ply, etc.)
 */
export const download3DModel = async (
  modelUrl: string, 
  designId: string, 
  fileType: string = 'glb'
): Promise<void> => {
  if (!modelUrl) {
    throw new Error('No model URL provided');
  }
  
  const filename = `cudliy-design-${designId}.${fileType}`;
  
  try {
    // Try direct download first
    await downloadFile(modelUrl, filename);
  } catch (error) {
    console.warn('Direct download failed, trying with fetch:', error);
    // Fallback to fetch method for CORS issues
    await downloadFileWithFetch(modelUrl, filename);
  }
};

/**
 * Download an image file
 * @param imageUrl - The URL of the image
 * @param designId - The design ID for naming
 * @param imageIndex - The index of the image
 */
export const downloadImage = async (
  imageUrl: string, 
  designId: string, 
  imageIndex: number = 0
): Promise<void> => {
  if (!imageUrl) {
    throw new Error('No image URL provided');
  }
  
  const filename = `cudliy-design-${designId}-image-${imageIndex + 1}.jpg`;
  
  try {
    // Try direct download first
    await downloadFile(imageUrl, filename);
  } catch (error) {
    console.warn('Direct download failed, trying with fetch:', error);
    // Fallback to fetch method for CORS issues
    await downloadFileWithFetch(imageUrl, filename);
  }
};

/**
 * Download all files for a design (images and 3D model)
 * @param design - The design object
 */
export const downloadAllDesignFiles = async (design: any): Promise<void> => {
  const downloads: Promise<void>[] = [];
  
  // Download images
  if (design.images && Array.isArray(design.images)) {
    design.images.forEach((image: any, index: number) => {
      if (image.url) {
        downloads.push(downloadImage(image.url, design.id, index));
      }
    });
  }
  
  // Download 3D model
  if (design.modelFiles?.storedModelUrl || design.modelFiles?.modelFile) {
    const modelUrl = design.modelFiles?.storedModelUrl || design.modelFiles?.modelFile;
    const fileType = modelUrl?.includes('.ply') ? 'ply' : 'glb';
    downloads.push(download3DModel(modelUrl, design.id, fileType));
  }
  
  // Download PLY file if different from main model
  if (design.modelFiles?.gaussianPly && 
      design.modelFiles?.gaussianPly !== design.modelFiles?.modelFile) {
    downloads.push(download3DModel(design.modelFiles.gaussianPly, design.id, 'ply'));
  }
  
  try {
    await Promise.all(downloads);
  } catch (error) {
    console.error('Error downloading some files:', error);
    throw new Error('Failed to download some files');
  }
};

/**
 * Get file extension from URL
 * @param url - The URL to extract extension from
 */
export const getFileExtension = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop()?.toLowerCase() || 'bin';
    return extension;
  } catch {
    // Fallback for relative URLs
    const extension = url.split('.').pop()?.toLowerCase() || 'bin';
    return extension;
  }
};

/**
 * Format file size for display
 * @param bytes - File size in bytes
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
