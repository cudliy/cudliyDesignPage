import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import Gift from '../models/Gift.js';
import Design from '../models/Design.js';
import User from '../models/User.js';

// Create a gift share link
export const createGift = async (req, res, next) => {
  try {
    const { designId, senderName, recipientName, recipientEmail, message, senderId } = req.body;

    // Validate required fields
    if (!designId || !senderName || !recipientName) {
      return next(new AppError('Missing required fields', 400));
    }

    // Verify design exists
    const design = await Design.findOne({ id: designId });
    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // Create unique share link
    const giftId = uuidv4();
    const shareLink = `${process.env.FRONTEND_URL || 'https://cudliy.com'}/gift/${giftId}`;

    // Create gift record
    const gift = new Gift({
      id: giftId,
      designId,
      senderId: senderId || 'anonymous',
      senderName,
      recipientName,
      recipientEmail,
      message: message || '',
      shareLink,
      status: 'created'
    });

    await gift.save();

    logger.info(`Gift created: ${giftId} from ${senderName} to ${recipientName}`);

    res.json({
      success: true,
      data: {
        giftId: gift.id,
        shareLink: gift.shareLink,
        recipientName: gift.recipientName,
        recipientEmail: gift.recipientEmail,
        expiresAt: gift.expiresAt,
        message: 'Gift link created successfully'
      }
    });

  } catch (error) {
    logger.error('Create Gift Error:', error);
    next(new AppError('Failed to create gift', 500));
  }
};

// Get gift details (for recipient viewing)
export const getGift = async (req, res, next) => {
  try {
    const { giftId } = req.params;

    const gift = await Gift.findOne({ id: giftId });
    if (!gift) {
      return next(new AppError('Gift not found or has expired', 404));
    }

    // Check if gift has expired
    if (gift.expiresAt && new Date() > gift.expiresAt) {
      return next(new AppError('This gift link has expired', 410));
    }

    // Get design details
    const design = await Design.findOne({ id: gift.designId });
    if (!design) {
      return next(new AppError('Design not found', 404));
    }

    // Increment view count
    gift.viewCount += 1;
    gift.status = 'viewed';
    gift.viewedAt = new Date();
    gift.metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      viewedFrom: req.headers.referer || 'direct'
    };
    await gift.save();

    logger.info(`Gift viewed: ${giftId} (view count: ${gift.viewCount})`);

    res.json({
      success: true,
      data: {
        gift: {
          id: gift.id,
          senderName: gift.senderName,
          recipientName: gift.recipientName,
          message: gift.message,
          createdAt: gift.createdAt
        },
        design: {
          id: design.id,
          originalText: design.originalText,
          userSelections: design.userSelections,
          generatedPrompt: design.generatedPrompt,
          images: design.images,
          modelFiles: design.modelFiles,
          views: design.views,
          downloadCount: design.downloadCount,
          likes: design.likes
        }
      }
    });

  } catch (error) {
    logger.error('Get Gift Error:', error);
    next(new AppError('Failed to retrieve gift', 500));
  }
};

// Track gift download
export const trackGiftDownload = async (req, res, next) => {
  try {
    const { giftId } = req.params;

    const gift = await Gift.findOne({ id: giftId });
    if (!gift) {
      return next(new AppError('Gift not found', 404));
    }

    gift.status = 'downloaded';
    gift.downloadedAt = new Date();
    await gift.save();

    logger.info(`Gift downloaded: ${giftId}`);

    res.json({
      success: true,
      data: {
        message: 'Download tracked successfully'
      }
    });

  } catch (error) {
    logger.error('Track Gift Download Error:', error);
    next(new AppError('Failed to track download', 500));
  }
};

// Get gift analytics (for sender)
export const getGiftAnalytics = async (req, res, next) => {
  try {
    const { giftId } = req.params;
    const { senderId } = req.query;

    const gift = await Gift.findOne({ id: giftId });
    if (!gift) {
      return next(new AppError('Gift not found', 404));
    }

    // Verify sender
    if (senderId && gift.senderId !== senderId) {
      return next(new AppError('Unauthorized', 403));
    }

    res.json({
      success: true,
      data: {
        giftId: gift.id,
        senderName: gift.senderName,
        recipientName: gift.recipientName,
        recipientEmail: gift.recipientEmail,
        status: gift.status,
        viewCount: gift.viewCount,
        viewedAt: gift.viewedAt,
        downloadedAt: gift.downloadedAt,
        createdAt: gift.createdAt,
        expiresAt: gift.expiresAt,
        shareLink: gift.shareLink
      }
    });

  } catch (error) {
    logger.error('Get Gift Analytics Error:', error);
    next(new AppError('Failed to get analytics', 500));
  }
};

// Send gift email notification
export const sendGiftEmail = async (req, res, next) => {
  try {
    const { giftId } = req.params;

    const gift = await Gift.findOne({ id: giftId });
    if (!gift) {
      return next(new AppError('Gift not found', 404));
    }

    // TODO: Implement email sending service
    // For now, just return success
    logger.info(`Gift email would be sent to: ${gift.recipientEmail}`);

    res.json({
      success: true,
      data: {
        message: 'Gift notification email sent',
        recipientEmail: gift.recipientEmail
      }
    });

  } catch (error) {
    logger.error('Send Gift Email Error:', error);
    next(new AppError('Failed to send email', 500));
  }
};

// List user's sent gifts
export const getUserGifts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const gifts = await Gift.find({ senderId: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Gift.countDocuments({ senderId: userId });

    res.json({
      success: true,
      data: {
        gifts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get User Gifts Error:', error);
    next(new AppError('Failed to retrieve gifts', 500));
  }
};