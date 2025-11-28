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

  const generateSlides = (data: GiftData) => {
    const { gift, design } = data;

    const generatedSlides = [
      {
        id: 'intro',
        video: VIDEO_TEMPLATES[0],
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        content: (
          <div className="text-center space-y-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            <p className="text-3xl md:text-4xl lg:text-5xl text-white font-black typing-text" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
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
          <div className="text-center space-y-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            <p className="text-3xl md:text-4xl lg:text-5xl text-white font-black typing-text" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
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
          <div className="text-center space-y-4 max-w-3xl mx-auto px-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            <p className="text-2xl md:text-3xl lg:text-4xl text-white font-bold leading-relaxed typing-text" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
              "{gift.message}" - {gift.senderName}
            </p>
          </div>
        ) : null
      },
      {
        id: 'design-intro',
        video: VIDEO_TEMPLATES[3],
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        content: (
          <div className="text-center space-y-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            <p className="text-3xl md:text-4xl lg:text-5xl text-white font-black typing-text" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
              Your 3D model created just for you
            </p>
          </div>
        )
      },
      {
        id: 'design-image',
        video: VIDEO_TEMPLATES[4],
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        content: (
          <div className="text-center space-y-6 w-full px-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            {design.modelFiles?.glbFile ? (
              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto aspect-square">
                <div 
                  dangerouslySetInnerHTML={{
                    __html: `<model-viewer src="${design.modelFiles.glbFile}" alt="3D Model" auto-rotate camera-controls style="width: 100%; height: 100%;" class="rounded-3xl"></model-viewer>`
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : design.modelFiles?.originalImage || design.images?.[0]?.url ? (
              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={design.modelFiles?.originalImage || design.images[0].url}
                  alt="Design"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            {design.originalText && design.originalText !== 'Creator' && (
              <p className="text-2xl md:text-3xl text-white font-bold px-4" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
                {design.originalText}
              </p>
            )}
          </div>
        )
      },
      {
        id: 'download',
        video: VIDEO_TEMPLATES[5],
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        content: (
          <div className="text-center space-y-6" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            <p className="text-3xl md:text-4xl lg:text-5xl text-white font-black typing-text" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
              Ready to download your 3D model?
            </p>
            <button
              onClick={() => {
                if (giftId) apiService.trackGiftDownload(giftId);
                navigate(`/download/${design.id}`);
              }}
              className="px-12 py-5 bg-white text-black rounded-full text-xl font-black flex items-center gap-3 mx-auto"
            >
              <Download className="w-7 h-7" />
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
          <div className="text-center space-y-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            <p className="text-3xl md:text-4xl lg:text-5xl text-white font-black typing-text" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
              Thank you from {gift.senderName}
            </p>
            <p className="text-xl md:text-2xl text-white font-bold" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
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
    <div className="fixed inset-0 overflow-hidden" style={{ background: currentSlideData.gradient || '#000' }}>
      <video
        key={currentSlideData.video}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-100"
        onError={(e) => {
          console.error('Video failed to load:', currentSlideData.video);
          e.currentTarget.style.display = 'none';
        }}
        onLoadedData={() => {
          console.log('Video loaded successfully:', currentSlideData.video);
        }}
      >
        <source src={currentSlideData.video} type="video/mp4" />
      </video>



      <div className="relative z-10 h-full flex items-center justify-center p-8">
        {currentSlideData.content}
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      <style>{`
        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }
        .typing-text {
          overflow: hidden;
          white-space: nowrap;
          animation: typing 2s steps(40, end);
          display: inidden;
          border-right: 2px solid white;
          white-space: nowrap;
          animation: typing 2s steps(40, end);
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
