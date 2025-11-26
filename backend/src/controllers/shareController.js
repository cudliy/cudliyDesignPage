import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import Design from '../models/Design.js';
import User from '../models/User.js';

// Generate personalized sharing data for Spotify Wrapped-style experience
export const generateShareData = async (req, res, next) => {
  try {
    const { designId } = req.params;
    const { userId } = req.query;

    logger.info(`Generating share data for design: ${designId}, user: ${userId}`);

    // Get design data
    const design = await Design.findOne({ id: designId });
    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // Get user data if userId provided
    let user = null;
    if (userId && userId !== 'guest' && !userId.startsWith('guest_')) {
      user = await User.findOne({ id: userId });
    }

    // Generate personalized content
    const shareData = await generatePersonalizedContent(design, user);

    res.json({
      success: true,
      data: shareData
    });

  } catch (error) {
    logger.error('Generate Share Data Error:', error);
    next(new AppError('Failed to generate share data', 500));
  }
};

// Helper function to generate personalized content
const generatePersonalizedContent = async (design, user) => {
  const createdDate = new Date(design.createdAt);
  const userName = user?.profile?.firstName || user?.username || 'Creator';
  
  // Calculate design stats
  const stats = {
    creationMonth: createdDate.toLocaleString('default', { month: 'long' }),
    creationYear: createdDate.getFullYear(),
    style: design.userSelections?.style || 'Custom',
    material: design.userSelections?.material || 'Premium',
    size: design.userSelections?.size || 'Medium',
    views: design.views || 0,
    downloads: design.downloadCount || 0,
    likes: design.likes || 0,
    imagesGenerated: design.images?.length || design.generatedImages?.length || 0,
    processingTime: calculateProcessingTime(design),
    uniqueFeatures: extractUniqueFeatures(design)
  };

  // Generate personalized messages
  const messages = generatePersonalizedMessages(userName, design, stats);

  // Create slide data
  const slides = [
    {
      id: 'intro',
      type: 'intro',
      title: `${userName}'s 3D Journey`,
      subtitle: 'Your creative adventure with Cudliy',
      content: messages.intro,
      animation: 'fadeInUp',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: 'white',
      icon: '🎨',
      data: { userName }
    },
    
    {
      id: 'stats',
      type: 'stats',
      title: 'Your Creative Stats',
      subtitle: `Created in ${stats.creationMonth} ${stats.creationYear}`,
      content: messages.stats,
      animation: 'slideInLeft',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      textColor: 'white',
      icon: '📊',
      data: {
        style: stats.style,
        material: stats.material,
        size: stats.size,
        views: stats.views,
        downloads: stats.downloads,
        likes: stats.likes,
        processingTime: stats.processingTime
      }
    },
    
    {
      id: 'journey',
      type: 'journey',
      title: 'Your Creative Process',
      subtitle: 'From idea to 3D reality',
      content: messages.journey,
      animation: 'zoomIn',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      textColor: 'white',
      icon: '🚀',
      data: {
        originalText: design.originalText,
        generatedPrompt: design.generatedPrompt,
        imagesGenerated: stats.imagesGenerated,
        uniqueFeatures: stats.uniqueFeatures
      }
    },
    
    {
      id: 'design',
      type: 'design',
      title: 'Your 3D Masterpiece',
      subtitle: `${userName}, you created something amazing!`,
      content: messages.design,
      animation: 'rotateIn',
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      textColor: 'white',
      icon: '✨',
      data: {
        imageUrl: design.modelFiles?.originalImage || design.images?.[0]?.url,
        modelUrl: design.modelFiles?.storedModelUrl || design.modelFiles?.modelFile,
        hasModel: !!(design.modelFiles?.storedModelUrl || design.modelFiles?.modelFile),
        designId: design.id
      }
    },
    
    {
      id: 'impact',
      type: 'impact',
      title: 'Your Design Impact',
      subtitle: 'Making waves in the 3D community',
      content: messages.impact,
      animation: 'bounceIn',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      textColor: 'gray-800',
      icon: '🌟',
      data: {
        views: stats.views,
        downloads: stats.downloads,
        likes: stats.likes,
        engagement: calculateEngagement(stats)
      }
    },
    
    {
      id: 'finale',
      type: 'finale',
      title: 'Share Your Creation',
      subtitle: `${userName}, show the world what you've built!`,
      content: messages.finale,
      animation: 'pulse',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: 'white',
      icon: '🎉',
      data: { 
        userName, 
        designId: design.id,
        shareUrl: `${process.env.FRONTEND_URL || 'https://cudliy.com'}/design/${design.id}`
      }
    }
  ];

  return {
    designId: design.id,
    userName,
    stats,
    messages,
    slides,
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0',
      totalSlides: slides.length
    }
  };
};

// Helper functions
const calculateProcessingTime = (design) => {
  if (!design.createdAt || !design.updatedAt) return 'Unknown';
  
  const created = new Date(design.createdAt);
  const updated = new Date(design.updatedAt);
  const diffMs = updated.getTime() - created.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Less than a minute';
  if (diffMins < 60) return `${diffMins} minutes`;
  
  const diffHours = Math.round(diffMins / 60);
  return `${diffHours} hours`;
};

const extractUniqueFeatures = (design) => {
  const features = [];
  
  if (design.userSelections?.style) {
    features.push(`${design.userSelections.style} style`);
  }
  
  if (design.userSelections?.material) {
    features.push(`${design.userSelections.material} material`);
  }
  
  if (design.userSelections?.details && design.userSelections.details.length > 0) {
    features.push(`${design.userSelections.details.length} custom details`);
  }
  
  if (design.modelFiles?.colorVideo) {
    features.push('Color animation');
  }
  
  if (design.modelFiles?.gaussianPly) {
    features.push('Advanced 3D model');
  }
  
  return features;
};

const calculateEngagement = (stats) => {
  const total = stats.views + stats.downloads + (stats.likes * 2); // Weight likes more
  
  if (total < 10) return 'Growing';
  if (total < 50) return 'Popular';
  if (total < 100) return 'Trending';
  return 'Viral';
};

const generatePersonalizedMessages = (userName, design, stats) => {
  return {
    intro: `Hey ${userName}! Ready to see your amazing 3D design journey? Let's dive into what you created with Cudliy!`,
    
    stats: `${userName}, you chose ${stats.style} style with ${stats.material} material. Your design has been viewed ${stats.views} times and downloaded ${stats.downloads} times!`,
    
    journey: `Starting with "${design.originalText}", you transformed your idea into ${stats.imagesGenerated} unique variations. The magic happened in just ${stats.processingTime}!`,
    
    design: `${userName}, your creativity shines through! From a simple idea to a stunning 3D model - you've mastered the art of digital creation.`,
    
    impact: `Your design is making waves! With ${stats.views} views and ${stats.downloads} downloads, you're inspiring the Cudliy community. Keep creating!`,
    
    finale: `${userName}, you're a 3D design superstar! Share your creation and inspire others to start their own creative journey with Cudliy.`
  };
};

// Get sharing analytics
export const getShareAnalytics = async (req, res, next) => {
  try {
    const { designId } = req.params;
    
    const design = await Design.findOne({ id: designId });
    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // Increment share count (you might want to add this field to the Design model)
    design.views += 1; // For now, increment views as a proxy for shares
    await design.save();

    res.json({
      success: true,
      data: {
        designId,
        shares: design.views, // Placeholder
        views: design.views,
        downloads: design.downloadCount,
        likes: design.likes
      }
    });

  } catch (error) {
    logger.error('Get Share Analytics Error:', error);
    next(new AppError('Failed to get share analytics', 500));
  }
};

// Track share event
export const trackShare = async (req, res, next) => {
  try {
    const { designId } = req.params;
    const { platform, slideIndex, userId } = req.body;

    logger.info(`Share tracked: Design ${designId} shared on ${platform} (slide ${slideIndex}) by user ${userId}`);

    const design = await Design.findOne({ id: designId });
    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // You could add a shares tracking field to the Design model
    // For now, we'll just log the event
    
    res.json({
      success: true,
      data: {
        message: 'Share tracked successfully',
        designId,
        platform,
        slideIndex
      }
    });

  } catch (error) {
    logger.error('Track Share Error:', error);
    next(new AppError('Failed to track share', 500));
  }
};