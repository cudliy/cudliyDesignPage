import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Import utilities and services
import logger from './utils/logger.js';
import { globalErrorHandler } from './utils/errorHandler.js';
import { generalLimiter } from './utils/rateLimiter.js';
import connectDB from './config/database.js';
import { cleanupOldSessions } from './controllers/sessionController.js';

// Import routes
import designRoutes from './routes/designRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import slant3dRoutes from './routes/slant3dRoutes.js';

// Environment variables are loaded in index.js

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "storage.googleapis.com", "*.replicate.com", "*.amazonaws.com", "*.fal.media", "*.fal.run", "*.fal.ai"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https:", "wss:", "*.replicate.com", "*.amazonaws.com", "*.fal.media", "*.fal.run", "*.fal.ai"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration - Dynamic origins based on environment
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(o => o.trim()) :
      [
        'https://cudliy-design-page.vercel.app',
        'https://www.cudliy-design-page.vercel.app',
        'https://cudliy-design-page-git-main.vercel.app',
        'https://cudliy-design-page-git-main-cudliy.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:4173'
      ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel preview deployments
    if (origin && origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
};
app.use(cors(corsOptions));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} from origin: ${req.headers.origin}`);
  if (req.method === 'OPTIONS') {
    console.log('CORS Preflight request from:', req.headers.origin);
    console.log('Request headers:', req.headers);
  }
  next();
});

// Compression and logging
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// CRITICAL: Stripe webhooks MUST be registered BEFORE body parsing middleware
// Webhooks need raw body to verify signature
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware (applied AFTER webhook routes)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use('/api/', generalLimiter);

// Global CORS preflight handler - MUST be before routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('CORS Preflight OPTIONS request from origin:', origin);
  console.log('Requested URL:', req.originalUrl);
  
  const allowedOrigins = process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',').map(o => o.trim()) :
    [
      'https://cudliy-design-page.vercel.app',
      'https://www.cudliy-design-page.vercel.app',
      'https://cudliy-design-page-git-main.vercel.app',
      'https://cudliy-design-page-git-main-cudliy.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:4173'
    ];
  
  console.log('Allowed origins:', allowedOrigins);
  
  // Allow all Vercel preview deployments
  const isAllowed = allowedOrigins.includes(origin) || !origin || (origin && origin.includes('vercel.app'));
  
  console.log('Is origin allowed?', isAllowed);
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    console.log('CORS headers set for origin:', origin);
    res.status(200).end();
  } else {
    console.log('CORS blocked origin:', origin);
    res.status(403).json({ error: 'CORS policy violation' });
  }
});

// Set default values for missing environment variables
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'https://cudliy-design-page.vercel.app';
  logger.warn('FRONTEND_URL not set, using default: https://cudliy-design-page.vercel.app');
}

// Validate critical environment variables
const criticalEnvVars = ['MONGODB_URI', 'STRIPE_SECRET_KEY'];
const missingCriticalVars = criticalEnvVars.filter(envVar => !process.env[envVar]);

if (missingCriticalVars.length > 0) {
  logger.error(`Missing critical environment variables: ${missingCriticalVars.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    logger.error('Exiting due to missing critical environment variables in production');
    process.exit(1);
  } else {
    logger.warn('Continuing in development mode with missing critical environment variables');
  }
}

// Connect to database
connectDB();

// Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const stripeStatus = process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured';
  
  res.json({
    success: true,
    status: 'healthy',
    message: 'Backend is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    services: {
      database: dbStatus,
      stripe: stripeStatus
    }
  });
});

// Debug endpoint for checkout testing
app.post('/api/debug/checkout', (req, res) => {
  try {
    const { userId, designId, quantity } = req.body;
    
    res.json({
      success: true,
      message: 'Debug checkout endpoint working',
      data: {
        userId,
        designId,
        quantity,
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        frontendUrl: process.env.FRONTEND_URL,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Debug checkout failed'
    });
  }
});

// 3D Model serving endpoint with proper headers
app.get('/api/models/*', (req, res) => {
  // Set headers for 3D model files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  res.setHeader('Content-Type', 'application/octet-stream');
  
  // For now, redirect to the actual model URL
  // In production, you might want to proxy the file or serve it directly
  res.status(404).json({
    success: false,
    error: 'Model serving endpoint not implemented yet'
  });
});

// Specific CORS handler for designs route
app.use('/api/designs', (req, res, next) => {
  const origin = req.headers.origin;
  console.log(`Designs route ${req.method} ${req.originalUrl} from origin: ${origin}`);
  
  const allowedOrigins = process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',').map(o => o.trim()) :
    [
      'https://cudliy-design-page.vercel.app',
      'https://www.cudliy-design-page.vercel.app',
      'https://cudliy-design-page-git-main.vercel.app',
      'https://cudliy-design-page-git-main-cudliy.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173'
    ];
  
  // Set CORS headers for all requests to designs route
  const isAllowed = allowedOrigins.includes(origin) || !origin || (origin && origin.includes('vercel.app'));
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('CORS headers set for designs route, origin:', origin);
  } else {
    console.log('CORS blocked for designs route, origin:', origin);
  }
  next();
});

// Specific OPTIONS handler for designs route
app.options('/api/designs/*', (req, res) => {
  const origin = req.headers.origin;
  console.log('Designs OPTIONS request from origin:', origin);
  
  const allowedOrigins = process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',').map(o => o.trim()) :
    [
      'https://cudliy-design-page.vercel.app',
      'https://www.cudliy-design-page.vercel.app',
      'https://cudliy-design-page-git-main.vercel.app',
      'https://cudliy-design-page-git-main-cudliy.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173'
    ];
  
  const isAllowed = allowedOrigins.includes(origin) || !origin || (origin && origin.includes('vercel.app'));
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    console.log('Designs OPTIONS CORS headers set for origin:', origin);
    res.status(200).end();
  } else {
    console.log('Designs OPTIONS CORS blocked origin:', origin);
    res.status(403).json({ error: 'CORS policy violation' });
  }
});

// API Routes (webhooks already registered above before body parsing)
app.use('/api/designs', designRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/slant3d', slant3dRoutes);

// Error handling middleware
app.use(globalErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.originalUrl} not found`
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, starting graceful shutdown...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Cudliy Backend Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Log available endpoints
  const routes = [
    'POST /api/designs/generate-images - Generate AI images from design specifications',
    'POST /api/designs/generate-3d-model - Convert selected image to 3D model',
    'POST /api/upload/image - Upload custom image for 3D conversion',
    'GET  /api/designs/:designId - Get design details',
    'GET  /api/designs/user/:userId/designs - Get user\'s designs with pagination',
    'GET  /api/session/:sessionId - Get session status',
    'DELETE /api/designs/:designId - Delete design',
    'PATCH /api/designs/:designId - Update design metadata'
  ];
  
  logger.info('🛠️  Available API endpoints:');
  routes.forEach(route => logger.info(`   ${route}`));
});

export default app;
