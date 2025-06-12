
import { logger } from './logger';

// Enhanced rate limiting for sensitive operations
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number; firstAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  private maxEntries: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000, maxEntries: number = 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.maxEntries = maxEntries;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    // Clean up old entries periodically
    if (this.attempts.size > this.maxEntries) {
      this.cleanup();
    }

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs, firstAttempt: now });
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

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    for (const [key, value] of this.attempts.entries()) {
      if (value.resetTime < cutoff) {
        this.attempts.delete(key);
      }
    }
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
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .substring(0, maxLength); // Limit length
};

// URL validation to prevent malicious redirects
export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
      // Check for potential path traversal
      return !url.includes('../') && !url.includes('..\\');
    }
    
    const parsedUrl = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    // Check for valid protocol
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Prevent localhost and private IP access in production
    const hostname = parsedUrl.hostname.toLowerCase();
    const privateRanges = ['localhost', '127.', '10.', '172.', '192.168.', '169.254.'];
    
    if (import.meta.env.PROD && privateRanges.some(range => hostname.includes(range))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Content Security Policy helper
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
  
  // Generic messages for production to prevent information disclosure
  const genericMessages: Record<string, string> = {
    auth: 'Authentication failed. Please check your credentials.',
    access_code: 'Invalid or expired access code.',
    password: 'Invalid password. Access denied.',
    github: 'GitHub integration error. Please try again.',
    upload: 'File upload failed. Please try again.',
    network: 'Network error. Please check your connection.',
    validation: 'Please check your input and try again.',
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
