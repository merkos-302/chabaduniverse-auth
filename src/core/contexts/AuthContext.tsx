/**
 * Authentication Context (Framework-Agnostic)
 *
 * Ultra-simple authentication context that serves as the single source of truth
 * for all authentication state. Supports dual authentication (Valu + Merkos)
 * with race-condition safety patterns.
 *
 * This is a framework-agnostic implementation using the adapter pattern for
 * API communication and token management.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { merkosAuthCookie } from "../utils/cookies";
import { CDSSOUtils } from "../utils/cdsso";

// ============================================================================
// API Adapter Interfaces
// ============================================================================

/**
 * API response for authentication operations
 */
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
}

/**
 * User info response from API
 */
export interface UserInfoResponse {
  user?: any;
  id?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Auth API Adapter interface
 *
 * Allows different implementations for different frameworks/environments
 */
export interface AuthAPIAdapter {
  /**
   * Make a v2 API request
   */
  v2Request: (service: string, path: string, params: any) => Promise<any>;

  /**
   * Set authentication token in API client
   */
  setToken: (token: string) => void;

  /**
   * Clear authentication state
   */
  clearAuth: () => void;

  /**
   * Get current token from API client
   */
  getToken?: () => string | null;
}

/**
 * User service adapter interface for bearer token login
 */
export interface UserServiceAdapter {
  auth: {
    loginWithBearerToken: (token: string, siteId: string | null) => Promise<AuthResponse>;
  };
}

// ============================================================================
// Authentication State Interface
// ============================================================================

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Track if initial auth check has completed
  user: any;
  token: string | null;
  error: string | null;
  needsBearerToken: boolean;
  // Merkos-specific bearer token tracking
  hasMerkosBearerToken: boolean;
  merkosTokenVerified: boolean;
  // Valu authentication support
  isValuAuthenticated: boolean;
  valuUserId: string | null;
}

/**
 * Context interface
 */
export interface AuthContextType extends AuthState {
  loginWithBearerToken: (token: string, siteId?: string | null) => Promise<any>;
  loginWithCredentials: (
    username: string,
    password: string,
    siteId?: string | null,
  ) => Promise<any>;
  loginWithGoogle: (code: string, host?: string | null, siteId?: string | null) => Promise<any>;
  loginWithChabadOrg: (key: string, siteId?: string | null) => Promise<any>;
  loginWithCDSSO: () => Promise<any>;
  logout: () => Promise<void>;
  clearError: () => void;
  // Valu authentication support
  setValuUser: (user: any) => void;
  clearValuUser: () => void;
}

// ============================================================================
// Token Storage Utilities
// ============================================================================

/**
 * Token storage utilities
 */
const tokenStorage = {
  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("merkos_auth_token");
  },
  setToken: (token: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem("merkos_auth_token", token);
    } else {
      localStorage.removeItem("merkos_auth_token");
    }
  },
  clearToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("merkos_auth_token");
  },
};

// ============================================================================
// Context Creation
// ============================================================================

/**
 * Create context
 */
const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// Provider Configuration Interface
// ============================================================================

/**
 * Provider configuration
 */
export interface AuthProviderConfig {
  /**
   * API adapter for authentication operations
   */
  apiAdapter: AuthAPIAdapter;

  /**
   * User service adapter for bearer token login
   */
  userServiceAdapter: UserServiceAdapter;

  /**
   * CDSSO utilities instance (optional)
   */
  cdssoUtils?: CDSSOUtils;
}

/**
 * Provider props
 */
export interface AuthProviderProps {
  children: React.ReactNode;
  config: AuthProviderConfig;
}

// ============================================================================
// Auth Provider Component
// ============================================================================

/**
 * Auth Provider
 */
export const AuthProvider = ({ children, config }: AuthProviderProps) => {
  const { apiAdapter, userServiceAdapter, cdssoUtils } = config;

  // Single, simple state object
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false, // Will be true once initial auth check completes
    user: null,
    token: null,
    error: null,
    needsBearerToken: false,
    // Merkos-specific bearer token tracking
    hasMerkosBearerToken: false,
    merkosTokenVerified: false,
    // Valu authentication support
    isValuAuthenticated: false,
    valuUserId: null,
  });

  // Track if we've already verified to prevent loops
  const verificationAttemptedRef = useRef(false);
  const lastVerifiedTokenRef = useRef<string | null>(null);

  // Track if initializeAuth is currently running
  const isInitializingRef = useRef(false);

  // Track if we have a successfully verified token (persists across renders)
  const hasVerifiedTokenRef = useRef(false);

  // Ref to access current state without stale closures
  const authStateRef = useRef(authState);

  // Keep ref in sync with state
  useEffect(() => {
    authStateRef.current = authState;
    // Update verified token flag whenever hasMerkosBearerToken changes
    if (authState.hasMerkosBearerToken && authState.merkosTokenVerified) {
      hasVerifiedTokenRef.current = true;
    } else if (!authState.hasMerkosBearerToken) {
      hasVerifiedTokenRef.current = false;
    }
  }, [authState]);

  /**
   * Update authentication state immediately
   */
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we've already attempted verification with this token
      if (verificationAttemptedRef.current) {
        console.debug('[Auth] Verification already attempted, skipping');
        return;
      }

      // Mark that initialization is in progress
      isInitializingRef.current = true;

      try {
        // First check for cookie token
        let token = merkosAuthCookie.getToken();
        let tokenSource = 'cookie';

        // If no cookie, check localStorage
        if (!token) {
          token = tokenStorage.getToken();
          tokenSource = 'localStorage';
        }

        // Check if this is the same token we already verified
        if (token && token === lastVerifiedTokenRef.current) {
          console.debug('[Auth] Token already verified, using cached auth state');
          return;
        }

        if (token) {
          // Mark that we're attempting verification
          verificationAttemptedRef.current = true;
          lastVerifiedTokenRef.current = token;

          // Set token in client
          apiAdapter.setToken(token);

          // Try to verify with API
          try {
            console.info('[Auth] Verifying token', { source: tokenSource, tokenLength: token.length });
            const userInfo = await apiAdapter.v2Request("auth", "auth:user:info", {});
            console.log('[Auth] Token validation successful', { userId: userInfo.user?.id || userInfo.id, source: tokenSource });

            // Check token expiration even for API-verified tokens
            try {
              const tokenParts = token.trim().split(".");
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]!));
                if (payload.exp) {
                  const currentTime = Math.floor(Date.now() / 1000);
                  if (payload.exp < currentTime) {
                    console.warn('[Auth] JWT token has expired (API verified)', {
                      expiredAt: new Date(payload.exp * 1000).toISOString(),
                      currentTime: new Date(currentTime * 1000).toISOString()
                    });
                    // Clear expired token
                    localStorage.removeItem("merkosAuthToken");
                    merkosAuthCookie.clearToken();
                    updateAuthState({
                      isAuthenticated: false,
                      user: null,
                      token: null,
                      error: 'Token has expired',
                      isLoading: false,
                      isInitialized: true, // Initialization complete (token expired)
                      needsBearerToken: true,
                      hasMerkosBearerToken: false,
                      merkosTokenVerified: false,
                    });
                    isInitializingRef.current = false; // Initialization complete (token expired)
                    return;
                  }
                }
              }
            } catch (decodeError: any) {
              console.debug('[Auth] Could not decode token for expiration check', { error: decodeError.message });
              // Continue with API verification if decode fails - API already validated it
            }

            // Store token in both cookie and localStorage for redundancy
            if (tokenSource === 'localStorage') {
              merkosAuthCookie.setToken(token);
            } else {
              tokenStorage.setToken(token);
            }

            updateAuthState({
              isAuthenticated: true,
              user: userInfo.user || userInfo,
              token: token,
              error: null,
              isLoading: false,
              isInitialized: true, // Initialization complete - user authenticated
              needsBearerToken: false,
              hasMerkosBearerToken: true,
              merkosTokenVerified: true,
            });
            isInitializingRef.current = false; // Initialization complete
            return;
          } catch (apiError: any) {
            console.warn('[Auth] API verification failed, trying JWT decode fallback', { error: apiError.message });
            // Try JWT decode as fallback
            try {
              const tokenParts = token.trim().split(".");
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]!));
                console.debug('[Auth] JWT payload decoded', { hasUser: !!payload.user, hasSub: !!payload.sub });

                // Check token expiration
                if (payload.exp) {
                  const currentTime = Math.floor(Date.now() / 1000);
                  if (payload.exp < currentTime) {
                    console.warn('[Auth] JWT token has expired', {
                      expiredAt: new Date(payload.exp * 1000).toISOString(),
                      currentTime: new Date(currentTime * 1000).toISOString()
                    });
                    // Clear expired token
                    localStorage.removeItem("merkosAuthToken");
                    updateAuthState({
                      isAuthenticated: false,
                      user: null,
                      token: null,
                      error: 'Token has expired',
                      isLoading: false,
                      isInitialized: true, // Initialization complete (token expired)
                      needsBearerToken: true,
                      hasMerkosBearerToken: false,
                      merkosTokenVerified: false,
                    });
                    isInitializingRef.current = false; // Initialization complete (token expired)
                    return;
                  }
                }

                if (payload.user || payload.sub) {
                  const userData = {
                    id: payload.user?.Id || payload.user?.id || payload.sub,
                    uuid: payload.user?.uuid || payload.sub,
                    email: payload.user?.email || payload.user?.Email || payload.email,
                    name:
                      payload.user?.name ||
                      `${payload.user?.firstName || payload.user?.FirstName || ""} ${payload.user?.lastName || payload.user?.LastName || ""}`.trim() ||
                      payload.name,
                    firstName:
                      payload.user?.firstName || payload.user?.FirstName || payload.given_name,
                    lastName:
                      payload.user?.lastName || payload.user?.LastName || payload.family_name,
                    roles: payload.user?.roles || [],
                    permissions: payload.user?.permissions || [],
                  };

                  console.log('[Auth Init] JWT decode successful, user data:', userData);
                  console.log('[Auth] Token validation successful (JWT fallback)', { userId: userData.id, source: 'jwt-fallback' });
                  updateAuthState({
                    isAuthenticated: true,
                    user: userData,
                    token: token,
                    error: null,
                    isLoading: false,
                    isInitialized: true, // Initialization complete - user authenticated via JWT decode
                    needsBearerToken: false,
                    hasMerkosBearerToken: true,
                    merkosTokenVerified: false, // JWT decode fallback, not verified with API
                  });
                  isInitializingRef.current = false; // Initialization complete
                  return;
                }
              }
            } catch (jwtError: any) {
              console.warn('[Auth] JWT decode failed', { error: jwtError.message });
            }
          }
        } else {
          // No token found at all
          verificationAttemptedRef.current = true;
        }

        // No valid token found - keep loading while CDSSO attempts authentication
        tokenStorage.clearToken();
        merkosAuthCookie.clearToken();
        apiAdapter.clearAuth();
        updateAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
          isLoading: true,  // Keep loading true - CDSSO will set to false when it completes
          needsBearerToken: false,  // Don't prompt yet - let CDSSO try first
          hasMerkosBearerToken: false,
          merkosTokenVerified: false,
          isValuAuthenticated: false,
          valuUserId: null,
        });
        isInitializingRef.current = false; // Initialization complete (no token found)
      } catch (error: any) {
        console.error('[Auth] Auth initialization error', error, { timestamp: new Date().toISOString() });
        updateAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          error: "Failed to initialize authentication",
          isLoading: true,  // Keep loading true - CDSSO will set to false when it completes
          needsBearerToken: false,  // Don't prompt yet - let CDSSO try first
          hasMerkosBearerToken: false,
          merkosTokenVerified: false,
          isValuAuthenticated: false,
          valuUserId: null,
        });
        isInitializingRef.current = false; // Initialization complete (error)
      }
    };

    initializeAuth();
  }, [updateAuthState, apiAdapter]);

  /**
   * Login with bearer token
   */
  const loginWithBearerToken = useCallback(
    async (bearerToken: string, siteId: string | null = null) => {
      console.info('[Auth] Attempting bearer token login', { siteId, tokenPreview: bearerToken?.substring(0, 10) + '...' });
      updateAuthState({ isLoading: true, error: null });

      try {
        const response = await userServiceAdapter.auth.loginWithBearerToken(bearerToken, siteId);
        console.debug('[Auth] Bearer token login response received', { success: response.success, hasToken: !!response.token, hasUser: !!response.user });

        if (response.success && response.token) {
          const { token: authToken, user: userData } = response;
          console.log('[Auth] Login attempt successful', { method: 'bearer', identifier: userData?.email || userData?.id || 'unknown', tokenLength: authToken?.length });

          // Store token in both cookie and localStorage
          tokenStorage.setToken(authToken);
          merkosAuthCookie.setToken(authToken);
          apiAdapter.setToken(authToken);

          // Update state immediately
          updateAuthState({
            isAuthenticated: true,
            user: userData,
            token: authToken,
            error: null,
            isLoading: false,
            isInitialized: true, // User successfully authenticated
            needsBearerToken: false,
            hasMerkosBearerToken: true,
            merkosTokenVerified: true,
          });

          return response;
        } else {
          console.error('[Auth] Bearer token login failed - invalid response', null, { response });
          throw new Error("Bearer token authentication failed: Invalid response");
        }
      } catch (error: any) {
        console.error('[Auth] Bearer token login error', error, {
          message: error.message,
          code: error.code,
          status: error.status,
          timestamp: new Date().toISOString()
        });
        updateAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          error: error.message || "Bearer token authentication failed",
          isLoading: false,
        });
        throw error;
      }
    },
    [updateAuthState, apiAdapter, userServiceAdapter],
  );

  /**
   * Login with username/password
   */
  const loginWithCredentials = useCallback(
    async (username: string, password: string, siteId: string | null = null) => {
      console.info('[Auth] Attempting credentials login', { username, siteId });
      updateAuthState({ isLoading: true, error: null });

      try {
        const response = await apiAdapter.v2Request("auth", "auth:username:login", {
          username,
          password,
          siteId,
        });
        console.debug('[Auth] Credentials login response received', { success: response.success, hasToken: !!response.token, hasUser: !!response.user });

        if (response.success && response.token) {
          const { token: authToken, user: userData } = response;
          console.log('[Auth] Login attempt successful', { method: 'credentials', identifier: username, tokenLength: authToken?.length });

          // Store token in both cookie and localStorage
          tokenStorage.setToken(authToken);
          merkosAuthCookie.setToken(authToken);
          apiAdapter.setToken(authToken);

          // Update state immediately
          updateAuthState({
            isAuthenticated: true,
            user: userData,
            token: authToken,
            error: null,
            isLoading: false,
            isInitialized: true, // User successfully authenticated
            needsBearerToken: false,
            hasMerkosBearerToken: true,
            merkosTokenVerified: true,
          });

          return response;
        } else {
          console.error('[Auth] Credentials login failed - invalid response', null, { response });
          throw new Error("Login failed: Invalid response");
        }
      } catch (error: any) {
        console.error('[Auth] Credentials login error', error, {
          message: error.message,
          code: error.code,
          status: error.status,
          timestamp: new Date().toISOString()
        });
        updateAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          error: error.message || "Login failed",
          isLoading: false,
        });
        throw error;
      }
    },
    [updateAuthState, apiAdapter],
  );

  /**
   * Login with Google OAuth
   */
  const loginWithGoogle = useCallback(
    async (code: string, host: string | null = null, siteId: string | null = null) => {
      console.info('[Auth] Attempting Google OAuth login', { codePreview: code?.substring(0, 10) + '...', host, siteId });
      updateAuthState({ isLoading: true, error: null });

      try {
        const response = await apiAdapter.v2Request("auth", "auth:google:login", {
          code,
          host,
          siteId,
        });
        console.debug('[Auth] Google login response received', { response });

        if (response.success && response.token) {
          const { token: authToken, user: userData } = response;
          console.log('[Auth] Login attempt successful', { method: 'google', identifier: userData?.email || userData?.id || 'unknown', tokenLength: authToken?.length });

          // Store token in both cookie and localStorage
          tokenStorage.setToken(authToken);
          merkosAuthCookie.setToken(authToken);
          apiAdapter.setToken(authToken);

          // Update state immediately
          updateAuthState({
            isAuthenticated: true,
            user: userData,
            token: authToken,
            error: null,
            isLoading: false,
            isInitialized: true, // User successfully authenticated
            needsBearerToken: false,
            hasMerkosBearerToken: true,
            merkosTokenVerified: true,
          });

          return response;
        } else {
          console.error('[Auth] Google login failed - invalid response', null, { response });
          throw new Error("Google login failed: Invalid response");
        }
      } catch (error: any) {
        console.error('[Auth] Google login error', error, {
          message: error.message,
          code: error.code,
          status: error.status,
          timestamp: new Date().toISOString()
        });
        updateAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          error: error.message || "Google login failed",
          isLoading: false,
        });
        throw error;
      }
    },
    [updateAuthState, apiAdapter],
  );

  /**
   * Login with Chabad.org
   */
  const loginWithChabadOrg = useCallback(
    async (key: string, siteId: string | null = null) => {
      console.info('[Auth] Attempting Chabad.org login', { keyPreview: key?.substring(0, 10) + '...', siteId });
      updateAuthState({ isLoading: true, error: null });

      try {
        const response = await apiAdapter.v2Request("auth", "auth:chabadorg:login", {
          key,
          siteId,
        });
        console.debug('[Auth] Chabad.org login response received', { response });

        if (response.success && response.token) {
          const { token: authToken, user: userData } = response;
          console.log('[Auth] Login attempt successful', { method: 'chabad.org', identifier: userData?.email || userData?.id || 'unknown', tokenLength: authToken?.length });

          // Store token in both cookie and localStorage
          tokenStorage.setToken(authToken);
          merkosAuthCookie.setToken(authToken);
          apiAdapter.setToken(authToken);

          // Update state immediately
          updateAuthState({
            isAuthenticated: true,
            user: userData,
            token: authToken,
            error: null,
            isLoading: false,
            isInitialized: true, // User successfully authenticated
            needsBearerToken: false,
            hasMerkosBearerToken: true,
            merkosTokenVerified: true,
          });

          return response;
        } else {
          console.error('[Auth] Chabad.org login failed - invalid response', null, { response });
          throw new Error("Chabad.org login failed: Invalid response");
        }
      } catch (error: any) {
        console.error('[Auth] Chabad.org login error', error, {
          message: error.message,
          code: error.code,
          status: error.status,
          timestamp: new Date().toISOString()
        });
        updateAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          error: error.message || "Chabad.org login failed",
          isLoading: false,
        });
        throw error;
      }
    },
    [updateAuthState, apiAdapter],
  );

  /**
   * Login with CDSSO (Cross-Domain Single Sign-On)
   *
   * Implements two-step CDSSO authentication flow:
   * 1. Retrieve token from id.merkos302.com
   * 2. Validate token with portal backend
   * 3. Update auth state with user data
   *
   * This is a PASSIVE authentication method - it silently attempts CDSSO
   * but does NOT block the site or prompt the user if it fails.
   * Bearer token prompts only appear when user accesses pages that require auth.
   *
   * @returns User data if successful, null otherwise (never throws)
   */
  const loginWithCDSSO = useCallback(async () => {
    console.info('[Auth] Attempting CDSSO login (passive)');

    // CDSSO is optional - if not configured, skip silently
    if (!cdssoUtils) {
      console.debug('[Auth] CDSSO not configured, skipping');
      updateAuthState({ isLoading: false, isInitialized: true });
      return null;
    }

    try {
      // Step 1: Get token from Merkos SSO
      const token = await cdssoUtils.checkRemoteSession();

      if (!token) {
        // User not logged into id.merkos302.com - this is OK, fail silently
        console.debug('[CDSSO] No remote session found (user not logged into id.merkos302.com)');

        // Wait for initializeAuth() to complete if it's still running
        // This prevents the race where CDSSO fails quickly while initializeAuth is still verifying
        let attempts = 0;
        const maxAttempts = 50; // Max 5 seconds (50 * 100ms)
        while (isInitializingRef.current && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        // Only set loading false if there's still no bearer token (initializeAuth didn't find one)
        if (!authStateRef.current.hasMerkosBearerToken) {
          updateAuthState({ isLoading: false, isInitialized: true }); // Initialization complete - no auth available
        }
        return null;
      }

      console.debug('[CDSSO] Token retrieved from remote session', { tokenLength: token.length });

      // Step 2: Validate token with portal backend
      const user = await cdssoUtils.applyTokenToPortal(token);

      if (!user) {
        // Token validation failed - log but don't block
        console.warn('[CDSSO] Token validation failed');

        // Wait for initializeAuth() to complete if it's still running
        let attempts = 0;
        const maxAttempts = 50; // Max 5 seconds (50 * 100ms)
        while (isInitializingRef.current && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        // Only set loading false if there's still no bearer token
        if (!authStateRef.current.hasMerkosBearerToken) {
          updateAuthState({ isLoading: false, isInitialized: true }); // Initialization complete - token validation failed
        }
        return null;
      }

      console.log('[Auth] Login attempt successful', { method: 'cdsso', identifier: user.email || user.id || 'unknown', tokenLength: token.length });

      // Step 3: Store token (same as bearer token login)
      tokenStorage.setToken(token);
      merkosAuthCookie.setToken(token);
      apiAdapter.setToken(token);

      // Step 4: Update auth state
      updateAuthState({
        isAuthenticated: true,
        user,
        token,
        error: null,
        isLoading: false,
        isInitialized: true, // Initialization complete - user authenticated via CDSSO
        needsBearerToken: false,
        hasMerkosBearerToken: true,
        merkosTokenVerified: true,
      });

      console.info('[CDSSO] Login successful', { userId: user.id, email: user.email });
      return { success: true, user, token };

    } catch (error: any) {
      // CDSSO failed - log but DON'T block the site or prompt user
      console.debug('[CDSSO] Attempt failed (non-blocking)', {
        message: error.message,
        timestamp: new Date().toISOString()
      });

      // Wait briefly to let initializeAuth() complete if it's verifying a cached token
      await new Promise(resolve => setTimeout(resolve, 500));

      // Only set loading false if there's still no bearer token
      if (!authStateRef.current.hasMerkosBearerToken) {
        updateAuthState({ isLoading: false, isInitialized: true }); // Initialization complete - CDSSO failed
      }
      return null;
    }
  }, [updateAuthState, cdssoUtils, apiAdapter]);

  /**
   * Logout (fixed stale closure)
   */
  const logout = useCallback(async () => {
    updateAuthState({ isLoading: true });

    try {
      // Use refs to get current auth state (prevents stale closure)
      const currentState = authStateRef.current;

      // Call logout API if authenticated
      if (currentState.isAuthenticated && currentState.token) {
        try {
          console.info('[Auth] Attempting logout', { userId: currentState.user?.id });
          const response = await apiAdapter.v2Request("auth", "auth:logout", {});
          console.debug('[Auth] Logout response received', { response });
        } catch (err) {
          console.warn('[Auth] Logout API error', err);
        }
      }
    } catch (error) {
      console.error('[Auth] Logout error', error);
    }

    // Always clear local state
    tokenStorage.clearToken();
    merkosAuthCookie.clearToken();
    apiAdapter.clearAuth();

    // Reset verification flags to allow re-authentication
    verificationAttemptedRef.current = false;
    lastVerifiedTokenRef.current = null;

    updateAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
      isLoading: false,
      isInitialized: false, // Reset initialization flag to allow fresh auth check
      needsBearerToken: false,
      hasMerkosBearerToken: false,
      merkosTokenVerified: false,
      isValuAuthenticated: false,
      valuUserId: null,
    });
  }, [updateAuthState, apiAdapter]); // Remove authState from dependencies to prevent stale closure

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    updateAuthState({ error: null });
  }, [updateAuthState]);

  /**
   * Set Valu user data (for Valu authentication)
   * IMPORTANT: This preserves existing Merkos token if present
   */
  const setValuUser = useCallback((user: any) => {
    console.info('[Auth] Setting Valu user data', {
      userId: user?.id,
      valuUserId: user?.valuUserId,
      displayName: user?.displayName,
      preservingMerkosToken: !!authStateRef.current.hasMerkosBearerToken
    });

    // If we already have a Merkos token, preserve it
    // Otherwise, update to indicate we're using Valu auth
    if (authStateRef.current.hasMerkosBearerToken) {
      // Preserve Merkos authentication, MERGE Valu user data
      updateAuthState({
        isAuthenticated: true,
        user: {
          ...authStateRef.current.user, // Keep existing Merkos user data
          // Merge in Valu user data (name, displayName, etc.)
          ...(user?.name && { name: user.name }),
          ...(user?.displayName && { displayName: user.displayName }),
          ...(user?.email && { email: user.email }),
          ...(user?.profile && { profile: user.profile })
        },
        error: null,
        isLoading: false,
        // Preserve Merkos token state
        // token, hasMerkosBearerToken, merkosTokenVerified remain unchanged
        // Add Valu authentication
        isValuAuthenticated: true,
        valuUserId: user?.valuUserId || user?.id
      });
    } else {
      // No Merkos token, use Valu auth only
      updateAuthState({
        isAuthenticated: true,
        user: user,
        token: null, // Valu auth doesn't use tokens in the same way
        error: null,
        isLoading: false,
        needsBearerToken: false,
        hasMerkosBearerToken: false, // Valu auth doesn't provide Merkos token
        merkosTokenVerified: false,
        isValuAuthenticated: true,
        valuUserId: user?.valuUserId || user?.id
      });
    }
  }, [updateAuthState]);

  /**
   * Clear Valu user data
   */
  const clearValuUser = useCallback(() => {
    console.info('[Auth] Clearing Valu user data');

    updateAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
      isLoading: false,
      needsBearerToken: false,
      hasMerkosBearerToken: false,
      merkosTokenVerified: false,
      isValuAuthenticated: false,
      valuUserId: null
    });
  }, [updateAuthState]);

  const contextValue: AuthContextType = {
    ...authState,
    loginWithBearerToken,
    loginWithCredentials,
    loginWithGoogle,
    loginWithChabadOrg,
    loginWithCDSSO,
    logout,
    clearError,
    // Valu authentication support
    setValuUser,
    clearValuUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// ============================================================================
// Auth Hook
// ============================================================================

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ============================================================================
// Exports
// ============================================================================

export { AuthContext };
export default AuthContext;
