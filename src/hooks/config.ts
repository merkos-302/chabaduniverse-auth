/**
 * Identity Hooks Configuration
 *
 * Configuration system for Universe Identity API hooks.
 * Allows customization of API endpoints, token storage, and other settings.
 *
 * @packageDocumentation
 */

/**
 * Configuration options for identity hooks
 */
export interface IdentityHooksConfig {
  /**
   * Base URL for the Universe Identity API
   * @default '' (same origin)
   * @example 'https://portal.chabaduniverse.com'
   */
  apiBaseUrl: string;

  /**
   * Key used to store the JWT token in localStorage
   * @default 'universe_jwt_token'
   */
  tokenKey: string;

  /**
   * Name of the cookie used for authentication
   * @default 'universe_auth_token'
   */
  cookieName: string;

  /**
   * Whether to include credentials (cookies) in API requests
   * @default true
   */
  includeCredentials: boolean;

  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout: number;

  /**
   * Custom headers to include in API requests
   */
  customHeaders?: Record<string, string>;

  /**
   * Callback fired when authentication state changes
   */
  onAuthStateChange?: (isAuthenticated: boolean) => void;

  /**
   * Callback fired on API errors
   */
  onError?: (error: Error) => void;
}

/**
 * Default configuration values
 */
const defaultConfig: IdentityHooksConfig = {
  apiBaseUrl: '',
  tokenKey: 'universe_jwt_token',
  cookieName: 'universe_auth_token',
  includeCredentials: true,
  timeout: 30000,
};

/**
 * Current configuration (mutable singleton)
 */
let currentConfig: IdentityHooksConfig = { ...defaultConfig };

/**
 * Configure the identity hooks
 *
 * Call this function before using any identity hooks to customize
 * the API endpoint, token storage, and other settings.
 *
 * @param config - Partial configuration to merge with defaults
 *
 * @example
 * ```typescript
 * import { configureIdentityHooks } from '@chabaduniverse/auth';
 *
 * // Configure for production
 * configureIdentityHooks({
 *   apiBaseUrl: 'https://portal.chabaduniverse.com',
 *   onError: (error) => console.error('Auth error:', error),
 * });
 * ```
 */
export function configureIdentityHooks(config: Partial<IdentityHooksConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
  };
}

/**
 * Get the current configuration
 *
 * @returns The current identity hooks configuration
 *
 * @example
 * ```typescript
 * import { getIdentityHooksConfig } from '@chabaduniverse/auth';
 *
 * const config = getIdentityHooksConfig();
 * console.log('API Base URL:', config.apiBaseUrl);
 * ```
 */
export function getIdentityHooksConfig(): Readonly<IdentityHooksConfig> {
  return currentConfig;
}

/**
 * Reset configuration to defaults
 *
 * Useful for testing or when switching environments
 *
 * @example
 * ```typescript
 * import { resetIdentityHooksConfig } from '@chabaduniverse/auth';
 *
 * // Reset to defaults
 * resetIdentityHooksConfig();
 * ```
 */
export function resetIdentityHooksConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Build a full API URL from a path
 *
 * @param path - API path (e.g., '/api/auth/me')
 * @returns Full URL with base URL prepended
 *
 * @internal
 */
export function buildApiUrl(path: string): string {
  const baseUrl = currentConfig.apiBaseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get the stored token from localStorage
 *
 * @returns The stored token or null if not found
 *
 * @internal
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return localStorage.getItem(currentConfig.tokenKey);
}

/**
 * Store a token in localStorage
 *
 * @param token - The token to store
 *
 * @internal
 */
export function setStoredToken(token: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  localStorage.setItem(currentConfig.tokenKey, token);
}

/**
 * Remove the stored token from localStorage
 *
 * @internal
 */
export function removeStoredToken(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  localStorage.removeItem(currentConfig.tokenKey);
}

/**
 * Get the authentication cookie value
 *
 * @returns The cookie value or null if not found
 *
 * @internal
 */
export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === currentConfig.cookieName && value !== undefined) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Build fetch options for API requests
 *
 * @param method - HTTP method
 * @param body - Request body (optional)
 * @returns Fetch options object
 *
 * @internal
 */
export function buildFetchOptions(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...currentConfig.customHeaders,
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: currentConfig.includeCredentials ? 'include' : 'same-origin',
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  return options;
}

/**
 * Perform an API request with error handling
 *
 * @param path - API path
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws Error on network or API errors
 *
 * @internal
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit
): Promise<T> {
  const url = buildApiUrl(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), currentConfig.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || errorData.error || `API request failed with status ${response.status}`
      );
      (error as any).status = response.status;
      (error as any).data = errorData;

      // Notify error callback if configured
      if (currentConfig.onError) {
        currentConfig.onError(error);
      }

      throw error;
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      if (currentConfig.onError) {
        currentConfig.onError(timeoutError);
      }
      throw timeoutError;
    }

    // Re-throw if already handled
    if ((err as any).status) {
      throw err;
    }

    // Network error
    const networkError = new Error(
      err instanceof Error ? err.message : 'Network error'
    );
    if (currentConfig.onError) {
      currentConfig.onError(networkError);
    }
    throw networkError;
  }
}
