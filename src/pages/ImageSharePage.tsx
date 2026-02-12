import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import CategorySelector from '../components/CategorySelector';
import { useUser } from '../hooks/useUser';
import { toast } from '@/lib/sonner';
import { r2Service } from '../services/cloudflareR2';

interface SharedImage {
  id: string;
  file?: File;
  url: string;
  selected: boolean;
}

interface ImageShareData {
  type: 'uploaded';
  images: SharedImage[];
  userId: string;
  createdAt: string;
  category?: string;
}

export default function ImageSharePage() {
  const navigate = useNavigate();
  const { getUserName } = useUser();

  // Force light mode for this page
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.body.style.backgroundColor = 'white';
    
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Check if screen height is small
  const isSmallHeight = typeof window !== 'undefined' && window.innerHeight < 700;

  // Form state
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [imageData, setImageData] = useState<ImageShareData | null>(null);

  // Initialize sender name and load image data
  useEffect(() => {
    setSenderName(getUserName());
    
    // Clean up old localStorage entries to prevent quota issues
    try {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('image_share_img_')) {
          try {
            // Extract timestamp from key (format: image_share_img_TIMESTAMP_...)
            const timestampMatch = key.match(/image_share_img_(\d+)_/);
            if (timestampMatch) {
              const timestamp = parseInt(timestampMatch[1]);
              if (timestamp < oneHourAgo) {
                localStorage.removeItem(key);
                console.log('Cleaned up old localStorage entry:', key);
              }
            }
          } catch (e) {
            // If we can't parse, remove it anyway
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      console.warn('Error cleaning localStorage:', e);
    }
    
    // Load image data from session storage
    const storedData = sessionStorage.getItem('share_images');
    console.log('Raw stored data length:', storedData?.length || 0); // Debug log
    console.log('User agent:', navigator.userAgent); // Mobile detection
    console.log('Is mobile:', /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as ImageShareData;
        console.log('Parsed image data:', {
          type: data.type,
          imageCount: data.images?.length || 0,
          platform: (data as any).platform || 'unknown',
          version: (data as any).version || 'unknown'
        });
        
        // Validate image data for mobile
        if (!data.images || data.images.length === 0) {
          throw new Error('No images found in share data');
        }
        
        // Check for mobile-specific issues
        const invalidImages = data.images.filter(img => 
          !img.url || (!img.url.startsWith('data:image/') && !img.url.startsWith('blob:') && !img.url.startsWith('http'))
        );
        
        if (invalidImages.length > 0) {
          console.error('Invalid image URLs found:', invalidImages);
          throw new Error(`${invalidImages.length} images have invalid URLs`);
        }
        
        setImageData(data);
      } catch (err) {
        console.error('Error parsing image data:', err);
        const errorMsg = err instanceof Error ? err.message : 'Invalid image data';
        toast.error(`Mobile sharing error: ${errorMsg}`);
        
        // Clear corrupted data
        sessionStorage.removeItem('share_images');
        navigate('/design');
      }
    } else {
      console.error('No stored image data found');
      toast.error('No images to share. Please upload images first.');
      navigate('/design');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMIT CLICKED ===');
    console.log('recipientName:', recipientName);
    console.log('agreeToTerms:', agreeToTerms);
    console.log('imageData:', imageData);
    
    setError(null);

    if (!imageData) {
      console.log('ERROR: No image data found');
      setError('No image data found');
      return;
    }

    if (!recipientName) {
      console.log('ERROR: No recipient name');
      setError('Please enter recipient name');
      return;
    }

    if (!agreeToTerms) {
      console.log('ERROR: Terms not agreed');
      setError('Please agree to the terms');
      return;
    }

    try {
      setLoading(true);
      console.log('Form submission started');
      console.log('ImageData before conversion:', {
        type: imageData.type,
        imageCount: imageData.images?.length || 0,
        platform: (imageData as any).platform || 'unknown'
      });

      // Mobile-specific validation
      if (!imageData.images || imageData.images.length === 0) {
        throw new Error('No images found to process');
      }

      // Check for mobile memory constraints
      const totalSize = imageData.images.reduce((total, img) => {
        if (img.url.startsWith('data:image/')) {
          // Estimate base64 size
          return total + (img.url.length * 0.75); // base64 is ~33% larger than binary
        }
        return total;
      }, 0);

      console.log('Total estimated image size:', Math.round(totalSize / 1024 / 1024), 'MB');

      if (totalSize > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('Images too large for mobile processing. Please select fewer or smaller images.');
      }

      // Process and upload images to Cloudflare R2
      console.log('Starting image processing with R2...');
      const processedImages = await r2Service.processAndUploadImages(imageData.images);

      if (!processedImages || processedImages.length === 0) {
        throw new Error('Failed to process images for sharing');
      }

      // Create a unique share ID
      const shareId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Prepare share data with processed images (only store R2 URLs, not base64)
      const shareData = {
        id: shareId,
        type: 'image_collection',
        images: processedImages.map(img => ({
          id: img.id,
          url: img.url.startsWith('https://pub-1ed89e0d7a8c4a12b06428c0c9047120.r2.dev') ? img.url : img.url, // Ensure R2 URLs
          selected: true
        })),
        senderName: isAnonymous ? 'Anonymous' : senderName,
        recipientName,
        recipientEmail,
        message,
        category: selectedCategory,
        userId: imageData.userId,
        createdAt: new Date().toISOString()
      };

      // Store in local storage (only R2 URLs, much smaller than base64)
      console.log('Storing shareId:', shareId);
      console.log('Storing key:', `image_share_${shareId}`);
      console.log('Storing data:', shareData);
      
      try {
        localStorage.setItem(`image_share_${shareId}`, JSON.stringify(shareData));
      } catch (quotaError) {
        console.error('LocalStorage quota exceeded:', quotaError);
        // Clear old share data to make space
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('image_share_') && key !== `image_share_${shareId}`) {
            localStorage.removeItem(key);
          }
        });
        // Try again
        localStorage.setItem(`image_share_${shareId}`, JSON.stringify(shareData));
      }
      
      // Create share link
      const link = `https://app.cudliy.com/gift/images/${shareId}`;
      setShareLink(link);
      setStep('success');

      toast.success('Share link created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!imageData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-600">Loading images...</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white overflow-hidden hide-scrollbar" style={{ transform: 'scale(0.92)', transformOrigin: 'top center' }}>
        <div className={`w-full ${isSmallHeight ? 'p-2' : 'p-2 sm:p-4 lg:p-8'}`}>
          <div className={`w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row ${isSmallHeight ? 'gap-3' : 'gap-4 sm:gap-8 lg:gap-32'} items-center justify-center min-h-screen`}>
            {/* Left Side - Image Preview (Hidden on mobile and tablet) */}
            <div 
              className="hidden lg:flex items-center justify-center rounded-[32px] overflow-hidden flex-shrink-0" 
              style={{ 
                width: '642px', 
                height: '579.56px',
                backgroundColor: '#F5F5F5',
                minHeight: '579.56px'
              }}
            >
              <div className="w-full h-full flex items-center justify-center p-4" style={{ backgroundColor: '#F5F5F5' }}>
                {imageData && imageData.images && imageData.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 w-full" style={{ maxHeight: '500px' }}>
                    {imageData.images.slice(0, 4).map((image, index) => (
                      <div 
                        key={image.id || index} 
                        className="rounded-lg overflow-hidden bg-white p-2 flex items-center justify-center"
                        style={{ 
                          aspectRatio: '1',
                          maxHeight: '240px',
                          height: '240px'
                        }}
                      >
                        <img
                          src={image.url}
                          alt={`Shared image ${index + 1}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', image.url);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center">
                    <div className="text-6xl mb-4">📸</div>
                    <p>Your Images</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Success Content */}
            <div className={`w-full lg:flex-1 lg:max-w-[400px] flex flex-col justify-center mx-auto`} style={{ minHeight: '579.56px' }}>
              {/* Header */}
              <div className={`${isSmallHeight ? 'mb-4' : 'mb-4 sm:mb-6 lg:mb-8'} w-full max-w-[406.4px] mx-auto`}>
                <img 
                  src="/CudliyLogo.svg" 
                  alt="Cudliy Logo" 
                  style={{
                    width: '31px',
                    height: '27px',
                    transform: 'rotate(0deg)'
                  }}
                  className={`${isSmallHeight ? 'mb-2' : 'mb-2 sm:mb-4'}`}
                />
                <h1 
                  className={`text-gray-900 mb-2 ${isSmallHeight ? 'text-2xl' : 'text-2xl sm:text-3xl lg:text-[32px]'}`}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    lineHeight: '1.1',
                    letterSpacing: '0%',
                    textAlign: 'left'
                  }}
                >
                  Your link is ready
                </h1>
                <p className={`text-gray-600 ${isSmallHeight ? 'text-[12px]' : 'text-[12px] sm:text-[14px]'} text-left`}>
                  Here's your personalized image collection link
                </p>
              </div>

              {/* Link Display */}
              <div 
                className="mb-6 flex items-center gap-2 w-full max-w-[406.4px] mx-auto"
                style={{
                  height: '40px',
                  borderRadius: '25px',
                  borderWidth: '0.5px',
                  borderColor: '#D1D5DB',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  backgroundColor: 'white'
                }}
              >
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="hover:opacity-70 transition-opacity"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center mb-8">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    width: '53px',
                    height: '54px',
                    borderRadius: '40px',
                    borderWidth: '1px',
                    borderColor: '#DDDDDD',
                    backgroundColor: '#DDDDDD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="hover:bg-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={copyToClipboard}
                  style={{
                    width: '178px',
                    height: '54px',
                    borderRadius: '40px',
                    borderWidth: '1px',
                    backgroundColor: '#313131',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {/* Social Share */}
              <div className="pt-8">
                <p className="text-sm text-gray-500 mb-6 text-center">Share Alternatively on</p>
                <div className="flex gap-6 justify-center">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out these amazing images I want to share with you! ${shareLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                    title="Share on WhatsApp"
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                    </svg>
                  </a>
                  <a
                    href={`https://www.instagram.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                    title="Share on Instagram"
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-pink-500">
                      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
                    </svg>
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                    title="Share on Facebook"
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden hide-scrollbar" style={{ transform: 'scale(0.92)', transformOrigin: 'top center' }}>
      <div className={`w-full ${isSmallHeight ? 'p-2' : 'p-2 sm:p-4 lg:p-8'}`}>
        <div className={`w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row ${isSmallHeight ? 'gap-3' : 'gap-4 sm:gap-8 lg:gap-32'} items-center justify-center min-h-screen`}>
          {/* Left Side - Image Preview (Hidden on mobile and tablet) */}
          <div 
            className="hidden lg:flex items-center justify-center rounded-[24px] lg:rounded-[32px] overflow-hidden flex-shrink-0" 
            style={{ 
              width: '642px', 
              height: '579.56px',
              backgroundColor: '#F5F5F5',
              minHeight: '579.56px'
            }}
          >
            <div className="w-full h-full flex items-center justify-center p-4" style={{ backgroundColor: '#F5F5F5' }}>
              {imageData && imageData.images && imageData.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 w-full" style={{ maxHeight: '500px' }}>
                  {imageData.images.slice(0, 4).map((image, index) => (
                    <div 
                      key={image.id || index} 
                      className="rounded-lg overflow-hidden bg-white p-2 flex items-center justify-center"
                      style={{ 
                        aspectRatio: '1',
                        maxHeight: '240px',
                        height: '240px'
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`Shared image ${index + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', image.url);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={() => console.log('Image loaded successfully:', image.url)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <p>Your Images</p>
                  <p className="text-xs mt-2">Debug: {imageData ? `${imageData.images?.length || 0} images` : 'No data'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Form Content */}
          <div className="w-full lg:flex-1 lg:max-w-[400px] flex flex-col justify-center mx-auto" style={{ minHeight: '579.56px' }}>
            {/* Header */}
            <div className={`${isSmallHeight ? 'mb-4' : 'mb-4 sm:mb-6 lg:mb-8'} w-full max-w-[406.4px] mx-auto`}>
              <img 
                src="/CudliyLogo.svg" 
                alt="Cudliy Logo" 
                style={{
                  width: '31px',
                  height: '27px',
                  transform: 'rotate(0deg)'
                }}
                className="mb-2 sm:mb-4"
              />
              <h1 
                className="text-gray-900 mb-2 text-2xl sm:text-3xl lg:text-[32px]"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  lineHeight: '1.1',
                  letterSpacing: '0%',
                  textAlign: 'left'
                }}
              >
                Share your images
              </h1>
              <p className="text-gray-600 text-[12px] sm:text-[14px] text-left">
                Create a beautiful collection to share with someone special.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Category Selector */}
              <div className="w-full max-w-[406.4px] mx-auto">
                <CategorySelector
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>

              {/* Sender Name */}
              <div className="w-full max-w-[406.4px] mx-auto">
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your Name"
                  required={!isAnonymous}
                  disabled={isAnonymous}
                  className={`w-full focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-300 ${isAnonymous ? 'bg-gray-100 text-gray-400' : ''}`}
                  style={{
                    height: '40px',
                    borderRadius: '25px',
                    borderWidth: '0.5px',
                    borderColor: '#D1D5DB',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    fontSize: '15px',
                    outline: 'none',
                    backgroundColor: isAnonymous ? '#f3f4f6' : 'white',
                    color: isAnonymous ? '#9ca3af' : '#111827',
                    WebkitTextFillColor: isAnonymous ? '#9ca3af' : '#111827',
                    opacity: 1
                  } as React.CSSProperties}
                />
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center gap-3 max-w-[406.4px] mx-auto">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    if (e.target.checked) {
                      setSenderName('');
                    } else {
                      setSenderName(getUserName());
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer text-blue-600 bg-white border-2 focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="anonymous" className="text-[13px] text-gray-600 cursor-pointer">
                  Send anonymously (recipient won't see your name)
                </label>
              </div>

              {/* Recipient Name */}
              <div className="w-full max-w-[406.4px] mx-auto">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Recipient Name"
                  required
                  className="w-full focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-300"
                  style={{
                    height: '40px',
                    borderRadius: '25px',
                    borderWidth: '0.5px',
                    borderColor: '#D1D5DB',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    fontSize: '15px',
                    outline: 'none',
                    backgroundColor: 'white',
                    color: '#111827',
                    WebkitTextFillColor: '#111827',
                    opacity: 1
                  } as React.CSSProperties}
                />
              </div>

              {/* Recipient Email */}
              <div className="w-full max-w-[406.4px] mx-auto">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Recipient Email (Optional)"
                  className="w-full focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-300"
                  style={{
                    height: '40px',
                    borderRadius: '25px',
                    borderWidth: '0.5px',
                    borderColor: '#D1D5DB',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    fontSize: '15px',
                    outline: 'none',
                    backgroundColor: 'white',
                    color: '#111827',
                    WebkitTextFillColor: '#111827',
                    opacity: 1
                  } as React.CSSProperties}
                />
              </div>

              {/* Message */}
              <div className="w-full max-w-[406.4px] mx-auto">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a short note they will see first"
                  className="w-full focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-300"
                  style={{
                    height: '112px',
                    borderRadius: '25px',
                    borderWidth: '0.5px',
                    borderColor: '#D1D5DB',
                    padding: '14px 20px',
                    fontSize: '15px',
                    outline: 'none',
                    backgroundColor: 'white',
                    resize: 'none',
                    color: '#111827',
                    WebkitTextFillColor: '#111827',
                    opacity: 1
                  } as React.CSSProperties}
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2 max-w-[406.4px] mx-auto">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 cursor-pointer text-blue-600 bg-white border-2 focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="terms" className="text-[13px] text-gray-600 cursor-pointer leading-relaxed">
                  I understand this is a digital image collection and they will receive a private link.
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 sm:pt-6 justify-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    width: '53px',
                    height: '54px',
                    borderRadius: '40px',
                    borderWidth: '1px',
                    borderColor: '#DDDDDD',
                    backgroundColor: '#DDDDDD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="hover:bg-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '178px',
                    height: '54px',
                    borderRadius: '40px',
                    borderWidth: '1px',
                    backgroundColor: '#313131',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  className="hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Share now →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}