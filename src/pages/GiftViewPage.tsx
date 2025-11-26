import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import { apiService } from '../services/api';

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
  'https://assets.mixkit.co/videos/preview/mixkit-abstract-blue-background-with-particles-5052-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-colorful-gradient-background-26068-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-purple-and-pink-gradient-background-26069-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-neon-lights-background-26070-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-blue-abstract-waves-1040-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-golden-particles-background-26071-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-colorful-bokeh-lights-1167-large.mp4',
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

  const generateSlides = (data: GiftData) => {
    const { gift, design } = data;

    const generatedSlides = [
      {
        id: 'intro',
        video: VIDEO_TEMPLATES[0],
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        content: (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="text-7xl mb-4">🎁</div>
            <h1 className="text-6xl font-bold text-white mb-4">
              {gift.senderName}
            </h1>
            <p className="text-3xl text-white/90">sent you something special</p>
          </div>
        )
      },
      {
        id: 'recipient',
        video: VIDEO_TEMPLATES[1],
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        content: (
          <div className="text-center space-y-8 animate-fade-in">
            <p className="text-4xl text-white/80">For</p>
            <h1 className="text-7xl font-bold text-white">
              {gift.recipientName}
            </h1>
          </div>
        )
      },
      {
        id: 'message',
        video: VIDEO_TEMPLATES[2],
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        content: gift.message ? (
          <div className="text-center space-y-8 animate-fade-in max-w-3xl mx-auto">
            <div className="text-6xl mb-4">💌</div>
            <p className="text-4xl text-white italic leading-relaxed">
              "{gift.message}"
            </p>
            <p className="text-2xl text-white/70">- {gift.senderName}</p>
          </div>
        ) : null
      },
      {
        id: 'design-intro',
        video: VIDEO_TEMPLATES[3],
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        content: (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="text-7xl mb-4">🎨</div>
            <h1 className="text-6xl font-bold text-white mb-4">
              Your 3D Design
            </h1>
            <p className="text-3xl text-white/90">Created just for you</p>
          </div>
        )
      },
      {
        id: 'design-image',
        video: VIDEO_TEMPLATES[4],
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        content: (
          <div className="text-center space-y-6 animate-fade-in w-full px-4">
            {design.modelFiles?.originalImage || design.images?.[0]?.url ? (
              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={design.modelFiles?.originalImage || design.images[0].url}
                  alt="Design"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            {design.originalText && design.originalText !== 'Creator' && (
              <p className="text-2xl md:text-3xl lg:text-4xl text-white font-semibold px-4 line-clamp-2">
                {design.originalText}
              </p>
            )}
          </div>
        )
      },
      {
        id: 'download',
        video: VIDEO_TEMPLATES[5],
        content: (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="text-7xl mb-4">📥</div>
            <h1 className="text-6xl font-bold text-white mb-4">
              Ready to Download?
            </h1>
            <p className="text-2xl text-white/90 mb-8">
              Get your 3D model in multiple formats
            </p>
            <button
              onClick={() => {
                if (giftId) apiService.trackGiftDownload(giftId);
                navigate(`/download/${design.id}`);
              }}
              className="px-12 py-6 bg-white text-black rounded-full text-2xl font-bold hover:scale-105 transition-transform flex items-center gap-4 mx-auto"
            >
              <Download className="w-8 h-8" />
              Download Now
            </button>
          </div>
        )
      },
      {
        id: 'thanks',
        video: VIDEO_TEMPLATES[6],
        content: (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="text-7xl mb-4">✨</div>
            <h1 className="text-6xl font-bold text-white mb-4">
              Thank You!
            </h1>
            <p className="text-3xl text-white/90">
              From {gift.senderName}
            </p>
            <p className="text-xl text-white/70 mt-8">
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

    const timer = setTimeout(() => {
      setCurrentSlide((prev) => {
        if (prev === slides.length - 1) return prev;
        return prev + 1;
      });
    }, 4000);

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
          <div className="text-6xl mb-6">❌</div>
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
    <div className="fixed inset-0 bg-black overflow-hidden">
      <video
        key={currentSlideData.video}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={currentSlideData.video} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 h-full flex items-center justify-center p-8">
        {currentSlideData.content}
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className="relative h-1 bg-white/30 rounded-full overflow-hidden transition-all"
            style={{ width: index === currentSlide ? '48px' : '24px' }}
          >
            {index === currentSlide && !isPaused && (
              <div
                className="absolute inset-0 bg-white rounded-full animate-progress"
                style={{ animation: 'progress 4s linear' }}
              />
            )}
            {index < currentSlide && (
              <div className="absolute inset-0 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsPaused(!isPaused)}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 text-white/50 text-sm"
      >
        {isPaused ? 'Tap to resume' : 'Tap to pause'}
      </button>

      <style>{`
        @keyframes progress {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
