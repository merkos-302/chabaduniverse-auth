/**
 * Activity Types
 *
 * Type definitions for cross-app activity tracking
 */

/**
 * Activity event type
 */
export type ActivityEventType =
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'api_call'
  | 'navigation'
  | 'search'
  | 'download'
  | 'upload'
  | 'share'
  | 'custom';

/**
 * Activity event
 */
export interface ActivityEvent {
  /** Event type */
  type: ActivityEventType;
  /** Action name */
  action: string;
  /** Target element or resource */
  target?: string;
  /** Additional event data */
  eventData?: Record<string, any>;
  /** Event metadata */
  metadata?: Record<string, any>;
  /** Timestamp (defaults to now) */
  timestamp?: Date;
}

/**
 * Tracked activity (stored in database)
 */
export interface Activity {
  userId: string;
  appId: string;
  type: ActivityEventType;
  action: string;
  target?: string;
  eventData: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: Date;
  expiresAt?: Date;
}

/**
 * Activity batch
 */
export interface ActivityBatch {
  /** Array of activity events */
  events: ActivityEvent[];
  /** Batch timestamp */
  timestamp: Date;
  /** Batch size */
  size: number;
}

/**
 * Activity tracker state
 */
export interface ActivityTrackerState {
  /** Pending events (not yet sent) */
  pendingEvents: ActivityEvent[];
  /** Whether tracker is active */
  isActive: boolean;
  /** Last batch send time */
  lastBatchSent: Date | null;
  /** Total events tracked */
  totalEventsTracked: number;
  /** Total events sent */
  totalEventsSent: number;
}

/**
 * Activity context value
 */
export interface ActivityContextValue extends ActivityTrackerState {
  /** Track an activity event */
  trackEvent: (event: ActivityEvent) => void;
  /** Track page view */
  trackPageView: (page: string, metadata?: Record<string, any>) => void;
  /** Track button click */
  trackClick: (target: string, metadata?: Record<string, any>) => void;
  /** Track form submission */
  trackFormSubmit: (formId: string, metadata?: Record<string, any>) => void;
  /** Track custom event */
  trackCustomEvent: (action: string, data?: Record<string, any>) => void;
  /** Flush pending events immediately */
  flushEvents: () => Promise<void>;
  /** Start activity tracker */
  startTracker: () => void;
  /** Stop activity tracker */
  stopTracker: () => void;
  /** Clear all pending events */
  clearEvents: () => void;
}

/**
 * Activity API response
 */
export interface ActivityApiResponse {
  success: boolean;
  processed?: number;
  error?: string;
}

/**
 * Activity tracker options
 */
export interface ActivityTrackerOptions {
  /** User ID */
  userId: string;
  /** App ID */
  appId: string;
  /** Maximum batch size */
  batchSize: number;
  /** Maximum time to wait before sending batch (ms) */
  batchTimeout: number;
  /** Enable automatic cleanup (TTL) */
  autoCleanup: boolean;
  /** Time before events expire (ms) */
  ttl: number;
  /** API base URL */
  apiBaseUrl?: string;
  /** Callback when batch is sent */
  onBatchSent?: (batch: ActivityBatch) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}
