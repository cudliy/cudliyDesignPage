import { useState, useEffect } from 'react';

interface MobileOptimizedWorkflowProps {
  generatedImages: any[];
  isGenerating: boolean;
  isPrinting: boolean;
  selectedImageIndex: number | null;
  onSelectImage: (index: number) => void;
  onGenerate3D: () => Promise<void>;
}

export default function MobileOptimizedWorkflow({
  generatedImages,
  isGenerating,
  isPrinting,
  selectedImageIndex,
  onSelectImage,
  onGenerate3D
}: MobileOptimizedWorkflowProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Loading State
  if ((isGenerating && generatedImages.length === 0) || isPrinting) {
    return (
      <div className={`text-center flex items-center justify-center ${
        isMobile ? 'py-8 min-h-[60vh]' : 'py-8 h-full'
      }`}>
        <div className="flex flex-col items-center">
          <img
            src="/GIFS/Loading-State.gif"
            alt="Generating Images"
            className={`object-contain mb-8 ${
              isMobile ? 'w-48 h-48' : 'w-96 h-96'
            }`}
          />
          <span className={`text-black font-medium ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            {isPrinting ? 'Creating 3D Model...' : 'Generating Images...'}
          </span>
        </div>
      </div>
    );
  }

  // Generated Images Grid
  if (generatedImages.length > 0) {
    return (
      <div className={`space-y-0 mt-0 ${isMobile ? 'px-2' : ''}`}>
        <div className={`grid gap-2 h-full w-full ${
          isMobile 
            ? 'grid-cols-1 space-y-4' 
            : 'grid-cols-2 gap-1 lg:gap-1 xl:gap-2 ml-[-20px] lg:ml-[-15px] xl:ml-[-10px]'
        }`} style={!isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr' } : {}}>
          
          {generatedImages.slice(0, 3).map((image, index) => (
            <div
              key={index}
              className={`bg-white flex items-center justify-center transition-all duration-700 ease-out overflow-hidden cursor-pointer ${
                selectedImageIndex === index 
                  ? 'ring-2 ring-blue-400 shadow-lg' 
                  : ''
              } ${
                isMobile 
                  ? 'h-[280px] rounded-lg shadow-md' 
                  : 'h-[320px] min-h-[300px]'
              }`}
              onClick={() => onSelectImage(index)}
              style={{ transitionDelay: `${800 + index * 100}ms` }}
            >
              <div className="w-full h-full flex items-center justify-center relative group">
                <img 
                  src={image.url} 
                  alt={`Generated image ${index + 1}`} 
                  className="w-full h-full object-cover relative z-10"
                  onLoad={() => {}}
                  onError={(e) => console.error(`❌ Image ${index} failed to load:`, e, 'URL:', image.url)}
                />
                
                {/* Selection Indicator */}
                {selectedImageIndex === index && (
                  <div className={`absolute flex items-center justify-center shadow-lg z-20 ${
                    isMobile 
                      ? 'top-3 right-3 w-6 h-6 bg-blue-500 rounded-full' 
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
                      ? 'top-3 left-3 w-6 h-6 bg-green-500 rounded-full' 
                      : 'top-2 left-2 w-8 h-8 bg-green-500 rounded-full'
                  }`}>
                    <svg className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* View 3D Button */}
                {isMobile ? (
                  // Mobile: Always visible button at bottom
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20">
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onGenerate3D();
                      }}
                      className="px-4 py-2 bg-white text-gray-800 flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-50 shadow-lg cursor-pointer text-[12px] font-medium rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-9-4.5-9 4.5 9 4.5 9-4.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7.5v9l9 4.5 9-4.5v-9" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v9" />
                      </svg>
                      <span>View 3D</span>
                    </button>
                  </div>
                ) : (
                  // Desktop: Hover overlay
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm">
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onGenerate3D();
                      }}
                      className="px-6 py-3 bg-white text-gray-800 flex items-center justify-center gap-3 transition-all duration-200 hover:bg-white hover:scale-105 shadow-lg cursor-pointer text-[14px] font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-9-4.5-9 4.5 9 4.5 9-4.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7.5v9l9 4.5 9-4.5v-9" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v9" />
                      </svg>
                      <span>View 3D</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Generate 3D Button for selected image */}
        {isMobile && selectedImageIndex !== null && (
          <div className="mt-6 px-4">
            <button
              onClick={onGenerate3D}
              className="w-full py-3 bg-gradient-to-r from-[#E70D57] to-[#d10c50] text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Generate 3D Model
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}