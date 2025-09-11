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
import checkoutRoutes from './routes/checkoutRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

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
      imgSrc: ["'self'", "data:", "https:", "storage.googleapis.com", "*.replicate.com", "*.amazonaws.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https:", "wss:", "*.replicate.com", "*.amazonaws.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration - Dynamic origins based on environment
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) :
    [
      'https://cudliy-design-page.vercel.app',
      'https://www.cudliy-design-page.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173'
    ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};
app.use(cors(corsOptions));

// Compression and logging
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use('/api/', generalLimiter);

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

// API Routes
app.use('/api/designs', designRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/webhooks', webhookRoutes);

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
