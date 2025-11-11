import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type { GenerateImagesRequest, Generate3DModelRequest } from '../services/api';
import { useUsageLimits } from '../hooks/useUsageLimits';

interface MobileOptimizedImageWorkflowProps {
  prompt: string;
  enhancedPrompt?: string;
  quality?: 'fast' | 'medium' | 'good';
  onComplete: (designId: string) => void;
  onError: (error: string) => void;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  index: number;
}

export default function MobileOptimizedImageWorkflow({ 
  prompt, 
  enhancedPrompt, 
  quality = 'medium', 
  onComplete, 
  onError 
}: MobileOptimizedImageWorkflowProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIndex, setIsSelectedImageIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [creationId, setCreationId] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const userId = sessionStorage.getItem('user_id') || '';
  const token = sessionStorage.getItem('token');
  
  useEffect(() => {
    if (!userId || !token) {
      window.location.href = '/signin';
    }
  }, [userId, token]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

    if (!canGenerateImages) {
      onError(`You have reached your monthly image generation limit. Please upgrade your plan to continue.`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setIsSelectedImageIndex(null);

    try {
      const newCreationId = `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCreationId(newCreationId);
      
      const request: GenerateImagesRequest = {
        text: finalPrompt,
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      try {
        const response = await apiService.generateImages(request);
        
        if (response.success && response.data) {
          setGeneratedImages(response.data.images);
          setSessionId(response.data.session_id);
          
          try {
            await apiService.trackUsage(userId, 'image', response.data.images.length);
            await checkLimits(true);
          } catch (trackingError) {
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
        
        window.location.href = `/design/${response.data.design_id}`;
        onComplete(response.data.design_id);
      } else {
        throw new Error(response.error || 'Failed to generate 3D model');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to generate 3D model');
    }
  };

  // Loading State
  if ((isGenerating && generatedImages.length === 0) || isPrinting) {
    return (
      <div className={`text-center flex items-center justify-center ${isMobile ? 'py-8 min-h-[60vh]' : 'py-8 h-full min-h-[60vh]'}`}>
        <div className="flex flex-col items-center">
          <img
            src="/GIFS/Loading-State.gif"
            alt="Generating Images"
            className={`object-contain mb-8 ${isMobile ? 'w-32 h-32' : 'w-48 h-48 md:w-96 md:h-96'}`}
          />
          <span className={`text-black font-medium ${isMobile ? 'text-base' : 'text-lg md:text-xl'}`}>
            {isPrinting ? 'Creating 3D Model...' : 'Generating Images...'}
          </span>
        </div>
      </div>
    );
  }

  // Generated Images - Mobile Optimized
  if (generatedImages.length > 0) {
    return (
      <div className={`w-full ${isMobile ? 'px-4' : 'mx-auto px-4 md:px-0 md:max-w-4xl'}`}>
        <div className={`${
          isMobile 
            ? 'flex flex-col gap-5' 
            : 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-1 lg:gap-1 xl:gap-2 md:ml-[-20px] lg:ml-[-15px] xl:ml-[-10px]'
        }`}>
          {generatedImages.slice(0, 3).map((image, index) => (
            <div
              key={index}
              className={`bg-gray-100 flex items-center justify-center transition-all duration-700 ease-out overflow-hidden ${
                selectedImageIndex === index ? 'ring-2 ring-blue-400 shadow-lg' : ''
              } ${
                isMobile 
                  ? 'h-[280px] rounded-2xl shadow-md' 
                  : 'h-[280px] md:h-[320px] min-h-[250px] md:min-h-[300px] rounded-lg md:rounded-none shadow-md md:shadow-none'
              }`}
              onClick={() => selectImage(index)}
              style={{ transitionDelay: `${800 + index * 100}ms` }}
            >
              <div className="w-full h-full flex items-center justify-center relative group">
                <img 
                  src={image.url} 
                  alt={`Generated image ${index + 1}`} 
                  className="w-full h-full object-cover relative z-10"
                />
                
                {/* Selection Indicator */}
                {selectedImageIndex === index && (
                  <div className={`absolute flex items-center justify-center shadow-lg z-20 ${
                    isMobile 
                      ? 'top-3 right-3 w-7 h-7 bg-blue-500 rounded-full' 
                      : 'top-2 right-2 w-8 h-8 bg-black rounded-full'
                  }`}>
                    <svg className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Processed Indicator */}
                {(image as any).processed && (
                  <div className={`absolute flex items-center justify-center shadow-lg z-20 ${
                    isMobile 
                      ? 'top-3 left-3 w-7 h-7 bg-green-500 rounded-full' 
                      : 'top-2 left-2 w-8 h-8 bg-green-500 rounded-full'
                  }`}>
                    <svg className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* View 3D Button */}
                <div className={`${
                  isMobile 
                    ? 'absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20' 
                    : 'md:absolute md:inset-0 md:flex md:items-center md:justify-center md:opacity-0 md:group-hover:opacity-100 md:transition-all md:duration-300 md:z-20 md:backdrop-blur-sm absolute bottom-3 left-1/2 transform -translate-x-1/2 md:transform-none z-20 opacity-100 md:opacity-0'
                }`}>
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
                    className={`bg-gray-100 text-gray-800 flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-200 hover:scale-105 shadow-lg cursor-pointer font-medium ${
                      isMobile 
                        ? 'px-4 py-2 text-xs rounded-xl' 
                        : 'px-4 py-2 md:px-6 md:py-3 text-[12px] md:text-[14px] rounded-lg md:rounded-none'
                    }`}
                  >
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 md:w-5 md:h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-9-4.5-9 4.5 9 4.5 9-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7.5v9l9 4.5 9-4.5v-9" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v9" />
                    </svg>
                    <span>View 3D</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
