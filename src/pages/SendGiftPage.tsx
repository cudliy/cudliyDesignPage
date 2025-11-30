import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { apiService } from '../services/api';
import { useUser } from '../hooks/useUser';

export default function SendGiftPage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { getUserName } = useUser();

  // Check if screen height is small
  const isSmallHeight = typeof window !== 'undefined' && window.innerHeight < 700;

  // Form state
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [giftLink, setGiftLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [design, setDesign] = useState<any>(null);
  const [loadingDesign, setLoadingDesign] = useState(true);

  // Initialize sender name and fetch design
  useEffect(() => {
    setSenderName(getUserName());
    
    // Fetch design data
    const fetchDesign = async () => {
      if (!designId) return;
      
      try {
        setLoadingDesign(true);
        const response = await apiService.getDesign(designId);
        if (response.success && response.data) {
          setDesign(response.data);
        }
      } catch (err) {
        console.error('Error fetching design:', err);
      } finally {
        setLoadingDesign(false);
      }
    };
    
    fetchDesign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!designId) {
      setError('Design not found');
      return;
    }

    if (!recipientName) {
      setError('Please enter recipient name');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms');
      return;
    }

    try {
      setLoading(true);
      

      
      const response = await apiService.createGift(
        designId,
        isAnonymous ? 'Anonymous' : senderName,
        recipientName,
        recipientEmail,
        message,
        localStorage.getItem('userId') || undefined
      );

      if (response.success && response.data) {
        setGiftLink(response.data.shareLink);
        setStep('success');
      } else {
        setError('Failed to create gift link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gift');
    } finally {
      setLoading(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(giftLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };



  if (loadingDesign) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img src="/GIFS/Loading-State.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-600">Loading design...</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className={`min-h-screen bg-[#FAFAFA] flex items-center justify-center ${isSmallHeight ? 'p-2' : 'p-2 sm:p-4 lg:p-8'}`}>
        <div className={`w-full max-w-[1400px] flex flex-col lg:flex-row ${isSmallHeight ? 'gap-3' : 'gap-4 sm:gap-8 lg:gap-32'} items-center lg:items-start justify-center`}>
          {/* Left Side - 3D Model (Hidden on mobile and tablet) */}
          <div 
            className="hidden lg:flex items-center justify-center rounded-[32px] overflow-hidden" 
            style={{ 
              width: '642px', 
              height: '579.56px',
              backgroundColor: '#F5F5F5'
            }}
          >
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
              {design?.modelFiles?.originalImage || design?.images?.[0]?.url ? (
                <div 
                  className="max-w-[90%] max-h-[90%] flex items-center justify-center"
                  style={{ 
                    backgroundColor: '#F5F5F5',
                    padding: '20px'
                  }}
                >
                  <img
                    src={design.modelFiles?.originalImage || design.images[0].url}
                    alt="3D Design"
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'brightness(0.98) contrast(1.02)',
                      mixBlendMode: 'darken'
                    }}
                  />
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="text-6xl mb-4">🎁</div>
                  <p>Your 3D Design</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Success Content */}
          <div className={`w-full lg:flex-1 lg:max-w-[400px] ${isSmallHeight ? 'pt-2' : 'pt-2 sm:pt-4 lg:pt-8'} mx-auto`}>
            {/* Header */}
            <div className={`${isSmallHeight ? 'mb-4' : 'mb-4 sm:mb-6 lg:mb-8'} text-center`}>
              <img 
                src="/CudliyLogo.svg" 
                alt="Cudliy Logo" 
                style={{
                  width: '31px',
                  height: '27px',
                  transform: 'rotate(0deg)'
                }}
                className={`mx-auto ${isSmallHeight ? 'mb-2' : 'mb-2 sm:mb-4'}`}
              />
              <h1 
                className={`text-gray-900 mb-2 mx-auto ${isSmallHeight ? 'text-2xl' : 'text-2xl sm:text-3xl lg:text-[32px]'}`}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  lineHeight: '1.1',
                  letterSpacing: '0%',
                  textAlign: 'center',
                  maxWidth: '324px'
                }}
              >
                Your link is ready
              </h1>
              <p className={`text-gray-600 ${isSmallHeight ? 'text-[12px]' : 'text-[12px] sm:text-[14px]'}`}>
                Here's personalized link you can share. No sign-in required
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
                value={giftLink}
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
                <ArrowLeft className="w-5 h-5 text-gray-700" />
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
                  href={`https://www.instagram.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  title="Share on Instagram"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-gray-700">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
                  </svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(giftLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  title="Share on LinkedIn"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-gray-700">
                    <path d="M20 3H4C3.4 3 3 3.4 3 4V20C3 20.6 3.4 21 4 21H20C20.6 21 21 20.6 21 20V4C21 3.4 20.6 3 20 3ZM8.5 18.3H5.7V10H8.5V18.3ZM7.1 8.7C6.2 8.7 5.5 8 5.5 7.1C5.5 6.2 6.2 5.5 7.1 5.5C8 5.5 8.7 6.2 8.7 7.1C8.7 8 8 8.7 7.1 8.7ZM18.3 18.3H15.5V14.2C15.5 13.2 15.5 11.9 14.1 11.9C12.7 11.9 12.5 13 12.5 14.1V18.3H9.7V10H12.4V11.1H12.4C12.8 10.4 13.7 9.7 15 9.7C17.8 9.7 18.3 11.5 18.3 13.8V18.3Z" fill="currentColor"/>
                  </svg>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out this amazing 3D design gift I created for you! ${giftLink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  title="Share on WhatsApp"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                  </svg>
                </a>
                <a
                  href={`https://www.tiktok.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  title="Share on TikTok"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(giftLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  title="Share on Facebook"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#FAFAFA] flex items-center justify-center ${isSmallHeight ? 'p-2' : 'p-2 sm:p-4 lg:p-8'}`}>
      <div className={`w-full max-w-[1400px] flex flex-col lg:flex-row ${isSmallHeight ? 'gap-3' : 'gap-4 sm:gap-8 lg:gap-32'} items-center lg:items-start justify-center`}>
        {/* Left Side - 3D Model (Hidden on mobile and tablet) */}
        <div 
          className="hidden lg:flex items-center justify-center rounded-[24px] lg:rounded-[32px] overflow-hidden" 
          style={{ 
            width: '642px', 
            height: '579.56px',
            backgroundColor: '#F5F5F5'
          }}
        >
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
            {design?.modelFiles?.originalImage || design?.images?.[0]?.url ? (
              <div 
                className="max-w-[90%] max-h-[90%] flex items-center justify-center"
                style={{ 
                  backgroundColor: '#F5F5F5',
                  padding: '20px'
                }}
              >
                <img
                  src={design.modelFiles?.originalImage || design.images[0].url}
                  alt="3D Design"
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'brightness(0.98) contrast(1.02)',
                    mixBlendMode: 'darken'
                  }}
                />
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <div className="text-6xl mb-4">🎁</div>
                <p>Your 3D Design</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className="w-full lg:flex-1 lg:max-w-[400px] pt-2 sm:pt-4 lg:pt-8 mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
            <img 
              src="/CudliyLogo.svg" 
              alt="Cudliy Logo" 
              style={{
                width: '31px',
                height: '27px',
                transform: 'rotate(0deg)'
              }}
              className="mx-auto mb-2 sm:mb-4"
            />
            <h1 
              className="text-gray-900 mb-2 mx-auto text-2xl sm:text-3xl lg:text-[32px]"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                lineHeight: '1.1',
                letterSpacing: '0%',
                textAlign: 'center',
                maxWidth: '324px'
              }}
            >
              Send your Digital gift
            </h1>
            <p className="text-gray-600 text-[12px] sm:text-[14px]">
              Tell us who it is for and how you want it delivered.
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
                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-black"
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
                className="mt-0.5 w-4 h-4 rounded border-gray-300 cursor-pointer accent-black"
              />
              <label htmlFor="terms" className="text-[13px] text-gray-600 cursor-pointer leading-relaxed">
                I understand this is a digital gift and they will receive a private link, not a physical package.
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
                <ArrowLeft className="w-5 h-5 text-gray-700" />
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
                {loading ? 'Creating...' : 'Send now →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}