/**
 * Activity Context
 *
 * React context for activity tracking with automatic batching
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { ActivityTracker } from '../tracker/ActivityTracker.js';
import type {
  ActivityEvent,
  ActivityContextValue,
  ActivityTrackerState,
  ActivityBatch,
} from '../types.js';
import type { ActivityConfig } from '../../config/index.js';

/**
 * Activity Context
 */
const ActivityContext = createContext<ActivityContextValue | null>(null);

/**
 * Activity Provider Props
 */
export interface ActivityProviderProps {
  children: React.ReactNode;
  /** User ID */
  userId: string;
  /** App ID */
  appId: string;
  /** Activity configuration */
  config: ActivityConfig;
  /** API base URL */
  apiBaseUrl?: string;
  /** Callback when batch is sent */
  onBatchSent?: (batch: ActivityBatch) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Activity Provider Component
 */
export function ActivityProvider({
  children,
  userId,
  appId,
  config,
  apiBaseUrl = '',
  onBatchSent,
  onError,
}: ActivityProviderProps): JSX.Element {
  // Tracker ref
  const trackerRef = useRef<ActivityTracker | null>(null);

  // State
  const [state, setState] = useState<ActivityTrackerState>({
    pendingEvents: [],
    isActive: false,
    lastBatchSent: null,
    totalEventsTracked: 0,
    totalEventsSent: 0,
  });

  /**
   * Initialize tracker
   */
  useEffect(() => {
    if (!config.enabled) {
      return;
    }

    // Create tracker
    const tracker = new ActivityTracker({
      userId,
      appId,
      batchSize: config.batchSize,
      batchTimeout: config.batchTimeout,
      autoCleanup: config.autoCleanup,
      ttl: config.ttl,
      apiBaseUrl,
      onBatchSent: (batch) => {
        // Update state
        setState(tracker.getState());
        // Call user callback
        onBatchSent?.(batch);
      },
      ...(onError && { onError }),
    });

    // Start tracker
    tracker.start();
    trackerRef.current = tracker;
    setState(tracker.getState());

    // Cleanup on unmount
    return () => {
      tracker.destroy();
      trackerRef.current = null;
    };
  }, [
    config.enabled,
    userId,
    appId,
    config.batchSize,
    config.batchTimeout,
    config.autoCleanup,
    config.ttl,
    apiBaseUrl,
    onBatchSent,
    onError,
  ]);

  /**
   * Track an activity event
   */
  const trackEvent = useCallback((event: ActivityEvent): void => {
    if (trackerRef.current) {
      trackerRef.current.trackEvent(event);
      setState(trackerRef.current.getState());
    }
  }, []);

  /**
   * Track page view
   */
  const trackPageView = useCallback(
    (page: string, metadata?: Record<string, any>): void => {
      const event: ActivityEvent = {
        type: 'page_view',
        action: 'view',
        target: page,
      };
      if (metadata) {
        event.metadata = metadata;
      }
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Track button click
   */
  const trackClick = useCallback(
    (target: string, metadata?: Record<string, any>): void => {
      const event: ActivityEvent = {
        type: 'button_click',
        action: 'click',
        target,
      };
      if (metadata) {
        event.metadata = metadata;
      }
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Track form submission
   */
  const trackFormSubmit = useCallback(
    (formId: string, metadata?: Record<string, any>): void => {
      const event: ActivityEvent = {
        type: 'form_submit',
        action: 'submit',
        target: formId,
      };
      if (metadata) {
        event.metadata = metadata;
      }
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Track custom event
   */
  const trackCustomEvent = useCallback(
    (action: string, data?: Record<string, any>): void => {
      const event: ActivityEvent = {
        type: 'custom',
        action,
      };
      if (data) {
        event.eventData = data;
      }
      trackEvent(event);
    },
    [trackEvent]
  );

  /**
   * Flush pending events immediately
   */
  const flushEvents = useCallback(async (): Promise<void> => {
    if (trackerRef.current) {
      await trackerRef.current.flush();
      setState(trackerRef.current.getState());
    }
  }, []);

  /**
   * Start activity tracker
   */
  const startTracker = useCallback((): void => {
    if (trackerRef.current) {
      trackerRef.current.start();
      setState(trackerRef.current.getState());
    }
  }, []);

  /**
   * Stop activity tracker
   */
  const stopTracker = useCallback((): void => {
    if (trackerRef.current) {
      trackerRef.current.stop();
      setState(trackerRef.current.getState());
    }
  }, []);

  /**
   * Clear all pending events
   */
  const clearEvents = useCallback((): void => {
    if (trackerRef.current) {
      trackerRef.current.clear();
      setState(trackerRef.current.getState());
    }
  }, []);

  // Context value
  const value: ActivityContextValue = {
    ...state,
    trackEvent,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackCustomEvent,
    flushEvents,
    startTracker,
    stopTracker,
    clearEvents,
  };

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

/**
 * Hook to use activity context
 */
export function useActivityContext(): ActivityContextValue {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivityContext must be used within ActivityProvider');
  }
  return context;
}
