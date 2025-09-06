import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import Session from '../models/Session.js';

// Get Session Status
export const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ id: sessionId });

    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    logger.error('Get Session Error:', error);
    next(new AppError('Failed to retrieve session', 500));
  }
};

// Cleanup old sessions periodically
export const cleanupOldSessions = async () => {
  try {
    const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    logger.info(`Cleaned up ${result.deletedCount} expired sessions`);
  } catch (error) {
    logger.error('Session cleanup error:', error);
  }
};
