/**
 * App Data Context
 *
 * React context for app-specific data storage with versioning
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type {
  AppData,
  AppDataState,
  AppDataContextValue,
} from '../types.js';
import type { AppDataConfig } from '../../config/index.js';

/**
 * App Data Context
 */
const AppDataContext = createContext<AppDataContextValue | null>(null);

/**
 * App Data Provider Props
 */
export interface AppDataProviderProps {
  children: React.ReactNode;
  /** User ID */
  userId: string;
  /** App ID */
  appId: string;
  /** App data configuration */
  config: AppDataConfig;
  /** API base URL */
  apiBaseUrl?: string;
}

/**
 * App Data Provider Component
 */
export function AppDataProvider({
  children,
  userId,
  appId,
  config,
  apiBaseUrl = '',
}: AppDataProviderProps): JSX.Element {
  // State
  const [state, setState] = useState<AppDataState>({
    dataByNamespace: new Map(),
    isLoading: false,
    error: null,
    isInitialized: false,
  });

  /**
   * Get data for namespace
   */
  const getData = useCallback(
    (namespace: string): AppData | null => {
      return state.dataByNamespace.get(namespace) || null;
    },
    [state.dataByNamespace]
  );

  /**
   * Set data for namespace
   */
  const setData = useCallback(
    async (namespace: string, data: Record<string, any>, version?: number): Promise<void> => {
      if (!config.enabled) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${apiBaseUrl}/api/app-data/${userId}/${appId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            namespace,
            data,
            version: config.enableVersioning ? version : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to set app data: ${response.statusText}`);
        }

        const result = await response.json();
        const appData: AppData = result.data;

        setState((prev) => {
          const newMap = new Map(prev.dataByNamespace);
          newMap.set(namespace, appData);
          return {
            dataByNamespace: newMap,
            isLoading: false,
            error: null,
            isInitialized: true,
          };
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    [config.enabled, config.enableVersioning, userId, appId, apiBaseUrl]
  );

  /**
   * Update data for namespace (merge)
   */
  const updateData = useCallback(
    async (namespace: string, updates: Record<string, any>): Promise<void> => {
      const existingData = getData(namespace);
      const mergedData = {
        ...(existingData?.data || {}),
        ...updates,
      };
      await setData(namespace, mergedData, existingData?.version);
    },
    [getData, setData]
  );

  /**
   * Delete data for namespace
   */
  const deleteData = useCallback(
    async (namespace: string): Promise<void> => {
      if (!config.enabled) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/app-data/${userId}/${appId}/${namespace}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete app data: ${response.statusText}`);
        }

        setState((prev) => {
          const newMap = new Map(prev.dataByNamespace);
          newMap.delete(namespace);
          return {
            dataByNamespace: newMap,
            isLoading: false,
            error: null,
            isInitialized: true,
          };
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    [config.enabled, userId, appId, apiBaseUrl]
  );

  /**
   * Load all app data
   */
  const loadAllData = useCallback(async (): Promise<void> => {
    if (!config.enabled) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/app-data/${userId}/${appId}`);
      if (!response.ok) {
        throw new Error(`Failed to load app data: ${response.statusText}`);
      }

      const result = await response.json();
      const dataArray: AppData[] = result.data;

      const newMap = new Map<string, AppData>();
      dataArray.forEach((item) => {
        newMap.set(item.namespace, item);
      });

      setState({
        dataByNamespace: newMap,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        isInitialized: true,
      }));
    }
  }, [config.enabled, userId, appId, apiBaseUrl]);

  /**
   * Clear all app data
   */
  const clearAllData = useCallback((): void => {
    setState({
      dataByNamespace: new Map(),
      isLoading: false,
      error: null,
      isInitialized: false,
    });
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (config.enabled && userId && appId) {
      loadAllData();
    }
  }, [config.enabled, userId, appId, loadAllData]);

  // Context value
  const value: AppDataContextValue = {
    ...state,
    getData,
    setData,
    updateData,
    deleteData,
    loadAllData,
    clearAllData,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/**
 * Hook to use app data context
 */
export function useAppDataContext(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppDataContext must be used within AppDataProvider');
  }
  return context;
}
