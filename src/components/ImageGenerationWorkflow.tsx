import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type { GenerateImagesRequest, Generate3DModelRequest } from '../services/api';
import { useUsageLimits } from '../hooks/useUsageLimits';

interface ImageGenerationWorkflowProps {
  prompt: string;
  enhancedPrompt?: string;
  quality?: 'fast' | 'medium' | 'good';
  onComplete: (designId: string, designData?: any) => void;
  onError: (error: string) => void;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  index: number;
}

export default function ImageGenerationWorkflow({ 
  prompt, 
  enhancedPrompt, 
  quality = 'medium', 
  onComplete, 
  onError
}: ImageGenerationWorkflowProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [creationId, setCreationId] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  const userId = sessionStorage.getItem('user_id') || '';
  const token = sessionStorage.getItem('token');
  
  useEffect(() => {
    if (!userId || !token) {
      window.location.href = '/signin';
    }
  }, [userId, token]);

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

    console.log('🚀 Starting image generation...');
    setIsGenerating(true);
    setGeneratedImages([]);
    setSelectedImageIndex(null);
    setSessionId('');
    setCreationId('');

    try {
      const newCreationId = `creation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      setCreationId(newCreationId);
      
      const request: GenerateImagesRequest = {
        text: finalPrompt,
        user_id: userId || (() => {
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
              // Limits check failed
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

  // Auto-generate on mount
  useEffect(() => {
    if (prompt.trim() && !isGenerating && generatedImages.length === 0) {
      generateImages();
    }
  }, []);

  const selectImage = (index: number) => {
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
        
        onComplete(response.data.design_id, response.data);
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
      <div className="text-center flex items-center justify-center py-8 h-full">
        <div className="flex flex-col items-center">
          <img
            src="/GIFS/Loading-State.gif"
            alt="Generating Images"
            className="object-contain mb-8 w-96 h-96"
          />
          <span className="text-white font-medium text-xl">
            {isPrinting ? 'Creating 3D Model...' : 'Generating Images...'}
          </span>
        </div>
      </div>
    );
  }

  // Generated Images Grid - NO GAP, 10px border radius, transparent overlay
  if (generatedImages.length > 0) {
    return (
      <div className="w-full h-full flex items-center relative bg-[#212121]" style={{
        justifyContent: window.innerWidth >= 1470 ? 'flex-start' : 'center',
        padding: '0'
      }}>
        <div className="grid grid-cols-2 auto-rows-fr" style={{ 
          width: window.innerWidth >= 1470 ? 'min(1300px, 95vw)' : 'min(1130px, 95vw)',
          maxHeight: '100%',
          gap: '0'
        }}>
          {generatedImages.slice(0, 3).map((image, index) => (
            <div
              key={index}
              className={`relative flex items-center justify-center transition-all duration-700 ease-out cursor-pointer group overflow-hidden ${
                selectedImageIndex === index ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => selectImage(index)}
              style={{ 
                transitionDelay: `${800 + index * 100}ms`,
                padding: '0',
                margin: '0',
                backgroundColor: 'transparent',
                borderRadius: '10px'
              }}
            >
              <img 
                src={image.url} 
                alt={`Generated image ${index + 1}`} 
                className="w-full h-full object-cover"
                loading="eager"
                style={{ 
                  imageRendering: '-webkit-optimize-contrast' as any,
                  borderRadius: '10px'
                }}
              />
                
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 bg-transparent">
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
                  className="flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
                  style={{
                    width: '162px',
                    height: '52px',
                    borderRadius: '26px',
                    border: '2px solid #212121',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
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
