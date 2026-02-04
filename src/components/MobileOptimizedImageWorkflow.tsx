import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import type { GenerateImagesRequest, Generate3DModelRequest } from '../services/api';
import { useUsageLimits } from '../hooks/useUsageLimits';
import contentFilter from '../utils/contentFilter';
// import { CloudflareR2Service } from '../services/cloudflareR2'; // Ready for future use
import { toast } from '@/lib/sonner';

interface MobileOptimizedImageWorkflowProps {
  prompt: string;
  enhancedPrompt?: string;
  quality?: 'fast' | 'medium' | 'good';
  onComplete: (designId: string, designData?: any) => void;
  onError: (error: string) => void;
  generationTrigger?: number; // Use a counter to trigger generation
  showImageUpload?: boolean; // New prop to show image upload functionality
}

interface GeneratedImage {
  url: string;
  prompt: string;
  index: number;
}

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  selected: boolean;
}

export default function MobileOptimizedImageWorkflow({ 
  prompt, 
  enhancedPrompt, 
  quality = 'medium', 
  onComplete, 
  onError,
  generationTrigger = 0,
  showImageUpload = false
}: MobileOptimizedImageWorkflowProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [creationId, setCreationId] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastTriggerCount, setLastTriggerCount] = useState(0); // Track trigger count

  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);
  // const r2Service = new CloudflareR2Service(); // Ready for future use

  const userId = sessionStorage.getItem('user_id') || '';
  
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('user_id');
    const storedToken = sessionStorage.getItem('token');
    if (!storedUserId || !storedToken) {
      window.location.href = '/signin';
    }
  }, []);

  const { canGenerateImages, canGenerateModels, checkLimits } = useUsageLimits(userId);

  const get3DOptions = (quality: 'fast' | 'medium' | 'good') => {
    switch (quality) {
      case 'fast':
        return {
          texture_size: 1024 as const,
          mesh_simplify: 0.3,
          ss_sampling_steps: 15,
          slat_sampling_steps: 4,
          ss_guidance_strength: 7.5,
          slat_guidance_strength: 3
        };
      case 'medium':
        return {
          texture_size: 2048 as const,
          mesh_simplify: 0.2,
          ss_sampling_steps: 30,
          slat_sampling_steps: 15,
          ss_guidance_strength: 7.5,
          slat_guidance_strength: 3
        };
      case 'good':
        return {
          texture_size: 4096 as const,
          mesh_simplify: 0.1,
          generate_normal: true,
          save_gaussian_ply: true,
          ss_sampling_steps: 50,
          slat_sampling_steps: 25,
          ss_guidance_strength: 7.5,
          slat_guidance_strength: 3,
          return_no_background: true,
          preserve_colors: true,
          enhance_colors: true,
          color_accuracy: "high"
        };
      default:
        return {
          texture_size: 2048 as const,
          mesh_simplify: 0.2
        };
    }
  };

  const generateImages = useCallback(async () => {
    const finalPrompt = enhancedPrompt || prompt;
    
    if (!finalPrompt.trim()) {
      onError('Please enter a prompt first');
      return;
    }

    // CLIENT-SIDE CONTENT FILTERING
    const contentCheck = contentFilter.checkContent(finalPrompt);
    if (contentCheck.isInappropriate) {
      onError(`${contentCheck.reason} Try: ${contentCheck.suggestions?.join(', ') || 'family-friendly descriptions'}`);
      return;
    }

    if (!canGenerateImages) {
      onError(`You have reached your monthly image generation limit. Please upgrade your plan to continue.`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]); // Clear previous images
    setSelectedImageIndex(null);
    setSessionId(''); // Clear previous session
    setCreationId(''); // Clear previous creation ID

    try {
      const newCreationId = `creation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      setCreationId(newCreationId);
      
      const request: GenerateImagesRequest = {
        text: finalPrompt,
        user_id: (() => {
          const authed = sessionStorage.getItem('user_id');
          if (authed) return authed;
          const storedUserId = sessionStorage.getItem('guest_user_id');
          if (storedUserId) return storedUserId;
          const newUserId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          sessionStorage.setItem('guest_user_id', newUserId);
          return newUserId;
        })(),
        creation_id: newCreationId,
        color: '#FF6B6B',
        size: 'M',
        style: 'realistic',
        material: 'plastic',
        production: 'digital',
        details: []
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      try {
        const response = await apiService.generateImages(request);
        
        console.log('ðŸ“¥ API Response:', response);
        console.log('ðŸ“¥ Images received:', response.data?.images?.length);
        
        if (response.success && response.data) {


          
          setGeneratedImages(response.data.images);
          setSessionId(response.data.session_id);
          

          
          try {
            await apiService.trackUsage(userId, 'image', response.data.images.length);
            await checkLimits(true);

          } catch (trackingError) {
            console.warn('âš ï¸ Usage tracking failed:', trackingError);
            try {
              await checkLimits(true);
            } catch (limitsError) {
              console.warn('âš ï¸ Limits check failed:', limitsError);
            }
          }
        } else {
          throw new Error(response.error || 'Failed to generate images');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onError('Image generation timed out. Please try again with a simpler prompt.');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to generate images');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [enhancedPrompt, prompt, onError, canGenerateImages, userId, checkLimits]);

  // Removed useEffects that were causing unnecessary re-renders

  // Generate when trigger count changes
  useEffect(() => {
    if (generationTrigger > lastTriggerCount && prompt.trim() && !isGenerating) {

      setLastTriggerCount(generationTrigger);
      generateImages();
    }
  }, [generationTrigger, lastTriggerCount, prompt, isGenerating, generateImages]);

  const selectImage = (index: number) => {
    console.log('ðŸ–±ï¸ Image selected:', index);
    setSelectedImageIndex(index);
  };

  const generate3DModel = async () => {
    const imageIndex = selectedImageIndex !== null ? selectedImageIndex : 0;
    
    if (generatedImages.length === 0) {
      onError('No images available to generate 3D model');
      return;
    }

    if (!canGenerateModels) {
      onError(`You have reached your monthly model generation limit. Please upgrade your plan to continue.`);
      return;
    }

    try {
      const selectedImage = generatedImages[imageIndex];
      
      const userId = sessionStorage.getItem('user_id') || sessionStorage.getItem('guest_user_id') || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      if (!sessionStorage.getItem('guest_user_id') && !sessionStorage.getItem('user_id')) {
        sessionStorage.setItem('guest_user_id', userId);
      }
      
      const request: Generate3DModelRequest = {
        image_url: selectedImage.url,
        session_id: sessionId,
        user_id: userId,
        creation_id: creationId,
        options: {
          generate_color: true,
          generate_model: true,
          randomize_seed: true,
          ...get3DOptions(quality)
        }
      };

      const response = await apiService.generate3DModel(request);
      
      if (response.success && response.data) {
        try {
          await apiService.trackUsage(userId, 'model', 1);
          await checkLimits(true);
        } catch (trackingError) {
          // Don't fail the generation if tracking fails
        }
        
        setGeneratedImages(prev => prev.map((img, index) => 
          index === imageIndex 
            ? { ...img, processed: true }
            : img
        ));
        
        // Don't navigate automatically, let parent handle it
        // window.location.href = `/design/${response.data.design_id}`;
        onComplete(response.data.design_id, response.data);
      } else {
        throw new Error(response.error || 'Failed to generate 3D model');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to generate 3D model');
    }
  };

  // Image upload functions
  const handleFileUpload = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error(`${file.name} is too large. Maximum size is 100MB.`);
        return false;
      }
      return true;
    });

    if (uploadedImages.length + validFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImages = validFiles.map(file => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      url: URL.createObjectURL(file),
      selected: false
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    setIsUploadMode(true);
    toast.success(`${validFiles.length} image(s) uploaded successfully`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const toggleImageSelection = (imageId: string) => {
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const selectAllImages = () => {
    setUploadedImages(prev => prev.map(img => ({ ...img, selected: true })));
  };

  const deselectAllImages = () => {
    setUploadedImages(prev => prev.map(img => ({ ...img, selected: false })));
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      if (updated.length === 0) {
        setIsUploadMode(false);
      }
      return updated;
    });
  };

  const handleImageShare = async (selectedImages: UploadedImage[]) => {
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image to share');
      return;
    }

    setIsUploading(true);
    try {
      // Mobile-optimized image processing
      const convertedImages = await Promise.all(
        selectedImages.map(async (img, index) => {
          try {
            if (img.url.startsWith('blob:')) {
              // Mobile-specific blob handling
              const response = await fetch(img.url);
              if (!response.ok) {
                throw new Error(`Failed to fetch blob: ${response.statusText}`);
              }
              
              const blob = await response.blob();
              
              // Check blob size for mobile memory constraints
              if (blob.size > 100 * 1024 * 1024) { // 100MB limit for mobile
                throw new Error(`Image ${index + 1} is too large for mobile sharing`);
              }
              
              return new Promise<UploadedImage>((resolve, reject) => {
                const reader = new FileReader();
                
                // Set timeout for mobile FileReader
                const timeout = setTimeout(() => {
                  reject(new Error('FileReader timeout on mobile'));
                }, 30000); // 30 second timeout
                
                reader.onload = () => {
                  clearTimeout(timeout);
                  if (reader.result && typeof reader.result === 'string') {
                    // Validate base64 result
                    if (reader.result.startsWith('data:image/')) {
                      resolve({
                        ...img,
                        url: reader.result,
                        selected: true
                      });
                    } else {
                      reject(new Error('Invalid base64 format'));
                    }
                  } else {
                    reject(new Error('FileReader result is null or invalid'));
                  }
                };
                
                reader.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error(`FileReader error for image ${index + 1}`));
                };
                
                reader.onabort = () => {
                  clearTimeout(timeout);
                  reject(new Error(`FileReader aborted for image ${index + 1}`));
                };
                
                // Start reading
                try {
                  reader.readAsDataURL(blob);
                } catch (error) {
                  clearTimeout(timeout);
                  reject(new Error(`Failed to start FileReader: ${error}`));
                }
              });
            }
            return { ...img, selected: true };
          } catch (error) {
            console.error(`Error processing image ${index + 1}:`, error);
            throw new Error(`Failed to process image ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );

      // Create share data with mobile-optimized structure
      const shareData = {
        type: 'uploaded',
        images: convertedImages,
        userId: sessionStorage.getItem('user_id') || 'anonymous',
        createdAt: new Date().toISOString(),
        platform: 'mobile', // Flag for mobile handling
        version: '1.0'
      };

      // Mobile-specific storage handling
      try {
        const shareDataString = JSON.stringify(shareData);
        
        // Check sessionStorage quota (mobile browsers have smaller limits)
        if (shareDataString.length > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('Images too large for mobile storage. Please select fewer or smaller images.');
        }
        
        // Clear any existing share data first
        sessionStorage.removeItem('share_images');
        
        // Store with retry mechanism for mobile
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            sessionStorage.setItem('share_images', shareDataString);
            
            // Verify storage worked
            const stored = sessionStorage.getItem('share_images');
            if (stored && stored.length === shareDataString.length) {
              break; // Success
            } else {
              throw new Error('Storage verification failed');
            }
          } catch (storageError) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw new Error(`Failed to store images after ${maxRetries} attempts: ${storageError}`);
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
      } catch (storageError) {
        console.error('Storage error:', storageError);
        throw new Error('Failed to prepare images for sharing. Please try with fewer or smaller images.');
      }

      // Mobile-optimized navigation with longer delay
      setTimeout(() => {
        try {
          // Use location.href for better mobile compatibility
          window.location.href = '/share/images';
        } catch (navError) {
          console.error('Navigation error:', navError);
          toast.error('Navigation failed. Please try again.');
        }
      }, 200); // Longer delay for mobile
      
    } catch (error) {
      console.error('Mobile image sharing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Mobile sharing failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const selectedImages = uploadedImages.filter(img => img.selected);
  const hasSelectedImages = selectedImages.length > 0;

  // Show image upload interface if enabled and in upload mode
  if (showImageUpload && isUploadMode) {
    return (
      <div className="w-full h-full bg-[#212121] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={() => {
              setIsUploadMode(false);
              setUploadedImages([]);
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-white">
              Uploaded Image ({uploadedImages.length}/5) {selectedImages.length} selected
            </h2>
          </div>
          
          {/* Action buttons - exactly as shown in image */}
          <div className="flex items-center gap-3">
            {/* Delete All Icon */}
            <button
              onClick={() => setUploadedImages([])}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Delete all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            {/* Select/Deselect Toggle Icon */}
            <button
              onClick={() => {
                const allSelected = selectedImages.length === uploadedImages.length;
                if (allSelected) {
                  deselectAllImages();
                } else {
                  selectAllImages();
                }
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title={selectedImages.length === uploadedImages.length ? "Deselect all" : "Select all"}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {/* Share Selected Button */}
            <button
              onClick={() => {
                if (selectedImages.length > 0) {
                  handleImageShare(selectedImages);
                }
              }}
              disabled={selectedImages.length === 0}
              className="px-3 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Share selected
            </button>
          </div>
        </div>

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative">
                <div
                  className="relative rounded-lg overflow-hidden cursor-pointer transition-all"
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <img
                    src={image.url}
                    alt="Uploaded"
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Selection overlay */}
                  <div className={`absolute inset-0 transition-all ${
                    image.selected ? 'bg-white/20' : 'bg-black/0 hover:bg-black/10'
                  }`} />
                  
                  {/* Checkbox */}
                  <div className="absolute top-2 right-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      image.selected 
                        ? 'bg-white' 
                        : 'bg-black/50'
                    }`}>
                      {image.selected && (
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            {/* Add more images button */}
            <div
              className={`rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragOver ? 'bg-white/10' : 'bg-gray-800/30 hover:bg-gray-800/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <svg className="w-8 h-8 text-white/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-white/50 text-sm">Add More</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        {hasSelectedImages && (
          <div className="border-t border-white/10">
            <div className="p-4">
              <button
                onClick={() => {
                  console.log('Share Selected button clicked (MobileOptimized)');
                  console.log('Selected images:', selectedImages);
                  console.log('Is uploading:', isUploading);
                  handleImageShare(selectedImages);
                }}
                disabled={isUploading}
                className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    Share Selected ({selectedImages.length})
                  </>
                )}
              </button>
            </div>
            
            {/* Social Share Icons */}
            <div className="flex justify-center gap-4 pb-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Check out these amazing images!')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Share on WhatsApp"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                </svg>
              </a>
              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Share on Instagram"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pink-500">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
                </svg>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Share on Facebook"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files);
            }
          }}
          className="hidden"
        />
      </div>
    );
  }

  if ((isGenerating && generatedImages.length === 0) || isPrinting) {
    return (
      <div className="text-center flex items-center justify-center py-8 min-h-[60vh] md:h-full bg-[#212121]">
        <div className="flex flex-col items-center">
          <img
            src="/GIFS/Loading-State.gif"
            alt="Generating Images"
            className="object-contain mb-8 w-32 h-32 md:w-48 md:h-48 lg:w-96 lg:h-96"
          />
          <span className="text-white font-medium text-base md:text-lg lg:text-xl">
            {isPrinting ? 'Creating 3D Model...' : 'Generating Images...'}
          </span>
        </div>
      </div>
    );
  }
  
  if (generatedImages.length > 0) {
    console.log('ðŸ–¼ï¸ Rendering images. Total count:', generatedImages.length);
    console.log('ðŸ–¼ï¸ Images to render:', generatedImages.slice(0, 3));
    console.log('ðŸ–¼ï¸ All images:', generatedImages);
    
    return (
      <div className="w-full h-full flex items-center relative bg-[#212121]" style={{
        justifyContent: 'flex-start',
        paddingLeft: '2px',
        paddingRight: '8px',
        paddingTop: '8px',
        paddingBottom: '8px'
      }}>
        <div className="grid grid-cols-2 auto-rows-fr" style={{ 
          width: window.innerWidth >= 1470 ? 'min(1300px, 95vw)' : 'min(1130px, 95vw)',
          maxHeight: '100%',
          gap: '2px',
          gridTemplateRows: 'repeat(auto-fit, minmax(280px, 1fr))'
        }}>
          {generatedImages.length > 0 && generatedImages.slice(0, 3).map((image, index) => (
            <div
              key={index}
              className={`flex items-center justify-center transition-all duration-700 ease-out overflow-hidden cursor-pointer group ${
                selectedImageIndex === index ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => selectImage(index)}
              style={{ 
                transitionDelay: `${800 + index * 100}ms`,
                borderRadius: '10px',
                backgroundColor: '#1a1a1a',
                border: '0.25px solid #333333'
              }}
            >
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-[10px]">
                <img 
                  src={image.url} 
                  alt={`Generated image ${index + 1}`} 
                  className="w-full h-full object-cover relative z-10"
                  loading="eager"
                  style={{ imageRendering: '-webkit-optimize-contrast' as any }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 rounded-[10px]" style={{
                  backgroundColor: 'rgba(23, 23, 23, 0.31)',
                  backdropFilter: 'blur(4px)'
                }}>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(index);
                      setIsPrinting(true);
                      try {
                        await generate3DModel();
                      } catch (error) {
                        console.error('3D generation failed:', error);
                      } finally {
                        setIsPrinting(false);
                      }
                    }}
                    className="flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      width: '162px',
                      height: '54px',
                      borderRadius: '27px',
                      border: '2px solid #313131',
                      backgroundColor: 'transparent',
                      color: '#2C2E3D',
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 700,
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      textAlign: 'center' as const
                    }}
                  >
                    View 360°
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-center">
            {/* Empty space */}
          </div>
        </div>
      </div>
    );
  }

  return null;
}