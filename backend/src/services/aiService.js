import dotenv from 'dotenv'
dotenv.config()
import OpenAI from 'openai';
import axios from 'axios';
import logger from '../utils/logger.js';

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.replicateToken = process.env.REPLICATE_API_TOKEN;
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
    const defaultOptions = {
      seed: 0,
      texture_size: 256, // Very aggressive reduction to 256px for minimal file size
      mesh_simplify: 0.3, // Very aggressive simplification for smallest possible file
      generate_color: true,
      generate_model: true,
      randomize_seed: true,
      generate_normal: false,
      save_gaussian_ply: false, // Disabled to reduce file size
      ss_sampling_steps: 15, // Very low sampling for minimal file size
      slat_sampling_steps: 4, // Very low sampling for minimal file size
      return_no_background: false,
      ss_guidance_strength: 7.5,
      slat_guidance_strength: 3,
      output_format: 'glb' // Ensure GLB output
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
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
          timeout: 300000 // 5 minutes timeout for 3D generation
        }
      );

      // Return the expected format
      return {
        model_file: response.data.output?.model_file || response.data.output,
        gaussian_ply: response.data.output?.gaussian_ply,
        color_video: response.data.output?.color_video
      };
    } catch (error) {
      logger.error('3D Model Generation Error:', error);
      throw new Error('Failed to generate 3D model');
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
