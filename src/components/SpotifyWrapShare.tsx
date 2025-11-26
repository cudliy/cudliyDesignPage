import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { apiService } from '../services/api';

interface ShareSlide {
  id: string;
  type: 'intro' | 'stats' | 'design' | 'journey' | 'finale';
  title: string;
  content: string;
  animation: string;
  background: string;
  textColor: string;
  data?: any;
}

interface SpotifyWrapShareProps {
  designId: string;
  userName?: string;
  onClose: () => void;
  onShare: (platform: string, slideIndex: number) => void;
}

export default function SpotifyWrapShare({ 
  designId, 
  userName = 'Creator', 
  onClose, 
  onShare 
}: SpotifyWrapShareProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<ShareSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const slideRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fetch design.
  useEffect(() => {
    const fetchDesignAndGenerateSlides = async () => {
      try {
        setLoading(true);
        
        // Check if this is a demo
        if (designId === 'demo-design-123') {
          // Use mock data for demo
          const mockDesign = {
            id: 'demo-design-123',
            userId: 'demo-user',
            originalText: 'A cute robot holding a flower',
            userSelections: {
              style: 'Playful',
              material: 'PLA',
              size: 'Medium'
            },
            generatedPrompt: 'A cute, friendly robot with rounded features holding a beautiful flower, rendered in a playful cartoon style',
            images: [
              { url: 'https://via.placeholder.com/400x400/667eea/ffffff?text=Robot+Design', selected: true }
            ],
            modelFiles: {
              originalImage: 'https://via.placeholder.com/400x400/667eea/ffffff?text=Robot+Design',
              storedModelUrl: null
            },
            views: 42,
            downloadCount: 7,
            likes: 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          generateSlides(mockDesign);
        } else {
          // Fetch real design data
          const response = await apiService.getDesign(designId);
          
          if (response.success && response.data) {
            const designData = response.data;
            generateSlides(designData);
          }
        }
      } catch (error) {
        console.error('Error fetching design:', error);
        // Fallback to mock data if API fails
        const mockDesign = {
          id: designId,
          userId: 'user',
          originalText: 'Amazing 3D design',
          userSelections: {
            style: 'Modern',
            material: 'PLA',
            size: 'Medium'
          },
          generatedPrompt: 'A beautiful 3D design created with AI',
          images: [
            { url: 'https://via.placeholder.com/400x400/4facfe/ffffff?text=3D+Design', selected: true }
          ],
          modelFiles: {
            originalImage: 'https://via.placeholder.com/400x400/4facfe/ffffff?text=3D+Design',
            storedModelUrl: null
          },
          views: 10,
          downloadCount: 2,
          likes: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        generateSlides(mockDesign);
      } finally {
        setLoading(false);
      }
    };

    fetchDesignAndGenerateSlides();
  }, [designId]);

  // Generate personalized slides based on design data
  const generateSlides = (designData: any) => {
    const createdDate = new Date(designData.createdAt);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    const generatedSlides: ShareSlide[] = [
      // Intro Slide
      {
        id: 'intro',
        type: 'intro',
        title: `${userName}'s 3D Creation`,
        content: `Your journey into 3D design starts here`,
        animation: 'fadeInUp',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: 'text-white',
        data: { userName }
      },
      
      // Design Stats
      {
        id: 'stats',
        type: 'stats',
        title: 'Your Design Stats',
        content: `Created in ${monthNames[createdDate.getMonth()]} ${createdDate.getFullYear()}`,
        animation: 'slideInLeft',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        textColor: 'text-white',
        data: {
          style: designData.userSelections?.style || 'Custom',
          material: designData.userSelections?.material || 'Premium',
          views: designData.views || 0,
          downloads: designData.downloadCount || 0
        }
      },
      
      // Design Journey
      {
        id: 'journey',
        type: 'journey',
        title: 'Your Creative Process',
        content: `From "${designData.originalText}" to 3D reality`,
        animation: 'zoomIn',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        textColor: 'text-white',
        data: {
          originalText: designData.originalText,
          prompt: designData.generatedPrompt,
          imagesGenerated: designData.images?.length || 0
        }
      },
      
      // Design Showcase
      {
        id: 'design',
        type: 'design',
        title: 'Your 3D Masterpiece',
        content: `${userName}, you created something amazing!`,
        animation: 'rotateIn',
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        textColor: 'text-white',
        data: {
          imageUrl: designData.modelFiles?.originalImage || designData.images?.[0]?.url,
          modelUrl: designData.modelFiles?.storedModelUrl || designData.modelFiles?.modelFile
        }
      },
      
      // Finale
      {
        id: 'finale',
        type: 'finale',
        title: 'Share Your Creation',
        content: `${userName}, show the world what you've built with Cudliy!`,
        animation: 'bounceIn',
        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        textColor: 'text-gray-800',
        data: { userName, designId }
      }
    ];

    setSlides(generatedSlides);
  };

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && slides.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 4000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = undefined;
      }
    };
  }, [autoPlay, slides.length]);

  // Navigation functions
  const nextSlide = () => {
    setAutoPlay(false);
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setAutoPlay(false);
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setAutoPlay(false);
    setCurrentSlide(index);
  };

  // Share functionality
  const handleShare = (platform: string) => {
    onShare(platform, currentSlide);
  };

  // Download current slide as image
  const downloadSlide = async () => {
    if (!slideRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = 1920;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const currentSlideData = slides[currentSlide];
      
      // Parse gradient colors (simplified)
      if (currentSlideData.background.includes('gradient')) {
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add text content
      ctx.fillStyle = 'white';
      ctx.font = 'bold 72px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentSlideData.title, canvas.width / 2, 400);

      ctx.font = '48px Inter, sans-serif';
      ctx.fillText(currentSlideData.content, canvas.width / 2, 500);

      // Add Cudliy branding
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillText('Created with Cudliy', canvas.width / 2, canvas.height - 100);

      // Download
      const link = document.createElement('a');
      link.download = `cudliy-wrap-${designId}-slide-${currentSlide + 1}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error downloading slide:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-white">Creating your wrap...</p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <p className="text-white mb-4">Unable to create wrap</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Slide Container */}
      <div className="relative w-full max-w-md h-full max-h-[80vh] mx-4">
        <div
          ref={slideRef}
          className={`w-full h-full rounded-2xl overflow-hidden relative spotify-wrap-slide active animate-${currentSlideData.animation}`}
          style={{ background: currentSlideData.background }}
        >
          {/* Slide Content */}
          <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${currentSlideData.textColor}`}>
            {currentSlideData.type === 'intro' && (
              <div className="space-y-6">
                <div className="text-6xl font-bold mb-4">🎨</div>
                <h1 className="text-4xl font-bold mb-4">{currentSlideData.title}</h1>
                <p className="text-xl opacity-90">{currentSlideData.content}</p>
                <div className="mt-8 text-sm opacity-75">
                  Your 3D design journey with Cudliy
                </div>
              </div>
            )}

            {currentSlideData.type === 'stats' && (
              <div className="space-y-6">
                <div className="text-5xl font-bold mb-4">📊</div>
                <h1 className="text-3xl font-bold mb-6">{currentSlideData.title}</h1>
                <div className="space-y-4">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl font-bold">{currentSlideData.data.style}</div>
                    <div className="text-sm opacity-75">Design Style</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl font-bold">{currentSlideData.data.material}</div>
                    <div className="text-sm opacity-75">Material Choice</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl font-bold">{currentSlideData.data.views}</div>
                    <div className="text-sm opacity-75">Views</div>
                  </div>
                </div>
              </div>
            )}

            {currentSlideData.type === 'journey' && (
              <div className="space-y-6">
                <div className="text-5xl font-bold mb-4">🚀</div>
                <h1 className="text-3xl font-bold mb-6">{currentSlideData.title}</h1>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                  <p className="text-lg italic">"{currentSlideData.data.originalText}"</p>
                  <div className="text-sm opacity-75 mt-2">Your original idea</div>
                </div>
                <div className="text-sm opacity-90">
                  Transformed into {currentSlideData.data.imagesGenerated} unique variations
                </div>
              </div>
            )}

            {currentSlideData.type === 'design' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold mb-6">{currentSlideData.title}</h1>
                {currentSlideData.data.imageUrl && (
                  <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
                    <img
                      src={currentSlideData.data.imageUrl}
                      alt="Your design"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xl">{currentSlideData.content}</p>
                <div className="text-sm opacity-75">
                  Ready for 3D printing and sharing
                </div>
              </div>
            )}

            {currentSlideData.type === 'finale' && (
              <div className="space-y-6">
                <div className="text-5xl font-bold mb-4">✨</div>
                <h1 className="text-3xl font-bold mb-6">{currentSlideData.title}</h1>
                <p className="text-xl mb-8">{currentSlideData.content}</p>
                
                {/* Share Buttons */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => handleShare('instagram')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
                  >
                    Share on Instagram
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
                  >
                    Share on Twitter
                  </button>
                </div>
                
                <button
                  onClick={downloadSlide}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            onClick={prevSlide}
            className="ml-4 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={nextSlide}
            className="mr-4 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-40'
              }`}
            />
          ))}
        </div>

        {/* Auto-play Toggle */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              autoPlay 
                ? 'bg-white bg-opacity-20 text-white' 
                : 'bg-white bg-opacity-10 text-white opacity-60'
            }`}
          >
            {autoPlay ? 'Auto' : 'Manual'}
          </button>
        </div>
      </div>
    </div>
  );
}