/**
 * useActivity Hook
 *
 * React hook for activity tracking
 */

import { useActivityContext } from '../context/ActivityContext.js';
import type { ActivityEvent } from '../types.js';

/**
 * Activity hook return value
 */
export interface UseActivityReturn {
  /** Pending events count */
  pendingEventsCount: number;
  /** Whether tracker is active */
  isActive: boolean;
  /** Last batch send time */
  lastBatchSent: Date | null;
  /** Total events tracked */
  totalEventsTracked: number;
  /** Total events sent */
  totalEventsSent: number;
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
 * Hook for activity tracking
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     trackPageView,
 *     trackClick,
 *     trackFormSubmit,
 *     pendingEventsCount
 *   } = useActivity();
 *
 *   useEffect(() => {
 *     trackPageView('/dashboard');
 *   }, [trackPageView]);
 *
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       <button onClick={() => trackClick('settings-button')}>
 *         Settings
 *       </button>
 *       <p>Pending events: {pendingEventsCount}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useActivity(): UseActivityReturn {
  const context = useActivityContext();

  return {
    pendingEventsCount: context.pendingEvents.length,
    isActive: context.isActive,
    lastBatchSent: context.lastBatchSent,
    totalEventsTracked: context.totalEventsTracked,
    totalEventsSent: context.totalEventsSent,
    trackEvent: context.trackEvent,
    trackPageView: context.trackPageView,
    trackClick: context.trackClick,
    trackFormSubmit: context.trackFormSubmit,
    trackCustomEvent: context.trackCustomEvent,
    flushEvents: context.flushEvents,
    startTracker: context.startTracker,
    stopTracker: context.stopTracker,
    clearEvents: context.clearEvents,
  };
}
