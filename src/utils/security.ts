
import { logger } from './logger';

// Enhanced rate limiting for sensitive operations
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (record.count >= this.maxAttempts) {
      logger.warn('Rate limit exceeded', { identifier, attempts: record.count });
      return true;
    }

    record.count++;
    return false;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Enhanced rate limiters with stricter controls
export const authRateLimiter = new RateLimiter(3, 15 * 60 * 1000); // 3 attempts per 15 minutes
export const accessCodeRateLimiter = new RateLimiter(2, 10 * 60 * 1000); // 2 attempts per 10 minutes
export const passwordRateLimiter = new RateLimiter(3, 5 * 60 * 1000); // 3 attempts per 5 minutes
export const apiRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute

// Enhanced security audit logging
export const auditLog = {
  authAttempt: (email: string, success: boolean, method: string, ip?: string) => {
    logger.info('Authentication attempt', {
      email: email ? email.substring(0, 3) + '***' : 'unknown',
      success,
      method,
      ip: ip || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'unknown'
    });
  },

  accessCodeUsed: (success: boolean, userId?: string, ip?: string) => {
    logger.info('Access code usage', {
      success,
      userId: userId ? userId.substring(0, 8) + '***' : 'anonymous',
      ip: ip || 'unknown',
      timestamp: new Date().toISOString()
    });
  },

  passwordAttempt: (success: boolean, ip?: string) => {
    logger.info('Password verification attempt', {
      success,
      ip: ip || 'unknown',
      timestamp: new Date().toISOString()
    });
  },

  roleChanged: (userId: string, newRole: string, changedBy: string) => {
    logger.info('User role changed', {
      userId: userId.substring(0, 8) + '***',
      newRole,
      changedBy: changedBy.substring(0, 8) + '***',
      timestamp: new Date().toISOString()
    });
  },

  configChanged: (type: string, changedBy: string) => {
    logger.info('Configuration changed', {
      type,
      changedBy: changedBy.substring(0, 8) + '***',
      timestamp: new Date().toISOString()
    });
  },

  suspiciousActivity: (activity: string, details: any) => {
    logger.warn('Suspicious activity detected', {
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Enhanced input sanitization
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .substring(0, maxLength); // Limit length
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

// Content Security Policy helper
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-eval needed for some development tools
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};

// Generic error messages for production
export const getErrorMessage = (error: any, context: string): string => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    return error?.message || `An error occurred in ${context}`;
  }
  
  // Generic messages for production to avoid information disclosure
  const genericMessages: Record<string, string> = {
    auth: 'Authentication failed. Please check your credentials.',
    access_code: 'Invalid or expired access code.',
    password: 'Invalid password. Access denied.',
    github: 'GitHub integration error. Please try again.',
    upload: 'File upload failed. Please try again.',
    network: 'Network error. Please check your connection.',
    default: 'An unexpected error occurred. Please try again.'
  };
  
  return genericMessages[context] || genericMessages.default;
};

// IP address extraction (for client-side logging)
export const getClientIP = async (): Promise<string> => {
  try {
    // This would typically be done server-side, but for client logging we use a placeholder
    return 'client-unknown';
  } catch {
    return 'unknown';
  }
};
