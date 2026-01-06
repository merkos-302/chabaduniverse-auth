/**
 * useAnalytics Hook
 *
 * React hook for analytics tracking
 */

import { useAnalyticsContext } from '../context/AnalyticsContext.js';
import type { AnalyticsEvent } from '../types.js';

/**
 * Analytics hook return value
 */
export interface UseAnalyticsReturn {
  /** Whether analytics is enabled */
  isEnabled: boolean;
  /** Sample rate */
  sampleRate: number;
  /** Total events tracked */
  totalEvents: number;
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
 * Hook for analytics tracking
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     trackPageView,
 *     trackCustomEvent,
 *     trackConversion
 *   } = useAnalytics();
 *
 *   useEffect(() => {
 *     trackPageView('/dashboard');
 *   }, [trackPageView]);
 *
 *   return (
 *     <div>
 *       <button onClick={() => {
 *         trackCustomEvent('button', 'click', 'signup');
 *         trackConversion('signup', 'completed', 1);
 *       }}>
 *         Sign Up
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAnalytics(): UseAnalyticsReturn {
  const context = useAnalyticsContext();

  return {
    isEnabled: context.isEnabled,
    sampleRate: context.sampleRate,
    totalEvents: context.totalEvents,
    trackEvent: context.trackEvent,
    trackPageView: context.trackPageView,
    trackCustomEvent: context.trackCustomEvent,
    trackConversion: context.trackConversion,
    trackEngagement: context.trackEngagement,
    trackError: context.trackError,
    trackPerformance: context.trackPerformance,
    enable: context.enable,
    disable: context.disable,
  };
}
