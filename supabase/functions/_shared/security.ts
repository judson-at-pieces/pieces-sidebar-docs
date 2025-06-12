
/**
 * Shared security utilities for edge functions
 */

// Enhanced input sanitization
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, '') // Remove vbscript protocols
    .substring(0, maxLength); // Limit length
};

// Rate limiting helper
export const isRateLimited = (
  rateLimitMap: Map<string, { count: number; resetTime: number }>, 
  identifier: string, 
  maxAttempts: number, 
  windowMs: number
): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= maxAttempts) {
    return true;
  }

  record.count++;
  return false;
};

// Enhanced CORS headers with security
export const getCorsHeaders = (): Record<string, string> => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
};

// URL validation to prevent malicious redirects
export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
      return true;
    }
    
    const parsedUrl = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    return allowedProtocols.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

// Generic error messages for production to prevent information disclosure
export const getSecureErrorMessage = (context: string): string => {
  const messages: Record<string, string> = {
    auth: 'Authentication failed. Please check your credentials.',
    access_code: 'Invalid or expired access code.',
    password: 'Invalid password. Access denied.',
    upload: 'File upload failed. Please try again.',
    network: 'Network error. Please check your connection.',
    default: 'An unexpected error occurred. Please try again.'
  };
  
  return messages[context] || messages.default;
};
