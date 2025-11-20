import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type { GenerateImagesRequest, Generate3DModelRequest } from '../services/api';
import { useUsageLimits } from '../hooks/useUsageLimits';

interface ImageGenerationWorkflowProps {
  prompt: string;
  enhancedPrompt?: string; // Strategic Enhancement: Accept enhanced prompt
  quality?: 'fast' | 'medium' | 'good'; // Quality setting for 3D generation
  onComplete: (designId: string) => void;
  onError: (error: string) => void;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  index: number;
}

export default function ImageGenerationWorkflow({ prompt, enhancedPrompt, quality = 'medium', onComplete, onError }: ImageGenerationWorkflowProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIndex, setIsSelectedImageIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [creationId, setCreationId] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

    // Get user ID for usage limits (authenticated users only)
    const userId = sessionStorage.getItem('user_id') || '';
    const token = sessionStorage.getItem('token');
    
    // Redirect to login if not authenticated
    useEffect(() => {
      if (!userId || !token) {
        window.location.href = '/signin';
      }
    }, [userId, token]);

  const {
    canGenerateImages,
    canGenerateModels,
    checkLimits
  } = useUsageLimits(userId);

  // Get 3D generation options based on quality setting
  const get3DOptions = (quality: 'fast' | 'medium' | 'good') => {
    switch (quality) {
      case 'fast':
        return {
          // Fast: fal.ai Hunyuan3D v2 mini/turbo
          texture_size: 1024 as const,
          mesh_simplify: 0.3,
          ss_sampling_steps: 15,
          slat_sampling_steps: 4,
          ss_guidance_strength: 7.5,
          slat_guidance_strength: 3
        };
      case 'medium':
        return {
          // Medium: fal.ai TripoSR
          texture_size: 2048 as const,
          mesh_simplify: 0.2,
          ss_sampling_steps: 30,
          slat_sampling_steps: 15,
          ss_guidance_strength: 7.5,
          slat_guidance_strength: 3
        };
      case 'good':
        return {
          // Good: Replicate Trellis (highest quality)
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

  const handleGenerateImages = useCallback(async () => {
    // Strategic Enhancement: Use enhanced prompt if available, otherwise fallback to original
    const finalPrompt = enhancedPrompt || prompt;
    
    if (!finalPrompt.trim()) {
      onError('Please enter a prompt first');
      return;
    }

    // Check usage limits before generating images
    if (!canGenerateImages) {
      onError(`You have reached your monthly image generation limit. Please upgrade your plan to continue.`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setIsSelectedImageIndex(null);

    try {
      // Generate a unique creation ID
      const newCreationId = `creation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      setCreationId(newCreationId);
      
      const request: GenerateImagesRequest = {
        text: finalPrompt, // Strategic Enhancement: Send enhanced prompt to backend
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

      // Add timeout and progress tracking
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

      try {
        const response = await apiService.generateImages(request);
        
        if (response.success && response.data) {
          setGeneratedImages(response.data.images);
          setSessionId(response.data.session_id);
          
          // Track usage after successful generation (non-blocking for Studio users)
          try {
            await apiService.trackUsage(userId, 'image', response.data.images.length);
            // Force refresh usage limits to get updated counts immediately
            await checkLimits(true);
          } catch (trackingError) {
            // Don't fail the generation if tracking fails - Studio users have unlimited access
            // Just refresh limits without tracking
            try {
              await checkLimits(true);
            } catch (limitsError) {
              // Limits check failed, but generation succeeded
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

  // Manual generation only - no auto-generation


  const selectImage = (index: number) => {
    setIsSelectedImageIndex(index);
  };

  const generate3DModel = async () => {
    // Auto-select first image if no image is selected
    const imageIndex = selectedImageIndex !== null ? selectedImageIndex : 0;
    
    if (generatedImages.length === 0) {
      onError('No images available to generate 3D model');
      return;
    }

    // Check usage limits before generating 3D model
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
          // Use quality-based options
          ...get3DOptions(quality)
        }
      };

      const response = await apiService.generate3DModel(request);
      
      if (response.success && response.data) {
        // Track usage after successful 3D model generation
        try {
          await apiService.trackUsage(userId, 'model', 1);
          // Force refresh usage limits to get updated counts immediately
          await checkLimits(true);
        } catch (trackingError) {
          // Don't fail the generation if tracking fails
        }
        
        // Mark the selected image as successfully processed
        setGeneratedImages(prev => prev.map((img, index) => 
          index === imageIndex 
            ? { ...img, processed: true }
            : img
        ));
        
        // Navigate directly to design view
        window.location.href = `/design/${response.data.design_id}`;
        
        onComplete(response.data.design_id);
      } else {
        throw new Error(response.error || 'Failed to generate 3D model');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to generate 3D model');
    } finally {
    }
  };

  return (
    <div className="w-full mx-auto pt-0 mt-0 px-4 md:px-0 md:max-w-4xl bg-transparent">

      {/* Loading State */}
      {(isGenerating && generatedImages.length === 0) || isPrinting ? (
        <div className="text-center py-8 h-full flex items-center justify-center min-h-[60vh] bg-transparent">
          <div className="flex flex-col items-center">
            <img
              src="/GIFS/Loading-State.gif"
              alt="Generating Images"
              className="w-48 h-48 md:w-96 md:h-96 object-contain mb-8"
            />
            <span className="text-black font-medium text-lg md:text-xl">
              {isPrinting ? 'Creating 3D Model...' : 'Generating Images...'}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Generated Images Grid - Clean layout matching Figma */}
          {generatedImages.length > 0 && (
            <div className="w-full pb-8">
              <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-3">
                {/* First 3 images filling the space */}
                {generatedImages.slice(0, 3).map((image, index) => (
                  <div
                    key={index}
                    className={`bg-[#f0f0f0] flex items-center justify-center transition-all duration-300 overflow-hidden rounded-[10px] relative ${
                      index === 0 ? 'row-span-2 h-full min-h-[400px] md:min-h-[500px]' : 'h-full min-h-[195px] md:min-h-[245px]'
                    } ${
                      selectedImageIndex === index 
                        ? 'ring-2 md:ring-4 ring-blue-500' 
                        : ''
                    }`}
                    onClick={() => selectImage(index)}
                  >
                    <div className="w-full h-full relative group cursor-pointer">
                      <img 
                        src={image.url} 
                        alt={`Generated image ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      
                      {/* View 360° Button - Centered on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            setIsPrinting(true);
                            try {
                              await generate3DModel();
                            } catch (error) {
                              console.error('3D generation failed:', error);
                            } finally {
                              setIsPrinting(false);
                            }
                          }}
                          className="px-4 md:px-6 py-2 md:py-2.5 bg-white text-gray-800 rounded-full font-medium text-xs md:text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        >
                          View 360°
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}