
/**
 * Enhanced shared security utilities for edge functions
 */

// Input sanitization with comprehensive filtering
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, '') // Remove vbscript protocols
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .substring(0, maxLength); // Limit length
};

// Enhanced rate limiting with memory management
export class RateLimiter {
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

// Enhanced CORS headers with additional security
export const getCorsHeaders = (): Record<string, string> => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
};

// URL validation with enhanced security checks
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
    
    if (privateRanges.some(range => hostname.includes(range))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Enhanced error message handling
export const getSecureErrorMessage = (context: string, isDevelopment: boolean = false): string => {
  if (isDevelopment) {
    // In development, provide more detailed errors
    const devMessages: Record<string, string> = {
      auth: 'Authentication failed. Check credentials and try again.',
      access_code: 'Invalid or expired access code. Please request a new one.',
      password: 'Password verification failed. Check the password and try again.',
      upload: 'File upload failed. Check file size and format.',
      network: 'Network request failed. Check connection and endpoint.',
      validation: 'Input validation failed. Check required fields.',
      default: 'Operation failed. Check logs for details.'
    };
    
    return devMessages[context] || devMessages.default;
  }
  
  // Production messages are generic to prevent information disclosure
  const prodMessages: Record<string, string> = {
    auth: 'Authentication failed. Please check your credentials.',
    access_code: 'Invalid or expired access code.',
    password: 'Invalid password. Access denied.',
    upload: 'File upload failed. Please try again.',
    network: 'Network error. Please check your connection.',
    validation: 'Please check your input and try again.',
    default: 'An unexpected error occurred. Please try again.'
  };
  
  return prodMessages[context] || prodMessages.default;
};

// Client information extraction
export const getClientInfo = (req: Request): { ip: string; userAgent: string; identifier: string } => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent')?.substring(0, 100) || 'unknown';
  
  const ip = forwardedFor?.split(',')[0].trim() || realIP || 'unknown';
  const identifier = `${ip}:${userAgent.substring(0, 20)}`;
  
  return { ip, userAgent, identifier };
};

// Request validation
export const validateRequest = (req: Request, allowedMethods: string[] = ['POST']): { valid: boolean; error?: string } => {
  if (!allowedMethods.includes(req.method)) {
    return { valid: false, error: 'Method not allowed' };
  }
  
  const contentType = req.headers.get('content-type');
  if (req.method === 'POST' && contentType && !contentType.includes('application/json')) {
    return { valid: false, error: 'Invalid content type' };
  }
  
  return { valid: true };
};

// JSON parsing with error handling
export const safeJsonParse = async (req: Request): Promise<{ data?: any; error?: string }> => {
  try {
    const body = await req.json();
    return { data: body };
  } catch (error) {
    return { error: 'Invalid JSON format' };
  }
};
