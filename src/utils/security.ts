
import { logger } from './logger';

// Rate limiting for sensitive operations
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

export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const accessCodeRateLimiter = new RateLimiter(3, 10 * 60 * 1000); // 3 attempts per 10 minutes

// Security audit logging
export const auditLog = {
  authAttempt: (email: string, success: boolean, method: string) => {
    logger.info('Authentication attempt', {
      email: email ? email.substring(0, 3) + '***' : 'unknown',
      success,
      method,
      ip: 'client-side', // In a real app, this would come from the server
      timestamp: new Date().toISOString()
    });
  },

  accessCodeUsed: (success: boolean, userId?: string) => {
    logger.info('Access code usage', {
      success,
      userId: userId ? userId.substring(0, 8) + '***' : 'anonymous',
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
  }
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
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
    github: 'GitHub integration error. Please try again.',
    default: 'An unexpected error occurred. Please try again.'
  };
  
  return genericMessages[context] || genericMessages.default;
};
