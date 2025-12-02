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
  const [isMobile, setIsMobile] = useState(false);
  // Simple size selection to match design (affects subtotal visually only)
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  // Sub-size in inches for medium/large
  const [selectedInch, setSelectedInch] = useState<5 | 6 | 7 | 8 | 4>(4);
  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;
  // Persist chosen size and inch so backend can use it during fulfillment
  useEffect(() => {
    sessionStorage.setItem('checkout_selected_size', selectedSize);
  }, [selectedSize]);

  useEffect(() => {
    sessionStorage.setItem('checkout_selected_inch', selectedInch.toString());
  }, [selectedInch]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keep inch selection in sync with size
  useEffect(() => {
    if (selectedSize === 'S') setSelectedInch(4);
    if (selectedSize === 'M' && (selectedInch !== 5 && selectedInch !== 6)) setSelectedInch(5);
    if (selectedSize === 'L' && (selectedInch !== 7 && selectedInch !== 8)) setSelectedInch(7);
  }, [selectedSize]);

  // Preview image URL: prefer item preview, fall back to selected or first design image from state
  // Normalize relative URLs using API origin
  const resolveUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    
    // Treat absolute-path URLs as coming from the API server
    const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
    
    try {
      // Ensure the API URL is valid
      const base = new URL(apiUrl);
      // if api ends with /api, go to root origin
      const origin = `${base.protocol}//${base.hostname}${base.port ? ':' + base.port : ''}`;
      return url.startsWith('/') ? origin + url : origin + '/' + url;
    } catch (error) {
      console.warn('Failed to resolve URL:', url, 'with API URL:', apiUrl, 'Error:', error);
      // Fallback: try to construct a basic URL
      try {
        const fallbackOrigin = 'http://localhost:3001';
        return url.startsWith('/') ? fallbackOrigin + url : fallbackOrigin + '/' + url;
      } catch {
        // Last resort: return the original URL if it looks like it might work
        return url.startsWith('/') ? url : '/' + url;
      }
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
    const newGuest = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('guest_user_id', newGuest);
    return newGuest;
  });

  // Pricing tiers mapping
  type Tier = { qty: number; price: number };
  const tiersByInch: Record<string, Tier[]> = {
    '1–4': [
      { qty: 1, price: 230 },
      { qty: 10, price: 1550 },
      { qty: 50, price: 4000 },
      { qty: 100, price: 7200 }
    ],
    '5': [
      { qty: 1, price: 250 },
      { qty: 10, price: 1690 },
      { qty: 50, price: 4000 },
      { qty: 100, price: 7200 }
    ],
    '6': [
      { qty: 1, price: 270 },
      { qty: 10, price: 1900 },
      { qty: 50, price: 4000 },
      { qty: 100, price: 7200 }
    ],
    '7': [
      { qty: 1, price: 290 },
      { qty: 10, price: 2000 },
      { qty: 50, price: 6500 },
      { qty: 100, price: 11000 }
    ],
    '8': [
      { qty: 1, price: 310 },
      { qty: 10, price: 2100 },
      { qty: 50, price: 6500 },
      { qty: 100, price: 11000 }
    ]
  };

  const currentInchKey = selectedSize === 'S' ? '1–4' : String(selectedInch);
  const currentTiers = tiersByInch[currentInchKey] || [];
  const onePrintTier = currentTiers.find(t => t.qty === 1);
  const uiSubtotal = onePrintTier?.price ?? (slant3DPricing?.pricing.subtotal ?? checkoutData?.pricing.subtotal ?? 0);
  const uiTax = +(uiSubtotal * 0.07).toFixed(2);
  const uiShipping = 9.99
  const uiTotal = uiSubtotal + uiTax + uiShipping;

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
        // Backend expects size under options
        const response = await apiService.createStripeCheckout({
          userId,
          designId,
          quantity: 1,
          options: { size: selectedSize, inch: selectedInch }
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
    try {
      setOrderProcessing(true);
      setError(null);

      // Always create a fresh session with current size/inch before redirecting
      const resp = await apiService.createStripeCheckout({
        userId,
        designId: designId as string,
        quantity: 1,
        options: { size: selectedSize, inch: selectedInch }
      });

      if (!resp.success || !resp.data) throw new Error(resp.error || 'Failed to create checkout');

      const session = resp.data as unknown as CheckoutData & { url?: string; mock?: boolean };

      if (session.mock) {
        navigate(`/order-success?session_id=mock_${Date.now()}`);
        return;
      }

      if (session.url) {
        window.location.href = session.url;
        return;
      }

      // Fallback to any existing URL if present
      if (checkoutData?.url) {
        window.location.href = checkoutData.url as unknown as string;
        return;
      }

      throw new Error('No checkout URL available');
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
          <img
            src="/GIFS/Loading-State.gif"
            alt="Processing"
            className="w-24 h-24 object-contain mx-auto mb-4"
          />
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

  // Mobile View
  if (isMobile) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="bg-white text-[#212121] px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Cudliy</h1>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Product Preview */}
          <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
            <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
              {previewImageUrl && (
                <img src={previewImageUrl} alt="Design" className="w-full h-full object-contain" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-[#212121] truncate">{checkoutData?.items[0]?.designTitle || 'Design'}</h3>
              <p className="text-xs text-[#212121] opacity-60">Personalized Gift</p>
            </div>
          </div>

          {/* Size Selection */}
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <h3 className="text-sm font-medium text-[#212121] mb-2">Choose Size</h3>
            <div className="space-y-2">
              {(['S', 'M', 'L'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-full p-2 rounded-full border text-left transition-all ${
                    selectedSize === size
                      ? 'bg-gray-200 text-[#212121] border-none'
                      : 'bg-white text-[#212121] border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">
                    {size === 'S' && 'Small (1-4")'}
                    {size === 'M' && 'Medium (5-6")'}
                    {size === 'L' && 'Large (7-8")'}
                  </div>
                </button>
              ))}
            </div>

            {/* Inch selector for M/L */}
            {(selectedSize === 'M' || selectedSize === 'L') && (
              <div className="mt-2">
                <p className="text-xs text-[#212121] opacity-70 mb-1">Select exact size</p>
                <div className="flex gap-2">
                  {selectedSize === 'M' && ([5, 6] as const).map(inch => (
                    <button
                      key={inch}
                      onClick={() => setSelectedInch(inch)}
                      className={`flex-1 py-2 rounded-full text-sm font-medium ${
                        selectedInch === inch
                          ? 'bg-black/20 text-white'
                          : 'bg-gray-100 text-[#212121]'
                      }`}
                    >
                      {inch}"
                    </button>
                  ))}
                  {selectedSize === 'L' && ([7, 8] as const).map(inch => (
                    <button
                      key={inch}
                      onClick={() => setSelectedInch(inch)}
                      className={`flex-1 py-2 rounded-full text-sm font-medium ${
                        selectedInch === inch
                          ? 'bg-black/20 text-white'
                          : 'bg-gray-100 text-[#212121]'
                      }`}
                    >
                      {inch}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="rounded-xl p-3 border border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Order Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Subtotal</span>
                <span className="text-sm font-semibold text-gray-900">${uiSubtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Tax</span>
                <span className="text-sm font-semibold text-gray-900">${uiTax?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Shipping</span>
                <span className="text-sm font-semibold text-gray-900">${uiShipping?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">${uiTotal?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 z-30">
          <button
            onClick={handleProceedToPayment}
            disabled={orderProcessing}
            className={`w-full h-[54px] rounded-full font-medium transition-all ${
              orderProcessing
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {orderProcessing ? 'Processing...' : 'Continue to Checkout'}
          </button>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Return to Design</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Size + Summary */}
          <div>
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Choose Size</h2>
              <div className="flex gap-4">
                {/* Small */}
                <button
                  onClick={() => setSelectedSize('S')}
                  className={`w-40 h-24 border transition-all text-left p-4 shadow-sm ${selectedSize==='S' ? 'bg-gray-200 text-black border-gray-300 shadow-lg' : 'bg-white text-black border-gray-200 hover:border-gray-300 hover:shadow'}`}
                  style={{ borderRadius: '10px' }}
                >
                  <div className="font-semibold mb-0.5">Small</div>
                  <div className={`text-xs leading-tight ${selectedSize==='S' ? 'text-gray-600' : 'text-gray-500'}`}>1–4 inch<br/>perfect for tiny<br/>gifts or keepsakes.</div>
                </button>
                {/* Medium */}
                <button
                  onClick={() => setSelectedSize('M')}
                  className={`w-40 h-24 border transition-all text-left p-4 shadow-sm ${selectedSize==='M' ? 'bg-gray-200 text-black border-gray-300 shadow-lg' : 'bg-white text-black border-gray-200 hover:border-gray-300 hover:shadow'}`}
                  style={{ borderRadius: '10px' }}
                >
                  <div className="font-semibold mb-0.5">Medium</div>
                  <div className={`text-xs leading-tight ${selectedSize==='M' ? 'text-gray-600' : 'text-gray-500'}`}>5–6 inch<br/>great for small<br/>vases or desk pieces.</div>
                </button>
                {/* Large */}
                <button
                  onClick={() => setSelectedSize('L')}
                  className={`w-40 h-24 border transition-all text-left p-4 shadow-sm ${selectedSize==='L' ? 'bg-gray-200 text-black border-gray-300 shadow-lg' : 'bg-white text-black border-gray-200 hover:border-gray-300 hover:shadow'}`}
                  style={{ borderRadius: '10px' }}
                >
                  <div className="font-semibold mb-0.5">Large</div>
                  <div className={`text-xs leading-tight ${selectedSize==='L' ? 'text-gray-600' : 'text-gray-500'}`}>7–8 inch<br/>ideal for display<br/>or special gifts.</div>
                </button>
              </div>
              {/* Inch selector for Medium/Large */}
              {(selectedSize === 'M' || selectedSize === 'L') && (
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-2">Select exact size</div>
                  <div className="flex gap-2">
                    {selectedSize === 'M' && ([5,6] as const).map(inch => (
                      <button
                        key={inch}
                        onClick={() => setSelectedInch(inch)}
                        className={`px-3 py-1 rounded-full border text-sm ${selectedInch===inch ? 'bg-gray-200 text-black border-gray-300' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                      >
                        {inch}"
                      </button>
                    ))}
                    {selectedSize === 'L' && ([7,8] as const).map(inch => (
                      <button
                        key={inch}
                        onClick={() => setSelectedInch(inch)}
                        className={`px-3 py-1 rounded-full border text-sm ${selectedInch===inch ? 'bg-gray-200 text-black border-gray-300' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                      >
                        {inch}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tier pricing */}
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-6 w-full max-w-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-700">Selected</span>
                <span className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-900 bg-gray-50">Size: {selectedSize === 'S' ? 'Small' : selectedSize === 'M' ? 'Medium' : 'Large'}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Sub Total</span>
                  <span className="font-medium text-gray-900">{formatCurrency(uiSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Tax</span>
                  <span className="font-medium text-gray-900">{formatCurrency(uiTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Shipping</span>
                  <span className="font-medium text-gray-900">{formatCurrency(uiShipping)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(uiTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={orderProcessing}
                className={`w-full mt-6 font-semibold py-4 px-6 rounded-full transition-all duration-200 ${
                  orderProcessing
                    ? 'bg-[#000000] text-gray-500 cursor-not-allowed'
                    : 'bg-[#000000] hover:bg-[#000000] text-white shadow-md hover:shadow-lg'
                }`}
              >
                {orderProcessing ? 'Processing…' : 'Continue to Checkout'}
              </button>
            </div>
          </div>

          {/* Right Side - Product preview */}
          <div className="lg:pl-8">
            <div className="bg-white overflow-auto w-full max-w-md border border-gray-200 shadow-xl p-4" style={{ borderRadius: '1px' }}>
              <div className="bg-[#f2f2f2] aspect-square flex items-center justify-center" style={{ borderRadius: '1px' }}>
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
            </div>
            <div className="mt-3">
              <div className="text-gray-900 text-sm font-normal">{checkoutData.items[0]?.designTitle.slice(0, 60).toUpperCase() + '...' || 'Cute Dinosaur'}</div>
              <div className="text-xs text-gray-500">Personalized Gift</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}