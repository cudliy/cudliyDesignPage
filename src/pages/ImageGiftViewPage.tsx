import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { GIFT_CATEGORIES } from '../components/CategorySelector';
import { audioService } from '../services/audioService';

interface ImageGiftData {
  id: string;
  type: 'image_collection';
  images: Array<{
    id: string;
    url: string;
    selected: boolean;
  }>;
  senderName: string;
  recipientName: string;
  recipientEmail?: string;
  message?: string;
  category?: string;
  userId: string;
  createdAt: string;
}

const VIDEO_TEMPLATES = [
  '/Wrap vid1.mp4',
  '/Wrap vid 2.mp4',
  '/Wrap vid3.mp4',
  '/Wrap vid1.mp4',
  '/Wrap vid 2.mp4',
  '/Wrap vid3.mp4',
  '/Wrap vid1.mp4',
];

export default function ImageGiftViewPage() {
  const { giftId } = useParams();
  const navigate = useNavigate();

  const [giftData, setGiftData] = useState<ImageGiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const fetchGift = async () => {
      try {
        setLoading(true);
        if (!giftId) {
          setError('Gift not found');
          return;
        }

        // Load from local storage (in a real app, this would be an API call)
        console.log('Looking for giftId:', giftId);
        console.log('Looking for key:', `image_share_${giftId}`);
        console.log('All localStorage keys:', Object.keys(localStorage));
        
        const storedData = localStorage.getItem(`image_share_${giftId}`);
        console.log('Found stored data:', storedData);
        
        if (storedData) {
          const data = JSON.parse(storedData) as ImageGiftData;
          console.log('Loaded gift data:', data);
          console.log('Image URLs:', data.images.map(img => ({ id: img.id, url: img.url.substring(0, 50) + '...' })));
          setGiftData(data);
          generateSlides(data);
        } else {
          setError('Gift not found or has expired');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load gift');
      } finally {
        setLoading(false);
      }
    };

    fetchGift();
  }, [giftId]);

  // Auto-play background music
  useEffect(() => {
    if (!loading && !error && slides.length > 0) {
      // Start background music
      audioService.playBackgroundMusic(0);
      
      return () => {
        // Stop music when component unmounts
        audioService.stop();
      };
    }
  }, [loading, error, slides.length]);

  const generateSlides = (data: ImageGiftData) => {
    const categoryData = GIFT_CATEGORIES.find(cat => cat.value === data.category);
    const theme = categoryData?.theme || 'personal';
    const concepts = categoryData?.concepts || ['special', 'meaningful', 'thoughtful', 'unique'];

    const generatedSlides = [
      {
        id: 'intro',
        video: VIDEO_TEMPLATES[0],
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        content: (
          <div className="text-center space-y-4 px-4 max-w-4xl mx-auto animate-fade-in-up">
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-black leading-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word' }}>
              {data.senderName} sent you something special
            </p>
            {categoryData && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: categoryData.color }}
                />
                <span className="text-lg text-white/90 font-medium">{categoryData.label}</span>
              </div>
            )}
          </div>
        )
      },
      {
        id: 'recipient',
        video: VIDEO_TEMPLATES[1],
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        content: (
          <div className="text-center space-y-4 px-4 max-w-4xl mx-auto">
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-black leading-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word' }}>
              For {data.recipientName}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {concepts.slice(0, 3).map((concept, index) => (
                <div key={concept} className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <span className="text-white font-medium capitalize">{concept}</span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      ...(data.message ? [{
        id: 'message',
        video: VIDEO_TEMPLATES[2],
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        content: (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-2xl md:text-3xl lg:text-4xl text-white font-bold leading-relaxed" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word', hyphens: 'auto' }}>
                "{data.message}" - {data.senderName}
              </p>
              <div className="mt-6 text-lg text-white/80 font-medium">
                Theme: {theme}
              </div>
            </div>
          </div>
        )
      }] : []),
      ...data.images.map((image, index) => ({
        id: `image-${index}`,
        video: VIDEO_TEMPLATES[(index + 3) % VIDEO_TEMPLATES.length],
        gradient: `linear-gradient(135deg, ${
          ['#ff9a9e 0%, #fecfef 100%', '#a8edea 0%, #fed6e3 100%', '#ffecd2 0%, #fcb69f 100%', '#ff8a80 0%, #ea80fc 100%'][index % 4]
        })`,
        content: (
          <div className="flex items-center justify-center w-full h-full px-4">
            <div className="w-full max-w-lg aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={image.url}
                alt={`Shared image ${index + 1}`}
                className="w-full h-full object-cover"
                style={{ animation: 'fadeInScale 1s ease-out forwards' }}
              />
            </div>
          </div>
        )
      })),
      {
        id: 'collection',
        video: VIDEO_TEMPLATES[5],
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        content: (
          <div className="text-center space-y-6 px-4 max-w-4xl mx-auto">
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-black leading-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word' }}>
              A collection of {data.images.length} special moments
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {data.images.slice(0, 4).map((image, index) => (
                <div key={image.id} className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Collection ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'thanks',
        video: VIDEO_TEMPLATES[6],
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        content: (
          <div className="text-center space-y-4 px-4 max-w-4xl mx-auto">
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-black leading-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word' }}>
              Thank you from {data.senderName}
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-white font-bold" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
              Created with Cudliy
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {concepts.map((concept, index) => (
                <div key={concept} className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm text-sm">
                  <span className="text-white capitalize">{concept}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ];

    setSlides(generatedSlides);
  };

  useEffect(() => {
    if (slides.length === 0 || isPaused) return;

    // Use longer duration for image slides (8 seconds), shorter for others (4 seconds)
    const currentSlideId = slides[currentSlide]?.id;
    const duration = currentSlideId?.startsWith('image-') ? 8000 : 4000;

    const timer = setTimeout(() => {
      setCurrentSlide((prev) => {
        if (prev === slides.length - 1) return prev;
        return prev + 1;
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [currentSlide, slides.length, isPaused]);

  // Reset video loading state when slide changes
  useEffect(() => {
    setVideoLoaded(false);
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(prev => prev - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, slides.length]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioService.stop();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-white text-xl">Loading your gift...</p>
        </div>
      </div>
    );
  }

  if (error || !giftData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Oops!</h1>
          <p className="text-xl text-gray-400 mb-8">{error || 'Gift not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-white text-black rounded-full text-lg font-semibold hover:scale-105 transition-transform"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div className="fixed inset-0 overflow-hidden bg-black">
        {/* Gradient Background - Always visible */}
        <div 
          className="absolute inset-0 transition-all duration-1000 ease-in-out" 
          style={{ 
            background: currentSlideData.gradient,
            zIndex: 0
          }}
        />
        
        {/* Background Video */}
        <video
          key={currentSlideData.video}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            minWidth: '100%', 
            minHeight: '100%',
            objectFit: 'cover',
            zIndex: 1
          }}
          onLoadStart={() => {
            setVideoLoaded(false);
          }}
          onCanPlay={() => {
            setVideoLoaded(true);
          }}
          onError={() => {
            console.error('Video failed to load:', currentSlideData.video);
            setVideoLoaded(true); // Show gradient background
          }}
        >
          <source src={currentSlideData.video} type="video/mp4" />
        </video>

        {/* Preload next video */}
        {currentSlide < slides.length - 1 && (
          <video
            src={slides[currentSlide + 1]?.video}
            preload="auto"
            muted
            className="hidden"
          />
        )}

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex items-center justify-center p-4 md:p-8">
          {currentSlideData.content}
        </div>

        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress Bar */}
        <div className="absolute bottom-6 left-6 right-6 z-20">
          <div className="flex gap-1">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white' 
                    : index < currentSlide 
                      ? 'bg-white/60' 
                      : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Audio Control */}
        <button
          onClick={() => {
            if (audioService.isCurrentlyPlaying()) {
              audioService.pause();
            } else {
              audioService.resume();
            }
          }}
          className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
        >
          {audioService.isCurrentlyPlaying() ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816z" clipRule="evenodd" />
              <path d="M11.025 7.05a1 1 0 011.95 0 3.5 3.5 0 010 5.9 1 1 0 01-1.95 0 1.5 1.5 0 000-5.9z" />
              <path d="M15.364 4.636a1 1 0 011.414 0 7 7 0 010 9.899 1 1 0 11-1.414-1.414 5 5 0 000-7.071 1 1 0 010-1.414z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816z" clipRule="evenodd" />
              <path d="M12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}