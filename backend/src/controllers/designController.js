import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import Design from '../models/Design.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import aiService from '../services/aiService.js';
import storageService from '../services/storageService.js';

// Generate Images Route (Main workflow endpoint)
export const generateImages = async (req, res, next) => {
  try {
    const { 
      text, 
      color, 
      size, 
      style, 
      material, 
      production, 
      details = [],
      user_id,
      creation_id,
      customWidth,
      customHeight
    } = req.body;

    logger.info(`Starting image generation for user: ${user_id}`);

    // Check usage limits
    const user = await User.findOne({ id: user_id });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user has reached their limits
    const subscription = await Subscription.findOne({ 
      userId: user_id, 
      status: { $in: ['active', 'trialing'] } 
    });

    let limits = { imagesPerMonth: 3, modelsPerMonth: 1 }; // Free tier
    if (subscription) {
      limits = subscription.plan.limits;
    }

    // Check image generation limit
    if (limits.imagesPerMonth !== -1 && user.usage.imagesGenerated >= limits.imagesPerMonth) {
      return res.status(402).json({
        success: false,
        error: 'Usage limit exceeded',
        data: {
          limit: limits.imagesPerMonth,
          used: user.usage.imagesGenerated,
          type: 'image',
          upgradeRequired: true,
          message: 'You have reached your monthly image generation limit. Please upgrade to continue.'
        }
      });
    }

    // Create session
    const session = new Session({
      userId: user_id,
      creationId: creation_id,
      originalText: text,
      userSelections: { 
        color, 
        size, 
        style, 
        material, 
        production, 
        details,
        customWidth,
        customHeight
      },
      currentStep: 'prompt_generation'
    });
    await session.save();

    // Generate enhanced prompt
    const enhancedPrompt = await aiService.generateEnhancedPrompt({
      text, color, size, style, material, production, details
    });

    // Update session with prompt
    session.generatedPrompts = [enhancedPrompt];
    session.currentStep = 'image_generation';
    await session.save();

    // Generate image variations
    const imageResults = await aiService.generateImageVariations(enhancedPrompt, 3);

    // Update session with images
    session.generatedImages = imageResults.map(img => img.url);
    session.currentStep = 'image_selection';
    await session.save();

    // Update user usage
    user.usage.imagesGenerated += 1;
    user.usage.lastUsed = new Date();
    await user.save();

    // Update subscription usage if applicable
    if (subscription) {
      subscription.usage.imagesGenerated += 1;
      await subscription.save();
    }

    logger.info(`Images generated successfully for session: ${session.id}`);

    res.json({
      success: true,
      data: {
        session_id: session.id,
        images: imageResults,
        creation_id,
        user_id,
        prompt: enhancedPrompt,
        usage: {
          imagesGenerated: user.usage.imagesGenerated,
          modelsGenerated: user.usage.modelsGenerated,
          limits
        },
        message: 'AI images generated successfully'
      }
    });

  } catch (error) {
    logger.error('Generate Images Error:', error);
    next(new AppError(error.message || 'Failed to generate images', 500));
  }
};

// Generate 3D Model Route (Second workflow endpoint)
export const generate3DModel = async (req, res, next) => {
  try {
    const { 
      image_url, 
      session_id,
      user_id, 
      creation_id,
      options = {}
    } = req.body;

    logger.info(`Starting 3D model generation for session: ${session_id}`);

    // Generate a temporary user_id if not provided or if user doesn't exist
    let actualUserId = user_id;
    let user = null;
    let limits = { imagesPerMonth: 3, modelsPerMonth: 1 }; // Free tier for guest users

    if (user_id) {
      user = await User.findOne({ id: user_id });
      if (user) {
        // Check if user has reached their limits
        const subscription = await Subscription.findOne({ 
          userId: user_id, 
          status: { $in: ['active', 'trialing'] } 
        });

        if (subscription) {
          limits = subscription.plan.limits;
        }

        // Check model generation limit for existing users
        if (limits.modelsPerMonth !== -1 && user.usage.modelsGenerated >= limits.modelsPerMonth) {
          return res.status(402).json({
            success: false,
            error: 'Usage limit exceeded',
            data: {
              limit: limits.modelsPerMonth,
              used: user.usage.modelsGenerated,
              type: 'model',
              upgradeRequired: true,
              message: 'You have reached your monthly model generation limit. Please upgrade to continue.'
            }
          });
        }
      }
    }

    // If no user_id provided or user doesn't exist, create a temporary guest user
    if (!user) {
      actualUserId = user_id || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.info(`Creating temporary guest user for 3D generation: ${actualUserId}`);
      
      // Create a temporary user record for tracking
      user = new User({
        id: actualUserId,
        email: `guest-${actualUserId}@temp.com`,
        username: `guest-${actualUserId}`,
        password: 'temp-password', // This will be hashed if needed
        profile: {
          firstName: 'Guest',
          lastName: 'User'
        },
        subscription: {
          type: 'free'
        },
        usage: {
          imagesGenerated: 0,
          modelsGenerated: 0,
          lastUsed: new Date()
        }
      });
      
      try {
        await user.save();
        logger.info(`Temporary user created: ${actualUserId}`);
      } catch (error) {
        // If user already exists, just fetch it
        if (error.code === 11000) {
          user = await User.findOne({ id: actualUserId });
        } else {
          throw error;
        }
      }
    }

    // Get session data
    const session = session_id ? await Session.findOne({ id: session_id }) : null;
    
    if (session_id && !session) {
      return next(new AppError('Session not found', 404));
    }

    // Update session step
    if (session) {
      session.selectedImageUrl = image_url;
      session.currentStep = '3d_generation';
      await session.save();
    }

    // Generate 3D model
    const modelResult = await aiService.generate3DModel(image_url, options);

    // Validate model result
    if (!modelResult) {
      throw new Error('3D model generation failed - no result returned');
    }

    logger.info('3D model generation result:', modelResult);

    const modelFilename = `models/${Date.now()}-${uuidv4()}.obj`;
    let storedModelUrl = null;
    
    // Validate and fix model URLs
    const validateModelUrl = (url) => {
      if (!url || typeof url !== 'string') return null;
      
      // If it's already a valid URL, return it
      try {
        new URL(url);
        return url;
      } catch {
        // If it's a relative path or filename, make it absolute
        if (url.startsWith('/') || url.startsWith('./')) {
          return url;
        }
        // If it's just a filename, prepend a path
        if (!url.includes('/')) {
          return `/models/${url}`;
        }
        return url;
      }
    };
    
    // Use the original model URL for now (file upload temporarily disabled)
    storedModelUrl = validateModelUrl(modelResult.model_file);

    // Create design record
    const design = new Design({
      userId: actualUserId,
      creationId: creation_id || session?.creationId || `creation_${Date.now()}`,
      sessionId: session_id,
      originalText: session?.originalText || 'Direct 3D generation',
      userSelections: session?.userSelections || {},
      generatedPrompt: session?.generatedPrompts?.[0] || '',
      images: session ? session.generatedImages.map((url, index) => ({
        url,
        selected: url === image_url,
        index
      })) : [{ url: image_url, selected: true, index: 0 }],
      selectedImageIndex: 0,
      modelFiles: {
        originalImage: image_url,
        modelFile: validateModelUrl(modelResult.model_file),
        storedModelUrl,
        gaussianPly: validateModelUrl(modelResult.gaussian_ply),
        colorVideo: validateModelUrl(modelResult.color_video)
      },
      generationOptions: options,
      status: 'completed'
    });

    await design.save();

    // Update session
    if (session) {
      session.currentStep = 'completed';
      await session.save();
    }

    // Update user usage
    user.usage.modelsGenerated += 1;
    user.usage.lastUsed = new Date();
    await user.save();

    // Update subscription usage if applicable (only for existing users with subscriptions)
    const subscription = await Subscription.findOne({ 
      userId: actualUserId, 
      status: { $in: ['active', 'trialing'] } 
    });
    if (subscription) {
      subscription.usage.modelsGenerated += 1;
      await subscription.save();
    }

    logger.info(`3D model generated successfully. Design ID: ${design.id}`);

    res.json({
      success: true,
      data: {
        design_id: design.id,
        image_url,
        model_url: modelResult.model_file,
        stored_model_url: storedModelUrl,
        gaussian_ply: modelResult.gaussian_ply,
        color_video: modelResult.color_video,
        creation_id: creation_id || session?.creationId || design.creationId,
        user_id: actualUserId,
        usage: {
          imagesGenerated: user.usage.imagesGenerated,
          modelsGenerated: user.usage.modelsGenerated,
          limits
        },
        message: '3D model generated successfully'
      }
    });

  } catch (error) {
    logger.error('Generate 3D Model Error:', error);
    next(new AppError(error.message || 'Failed to generate 3D model', 500));
  }
};

// Get Design Details
export const getDesign = async (req, res, next) => {
  try {
    const { designId } = req.params;
    const design = await Design.findOne({ id: designId });

    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // Increment view count
    design.views += 1;
    await design.save();

    res.json({
      success: true,
      data: design
    });

  } catch (error) {
    logger.error('Get Design Error:', error);
    next(new AppError('Failed to retrieve design', 500));
  }
};

// Get User Designs with Pagination
export const getUserDesigns = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status, style } = req.query;
    
    const filter = { userId };
    if (status) filter.status = status;
    if (style) filter['userSelections.style'] = style;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { createdAt: -1 }
    };

    const designs = await Design.find(filter, null, options);
    const total = await Design.countDocuments(filter);

    res.json({
      success: true,
      data: {
        designs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get User Designs Error:', error);
    next(new AppError('Failed to retrieve user designs', 500));
  }
};

// Delete Design
export const deleteDesign = async (req, res, next) => {
  try {
    const { designId } = req.params;
    const design = await Design.findOne({ id: designId });

    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // Delete associated files from storage
    const filesToDelete = [
      design.modelFiles.storedModelUrl,
      design.modelFiles.processedImage
    ].filter(Boolean);

    for (const fileUrl of filesToDelete) {
      try {
        const filename = fileUrl.split('/').pop();
        await storageService.deleteFile(filename);
      } catch (deleteError) {
        logger.warn(`Failed to delete file: ${fileUrl}`, deleteError);
      }
    }

    await Design.deleteOne({ id: designId });

    logger.info(`Design deleted: ${designId}`);

    res.json({
      success: true,
      data: {
        message: 'Design deleted successfully'
      }
    });

  } catch (error) {
    logger.error('Delete Design Error:', error);
    next(new AppError('Failed to delete design', 500));
  }
};

// Update Design Metadata
export const updateDesign = async (req, res, next) => {
  try {
    const { designId } = req.params;
    const { tags, isPublic, title } = req.body;

    const design = await Design.findOne({ id: designId });
    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // Update allowed fields
    if (tags !== undefined) design.tags = tags;
    if (isPublic !== undefined) design.isPublic = isPublic;
    if (title !== undefined) design.title = title;

    await design.save();

    res.json({
      success: true,
      data: {
        design,
        message: 'Design updated successfully'
      }
    });

  } catch (error) {
    logger.error('Update Design Error:', error);
    next(new AppError('Failed to update design', 500));
  }
};
