import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [creationId, setCreationId] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const generateImagesRef = useRef<(() => Promise<void>) | null>(null);
  const isGeneratingRef = useRef(false); // Prevent double generation in StrictMode

  // Debug: Track generatedImages changes
  useEffect(() => {
    console.log('🔄 generatedImages state changed:', generatedImages.length, generatedImages);
  }, [generatedImages]);

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
        
        console.log('📥 API Response:', response);
        console.log('📥 Images received:', response.data?.images?.length);
        
        if (response.success && response.data) {
          console.log('✅ Setting generated images:', response.data.images);
          console.log('✅ Number of images:', response.data.images.length);
          
          // Set images first
          setGeneratedImages(response.data.images);
          setSessionId(response.data.session_id);
          
          console.log('✅ Images state updated');
          
          // Track usage after setting images (don't let this affect image display)
          try {
            await apiService.trackUsage(userId, 'image', response.data.images.length);
            await checkLimits(true);
            console.log('✅ Usage tracked successfully');
          } catch (trackingError) {
            console.warn('⚠️ Usage tracking failed:', trackingError);
            try {
              await checkLimits(true);
            } catch (limitsError) {
              console.warn('⚠️ Limits check failed:', limitsError);
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

  // Store the latest generateImages function in ref
  useEffect(() => {
    generateImagesRef.current = generateImages;
  }, [generateImages]);

  // Trigger generation only once when component mounts with a prompt
  useEffect(() => {
    console.log('🔍 useEffect triggered - hasStarted:', hasStarted, 'prompt:', prompt, 'isGeneratingRef:', isGeneratingRef.current);
    
    // Prevent double generation in React StrictMode
    if (!hasStarted && prompt.trim() && generateImagesRef.current && !isGeneratingRef.current) {
      console.log('▶️ Starting generation for the first time');
      isGeneratingRef.current = true;
      setHasStarted(true);
      generateImagesRef.current();
    }
  }, [prompt, hasStarted]); // Removed generateImages from dependencies!

  const selectImage = (index: number) => {
    console.log('🖱️ Image selected:', index);
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
      <div className="text-center flex items-center justify-center py-8 min-h-[60vh] md:h-full">
        <div className="flex flex-col items-center">
          <img
            src="/GIFS/Loading-State.gif"
            alt="Generating Images"
            className="object-contain mb-8 w-32 h-32 md:w-48 md:h-48 lg:w-96 lg:h-96"
          />
          <span className="text-black font-medium text-base md:text-lg lg:text-xl">
            {isPrinting ? 'Creating 3D Model...' : 'Generating Images...'}
          </span>
        </div>
      </div>
    );
  }
  if (generatedImages.length > 0) {
    console.log('🖼️ Rendering images. Total count:', generatedImages.length);
    console.log('🖼️ Images:', generatedImages);
    
    return (
      <div className="w-full h-full flex items-center relative" style={{
        justifyContent: window.innerWidth >= 1470 ? 'flex-start' : 'center',
        paddingLeft: window.innerWidth >= 1470 ? '8px' : '8px',
        paddingRight: '8px'
      }}>
        <div className="grid grid-cols-2 gap-2" style={{ 
          width: window.innerWidth >= 1470 ? 'min(1300px, 95vw)' : 'min(1130px, 95vw)',
          height: window.innerWidth >= 1470 ? 'min(950px, 92vh)' : 'min(820px, 90vh)',
          gridTemplateRows: 'repeat(2, 1fr)'
        }}>
          {generatedImages.slice(0, 3).map((image, index) => (
            <div
              key={index}
              className={`bg-white border-2 border-gray-300 flex items-center justify-center transition-all duration-700 ease-out overflow-hidden cursor-pointer shadow-lg group ${
                selectedImageIndex === index ? 'ring-4 ring-blue-500 shadow-2xl' : ''
              }`}
              onClick={() => selectImage(index)}
              style={{ 
                transitionDelay: `${800 + index * 100}ms`,
                borderRadius: '10px'
              }}
            >
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-[10px]">
                <img 
                  src={image.url} 
                  alt={`Generated image ${index + 1}`} 
                  className="w-full h-full object-contain relative z-10"
                  loading="eager"
                  style={{ imageRendering: '-webkit-optimize-contrast' as any }}
                />
                
                {/* Hover Overlay - Full Coverage */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm z-30 rounded-[10px]">
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
                    className="bg-white text-gray-800 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg cursor-pointer font-medium rounded-full"
                    style={{
                      padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)',
                      fontSize: 'clamp(12px, 1.2vw, 14px)'
                    }}
                  >
                    <span>View 360°</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Cancel Button - 4th Grid Item */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => window.location.reload()}
              className="w-16 h-16 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
