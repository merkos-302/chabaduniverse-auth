/**
 * Cookie utility functions for managing browser cookies
 * with support for cross-subdomain and secure environments
 *
 * Provides both base cookie management and specialized utilities for:
 * - Valu Social authentication caching
 * - Merkos Platform authentication tokens
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Cached Valu user data structure
 *
 * Minimal user data cached in cookies for performance optimization.
 * Contains only essential information needed for immediate UI updates
 * and authentication state persistence.
 */
export interface ValuUserCache {
  /** Portal user ID (prefixed with 'valu_') */
  id: string;

  /** Display name for UI rendering */
  name: string;

  /** Original Valu user ID from Valu API */
  valuUserId: string;

  /** Timestamp when data was cached (ISO string) */
  cachedAt: string;

  /** Optional display name (falls back to name if not provided) */
  displayName?: string;

  /** Optional user email */
  email?: string;

  /** Optional profile image URL */
  profileImage?: string;

  /** User roles in portal format */
  roles?: string[];

  /** Network information if available */
  network?: {
    id: string;
    name: string;
    role: string;
  };
}

// ============================================================================
// Base Cookie Management Functions
// ============================================================================

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Set a cookie with options
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof document === 'undefined') return;

  const {
    days = 7,
    path = '/',
    domain,
    secure = typeof window !== 'undefined' && window.location.protocol === 'https:',
    sameSite = 'Lax'
  } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}`;

  // Add expiration
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // Add path
  cookieString += `; path=${path}`;

  // Add domain - auto-detect for chabaduniverse.com
  const cookieDomain = domain || getCookieDomain();
  if (cookieDomain) {
    cookieString += `; domain=${cookieDomain}`;
  }

  // Add secure flag
  if (secure) {
    cookieString += '; Secure';
  }

  // Add SameSite
  cookieString += `; SameSite=${sameSite}`;

  // For cross-origin iframes, we need SameSite=None and Secure
  if (isInIframe() && sameSite === 'None' && !secure) {
    console.warn('SameSite=None requires Secure flag');
    return;
  }

  document.cookie = cookieString;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, options: Omit<CookieOptions, 'days'> = {}): void {
  setCookie(name, '', { ...options, days: -1 });
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Get the appropriate cookie domain for the current environment
 */
function getCookieDomain(): string {
  if (typeof window === 'undefined') return '';

  const hostname = window.location.hostname.toLowerCase();

  // For chabaduniverse.com domains, use cross-subdomain cookie
  if (hostname.includes('chabaduniverse.com')) {
    return '.chabaduniverse.com';
  }

  // For localhost, don't set domain
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }

  // For other domains, use the current hostname
  return hostname;
}

/**
 * Check if the current page is in an iframe
 */
function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    // If accessing window.top throws an error, we're likely in a cross-origin iframe
    return true;
  }
}

// ============================================================================
// Merkos Authentication Cookie Utilities
// ============================================================================

/**
 * Cookie utilities specific to Merkos authentication
 */
export const merkosAuthCookie = {
  /**
   * Get the Merkos auth token from cookie
   */
  getToken(): string | null {
    return getCookie('x-auth-token');
  },

  /**
   * Set the Merkos auth token cookie
   */
  setToken(token: string): void {
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    setCookie('x-auth-token', token, {
      days: 30, // 30 days expiration
      secure: isSecure,
      sameSite: isLocalhost ? 'None' : 'Lax',
      domain: getCookieDomain()
    });
  },

  /**
   * Clear the Merkos auth token cookie
   */
  clearToken(): void {
    deleteCookie('x-auth-token', {
      domain: getCookieDomain()
    });
  },

  /**
   * Check if Merkos auth token exists
   */
  hasToken(): boolean {
    return hasCookie('x-auth-token');
  }
};

// ============================================================================
// Valu Authentication Cookie Utilities
// ============================================================================

/**
 * Cookie configuration for Valu user cache
 *
 * Optimized for iframe environments with security considerations:
 * - 4 hour expiration balances performance and security
 * - SameSite=None required for cross-origin iframe communication
 * - Secure=true required when using SameSite=None
 * - HttpOnly=false allows JavaScript access for client-side auth
 */
const VALU_COOKIE_CONFIG = {
  name: 'valu_user_cache',
  // Convert 4 hours to days for cookie utility (4 hours / 24 hours = 0.167 days)
  days: 4 / 24,
  sameSite: 'None' as const,
  secure: true,
  httpOnly: false, // Must be false for JavaScript access
  path: '/'
} as const;

/**
 * Validate cached user data structure
 *
 * Ensures the retrieved data has the required fields and valid structure.
 * Prevents runtime errors from corrupted or malformed cookie data.
 */
function isValidValuUserCache(data: any): data is ValuUserCache {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['id', 'name', 'valuUserId', 'cachedAt'];
  for (const field of requiredFields) {
    if (!data[field] || typeof data[field] !== 'string') {
      return false;
    }
  }

  // Validate ID format (should start with 'valu_')
  if (!data.id.startsWith('valu_')) {
    return false;
  }

  // Validate timestamp format (should be valid ISO string)
  const cachedAt = new Date(data.cachedAt);
  if (isNaN(cachedAt.getTime())) {
    return false;
  }

  // Check expiration (4 hours)
  const fourHoursAgo = new Date(Date.now() - (4 * 60 * 60 * 1000));
  if (cachedAt < fourHoursAgo) {
    return false;
  }

  // Validate optional fields if present
  if (data.roles && !Array.isArray(data.roles)) {
    return false;
  }

  if (data.network && typeof data.network !== 'object') {
    return false;
  }

  return true;
}

/**
 * Sanitize user data before storage
 *
 * Removes potentially dangerous content and ensures data is safe for storage.
 * Prevents XSS attacks through malicious user data injection.
 */
function sanitizeUserData(data: Partial<ValuUserCache>): Partial<ValuUserCache> {
  const sanitized: Partial<ValuUserCache> = {};

  // Sanitize string fields
  const stringFields = ['id', 'name', 'valuUserId', 'cachedAt', 'displayName', 'email', 'profileImage'] as const;

  for (const field of stringFields) {
    if (data[field] && typeof data[field] === 'string') {
      // Basic XSS prevention: remove script tags and dangerous characters
      sanitized[field] = (data[field] as string)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .substring(0, 500); // Limit length
    }
  }

  // Sanitize roles array
  if (data.roles && Array.isArray(data.roles)) {
    sanitized.roles = data.roles
      .filter(role => typeof role === 'string')
      .map(role => role.substring(0, 50)) // Limit role length
      .slice(0, 10); // Limit array size
  }

  // Sanitize network object
  if (data.network && typeof data.network === 'object') {
    const { id, name, role } = data.network;
    if (typeof id === 'string' && typeof name === 'string' && typeof role === 'string') {
      sanitized.network = {
        id: id.substring(0, 100),
        name: name.substring(0, 200),
        role: role.substring(0, 50)
      };
    }
  }

  return sanitized;
}

/**
 * Retrieve cached Valu user data from cookie
 *
 * Safely retrieves and validates cached user authentication data.
 * Handles corrupted data gracefully and automatically cleans up expired cache.
 */
export function getValuUser(): ValuUserCache | null {
  try {
    const cookieValue = getCookie(VALU_COOKIE_CONFIG.name);

    if (!cookieValue) {
      return null;
    }

    // Parse JSON data
    let parsedData: any;
    try {
      parsedData = JSON.parse(cookieValue);
    } catch (parseError) {
      // Clear corrupted cookie
      clearValuUser();
      return null;
    }

    // Validate data structure and expiration
    if (!isValidValuUserCache(parsedData)) {
      // Clear invalid cookie
      clearValuUser();
      return null;
    }

    return parsedData;

  } catch (error) {
    // Clear potentially corrupted cookie on any error
    clearValuUser();
    return null;
  }
}

/**
 * Cache Valu user data in secure cookie
 *
 * Stores essential user data for quick access and authentication persistence.
 * Automatically sets expiration and applies security configurations for iframe environments.
 */
export function setValuUser(userData: ValuUserCache): void {
  try {
    // Sanitize data before storage
    const sanitizedData = sanitizeUserData(userData);

    // Ensure required fields are present after sanitization
    if (!sanitizedData.id || !sanitizedData.name || !sanitizedData.valuUserId) {
      return;
    }

    // Add current timestamp if not provided
    if (!sanitizedData.cachedAt) {
      sanitizedData.cachedAt = new Date().toISOString();
    }

    // Serialize to JSON
    const jsonData = JSON.stringify(sanitizedData);

    // Check cookie size (browsers typically limit to 4KB)
    if (jsonData.length > 3500) { // Leave some buffer
      console.warn('Valu user cache data is large, may be truncated by browser');
    }

    // Set cookie with security configuration
    setCookie(VALU_COOKIE_CONFIG.name, jsonData, {
      days: VALU_COOKIE_CONFIG.days,
      sameSite: VALU_COOKIE_CONFIG.sameSite,
      secure: VALU_COOKIE_CONFIG.secure,
      path: VALU_COOKIE_CONFIG.path
    });

  } catch (error) {
    console.error('Failed to cache Valu user data:', error);
  }
}

/**
 * Clear cached Valu user data
 *
 * Removes all cached authentication data from cookies.
 * Should be called on logout or when authentication state becomes invalid.
 */
export function clearValuUser(): void {
  try {
    deleteCookie(VALU_COOKIE_CONFIG.name, {
      path: VALU_COOKIE_CONFIG.path
    });
  } catch (error) {
    console.error('Failed to clear Valu user cache:', error);
  }
}

/**
 * Check if Valu user cache exists and is valid
 *
 * Efficiently checks for cached authentication data without parsing full content.
 * Useful for quick authentication state checks and conditional UI rendering.
 */
export function hasValuUser(): boolean {
  try {
    // First check if cookie exists at all
    if (!hasCookie(VALU_COOKIE_CONFIG.name)) {
      return false;
    }

    // Get and validate the cached data
    const cachedUser = getValuUser();
    return cachedUser !== null;

  } catch (error) {
    return false;
  }
}

/**
 * Get cache metadata without retrieving full user data
 *
 * Returns cache timing information for debugging and monitoring purposes.
 * Useful for cache performance analysis and expiration tracking.
 */
export function getValuCacheMetadata(): { cachedAt: string; expiresAt: string; isExpired: boolean } | null {
  try {
    const cookieValue = getCookie(VALU_COOKIE_CONFIG.name);
    if (!cookieValue) return null;

    const parsedData = JSON.parse(cookieValue);
    if (!parsedData?.cachedAt) return null;

    const cachedAt = new Date(parsedData.cachedAt);
    const expiresAt = new Date(cachedAt.getTime() + (4 * 60 * 60 * 1000)); // 4 hours
    const isExpired = new Date() > expiresAt;

    return {
      cachedAt: cachedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isExpired
    };

  } catch (error) {
    return null;
  }
}

/**
 * Refresh cache expiration time
 *
 * Updates the cached timestamp to extend cache validity.
 * Useful for active sessions to maintain cache without full re-authentication.
 */
export function refreshValuCache(): boolean {
  try {
    const currentUser = getValuUser();
    if (!currentUser) {
      return false;
    }

    // Update cached timestamp
    const refreshedUser: ValuUserCache = {
      ...currentUser,
      cachedAt: new Date().toISOString()
    };

    setValuUser(refreshedUser);
    return true;

  } catch (error) {
    return false;
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  getCookie,
  setCookie,
  deleteCookie,
  getAllCookies,
  hasCookie,
  merkosAuthCookie,
  getValuUser,
  setValuUser,
  clearValuUser,
  hasValuUser,
  getValuCacheMetadata,
  refreshValuCache
} as const;
