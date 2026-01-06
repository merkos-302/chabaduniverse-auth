/**
 * App Data Types
 *
 * Type definitions for app-specific data storage
 */

import type { IAppData } from '../database/models/AppData.js';

/**
 * App data entry (mirrors database model)
 */
export interface AppData {
  userId: string;
  appId: string;
  namespace: string;
  data: Record<string, any>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * App data update payload
 */
export interface AppDataUpdatePayload {
  data: Record<string, any>;
  version?: number;
}

/**
 * App data state
 */
export interface AppDataState {
  /** App data by namespace */
  dataByNamespace: Map<string, AppData>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether initialized */
  isInitialized: boolean;
}

/**
 * App data context value
 */
export interface AppDataContextValue extends AppDataState {
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
}

/**
 * App data API response
 */
export interface AppDataApiResponse {
  success: boolean;
  data?: IAppData;
  error?: string;
}
