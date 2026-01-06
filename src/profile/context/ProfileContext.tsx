/**
 * Profile Context
 *
 * React context for profile management with local caching
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type {
  Profile,
  ProfileUpdatePayload,
  ProfileState,
  ProfileContextValue,
  ProfileCacheEntry,
} from '../types.js';
import type { ProfileConfig } from '../../config/index.js';

/**
 * Profile Context
 */
const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Profile Provider Props
 */
export interface ProfileProviderProps {
  children: React.ReactNode;
  /** User ID */
  userId: string;
  /** Profile configuration */
  config: ProfileConfig;
  /** API base URL */
  apiBaseUrl?: string;
  /** Callback when profile loads */
  onProfileLoad?: (profile: Profile) => void;
  /** Callback when profile updates */
  onProfileUpdate?: (profile: Profile) => void;
}

/**
 * Profile Provider Component
 */
export function ProfileProvider({
  children,
  userId,
  config,
  apiBaseUrl = '',
  onProfileLoad,
  onProfileUpdate,
}: ProfileProviderProps): JSX.Element {
  // State
  const [state, setState] = useState<ProfileState>({
    profile: null,
    isLoading: false,
    error: null,
    isInitialized: false,
    lastSync: null,
  });

  // Cache ref
  const cacheRef = useRef<ProfileCacheEntry | null>(null);

  /**
   * Check if cache is valid
   */
  const isCacheValid = useCallback((): boolean => {
    if (!config.enableCache || !cacheRef.current) {
      return false;
    }
    const now = Date.now();
    const cacheAge = now - cacheRef.current.timestamp;
    return cacheAge < config.cacheTTL;
  }, [config.enableCache, config.cacheTTL]);

  /**
   * Get profile from cache
   */
  const getFromCache = useCallback((): Profile | null => {
    if (isCacheValid() && cacheRef.current) {
      return cacheRef.current.profile;
    }
    return null;
  }, [isCacheValid]);

  /**
   * Save profile to cache
   */
  const saveToCache = useCallback((profile: Profile): void => {
    if (config.enableCache) {
      cacheRef.current = {
        profile,
        timestamp: Date.now(),
      };
    }
  }, [config.enableCache]);

  /**
   * Clear cache
   */
  const clearCache = useCallback((): void => {
    cacheRef.current = null;
  }, []);

  /**
   * Load profile from API or cache
   */
  const loadProfile = useCallback(async (): Promise<void> => {
    if (!config.enabled) {
      return;
    }

    // Check cache first
    const cachedProfile = getFromCache();
    if (cachedProfile) {
      setState((prev) => ({
        ...prev,
        profile: cachedProfile,
        isInitialized: true,
      }));
      return;
    }

    // Fetch from API
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/profile/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to load profile: ${response.statusText}`);
      }

      const data = await response.json();
      const profile: Profile = data.profile;

      // Save to cache
      saveToCache(profile);

      setState({
        profile,
        isLoading: false,
        error: null,
        isInitialized: true,
        lastSync: new Date(),
      });

      onProfileLoad?.(profile);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        isInitialized: true,
      }));
    }
  }, [config.enabled, userId, apiBaseUrl, getFromCache, saveToCache, onProfileLoad]);

  /**
   * Update profile
   */
  const updateProfile = useCallback(
    async (updates: ProfileUpdatePayload): Promise<void> => {
      if (!config.enabled) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${apiBaseUrl}/api/profile/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update profile: ${response.statusText}`);
        }

        const data = await response.json();
        const updatedProfile: Profile = data.profile;

        // Save to cache
        saveToCache(updatedProfile);

        setState({
          profile: updatedProfile,
          isLoading: false,
          error: null,
          isInitialized: true,
          lastSync: new Date(),
        });

        onProfileUpdate?.(updatedProfile);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    [config.enabled, userId, apiBaseUrl, saveToCache, onProfileUpdate]
  );

  /**
   * Set metadata field
   */
  const setMetadata = useCallback(
    async (key: string, value: any): Promise<void> => {
      if (!state.profile) {
        throw new Error('No profile loaded');
      }

      const updatedMetadata = {
        ...state.profile.metadata,
        [key]: value,
      };

      await updateProfile({ metadata: updatedMetadata });
    },
    [state.profile, updateProfile]
  );

  /**
   * Delete metadata field
   */
  const deleteMetadata = useCallback(
    async (key: string): Promise<void> => {
      if (!state.profile) {
        throw new Error('No profile loaded');
      }

      const updatedMetadata = { ...state.profile.metadata };
      delete updatedMetadata[key];

      await updateProfile({ metadata: updatedMetadata });
    },
    [state.profile, updateProfile]
  );

  /**
   * Refresh profile from server (bypass cache)
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    clearCache();
    await loadProfile();
  }, [clearCache, loadProfile]);

  /**
   * Clear profile state
   */
  const clearProfile = useCallback((): void => {
    clearCache();
    setState({
      profile: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      lastSync: null,
    });
  }, [clearCache]);

  // Initialize on mount
  useEffect(() => {
    if (config.enabled && userId) {
      loadProfile();
    }
  }, [config.enabled, userId, loadProfile]);

  // Context value
  const value: ProfileContextValue = {
    ...state,
    loadProfile,
    updateProfile,
    setMetadata,
    deleteMetadata,
    refreshProfile,
    clearProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

/**
 * Hook to use profile context
 */
export function useProfileContext(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within ProfileProvider');
  }
  return context;
}
