const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cudliy.onrender.com/api' || 'http://localhost:5173/api';

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

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
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
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
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

    return this.request(`/designs/user/${userId}?${params}`);
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
};
