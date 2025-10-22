import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Order } from '../types/order';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setSlant3DOrder] = useState<any>(null);
  const [, setShippingInfo] = useState<any>(null);

  useEffect(() => {
    // Check for session_id in URL params (from Stripe redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      // Handle Stripe checkout success (or mock checkout)
      setLoading(false);
      
      // Get user ID from session storage or generate one
      const userId = sessionStorage.getItem('user_id') || sessionStorage.getItem('guest_user_id') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Load Slant3D order information
      const storedSlant3DOrder = sessionStorage.getItem('slant3d_order_id');
      const storedShippingInfo = sessionStorage.getItem('shipping_info');
      const storedPricing = sessionStorage.getItem('slant3d_pricing');
      
      if (storedSlant3DOrder) {
        setSlant3DOrder({ order_id: storedSlant3DOrder } as any);
      }
      
      if (storedShippingInfo) {
        setShippingInfo(JSON.parse(storedShippingInfo));
      }
      
      // Get size and inch from session storage
      const selectedSize: 'S' | 'M' | 'L' = (sessionStorage.getItem('checkout_selected_size') as 'S' | 'M' | 'L') || 'S';
      const selectedInch = parseInt(sessionStorage.getItem('checkout_selected_inch') || '4');
      
      // Calculate correct tier pricing based on size/inch
      const calculateTierPrice = (size: 'S' | 'M' | 'L', inch: number) => {
        if (size === 'S') return 230; // 1–4 inch, 1 print
        if (size === 'M') return inch === 6 ? 270 : 250; // 5 or 6 inch
        if (size === 'L') return inch === 8 ? 310 : 290; // 7 or 8 inch
        return 230;
      };
      
      const unitPrice = calculateTierPrice(selectedSize, selectedInch);
      const subtotal = unitPrice;
      const tax = subtotal * 0.08; // 8% tax
      const shipping = 5.99; // Standard shipping
      const total = subtotal + tax + shipping;
      
      let pricing = {
        subtotal,
        tax,
        shipping,
        discount: 0,
        total,
        currency: 'USD'
      };
      
      if (storedPricing) {
        const slant3DPricing = JSON.parse(storedPricing);
        pricing = slant3DPricing.pricing;
      }
      
      setOrder({
        id: `order_${Date.now()}`,
        userId: userId,
        designId: urlParams.get('design_id') || 'temp-design',
        stripeSessionId: sessionId || '',
        stripePaymentIntentId: '',
        orderNumber: `ORD-${Date.now()}`,
        status: 'paid',
        items: [{
          designId: urlParams.get('design_id') || 'temp-design',
          designTitle: `Custom 3D Design (${selectedSize}${selectedSize === 'S' ? '' : `/${selectedInch}"`})`,
          designImage: urlParams.get('design_image') || 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=3D+Design',
          quantity: 1,
          unitPrice: pricing.subtotal,
          totalPrice: pricing.subtotal,
          attributes: { size: selectedSize, inch: selectedInch }
        }],
        pricing: pricing,
        shipping: storedShippingInfo ? {
          firstName: JSON.parse(storedShippingInfo).firstName || 'Guest',
          lastName: JSON.parse(storedShippingInfo).lastName || 'User',
          email: JSON.parse(storedShippingInfo).email || `guest-${userId}@temp.com`,
          phone: JSON.parse(storedShippingInfo).phone || '',
          address: {
            line1: JSON.parse(storedShippingInfo).address1 || 'Address will be collected during checkout',
            line2: JSON.parse(storedShippingInfo).address2 || '',
            city: JSON.parse(storedShippingInfo).city || '',
            state: JSON.parse(storedShippingInfo).state || '',
            postalCode: JSON.parse(storedShippingInfo).zip || '',
            country: JSON.parse(storedShippingInfo).country || 'US'
          },
          method: 'standard'
        } : {
          firstName: 'Guest',
          lastName: 'User',
          email: `guest-${userId}@temp.com`,
          phone: '',
          address: {
            line1: 'Address will be collected during checkout',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'US'
          },
          method: 'standard'
        },
        billing: {
          firstName: 'Guest',
          lastName: 'User',
          email: `guest-${userId}@temp.com`,
          address: {
            line1: 'Address will be collected during checkout',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
          },
          sameAsShipping: true
        },
        payment: {
          method: 'card',
          status: 'paid',
          transactionId: sessionId || '',
          paidAt: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return;
    }

    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await apiService.getOrder(orderId);
        
        if (response.success && response.data) {
          setOrder(response.data as unknown as Order);
        } else {
          throw new Error('Failed to fetch order details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E70D57] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Successful!</h1>
          <p className="text-gray-600">Thank you for your order. We'll start processing it right away.</p>
          {new URLSearchParams(window.location.search).get('mock') === 'true' && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 text-sm">
                🧪 <strong>Test Mode:</strong> This is a mock order for testing purposes. No actual payment was processed.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">${order.pricing.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Shipping Information</h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{order.shipping.firstName} {order.shipping.lastName}</p>
                <p>{order.shipping.address.line1}</p>
                {order.shipping.address.line2 && <p>{order.shipping.address.line2}</p>}
                <p>{order.shipping.address.city}, {order.shipping.address.state} {order.shipping.address.postalCode}</p>
                <p>{order.shipping.address.country}</p>
                <p className="mt-2">{order.shipping.email}</p>
                <p>{order.shipping.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
          
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.designImage}
                  alt={item.designTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.designTitle}</h3>
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                <p className="text-sm font-medium text-gray-900">${item.totalPrice.toFixed(2)}</p>
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">${order.pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="text-gray-900">${order.pricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="text-gray-900">${order.pricing.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${order.pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• We'll start 3D printing your design within 24 hours</p>
            <p>• You'll receive email updates on your order progress</p>
            <p>• Estimated delivery: 5-7 business days</p>
            <p>• You can track your order status in your dashboard</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-[#E70D57] text-white rounded-lg font-medium hover:bg-[#d10c50] transition-colors"
          >
            View Dashboard
          </button>
          <button 
            onClick={() => navigate('/design')}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Create Another Design
          </button>
        </div>
      </div>
    </div>
  );
}
