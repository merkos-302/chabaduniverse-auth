/**
 * Analytics Types
 *
 * Type definitions for user engagement analytics
 */

/**
 * Analytics event type
 */
export type AnalyticsEventType =
  | 'page_view'
  | 'event'
  | 'conversion'
  | 'engagement'
  | 'error'
  | 'performance'
  | 'custom';

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  /** Event type */
  type: AnalyticsEventType;
  /** Event category */
  category: string;
  /** Event action */
  action: string;
  /** Event label */
  label?: string;
  /** Event value */
  value?: number;
  /** Event properties */
  properties?: Record<string, any>;
  /** Timestamp */
  timestamp?: Date;
}

/**
 * Analytics state
 */
export interface AnalyticsState {
  /** Whether analytics is enabled */
  isEnabled: boolean;
  /** Sample rate (0-1) */
  sampleRate: number;
  /** Auto page view tracking */
  autoPageViews: boolean;
  /** Total events tracked */
  totalEvents: number;
}

/**
 * Analytics context value
 */
export interface AnalyticsContextValue extends AnalyticsState {
  /** Track analytics event */
  trackEvent: (event: AnalyticsEvent) => void;
  /** Track page view */
  trackPageView: (page: string, properties?: Record<string, any>) => void;
  /** Track custom event */
  trackCustomEvent: (category: string, action: string, label?: string, value?: number) => void;
  /** Track conversion */
  trackConversion: (category: string, action: string, value?: number) => void;
  /** Track engagement */
  trackEngagement: (category: string, action: string, duration?: number) => void;
  /** Track error */
  trackError: (error: Error, properties?: Record<string, any>) => void;
  /** Track performance metric */
  trackPerformance: (metric: string, value: number, properties?: Record<string, any>) => void;
  /** Enable analytics */
  enable: () => void;
  /** Disable analytics */
  disable: () => void;
}

/**
 * Analytics API response
 */
export interface AnalyticsApiResponse {
  success: boolean;
  error?: string;
}
