import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { apiService } from '../services/api';
import { useUser } from '../hooks/useUser';

export default function SendGiftPage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { getUserName } = useUser();

  // Form state
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
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
        senderName,
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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-8 lg:gap-32 items-center lg:items-start justify-center">
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
          <div className="w-full lg:flex-1 lg:max-w-[400px] pt-4 lg:pt-8 mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <img 
                src="/CudliyLogo.svg" 
                alt="Cudliy Logo" 
                style={{
                  width: '31px',
                  height: '27px',
                  transform: 'rotate(0deg)'
                }}
                className="mx-auto mb-4"
              />
              <h1 
                className="text-gray-900 mb-2 mx-auto"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '32px',
                  lineHeight: '34px',
                  letterSpacing: '0%',
                  textAlign: 'center',
                  maxWidth: '324px'
                }}
              >
                Your link is ready
              </h1>
              <p className="text-gray-600 text-[14px]">
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
                  height: '53px',
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
                className="hover:bg-black transition-colors"
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
                  href={`https://instagram.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-gray-700">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
                  </svg>
                </a>
                <a
                  href={`https://linkedin.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-gray-700">
                    <path d="M20 3H4C3.4 3 3 3.4 3 4V20C3 20.6 3.4 21 4 21H20C20.6 21 21 20.6 21 20V4C21 3.4 20.6 3 20 3ZM8.5 18.3H5.7V10H8.5V18.3ZM7.1 8.7C6.2 8.7 5.5 8 5.5 7.1C5.5 6.2 6.2 5.5 7.1 5.5C8 5.5 8.7 6.2 8.7 7.1C8.7 8 8 8.7 7.1 8.7ZM18.3 18.3H15.5V14.2C15.5 13.2 15.5 11.9 14.1 11.9C12.7 11.9 12.5 13 12.5 14.1V18.3H9.7V10H12.4V11.1H12.4C12.8 10.4 13.7 9.7 15 9.7C17.8 9.7 18.3 11.5 18.3 13.8V18.3Z" fill="currentColor"/>
                  </svg>
                </a>
                <a
                  href={`https://twitter.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href={`https://facebook.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
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
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-8 lg:gap-32 items-center lg:items-start justify-center">
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

        {/* Right Side - Form Content */}
        <div className="w-full lg:flex-1 lg:max-w-[400px] pt-4 lg:pt-8 mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <img 
              src="/CudliyLogo.svg" 
              alt="Cudliy Logo" 
              style={{
                width: '31px',
                height: '27px',
                transform: 'rotate(0deg)'
              }}
              className="mx-auto mb-4"
            />
            <h1 
              className="text-gray-900 mb-2 mx-auto"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '32px',
                lineHeight: '34px',
                letterSpacing: '0%',
                textAlign: 'center',
                maxWidth: '324px'
              }}
            >
              Send your Digital gift
            </h1>
            <p className="text-gray-600 text-[14px]">
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex gap-3 pt-6 justify-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  width: '53px',
                  height: '53px',
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
                className="hover:bg-black transition-colors disabled:opacity-50"
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