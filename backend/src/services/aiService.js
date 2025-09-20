import dotenv from 'dotenv'
dotenv.config()
import OpenAI from 'openai';
import axios from 'axios';
import logger from '../utils/logger.js';
import { fal } from '@fal-ai/client';

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.replicateToken = process.env.REPLICATE_API_TOKEN;
    
    // Initialize fal.ai client
    fal.config({
      credentials: process.env.FAL_API_KEY || '95638d63-2011-4a66-bf8a-b3647febaf43:cb00658666e670d5ae87a52ce827b874'
    });
  }

  async generateEnhancedPrompt(userSelections) {
    const { text, color, size, style, material, production, details } = userSelections;
    
    const systemPrompt = `You are an expert prompt engineer for AI image generation, specializing in 3D printable objects. 
    Create detailed, specific prompts that will generate high-quality images suitable for 3D model conversion.
    
    Requirements:
    - Background must be pure white
    - Object must be fully visible within frame
    - Style should be clear and well-defined for 3D printing
    - Include material properties and textures
    - Consider the production method for appropriate detail level
    
    User specifications:
    - Base description: ${text}
    - Color: ${color}
    - Size: ${size}
    - Style: ${style}
    - Material: ${material}
    - Production: ${production}
    - Details: ${details.join(', ')}
    
    Generate a comprehensive prompt that incorporates all these elements naturally.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('OpenAI API Error:', error);
      throw new Error('Failed to generate enhanced prompt');
    }
  }

  async generateImageVariations(basePrompt, count = 3) {
    const variations = [
      `${basePrompt}, front view, centered, professional lighting`,
      `${basePrompt}, three-quarter view, soft shadows, detailed texture`,
      `${basePrompt}, side profile, clean lines, minimal background`
    ];

    const imagePromises = variations.slice(0, count).map(async (prompt, index) => {
      try {
        const response = await axios.post(
          'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
          {
            input: { prompt }
          },
          {
            headers: {
              'Authorization': `Token ${this.replicateToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait'
            },
            timeout: 120000 // 2 minutes timeout
          }
        );

        return {
          url: response.data.output[0],
          prompt,
          index
        };
      } catch (error) {
        logger.error(`Image generation failed for variation ${index}:`, error);
        throw error;
      }
    });

    return Promise.all(imagePromises);
  }

  async generate3DModel(imageUrl, options = {}) {
    // COMMENTED OUT: Original Replicate implementation
    // const defaultOptions = {
    //   seed: 0,
    //   texture_size: 256, // Very aggressive reduction to 256px for minimal file size
    //   mesh_simplify: 0.3, // Very aggressive simplification for smallest possible file
    //   generate_color: true,
    //   generate_model: true,
    //   randomize_seed: true,
    //   generate_normal: false,
    //   save_gaussian_ply: false, // Disabled to reduce file size
    //   ss_sampling_steps: 15, // Very low sampling for minimal file size
    //   slat_sampling_steps: 4, // Very low sampling for minimal file size
    //   return_no_background: false,
    //   ss_guidance_strength: 7.5,
    //   slat_guidance_strength: 3,
    //   output_format: 'glb' // Ensure GLB output
    // };

    // const finalOptions = { ...defaultOptions, ...options };

    // try {
    //   const response = await axios.post(
    //     'https://api.replicate.com/v1/predictions',
    //     {
    //       version: 'firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c',
    //       input: {
    //         ...finalOptions,
    //         images: [imageUrl]
    //       }
    //     },
    //     {
    //       headers: {
    //         'Authorization': `Token ${this.replicateToken}`,
    //         'Content-Type': 'application/json',
    //         'Prefer': 'wait'
    //       },
    //       timeout: 300000 // 5 minutes timeout for 3D generation
    //     }
    //   );

    //   // Return the expected format
    //   return {
    //     model_file: response.data.output?.model_file || response.data.output,
    //     gaussian_ply: response.data.output?.gaussian_ply,
    //     color_video: response.data.output?.color_video
    //   };
    // } catch (error) {
    //   logger.error('3D Model Generation Error:', error);
    //   throw new Error('Failed to generate 3D model');
    // }

    // NEW: fal.ai Hunyuan3D implementation (with TripoSR fallback)
    try {
      logger.info('Starting fal.ai Hunyuan3D 3D model generation for image:', imageUrl);
      
      // Check if fal client is properly initialized
      if (!fal || typeof fal.subscribe !== 'function') {
        throw new Error('fal.ai client not properly initialized');
      }
      
      logger.info('fal.ai client initialized, calling Hunyuan3D...');
      
      // Use fal.ai's Hunyuan3D model
      const result = await fal.subscribe("fal-ai/hunyuan3d/v2/multi-view/turbo", {
        input: {
          front_image_url: imageUrl,
          // For single image, we'll use the same image for all views
          // In a real implementation, you might want to generate multiple views
          back_image_url: imageUrl,
          left_image_url: imageUrl
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach((message) => {
              logger.info('fal.ai Hunyuan3D:', message);
            });
          }
        },
      });

      logger.info('fal.ai Hunyuan3D generation completed:', JSON.stringify(result, null, 2));

      // Normalize fal.ai Hunyuan3D outputs into our expected shape
      const data = result?.data || result || {};
      
      // Log the data structure for debugging
      logger.info('fal.ai Hunyuan3D data structure:', JSON.stringify(data, null, 2));

      const collectCandidateUrls = (value) => {
        const candidates = [];
        const pushIfStringUrl = (v) => {
          if (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/') || v.startsWith('./'))) {
            candidates.push(v);
          }
        };

        const scanObject = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          for (const key of Object.keys(obj)) {
            const v = obj[key];
            if (typeof v === 'string') {
              pushIfStringUrl(v);
            } else if (Array.isArray(v)) {
              v.forEach(item => scanObject(item));
            } else if (typeof v === 'object' && v !== null) {
              // Common nested shapes like { url: "..." }
              if (v.url && typeof v.url === 'string') pushIfStringUrl(v.url);
              scanObject(v);
            }
          }
        };

        scanObject(value);
        return candidates;
      };

      const candidateUrls = collectCandidateUrls(data);
      logger.info('fal.ai Hunyuan3D candidate URLs found:', candidateUrls);
      
      // Prefer .glb/.obj first
      const preferred = candidateUrls.find(u => /\.(glb|gltf|obj)(\?|#|$)/i.test(u)) || candidateUrls[0] || null;

      const modelFile = data.model_file
        || data.modelUrl
        || data.model
        || data.glb
        || data.glb_url
        || data.file
        || data.file_url
        || data?.output?.model_file
        || preferred;

      logger.info('fal.ai Hunyuan3D final model file URL:', modelFile);

      if (!modelFile) {
        logger.warn('fal.ai Hunyuan3D: No model file URL found in response');
        throw new Error('No model file URL found in fal.ai Hunyuan3D response');
      }

      return {
        model_file: modelFile,
        gaussian_ply: data.gaussian_ply || data?.output?.gaussian_ply || null,
        color_video: data.color_video || data?.output?.color_video || null
      };
      
    } catch (error) {
      logger.error('fal.ai Hunyuan3D 3D Model Generation Error:', error);
      
      // Fallback to fal.ai TripoSR if Hunyuan3D fails
      logger.warn('fal.ai Hunyuan3D failed, falling back to TripoSR...');
      
      try {
        logger.info('Starting fal.ai TripoSR 3D model generation for image:', imageUrl);
      
      // Check if fal client is properly initialized
      if (!fal || typeof fal.subscribe !== 'function') {
        throw new Error('fal.ai client not properly initialized');
      }
      
      logger.info('fal.ai client initialized, calling subscribe...');
      
      const result = await fal.subscribe("fal-ai/triposr", {
        input: {
          image_url: imageUrl
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach((message) => {
              logger.info('fal.ai TripoSR:', message);
            });
          }
        },
      });

      logger.info('fal.ai TripoSR generation completed:', JSON.stringify(result, null, 2));

      // Normalize fal.ai outputs into our expected shape
      const data = result?.data || result || {};
      
      // Log the data structure for debugging
      logger.info('fal.ai TripoSR data structure:', JSON.stringify(data, null, 2));

      const collectCandidateUrls = (value) => {
        const candidates = [];
        const pushIfStringUrl = (v) => {
          if (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/') || v.startsWith('./'))) {
            candidates.push(v);
          }
        };

        const scanObject = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          for (const key of Object.keys(obj)) {
            const v = obj[key];
            if (typeof v === 'string') {
              pushIfStringUrl(v);
            } else if (Array.isArray(v)) {
              v.forEach(item => scanObject(item));
            } else if (typeof v === 'object' && v !== null) {
              // Common nested shapes like { url: "..." }
              if (v.url && typeof v.url === 'string') pushIfStringUrl(v.url);
              scanObject(v);
            }
          }
        };

        scanObject(value);
        return candidates;
      };

      const candidateUrls = collectCandidateUrls(data);
      logger.info('fal.ai TripoSR candidate URLs found:', candidateUrls);
      
      // Prefer .glb/.obj first
      const preferred = candidateUrls.find(u => /\.(glb|gltf|obj)(\?|#|$)/i.test(u)) || candidateUrls[0] || null;

      const modelFile = data.model_file
        || data.modelUrl
        || data.model
        || data.glb
        || data.glb_url
        || data.file
        || data.file_url
        || data?.output?.model_file
        || preferred;

      logger.info('fal.ai TripoSR final model file URL:', modelFile);

      if (!modelFile) {
        logger.warn('fal.ai TripoSR: No model file URL found in response');
        throw new Error('No model file URL found in fal.ai response');
      }

      return {
        model_file: modelFile,
        gaussian_ply: data.gaussian_ply || data?.output?.gaussian_ply || null,
        color_video: data.color_video || data?.output?.color_video || null
      };
    } catch (error) {
      logger.error('fal.ai TripoSR 3D Model Generation Error:', error);
      
      // Fallback to Replicate if fal.ai fails
      logger.warn('fal.ai failed, falling back to Replicate...');
      
      try {
        // Use the commented Replicate implementation as fallback
        const defaultOptions = {
          seed: 0,
          texture_size: 256,
          mesh_simplify: 0.3,
          generate_color: true,
          generate_model: true,
          randomize_seed: true,
          generate_normal: false,
          save_gaussian_ply: false,
          ss_sampling_steps: 15,
          slat_sampling_steps: 4,
          return_no_background: false,
          ss_guidance_strength: 7.5,
          slat_guidance_strength: 3,
          output_format: 'glb'
        };

        const finalOptions = { ...defaultOptions, ...options };

        const response = await axios.post(
          'https://api.replicate.com/v1/predictions',
          {
            version: 'firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c',
            input: {
              ...finalOptions,
              images: [imageUrl]
            }
          },
          {
            headers: {
              'Authorization': `Token ${this.replicateToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait'
            },
            timeout: 300000
          }
        );

        logger.info('Replicate fallback successful');
        return {
          model_file: response.data.output?.model_file || response.data.output,
          gaussian_ply: response.data.output?.gaussian_ply,
          color_video: response.data.output?.color_video
        };
      } catch (fallbackError) {
        logger.error('Both fal.ai and Replicate failed:', fallbackError);
        
        // Provide more specific error messages for fal.ai
        if (error.message.includes('fal.ai client not properly initialized')) {
          throw new Error('fal.ai client not properly initialized - check @fal-ai/client installation');
        } else if (error.message.includes('credentials')) {
          throw new Error('fal.ai API credentials invalid - check FAL_API_KEY');
        } else if (error.message.includes('image_url')) {
          throw new Error('Invalid image URL provided to fal.ai');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('fal.ai API quota exceeded or rate limited');
        } else {
          logger.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          throw new Error(`Failed to generate 3D model with both fal.ai and Replicate: ${error.message}`);
        }
      }
    }
  }

  async pollReplicateStatus(predictionId) {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${this.replicateToken}`
            }
          }
        );

        const { status, output, error } = response.data;

        if (status === 'succeeded') {
          return { success: true, output };
        } else if (status === 'failed') {
          return { success: false, error: error || 'Generation failed' };
        } else if (status === 'canceled') {
          return { success: false, error: 'Generation was canceled' };
        }

        // Still processing, wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        logger.error(`Polling attempt ${attempts + 1} failed:`, error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    return { success: false, error: 'Generation timeout' };
  }
}

export default new AIService();
