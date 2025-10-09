/**
 * Maps technical error messages to user-friendly messages
 */

export function getUserFriendlyError(error: string): string {
  const errorLower = error.toLowerCase();

  // 3D Model generation errors
  if (errorLower.includes('fal') || errorLower.includes('replicate') || errorLower.includes('trellis')) {
    if (errorLower.includes('forbidden') || errorLower.includes('401') || errorLower.includes('403')) {
      return 'The 3D model generation service is temporarily unavailable. Please try again later or contact support.';
    }
    if (errorLower.includes('quota') || errorLower.includes('limit') || errorLower.includes('rate')) {
      return 'The 3D model generation service has reached its capacity. Please try again in a few minutes.';
    }
    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return 'The 3D model generation is taking longer than expected. Please try again.';
    }
    return 'Unable to generate 3D model at this time. Please try again later.';
  }

  // HTTP Status Code errors
  if (errorLower.includes('400') || errorLower.includes('bad request')) {
    return 'Invalid request. Please check your input and try again.';
  }
  
  if (errorLower.includes('401') || errorLower.includes('unauthorized')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  if (errorLower.includes('402') || errorLower.includes('payment required')) {
    return 'Your account has reached its usage limit. Please upgrade your plan to continue.';
  }
  
  if (errorLower.includes('403') || errorLower.includes('forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (errorLower.includes('404') || errorLower.includes('not found')) {
    return 'The requested resource was not found. Please try again.';
  }
  
  if (errorLower.includes('429') || errorLower.includes('too many requests')) {
    return 'You are making requests too quickly. Please wait a moment and try again.';
  }
  
  if (errorLower.includes('500') || errorLower.includes('internal server')) {
    return 'Our server encountered an error. Please try again in a few moments.';
  }
  
  if (errorLower.includes('502') || errorLower.includes('bad gateway')) {
    return 'The server is temporarily unavailable. Please try again shortly.';
  }
  
  if (errorLower.includes('503') || errorLower.includes('service unavailable')) {
    return 'The service is temporarily unavailable. Please try again in a few minutes.';
  }
  
  if (errorLower.includes('504') || errorLower.includes('gateway timeout')) {
    return 'The request took too long to complete. Please try again.';
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (errorLower.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }

  // Image generation errors
  if (errorLower.includes('image generation') || errorLower.includes('generate image')) {
    return 'Unable to generate images at this time. Please try again.';
  }

  // Model generation errors
  if (errorLower.includes('model generation') || errorLower.includes('generate model') || errorLower.includes('3d')) {
    return 'Unable to create 3D model at this time. Please try again later.';
  }

  // Upload errors
  if (errorLower.includes('upload')) {
    return 'Failed to upload your file. Please check the file and try again.';
  }

  // Session errors
  if (errorLower.includes('session')) {
    return 'Your session has expired. Please refresh the page and try again.';
  }

  // Generic API error
  if (errorLower.includes('api error:')) {
    const message = error.replace(/api error:\s*/i, '').trim();
    // Recursively process the inner message
    return getUserFriendlyError(message);
  }

  // Database/storage errors
  if (errorLower.includes('database') || errorLower.includes('storage')) {
    return 'There was a problem saving your data. Please try again.';
  }

  // Payment/subscription errors
  if (errorLower.includes('payment') || errorLower.includes('subscription') || errorLower.includes('stripe')) {
    if (errorLower.includes('failed')) {
      return 'Payment processing failed. Please check your payment method and try again.';
    }
    return 'There was an issue with your subscription. Please contact support.';
  }

  // Generic usage limit errors
  if (errorLower.includes('limit exceeded') || errorLower.includes('usage limit')) {
    return 'You have reached your monthly usage limit. Please upgrade your plan to continue.';
  }

  // If no specific match, return a generic friendly message
  if (error.length > 100) {
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  // If it's already a short, user-friendly message, return it as is
  return error;
}

export function getSuccessMessage(message: string): string {
  const messageLower = message.toLowerCase();

  // Check if it's already user-friendly
  if (!messageLower.includes('fal') && 
      !messageLower.includes('replicate') && 
      !messageLower.includes('trellis') &&
      !messageLower.includes('api') &&
      !messageLower.includes('s3') &&
      !messageLower.includes('aws')) {
    return message;
  }

  // Map technical success messages to user-friendly ones
  if (messageLower.includes('image') && messageLower.includes('generat')) {
    return 'Your images have been created successfully!';
  }

  if (messageLower.includes('3d') || messageLower.includes('model')) {
    return 'Your 3D model has been created successfully!';
  }

  if (messageLower.includes('upload')) {
    return 'Your file has been uploaded successfully!';
  }

  if (messageLower.includes('save')) {
    return 'Your changes have been saved successfully!';
  }

  if (messageLower.includes('delete')) {
    return 'Deleted successfully!';
  }

  if (messageLower.includes('update')) {
    return 'Updated successfully!';
  }

  return 'Success!';
}

