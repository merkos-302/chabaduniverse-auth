/**
 * Profile Types
 *
 * Type definitions for user profile management
 */

import type { IProfile } from '../database/models/Profile.js';

/**
 * Profile data interface (mirrors database model)
 */
export interface Profile {
  userId: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile update payload
 */
export interface ProfileUpdatePayload {
  displayName?: string;
  bio?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

/**
 * Profile state
 */
export interface ProfileState {
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
}

/**
 * Profile context value
 */
export interface ProfileContextValue extends ProfileState {
  /** Load profile for current user */
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
 * Profile API response
 */
export interface ProfileApiResponse {
  success: boolean;
  data?: IProfile;
  error?: string;
}

/**
 * Profile cache entry
 */
export interface ProfileCacheEntry {
  profile: Profile;
  timestamp: number;
}
