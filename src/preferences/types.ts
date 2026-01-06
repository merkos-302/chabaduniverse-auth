/**
 * Preferences Types
 *
 * Type definitions for user preferences and widget preferences
 */

import type { IPreferences } from '../database/models/Preferences.js';

/**
 * Theme preference
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Language preference
 */
export type Language = 'en' | 'he' | 'fr' | 'es' | 'ru';

/**
 * Dashboard layout
 */
export interface DashboardLayout {
  /** Array of favorite app IDs */
  favoriteApps: string[];
  /** Widget order */
  widgetOrder: string[];
  /** Collapsed sections */
  collapsedSections: string[];
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  /** Email notifications enabled */
  email: boolean;
  /** Push notifications enabled */
  push: boolean;
  /** In-app notifications enabled */
  inApp: boolean;
  /** Notification types to receive */
  types: string[];
}

/**
 * Widget position
 */
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Widget preferences
 */
export interface WidgetPreferences {
  /** Widget ID */
  widgetId: string;
  /** Widget visibility */
  visible: boolean;
  /** Widget position (for dashboard) */
  position?: WidgetPosition;
  /** Widget-specific settings */
  settings: Record<string, any>;
}

/**
 * User preferences (mirrors database model)
 */
export interface Preferences {
  userId: string;
  theme: Theme;
  language: Language;
  timezone: string;
  dashboard: DashboardLayout;
  notifications: NotificationPreferences;
  widgets: WidgetPreferences[];
  customSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preferences update payload
 */
export interface PreferencesUpdatePayload {
  theme?: Theme;
  language?: Language;
  timezone?: string;
  dashboard?: Partial<DashboardLayout>;
  notifications?: Partial<NotificationPreferences>;
  customSettings?: Record<string, any>;
}

/**
 * Widget preferences update payload
 */
export interface WidgetPreferencesUpdatePayload {
  visible?: boolean;
  position?: WidgetPosition;
  settings?: Record<string, any>;
}

/**
 * Preferences state
 */
export interface PreferencesState {
  /** Current preferences data */
  preferences: Preferences | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether preferences are initialized */
  isInitialized: boolean;
  /** Last sync timestamp */
  lastSync: Date | null;
}

/**
 * Preferences context value
 */
export interface PreferencesContextValue extends PreferencesState {
  /** Load preferences for current user */
  loadPreferences: () => Promise<void>;
  /** Update preferences */
  updatePreferences: (updates: PreferencesUpdatePayload) => Promise<void>;
  /** Add favorite app */
  addFavoriteApp: (appId: string) => Promise<void>;
  /** Remove favorite app */
  removeFavoriteApp: (appId: string) => Promise<void>;
  /** Update widget order */
  updateWidgetOrder: (widgetIds: string[]) => Promise<void>;
  /** Toggle section collapsed state */
  toggleSection: (sectionId: string) => Promise<void>;
  /** Set custom setting */
  setCustomSetting: (key: string, value: any) => Promise<void>;
  /** Delete custom setting */
  deleteCustomSetting: (key: string) => Promise<void>;
  /** Refresh preferences from server */
  refreshPreferences: () => Promise<void>;
  /** Clear preferences state */
  clearPreferences: () => void;
}

/**
 * Widget preferences context value
 */
export interface WidgetPreferencesContextValue {
  /** Get widget preferences */
  getWidgetPreferences: (widgetId: string) => WidgetPreferences | null;
  /** Update widget preferences */
  updateWidgetPreferences: (
    widgetId: string,
    updates: WidgetPreferencesUpdatePayload
  ) => Promise<void>;
  /** Toggle widget visibility */
  toggleWidgetVisibility: (widgetId: string) => Promise<void>;
  /** Update widget position */
  updateWidgetPosition: (widgetId: string, position: WidgetPosition) => Promise<void>;
  /** Update widget settings */
  updateWidgetSettings: (widgetId: string, settings: Record<string, any>) => Promise<void>;
}

/**
 * Preferences API response
 */
export interface PreferencesApiResponse {
  success: boolean;
  data?: IPreferences;
  error?: string;
}

/**
 * Preferences cache entry
 */
export interface PreferencesCacheEntry {
  preferences: Preferences;
  timestamp: number;
}
