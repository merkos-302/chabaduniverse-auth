/**
 * useIdentity Hook
 *
 * React hook for accessing Universe Identity from the Universe Portal Auth API.
 * Provides methods to fetch identity, link Merkos accounts, and logout.
 *
 * @packageDocumentation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  UniverseIdentity,
  IdentityHookState,
  LinkMerkosResponse,
} from '../types/identity';
import {
  apiRequest,
  buildFetchOptions,
  getIdentityHooksConfig,
  removeStoredToken,
} from './config';

/**
 * API response for /api/auth/me endpoint
 */
interface MeResponse {
  identity: UniverseIdentity;
  token?: string;
}

/**
 * API response for /api/auth/logout endpoint
 */
interface LogoutResponse {
  success: boolean;
  message?: string;
}

/**
 * Return type for the useIdentity hook
 */
export interface UseIdentityReturn extends IdentityHookState {
  /**
   * Refresh the identity from the API
   * @returns Promise resolving to the refreshed identity or null on error
   */
  refresh: () => Promise<UniverseIdentity | null>;

  /**
   * Link a Merkos account to the current identity
   * @param merkosToken - JWT token from Merkos authentication
   * @returns Promise resolving to the link response
   */
  linkMerkos: (merkosToken: string) => Promise<LinkMerkosResponse>;

  /**
   * Logout and clear the session
   * @returns Promise resolving when logout is complete
   */
  logout: () => Promise<void>;

  /**
   * Whether the user is authenticated (convenience property)
   */
  isAuthenticated: boolean;
}

/**
 * useIdentity Hook
 *
 * Provides access to the current user's Universe Identity with methods
 * for identity management including Merkos account linking and logout.
 *
 * @param autoFetch - Whether to automatically fetch identity on mount (default: true)
 * @returns Identity state and methods
 *
 * @example
 * ```tsx
 * import { useIdentity } from '@chabaduniverse/auth';
 *
 * function UserProfile() {
 *   const { identity, isLoading, error, linkMerkos, logout } = useIdentity();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!identity) return <div>Not authenticated</div>;
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {identity.displayName}</h1>
 *       <p>Email: {identity.email}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With Merkos account linking
 * function LinkMerkosAccount() {
 *   const { identity, linkMerkos } = useIdentity();
 *
 *   const handleLink = async (token: string) => {
 *     const result = await linkMerkos(token);
 *     if (result.success) {
 *       console.log('Merkos account linked!');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {identity?.merkosUserId ? (
 *         <p>Merkos account linked</p>
 *       ) : (
 *         <button onClick={() => handleLink('merkos-jwt-token')}>
 *           Link Merkos Account
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIdentity(autoFetch: boolean = true): UseIdentityReturn {
  const [identity, setIdentity] = useState<UniverseIdentity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  // Track if initial fetch has been attempted
  const fetchAttemptedRef = useRef<boolean>(false);

  /**
   * Fetch the current user's identity from the API
   */
  const fetchIdentity = useCallback(async (): Promise<UniverseIdentity | null> => {
    if (!isMountedRef.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<MeResponse>(
        '/api/auth/me',
        buildFetchOptions('GET')
      );

      if (!isMountedRef.current) return null;

      setIdentity(response.identity);

      // Notify auth state change if configured
      const config = getIdentityHooksConfig();
      if (config.onAuthStateChange) {
        config.onAuthStateChange(true);
      }

      return response.identity;
    } catch (err) {
      if (!isMountedRef.current) return null;

      const fetchError = err instanceof Error ? err : new Error('Failed to fetch identity');

      // 401/403 means not authenticated - not necessarily an error
      if ((err as any).status === 401 || (err as any).status === 403) {
        setIdentity(null);
        setError(null);

        // Notify auth state change if configured
        const config = getIdentityHooksConfig();
        if (config.onAuthStateChange) {
          config.onAuthStateChange(false);
        }

        return null;
      }

      setError(fetchError);
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Link a Merkos account to the current identity
   */
  const linkMerkos = useCallback(async (merkosToken: string): Promise<LinkMerkosResponse> => {
    if (!isMountedRef.current) {
      return { success: false, error: 'Component unmounted' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<LinkMerkosResponse>(
        '/api/auth/link-merkos',
        buildFetchOptions('POST', { merkosToken })
      );

      if (!isMountedRef.current) {
        return { success: false, error: 'Component unmounted' };
      }

      if (response.success && response.identity) {
        setIdentity(response.identity);
      }

      return response;
    } catch (err) {
      if (!isMountedRef.current) {
        return { success: false, error: 'Component unmounted' };
      }

      const linkError = err instanceof Error ? err : new Error('Failed to link Merkos account');
      setError(linkError);

      return {
        success: false,
        error: linkError.message,
      };
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Logout and clear the session
   */
  const logout = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      await apiRequest<LogoutResponse>(
        '/api/auth/logout',
        buildFetchOptions('POST')
      );
    } catch (err) {
      // Log but don't throw - we still want to clear local state
      console.warn('[useIdentity] Logout API call failed:', err);
    }

    // Always clear local state regardless of API response
    removeStoredToken();

    if (isMountedRef.current) {
      setIdentity(null);
      setIsLoading(false);

      // Notify auth state change if configured
      const config = getIdentityHooksConfig();
      if (config.onAuthStateChange) {
        config.onAuthStateChange(false);
      }
    }
  }, []);

  /**
   * Auto-fetch identity on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (autoFetch && !fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true;
      fetchIdentity();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoFetch, fetchIdentity]);

  return {
    identity,
    isLoading,
    error,
    isAuthenticated: identity !== null,
    refresh: fetchIdentity,
    linkMerkos,
    logout,
  };
}

export default useIdentity;
