/**
 * Adaptive Poller
 *
 * Intelligent polling system that adapts intervals based on user activity:
 * - Default: 30 seconds
 * - Active (user moving mouse): 10 seconds
 * - Idle (5 minutes inactive): 60 seconds
 */

export interface AdaptivePollerOptions {
  /** Default polling interval (ms) */
  defaultInterval: number;
  /** Active interval when user is active (ms) */
  activeInterval: number;
  /** Idle interval when user is idle (ms) */
  idleInterval: number;
  /** Time before switching to idle mode (ms) */
  idleTimeout: number;
  /** Callback function to execute on each poll */
  onPoll: () => void | Promise<void>;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export type PollerState = 'active' | 'default' | 'idle' | 'stopped';

/**
 * Adaptive Poller Class
 *
 * Manages adaptive polling intervals based on user activity
 */
export class AdaptivePoller {
  private defaultInterval: number;
  private activeInterval: number;
  private idleInterval: number;
  private idleTimeout: number;
  private onPoll: () => void | Promise<void>;
  private onError?: (error: Error) => void;

  private state: PollerState = 'stopped';
  private pollTimer: NodeJS.Timeout | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private isPolling: boolean = false;

  constructor(options: AdaptivePollerOptions) {
    this.defaultInterval = options.defaultInterval;
    this.activeInterval = options.activeInterval;
    this.idleInterval = options.idleInterval;
    this.idleTimeout = options.idleTimeout;
    this.onPoll = options.onPoll;
    if (options.onError) {
      this.onError = options.onError;
    }
  }

  /**
   * Start the adaptive poller
   */
  start(): void {
    if (this.state !== 'stopped') {
      return;
    }

    this.state = 'default';
    this.setupActivityListeners();
    this.schedulePoll();
    this.scheduleIdleCheck();
  }

  /**
   * Stop the adaptive poller
   */
  stop(): void {
    this.state = 'stopped';
    this.clearPolling();
    this.removeActivityListeners();
  }

  /**
   * Get current poller state
   */
  getState(): PollerState {
    return this.state;
  }

  /**
   * Get current interval
   */
  getCurrentInterval(): number {
    switch (this.state) {
      case 'active':
        return this.activeInterval;
      case 'idle':
        return this.idleInterval;
      default:
        return this.defaultInterval;
    }
  }

  /**
   * Trigger immediate poll
   */
  async pollNow(): Promise<void> {
    await this.executePoll();
  }

  /**
   * Setup activity listeners
   */
  private setupActivityListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('mousemove', this.handleActivity);
    window.addEventListener('keypress', this.handleActivity);
    window.addEventListener('click', this.handleActivity);
    window.addEventListener('scroll', this.handleActivity);
  }

  /**
   * Remove activity listeners
   */
  private removeActivityListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('mousemove', this.handleActivity);
    window.removeEventListener('keypress', this.handleActivity);
    window.removeEventListener('click', this.handleActivity);
    window.removeEventListener('scroll', this.handleActivity);
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    this.lastActivityTime = Date.now();

    // Switch to active mode
    if (this.state !== 'active') {
      this.state = 'active';
      this.reschedulePolling();
    }

    // Reset idle timer
    this.scheduleIdleCheck();
  };

  /**
   * Schedule idle check
   */
  private scheduleIdleCheck(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      const timeSinceActivity = Date.now() - this.lastActivityTime;
      if (timeSinceActivity >= this.idleTimeout) {
        // Switch to idle mode
        this.state = 'idle';
        this.reschedulePolling();
      } else {
        // Not idle yet, check again
        this.scheduleIdleCheck();
      }
    }, this.idleTimeout);
  }

  /**
   * Schedule next poll
   */
  private schedulePoll(): void {
    if (this.state === 'stopped') {
      return;
    }

    this.pollTimer = setTimeout(async () => {
      await this.executePoll();
      this.schedulePoll();
    }, this.getCurrentInterval());
  }

  /**
   * Reschedule polling with new interval
   */
  private reschedulePolling(): void {
    this.clearPolling();
    this.schedulePoll();
  }

  /**
   * Clear polling timers
   */
  private clearPolling(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Execute poll callback
   */
  private async executePoll(): Promise<void> {
    if (this.isPolling) {
      return; // Prevent concurrent polls
    }

    this.isPolling = true;

    try {
      await this.onPoll();
    } catch (error) {
      this.onError?.(error as Error);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Destroy the poller (cleanup)
   */
  destroy(): void {
    this.stop();
  }
}
