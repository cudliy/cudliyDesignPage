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
  const [hasStarted, setHasStarted] = useState(false);
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

  const generateImages = useCallback(async () => {
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
      const newCreationId = `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCreationId(newCreationId);
      
      const request: GenerateImagesRequest = {
        text: finalPrompt, // Strategic Enhancement: Send enhanced prompt to backend
        user_id: (() => {
          const authed = sessionStorage.getItem('user_id');
          if (authed) return authed;
          const storedUserId = sessionStorage.getItem('guest_user_id');
          if (storedUserId) return storedUserId;
          const newUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Auto-start generation when component mounts
  useEffect(() => {
    if (!hasStarted && prompt.trim()) {
      setHasStarted(true);
      generateImages();
    }
  }, [prompt, hasStarted, generateImages]);


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
      
      const userId = sessionStorage.getItem('user_id') || sessionStorage.getItem('guest_user_id') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    <div className="w-full max-w-4xl mx-auto pt-0 mt-0">

      {/* Loading State */}
      {(isGenerating && generatedImages.length === 0) || isPrinting ? (
        <div className="text-center py-2">
          <div className="flex flex-col items-center">
            <img
              src="/GIFS/Loading-State.gif"
              alt="Generating Images"
              className="w-24 h-24 object-contain mb-4"
            />
            <span className="text-black font-medium">
              {isPrinting ? 'Generating 3D Model...' : 'Generating Images...'}
            </span>
            <div className="mt-4 text-sm text-gray-600">
              <p>{isPrinting ? 'This may take 2-5 minutes depending on complexity' : 'This may take 1-3 minutes depending on complexity'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {isPrinting ? 'Creating your 3D model...' : 'Generating 3 variations in parallel...'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Generated Images Grid - Matching Demo Layout */}
          {generatedImages.length > 0 && (
        <div className="space-y-0 mt-0">
          <div className="grid grid-cols-2 gap-1 lg:gap-1 xl:gap-2 h-full w-full ml-[-20px] lg:ml-[-15px] xl:ml-[-10px]" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* First 3 images in 2x2 grid */}
            {generatedImages.slice(0, 3).map((image, index) => (
                <div
                  key={index}
                  className={`bg-white border border-gray-200/30 rounded-[40px] flex items-center justify-center h-[320px] min-h-[300px] transition-all duration-700 ease-out hover:scale-[1.02] hover:border-gray-400 backdrop-blur-sm ${
                    selectedImageIndex === index 
                      ? 'ring-1 ring-gray-400 shadow-lg' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => selectImage(index)}
                  style={{ transitionDelay: `${800 + index * 100}ms` }}
                >
                  <div className="w-full h-full max-w-[190px] max-h-[280px] flex items-center justify-center p-4 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/10 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <img 
                      src={image.url} 
                      alt={`Generated image ${index + 1}`} 
                      className="w-full h-full object-contain rounded-[20px] transition-transform duration-300 hover:scale-105 relative z-10"
                      onLoad={() => {}}
                      onError={(e) => console.error(`❌ Image ${index} failed to load:`, e, 'URL:', image.url)}
                    />
                    {selectedImageIndex === index && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg z-20">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {(image as any).processed && (
                      <div className="absolute top-2 left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-20">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {/* Print Button - Bottom Right */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
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
                        className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 shadow-lg hover:shadow-xl cursor-pointer font-medium text-sm"
                        title="Generate 3D Model"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
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
