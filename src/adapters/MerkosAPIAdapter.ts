import type { AuthAPIAdapter, AuthResponse, User } from '../types';
import { AuthError, AuthErrorCode } from '../types/auth';

/**
 * Merkos Platform API adapter configuration
 */
export interface MerkosAPIAdapterConfig {
  baseUrl: string;
  apiVersion?: 'v2' | 'v4';
  timeout?: number;
}

/**
 * Merkos API v2 error response format
 */
interface MerkosV2ErrorResponse {
  err: string;
  code?: string;
  details?: unknown;
}

/**
 * Merkos Platform API adapter implementation
 *
 * This adapter integrates with the Merkos Platform API for authentication.
 * It supports both v2 and v4 API versions with automatic header selection.
 */
export class MerkosAPIAdapter implements AuthAPIAdapter {
  private _baseUrl: string;
  private _timeout: number;
  private _token: string | null;

  // API version stored for future v4 support - currently only v2 is implemented
  // @ts-expect-error - Will be used in future v4 implementation
  private _apiVersion: 'v2' | 'v4';

  constructor(config: MerkosAPIAdapterConfig) {
    this._baseUrl = config.baseUrl;
    this._apiVersion = config.apiVersion || 'v2';
    this._timeout = config.timeout || 30000;
    this._token = null;
  }

  /**
   * Set bearer token in API client for subsequent requests
   *
   * This method stores the JWT token that will be included in the `identifier` header
   * for all subsequent API requests to the Merkos Platform API v2.
   *
   * @param token - The JWT token to store for authentication
   *
   * @example
   * ```typescript
   * const adapter = new MerkosAPIAdapter({ baseUrl: 'https://org.merkos302.com' });
   * adapter.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   * // All subsequent API requests will include this token
   * ```
   */
  setToken(token: string): void {
    this._token = token;
  }

  /**
   * Clear bearer token from API client
   *
   * This method removes the stored JWT token, effectively logging out the user
   * at the adapter level. After calling this method, subsequent API requests
   * will not include authentication credentials.
   *
   * @example
   * ```typescript
   * const adapter = new MerkosAPIAdapter({ baseUrl: 'https://org.merkos302.com' });
   * adapter.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   * // ... make authenticated requests ...
   * adapter.clearToken();
   * // Token is now cleared
   * ```
   */
  clearToken(): void {
    this._token = null;
  }

  /**
   * Make authenticated API request to Merkos Platform API v2
   *
   * This is the core method for making requests to the Merkos Platform API v2.
   * All v2 API requests use POST to the unified `/api/v2` endpoint with service-based routing.
   *
   * **Authentication:**
   * - Uses `identifier` header (NOT `Authorization`) for JWT tokens
   * - Token must be set via `setToken()` before making authenticated requests
   *
   * **Request Format:**
   * - Method: POST
   * - Endpoint: `${baseUrl}/api/v2`
   * - Headers: `Content-Type: application/json`, `identifier: ${token}` (if authenticated)
   * - Body: `{ service, path, params }`
   *
   * **Error Handling:**
   * - API errors (response has `err` field) → throws AuthError with appropriate code
   * - Network errors → throws AuthError with NETWORK_ERROR code
   * - Timeout errors → throws AuthError with NETWORK_ERROR code
   *
   * @template T - The expected response type
   * @param service - Service name ('auth', 'orgs', 'orgcampaigns', 'orgforms')
   * @param path - Colon-separated path (e.g., 'auth:username:login', 'orgs:organizations:list')
   * @param params - Request parameters (optional)
   * @returns Promise resolving to typed response
   * @throws {AuthError} When API returns error, network fails, or timeout occurs
   *
   * @example
   * ```typescript
   * // Login with username/password
   * const response = await adapter.v2Request<AuthResponse>(
   *   'auth',
   *   'auth:username:login',
   *   { username: 'user@example.com', password: 'secret' }
   * );
   *
   * // List organizations (authenticated request)
   * adapter.setToken(response.token);
   * const orgs = await adapter.v2Request<{ organizations: Organization[] }>(
   *   'orgs',
   *   'orgs:organizations:list',
   *   { limit: 10, offset: 0 }
   * );
   * ```
   */
  async v2Request<T = unknown>(
    service: string,
    path: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const url = `${this._baseUrl}/api/v2`;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication token if available
    // CRITICAL: Merkos v2 API uses 'identifier' header, NOT 'Authorization'
    if (this._token) {
      headers['identifier'] = this._token;
    }

    // Build request body
    const body = JSON.stringify({
      service,
      path,
      params,
    });

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this._timeout);

      // Make the request
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Check for API-level errors (Merkos v2 API error format)
      if (data && typeof data === 'object' && 'err' in data) {
        const errorResponse = data as MerkosV2ErrorResponse;

        // Map Merkos error codes to AuthErrorCode
        let errorCode: AuthErrorCode;
        const merkosCode = errorResponse.code?.toLowerCase();

        if (merkosCode?.includes('auth') || merkosCode?.includes('unauthorized')) {
          errorCode = AuthErrorCode.UNAUTHORIZED;
        } else if (merkosCode?.includes('credentials') || merkosCode?.includes('invalid')) {
          errorCode = AuthErrorCode.INVALID_CREDENTIALS;
        } else if (merkosCode?.includes('token') && merkosCode?.includes('expired')) {
          errorCode = AuthErrorCode.TOKEN_EXPIRED;
        } else if (merkosCode?.includes('token')) {
          errorCode = AuthErrorCode.TOKEN_INVALID;
        } else if (merkosCode?.includes('forbidden')) {
          errorCode = AuthErrorCode.FORBIDDEN;
        } else if (merkosCode?.includes('not found') || merkosCode?.includes('notfound')) {
          errorCode = AuthErrorCode.USER_NOT_FOUND;
        } else {
          errorCode = AuthErrorCode.UNKNOWN_ERROR;
        }

        throw new AuthError(
          errorResponse.err,
          errorCode,
          errorResponse.details
        );
      }

      // Check for HTTP errors
      if (!response.ok) {
        let errorCode: AuthErrorCode;

        switch (response.status) {
          case 401:
            errorCode = AuthErrorCode.UNAUTHORIZED;
            break;
          case 403:
            errorCode = AuthErrorCode.FORBIDDEN;
            break;
          case 404:
            errorCode = AuthErrorCode.USER_NOT_FOUND;
            break;
          default:
            errorCode = AuthErrorCode.NETWORK_ERROR;
        }

        throw new AuthError(
          `HTTP ${response.status}: ${response.statusText}`,
          errorCode,
          { status: response.status, statusText: response.statusText }
        );
      }

      return data as T;

    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AuthError(
          `Request timeout after ${this._timeout}ms`,
          AuthErrorCode.NETWORK_ERROR,
          error
        );
      }

      // Re-throw AuthError as-is
      if (error instanceof AuthError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof Error) {
        throw new AuthError(
          `Network error: ${error.message}`,
          AuthErrorCode.NETWORK_ERROR,
          error
        );
      }

      // Handle unknown errors
      throw new AuthError(
        'Unknown error occurred',
        AuthErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Login with bearer token (JWT)
   */
  async loginWithBearerToken(_token: string, _siteId?: string | null): Promise<AuthResponse> {
    // TODO: Implement Merkos Platform bearer token authentication
    // This should call the Merkos Platform API with the token
    throw new Error('Not implemented');
  }

  /**
   * Login with username and password
   */
  async loginWithCredentials(_username: string, _password: string, _siteId?: string | null): Promise<AuthResponse> {
    // TODO: Implement Merkos Platform credentials authentication
    // Call v2Request with service: 'auth', path: 'auth:username:login'
    throw new Error('Not implemented');
  }

  /**
   * Login with Google OAuth code
   */
  async loginWithGoogle(_code: string, _host?: string | null, _siteId?: string | null): Promise<AuthResponse> {
    // TODO: Implement Merkos Platform Google OAuth authentication
    // Call v2Request with service: 'auth', path: 'auth:google:login'
    throw new Error('Not implemented');
  }

  /**
   * Login with Chabad.org SSO token
   */
  async loginWithChabadOrg(_key: string, _siteId?: string | null): Promise<AuthResponse> {
    // TODO: Implement Chabad.org SSO authentication
    // Call v2Request with service: 'auth', path: 'auth:chabadorg:login'
    throw new Error('Not implemented');
  }

  /**
   * Login with Cross-Domain SSO (CDSSO)
   */
  async loginWithCDSSO(): Promise<AuthResponse> {
    // TODO: Implement CDSSO flow
    // Step 1: GET id.merkos302.com/apiv4/users/sso/remote/status
    // Step 2: POST portal.chabaduniverse.com/api/sso/remote/status
    throw new Error('Not implemented');
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    // TODO: Implement user info retrieval
    // Call v2Request with service: 'auth', path: 'auth:user:info'
    throw new Error('Not implemented');
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(_refreshToken: string): Promise<AuthResponse> {
    // TODO: Implement token refresh
    throw new Error('Not implemented');
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // TODO: Implement logout
    // This should clear server-side session if applicable
  }

  /**
   * Verify token validity
   */
  async verifyToken(_token: string): Promise<boolean> {
    // TODO: Implement token verification
    // This should validate the JWT signature and expiration
    return false;
  }
}
