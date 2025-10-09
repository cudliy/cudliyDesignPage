import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { GenerateImagesRequest, Generate3DModelRequest } from '../services/api';
import { useUsageLimits } from '../hooks/useUsageLimits';

interface ImageGenerationWorkflowProps {
  prompt: string;
  enhancedPrompt?: string; // Strategic Enhancement: Accept enhanced prompt
  onComplete: (designId: string) => void;
  onError: (error: string) => void;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  index: number;
}

export default function ImageGenerationWorkflow({ prompt, enhancedPrompt, onComplete, onError }: ImageGenerationWorkflowProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIndex, setIsSelectedImageIndex] = useState<number | null>(null);
  const [isCreating3D, setIsCreating3D] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [creationId, setCreationId] = useState<string>('');

    // Get user ID for usage limits (authenticated users only)
    const userId = sessionStorage.getItem('user_id') || '';
    const token = sessionStorage.getItem('token');
    
    // Redirect to login if not authenticated
    useEffect(() => {
      if (!userId || !token) {
        console.log('Missing authentication - redirecting to signin');
        console.log('User ID:', userId);
        console.log('Token:', token ? 'Present' : 'Missing');
        window.location.href = '/signin';
      }
    }, [userId, token]);

  const { 
    canGenerateImages, 
    canGenerateModels, 
    remainingImages, 
    remainingModels, 
    usageLimits,
    checkLimits 
  } = useUsageLimits(userId);

  const generateImages = async () => {
    console.log('Generating images for user ID:', userId);
    // Strategic Enhancement: Use enhanced prompt if available, otherwise fallback to original
    const finalPrompt = enhancedPrompt || prompt;
    
    if (!finalPrompt.trim()) {
      onError('Please enter a prompt first');
      return;
    }

    // Check usage limits before generating images
    if (!canGenerateImages) {
      onError(`You have reached your monthly image generation limit (${usageLimits?.limits.imagesPerMonth || 3} images). Please upgrade your plan to continue.`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setIsSelectedImageIndex(null);

    try {
      // Generate a unique creation ID
      const newCreationId = `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCreationId(newCreationId);

      console.log('🚀 Strategic Enhancement: Using enhanced prompt:', finalPrompt);
      
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

      const response = await apiService.generateImages(request);
      
      if (response.success && response.data) {
        setGeneratedImages(response.data.images);
        setSessionId(response.data.session_id);
        
        // Track usage after successful generation
        try {
          await apiService.trackUsage(userId, 'image', response.data.images.length);
          // Force refresh usage limits to get updated counts immediately
          await checkLimits(true);
        } catch (trackingError) {
          console.error('Failed to track usage:', trackingError);
          // Don't fail the generation if tracking fails
        }
      } else {
        throw new Error(response.error || 'Failed to generate images');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectImage = (index: number) => {
    setIsSelectedImageIndex(index);
  };

  const generate3DModel = async () => {
    if (selectedImageIndex === null) {
      onError('Please select an image first');
      return;
    }

    // Check usage limits before generating 3D model
    if (!canGenerateModels) {
      onError(`You have reached your monthly model generation limit (${usageLimits?.limits.modelsPerMonth || 1} models). Please upgrade your plan to continue.`);
      return;
    }

    setIsCreating3D(true);

    try {
      const selectedImage = generatedImages[selectedImageIndex];
      
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
          texture_size: 4096, // Increased from 2048 for higher quality
          generate_color: true,
          generate_model: true,
          randomize_seed: true,
          // Advanced quality settings
          mesh_simplify: 0.1, // Lower = higher quality (90% detail retention)
          generate_normal: true, // Enable normal maps for better lighting
          save_gaussian_ply: true, // Enable high-quality point cloud
          ss_sampling_steps: 50, // Increased from default for better quality
          slat_sampling_steps: 25, // Increased from default for better quality
          ss_guidance_strength: 7.5, // Optimized guidance strength
          slat_guidance_strength: 3.0, // Optimized guidance strength
          return_no_background: true, // Remove background for cleaner models
          // Ensure color preservation
          preserve_colors: true,
          enhance_colors: true,
          color_accuracy: "high"
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
          console.error('Failed to track usage:', trackingError);
          // Don't fail the generation if tracking fails
        }
        
        onComplete(response.data.design_id);
      } else {
        throw new Error(response.error || 'Failed to generate 3D model');
      }
    } catch (error) {
      console.error('3D model generation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to generate 3D model');
    } finally {
      setIsCreating3D(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Usage Limits Display */}
      {usageLimits && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Current Plan: {usageLimits.plan}</span>
            <div className="flex gap-4">
              <span className="text-gray-600">
                Images: {remainingImages}/{usageLimits.limits.imagesPerMonth === -1 ? '∞' : usageLimits.limits.imagesPerMonth}
              </span>
              <span className="text-gray-600">
                Models: {remainingModels}/{usageLimits.limits.modelsPerMonth === -1 ? '∞' : usageLimits.limits.modelsPerMonth}
              </span>
            </div>
          </div>
          {(!canGenerateImages || !canGenerateModels) && (
            <div className="mt-2 text-center">
              <button
                onClick={() => window.location.href = '/pricing'}
                className="text-[#E70D57] hover:text-[#d10c50] font-medium text-sm underline"
              >
                Upgrade to continue generating
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generate Images Button */}
      {generatedImages.length === 0 && (
        <div className="text-center">
          <button
            onClick={generateImages}
            disabled={isGenerating || !canGenerateImages}
            className="px-8 py-3 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating Images...' : 'Generate Images'}
          </button>
        </div>
      )}

      {/* Generated Images Grid - Matching Demo Layout */}
      {generatedImages.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-center text-gray-800 mb-4">
            Select your favorite image
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full w-full">
            {generatedImages.map((image, index) => (
              <div
                key={index}
                className={`bg-white border border-black/5 rounded-[40px] flex items-center justify-center min-h-[200px] sm:min-h-0 transition-all duration-700 ease-out hover:scale-[1.02] hover:shadow-lg cursor-pointer ${
                  selectedImageIndex === index 
                    ? 'ring-4 ring-[#E70D57] shadow-lg' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => selectImage(index)}
                style={{ transitionDelay: `${800 + index * 100}ms` }}
              >
                <div className="w-full h-full max-w-[206px] max-h-[216px] flex items-center justify-center p-4 relative">
                  <img 
                    src={image.url} 
                    alt={`Generated image ${index + 1}`} 
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-[20px] transition-transform duration-300 hover:scale-105" 
                  />
                  {selectedImageIndex === index && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-[#E70D57] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Plus icon for the 4th slot (if less than 3 images) */}
            {generatedImages.length < 3 && (
              <div className="bg-white border border-black/5 rounded-[40px] transition-all duration-700 delay-1100 ease-out hover:scale-[1.02] hover:shadow-lg min-h-[200px] sm:min-h-0">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#F2F2F2] text-[#9B9B9B] flex items-center justify-center text-5xl sm:text-6xl transition-all duration-300 hover:bg-[#e8e8e8] hover:scale-110 border-0 outline-none m-0 p-0 leading-none">
                    +
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate 3D Model Button */}
          {selectedImageIndex !== null && (
            <div className="text-center">
              <button
                onClick={generate3DModel}
                disabled={isCreating3D || !canGenerateModels}
                className="px-8 py-3 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating3D ? 'Creating 3D Model...' : 'Generate 3D Model'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
