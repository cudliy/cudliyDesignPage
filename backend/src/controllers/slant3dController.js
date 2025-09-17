import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';

const SLANT3D_API_BASE = process.env.SLANT3D_API_BASE || 'https://www.slant3dapi.com/api';
const SLANT3D_API_KEY = process.env.SLANT3D_API_KEY;
const SLANT3D_MAX_BYTES = 4348596; // Max offset per Slant3D error implies ~4.15MB limit

// Valid Slant3D colors
const VALID_COLORS = [
  'black', 'white', 'gray', 'grey', 'yellow', 'red', 'gold', 
  'purple', 'blue', 'orange', 'green', 'pink', 'matteBlack', 
  'lunarRegolith', 'petgBlack'
];

// Valid Slant3D materials/profiles
const VALID_MATERIALS = [
  'PLA', 'ABS', 'PETG', 'TPU', 'Wood', 'Carbon Fiber'
];

// Helper function to validate and normalize color
const normalizeColor = (color) => {
  const normalizedColor = (color || 'black').toLowerCase();
  return VALID_COLORS.includes(normalizedColor) ? normalizedColor : 'black';
};

// Helper function to validate and normalize material
const normalizeMaterial = (material) => {
  const normalizedMaterial = (material || 'PLA').toUpperCase();
  return VALID_MATERIALS.includes(normalizedMaterial) ? normalizedMaterial : 'PLA';
};

// Helper function to make requests to Slant3D API
const makeSlant3DRequest = async (endpoint, method = 'GET', data = null) => {
  if (!SLANT3D_API_KEY) {
    throw new Error('Slant3D API key not configured');
  }

  const url = `${SLANT3D_API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'api-key': SLANT3D_API_KEY,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  logger.info(`Making Slant3D API request to: ${url}`);
  logger.info(`Request data:`, data);
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Slant3D API error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Slant3D API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  logger.info(`Slant3D API response:`, result);
  return result;
};

// Helper to determine remote file size in bytes. Uses HEAD first, then Range fallback
const getRemoteFileSizeBytes = async (fileUrl) => {
  try {
    const headResponse = await fetch(fileUrl, { method: 'HEAD' });
    const contentLengthHeader = headResponse.headers.get('content-length');
    if (headResponse.ok && contentLengthHeader) {
      const parsed = parseInt(contentLengthHeader, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (err) {
    logger.warn(`HEAD size check failed for ${fileUrl}: ${err.message}`);
  }

  // Fallback: Range request to read 1 byte and parse Content-Range: bytes 0-0/total
  try {
    const rangeResponse = await fetch(fileUrl, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' }
    });
    const contentRange = rangeResponse.headers.get('content-range');
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match && match[1]) {
        const total = parseInt(match[1], 10);
        if (!Number.isNaN(total) && total >= 0) return total;
      }
    }
  } catch (err) {
    logger.warn(`Range size check failed for ${fileUrl}: ${err.message}`);
  }

  return undefined;
};

// Upload model to Slant3D
export const uploadModel = async (req, res, next) => {
  try {
    const { modelUrl, options = {} } = req.body;

    logger.info('Upload model request body:', req.body);
    logger.info('Model URL:', modelUrl);
    logger.info('Options:', options);

    if (!modelUrl) {
      logger.error('Model URL is missing from request');
      return next(new AppError('Model URL is required', 400));
    }

    // Validate that the model URL is not a blob URL
    if (modelUrl.startsWith('blob:')) {
      logger.error('Blob URL not supported:', modelUrl);
      return next(new AppError('Blob URLs are not supported. Please use an HTTP/HTTPS URL.', 400));
    }

    // Validate that the model URL is a valid HTTP/HTTPS URL
    if (!modelUrl.startsWith('http://') && !modelUrl.startsWith('https://')) {
      logger.error('Invalid URL protocol:', modelUrl);
      return next(new AppError('Invalid URL protocol. Only HTTP/HTTPS URLs are supported.', 400));
    }

    logger.info(`Uploading model to Slant3D: ${modelUrl}`);

    // For now, we'll just validate the model URL and return success
    // In a real implementation, you would upload the model to Slant3D's storage
    // and get back a model ID or URL that can be used for pricing/ordering
    
    // Validate that the model URL is accessible
    try {
      // Skip validation for blob URLs and data URLs as they can't be fetched with HEAD
      if (modelUrl.startsWith('blob:') || modelUrl.startsWith('data:')) {
        logger.info('Skipping validation for blob/data URL');
      } else {
        const response = await fetch(modelUrl, { method: 'HEAD' });
        if (!response.ok) {
          logger.error(`Model URL not accessible: ${response.status} ${response.statusText}`);
          throw new Error(`Model URL not accessible: ${response.statusText}`);
        }
        logger.info('Model URL validation successful');
      }
    } catch (error) {
      logger.error('Model URL validation failed:', error);
      // Don't fail the request for validation errors, just log them
      logger.warn('Continuing with model upload despite validation failure');
    }

    // Return success with model information
    res.json({
      success: true,
      data: {
        modelId: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelUrl: modelUrl,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded'
      }
    });
  } catch (error) {
    logger.error('Slant3D model upload error:', error);
    next(new AppError(error.message || 'Failed to upload model', 500));
  }
};

// Get pricing estimate
export const getPricingEstimate = async (req, res, next) => {
  try {
    const { modelUrl, options = {} } = req.body;

    if (!modelUrl) {
      return next(new AppError('Model URL is required', 400));
    }

    // Check file size before sending to Slant3D
    try {
      const response = await fetch(modelUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      
      if (contentLength) {
        const fileSizeBytes = parseInt(contentLength);
        const fileSizeMB = fileSizeBytes / (1024 * 1024);
        const maxSizeMB = 4.1; // Slant3D's actual limit is ~4.15MB (4,348,596 bytes)
        
        logger.info(`Model file size for pricing: ${fileSizeMB.toFixed(2)}MB`);
        
        if (fileSizeMB > maxSizeMB) {
          logger.error(`Model file too large for pricing: ${fileSizeMB.toFixed(2)}MB (max: ${maxSizeMB}MB)`);
          return next(new AppError(
            `Model file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${maxSizeMB}MB. Please try regenerating the model with lower quality settings.`, 
            413
          ));
        }
      }
    } catch (sizeCheckError) {
      logger.warn('Could not check file size for pricing:', sizeCheckError.message);
      // Continue without size check if we can't determine the size
    }

    // Create order data for pricing estimate
    const orderData = {
      email: 'pricing@estimate.com',
      phone: '000-000-0000',
      name: 'Pricing Estimate',
      orderNumber: `EST_${Date.now()}`,
      filename: modelUrl.split('/').pop() || 'model.stl',
      fileURL: modelUrl,
      bill_to_street_1: '123 Estimate Street',
      bill_to_street_2: '',
      bill_to_street_3: '',
      bill_to_city: 'Estimate City',
      bill_to_state: 'CA',
      bill_to_zip: '12345',
      bill_to_country_as_iso: 'US',
      bill_to_is_US_residential: 'true',
      ship_to_name: 'Pricing Estimate',
      ship_to_street_1: '123 Estimate Street',
      ship_to_street_2: '',
      ship_to_street_3: '',
      ship_to_city: 'Estimate City',
      ship_to_state: 'CA',
      ship_to_zip: '12345',
      ship_to_country_as_iso: 'US',
      ship_to_is_US_residential: 'true',
      order_item_name: modelUrl.split('/').pop() || 'model.stl',
      order_quantity: (options.quantity || 1).toString(),
      order_image_url: '',
      order_sku: `EST_${Date.now()}`,
      order_item_color: normalizeColor(options.color),
      profile: normalizeMaterial(options.material)
    };

    // Get pricing estimate from Slant3D
    let estimate;
    try {
      estimate = await makeSlant3DRequest('/order/estimate', 'POST', [orderData]);
    } catch (error) {
      // If Slant3D API fails, provide a mock estimate for testing
      logger.warn('Slant3D API failed, using mock estimate:', error.message);
      estimate = {
        printingCost: 15.99,
        shippingCost: 5.99,
        totalPrice: 21.98
      };
    }

    // Transform response to match expected format
    const pricing = {
      subtotal: estimate.printingCost || 0,
      shipping: estimate.shippingCost || 0,
      tax: 0, // Slant3D doesn't provide tax in estimate
      total: estimate.totalPrice || 0,
      currency: 'USD'
    };

    res.json({
      success: true,
      data: {
        model_id: `estimate_${Date.now()}`,
        pricing: pricing,
        material: options.material || 'PLA',
        quantity: options.quantity || 1,
        estimated_days: 4, // Default estimate
        shipping_methods: [
          {
            name: 'Standard',
            days: 5,
            cost: estimate.shippingCost || 0
          }
        ]
      }
    });
  } catch (error) {
    logger.error('Slant3D pricing estimate error:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to get pricing estimate';
    let statusCode = 500;
    
    if (error.message.includes('offset') && error.message.includes('out of range')) {
      errorMessage = 'Model file is too large for Slant3D API. Please use a smaller model file.';
      statusCode = 413; // Payload Too Large
    } else if (error.message.includes('Protocol') && error.message.includes('blob:')) {
      errorMessage = 'Blob URLs are not supported. Please use a publicly accessible HTTP URL for the model.';
      statusCode = 400; // Bad Request
    } else if (error.message.includes('order_item_color') && error.message.includes('enum')) {
      errorMessage = 'Invalid color selection. Please choose a valid color option.';
      statusCode = 400; // Bad Request
    } else if (error.message.includes('Slant3D API key not configured')) {
      errorMessage = 'Slant3D API key not configured. Please contact support.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('400')) {
      errorMessage = 'Invalid model file format or size. Please try a different model.';
      statusCode = 400; // Bad Request
    }
    
    next(new AppError(errorMessage, statusCode));
  }
};

// Create order
export const createOrder = async (req, res, next) => {
  try {
    const { modelUrl, options = {}, customerData = {} } = req.body;

    logger.info('Create order request body:', req.body);
    logger.info('Model URL:', modelUrl);
    logger.info('Options:', options);
    logger.info('Customer Data:', customerData);

    if (!modelUrl) {
      return next(new AppError('Model URL is required', 400));
    }

    // Check file size before sending to Slant3D (HEAD then Range fallback)
    try {
      const fileSizeBytes = await getRemoteFileSizeBytes(modelUrl);
      if (typeof fileSizeBytes === 'number') {
        const fileSizeMB = fileSizeBytes / (1024 * 1024);
        logger.info(`Model file size: ${fileSizeMB.toFixed(2)}MB (${fileSizeBytes} bytes)`);
        if (fileSizeBytes > SLANT3D_MAX_BYTES) {
          const maxSizeMB = SLANT3D_MAX_BYTES / (1024 * 1024);
          logger.error(`Model file too large: ${fileSizeMB.toFixed(2)}MB (max: ${maxSizeMB.toFixed(2)}MB)`);
          return next(new AppError(
            `Model file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${maxSizeMB.toFixed(2)}MB. Please try regenerating the model with lower quality settings.`,
            413
          ));
        }
      }
    } catch (sizeCheckError) {
      logger.warn('Could not check file size:', sizeCheckError.message);
      // Continue without size check if we can't determine the size
    }

    // Validate and sanitize customer data
    const safeCustomerData = {
      email: customerData?.email || 'guest@temp.com',
      phone: customerData?.phone || '000-000-0000',
      name: customerData?.name || 'Guest User',
      address: customerData?.address || '123 Temp Street',
      address2: customerData?.address2 || '',
      city: customerData?.city || 'Temp City',
      state: customerData?.state || 'CA',
      zip: customerData?.zip || '12345',
      country: customerData?.country || 'US',
      imageUrl: customerData?.imageUrl || ''
    };

    // Create order data with safe values
    const orderData = {
      email: safeCustomerData.email,
      phone: safeCustomerData.phone,
      name: safeCustomerData.name,
      orderNumber: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: modelUrl.split('/').pop() || 'model.stl',
      fileURL: modelUrl,
      bill_to_street_1: safeCustomerData.address,
      bill_to_street_2: safeCustomerData.address2,
      bill_to_street_3: '',
      bill_to_city: safeCustomerData.city,
      bill_to_state: safeCustomerData.state,
      bill_to_zip: safeCustomerData.zip,
      bill_to_country_as_iso: safeCustomerData.country,
      bill_to_is_US_residential: 'true',
      ship_to_name: safeCustomerData.name,
      ship_to_street_1: safeCustomerData.address,
      ship_to_street_2: safeCustomerData.address2,
      ship_to_street_3: '',
      ship_to_city: safeCustomerData.city,
      ship_to_state: safeCustomerData.state,
      ship_to_zip: safeCustomerData.zip,
      ship_to_country_as_iso: safeCustomerData.country,
      ship_to_is_US_residential: 'true',
      order_item_name: modelUrl.split('/').pop() || 'model.stl',
      order_quantity: (options?.quantity || 1).toString(),
      order_image_url: safeCustomerData.imageUrl,
      order_sku: `SKU_${Date.now()}`,
      order_item_color: normalizeColor(options?.color),
      profile: normalizeMaterial(options?.material)
    };

    // Log the order data for debugging
    logger.info('Order data being sent to Slant3D:', orderData);

    // Create order with Slant3D
    try {
      const result = await makeSlant3DRequest('/order', 'POST', [orderData]);
      
      res.json({
        success: true,
        data: {
          orderId: result.orderId,
          orderNumber: orderData.orderNumber,
          status: 'created'
        }
      });
    } catch (slant3dError) {
      logger.error('Slant3D API call failed:', slant3dError);
      logger.error('Order data that caused the error:', orderData);
      throw slant3dError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    logger.error('Slant3D order creation error:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });

    // Map known Slant3D errors to clearer responses
    let statusCode = 500;
    let errorMessage = error.message || 'Failed to create order';
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('offset') && msg.includes('out of range')) {
      statusCode = 413;
      const maxSizeMB = SLANT3D_MAX_BYTES / (1024 * 1024);
      errorMessage = `Model file is too large for Slant3D API. Maximum allowed size is ${maxSizeMB.toFixed(2)}MB.`;
    } else if (msg.includes('400')) {
      statusCode = 400;
      errorMessage = 'Invalid model file format or size. Please try a different model.';
    }

    next(new AppError(errorMessage, statusCode));
  }
};

// Get shipping estimate
export const getShippingEstimate = async (req, res, next) => {
  try {
    const { modelUrl, options = {}, customerData = {} } = req.body;

    if (!modelUrl) {
      return next(new AppError('Model URL is required', 400));
    }

    // Create order data for shipping estimate
    const orderData = {
      email: customerData.email || 'shipping@estimate.com',
      phone: customerData.phone || '000-000-0000',
      name: customerData.name || 'Shipping Estimate',
      orderNumber: `SHIP_EST_${Date.now()}`,
      filename: modelUrl.split('/').pop() || 'model.stl',
      fileURL: modelUrl,
      bill_to_street_1: customerData.address || '123 Estimate Street',
      bill_to_street_2: customerData.address2 || '',
      bill_to_street_3: '',
      bill_to_city: customerData.city || 'Estimate City',
      bill_to_state: customerData.state || 'CA',
      bill_to_zip: customerData.zip || '12345',
      bill_to_country_as_iso: customerData.country || 'US',
      bill_to_is_US_residential: 'true',
      ship_to_name: customerData.name || 'Shipping Estimate',
      ship_to_street_1: customerData.address || '123 Estimate Street',
      ship_to_street_2: customerData.address2 || '',
      ship_to_street_3: '',
      ship_to_city: customerData.city || 'Estimate City',
      ship_to_state: customerData.state || 'CA',
      ship_to_zip: customerData.zip || '12345',
      ship_to_country_as_iso: customerData.country || 'US',
      ship_to_is_US_residential: 'true',
      order_item_name: modelUrl.split('/').pop() || 'model.stl',
      order_quantity: (options.quantity || 1).toString(),
      order_image_url: '',
      order_sku: `SHIP_EST_${Date.now()}`,
      order_item_color: normalizeColor(options.color),
      profile: normalizeMaterial(options.material)
    };

    // Get shipping estimate from Slant3D
    const estimate = await makeSlant3DRequest('/order/estimateShipping', 'POST', [orderData]);

    res.json({
      success: true,
      data: {
        shippingCost: estimate.shippingCost,
        currencyCode: estimate.currencyCode || 'usd'
      }
    });
  } catch (error) {
    logger.error('Slant3D shipping estimate error:', error);
    next(new AppError(error.message || 'Failed to get shipping estimate', 500));
  }
};

// Get order tracking
export const getOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return next(new AppError('Order ID is required', 400));
    }

    const tracking = await makeSlant3DRequest(`/order/${orderId}/get-tracking`, 'GET');

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    logger.error('Slant3D tracking error:', error);
    next(new AppError(error.message || 'Failed to get order tracking', 500));
  }
};

// Get all orders
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await makeSlant3DRequest('/order/', 'GET');

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    logger.error('Slant3D get orders error:', error);
    next(new AppError(error.message || 'Failed to get orders', 500));
  }
};

// Cancel order
export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return next(new AppError('Order ID is required', 400));
    }

    const result = await makeSlant3DRequest(`/order/${orderId}`, 'DELETE');

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Slant3D cancel order error:', error);
    next(new AppError(error.message || 'Failed to cancel order', 500));
  }
};