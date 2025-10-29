import rateLimit from 'express-rate-limit';

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
export const generalLimiter = createRateLimiter(
  1*60 , // 15 minutes
  1000, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

export const imageLimiter = createRateLimiter(
  1*60,
  20, // limit each IP to 20 image generations per hour
  'Too many image generation requests, please try again later.'
);

export const modelLimiter = createRateLimiter(
  1*60,
  10, // limit each IP to 10 3D model generations per hour
  'Too many 3D model generation requests, please try again later.'
);

export const uploadLimiter = createRateLimiter(
  1*60,
  50, // limit each IP to 50 uploads per 15 minutes
  'Too many upload requests, please try again later.'
);

export const paymentLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 50 : 200, // More permissive in development
  'Too many payment requests, please try again later.'
);