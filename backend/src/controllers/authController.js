import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';
import { createSendToken } from '../middleware/auth.js';

export const signup = async (req, res, next) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError('Email already in use', 409));
    }

    const hashed = await bcrypt.hash(password, 12);

    // Derive username if not provided
    const finalUsername = username || (email.includes('@') ? email.split('@')[0] : `user_${Date.now()}`);

    const user = await User.create({
      email,
      username: finalUsername,
      password: hashed,
      profile: { firstName, lastName }
    });

    createSendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};


