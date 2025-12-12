import express from 'express';
import ContentViolation from '../models/ContentViolation.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';

const router = express.Router();

// Get content violations (admin only)
router.get('/violations', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      severity, 
      violationType, 
      userId,
      resolved 
    } = req.query;

    const filter = {};
    if (severity) filter.severity = severity;
    if (violationType) filter.violationType = violationType;
    if (userId) filter.userId = userId;
    if (resolved !== undefined) filter.isResolved = resolved === 'true';

    const violations = await ContentViolation.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ContentViolation.countDocuments(filter);

    // Get violation statistics
    const stats = await ContentViolation.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const severityStats = {};
    stats.forEach(stat => {
      severityStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        violations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          total,
          bySeverity: severityStats
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching violations:', error);
    next(new AppError('Failed to fetch violations', 500));
  }
});

// Get user violation history
router.get('/violations/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const violations = await ContentViolation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const violationCount24h = await ContentViolation.getUserViolationCount(userId, 24);
    const violationCount7d = await ContentViolation.getUserViolationCount(userId, 24 * 7);
    const shouldBlock = await ContentViolation.shouldBlockUser(userId);

    res.json({
      success: true,
      data: {
        userId,
        violations,
        stats: {
          count24h: violationCount24h,
          count7d: violationCount7d,
          shouldBlock,
          total: violations.length
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user violations:', error);
    next(new AppError('Failed to fetch user violations', 500));
  }
});

// Resolve violation (admin action)
router.patch('/violations/:violationId/resolve', async (req, res, next) => {
  try {
    const { violationId } = req.params;
    const { notes, resolvedBy } = req.body;

    const violation = await ContentViolation.findById(violationId);
    if (!violation) {
      return next(new AppError('Violation not found', 404));
    }

    violation.isResolved = true;
    violation.resolvedBy = resolvedBy || 'admin';
    violation.resolvedAt = new Date();
    if (notes) violation.notes = notes;

    await violation.save();

    logger.info('Violation resolved:', {
      violationId,
      resolvedBy: violation.resolvedBy,
      userId: violation.userId
    });

    res.json({
      success: true,
      data: {
        violation,
        message: 'Violation resolved successfully'
      }
    });
  } catch (error) {
    logger.error('Error resolving violation:', error);
    next(new AppError('Failed to resolve violation', 500));
  }
});

// Get violation statistics
router.get('/violations/stats', async (req, res, next) => {
  try {
    const { timeframe = 7 } = req.query; // days
    const since = new Date(Date.now() - (parseInt(timeframe) * 24 * 60 * 60 * 1000));

    const stats = await ContentViolation.aggregate([
      {
        $match: {
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Get top violating users
    const topViolators = await ContentViolation.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          isResolved: false
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          latestViolation: { $max: '$createdAt' },
          severities: { $push: '$severity' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        timeframe: parseInt(timeframe),
        dailyStats: stats,
        topViolators
      }
    });
  } catch (error) {
    logger.error('Error fetching violation stats:', error);
    next(new AppError('Failed to fetch violation statistics', 500));
  }
});

// Block/unblock user
router.patch('/users/:userId/block', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { action, reason, blockedBy } = req.body; // action: 'block' or 'unblock'

    if (action === 'block') {
      // Create a violation record for manual block
      const violation = new ContentViolation({
        userId,
        violationType: 'repeated_violations',
        content: reason || 'Manually blocked by admin',
        severity: 'critical',
        action: 'account_suspended',
        notes: `Manually blocked by ${blockedBy || 'admin'}: ${reason || 'No reason provided'}`
      });

      await violation.save();

      logger.warn('User manually blocked:', {
        userId,
        reason,
        blockedBy,
        violationId: violation._id
      });

      res.json({
        success: true,
        data: {
          message: 'User blocked successfully',
          violation
        }
      });
    } else if (action === 'unblock') {
      // Resolve all active violations for the user
      await ContentViolation.updateMany(
        { userId, isResolved: false },
        { 
          isResolved: true, 
          resolvedBy: blockedBy || 'admin',
          resolvedAt: new Date(),
          notes: `Manually unblocked: ${reason || 'No reason provided'}`
        }
      );

      logger.info('User manually unblocked:', {
        userId,
        reason,
        unblockedBy: blockedBy
      });

      res.json({
        success: true,
        data: {
          message: 'User unblocked successfully'
        }
      });
    } else {
      return next(new AppError('Invalid action. Use "block" or "unblock"', 400));
    }
  } catch (error) {
    logger.error('Error blocking/unblocking user:', error);
    next(new AppError('Failed to update user block status', 500));
  }
});

// Import request tracker for managing blocked requests
import requestTracker from '../utils/requestTracker.js';

// Get blocked request lists
router.get('/blocked-requests', async (req, res, next) => {
  try {
    const blockLists = requestTracker.getBlockLists();
    
    res.json({
      success: true,
      data: {
        ...blockLists,
        summary: {
          totalBlockedRequests: blockLists.blockedRequestIds.length,
          totalSuspiciousRunners: blockLists.suspiciousRunnerIds.length,
          totalBlockedEndpoints: blockLists.blockedEndpoints.length
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching blocked requests:', error);
    next(new AppError('Failed to fetch blocked requests', 500));
  }
});

// Block a specific request ID
router.post('/block-request', async (req, res, next) => {
  try {
    const { requestId, reason, reportedBy } = req.body;

    if (!requestId) {
      return next(new AppError('Request ID is required', 400));
    }

    await requestTracker.blockRequestId(
      requestId, 
      reason || 'Manually blocked via admin', 
      reportedBy || 'admin'
    );

    logger.info('Request ID blocked via admin:', {
      requestId,
      reason,
      reportedBy
    });

    res.json({
      success: true,
      data: {
        message: 'Request ID blocked successfully',
        requestId,
        reason
      }
    });
  } catch (error) {
    logger.error('Error blocking request ID:', error);
    next(new AppError('Failed to block request ID', 500));
  }
});

// Block a runner ID
router.post('/flag-runner', async (req, res, next) => {
  try {
    const { runnerId, reason, reportedBy } = req.body;

    if (!runnerId) {
      return next(new AppError('Runner ID is required', 400));
    }

    await requestTracker.flagRunnerId(
      runnerId, 
      reason || 'Manually flagged via admin', 
      reportedBy || 'admin'
    );

    res.json({
      success: true,
      data: {
        message: 'Runner ID flagged successfully',
        runnerId,
        reason
      }
    });
  } catch (error) {
    logger.error('Error flagging runner ID:', error);
    next(new AppError('Failed to flag runner ID', 500));
  }
});

// Block an endpoint
router.post('/block-endpoint', async (req, res, next) => {
  try {
    const { endpoint, reason, reportedBy } = req.body;

    if (!endpoint) {
      return next(new AppError('Endpoint is required', 400));
    }

    await requestTracker.blockEndpoint(
      endpoint, 
      reason || 'Manually blocked via admin', 
      reportedBy || 'admin'
    );

    res.json({
      success: true,
      data: {
        message: 'Endpoint blocked successfully',
        endpoint,
        reason
      }
    });
  } catch (error) {
    logger.error('Error blocking endpoint:', error);
    next(new AppError('Failed to block endpoint', 500));
  }
});

// Report a specific violation (like the one you showed me)
router.post('/report-violation', async (req, res, next) => {
  try {
    const { 
      requestId, 
      runnerId, 
      endpoint, 
      reason, 
      reportedBy,
      additionalInfo 
    } = req.body;

    const actions = [];

    // Block the specific request ID
    if (requestId) {
      await requestTracker.blockRequestId(requestId, reason, reportedBy);
      actions.push(`Blocked request ID: ${requestId}`);
    }

    // Flag the runner ID
    if (runnerId) {
      await requestTracker.flagRunnerId(runnerId, reason, reportedBy);
      actions.push(`Flagged runner ID: ${runnerId}`);
    }

    // Block the endpoint if needed
    if (endpoint) {
      await requestTracker.blockEndpoint(endpoint, reason, reportedBy);
      actions.push(`Blocked endpoint: ${endpoint}`);
    }

    logger.warn('Violation reported and processed:', {
      requestId,
      runnerId,
      endpoint,
      reason,
      reportedBy,
      actionsCount: actions.length
    });

    res.json({
      success: true,
      data: {
        message: 'Violation reported and processed successfully',
        actions,
        additionalInfo
      }
    });
  } catch (error) {
    logger.error('Error processing violation report:', error);
    next(new AppError('Failed to process violation report', 500));
  }
});

export default router;