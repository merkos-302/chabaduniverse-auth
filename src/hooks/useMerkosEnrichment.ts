/**
 * useMerkosEnrichment Hook
 *
 * React hook for fetching Merkos organizational data from the Universe Portal Auth API.
 * Provides organizations, roles, and permissions data for the authenticated user.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useRef } from 'react';
import type {
  MerkosEnrichment,
  MerkosEnrichmentHookState,
} from '../types/identity';
import {
  apiRequest,
  buildFetchOptions,
} from './config';

/**
 * API response for /api/auth/enrich/merkos endpoint
 */
interface MerkosEnrichmentResponse {
  enrichment: MerkosEnrichment;
  fromCache?: boolean;
  expiresAt?: string;
}

/**
 * Return type for the useMerkosEnrichment hook
 */
export interface UseMerkosEnrichmentReturn extends MerkosEnrichmentHookState {
  /**
   * Fetch or refresh the Merkos enrichment data
   * @returns Promise resolving to the enrichment data or null on error
   */
  refresh: () => Promise<MerkosEnrichment | null>;

  /**
   * Clear the cached enrichment data
   */
  clear: () => void;

  /**
   * Whether enrichment data has been fetched
   */
  hasFetched: boolean;
}

/**
 * useMerkosEnrichment Hook
 *
 * Fetches organizational data from Merkos Platform including organizations,
 * roles, and permissions for the authenticated user.
 *
 * Unlike useIdentity, this hook does NOT auto-fetch on mount. Call `refresh()`
 * explicitly when you need the data to avoid unnecessary API calls.
 *
 * @returns Enrichment state and methods
 *
 * @example
 * ```tsx
 * import { useMerkosEnrichment } from '@chabaduniverse/auth';
 *
 * function OrganizationSelector() {
 *   const { enrichment, isLoading, error, refresh } = useMerkosEnrichment();
 *
 *   // Fetch enrichment data when component mounts
 *   useEffect(() => {
 *     refresh();
 *   }, [refresh]);
 *
 *   if (isLoading) return <div>Loading organizations...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!enrichment) return <div>No organization data</div>;
 *
 *   return (
 *     <div>
 *       <h2>Your Organizations</h2>
 *       <ul>
 *         {enrichment.organizations.map(org => (
 *           <li key={org.id}>{org.name}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Check permissions before rendering admin features
 * function AdminPanel() {
 *   const { enrichment } = useMerkosEnrichment();
 *
 *   const hasAdminAccess = enrichment?.permissions.includes('admin:access');
 *
 *   if (!hasAdminAccess) {
 *     return <div>Access denied</div>;
 *   }
 *
 *   return <div>Admin Panel Content</div>;
 * }
 * ```
 */
export function useMerkosEnrichment(): UseMerkosEnrichmentReturn {
  const [enrichment, setEnrichment] = useState<MerkosEnrichment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  /**
   * Fetch Merkos enrichment data from the API
   */
  const fetchEnrichment = useCallback(async (): Promise<MerkosEnrichment | null> => {
    if (!isMountedRef.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<MerkosEnrichmentResponse>(
        '/api/auth/enrich/merkos',
        buildFetchOptions('GET')
      );

      if (!isMountedRef.current) return null;

      // Add cache metadata to enrichment
      const enrichmentData: MerkosEnrichment = {
        ...response.enrichment,
        fetchedAt: new Date().toISOString(),
        ...(response.fromCache !== undefined && { fromCache: response.fromCache }),
        ...(response.expiresAt !== undefined && { expiresAt: response.expiresAt }),
      };

      setEnrichment(enrichmentData);
      setHasFetched(true);

      return enrichmentData;
    } catch (err) {
      if (!isMountedRef.current) return null;

      const fetchError = err instanceof Error ? err : new Error('Failed to fetch Merkos enrichment');

      // 401/403 means not authenticated or no Merkos link
      if ((err as any).status === 401 || (err as any).status === 403) {
        setEnrichment(null);
        setError(new Error('Not authenticated or Merkos account not linked'));
        setHasFetched(true);
        return null;
      }

      // 404 means no Merkos data available
      if ((err as any).status === 404) {
        setEnrichment(null);
        setError(null);
        setHasFetched(true);
        return null;
      }

      setError(fetchError);
      setHasFetched(true);
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Clear the cached enrichment data
   */
  const clear = useCallback((): void => {
    setEnrichment(null);
    setError(null);
    setHasFetched(false);
  }, []);

  // Cleanup on unmount
  // Note: Using useRef pattern instead of useEffect cleanup to avoid re-render issues
  if (typeof window !== 'undefined') {
    // Only set up cleanup in browser environment
    isMountedRef.current = true;
  }

  return {
    enrichment,
    isLoading,
    error,
    hasFetched,
    refresh: fetchEnrichment,
    clear,
  };
}

export default useMerkosEnrichment;
