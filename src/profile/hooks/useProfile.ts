/**
 * useProfile Hook
 *
 * React hook for profile management
 */

import { useProfileContext } from '../context/ProfileContext.js';
import type { Profile, ProfileUpdatePayload } from '../types.js';

/**
 * Profile hook return value
 */
export interface UseProfileReturn {
  /** Current profile data */
  profile: Profile | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether profile is initialized */
  isInitialized: boolean;
  /** Last sync timestamp */
  lastSync: Date | null;
  /** Load profile */
  loadProfile: () => Promise<void>;
  /** Update profile */
  updateProfile: (updates: ProfileUpdatePayload) => Promise<void>;
  /** Set metadata field */
  setMetadata: (key: string, value: any) => Promise<void>;
  /** Delete metadata field */
  deleteMetadata: (key: string) => Promise<void>;
  /** Refresh profile from server */
  refreshProfile: () => Promise<void>;
  /** Clear profile state */
  clearProfile: () => void;
}

/**
 * Hook for profile management
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     profile,
 *     isLoading,
 *     updateProfile,
 *     setMetadata
 *   } = useProfile();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h1>{profile?.displayName}</h1>
 *       <button onClick={() => updateProfile({ displayName: 'New Name' })}>
 *         Update Name
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProfile(): UseProfileReturn {
  const context = useProfileContext();

  return {
    profile: context.profile,
    isLoading: context.isLoading,
    error: context.error,
    isInitialized: context.isInitialized,
    lastSync: context.lastSync,
    loadProfile: context.loadProfile,
    updateProfile: context.updateProfile,
    setMetadata: context.setMetadata,
    deleteMetadata: context.deleteMetadata,
    refreshProfile: context.refreshProfile,
    clearProfile: context.clearProfile,
  };
}
