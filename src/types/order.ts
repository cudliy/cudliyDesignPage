// Order Types
export interface Order {
  id: string;
  userId: string;
  designId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  orderNumber: string;
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
    method: string;
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
    status: string;
    transactionId: string;
    paidAt: Date;
  };
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
