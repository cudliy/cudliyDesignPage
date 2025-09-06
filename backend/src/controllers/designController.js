import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import Design from '../models/Design.js';
import Session from '../models/Session.js';
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

    logger.info(`Images generated successfully for session: ${session.id}`);

    res.json({
      success: true,
      data: {
        session_id: session.id,
        images: imageResults,
        creation_id,
        user_id,
        prompt: enhancedPrompt,
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
    
    // Use the original model URL for now (file upload temporarily disabled)
    storedModelUrl = modelResult.model_file;

    // Create design record
    const design = new Design({
      userId: user_id || session?.userId,
      creationId: creation_id || session?.creationId,
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
        modelFile: modelResult.model_file,
        storedModelUrl,
        gaussianPly: modelResult.gaussian_ply,
        colorVideo: modelResult.color_video
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
        creation_id: creation_id || session?.creationId,
        user_id: user_id || session?.userId,
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
