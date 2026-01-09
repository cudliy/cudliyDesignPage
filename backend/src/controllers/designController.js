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
import awsService from '../services/awsService.js'; // Now using R2Service
import contentFilter from '../utils/contentFilter.js';
import requestTracker from '../utils/requestTracker.js';

// Helper function to save images to AWS S3
const saveImagesToS3 = async (imageUrls) => {
  const savedImages = [];
  
  // Check if we should skip S3 uploads due to ACL issues
  const skipS3Uploads = process.env.SKIP_S3_UPLOADS === 'true' || true; // Temporarily disable S3 uploads
  
  for (const imageUrl of imageUrls) {
    try {
      if (skipS3Uploads) {
        logger.info('S3 uploads disabled, converting image to base64 for permanent storage');
        
        // Convert image to base64 to avoid temporary URL expiration
        try {
          const response = await axios.get(imageUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000 // 30 second timeout
          });
          
          const base64 = Buffer.from(response.data, 'binary').toString('base64');
          const mimeType = response.headers['content-type'] || 'image/jpeg';
          const base64Url = `data:${mimeType};base64,${base64}`;
          
          savedImages.push({
            originalUrl: imageUrl,
            s3Url: base64Url, // Use base64 URL for permanent storage
            fileName: null,
            skipReason: 'S3 uploads disabled, using base64'
          });
          
          logger.info(`Image converted to base64 for permanent storage: ${imageUrl.substring(0, 50)}...`);
        } catch (conversionError) {
          logger.error(`Failed to convert image to base64: ${imageUrl}`, conversionError);
          // Fallback to original URL if conversion fails
          savedImages.push({
            originalUrl: imageUrl,
            s3Url: imageUrl, // Use original URL as fallback
            fileName: null,
            skipReason: 'S3 uploads disabled, base64 conversion failed'
          });
        }
        continue;
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileName = `image_${timestamp}_${randomId}.jpg`;
      
      // Upload image to AWS S3
      const s3Url = await awsService.uploadFromUrl(imageUrl, fileName, {
        contentType: 'image/jpeg',
        metadata: {
          source: 'ai_generation',
          uploadedAt: new Date().toISOString()
        }
      });
      
      savedImages.push({
        originalUrl: imageUrl,
        s3Url: s3Url,
        fileName: fileName
      });
      
      logger.info(`Image saved to S3: ${imageUrl} -> ${s3Url}`);
    } catch (error) {
      logger.error(`Failed to save image to S3: ${imageUrl}`, error);
      // Keep original URL if S3 upload fails
      savedImages.push({
        originalUrl: imageUrl,
        s3Url: imageUrl, // Fallback to original URL
        fileName: null,
        error: error.message
      });
      
      // Log specific S3 error for debugging
      if (error.message.includes('ACL')) {
        logger.warn('S3 ACL error detected - bucket may have ACLs disabled. Using original URLs as fallback.');
      }
    }
  }
  
  return savedImages;
};

// Helper function to save 3D model to AWS S3
const saveModelToS3 = async (modelUrl, modelType = 'glb') => {
  // Temporarily disable S3 uploads for 3D models as well
  const skipS3Uploads = process.env.SKIP_S3_UPLOADS === 'true' || true;
  
  if (skipS3Uploads) {
    logger.info('S3 uploads disabled, using original 3D model URL');
    return {
      originalUrl: modelUrl,
      s3Url: modelUrl, // Use original URL
      fileName: null,
      skipReason: 'S3 uploads disabled'
    };
  }

  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileName = `model_${timestamp}_${randomId}.${modelType}`;
    
    // Upload model to AWS S3
    const s3Url = await awsService.uploadFromUrl(modelUrl, fileName, {
      contentType: modelType === 'glb' ? 'model/gltf-binary' : 'model/gltf+json',
      metadata: {
        source: 'ai_generation',
        modelType: modelType,
        uploadedAt: new Date().toISOString()
      }
    });
    
    logger.info(`3D model saved to S3: ${modelUrl} -> ${s3Url}`);
    return {
      originalUrl: modelUrl,
      s3Url: s3Url,
      fileName: fileName
    };
  } catch (error) {
    logger.error(`Failed to save 3D model to S3: ${modelUrl}`, error);
    // Return original URL if S3 upload fails
    return {
      originalUrl: modelUrl,
      s3Url: modelUrl, // Fallback to original URL
      fileName: null,
      error: error.message
    };
  }
};

// Generate Images Route (Main workflow endpoint) - No authentication required
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

    logger.info(`Starting image generation for guest user: ${user_id || 'anonymous'}`);

    // REQUEST TRACKING - Check for blocked request patterns
    const requestCheck = await requestTracker.checkRequest({
      userId: user_id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      prompt: text,
      endpoint: req.originalUrl,
      timestamp: new Date()
    });

    if (requestCheck.shouldBlock) {
      logger.warn('Request blocked by request tracker:', {
        userId: user_id?.substring(0, 10) + '...',
        reason: requestCheck.reason,
        violationType: requestCheck.violationType
      });
      
      return next(new AppError(requestCheck.reason, 403));
    }

    // CONTENT FILTERING - Check for inappropriate content
    const userSelections = { text, color, size, style, material, production, details };
    const contentCheck = contentFilter.checkFullContent(userSelections);
    
    if (contentCheck.isInappropriate) {
      // Record the violation
      const violationResult = await contentFilter.recordViolation(
        user_id,
        text,
        contentCheck.foundTerms || [],
        req.ip,
        req.get('User-Agent')
      );

      logger.warn('Inappropriate content blocked and violation recorded:', {
        userId: user_id?.substring(0, 10) + '...',
        reason: contentCheck.reason,
        foundTerms: contentCheck.foundTerms?.length || 0,
        action: violationResult.action,
        severity: violationResult.severity
      });
      
      // Customize error message based on severity
      let errorMessage = `Content not allowed: ${contentCheck.reason}`;
      if (violationResult.severity === 'critical') {
        errorMessage = 'Your account has been flagged for policy violations. Please contact support if you believe this is an error.';
      } else if (violationResult.action === 'blocked') {
        errorMessage = 'Multiple policy violations detected. Please use family-friendly content only.';
      } else {
        errorMessage += ` Please try: ${contentCheck.suggestions?.join(', ') || 'family-friendly descriptions'}`;
      }
      
      return next(new AppError(errorMessage, violationResult.shouldBlock ? 403 : 400));
    }

    // Additional user history check
    const userHistoryCheck = await contentFilter.checkUserHistory(user_id, text);
    if (userHistoryCheck.shouldBlock) {
      logger.warn('User blocked due to content violation history:', { 
        userId: user_id,
        violationCount: userHistoryCheck.violationCount
      });
      return next(new AppError('Account temporarily restricted due to repeated policy violations. Please contact support.', 403));
    }

    // No user authentication or usage limits for guest access
    // All users can generate images without restrictions

    // Create session for guest user (no authentication required)
    const session = new Session({
      userId: user_id || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    // Save images to AWS S3 (with fallback to original URLs)
    const imageUrls = imageResults.map(img => img.url);
    const savedImages = await saveImagesToS3(imageUrls);

    // Update session with both original and S3 URLs
    session.generatedImages = imageResults.map(img => img.url);
    session.savedImages = savedImages; // Store S3 information
    session.currentStep = 'image_selection';
    await session.save();

    // Create Design document immediately after image generation
    const actualUserId = user_id || session.userId || 'guest';
    
    const design = new Design({
      userId: actualUserId,
      creationId: creation_id || session.creationId || `creation_${Date.now()}`,
      sessionId: session.id,
      originalText: text,
      userSelections: {
        color,
        size,
        style,
        material,
        production,
        details
      },
      generatedPrompt: enhancedPrompt,
      images: imageResults.map((img, index) => ({
        url: savedImages[index]?.s3Url || img.url,
        selected: index === 0,
        index
      })),
      selectedImageIndex: 0,
      status: 'completed'
    });

    await design.save();
    logger.info(`Design created with images for session: ${session.id}`);

    // No usage tracking for guest users - unlimited access

    logger.info(`Images generated for session: ${session.id} (S3 storage disabled, using original URLs)`);

    // Check if any S3 uploads failed or were skipped
    const s3UploadFailures = savedImages.filter(img => img.error).length;
    const s3UploadsSkipped = savedImages.filter(img => img.skipReason).length;
    const successMessage = s3UploadsSkipped > 0 
      ? 'AI images generated successfully using original URLs (S3 storage disabled)'
      : s3UploadFailures > 0 
        ? `AI images generated successfully. ${s3UploadFailures} images using original URLs due to storage issues.`
        : 'AI images generated and saved to cloud storage successfully';

    const responseData = {
      success: true,
      data: {
        session_id: session.id,
        images: imageResults.map((img, index) => ({
          ...img,
          s3Url: savedImages[index]?.s3Url || img.url,
          fileName: savedImages[index]?.fileName,
          uploadStatus: savedImages[index]?.error ? 'fallback' : 'stored'
        })),
        creation_id,
        user_id: user_id || session.userId,
        prompt: enhancedPrompt,
        // No usage tracking for guest users
        message: successMessage
      }
    };

    logger.info(`📤 Sending response to frontend:`, {
      session_id: responseData.data.session_id,
      image_count: responseData.data.images.length,
      images: responseData.data.images.map(img => ({ url: img.url, index: img.index }))
    });

    res.json(responseData);

  } catch (error) {
    logger.error('Generate Images Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate images';
    
    if (error.message.includes('timeout')) {
      errorMessage = 'Image generation timed out. Please try again with a simpler prompt.';
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      errorMessage = 'Authentication error. Please refresh the page and try again.';
    }
    
    next(new AppError(errorMessage, 500));
  }
};

// Generate 3D Model Route (Second workflow endpoint) - No authentication required
export const generate3DModel = async (req, res, next) => {
  try {
    const { 
      image_url, 
      session_id,
      user_id, 
      creation_id,
      options = {}
    } = req.body;

    logger.info(`Starting 3D model generation for guest user: ${user_id || 'anonymous'}`);

    // No authentication or usage limits for guest access
    // All users can generate 3D models without restrictions
    const actualUserId = user_id || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

    // Save 3D models to Google Cloud Storage
    let storedModelUrl = null;
    let storedPlyUrl = null;
    
    if (modelResult.model_file) {
      const modelSaveResult = await saveModelToS3(modelResult.model_file, 'glb');
      storedModelUrl = modelSaveResult.s3Url;
    }
    
    if (modelResult.gaussian_ply) {
      const plySaveResult = await saveModelToS3(modelResult.gaussian_ply, 'ply');
      storedPlyUrl = plySaveResult.s3Url;
    }
    
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
    
    // Create design record with S3 URLs
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
        modelFile: storedModelUrl || validateModelUrl(modelResult.model_file),
        storedModelUrl: storedModelUrl,
        gaussianPly: storedPlyUrl || validateModelUrl(modelResult.gaussian_ply),
        colorVideo: validateModelUrl(modelResult.color_video),
        // Store both original and S3 URLs for reference
        originalModelFile: modelResult.model_file,
        originalGaussianPly: modelResult.gaussian_ply
      },
      generationOptions: options,
      status: 'completed',
      // Store S3 information
      s3Storage: {
        modelFile: storedModelUrl ? {
          s3Url: storedModelUrl,
          originalUrl: modelResult.model_file
        } : null,
        gaussianPly: storedPlyUrl ? {
          s3Url: storedPlyUrl,
          originalUrl: modelResult.gaussian_ply
        } : null
      }
    });

    await design.save();

    // Update session
    if (session) {
      session.currentStep = 'completed';
      await session.save();
    }

    // No usage tracking for guest users - unlimited access

    logger.info(`3D model generated successfully. Design ID: ${design.id}`);

    res.json({
      success: true,
      data: {
        design_id: design.id,
        image_url,
        model_url: storedModelUrl || modelResult.model_file,
        original_model_url: modelResult.model_file,
        stored_model_url: storedModelUrl,
        gaussian_ply: storedPlyUrl || modelResult.gaussian_ply,
        original_gaussian_ply: modelResult.gaussian_ply,
        color_video: modelResult.color_video,
        creation_id: creation_id || session?.creationId || design.creationId,
        user_id: actualUserId,
        s3_storage: {
          model_file: storedModelUrl ? {
            s3_url: storedModelUrl,
            original_url: modelResult.model_file
          } : null,
          gaussian_ply: storedPlyUrl ? {
            s3_url: storedPlyUrl,
            original_url: modelResult.gaussian_ply
          } : null
        }
      },
      message: ''
    });

  } catch (error) {
    logger.error('Generate 3D Model Error:', error);
    next(new AppError(error.message || 'Failed to generate 3D model', 500));
  }
};

// Get design progress
export const getDesignProgress = async (req, res, next) => {
  try {
    const { designId } = req.params;

    logger.info(`Getting progress for design: ${designId}`);

    const design = await Design.findOne({ id: designId });

    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // Calculate progress based on design status and model files
    let progress = 0;
    let status = 'pending';
    let message = 'Initializing...';
    let hasModel = false;

    // Check if we have model files (processing complete)
    if (design.modelFiles?.storedModelUrl || design.modelFiles?.modelFile) {
      progress = 100;
      status = 'completed';
      message = 'Processing complete!';
      hasModel = true;
    } else if (design.status === 'completed') {
      // Design marked as completed but no model files yet - assume it's ready
      progress = 100;
      status = 'completed';
      message = 'Processing complete!';
      hasModel = true;
    } else if (design.images && design.images.length > 0) {
      // We have images, so 3D generation has started
      const timeSinceCreated = Date.now() - new Date(design.createdAt).getTime();
      const minutesElapsed = timeSinceCreated / (1000 * 60);
      
      if (minutesElapsed < 1) {
        progress = 25;
        message = 'Analyzing input image...';
      } else if (minutesElapsed < 2) {
        progress = 45;
        message = 'Extracting 3D features...';
      } else if (minutesElapsed < 3) {
        progress = 65;
        message = 'Generating 3D geometry...';
      } else if (minutesElapsed < 4) {
        progress = 80;
        message = 'Applying textures and materials...';
      } else if (minutesElapsed < 5) {
        progress = 90;
        message = 'Optimizing model quality...';
      } else {
        progress = 98;
        message = 'Finalizing 3D model...';
      }
      
      status = 'processing';
    } else if (design.status === 'processing') {
      // Design is being processed
      progress = 15;
      status = 'processing';
      message = 'Processing your design...';
    } else {
      // Default state
      progress = 5;
      status = 'pending';
      message = 'Initializing 3D model generation...';
    }

    // Add some randomness to make it feel more realistic (but don't exceed 98% unless complete)
    if (status === 'processing' && progress < 98) {
      const randomVariation = (Math.random() - 0.5) * 3; // ±1.5% variation
      progress = Math.min(Math.max(progress + randomVariation, 0), 98);
    }

    res.json({
      success: true,
      data: {
        progress: Math.round(progress),
        status,
        message,
        designId,
        hasModel,
        lastUpdated: design.updatedAt,
        createdAt: design.createdAt
      }
    });
  } catch (error) {
    logger.error('Error getting design progress:', error);
    next(new AppError('Failed to get design progress', 500));
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
