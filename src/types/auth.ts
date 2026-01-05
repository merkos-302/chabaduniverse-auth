/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: AuthError | null;
  token: string | null;
  refreshToken?: string | null;
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * User interface
 */
export interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  adapter: AuthAPIAdapter;
  tokenStorage?: TokenStorage;
  autoRefresh?: boolean;
  refreshThreshold?: number; // seconds before expiry to refresh
  onAuthStateChange?: (state: AuthState) => void;
  onError?: (error: AuthError) => void;
}

/**
 * Token storage interface
 */
export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
  getRefreshToken?(): Promise<string | null>;
  setRefreshToken?(token: string): Promise<void>;
  removeRefreshToken?(): Promise<void>;
}

/**
 * Authentication method types
 */
export type AuthMethod =
  | 'bearer-token'
  | 'credentials'
  | 'google'
  | 'chabad-org'
  | 'cdsso';

/**
 * Authentication event types
 */
export type AuthEvent =
  | 'auth:login'
  | 'auth:logout'
  | 'auth:token-refresh'
  | 'auth:error'
  | 'auth:state-change';

/**
 * Authentication API adapter interface
 *
 * This interface defines the contract for authentication API implementations.
 * It supports multiple authentication methods (bearer token, credentials, Google, Chabad.org, CDSSO)
 * and provides methods for token management and user verification.
 */
export interface AuthAPIAdapter {
  /**
   * Set bearer token in API client for subsequent requests
   * This method is called after successful authentication to configure the API client
   */
  setToken(token: string): void;

  /**
   * Clear bearer token from API client
   */
  clearToken(): void;

  /**
   * Login with bearer token (JWT)
   */
  loginWithBearerToken(token: string, siteId?: string | null): Promise<AuthResponse>;

  /**
   * Login with username and password
   */
  loginWithCredentials(username: string, password: string, siteId?: string | null): Promise<AuthResponse>;

  /**
   * Login with Google OAuth code
   */
  loginWithGoogle(code: string, host?: string | null, siteId?: string | null): Promise<AuthResponse>;

  /**
   * Login with Chabad.org SSO token
   */
  loginWithChabadOrg(key: string, siteId?: string | null): Promise<AuthResponse>;

  /**
   * Login with Cross-Domain SSO
   * Implements two-step CDSSO authentication flow
   */
  loginWithCDSSO(): Promise<AuthResponse>;

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Promise<User>;

  /**
   * Refresh authentication token
   */
  refreshToken(refreshToken: string): Promise<AuthResponse>;

  /**
   * Logout current user
   */
  logout(): Promise<void>;

  /**
   * Verify token validity
   */
  verifyToken(token: string): Promise<boolean>;

  /**
   * Make authenticated API request (v2 request)
   * Used for credentials, Google, and Chabad.org login methods
   */
  v2Request(service: string, path: string, params: Record<string, unknown>): Promise<any>;
}

/**
 * Authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
