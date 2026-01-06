/**
 * useValuAuth Hook (Framework-Agnostic)
 *
 * Comprehensive Valu API authentication hook that integrates with the existing
 * Valu API adapter and AuthContext. This hook handles user authentication through
 * Valu Social, maps user data to portal format, and manages authentication state.
 *
 * Authentication Flow:
 * 1. Check if running in Valu Social iframe
 * 2. Wait for Valu API connection to be established
 * 3. Call getCurrentUser() from Valu API when connected
 * 4. Map Valu user data to portal user model
 * 5. Store user data in AuthContext
 * 6. Handle authentication state changes
 *
 * Features:
 * - Automatic user authentication when Valu API connects
 * - User data mapping from Valu format to portal format
 * - Integration with AuthContext for unified auth state
 * - Error handling with graceful degradation
 * - Development mode support with mock users
 * - Performance optimized with proper memoization
 * - Role mapping from Valu roles to portal roles
 * - Cookie-based authentication caching with 4-hour expiration
 */

import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getValuUser, setValuUser, clearValuUser, hasValuUser, refreshValuCache } from '../utils/cookies';
import type { ValuUserCache } from '../utils/cookies';

// ============================================================================
// Valu API Adapter Interface
// ============================================================================

/**
 * Valu API connection state
 */
export interface ValuAPIConnectionState {
  isConnected: boolean;
  isReady: boolean;
  isInIframe: boolean;
  isNavigatingApp: boolean;
}

/**
 * Valu API Adapter interface
 *
 * Provides access to Valu API functionality in a framework-agnostic way
 */
export interface ValuAPIAdapter {
  /**
   * Get current connection state
   */
  getConnectionState: () => ValuAPIConnectionState;

  /**
   * Get API instance by name
   */
  getApi: (apiName: string) => Promise<any>;

  /**
   * Run a console command
   */
  runConsoleCommand: (command: string) => Promise<any>;
}

/**
 * Valu API Context
 */
const ValuAPIContext = createContext<ValuAPIAdapter | null>(null);

/**
 * Valu API Provider component
 */
export const ValuAPIProvider: React.FC<{ adapter: ValuAPIAdapter; children: React.ReactNode }> = ({ adapter, children }) => {
  return <ValuAPIContext.Provider value={adapter}>{children}</ValuAPIContext.Provider>;
};

/**
 * Hook to access Valu API adapter
 */
export const useValuAPIAdapter = () => {
  const adapter = useContext(ValuAPIContext);
  if (!adapter) {
    throw new Error('useValuAPIAdapter must be used within a ValuAPIProvider');
  }
  return adapter;
};

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Valu user data structure (from Valu API)
 */
export interface ValuUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
  profile?: {
    displayName?: string;
    profileImage?: string;
    bio?: string;
  };
  network?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Portal user data structure (mapped from Valu user)
 */
export interface PortalUser {
  id: string;
  valuUserId: string;
  email?: string;
  name: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  roles: string[];
  permissions: string[];
  isValuAuthenticated: boolean;
  network?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
  createdAt?: string;
  lastLoginAt?: string;
}

/**
 * Authentication state (returns AuthContext state + Valu-specific state)
 */
export interface ValuAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: PortalUser | null;
  error: string | null;
  isValuConnected: boolean;
  isInValuFrame: boolean;
  authMethod: 'valu' | null;
}

/**
 * Hook return interface
 */
export interface UseValuAuthReturn extends ValuAuthState {
  login: () => Promise<PortalUser | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<PortalUser | null>;
  clearError: () => void;
  getUserIcon: (userId?: string, size?: number) => Promise<string | null>;
}

// ============================================================================
// User Data Mapping
// ============================================================================

/**
 * Map Valu roles to portal roles
 * Converts Valu Social roles to portal-compatible role structure
 */
const mapValuRolesToPortalRoles = (valuRoles: string[] = []): string[] => {
  const roleMapping: Record<string, string> = {
    'admin': 'admin',
    'administrator': 'admin',
    'super_admin': 'admin',
    'moderator': 'moderator',
    'mod': 'moderator',
    'community_manager': 'moderator',
    'member': 'user',
    'user': 'user',
    'basic': 'user',
    'premium': 'user',
    'verified': 'user'
  };

  const mappedRoles = valuRoles
    .map(role => roleMapping[role.toLowerCase()] || 'user')
    .filter((role, index, array) => array.indexOf(role) === index); // Remove duplicates

  // Ensure at least 'user' role
  if (mappedRoles.length === 0) {
    mappedRoles.push('user');
  }

  return mappedRoles;
};

/**
 * Map Valu user data to portal user format
 * Converts Valu API user structure to portal-compatible format
 */
export const mapValuUserToPortalUser = (valuUser: ValuUser): PortalUser => {
  const displayName = valuUser.profile?.displayName ||
                     valuUser.name ||
                     `${valuUser.firstName || ''} ${valuUser.lastName || ''}`.trim() ||
                     'Valu User';

  const portalUser: PortalUser = {
    id: `valu_${valuUser.id}`, // Prefix to distinguish from other auth methods
    valuUserId: valuUser.id,
    name: valuUser.name || displayName,
    displayName,
    roles: mapValuRolesToPortalRoles(valuUser.roles),
    permissions: valuUser.permissions || [],
    isValuAuthenticated: true,
    metadata: {
      ...valuUser.metadata,
      authMethod: 'valu',
      originalValuData: valuUser
    },
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  // Add optional properties only if defined
  if (valuUser.email !== undefined) portalUser.email = valuUser.email;
  if (valuUser.firstName !== undefined) portalUser.firstName = valuUser.firstName;
  if (valuUser.lastName !== undefined) portalUser.lastName = valuUser.lastName;

  const profileImage = valuUser.profile?.profileImage || valuUser.avatar;
  if (profileImage !== undefined) portalUser.profileImage = profileImage;

  if (valuUser.network !== undefined) portalUser.network = valuUser.network;

  return portalUser;
};

/**
 * Map PortalUser to ValuUserCache format for cookie storage
 * Converts portal user data to minimal cached format
 */
export const mapPortalUserToCache = (user: PortalUser): ValuUserCache => {
  const cache: ValuUserCache = {
    id: user.id,
    name: user.name,
    valuUserId: user.valuUserId,
    cachedAt: new Date().toISOString()
  };

  // Add optional properties only if defined
  if (user.displayName !== undefined) cache.displayName = user.displayName;
  if (user.email !== undefined) cache.email = user.email;
  if (user.profileImage !== undefined) cache.profileImage = user.profileImage;
  if (user.roles !== undefined) cache.roles = user.roles;
  if (user.network !== undefined) cache.network = user.network;

  return cache;
};

/**
 * Map ValuUserCache to PortalUser format
 * Converts cached data back to full portal user format
 */
export const mapCacheToPortalUser = (cachedUser: ValuUserCache): PortalUser => {
  const portalUser: PortalUser = {
    id: cachedUser.id,
    valuUserId: cachedUser.valuUserId,
    name: cachedUser.name,
    displayName: cachedUser.displayName || cachedUser.name,
    roles: cachedUser.roles || ['user'],
    permissions: [], // Not cached, will be refreshed on API call
    isValuAuthenticated: true,
    metadata: {
      authMethod: 'valu',
      fromCache: true,
      cachedAt: cachedUser.cachedAt
    },
    createdAt: cachedUser.cachedAt,
    lastLoginAt: cachedUser.cachedAt
  };

  // Add optional properties only if defined
  if (cachedUser.email !== undefined) portalUser.email = cachedUser.email;
  if (cachedUser.profileImage !== undefined) portalUser.profileImage = cachedUser.profileImage;
  if (cachedUser.network !== undefined) portalUser.network = cachedUser.network;

  return portalUser;
};


// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * useValuAuth Hook
 *
 * Provides comprehensive Valu API authentication with portal integration
 */
export const useValuAuth = (): UseValuAuthReturn => {
  // Get Valu API adapter from context
  const valuAdapter = useValuAPIAdapter();

  // Get connection state from adapter
  const {
    isConnected: isValuConnected,
    isReady: isValuReady,
    isInIframe,
    isNavigatingApp
  } = valuAdapter.getConnectionState();

  // Get Auth context (replaces SimpleAuthContext)
  const auth = useAuth();

  // Optimized cache for user icons with configurable duration
  const iconCacheRef = useRef<Map<string, { url: string; timestamp: number }>>(
    typeof Map !== 'undefined' ? new Map() : ({} as any)
  );
  const ICON_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Debounce map for icon requests to prevent rapid API calls
  const iconRequestsRef = useRef<Map<string, Promise<string | null>>>(
    typeof Map !== 'undefined' ? new Map() : ({} as any)
  );

  // Performance optimization: Throttle retry attempts
  const lastRetryAttemptRef = useRef<number>(0);
  const MIN_RETRY_INTERVAL = 3000; // Minimum 3 seconds between retry attempts

  // Get current user from Valu API using multiple fallback approaches
  const getValuCurrentUser = useCallback(async (): Promise<ValuUser | null> => {
    const { getApi, runConsoleCommand } = valuAdapter;

    if (!getApi || typeof getApi !== 'function') {
      console.debug('[ValuAuth] Valu API getApi not available');
      return null;
    }

    try {
      // Method 1: Try the recommended getApi approach first
      console.debug('[ValuAuth] Attempting getApi("users") approach');
      try {
        const usersApi = await getApi('users');
        if (usersApi && typeof usersApi.run === 'function') {
          console.debug('[ValuAuth] Calling usersApi.run("current")');
          const result = await usersApi.run('current');
          console.debug('[ValuAuth] usersApi.run("current") result:', result);

          if (result && (result.id || result.userId)) {
            return result as ValuUser;
          }
        }
      } catch (apiError: any) {
        console.warn('[ValuAuth] getApi approach failed, trying console command fallbacks', apiError);
      }

      // Method 1.5: Try auth-related APIs if users API fails
      try {
        const authApi = await getApi('auth');
        if (authApi && typeof authApi.run === 'function') {
          console.debug('[ValuAuth] Calling authApi.run("status") or authApi.run("current")');

          // Try different auth API methods
          const authMethods = ['current', 'status', 'user', 'me'];
          for (const method of authMethods) {
            try {
              const result = await authApi.run(method);
              console.debug(`[ValuAuth] authApi.run("${method}") result:`, result);

              if (result && (result.id || result.userId || result.user)) {
                // Handle nested user object
                const userData = result.user || result;
                if (userData && (userData.id || userData.userId)) {
                  return userData as ValuUser;
                }
              }
            } catch (methodError: any) {
              console.debug(`[ValuAuth] authApi.run("${method}") failed:`, methodError.message);
            }
          }
        }
      } catch (authApiError: any) {
        console.debug('[ValuAuth] Auth API approach failed:', authApiError.message);
      }

      // Method 2: Try multiple console command approaches
      if (runConsoleCommand && typeof runConsoleCommand === 'function') {
        const commands = [
          'users current',
          'user current',
          'user me',
          'auth user',
          'auth status',
          'auth current',
          'me',
          'whoami'
        ];

        for (const command of commands) {
          try {
            console.debug(`[ValuAuth] Trying console command: "${command}"`);
            const result = await runConsoleCommand(command);
            console.debug(`[ValuAuth] Command "${command}" result:`, result);

            if (result === null || result === undefined) {
              console.debug(`[ValuAuth] Command "${command}" returned null/undefined, trying next`);
              continue;
            }

            // Handle case where result is a string (JSON) that needs parsing
            let parsedResult = result;
            if (typeof result === 'string') {
              try {
                parsedResult = JSON.parse(result);
                console.debug(`[ValuAuth] Parsed JSON result from "${command}":`, parsedResult);
              } catch (_parseError) {
                console.debug(`[ValuAuth] Command "${command}" result not JSON, using as-is:`, { result });
                parsedResult = result as unknown as ValuUser;
              }
            }

            // Check if this looks like valid user data
            if (parsedResult && (parsedResult.id || parsedResult.userId || parsedResult.name || parsedResult.email)) {
              console.info(`[ValuAuth] Successfully got user data with command: "${command}"`);
              return parsedResult as ValuUser;
            }

            console.debug(`[ValuAuth] Command "${command}" didn't return valid user data, trying next`);
          } catch (commandError: any) {
            console.debug(`[ValuAuth] Command "${command}" failed:`, commandError.message);
            // Continue to next command
          }
        }

        console.warn('[ValuAuth] All console commands failed to return valid user data');
      }

      console.warn('[ValuAuth] No available methods to get current user');
      return null;

    } catch (error: any) {
      console.error('[ValuAuth] Failed to get current user from Valu API', error);
      return null;
    }
  }, [valuAdapter]);

  // Get user icon URL from Valu API with caching and debouncing
  const getUserIcon = useCallback(async (userId?: string, size: number = 32): Promise<string | null> => {
    const { runConsoleCommand } = valuAdapter;

    if (!runConsoleCommand || typeof runConsoleCommand !== 'function') {
      console.debug('[ValuAuth] Valu API runConsoleCommand not available for getUserIcon');
      return null;
    }

    try {
      // Use current user ID if none provided
      const targetUserId = userId || auth.valuUserId;
      if (!targetUserId) {
        console.debug('[ValuAuth] No user ID available for getUserIcon');
        return null;
      }

      console.debug('[ValuAuth] getUserIcon called', { targetUserId, size, hasRunCommand: !!runConsoleCommand });

      // Check cache first
      const cacheKey = `${targetUserId}-${size}`;
      const cached = iconCacheRef.current.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < ICON_CACHE_DURATION) {
        console.debug('[ValuAuth] Returning cached icon URL', { userId: targetUserId, size, url: cached.url });
        return cached.url;
      }

      // Check if there's already a pending request for this icon
      const requestKey = cacheKey;
      const existingRequest = iconRequestsRef.current.get(requestKey);
      if (existingRequest) {
        console.debug('[ValuAuth] Returning existing icon request promise', { userId: targetUserId, size });
        return existingRequest;
      }

      // Create new request promise
      const requestPromise = (async () => {
        try {
          // Call Valu API to get user icon
          const command = `users get-icon ${targetUserId} ${size}`;
          console.debug('[ValuAuth] Executing icon command', { command });

          const iconUrl = await runConsoleCommand(command);
          console.debug('[ValuAuth] Icon command response', { command, response: iconUrl, type: typeof iconUrl });

          // Handle different response formats
          if (iconUrl && typeof iconUrl === 'string' && iconUrl.startsWith('http')) {
            // Direct URL string
            iconCacheRef.current.set(cacheKey, {
              url: iconUrl,
              timestamp: Date.now()
            });

            console.info('[ValuAuth] User icon retrieved and cached', { userId: targetUserId, size, url: iconUrl });
            return iconUrl;
          } else if (iconUrl && typeof iconUrl === 'object' && iconUrl.url) {
            // Object with url property
            const url = iconUrl.url;
            iconCacheRef.current.set(cacheKey, {
              url,
              timestamp: Date.now()
            });

            console.info('[ValuAuth] User icon retrieved from object and cached', { userId: targetUserId, size, url });
            return url;
          } else {
            // No valid icon data
            console.debug('[ValuAuth] No valid icon URL returned from API', {
              userId: targetUserId,
              size,
              response: iconUrl,
              responseType: typeof iconUrl
            });
            return null;
          }
        } finally {
          // Clean up the request from the map
          iconRequestsRef.current.delete(requestKey);
        }
      })();

      // Store the promise to prevent duplicate requests
      iconRequestsRef.current.set(requestKey, requestPromise);

      return requestPromise;
    } catch (error: any) {
      console.error('[ValuAuth] Failed to get user icon from Valu API', error, { userId, size });
      return null;
    }
  }, [valuAdapter, auth.valuUserId]);

  // Local error state (only for Valu-specific errors)
  const [valuError, setValuError] = useState<string | null>(null);
  const [isValuLoading, setIsValuLoading] = useState<boolean>(isInIframe);

  // Track authentication state and retry behavior
  const authAttemptedRef = useRef(false);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastConnectionStateRef = useRef({ isConnected: isValuConnected, isReady: isValuReady });
  const cacheInitializedRef = useRef(false);

  // Refs for functions to prevent effect re-runs
  const authRef = useRef(auth);

  // Update refs when dependencies change
  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  /**
   * Initialize authentication from cache on mount
   * Checks for cached user data and sets it immediately for faster loading
   */
  useEffect(() => {
    if (cacheInitializedRef.current) return;
    cacheInitializedRef.current = true;

    // Only initialize cache if not already authenticated and we're in an iframe
    if (auth.isValuAuthenticated || !isInIframe) {
      console.debug('[ValuAuth] Skipping cache initialization', {
        isAlreadyAuthenticated: auth.isValuAuthenticated,
        isInIframe
      });
      return;
    }

    // Check for cached user data
    if (hasValuUser()) {
      const cachedUser = getValuUser();
      if (cachedUser) {
        console.info('[ValuAuth] Found cached Valu user, initializing auth state', {
          userId: cachedUser.id,
          name: cachedUser.name,
          cachedAt: cachedUser.cachedAt
        });

        // Convert cached data to portal user format
        const portalUser = mapCacheToPortalUser(cachedUser);

        // Set in AuthContext immediately for fast loading
        auth.setValuUser(portalUser);

        // Set loading to false since we have cached data
        setIsValuLoading(false);
      }
    }
  }, [auth.isValuAuthenticated, isInIframe, auth.setValuUser]);


  /**
   * Clear Valu-specific error
   */
  const clearError = useCallback(() => {
    setValuError(null);
  }, []);


  /**
   * Authenticate user with Valu API
   * Simplified approach following the working manual refresh pattern
   */
  const authenticateWithValu = useCallback(async (): Promise<PortalUser | null> => {
    try {
      console.info('[ValuAuth] Attempting Valu API authentication', {
        isConnected: isValuConnected,
        isReady: isValuReady,
        isInIframe,
        isNavigatingApp
      });

      // Don't try to authenticate if we're navigating to another app
      if (isNavigatingApp) {
        console.debug('[ValuAuth] Skipping authentication - app navigation in progress');
        return null;
      }

      setIsValuLoading(true);
      setValuError(null);

      // Check if Valu API is ready
      if (!isValuConnected || !isValuReady) {
        throw new Error('Valu API not connected or ready');
      }

      // Small delay to ensure API is fully ready (Valu API best practice)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get current user from Valu API (simplified - single call, no retry complexity)
      const valuUser = await getValuCurrentUser();

      if (!valuUser) {
        throw new Error('No user data received from Valu API');
      }

      // Map Valu user to portal format
      const portalUser = mapValuUserToPortalUser(valuUser);

      // Store in AuthContext (simplified - single approach)
      auth.setValuUser(portalUser);

      // Cache user data for future sessions
      try {
        const cacheData = mapPortalUserToCache(portalUser);
        setValuUser(cacheData);
        console.debug('[ValuAuth] User data cached successfully', {
          userId: portalUser.id,
          valuUserId: portalUser.valuUserId
        });
      } catch (cacheError) {
        console.warn('[ValuAuth] Failed to cache user data', cacheError);
        // Don't fail authentication if caching fails
      }

      // Update local loading state
      setIsValuLoading(false);
      setValuError(null);

      console.info('[ValuAuth] Valu authentication successful', {
        userId: portalUser.id,
        valuUserId: portalUser.valuUserId,
        displayName: portalUser.displayName,
        roles: portalUser.roles
      });

      return portalUser;

    } catch (error: any) {
      console.error('[ValuAuth] Valu authentication failed', error);
      setIsValuLoading(false);
      setValuError(error.message || 'Valu authentication failed');
      return null;
    }
  }, [isValuConnected, isValuReady, isInIframe, isNavigatingApp, getValuCurrentUser, auth]);

  /**
   * Clear authentication retry interval
   */
  const clearAuthRetryInterval = useCallback(() => {
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
      console.debug('[ValuAuth] Cleared authentication retry interval');
    }
  }, []);

  /**
   * Login function - attempts Valu authentication
   */
  const login = useCallback(async (): Promise<PortalUser | null> => {
    return await authenticateWithValu();
  }, [authenticateWithValu]);

  /**
   * Optimized periodic authentication retry with throttling
   */
  const startAuthRetryInterval = useCallback(() => {
    // Clear any existing interval first
    clearAuthRetryInterval();

    // Only start retry if in iframe and API is ready but not authenticated, and not navigating
    if (!isInIframe || !isValuConnected || !isValuReady || auth.isValuAuthenticated || isNavigatingApp) {
      return;
    }

    // Throttle retry start attempts
    const now = Date.now();
    if (now - lastRetryAttemptRef.current < MIN_RETRY_INTERVAL) {
      console.debug('[ValuAuth] Throttling retry start attempt');
      return;
    }
    lastRetryAttemptRef.current = now;

    console.info('[ValuAuth] Starting authentication retry interval', {
      isInIframe,
      isValuConnected,
      isValuReady,
      isAuthenticated: auth.isValuAuthenticated
    });

    retryIntervalRef.current = setInterval(async () => {
      try {
        // Double-check conditions before retry attempt
        if (!isValuConnected || !isValuReady || auth.isValuAuthenticated) {
          console.debug('[ValuAuth] Stopping retry: conditions no longer met', {
            isValuConnected,
            isValuReady,
            isAuthenticated: auth.isValuAuthenticated
          });
          clearAuthRetryInterval();
          return;
        }

        console.debug('[ValuAuth] Attempting periodic authentication retry');
        const portalUser = await authenticateWithValu();

        if (portalUser) {
          console.info('[ValuAuth] Periodic retry authentication successful', {
            userId: portalUser.id,
            valuUserId: portalUser.valuUserId,
            displayName: portalUser.displayName
          });
          // Stop retrying once successful
          clearAuthRetryInterval();
        }
      } catch (error: any) {
        console.debug('[ValuAuth] Periodic retry authentication failed, will continue retrying', {
          error: error.message
        });
        // Continue retrying on failure
      }
    }, 5000); // Retry every 5 seconds
  }, [isInIframe, isValuConnected, isValuReady, auth.isValuAuthenticated, isNavigatingApp, authenticateWithValu, clearAuthRetryInterval]);

  /**
   * Refresh user data from Valu API
   */
  const refreshUser = useCallback(async (): Promise<PortalUser | null> => {
    console.info('[ValuAuth] Refreshing user data from Valu API');

    // Stop any active retry interval during manual refresh
    clearAuthRetryInterval();

    // Reset authentication attempt flag to allow refresh
    authAttemptedRef.current = false;

    // Update connection state tracking to trigger retry if this fails
    lastConnectionStateRef.current = { isConnected: isValuConnected, isReady: isValuReady };

    const result = await login();

    // If successful, also refresh the cache timestamp to extend validity
    if (result) {
      try {
        refreshValuCache();
        console.debug('[ValuAuth] Cache timestamp refreshed after successful API refresh');
      } catch (cacheError) {
        console.warn('[ValuAuth] Failed to refresh cache timestamp', cacheError);
        // Don't fail the refresh if cache update fails
      }
    }

    // If refresh failed and we're in the right conditions, restart retry interval
    if (!result && isInIframe && isValuConnected && isValuReady && !auth.isValuAuthenticated) {
      console.debug('[ValuAuth] Manual refresh failed, restarting retry interval');
      startAuthRetryInterval();
    }

    return result;
  }, [login, clearAuthRetryInterval, isValuConnected, isValuReady, isInIframe, auth.isValuAuthenticated, startAuthRetryInterval]);

  /**
   * Logout function - clears user data and calls Auth logout
   */
  const logout = useCallback(async (): Promise<void> => {
    console.info('[ValuAuth] Logging out Valu user', {
      userId: auth.user?.id,
      wasAuthenticated: auth.isValuAuthenticated
    });

    try {
      // Stop any active retry interval
      clearAuthRetryInterval();

      // Clear local state first
      setIsValuLoading(false);
      setValuError(null);

      // Reset authentication attempt flag to prevent immediate re-authentication
      authAttemptedRef.current = false;

      // Clear Valu user data from AuthContext
      auth.clearValuUser();

      // Clear cached user data
      try {
        clearValuUser();
        console.debug('[ValuAuth] User cache cleared successfully');
      } catch (cacheError) {
        console.warn('[ValuAuth] Failed to clear user cache', cacheError);
        // Don't fail logout if cache clearing fails
      }

      console.info('[ValuAuth] Valu logout completed');

    } catch (error: any) {
      console.error('[ValuAuth] Error during Valu logout', error);

      // Even if logout fails, ensure local state is cleared
      clearAuthRetryInterval();
      setIsValuLoading(false);
      setValuError(null);
    }
  }, [auth, clearAuthRetryInterval]);

  /**
   * Optimized auto-authentication with debounced execution
   */
  useEffect(() => {
    if (!isInIframe) {
      setIsValuLoading(false);
      return;
    }

    // If already authenticated (either from cache or API), don't try again
    if (auth.isValuAuthenticated) {
      setIsValuLoading(false);
      return;
    }

    // Wait for cache initialization to complete first
    if (!cacheInitializedRef.current) {
      return;
    }

    // Wait for API to be ready before attempting authentication
    const timer = setTimeout(async () => {
      // Double-check that we're connected and ready
      if (!isValuConnected || !isValuReady) {
        console.debug('[ValuAuth] API not ready, skipping auto-authentication');
        React.startTransition(() => {
          setIsValuLoading(false);
        });
        return;
      }

      // Don't try to authenticate if we're navigating to another app
      if (isNavigatingApp) {
        console.debug('[ValuAuth] App navigation in progress, skipping auto-authentication');
        React.startTransition(() => {
          setIsValuLoading(false);
        });
        return;
      }

      console.debug('[ValuAuth] Attempting API authentication after cache check');

      try {
        const portalUser = await authenticateWithValu();
        React.startTransition(() => {
          if (portalUser) {
            console.info('[ValuAuth] API authentication successful', {
              displayName: portalUser.displayName,
              fromCache: !!portalUser.metadata?.fromCache
            });
          } else {
            console.debug('[ValuAuth] No user found via API');
          }
        });
      } catch (error) {
        console.debug('[ValuAuth] API authentication attempt failed', error);
      }

      React.startTransition(() => {
        setIsValuLoading(false);
      });
    }, 2000); // Reduced to 2 seconds for faster response

    return () => clearTimeout(timer);
  }, [isInIframe, auth.isValuAuthenticated, authenticateWithValu, isValuConnected, isValuReady, isNavigatingApp]);

  /**
   * Optimized cleanup on unmount to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      // Clear all timers and intervals
      clearAuthRetryInterval();

      // Clear icon cache to prevent memory leaks
      if (iconCacheRef.current && typeof iconCacheRef.current.clear === 'function') {
        iconCacheRef.current.clear();
      }
      if (iconRequestsRef.current && typeof iconRequestsRef.current.clear === 'function') {
        iconRequestsRef.current.clear();
      }

      console.debug('[ValuAuth] useValuAuth unmounting, all resources cleaned up');
    };
  }, [clearAuthRetryInterval]);


  /**
   * Highly optimized memoized return object to prevent unnecessary re-renders
   */
  const returnValue = useMemo<UseValuAuthReturn>(() => ({
    // Use AuthContext state as source of truth
    isLoading: isValuLoading || auth.isLoading,
    isAuthenticated: auth.isValuAuthenticated,
    user: auth.isValuAuthenticated ? auth.user : null,
    error: valuError || auth.error,
    isValuConnected,
    isInValuFrame: isInIframe,
    authMethod: auth.isValuAuthenticated ? 'valu' : null,
    // Actions
    login,
    logout,
    refreshUser,
    clearError,
    getUserIcon
  }), [
    isValuLoading,
    auth.isLoading,
    auth.isValuAuthenticated,
    auth.user,
    auth.error,
    valuError,
    isValuConnected,
    isInIframe,
    login,
    logout,
    refreshUser,
    clearError,
    getUserIcon
  ]);

  // Return memoized value to prevent unnecessary re-renders
  return returnValue;
};

export default useValuAuth;
