/**
 * Secure Logger Utility
 *
 * Provides secure logging that automatically sanitizes sensitive data like
 * tokens, passwords, and credentials before logging.
 *
 * @module core/utils/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  sanitize: boolean;
}

// Sensitive field names to remove from logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'bearertoken',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'secret',
  'key',
  'authorization',
  'identifier', // Merkos API auth header
  'email', // User emails should be sanitized
  'code', // OAuth codes
  'tokenpreview', // Partial tokens
];

/**
 * Recursively sanitize log data by redacting sensitive fields
 */
function sanitizeLogData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Remove sensitive fields
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV !== 'production',
      level: 'info',
      sanitize: true,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.config.level);
    const requestedIndex = levels.indexOf(level);
    return this.config.enabled && requestedIndex >= currentIndex;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const sanitizedData = this.config.sanitize && data
      ? sanitizeLogData(data)
      : data;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, sanitizedData !== undefined ? sanitizedData : '');
        break;
      case 'info':
        console.info(logMessage, sanitizedData !== undefined ? sanitizedData : '');
        break;
      case 'warn':
        console.warn(logMessage, sanitizedData !== undefined ? sanitizedData : '');
        break;
      case 'error':
        console.error(logMessage, sanitizedData !== undefined ? sanitizedData : '');
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Usage examples:
 *
 * @example
 * logger.info('[Auth] Login attempt', { username: 'user@example.com' });
 * // Output: [Auth] Login attempt { username: '[REDACTED]' }
 *
 * @example
 * logger.error('[Auth] Login failed', { error: 'Invalid credentials' });
 * // Output: [Auth] Login failed { error: 'Invalid credentials' }
 *
 * @example
 * logger.debug('[Auth] Token received', { token: 'abc123', userId: '123' });
 * // Output: [Auth] Token received { token: '[REDACTED]', userId: '123' }
 */
