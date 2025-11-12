import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler.js';
import User from '../models/User.js';

export const signToken = (id) => {
  // Parse JWT_EXPIRES_IN format (e.g., "7d", "24h", "3600s") into seconds
  const parseExpiresIn = (expiresIn) => {
    if (!expiresIn) return '7d'; // default fallback
    
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) return expiresIn; // return as-is if not in expected format
    
    const [, value, unit] = match;
    const num = parseInt(value, 10);
    
    switch (unit) {
      case 'd': return num * 24 * 60 * 60; // days to seconds
      case 'h': return num * 60 * 60;       // hours to seconds
      case 'm': return num * 60;            // minutes to seconds
      case 's': return num;                 // seconds
      default: return expiresIn;
    }
  };

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: parseExpiresIn(process.env.JWT_EXPIRES_IN)
  });
};

export const createSendToken = (user, statusCode, res, additionalData = {}) => {
  const token = signToken(user._id);
  
  // Sanitize cookie expiry from env (in days). Fallback to 7 days if unset/invalid
  const cookieExpireDaysRaw = process.env.JWT_COOKIE_EXPIRES_IN;
  const cookieExpireDaysParsed = Number(cookieExpireDaysRaw);
  const cookieExpireDays = Number.isFinite(cookieExpireDaysParsed) && cookieExpireDaysParsed > 0
    ? cookieExpireDaysParsed
    : 7;

  const cookieOptions = {
    maxAge: Math.round(cookieExpireDays * 24 * 60 * 60 * 1000), // milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
      ...additionalData
    }
  });
};

export const protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again!', 401));
  }
};
