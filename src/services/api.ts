import { getUserFriendlyError } from '../utils/errorMapper';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:3001/api' : 'https://cudliydesign-production.up.railway.app/api');

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface GenerateImagesRequest {
  text: string;
  color?: string;
  size?: 'S' | 'M' | 'L' | 'custom';
  style?: 'sci-fi' | 'low-poly' | 'realistic' | 'playful' | 'retro';
  material?: string;
  production?: 'handmade' | 'digital';
  details?: string[];
  user_id: string;
  creation_id: string;
  customWidth?: string;
  customHeight?: string;
}

interface GenerateImagesResponse {
  session_id: string;
  images: Array<{
    url: string;
    prompt: string;
    index: number;
  }>;
  creation_id: string;
  user_id: string;
  prompt: string;
  message: string;
}

interface Generate3DModelRequest {
  image_url: string;
  session_id?: string;
  user_id: string;
  creation_id: string;
  options?: {
    seed?: number;
    texture_size?: 512 | 1024 | 2048 | 4096;
    mesh_simplify?: number;
    generate_color?: boolean;
    generate_model?: boolean;
    randomize_seed?: boolean;
    generate_normal?: boolean;
    save_gaussian_ply?: boolean;
    ss_sampling_steps?: number;
    slat_sampling_steps?: number;
    return_no_background?: boolean;
    ss_guidance_strength?: number;
    slat_guidance_strength?: number;
    // Color preservation options
    preserve_colors?: boolean;
    enhance_colors?: boolean;
    color_accuracy?: string;
  };
}

interface Generate3DModelResponse {
  design_id: string;
  image_url: string;
  model_url: string;
  stored_model_url?: string;
  gaussian_ply?: string;
  color_video?: string;
  creation_id: string;
  user_id: string;
  message: string;
}

interface UploadImageResponse {
  image_url: string;
  thumbnail_url?: string;
  filename: string;
  message: string;
}

interface Design {
  id: string;
  userId: string;
  creationId: string;
  sessionId?: string;
  originalText: string;
  userSelections: {
    color?: string;
    size?: string;
    style?: string;
    material?: string;
    production?: string;
    details?: string[];
    customDimensions?: {
      width?: string;
      height?: string;
    };
  };
  generatedPrompt?: string;
  images?: Array<{
    url: string;
    prompt?: string;
    selected: boolean;
  }>;
  selectedImageIndex?: number;
  modelFiles: {
    originalImage: string;
    processedImage?: string;
    modelFile?: string;
    storedModelUrl?: string;
    gaussianPly?: string;
    colorVideo?: string;
    thumbnails?: string[];
  };
  generationOptions?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  isPublic: boolean;
  tags?: string[];
  likes: number;
  views: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  id: string;
  userId: string;
  creationId: string;
  originalText: string;
  userSelections: {
    color?: string;
    size?: string;
    style?: string;
    material?: string;
    production?: string;
    details?: string[];
  };
  currentStep: 'prompt_generation' | 'image_generation' | 'image_selection' | '3d_generation' | 'completed';
  generatedPrompts?: string[];
  generatedImages?: string[];
  selectedImageUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// Payment and Checkout Interfaces
interface CheckoutRequest {
  userId: string;
  designId: string;
  quantity?: number;
  options?: {
    size?: 'S' | 'M' | 'L';
  };
  size?: 'S' | 'M' | 'L';
}

interface CheckoutResponse {
  checkoutId: string;
  sessionId: string;
  url?: string;
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
  };
  items: Array<{
    designId: string;
    designTitle: string;
    designImage: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  mock?: boolean;
  message?: string;
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  method: 'standard' | 'express' | 'overnight';
}

interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  sameAsShipping: boolean;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

interface Order {
  id: string;
  userId: string;
  designId: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
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
  shipping: ShippingInfo;
  billing: BillingInfo;
  payment: {
    method: string;
    status: string;
    transactionId: string;
    paidAt: string;
  };
  production: {
    status: 'queued' | 'printing' | 'post_processing' | 'quality_check' | 'packaging' | 'ready_for_shipping';
    estimatedCompletion: string;
    actualCompletion?: string;
    notes?: string;
  };
  tracking?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    shippedAt: string;
    deliveredAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UsageLimits {
  plan: string;
  subscription?: {
    id: string;
    status: string;
    currentPeriodEnd: Date;
    planName: string;
  } | null;
  limits: {
    imagesPerMonth: number;
    modelsPerMonth: number;
    storageGB: number;
    prioritySupport: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  usage: {
    imagesGenerated: number;
    modelsGenerated: number;
    storageUsed: number;
  };
  remaining: {
    images: number;
    models: number;
  };
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      // Get JWT token from sessionStorage
      const token = sessionStorage.getItem('token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers,
        credentials: 'include',
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP ${response.status}`;
        const friendlyError = getUserFriendlyError(errorMessage);
        throw new Error(friendlyError);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        const friendlyError = getUserFriendlyError(error.message);
        throw new Error(friendlyError);
      }
      throw new Error('Unable to connect to the server. Please try again.');
    }
  }

  // Auth
  async signup(email: string, password: string, name?: string): Promise<ApiResponse<{ user: any }>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; data: any }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Generate AI images
  async generateImages(request: GenerateImagesRequest): Promise<ApiResponse<GenerateImagesResponse>> {
    return this.request<GenerateImagesResponse>('/designs/generate-images', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Generate 3D model
  async generate3DModel(request: Generate3DModelRequest): Promise<ApiResponse<Generate3DModelResponse>> {
    return this.request('/designs/generate-3d-model', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Upload image
  async uploadImage(file: File): Promise<ApiResponse<UploadImageResponse>> {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const url = `${API_BASE_URL}/upload/image`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP ${response.status}`;
        const friendlyError = getUserFriendlyError(errorMessage);
        throw new Error(friendlyError);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        const friendlyError = getUserFriendlyError(error.message);
        throw new Error(friendlyError);
      }
      throw new Error('Failed to upload your file. Please try again.');
    }
  }

  // Get design details
  async getDesign(designId: string): Promise<ApiResponse<Design>> {
    return this.request(`/designs/${designId}`);
  }

  // Get user designs
  async getUserDesigns(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    style?: string
  ): Promise<ApiResponse<{ designs: Design[]; pagination: any }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(style && { style }),
    });

    return this.request(`/designs/user/${userId}/designs?${params}`);
  }

  // Get session status
  async getSession(sessionId: string): Promise<ApiResponse<Session>> {
    return this.request(`/session/${sessionId}`);
  }

  // Delete design
  async deleteDesign(designId: string): Promise<ApiResponse> {
    return this.request(`/designs/${designId}`, {
      method: 'DELETE',
    });
  }

  // Update design metadata
  async updateDesign(
    designId: string,
    updates: { tags?: string[]; isPublic?: boolean; title?: string }
  ): Promise<ApiResponse<Design>> {
    return this.request(`/designs/${designId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Checkout methods
  async createStripeCheckout(request: CheckoutRequest): Promise<ApiResponse<CheckoutResponse & { url: string }>> {
    return this.request('/checkout/stripe', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Pricing
  async getProducts(): Promise<ApiResponse<any>> {
    return this.request('/payments/products');
  }
  async getPrices(productId: string): Promise<ApiResponse<any>> {
    return this.request(`/payments/products/${productId}/prices`);
  }

  async createCheckout(request: CheckoutRequest): Promise<ApiResponse<CheckoutResponse>> {
    return this.request('/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCheckout(checkoutId: string): Promise<ApiResponse<CheckoutResponse>> {
    return this.request(`/checkout/${checkoutId}`);
  }

  async updateShippingInfo(checkoutId: string, shippingInfo: ShippingInfo): Promise<ApiResponse<CheckoutResponse>> {
    return this.request(`/checkout/${checkoutId}/shipping`, {
      method: 'PATCH',
      body: JSON.stringify(shippingInfo),
    });
  }

  async updateBillingInfo(checkoutId: string, billingInfo: BillingInfo): Promise<ApiResponse<CheckoutResponse>> {
    return this.request(`/checkout/${checkoutId}/billing`, {
      method: 'PATCH',
      body: JSON.stringify(billingInfo),
    });
  }

  async createPaymentIntent(checkoutId: string): Promise<ApiResponse<PaymentIntentResponse>> {
    return this.request(`/checkout/${checkoutId}/payment-intent`, {
      method: 'POST',
    });
  }

  async completeCheckout(checkoutId: string, paymentIntentId: string): Promise<ApiResponse<{ orderId: string; orderNumber: string; status: string; total: number; estimatedDelivery: string }>> {
    return this.request(`/checkout/${checkoutId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  }

  // Order methods
  async getUserOrders(userId: string, page: number = 1, limit: number = 10, status?: string): Promise<ApiResponse<{ orders: Order[]; pagination: any }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    return this.request(`/checkout/users/${userId}/orders?${params}`);
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/checkout/orders/${orderId}`);
  }

  // Usage and limits
  async checkUsageLimits(userId: string): Promise<ApiResponse<UsageLimits>> {
    return this.request(`/payments/users/${userId}/usage/limits`);
  }

  async trackUsage(userId: string, type: 'image' | 'model', amount: number = 1): Promise<ApiResponse<{ usage: any; subscription: any }>> {
    return this.request(`/payments/users/${userId}/usage/track`, {
      method: 'POST',
      body: JSON.stringify({ type, amount }),
    });
  }

  // Manual subscription sync (workaround for webhook issues)
  async syncSubscription(userId: string, sessionId?: string): Promise<ApiResponse<{ subscriptions: any[] }>> {
    return this.request(`/payments/sync-subscription`, {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId }),
    });
  }

  // Subscription management
  async createSubscription(userId: string, planType: string, interval: 'month' | 'year'): Promise<ApiResponse<{ subscriptionId: string; checkoutUrl: string; clientSecret?: string }>> {
    return this.request('/payments/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ userId, planType, interval }),
    });
  }

  async getSubscription(subscriptionId: string): Promise<ApiResponse<any>> {
    return this.request(`/payments/subscriptions/${subscriptionId}`);
  }

  async getUserSubscriptions(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/payments/users/${userId}/subscriptions`);
  }

  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<any>> {
    return this.request(`/payments/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
    });
  }

  async updateSubscription(subscriptionId: string, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/payments/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }
}

export const apiService = new ApiService();

export type {
  ApiResponse,
  GenerateImagesRequest,
  GenerateImagesResponse,
  Generate3DModelRequest,
  Generate3DModelResponse,
  UploadImageResponse,
  Design,
  Session,
  CheckoutRequest,
  CheckoutResponse,
  ShippingInfo,
  BillingInfo,
  PaymentIntentResponse,
  Order,
  UsageLimits,
};
