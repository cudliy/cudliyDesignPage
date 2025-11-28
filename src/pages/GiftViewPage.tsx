import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import { apiService } from '../services/api';
import ModelViewer from '../components/ModelViewer';

interface GiftData {
  gift: {
    id: string;
    senderName: string;
    recipientName: string;
    message: string;
    createdAt: string;
  };
  design: any;
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

export default function GiftViewPage() {
  const { giftId } = useParams();
  const navigate = useNavigate();

  const [giftData, setGiftData] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchGift = async () => {
      try {
        setLoading(true);
        if (!giftId) {
          setError('Gift not found');
          return;
        }

        const response = await apiService.getGift(giftId);
        if (response.success && response.data) {
          setGiftData(response.data);
          generateSlides(response.data);
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

  // Auto-play background audio
  useEffect(() => {
    if (!loading && !error && slides.length > 0) {
      const audio = new Audio('/final 2.mp4'); // Using the existing audio file
      audio.loop = true;
      audio.volume = 0.3; // Playful but not overwhelming
      
      const playAudio = async () => {
        try {
          await audio.play();
        } catch (err) {
          console.log('Audio autoplay blocked by browser');
        }
      };

      // Try to play audio after a short delay
      const timer = setTimeout(playAudio, 1000);

      return () => {
        clearTimeout(timer);
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [loading, error, slides.length]);

  const generateSlides = (data: GiftData) => {
    const { gift, design } = data;

    const generatedSlides = [
      {
        id: 'intro',
        video: VIDEO_TEMPLATES[0],
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        content: (
          <div className="text-center space-y-4 px-4 max-w-4xl mx-auto animate-fade-in-up" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', animation: 'fadeInUp 0.8s ease-out forwards' }}>
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-black leading-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word' }}>
              {gift.senderName} sent you something special
            </p>
          </div>
        )
      },
      {
        id: 'recipient',
        video: VIDEO_TEMPLATES[1],
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        content: (
          <div className="text-center space-y-4 px-4 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', animation: 'fadeInUp 0.8s ease-out forwards' }}>
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-black leading-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word' }}>
              For {gift.recipientName}
            </p>
          </div>
        )
      },
      {
        id: 'message',
        video: VIDEO_TEMPLATES[2],
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        content: gift.message ? (
          <div className="flex items-center justify-center h-full px-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            <div className="text-center max-w-4xl mx-auto" style={{ animation: 'fadeInScale 0.8s ease-out forwards' }}>
              <p className="text-2xl md:text-3xl lg:text-4xl text-white font-bold leading-relaxed" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word', hyphens: 'auto' }}>
                "{gift.message}" - {gift.senderName}
              </p>
            </div>
          </div>
        ) : null
      },

      {
        id: 'design-image',
        video: VIDEO_TEMPLATES[4],
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        content: (
          <div className="flex items-center justify-center w-full h-full px-4">
            <div className="w-full max-w-lg aspect-square" style={{ animation: 'fadeInScale 1s ease-out forwards' }}>
              {design.modelFiles?.modelFile || design.modelFiles?.storedModelUrl || design.generated3DModel?.url ? (
                <ModelViewer
                  modelUrl={design.modelFiles?.modelFile || design.modelFiles?.storedModelUrl || design.generated3DModel?.url}
                  className=""
                  lighting={70}
                  background={0}
                  size={20}
                  cameraAngle={50}
                />
              ) : design.modelFiles?.originalImage || design.images?.[0]?.url ? (
                <div className="w-full h-full">
                  <img
                    src={design.modelFiles?.originalImage || design.images[0].url}
                    alt="Design"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-transparent flex items-center justify-center">
                  <p className="text-white">No model available</p>
                </div>
              )}
            </div>
          </div>
        )
      },
      {
        id: 'download',
        video: VIDEO_TEMPLATES[5],
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        content: (
          <div className="text-center space-y-6 px-4 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', animation: 'fadeInUp 0.8s ease-out forwards' }}>
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-black leading-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word' }}>
              Ready to download your 3D model?
            </p>
            <button
              onClick={() => {
                if (giftId) apiService.trackGiftDownload(giftId);
                navigate(`/download/${design.id}`);
              }}
              className="px-8 md:px-12 py-4 md:py-5 bg-white text-black rounded-full text-lg md:text-xl font-black flex items-center gap-3 mx-auto hover:scale-110 transition-transform"
              style={{ animation: 'fadeInScale 1s ease-out 0.3s forwards', opacity: 0 }}
            >
              <Download className="w-6 h-6 md:w-7 md:h-7" />
              Download Now
            </button>
          </div>
        )
      },
      {
        id: 'thanks',
        video: VIDEO_TEMPLATES[6],
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        content: (
          <div className="text-center space-y-4 px-4 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', animation: 'fadeInUp 0.8s ease-out forwards' }}>
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-black leading-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', wordBreak: 'break-word' }}>
              Thank you from {gift.senderName}
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-white font-bold" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)', animation: 'fadeInUp 0.8s ease-out 0.3s forwards', opacity: 0 }}>
              Created with Cudliy
            </p>
          </div>
        )
      }
    ].filter(slide => slide.content !== null);

    setSlides(generatedSlides);
  };

  useEffect(() => {
    if (slides.length === 0 || isPaused) return;

    // Use longer duration for the 3D model slide (20 seconds), shorter for others (4 seconds)
    const currentSlideId = slides[currentSlide]?.id;
    const duration = currentSlideId === 'design-image' ? 20000 : 4000;

    const timer = setTimeout(() => {
      setCurrentSlide((prev) => {
        if (prev === slides.length - 1) return prev;
        return prev + 1;
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [currentSlide, slides.length, isPaused]);

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
        {/* Gradient Fallback - Behind video */}
        <div 
          className="absolute inset-0" 
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
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            minWidth: '100%', 
            minHeight: '100%',
            objectFit: 'cover',
            zIndex: 1
          }}
          onError={() => {
            console.error('Video failed to load:', currentSlideData.video);
            // Video will be transparent, gradient shows through
          }}
          onLoadedData={() => {
            console.log('Video loaded successfully:', currentSlideData.video);
          }}
        >
          <source src={currentSlideData.video} type="video/mp4" />
        </video>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-center p-4 md:p-8">
        {currentSlideData.content}
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
      >
        <X className="w-6 h-6" />
      </button>


      </div>
    </>
  );
}
