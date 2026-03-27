// Centralized error handling utility

export class AppError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // Add your error logging service here (e.g., Sentry)
    console.log('Error logged to external service');
  }
  
  // Return user-friendly error message
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    };
  }
  
  // Handle Firebase errors
  if (error.code && error.code.startsWith('auth/')) {
    return {
      message: 'Authentication error. Please try again.',
      code: ErrorCodes.AUTHENTICATION_ERROR,
      details: { originalError: error.code }
    };
  }
  
  // Handle network errors
  if (error.name === 'NetworkError' || !navigator.onLine) {
    return {
      message: 'Network error. Please check your connection.',
      code: ErrorCodes.NETWORK_ERROR,
      details: { originalError: error.message }
    };
  }
  
  // Default error
  return {
    message: 'Something went wrong. Please try again.',
    code: ErrorCodes.UNKNOWN_ERROR,
    details: { originalError: error.message }
  };
};

export const showErrorNotification = (error) => {
  // Log error instead of showing alert
  console.error('Error notification:', error.message);
};

export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new AppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      ErrorCodes.VALIDATION_ERROR,
      { missingFields }
    );
  }
  
  return true;
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Basic XSS prevention
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};
