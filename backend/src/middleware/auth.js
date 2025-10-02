import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler.js';
import User from '../models/User.js';

export const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

export const createSendToken = (user, statusCode, res) => {
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
      user
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
