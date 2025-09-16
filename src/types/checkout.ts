// Checkout Types
export interface CheckoutData {
  id: string;
  userId: string;
  designId: string;
  sessionId: string;
  status: 'draft' | 'shipping_info' | 'billing_info' | 'payment_info' | 'completed' | 'abandoned';
  items: Array<{
    designId: string;
    designTitle: string;
    designImage: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;
  };
  shipping: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    method: 'standard' | 'express' | 'overnight';
  };
  billing: {
    firstName: string;
    lastName: string;
    email: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    sameAsShipping: boolean;
  };
  payment: {
    method: string;
    paymentIntentId: string;
    clientSecret: string;
    status: string;
  };
  expiresAt: Date;
  mock?: boolean;
  message?: string;
  url?: string;
}

export interface CheckoutResponse {
  success: boolean;
  data: CheckoutData;
  message?: string;
}
