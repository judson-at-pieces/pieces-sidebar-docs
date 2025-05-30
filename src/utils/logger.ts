
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Don't log debug messages in production
    }

    const entry: LogEntry = {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString()
    };

    // In development, use console for immediate feedback
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : 
                          level === 'warn' ? console.warn : 
                          console.log;
      consoleMethod(`[${level.toUpperCase()}]`, message, data || '');
    } else {
      // In production, you could send to a logging service
      // For now, only log errors to console in production
      if (level === 'error') {
        console.error(`[${entry.timestamp}] ${message}`, this.sanitizeData(data));
      }
    }
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
