/**
 * Preferences Context
 *
 * React context for user preferences and widget preferences management
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
  Preferences,
  PreferencesUpdatePayload,
  PreferencesState,
  PreferencesContextValue,
  WidgetPreferencesContextValue,
  WidgetPreferences,
  WidgetPreferencesUpdatePayload,
  WidgetPosition,
  PreferencesCacheEntry,
} from '../types.js';
import type { PreferencesConfig } from '../../config/index.js';

/**
 * Preferences Context
 */
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * Widget Preferences Context
 */
const WidgetPreferencesContext = createContext<WidgetPreferencesContextValue | null>(null);

/**
 * Preferences Provider Props
 */
export interface PreferencesProviderProps {
  children: React.ReactNode;
  /** User ID */
  userId: string;
  /** Preferences configuration */
  config: PreferencesConfig;
  /** API base URL */
  apiBaseUrl?: string;
  /** Callback when preferences load */
  onPreferencesLoad?: (preferences: Preferences) => void;
  /** Callback when preferences update */
  onPreferencesUpdate?: (preferences: Preferences) => void;
}

/**
 * Preferences Provider Component
 */
export function PreferencesProvider({
  children,
  userId,
  config,
  apiBaseUrl = '',
  onPreferencesLoad,
  onPreferencesUpdate,
}: PreferencesProviderProps): JSX.Element {
  // State
  const [state, setState] = useState<PreferencesState>({
    preferences: null,
    isLoading: false,
    error: null,
    isInitialized: false,
    lastSync: null,
  });

  // Cache ref
  const cacheRef = useRef<PreferencesCacheEntry | null>(null);

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
   * Get preferences from cache
   */
  const getFromCache = useCallback((): Preferences | null => {
    if (isCacheValid() && cacheRef.current) {
      return cacheRef.current.preferences;
    }
    return null;
  }, [isCacheValid]);

  /**
   * Save preferences to cache
   */
  const saveToCache = useCallback((preferences: Preferences): void => {
    if (config.enableCache) {
      cacheRef.current = {
        preferences,
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
   * Load preferences from API or cache
   */
  const loadPreferences = useCallback(async (): Promise<void> => {
    if (!config.enabled) {
      return;
    }

    // Check cache first
    const cachedPreferences = getFromCache();
    if (cachedPreferences) {
      setState((prev) => ({
        ...prev,
        preferences: cachedPreferences,
        isInitialized: true,
      }));
      return;
    }

    // Fetch from API
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/preferences/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to load preferences: ${response.statusText}`);
      }

      const data = await response.json();
      const preferences: Preferences = data.preferences;

      // Save to cache
      saveToCache(preferences);

      setState({
        preferences,
        isLoading: false,
        error: null,
        isInitialized: true,
        lastSync: new Date(),
      });

      onPreferencesLoad?.(preferences);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        isInitialized: true,
      }));
    }
  }, [config.enabled, userId, apiBaseUrl, getFromCache, saveToCache, onPreferencesLoad]);

  /**
   * Update preferences
   */
  const updatePreferences = useCallback(
    async (updates: PreferencesUpdatePayload): Promise<void> => {
      if (!config.enabled) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${apiBaseUrl}/api/preferences/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update preferences: ${response.statusText}`);
        }

        const data = await response.json();
        const updatedPreferences: Preferences = data.preferences;

        // Save to cache
        saveToCache(updatedPreferences);

        setState({
          preferences: updatedPreferences,
          isLoading: false,
          error: null,
          isInitialized: true,
          lastSync: new Date(),
        });

        onPreferencesUpdate?.(updatedPreferences);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    [config.enabled, userId, apiBaseUrl, saveToCache, onPreferencesUpdate]
  );

  /**
   * Add favorite app
   */
  const addFavoriteApp = useCallback(
    async (appId: string): Promise<void> => {
      if (!state.preferences) {
        throw new Error('No preferences loaded');
      }

      const favoriteApps = [...state.preferences.dashboard.favoriteApps];
      if (!favoriteApps.includes(appId)) {
        favoriteApps.push(appId);
        await updatePreferences({
          dashboard: { favoriteApps },
        });
      }
    },
    [state.preferences, updatePreferences]
  );

  /**
   * Remove favorite app
   */
  const removeFavoriteApp = useCallback(
    async (appId: string): Promise<void> => {
      if (!state.preferences) {
        throw new Error('No preferences loaded');
      }

      const favoriteApps = state.preferences.dashboard.favoriteApps.filter(
        (id) => id !== appId
      );
      await updatePreferences({
        dashboard: { favoriteApps },
      });
    },
    [state.preferences, updatePreferences]
  );

  /**
   * Update widget order
   */
  const updateWidgetOrder = useCallback(
    async (widgetIds: string[]): Promise<void> => {
      await updatePreferences({
        dashboard: { widgetOrder: widgetIds },
      });
    },
    [updatePreferences]
  );

  /**
   * Toggle section collapsed state
   */
  const toggleSection = useCallback(
    async (sectionId: string): Promise<void> => {
      if (!state.preferences) {
        throw new Error('No preferences loaded');
      }

      const collapsedSections = [...state.preferences.dashboard.collapsedSections];
      const index = collapsedSections.indexOf(sectionId);

      if (index > -1) {
        collapsedSections.splice(index, 1);
      } else {
        collapsedSections.push(sectionId);
      }

      await updatePreferences({
        dashboard: { collapsedSections },
      });
    },
    [state.preferences, updatePreferences]
  );

  /**
   * Set custom setting
   */
  const setCustomSetting = useCallback(
    async (key: string, value: any): Promise<void> => {
      if (!state.preferences) {
        throw new Error('No preferences loaded');
      }

      const customSettings = {
        ...state.preferences.customSettings,
        [key]: value,
      };

      await updatePreferences({ customSettings });
    },
    [state.preferences, updatePreferences]
  );

  /**
   * Delete custom setting
   */
  const deleteCustomSetting = useCallback(
    async (key: string): Promise<void> => {
      if (!state.preferences) {
        throw new Error('No preferences loaded');
      }

      const customSettings = { ...state.preferences.customSettings };
      delete customSettings[key];

      await updatePreferences({ customSettings });
    },
    [state.preferences, updatePreferences]
  );

  /**
   * Refresh preferences from server (bypass cache)
   */
  const refreshPreferences = useCallback(async (): Promise<void> => {
    clearCache();
    await loadPreferences();
  }, [clearCache, loadPreferences]);

  /**
   * Clear preferences state
   */
  const clearPreferences = useCallback((): void => {
    clearCache();
    setState({
      preferences: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      lastSync: null,
    });
  }, [clearCache]);

  // Initialize on mount
  useEffect(() => {
    if (config.enabled && userId) {
      loadPreferences();
    }
  }, [config.enabled, userId, loadPreferences]);

  // Preferences context value
  const preferencesValue: PreferencesContextValue = {
    ...state,
    loadPreferences,
    updatePreferences,
    addFavoriteApp,
    removeFavoriteApp,
    updateWidgetOrder,
    toggleSection,
    setCustomSetting,
    deleteCustomSetting,
    refreshPreferences,
    clearPreferences,
  };

  // Widget preferences context value
  const widgetPreferencesValue: WidgetPreferencesContextValue = {
    getWidgetPreferences: (widgetId: string): WidgetPreferences | null => {
      if (!state.preferences) {
        return null;
      }
      return state.preferences.widgets.find((w) => w.widgetId === widgetId) || null;
    },

    updateWidgetPreferences: async (
      widgetId: string,
      updates: WidgetPreferencesUpdatePayload
    ): Promise<void> => {
      if (!state.preferences) {
        throw new Error('No preferences loaded');
      }

      const widgets = [...state.preferences.widgets];
      const widgetIndex = widgets.findIndex((w) => w.widgetId === widgetId);

      if (widgetIndex > -1) {
        // Update existing widget
        const existingWidget = widgets[widgetIndex];
        if (existingWidget) {
          const updatedWidget: WidgetPreferences = {
            widgetId: existingWidget.widgetId,
            visible: updates.visible !== undefined ? updates.visible : existingWidget.visible,
            settings: {
              ...existingWidget.settings,
              ...updates.settings,
            },
          };
          if (updates.position !== undefined) {
            updatedWidget.position = updates.position;
          } else if (existingWidget.position) {
            updatedWidget.position = existingWidget.position;
          }
          widgets[widgetIndex] = updatedWidget;
        }
      } else {
        // Add new widget preferences
        const newWidget: WidgetPreferences = {
          widgetId,
          visible: updates.visible ?? true,
          settings: updates.settings || {},
        };
        if (updates.position) {
          newWidget.position = updates.position;
        }
        widgets.push(newWidget);
      }

      // Update preferences via API
      const response = await fetch(`${apiBaseUrl}/api/preferences/${userId}/widgets`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ widgets }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update widget preferences: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedPreferences: Preferences = data.preferences;

      // Save to cache
      saveToCache(updatedPreferences);

      setState({
        preferences: updatedPreferences,
        isLoading: false,
        error: null,
        isInitialized: true,
        lastSync: new Date(),
      });

      onPreferencesUpdate?.(updatedPreferences);
    },

    toggleWidgetVisibility: async (widgetId: string): Promise<void> => {
      const widget = widgetPreferencesValue.getWidgetPreferences(widgetId);
      await widgetPreferencesValue.updateWidgetPreferences(widgetId, {
        visible: !widget?.visible,
      });
    },

    updateWidgetPosition: async (
      widgetId: string,
      position: WidgetPosition
    ): Promise<void> => {
      await widgetPreferencesValue.updateWidgetPreferences(widgetId, { position });
    },

    updateWidgetSettings: async (
      widgetId: string,
      settings: Record<string, any>
    ): Promise<void> => {
      await widgetPreferencesValue.updateWidgetPreferences(widgetId, { settings });
    },
  };

  return (
    <PreferencesContext.Provider value={preferencesValue}>
      <WidgetPreferencesContext.Provider value={widgetPreferencesValue}>
        {children}
      </WidgetPreferencesContext.Provider>
    </PreferencesContext.Provider>
  );
}

/**
 * Hook to use preferences context
 */
export function usePreferencesContext(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
}

/**
 * Hook to use widget preferences context
 */
export function useWidgetPreferencesContext(): WidgetPreferencesContextValue {
  const context = useContext(WidgetPreferencesContext);
  if (!context) {
    throw new Error(
      'useWidgetPreferencesContext must be used within PreferencesProvider'
    );
  }
  return context;
}
