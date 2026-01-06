/**
 * Activity Tracker
 *
 * Intelligent activity tracking with automatic batching and sending
 */

import type {
  ActivityEvent,
  ActivityBatch,
  ActivityTrackerOptions,
  ActivityTrackerState,
} from '../types.js';

/**
 * Activity Tracker Class
 *
 * Manages activity event tracking with intelligent batching:
 * - Batches events up to batchSize (default 5)
 * - Sends batch after batchTimeout (default 2 seconds)
 * - Provides manual flush capability
 */
export class ActivityTracker {
  private userId: string;
  private appId: string;
  private batchSize: number;
  private batchTimeout: number;
  private autoCleanup: boolean;
  private ttl: number;
  private apiBaseUrl: string;
  private onBatchSent?: (batch: ActivityBatch) => void;
  private onError?: (error: Error) => void;

  private pendingEvents: ActivityEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private lastBatchSent: Date | null = null;
  private totalEventsTracked: number = 0;
  private totalEventsSent: number = 0;

  constructor(options: ActivityTrackerOptions) {
    this.userId = options.userId;
    this.appId = options.appId;
    this.batchSize = options.batchSize;
    this.batchTimeout = options.batchTimeout;
    this.autoCleanup = options.autoCleanup;
    this.ttl = options.ttl;
    this.apiBaseUrl = options.apiBaseUrl || '';
    if (options.onBatchSent) {
      this.onBatchSent = options.onBatchSent;
    }
    if (options.onError) {
      this.onError = options.onError;
    }
  }

  /**
   * Get current tracker state
   */
  getState(): ActivityTrackerState {
    return {
      pendingEvents: [...this.pendingEvents],
      isActive: this.isActive,
      lastBatchSent: this.lastBatchSent,
      totalEventsTracked: this.totalEventsTracked,
      totalEventsSent: this.totalEventsSent,
    };
  }

  /**
   * Start the tracker
   */
  start(): void {
    this.isActive = true;
  }

  /**
   * Stop the tracker
   */
  stop(): void {
    this.isActive = false;
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Track an activity event
   */
  trackEvent(event: ActivityEvent): void {
    if (!this.isActive) {
      return;
    }

    // Add timestamp if not provided
    const eventWithTimestamp: ActivityEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
    };

    // Add to pending events
    this.pendingEvents.push(eventWithTimestamp);
    this.totalEventsTracked++;

    // Check if we should send batch immediately
    if (this.pendingEvents.length >= this.batchSize) {
      this.sendBatch();
    } else {
      // Schedule batch send if not already scheduled
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.sendBatch();
        }, this.batchTimeout);
      }
    }
  }

  /**
   * Flush pending events immediately
   */
  async flush(): Promise<void> {
    if (this.pendingEvents.length > 0) {
      await this.sendBatch();
    }
  }

  /**
   * Clear all pending events
   */
  clear(): void {
    this.pendingEvents = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Send batch of events to API
   */
  private async sendBatch(): Promise<void> {
    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Nothing to send
    if (this.pendingEvents.length === 0) {
      return;
    }

    // Create batch
    const batch: ActivityBatch = {
      events: [...this.pendingEvents],
      timestamp: new Date(),
      size: this.pendingEvents.length,
    };

    // Clear pending events
    this.pendingEvents = [];

    try {
      // Send to API
      const response = await fetch(`${this.apiBaseUrl}/api/activity/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          appId: this.appId,
          events: batch.events,
          ttl: this.autoCleanup ? this.ttl : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send activity batch: ${response.statusText}`);
      }

      // Update stats
      this.totalEventsSent += batch.size;
      this.lastBatchSent = new Date();

      // Notify callback
      this.onBatchSent?.(batch);
    } catch (error) {
      // Put events back in pending queue on error
      this.pendingEvents = [...batch.events, ...this.pendingEvents];

      // Notify error callback
      this.onError?.(error as Error);
    }
  }

  /**
   * Destroy the tracker (cleanup)
   */
  destroy(): void {
    this.stop();
    this.clear();
  }
}
