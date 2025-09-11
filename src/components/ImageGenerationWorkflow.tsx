import { useState } from 'react';
import { apiService } from '../services/api';
import type { GenerateImagesRequest, Generate3DModelRequest } from '../services/api';

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

  const generateImages = async () => {
    // Strategic Enhancement: Use enhanced prompt if available, otherwise fallback to original
    const finalPrompt = enhancedPrompt || prompt;
    
    if (!finalPrompt.trim()) {
      onError('Please enter a prompt first');
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
          // Generate a unique user ID for this session
          // In a real app, this would come from authentication context
          const storedUserId = localStorage.getItem('guestUserId');
          if (storedUserId) {
            return storedUserId;
          }
          const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('guestUserId', newUserId);
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

    setIsCreating3D(true);

    try {
      const selectedImage = generatedImages[selectedImageIndex];
      
      const request: Generate3DModelRequest = {
        image_url: selectedImage.url,
        session_id: sessionId,
        user_id: 'user_123', // TODO: Replace with actual user ID
        creation_id: creationId,
        options: {
          texture_size: 2048,
          generate_color: true,
          generate_model: true,
          randomize_seed: true
        }
      };

      const response = await apiService.generate3DModel(request);
      
      if (response.success && response.data) {
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
      {/* Generate Images Button */}
      {generatedImages.length === 0 && (
        <div className="text-center">
          <button
            onClick={generateImages}
            disabled={isGenerating}
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
                disabled={isCreating3D}
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
