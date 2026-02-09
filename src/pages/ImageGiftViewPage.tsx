import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
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
  '/1.mp4',
  '/2.mp4',
  '/3.mp4',
  '/4.mp4',
  '/5.mp4',
  '/1.mp4',
  '/2.mp4',
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
    const generatedSlides = [
      // Video-only slides without overlay text
      {
        id: 'intro',
        video: VIDEO_TEMPLATES[0],
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        content: null
      },
      {
        id: 'video-2',
        video: VIDEO_TEMPLATES[1],
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        content: null
      },
      {
        id: 'video-3',
        video: VIDEO_TEMPLATES[2],
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        content: null
      },
      {
        id: 'video-4',
        video: VIDEO_TEMPLATES[3],
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        content: null
      },
      {
        id: 'video-5',
        video: VIDEO_TEMPLATES[4],
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        content: null
      },
      // Images at the end of the slider
      ...data.images.map((image, index) => ({
        id: `image-${index}`,
        video: VIDEO_TEMPLATES[(index + 5) % VIDEO_TEMPLATES.length],
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
      }))
    ];

    setSlides(generatedSlides);
  };

  useEffect(() => {
    if (slides.length === 0 || isPaused) return;

    // Use consistent duration for all slides (4 seconds for videos, 6 seconds for images)
    const currentSlideId = slides[currentSlide]?.id;
    const duration = currentSlideId?.startsWith('image-') ? 6000 : 4000;

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
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
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
        {currentSlideData.content && (
          <div className="relative z-10 h-full flex items-center justify-center p-4 md:p-8">
            {currentSlideData.content}
          </div>
        )}

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