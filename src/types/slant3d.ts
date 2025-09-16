// Slant3D Service Types
export interface Slant3DPricing {
  model_id: string;
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  material: string;
  quantity: number;
  estimated_days: number;
  shipping_methods: Array<{
    name: string;
    days: number;
    cost: number;
  }>;
}

export interface Slant3DOrder {
  orderId: string;
  orderNumber: string;
  status: string;
}

export interface Slant3DService {
  getPricing(modelUrl: string, options?: any): Promise<{ success: boolean; data: Slant3DPricing }>;
  createOrder(modelUrl: string, options?: any, customerData?: any): Promise<{ success: boolean; data: Slant3DOrder }>;
  getShippingEstimate(modelUrl: string, options?: any, customerData?: any): Promise<{ success: boolean; data: any }>;
  getOrderTracking(orderId: string): Promise<{ success: boolean; data: any }>;
  getAllOrders(): Promise<{ success: boolean; data: any }>;
  cancelOrder(orderId: string): Promise<{ success: boolean; data: any }>;
}
