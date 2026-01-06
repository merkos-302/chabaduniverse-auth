/**
 * useAppData Hook
 *
 * React hook for app-specific data storage
 */

import { useAppDataContext } from '../context/AppDataContext.js';
import type { AppData } from '../types.js';

/**
 * App data hook return value
 */
export interface UseAppDataReturn {
  /** Get data for namespace */
  getData: (namespace: string) => AppData | null;
  /** Set data for namespace */
  setData: (namespace: string, data: Record<string, any>, version?: number) => Promise<void>;
  /** Update data for namespace (merge) */
  updateData: (namespace: string, updates: Record<string, any>) => Promise<void>;
  /** Delete data for namespace */
  deleteData: (namespace: string) => Promise<void>;
  /** Load all app data */
  loadAllData: () => Promise<void>;
  /** Clear all app data */
  clearAllData: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook for app-specific data storage
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { getData, setData, updateData } = useAppData();
 *
 *   const settings = getData('settings');
 *
 *   return (
 *     <div>
 *       <button onClick={() => setData('settings', { theme: 'dark' })}>
 *         Save Settings
 *       </button>
 *       <button onClick={() => updateData('settings', { language: 'en' })}>
 *         Update Language
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAppData(): UseAppDataReturn {
  const context = useAppDataContext();

  return {
    getData: context.getData,
    setData: context.setData,
    updateData: context.updateData,
    deleteData: context.deleteData,
    loadAllData: context.loadAllData,
    clearAllData: context.clearAllData,
    isLoading: context.isLoading,
    error: context.error,
  };
}
