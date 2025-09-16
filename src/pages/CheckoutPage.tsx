import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
// @ts-ignore
import { slant3DService } from '../services/slant3dService';
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
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [orderProcessing, setOrderProcessing] = useState(false);
  
  // Shipping form state
  const [shippingInfo, setShippingInfo] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const [userId] = useState(() => {
    // Generate a unique user ID for this session
    // In a real app, this would come from authentication context
    const storedUserId = sessionStorage.getItem('guest_user_id');
    if (storedUserId) {
      return storedUserId;
    }
    // Use a more unique ID to prevent collisions
    const newUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`;
    sessionStorage.setItem('guest_user_id', newUserId);
    return newUserId;
  });

  useEffect(() => {
    if (!designId) return;

    const initializeCheckout = async () => {
      try {
        setLoading(true);
        
        // Load Slant3D pricing from session storage or location state
        const storedPricing = sessionStorage.getItem('slant3d_pricing');
        const storedModelUrl = sessionStorage.getItem('slant3d_model_url');
        
        if (storedPricing) {
          setSlant3DPricing(JSON.parse(storedPricing));
        } else if (location.state?.slant3DPricing) {
          setSlant3DPricing(location.state.slant3DPricing);
        }
        
        if (storedModelUrl) {
          setModelUrl(storedModelUrl);
        } else if (location.state?.modelUrl) {
          setModelUrl(location.state.modelUrl);
        }

        // Create checkout session (for payment processing)
        const response = await apiService.createStripeCheckout({
          userId,
          designId,
          quantity: 1
        });

        if (response.success && response.data) {
          setCheckoutData(response.data as unknown as CheckoutData);
        } else {
          throw new Error('Failed to create checkout');
        }
      } catch (err) {
        console.error('Checkout initialization error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize checkout';
        setError(`Checkout Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [designId, userId, location.state]);

  const handleShippingChange = (field: keyof typeof shippingInfo, value: string) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateShippingInfo = () => {
    const required: (keyof typeof shippingInfo)[] = ['firstName', 'lastName', 'email', 'address1', 'city', 'state', 'zip'];
    return required.every(field => shippingInfo[field].trim() !== '');
  };

  const processSlant3DOrder = async () => {
    if (!slant3DPricing || !modelUrl) {
      throw new Error('Missing pricing or model data');
    }

    try {
      console.log('CheckoutPage: About to upload model:', modelUrl);
      console.log('CheckoutPage: Model URL type:', typeof modelUrl);
      console.log('CheckoutPage: Model URL value:', modelUrl);
      console.log('CheckoutPage: Slant3D pricing:', slant3DPricing);
      
      // Upload model to Slant3D
      const uploadResult = await slant3DService.uploadModel(modelUrl, {
        material: slant3DPricing.material,
        quantity: slant3DPricing.quantity
      });

      // Create order with Slant3D
      const orderResult = await slant3DService.createOrder({
        modelId: uploadResult.model_id,
        quantity: slant3DPricing.quantity,
        material: slant3DPricing.material,
        shipping: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          company: '',
          address1: shippingInfo.address1,
          address2: shippingInfo.address2,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zip: shippingInfo.zip,
          country: shippingInfo.country,
          phone: shippingInfo.phone
        },
        payment_method: 'card'
      });

      return orderResult;
    } catch (error) {
      console.error('Slant3D order processing error:', error);
      throw error;
    }
  };

  const handleProceedToPayment = async () => {
    if (!checkoutData || !slant3DPricing) return;

    // Validate shipping information
    if (!validateShippingInfo()) {
      setError('Please fill in all required shipping fields');
      return;
    }

    try {
      setOrderProcessing(true);
      setError(null);

      // Process order with Slant3D
      const slant3DOrder = await processSlant3DOrder();
      
      // Store order information
      sessionStorage.setItem('slant3d_order_id', slant3DOrder.order_id);
      sessionStorage.setItem('shipping_info', JSON.stringify(shippingInfo));

      // Check if this is a mock checkout
      if (checkoutData.mock) {
        console.log('Mock checkout detected:', checkoutData.message);
        // For mock checkout, redirect to success page
        navigate(`/order-success?session_id=mock_${Date.now()}&order_id=${slant3DOrder.order_id}`);
      } else {
        // Redirect to Stripe Checkout
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        }
      }
    } catch (err) {
      console.error('Order processing error:', err);
      setError(`Order processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Checkout Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load checkout'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>← Return to Design</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Order Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Product Details */}
              {checkoutData.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 mb-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.designImage}
                      alt={item.designTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.designTitle}</h3>
                    <p className="text-sm text-gray-500">3D Toys</p>
                  </div>
                </div>
              ))}

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                {slant3DPricing ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sub Total</span>
                      <span className="font-medium">${slant3DPricing.pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">${slant3DPricing.pricing.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">${slant3DPricing.pricing.shipping.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <div>Material: {slant3DPricing.material}</div>
                      <div>Est. Delivery: {slant3DPricing.estimated_days} days</div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>${slant3DPricing.pricing.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sub Total</span>
                      <span className="font-medium">${checkoutData.pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (10%)</span>
                      <span className="font-medium">${checkoutData.pricing.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">${checkoutData.pricing.shipping.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>${checkoutData.pricing.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={orderProcessing || !slant3DPricing}
                className={`w-full mt-6 font-semibold py-4 px-6 rounded-lg transition-colors duration-200 ${
                  orderProcessing || !slant3DPricing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#E70D57] hover:bg-[#d10c50] text-white'
                }`}
              >
                {orderProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing Order...
                  </div>
                ) : (
                  checkoutData.mock ? 'Complete Test Order' : 'Confirm and Print Toy'
                )}
              </button>
            </div>
          </div>

          {/* Right Side - Payment and Delivery Information */}
          <div className="space-y-8">
            {/* Payment Method */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="credit-card"
                    name="payment-method"
                    value="credit-card"
                    defaultChecked
                    className="text-[#E70D57] focus:ring-[#E70D57]"
                  />
                  <label htmlFor="credit-card" className="text-sm font-medium text-gray-700">
                    Credit or Debit card
                  </label>
                </div>
                
                {/* Card Logos */}
                <div className="flex items-center space-x-2 ml-6">
                  <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
                  <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
                  <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                  <div className="w-8 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">D</div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="other-method"
                    name="payment-method"
                    value="other"
                    className="text-[#E70D57] focus:ring-[#E70D57]"
                  />
                  <label htmlFor="other-method" className="text-sm font-medium text-gray-700">
                    Other payment method
                  </label>
                </div>

                {/* Payment Buttons */}
                <div className="flex space-x-3 mt-4">
                  <button className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                    Pay with Stripe
                  </button>
                  <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors">
                    Pay with PayPal
                  </button>
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Please enter your email address</h3>
              <input
                type="email"
                placeholder="Email address"
                value={shippingInfo.email}
                onChange={(e) => handleShippingChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                required
              />
            </div>

            {/* Delivery Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
              
              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="First Name *"
                      value={shippingInfo.firstName}
                      onChange={(e) => handleShippingChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Last Name *"
                      value={shippingInfo.lastName}
                      onChange={(e) => handleShippingChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={shippingInfo.phone}
                    onChange={(e) => handleShippingChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div>
                  <input
                    type="text"
                    placeholder="Address Line 1 *"
                    value={shippingInfo.address1}
                    onChange={(e) => handleShippingChange('address1', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={shippingInfo.address2}
                    onChange={(e) => handleShippingChange('address2', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                  />
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <select 
                      value={shippingInfo.country}
                      onChange={(e) => handleShippingChange('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="State/Province *"
                      value={shippingInfo.state}
                      onChange={(e) => handleShippingChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="ZIP/Postal Code *"
                      value={shippingInfo.zip}
                      onChange={(e) => handleShippingChange('zip', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="City *"
                    value={shippingInfo.city}
                    onChange={(e) => handleShippingChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent"
                    required
                  />
                </div>

                {/* Save Information Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="save-info"
                    className="text-[#E70D57] focus:ring-[#E70D57]"
                  />
                  <label htmlFor="save-info" className="text-sm text-gray-700">
                    Save this information for next time
                  </label>
                </div>
              </div>
            </div>

            {/* Mock Checkout Notice */}
            {checkoutData.mock && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-yellow-800 text-sm">
                    <strong>Test Mode:</strong> This is a mock checkout for testing. No actual payment will be processed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}