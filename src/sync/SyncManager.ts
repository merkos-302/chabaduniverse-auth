/**
 * Sync Manager
 *
 * Manages data synchronization using AdaptivePoller
 */

import { AdaptivePoller } from './AdaptivePoller.js';
import type {
  SyncStrategy,
  SyncStrategyType,
  SyncManagerOptions,
  SyncState,
} from './types.js';

/**
 * Sync Manager Class
 *
 * Coordinates multiple sync strategies with adaptive polling
 */
export class SyncManager {
  private poller: AdaptivePoller;
  private strategies: Map<SyncStrategyType, SyncStrategy>;
  private onSyncComplete?: (strategy: SyncStrategyType) => void;
  private onError?: (error: Error) => void;

  private lastSync: Date | null = null;
  private totalSyncs: number = 0;

  constructor(options: SyncManagerOptions) {
    if (options.onSyncComplete) {
      this.onSyncComplete = options.onSyncComplete;
    }
    if (options.onError) {
      this.onError = options.onError;
    }

    // Build strategies map
    this.strategies = new Map();
    options.strategies.forEach((strategy) => {
      if (strategy.enabled) {
        this.strategies.set(strategy.name, strategy);
      }
    });

    // Create adaptive poller
    const pollerOptions: {
      defaultInterval: number;
      activeInterval: number;
      idleInterval: number;
      idleTimeout: number;
      onPoll: () => void | Promise<void>;
      onError?: (error: Error) => void;
    } = {
      defaultInterval: options.defaultInterval,
      activeInterval: options.activeInterval,
      idleInterval: options.idleInterval,
      idleTimeout: options.idleTimeout,
      onPoll: () => this.executeSync(),
    };
    if (this.onError) {
      pollerOptions.onError = this.onError;
    }
    this.poller = new AdaptivePoller(pollerOptions);
  }

  /**
   * Start sync manager
   */
  start(): void {
    this.poller.start();
  }

  /**
   * Stop sync manager
   */
  stop(): void {
    this.poller.stop();
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return {
      isActive: this.poller.getState() !== 'stopped',
      pollerState: this.poller.getState(),
      lastSync: this.lastSync,
      totalSyncs: this.totalSyncs,
      currentInterval: this.poller.getCurrentInterval(),
    };
  }

  /**
   * Trigger immediate sync
   */
  async syncNow(): Promise<void> {
    await this.executeSync();
  }

  /**
   * Add sync strategy
   */
  addStrategy(strategy: SyncStrategy): void {
    if (strategy.enabled) {
      this.strategies.set(strategy.name, strategy);
    }
  }

  /**
   * Remove sync strategy
   */
  removeStrategy(name: SyncStrategyType): void {
    this.strategies.delete(name);
  }

  /**
   * Execute all enabled sync strategies
   */
  private async executeSync(): Promise<void> {
    const syncPromises: Promise<void>[] = [];

    for (const [name, strategy] of this.strategies) {
      if (strategy.enabled) {
        syncPromises.push(
          strategy.sync().then(() => {
            this.onSyncComplete?.(name);
          })
        );
      }
    }

    try {
      await Promise.all(syncPromises);
      this.lastSync = new Date();
      this.totalSyncs++;
    } catch (error) {
      this.onError?.(error as Error);
    }
  }

  /**
   * Destroy sync manager (cleanup)
   */
  destroy(): void {
    this.stop();
    this.strategies.clear();
  }
}
