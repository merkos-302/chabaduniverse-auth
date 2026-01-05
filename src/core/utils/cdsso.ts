/**
 * Cross-Domain Single Sign-On (CDSSO) Utilities
 *
 * Implements two-step authentication flow for Merkos Platform API access from portal iframe:
 *
 * Step 1: Retrieve authentication token from id.merkos302.com
 * Step 2: Validate token with portal backend and set x-auth-token cookie
 * Step 3: Store token in localStorage and API client for bearer token authentication
 *
 * This module is framework-agnostic and uses an adapter pattern for API communication.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Response from id.merkos302.com/apiv4/users/sso/remote/status
 */
export interface RemoteSessionResponse {
  status: 'loggedIn' | 'notLoggedIn';
  token?: string;
}

/**
 * User data returned from successful authentication
 */
export interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

/**
 * Response from portal backend SSO endpoint
 */
export interface PortalAuthResponse {
  status: 'success' | 'error';
  user?: User;
  message?: string;
}

/**
 * API Adapter interface for CDSSO operations
 *
 * Allows different implementations for different frameworks/environments
 */
export interface CDSSOAPIAdapter {
  /**
   * Fetch remote session status from Merkos Platform
   */
  fetchRemoteSession: () => Promise<RemoteSessionResponse>;

  /**
   * Apply token to portal backend
   */
  applyTokenToPortal: (token: string) => Promise<PortalAuthResponse>;

  /**
   * Logout from portal
   */
  logout: () => Promise<void>;

  /**
   * Get current auth status from portal
   */
  getAuthStatus: () => Promise<PortalAuthResponse>;

  /**
   * Store token in API client for header injection
   */
  setTokenInClient: (token: string) => void;

  /**
   * Clear token from API client
   */
  clearTokenInClient: () => void;
}

/**
 * Token storage interface
 *
 * Abstract storage operations for cross-platform compatibility
 */
export interface TokenStorage {
  getToken: () => string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

// ============================================================================
// Token Storage Implementation
// ============================================================================

/**
 * Default localStorage-based token storage
 *
 * Uses localStorage for persistence across sessions
 */
export class LocalStorageTokenStorage implements TokenStorage {
  private readonly storageKey = 'merkos_auth_token';

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.storageKey);
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, token);
  }

  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.storageKey);
  }
}

// ============================================================================
// Default Fetch-based API Adapter
// ============================================================================

/**
 * Default CDSSO API adapter using native fetch
 *
 * Provides a standard implementation that works in most browser environments
 */
export class FetchCDSSOAdapter implements CDSSOAPIAdapter {
  constructor(
    private tokenStorage: TokenStorage = new LocalStorageTokenStorage(),
    private apiClientSetter?: (token: string) => void,
    private apiClientClearer?: () => void
  ) {}

  async fetchRemoteSession(): Promise<RemoteSessionResponse> {
    const response = await fetch('https://id.merkos302.com/apiv4/users/sso/remote/status', {
      method: 'GET',
      credentials: 'include', // Send id.merkos302.com cookies
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Remote session check failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async applyTokenToPortal(token: string): Promise<PortalAuthResponse> {
    const response = await fetch('/api/sso/remote/status', {
      method: 'POST',
      credentials: 'include', // Allow portal to set cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token validation failed: Unauthorized');
      }
      throw new Error(`Portal token application failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async logout(): Promise<void> {
    const response = await fetch('/api/sso/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
    }
  }

  async getAuthStatus(): Promise<PortalAuthResponse> {
    const response = await fetch('/api/sso/status', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Auth status check failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  setTokenInClient(token: string): void {
    // Store in localStorage
    this.tokenStorage.setToken(token);

    // If a custom setter is provided, use it to set token in API client
    if (this.apiClientSetter) {
      this.apiClientSetter(token);
    }
  }

  clearTokenInClient(): void {
    // Clear from localStorage
    this.tokenStorage.clearToken();

    // If a custom clearer is provided, use it to clear token from API client
    if (this.apiClientClearer) {
      this.apiClientClearer();
    }
  }
}

// ============================================================================
// CDSSO Utility Class
// ============================================================================

/**
 * CDSSO utility class
 *
 * Provides high-level CDSSO operations using the adapter pattern
 */
export class CDSSOUtils {
  constructor(private adapter: CDSSOAPIAdapter) {}

  /**
   * Step 1: Check remote session status on id.merkos302.com
   *
   * Makes GET request to Merkos Platform's SSO remote status endpoint.
   * Browser automatically includes id.merkos302.com cookies with credentials: 'include'.
   *
   * @returns JWT token string if user is logged in, null otherwise
   */
  async checkRemoteSession(): Promise<string | null> {
    try {
      console.log('[CDSSO] Step 1: Checking remote session at id.merkos302.com...');

      const data = await this.adapter.fetchRemoteSession();

      if (data.status === 'loggedIn' && data.token) {
        console.log('[CDSSO] Remote session active, token retrieved');
        return data.token;
      }

      console.log('[CDSSO] Remote session not logged in');
      return null;
    } catch (error) {
      console.error('[CDSSO] Error checking remote session:', error);
      return null;
    }
  }

  /**
   * Step 2: Apply authentication token to portal backend
   *
   * Sends JWT token to portal's SSO endpoint for validation.
   * Portal backend will:
   * 1. Verify JWT signature using Merkos Platform's JWT_SECRET_KEY
   * 2. Validate token expiration and claims
   * 3. Set x-auth-token cookie for portal domain
   * 4. Return authenticated user data
   *
   * @param token - JWT token from id.merkos302.com
   * @returns User data if token is valid, null otherwise
   */
  async applyTokenToPortal(token: string): Promise<User | null> {
    try {
      console.log('[CDSSO] Step 2: Applying token to portal backend...');

      const data = await this.adapter.applyTokenToPortal(token);

      if (data.status === 'success' && data.user) {
        console.log('[CDSSO] Token applied successfully, user authenticated:', data.user.email);

        // Store token in localStorage and API client for API calls
        this.adapter.setTokenInClient(token);
        console.log('[CDSSO] Token stored in localStorage and API client');

        return data.user;
      }

      console.error('[CDSSO] Portal response indicates failure:', data.message || 'Unknown error');
      return null;
    } catch (error) {
      console.error('[CDSSO] Error applying token to portal:', error);
      return null;
    }
  }

  /**
   * Complete CDSSO authentication flow
   *
   * Combines both steps:
   * 1. Retrieve token from id.merkos302.com
   * 2. Validate token with portal backend and set cookie
   *
   * @returns Authenticated user data if successful, null otherwise
   */
  async authenticate(): Promise<User | null> {
    console.log('[CDSSO] Starting authentication flow...');

    // Step 1: Get token from Merkos Platform
    const token = await this.checkRemoteSession();

    if (!token) {
      console.log('[CDSSO] Authentication failed: No token from remote session');
      return null;
    }

    // Step 2: Apply token to portal
    const user = await this.applyTokenToPortal(token);

    if (user) {
      console.log('[CDSSO] Authentication complete:', user.email);
    } else {
      console.log('[CDSSO] Authentication failed: Token validation failed');
    }

    return user;
  }

  /**
   * Logout from CDSSO session
   *
   * Clears authentication state on portal domain.
   * Note: This does NOT clear the session on id.merkos302.com.
   * User must log out from id.merkos302.com separately if needed.
   *
   * @returns true if logout successful, false otherwise
   */
  async logout(): Promise<boolean> {
    try {
      console.log('[CDSSO] Logging out...');

      await this.adapter.logout();

      // Clear token from client
      this.adapter.clearTokenInClient();

      console.log('[CDSSO] Logout successful');
      return true;
    } catch (error) {
      console.error('[CDSSO] Error during logout:', error);
      return false;
    }
  }

  /**
   * Check if user is currently authenticated via CDSSO
   *
   * Verifies that x-auth-token cookie is present and valid.
   * This does NOT make a network request - it checks local state only.
   *
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    // Check if x-auth-token cookie exists
    if (typeof document === 'undefined') return false;

    const cookies = document.cookie.split(';');
    const hasAuthToken = cookies.some(cookie =>
      cookie.trim().startsWith('x-auth-token=')
    );

    return hasAuthToken;
  }

  /**
   * Get authentication status from portal backend
   *
   * Makes API call to verify current authentication state.
   * Use this for authoritative check; isAuthenticated() only checks cookie presence.
   *
   * @returns User data if authenticated, null otherwise
   */
  async getAuthStatus(): Promise<User | null> {
    try {
      const data = await this.adapter.getAuthStatus();
      return data.user || null;
    } catch (error) {
      console.error('[CDSSO] Error getting auth status:', error);
      return null;
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a CDSSO utils instance with custom adapter
 */
export function createCDSSOUtils(adapter: CDSSOAPIAdapter): CDSSOUtils {
  return new CDSSOUtils(adapter);
}

/**
 * Create a CDSSO utils instance with default fetch adapter
 */
export function createDefaultCDSSOUtils(
  tokenStorage?: TokenStorage,
  apiClientSetter?: (token: string) => void,
  apiClientClearer?: () => void
): CDSSOUtils {
  const adapter = new FetchCDSSOAdapter(tokenStorage, apiClientSetter, apiClientClearer);
  return new CDSSOUtils(adapter);
}

// ============================================================================
// Convenience Functions (for backwards compatibility)
// ============================================================================

/**
 * Global CDSSO utils instance (lazy-initialized)
 */
let globalCDSSOUtils: CDSSOUtils | null = null;

/**
 * Initialize global CDSSO utils with custom adapter
 */
export function initializeCDSSO(adapter: CDSSOAPIAdapter): void {
  globalCDSSOUtils = new CDSSOUtils(adapter);
}

/**
 * Get or create global CDSSO utils instance
 */
function getGlobalCDSSOUtils(): CDSSOUtils {
  if (!globalCDSSOUtils) {
    globalCDSSOUtils = createDefaultCDSSOUtils();
  }
  return globalCDSSOUtils;
}

/**
 * Convenience function: Check remote session
 */
export async function checkRemoteSession(): Promise<string | null> {
  return getGlobalCDSSOUtils().checkRemoteSession();
}

/**
 * Convenience function: Apply token to portal
 */
export async function applyTokenToPortal(token: string): Promise<User | null> {
  return getGlobalCDSSOUtils().applyTokenToPortal(token);
}

/**
 * Convenience function: Complete authentication
 */
export async function authenticate(): Promise<User | null> {
  return getGlobalCDSSOUtils().authenticate();
}

/**
 * Convenience function: Logout
 */
export async function logout(): Promise<boolean> {
  return getGlobalCDSSOUtils().logout();
}

/**
 * Convenience function: Check if authenticated
 */
export function isAuthenticated(): boolean {
  return getGlobalCDSSOUtils().isAuthenticated();
}

/**
 * Convenience function: Get auth status
 */
export async function getAuthStatus(): Promise<User | null> {
  return getGlobalCDSSOUtils().getAuthStatus();
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  CDSSOUtils,
  createCDSSOUtils,
  createDefaultCDSSOUtils,
  initializeCDSSO,
  checkRemoteSession,
  applyTokenToPortal,
  authenticate,
  logout,
  isAuthenticated,
  getAuthStatus,
  FetchCDSSOAdapter,
  LocalStorageTokenStorage
} as const;
