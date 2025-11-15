import dotenv from 'dotenv'
dotenv.config()
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import logger from '../utils/logger.js';
import { fal } from '@fal-ai/client';

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Initialize Google Gemini
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.geminiModel = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    this.replicateToken = process.env.REPLICATE_API_TOKEN;
    
    // Initialize fal.ai client - require API key to be set in environment
    if (!process.env.FAL_API_KEY) {
      logger.warn('FAL_API_KEY not set - 3D model generation will not work');
    } else {
      logger.info('FAL_API_KEY configured successfully');
    }
    
    fal.config({
      credentials: process.env.FAL_API_KEY
    });
    
    // Validate Replicate token
    if (!this.replicateToken) {
      logger.warn('REPLICATE_API_TOKEN not set - 3D model generation fallback will not work');
    } else {
      logger.info('REPLICATE_API_TOKEN configured successfully');
    }
  }

  async generateEnhancedPrompt(userSelections) {
    const { text, color, size, style, material, production, details } = userSelections;
    
    const systemPrompt = `You are a helpful assistant that create standard prompt for image generation. The background of the image must always be pure white and the characters described must be fully within the frame of the image. DO NOT CREATE THE IMAGE YOU MUST ONLY WRITE A PROMPT. ONLY IN ALPHABETS NO NUMBERS OR SYMBOLS.`;

    try {
      // Try Google Gemini 2.0 Flash first (priority)
      logger.info('Attempting to generate prompt with Google Gemini 2.0 Flash...');
      
      const geminiPrompt = `${systemPrompt}

User specifications:
- Base description: ${text}
- Color: ${color}
- Size: ${size}
- Style: ${style}
- Material: ${material}
- Production: ${production}
- Details: ${details.join(', ')}

Generate a comprehensive prompt that incorporates all these elements naturally.`;

      const geminiResult = await this.geminiModel.generateContent(geminiPrompt);
      const geminiResponse = await geminiResult.response;
      const geminiText = geminiResponse.text();
      
      logger.info('Google Gemini 2.0 Flash prompt generation successful');
      return geminiText.trim();
      
    } catch (geminiError) {
      logger.warn('Google Gemini 2.0 Flash failed, falling back to OpenAI:', geminiError.message);
      
      try {
        // Fallback to OpenAI
        logger.info('Attempting to generate prompt with OpenAI...');
        
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4.1-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Base description: ${text}, Color: ${color}, Size: ${size}, Style: ${style}, Material: ${material}, Production: ${production}, Details: ${details.join(', ')}` }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        logger.info('OpenAI prompt generation successful');
        return response.choices[0].message.content.trim();
        
      } catch (openaiError) {
        logger.error('Both Google Gemini and OpenAI failed:', { geminiError: geminiError.message, openaiError: openaiError.message });
        throw new Error('Failed to generate enhanced prompt with both AI services');
      }
    }
  }

  async generateImageVariations(basePrompt, count = 3) {
    const variations = [
      `${basePrompt}, front view, centered, professional lighting`,
      `${basePrompt}, three-quarter view, soft shadows, detailed texture`,
      `${basePrompt}, side profile, clean lines, minimal background`
    ];

    const generateSingleImage = async (prompt, index, retryCount = 0) => {
      const maxRetries = 2;
      try {
        logger.info(`Starting image generation ${index + 1}/${count} (attempt ${retryCount + 1}) for prompt: ${prompt.substring(0, 50)}...`);
        
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
            timeout: 90000 // 1.5 minutes per image
          }
        );

        logger.info(`Image generation ${index + 1} completed successfully`);
        return {
          url: response.data.output[0],
          prompt,
          index
        };
      } catch (error) {
        logger.error(`Image generation failed for variation ${index} (attempt ${retryCount + 1}):`, error.message);
        
        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          logger.info(`Retrying image generation ${index + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          return generateSingleImage(prompt, index, retryCount + 1);
        }
        
        throw error;
      }
    };

    // Generate all images in parallel with retry logic
    const imagePromises = variations.slice(0, count).map((prompt, index) => 
      generateSingleImage(prompt, index)
    );

    // Execute all promises in parallel
    const results = await Promise.allSettled(imagePromises);
    
    // Filter successful results and handle failures
    const successfulResults = [];
    const failedResults = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        failedResults.push({ index, error: result.reason });
        logger.error(`Image generation ${index + 1} failed after all retries:`, result.reason?.message);
      }
    });

    // Require at least the requested count of images
    if (successfulResults.length >= count) {
      logger.info(`Successfully generated ${successfulResults.length}/${count} images`);
      return successfulResults.slice(0, count);
    } else if (successfulResults.length > 0) {
      // If we have some but not all, log warning but return what we have
      logger.warn(`Only generated ${successfulResults.length}/${count} images. Some generations failed.`);
      return successfulResults;
    } else {
      // If all failed, throw the first error
      throw new Error(`All image generations failed. First error: ${failedResults[0]?.error?.message || 'Unknown error'}`);
    }
  }

  async preprocessImageFor3D(imageUrl) {
    // Enhance input image quality for better 3D generation
    try {
      logger.info('Preprocessing image for 3D generation:', imageUrl);
      
      // For now, return the original URL
      // In a full implementation, you could:
      // 1. Upscale the image using AI
      // 2. Remove background
      // 3. Enhance contrast and sharpness
      // 4. Generate multiple views
      
      return imageUrl;
    } catch (error) {
      logger.warn('Image preprocessing failed, using original:', error.message);
      return imageUrl;
    }
  }

  async generate3DModel(imageUrl, options = {}) {
    // Preprocess the input image for better 3D quality
    const processedImageUrl = await this.preprocessImageFor3D(imageUrl);
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
      logger.info('Starting fal.ai Hunyuan3D mini/turbo textured mesh generation for image:', imageUrl);
      
      // Check if fal client is properly initialized
      if (!fal || typeof fal.subscribe !== 'function') {
        throw new Error('fal.ai client not properly initialized');
      }
      
      logger.info('fal.ai client initialized, calling Hunyuan3D mini/turbo with textured mesh...');
      
      // Use fal.ai's Hunyuan3D mini/turbo model for faster, simpler 3D generation
      const result = await fal.subscribe("fal-ai/hunyuan3d/v2/mini/turbo", {
        input: {
          input_image_url: processedImageUrl,
          // Enable textured mesh generation (3x cost but essential for proper rendering)
          textured_mesh: true,
          // Additional parameters for better quality
          num_inference_steps: 50,
          guidance_scale: 7.5,
          octree_resolution: 256
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

      logger.info('fal.ai Hunyuan3D mini/turbo textured mesh generation completed:', JSON.stringify(result, null, 2));

      // Normalize fal.ai Hunyuan3D outputs into our expected shape
      const data = result?.data || result || {};
      
      // Log the data structure for debugging
      logger.info('fal.ai Hunyuan3D mini/turbo textured mesh data structure:', JSON.stringify(data, null, 2));

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
      logger.info('fal.ai Hunyuan3D mini/turbo textured mesh candidate URLs found:', candidateUrls);
      
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

      logger.info('fal.ai Hunyuan3D mini/turbo textured mesh final model file URL:', modelFile);

      if (!modelFile) {
        logger.warn('fal.ai Hunyuan3D mini/turbo textured mesh: No model file URL found in response');
        throw new Error('No model file URL found in fal.ai Hunyuan3D mini/turbo textured mesh response');
      }

      return {
        model_file: modelFile,
        gaussian_ply: data.gaussian_ply || data?.output?.gaussian_ply || null,
        color_video: data.color_video || data?.output?.color_video || null
      };
      
    } catch (error) {
      logger.error('fal.ai Hunyuan3D mini/turbo textured mesh 3D Model Generation Error:', error);
      
      // Fallback to fal.ai TripoSR if Hunyuan3D fails
      logger.warn('fal.ai Hunyuan3D mini/turbo textured mesh failed, falling back to TripoSR...');
      
      try {
        logger.info('Starting fal.ai TripoSR 3D model generation for image:', imageUrl);
      
      // Check if fal client is properly initialized
      if (!fal || typeof fal.subscribe !== 'function') {
        throw new Error('fal.ai client not properly initialized');
      }
      
      logger.info('fal.ai client initialized, calling subscribe...');
      
      const result = await fal.subscribe("fal-ai/triposr", {
        input: {
          image_url: processedImageUrl,
          // Quality enhancement parameters for TripoSR
          enable_quality_enhancement: true,
          mesh_resolution: "high", // Options: low, medium, high
          texture_resolution: "high", // Options: low, medium, high
          enable_normal_map: true,
          // Ensure color preservation
          preserve_colors: true,
          enhance_colors: true,
          color_accuracy: "high",
          // Advanced mesh settings
          mesh_simplification: 0.1, // Lower = higher quality
          texture_compression: "high_quality",
          // Rendering quality
          render_quality: "ultra",
          enable_physically_based_rendering: true,
          // Additional quality flags
          enable_high_frequency_details: true,
          enable_surface_smoothing: true,
          enable_edge_enhancement: true
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
        // Use the commented Replicate implementation as fallback with HIGH QUALITY settings
        const defaultOptions = {
          seed: 0,
          texture_size: 4096, // Maximum texture resolution for best quality
          mesh_simplify: 0.1, // 90% detail retention (was 0.3 = 70% detail)
          generate_color: true,
          generate_model: true,
          randomize_seed: true,
          generate_normal: true, // Enable normal maps for better lighting
          save_gaussian_ply: true, // Enable high-quality point cloud
          ss_sampling_steps: 50, // Increased from 15 for better quality
          slat_sampling_steps: 25, // Increased from 4 for better quality
          return_no_background: true, // Remove background for cleaner models
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
              images: [processedImageUrl]
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
