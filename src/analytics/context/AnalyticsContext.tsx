/**
 * Analytics Context
 *
 * React context for user engagement analytics
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type {
  AnalyticsEvent,
  AnalyticsState,
  AnalyticsContextValue,
} from '../types.js';
import type { AnalyticsConfig } from '../../config/index.js';

/**
 * Analytics Context
 */
const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

/**
 * Analytics Provider Props
 */
export interface AnalyticsProviderProps {
  children: React.ReactNode;
  /** User ID */
  userId: string;
  /** App ID */
  appId: string;
  /** Analytics configuration */
  config: AnalyticsConfig;
  /** API base URL */
  apiBaseUrl?: string;
}

/**
 * Analytics Provider Component
 */
export function AnalyticsProvider({
  children,
  userId,
  appId,
  config,
  apiBaseUrl = '',
}: AnalyticsProviderProps): JSX.Element {
  // State
  const [state, setState] = useState<AnalyticsState>({
    isEnabled: config.enabled,
    sampleRate: config.sampleRate,
    autoPageViews: config.autoPageViews,
    totalEvents: 0,
  });

  /**
   * Check if event should be sampled
   */
  const shouldSample = useCallback((): boolean => {
    return Math.random() < state.sampleRate;
  }, [state.sampleRate]);

  /**
   * Send analytics event to API
   */
  const sendEvent = useCallback(
    async (event: AnalyticsEvent): Promise<void> => {
      try {
        await fetch(`${apiBaseUrl}/api/analytics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            appId,
            ...event,
            timestamp: event.timestamp || new Date(),
          }),
        });
      } catch (error) {
        console.error('Failed to send analytics event:', error);
      }
    },
    [userId, appId, apiBaseUrl]
  );

  /**
   * Track analytics event
   */
  const trackEvent = useCallback(
    (event: AnalyticsEvent): void => {
      if (!state.isEnabled || !shouldSample()) {
        return;
      }

      sendEvent(event);
      setState((prev) => ({
        ...prev,
        totalEvents: prev.totalEvents + 1,
      }));
    },
    [state.isEnabled, shouldSample, sendEvent]
  );

  /**
   * Track page view
   */
  const trackPageView = useCallback(
    (page: string, properties?: Record<string, any>): void => {
      const event: AnalyticsEvent = {
        type: 'page_view',
        category: 'navigation',
        action: 'view',
        label: page,
      };
      if (properties) {
        event.properties = properties;
      }
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Track custom event
   */
  const trackCustomEvent = useCallback(
    (category: string, action: string, label?: string, value?: number): void => {
      const event: AnalyticsEvent = {
        type: 'custom',
        category,
        action,
      };
      if (label !== undefined) event.label = label;
      if (value !== undefined) event.value = value;
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Track conversion
   */
  const trackConversion = useCallback(
    (category: string, action: string, value?: number): void => {
      const event: AnalyticsEvent = {
        type: 'conversion',
        category,
        action,
      };
      if (value !== undefined) event.value = value;
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Track engagement
   */
  const trackEngagement = useCallback(
    (category: string, action: string, duration?: number): void => {
      const event: AnalyticsEvent = {
        type: 'engagement',
        category,
        action,
      };
      if (duration !== undefined) event.value = duration;
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Track error
   */
  const trackError = useCallback(
    (error: Error, properties?: Record<string, any>): void => {
      const event: AnalyticsEvent = {
        type: 'error',
        category: 'error',
        action: error.name,
        label: error.message,
        properties: {
          ...(properties || {}),
          stack: error.stack,
        },
      };
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Track performance metric
   */
  const trackPerformance = useCallback(
    (metric: string, value: number, properties?: Record<string, any>): void => {
      const event: AnalyticsEvent = {
        type: 'performance',
        category: 'performance',
        action: metric,
        value,
      };
      if (properties) {
        event.properties = properties;
      }
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Enable analytics
   */
  const enable = useCallback((): void => {
    setState((prev) => ({ ...prev, isEnabled: true }));
  }, []);

  /**
   * Disable analytics
   */
  const disable = useCallback((): void => {
    setState((prev) => ({ ...prev, isEnabled: false }));
  }, []);

  // Auto track page views if enabled
  useEffect(() => {
    if (state.autoPageViews && typeof window !== 'undefined') {
      trackPageView(window.location.pathname);
    }
  }, [state.autoPageViews, trackPageView]);

  // Context value
  const value: AnalyticsContextValue = {
    ...state,
    trackEvent,
    trackPageView,
    trackCustomEvent,
    trackConversion,
    trackEngagement,
    trackError,
    trackPerformance,
    enable,
    disable,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

/**
 * Hook to use analytics context
 */
export function useAnalyticsContext(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}
