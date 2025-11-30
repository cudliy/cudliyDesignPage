import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';
import { createSendToken } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        to: email,
        userName: firstName || finalUsername,
        userEmail: email
      });
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError);
      // Don't fail signup if email fails
    }

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

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return next(new AppError('Google credential is required', 400));
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return next(new AppError('Invalid Google token', 401));
    }

    const { sub: googleId, email, name, given_name: firstName, family_name: lastName, picture } = payload;

    if (!email) {
      return next(new AppError('Email not provided by Google', 400));
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { 'googleAuth.googleId': googleId }
      ]
    });

    let isNewUser = false;

    if (user) {
      // Update Google auth info if not already set
      if (!user.googleAuth || !user.googleAuth.googleId) {
        user.googleAuth = {
          googleId,
          email,
          name,
          picture
        };
        await user.save();
      }
    } else {
      // Create new user
      isNewUser = true;
      const username = email.includes('@') ? email.split('@')[0] : `user_${Date.now()}`;
      
      user = await User.create({
        email,
        username,
        profile: { 
          firstName: firstName || name?.split(' ')[0] || '',
          lastName: lastName || name?.split(' ').slice(1).join(' ') || ''
        },
        googleAuth: {
          googleId,
          email,
          name,
          picture
        },
        // No password needed for Google auth users
        password: await bcrypt.hash(Math.random().toString(36), 12) // Random password as fallback
      });

      // Send welcome email for new Google users
      try {
        await emailService.sendWelcomeEmail({
          to: email,
          userName: firstName || name?.split(' ')[0] || username,
          userEmail: email
        });
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
        // Don't fail signup if email fails
      }
    }

    // Create and send token
    createSendToken(user, 200, res, { isNewUser });
  } catch (err) {
    console.error('Google Auth Error:', err);
    if (err.message.includes('Token used too early') || err.message.includes('Token used too late')) {
      return next(new AppError('Google authentication token expired. Please try again.', 401));
    }
    if (err.message.includes('Invalid token signature')) {
      return next(new AppError('Invalid Google authentication. Please try again.', 401));
    }
    next(new AppError('Google authentication failed. Please try again.', 500));
  }
};

export const appleAuth = async (req, res, next) => {
  try {
    const { idToken, code, user: appleUser } = req.body;

    if (!idToken) {
      return next(new AppError('Apple ID token is required', 400));
    }

    // For Apple Sign-In, we need to verify the ID token
    // Apple provides the user info only on first sign-in
    // We'll decode the JWT to get the email
    const tokenParts = idToken.split('.');
    if (tokenParts.length !== 3) {
      return next(new AppError('Invalid Apple ID token', 401));
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    const { sub: appleId, email } = payload;

    if (!email) {
      return next(new AppError('Email not provided by Apple', 400));
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { 'appleAuth.appleId': appleId }
      ]
    });

    let isNewUser = false;

    if (user) {
      // Update Apple auth info if not already set
      if (!user.appleAuth || !user.appleAuth.appleId) {
        user.appleAuth = {
          appleId,
          email
        };
        await user.save();
      }
    } else {
      // Create new user
      isNewUser = true;
      const username = email.includes('@') ? email.split('@')[0] : `user_${Date.now()}`;
      
      user = await User.create({
        email,
        username,
        profile: { 
          firstName: appleUser?.firstName || '',
          lastName: appleUser?.lastName || ''
        },
        appleAuth: {
          appleId,
          email
        },
        // No password needed for Apple auth users
        password: await bcrypt.hash(Math.random().toString(36), 12) // Random password as fallback
      });

      // Send welcome email for new Apple users
      try {
        await emailService.sendWelcomeEmail({
          to: email,
          userName: appleUser?.firstName || username,
          userEmail: email
        });
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
        // Don't fail signup if email fails
      }
    }

    // Create and send token
    createSendToken(user, 200, res, { isNewUser });
  } catch (err) {
    console.error('Apple Auth Error:', err);
    next(new AppError('Apple authentication failed. Please try again.', 500));
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetTokenExpiry;
    await user.save();

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail({
        to: email,
        userName: user.profile?.firstName || user.username,
        resetLink
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return next(new AppError('Failed to send password reset email. Please try again.', 500));
    }

    res.json({ 
      success: true, 
      message: 'If an account with that email exists, we have sent a password reset link.' 
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return next(new AppError('Token and new password are required', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });
  } catch (err) {
    next(err);
  }
};


