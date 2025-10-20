import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import type { CheckoutData } from '../types/checkout';
import type { Slant3DPricing } from '../types/slant3d';

export default function CheckoutPage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [slant3DPricing, setSlant3DPricing] = useState<Slant3DPricing | null>(null);
  const [orderProcessing, setOrderProcessing] = useState(false);
  // Simple size selection to match design (affects subtotal visually only)
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;
  // Persist chosen size so backend can use it during fulfillment
  useEffect(() => {
    sessionStorage.setItem('checkout_selected_size', selectedSize);
  }, [selectedSize]);

  // Preview image URL: prefer item preview, fall back to selected or first design image from state
  // Normalize relative URLs using API origin
  const resolveUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    // Treat absolute-path URLs as coming from the API server
    const api = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
    try {
      const base = new URL(api);
      // if api ends with /api, go to root origin
      const origin = `${base.protocol}//${base.hostname}${base.port ? ':' + base.port : ''}`;
      return url.startsWith('/') ? origin + url : origin + '/' + url;
    } catch {
      return url;
    }
  };

  const previewImageUrl = useMemo(() => {
    const fromItem = checkoutData?.items?.[0]?.designImage as string | undefined;
    const fromSelected = location.state?.design?.images?.find?.((i: any) => i?.selected)?.url as string | undefined;
    const fromFirst = location.state?.design?.images?.[0]?.url as string | undefined;
    const chosen = fromItem || fromSelected || fromFirst || null;
    return resolveUrl(chosen);
  }, [checkoutData, location.state]);

  const [userId] = useState(() => {
    const authed = sessionStorage.getItem('user_id');
    if (authed) return authed;
    const guest = sessionStorage.getItem('guest_user_id');
    if (guest) return guest;
    const newGuest = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`;
    sessionStorage.setItem('guest_user_id', newGuest);
    return newGuest;
  });

  useEffect(() => {
    if (!designId) return;

    const initializeCheckout = async () => {
      try {
        setLoading(true);
        
        // Load Slant3D pricing from session storage or location state
        const storedPricing = sessionStorage.getItem('slant3d_pricing');

        if (storedPricing) {
          setSlant3DPricing(JSON.parse(storedPricing));
        } else if (location.state?.slant3DPricing) {
          setSlant3DPricing(location.state.slant3DPricing);
        }
        
        // modelUrl previously used for Slant3D upload; omitted in simplified flow

        // Get the original HTTP URL for Slant3D operations
        const storedOriginalModelUrl = sessionStorage.getItem('slant3d_original_model_url');
        const originalModelUrl = location.state?.originalModelUrl || storedOriginalModelUrl;
        
        if (originalModelUrl) {
          // Store the original URL for use in Slant3D operations
          sessionStorage.setItem('slant3d_original_model_url', originalModelUrl);
        }

        // Create checkout session (for payment processing)
        const response = await apiService.createStripeCheckout({
          userId,
          designId,
          quantity: 1,
          options: {
            size: selectedSize
          }
        });

        if (response.success && response.data) {
          setCheckoutData(response.data as unknown as CheckoutData);
        } else {
          throw new Error('Failed to create checkout');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize checkout';
        setError(`Checkout Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [designId, userId, location.state]);

  const handleProceedToPayment = async () => {
    if (!checkoutData) return;

    try {
      setOrderProcessing(true);
      setError(null);

      // Check if this is a mock checkout
      if (checkoutData.mock) {
        navigate(`/order-success?session_id=mock_${Date.now()}`);
      } else {
        // Redirect to Stripe Checkout
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        }
      }
    } catch (err) {
      // Handle specific error types with user-friendly messages
      let errorMessage = 'Order processing failed';
      if (err instanceof Error) {
        if (err.message.includes('too large') || err.message.includes('413')) {
          errorMessage = 'Model file is too large for 3D printing. Please try regenerating the model with lower quality settings or contact support for assistance.';
        } else if (err.message.includes('blob:')) {
          errorMessage = 'Invalid model file format. Please try regenerating the model.';
        } else if (err.message.includes('Slant3D API')) {
          errorMessage = '3D printing service error. Please try again or contact support.';
        } else {
          errorMessage = `Order processing failed: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setOrderProcessing(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E70D57] mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !checkoutData) {
    const isFileSizeError = error && (error.includes('too large') || error.includes('413'));
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Checkout Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Failed to load checkout'}</p>
          
          <div className="space-y-3">
            {isFileSizeError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-yellow-800 text-sm">
                    <strong>Tip:</strong> We've optimized the model generation settings to create smaller files. Try regenerating your model.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3 justify-center">
              <button 
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-full transition-colors"
              >
                Go Back
              </button>
              
              {isFileSizeError && (
                <button 
                  onClick={() => navigate(`/design/${designId}`)}
                  className="px-6 py-2 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-colors"
                >
                  Regenerate Model
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Return to Design</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Size + Summary */}
          <div>
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Choose Size</h2>
              <div className="flex gap-4">
                {/* Small */}
                <button
                  onClick={() => setSelectedSize('S')}
                  className={`w-40 h-28 rounded-2xl border transition-all text-left p-4 shadow-sm ${selectedSize==='S' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-black border-gray-200 hover:border-gray-300 hover:shadow'}`}
                >
                  <div className="font-semibold mb-1">Small</div>
                  <div className={`text-xs ${selectedSize==='S' ? 'text-white/80' : 'text-gray-500'}`}>1–4 inch<br/>perfect for tiny<br/>gifts or keepsakes.</div>
                </button>
                {/* Medium */}
                <button
                  onClick={() => setSelectedSize('M')}
                  className={`w-40 h-28 rounded-2xl border transition-all text-left p-4 shadow-sm ${selectedSize==='M' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-black border-gray-200 hover:border-gray-300 hover:shadow'}`}
                >
                  <div className="font-semibold mb-1">Medium</div>
                  <div className={`text-xs ${selectedSize==='M' ? 'text-white/80' : 'text-gray-500'}`}>5–6 inch<br/>great for small<br/>vases or desk pieces.</div>
                </button>
                {/* Large */}
                <button
                  onClick={() => setSelectedSize('L')}
                  className={`w-40 h-28 rounded-2xl border transition-all text-left p-4 shadow-sm ${selectedSize==='L' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-black border-gray-200 hover:border-gray-300 hover:shadow'}`}
                >
                  <div className="font-semibold mb-1">Large</div>
                  <div className={`text-xs ${selectedSize==='L' ? 'text-white/80' : 'text-gray-500'}`}>7–8 inch<br/>ideal for display<br/>or special gifts.</div>
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-6 w-full max-w-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Selected</span>
                <span className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-700">Size: {selectedSize === 'S' ? 'Small' : selectedSize === 'M' ? 'Medium' : 'Large'}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sub Total</span>
                  <span className="font-medium">{formatCurrency((slant3DPricing?.pricing.subtotal ?? checkoutData.pricing.subtotal))}</span>
                </div>
                {typeof (slant3DPricing?.pricing.tax ?? checkoutData.pricing.tax) === 'number' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency((slant3DPricing?.pricing.tax ?? checkoutData.pricing.tax) as number)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{formatCurrency((slant3DPricing?.pricing.shipping ?? checkoutData.pricing.shipping))}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold">{formatCurrency((slant3DPricing?.pricing.total ?? checkoutData.pricing.total))}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={orderProcessing}
                className={`w-full mt-6 font-semibold py-4 px-6 rounded-full transition-all duration-200 ${
                  orderProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#111] hover:bg-black text-white shadow-md hover:shadow-lg'
                }`}
              >
                {orderProcessing ? 'Processing…' : 'Continue to Checkout'}
              </button>
            </div>
          </div>

          {/* Right Side - Product preview */}
          <div className="lg:pl-8">
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-xl border border-gray-200 shadow-xl p-6">
              <div className="bg-[#f2f2f2] aspect-square rounded-2xl flex items-center justify-center">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt={checkoutData.items[0]?.designTitle || 'Design preview'}
                    className="object-contain w-full h-full"
                    crossOrigin="anonymous"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="text-gray-500">Preview</div>
                )}
              </div>
              {/* Print-ready cue */}
              <div className="mt-4 text-xs text-gray-500">
                Camera: centered • Size: Medium • Pro 3D render • White bg • Printable • High detail
              </div>
            </div>
            <div className="mt-4">
              <div className="text-gray-900 font-semibold">{checkoutData.items[0]?.designTitle || 'Cute Dinosaur'}</div>
              <div className="text-xs text-gray-500">3D Toys</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}