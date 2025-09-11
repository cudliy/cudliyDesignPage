import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, type CheckoutResponse, type ShippingInfo, type BillingInfo } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key');


function CheckoutForm({ checkoutData, onSuccess }: { checkoutData: CheckoutResponse; onSuccess: (orderId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'shipping' | 'billing' | 'payment'>('shipping');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    },
    method: 'standard'
  });
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    },
    sameAsShipping: true
  });

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updateShippingInfo(checkoutData.checkoutId, shippingInfo);
      setCurrentStep('billing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shipping info');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updateBillingInfo(checkoutData.checkoutId, billingInfo);
      setCurrentStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update billing info');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const paymentResponse = await apiService.createPaymentIntent(checkoutData.checkoutId);
      
      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = paymentResponse.data;

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: `${billingInfo.firstName} ${billingInfo.lastName}`,
            email: billingInfo.email,
            address: {
              line1: billingInfo.address.line1,
              line2: billingInfo.address.line2,
              city: billingInfo.address.city,
              state: billingInfo.address.state,
              postal_code: billingInfo.address.postalCode,
              country: billingInfo.address.country,
            },
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Complete checkout
        const completeResponse = await apiService.completeCheckout(checkoutData.checkoutId, paymentIntent.id);
        
        if (completeResponse.success && completeResponse.data) {
          onSuccess(completeResponse.data.orderId);
        } else {
          throw new Error('Failed to complete checkout');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 'shipping') {
    return (
      <form onSubmit={handleShippingSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              required
              value={shippingInfo.firstName}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              required
              value={shippingInfo.lastName}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            required
            value={shippingInfo.email}
            onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            required
            value={shippingInfo.phone}
            onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
          <input
            type="text"
            required
            value={shippingInfo.address.line1}
            onChange={(e) => setShippingInfo(prev => ({ 
              ...prev, 
              address: { ...prev.address, line1: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2 (Optional)</label>
          <input
            type="text"
            value={shippingInfo.address.line2}
            onChange={(e) => setShippingInfo(prev => ({ 
              ...prev, 
              address: { ...prev.address, line2: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              required
              value={shippingInfo.address.city}
              onChange={(e) => setShippingInfo(prev => ({ 
                ...prev, 
                address: { ...prev.address, city: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              required
              value={shippingInfo.address.state}
              onChange={(e) => setShippingInfo(prev => ({ 
                ...prev, 
                address: { ...prev.address, state: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
            <input
              type="text"
              required
              value={shippingInfo.address.postalCode}
              onChange={(e) => setShippingInfo(prev => ({ 
                ...prev, 
                address: { ...prev.address, postalCode: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <select
            value={shippingInfo.address.country}
            onChange={(e) => setShippingInfo(prev => ({ 
              ...prev, 
              address: { ...prev.address, country: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Method</label>
          <div className="space-y-2">
            {[
              { value: 'standard', label: 'Standard Shipping (5-7 days)', price: '$5.99' },
              { value: 'express', label: 'Express Shipping (2-3 days)', price: '$12.99' },
              { value: 'overnight', label: 'Overnight Shipping', price: '$24.99' }
            ].map((method) => (
              <label key={method.value} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.value}
                  checked={shippingInfo.method === method.value}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, method: e.target.value as any }))}
                  className="text-[#E70D57] focus:ring-[#E70D57]"
                />
                <span className="text-sm text-gray-700">{method.label} - {method.price}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E70D57] text-white py-3 px-4 rounded-md hover:bg-[#d10c50] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : 'Continue to Billing'}
        </button>
      </form>
    );
  }

  if (currentStep === 'billing') {
    return (
      <form onSubmit={handleBillingSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing Information</h2>
        
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="sameAsShipping"
            checked={billingInfo.sameAsShipping}
            onChange={(e) => setBillingInfo(prev => ({ ...prev, sameAsShipping: e.target.checked }))}
            className="text-[#E70D57] focus:ring-[#E70D57]"
          />
          <label htmlFor="sameAsShipping" className="text-sm text-gray-700">
            Same as shipping address
          </label>
        </div>

        {!billingInfo.sameAsShipping && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  required
                  value={billingInfo.firstName}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  value={billingInfo.lastName}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={billingInfo.email}
                onChange={(e) => setBillingInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
              <input
                type="text"
                required
                value={billingInfo.address.line1}
                onChange={(e) => setBillingInfo(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, line1: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={billingInfo.address.line2}
                onChange={(e) => setBillingInfo(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, line2: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  required
                  value={billingInfo.address.city}
                  onChange={(e) => setBillingInfo(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  required
                  value={billingInfo.address.state}
                  onChange={(e) => setBillingInfo(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  required
                  value={billingInfo.address.postalCode}
                  onChange={(e) => setBillingInfo(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, postalCode: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E70D57]"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setCurrentStep('shipping')}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 font-medium"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#E70D57] text-white py-3 px-4 rounded-md hover:bg-[#d10c50] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handlePaymentSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="font-medium text-gray-900 mb-2">Card Details</h3>
        <div className="p-4 border border-gray-300 rounded-md bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setCurrentStep('billing')}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 font-medium"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 bg-[#E70D57] text-white py-3 px-4 rounded-md hover:bg-[#d10c50] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing Payment...' : `Pay $${checkoutData.pricing.total.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const { designId } = useParams<{ designId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [userId] = useState('user-123'); // This should come from auth context

  useEffect(() => {
    if (!designId) return;

    const createCheckout = async () => {
      try {
        setLoading(true);
        const response = await apiService.createStripeCheckout({
          userId,
          designId,
          quantity: 1
        });

        if (response.success && response.data) {
          setCheckoutData(response.data);
          // Redirect to Stripe Checkout
          if (response.data.url) {
            window.location.href = response.data.url;
          }
        } else {
          throw new Error('Failed to create checkout');
        }
      } catch (err) {
        console.error('Checkout creation error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout';
        setError(`Checkout Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    createCheckout();
  }, [designId, userId]);

  const handleOrderSuccess = (orderId: string) => {
    navigate(`/order-success/${orderId}`);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Elements stripe={stripePromise}>
                <CheckoutForm checkoutData={checkoutData} onSuccess={handleOrderSuccess} />
              </Elements>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              {checkoutData.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item.designImage}
                      alt={item.designTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.designTitle}</h4>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    <p className="text-sm font-medium text-gray-900">${item.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${checkoutData.pricing.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${checkoutData.pricing.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">${checkoutData.pricing.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${checkoutData.pricing.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>• Secure payment powered by Stripe</p>
                <p>• Your payment information is encrypted</p>
                <p>• 30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
