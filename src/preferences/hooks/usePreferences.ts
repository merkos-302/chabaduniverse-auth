/**
 * usePreferences Hook
 *
 * React hook for user preferences management
 */

import { usePreferencesContext } from '../context/PreferencesContext.js';
import type { Preferences, PreferencesUpdatePayload } from '../types.js';

/**
 * Preferences hook return value
 */
export interface UsePreferencesReturn {
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
  /** Load preferences */
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
 * Hook for user preferences management
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     preferences,
 *     isLoading,
 *     updatePreferences,
 *     addFavoriteApp
 *   } = usePreferences();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h1>Theme: {preferences?.theme}</h1>
 *       <button onClick={() => updatePreferences({ theme: 'dark' })}>
 *         Switch to Dark Mode
 *       </button>
 *       <button onClick={() => addFavoriteApp('calendar')}>
 *         Add Calendar to Favorites
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePreferences(): UsePreferencesReturn {
  const context = usePreferencesContext();

  return {
    preferences: context.preferences,
    isLoading: context.isLoading,
    error: context.error,
    isInitialized: context.isInitialized,
    lastSync: context.lastSync,
    loadPreferences: context.loadPreferences,
    updatePreferences: context.updatePreferences,
    addFavoriteApp: context.addFavoriteApp,
    removeFavoriteApp: context.removeFavoriteApp,
    updateWidgetOrder: context.updateWidgetOrder,
    toggleSection: context.toggleSection,
    setCustomSetting: context.setCustomSetting,
    deleteCustomSetting: context.deleteCustomSetting,
    refreshPreferences: context.refreshPreferences,
    clearPreferences: context.clearPreferences,
  };
}
