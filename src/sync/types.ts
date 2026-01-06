/**
 * Sync Types
 *
 * Type definitions for data synchronization
 */

import type { AdaptivePoller, PollerState } from './AdaptivePoller.js';

/**
 * Sync strategy type
 */
export type SyncStrategyType = 'profile' | 'preferences' | 'activity' | 'app-data' | 'custom';

/**
 * Sync strategy
 */
export interface SyncStrategy {
  /** Strategy name */
  name: SyncStrategyType;
  /** Sync function */
  sync: () => Promise<void>;
  /** Whether strategy is enabled */
  enabled: boolean;
}

/**
 * Sync state
 */
export interface SyncState {
  /** Whether sync is active */
  isActive: boolean;
  /** Current poller state */
  pollerState: PollerState;
  /** Last sync time */
  lastSync: Date | null;
  /** Total syncs completed */
  totalSyncs: number;
  /** Current interval */
  currentInterval: number;
}

/**
 * Sync manager options
 */
export interface SyncManagerOptions {
  /** Default polling interval (ms) */
  defaultInterval: number;
  /** Active interval (ms) */
  activeInterval: number;
  /** Idle interval (ms) */
  idleInterval: number;
  /** Idle timeout (ms) */
  idleTimeout: number;
  /** Sync strategies */
  strategies: SyncStrategy[];
  /** Callback on sync complete */
  onSyncComplete?: (strategy: SyncStrategyType) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export { AdaptivePoller, type PollerState };
