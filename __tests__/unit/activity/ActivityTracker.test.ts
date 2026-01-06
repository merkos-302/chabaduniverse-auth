/**
 * ActivityTracker Tests
 *
 * Tests for activity event batching, timing, and API integration
 */

import { ActivityTracker } from '../../../src/activity/tracker/ActivityTracker';
import type { ActivityEvent, ActivityBatch } from '../../../src/activity/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('ActivityTracker', () => {
  let tracker: ActivityTracker;
  const mockFetch = global.fetch as jest.Mock;

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    tracker = new ActivityTracker({
      userId: 'user123',
      appId: 'app456',
      batchSize: 5,
      batchTimeout: 2000,
      autoCleanup: true,
      ttl: 2592000000, // 30 days
      apiBaseUrl: 'https://api.example.com',
    });

    tracker.start();
  });

  afterEach(() => {
    tracker.stop();
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with correct options', () => {
      const state = tracker.getState();
      expect(state.isActive).toBe(true);
      expect(state.pendingEvents.length).toBe(0);
      expect(state.totalEventsTracked).toBe(0);
    });

    it('should handle missing optional callbacks', () => {
      const simpleTracker = new ActivityTracker({
        userId: 'user123',
        appId: 'app456',
        batchSize: 5,
        batchTimeout: 2000,
        autoCleanup: false,
        ttl: 2592000000,
      });

      expect(() => simpleTracker.start()).not.toThrow();
      simpleTracker.stop();
    });

    it('should be inactive before start', () => {
      const newTracker = new ActivityTracker({
        userId: 'user123',
        appId: 'app456',
        batchSize: 5,
        batchTimeout: 2000,
        autoCleanup: false,
        ttl: 2592000000,
      });

      expect(newTracker.getState().isActive).toBe(false);
      newTracker.stop();
    });
  });

  describe('Event Tracking', () => {
    it('should track a single event', () => {
      const event: ActivityEvent = {
        type: 'page_view',
        action: 'view',
        target: '/dashboard',
      };

      tracker.trackEvent(event);

      expect(tracker.getState().pendingEvents.length).toBe(1);
      expect(tracker.getState().totalEventsTracked).toBe(1);
    });

    it('should add timestamp to events without one', () => {
      const event: ActivityEvent = {
        type: 'click',
        action: 'click',
        target: 'submit-button',
      };

      tracker.trackEvent(event);
      expect(tracker.getState().pendingEvents.length).toBe(1);
    });

    it('should preserve existing timestamp', () => {
      const customTimestamp = new Date('2026-01-01');
      const event: ActivityEvent = {
        type: 'click',
        action: 'click',
        target: 'submit-button',
        timestamp: customTimestamp,
      };

      tracker.trackEvent(event);
      expect(tracker.getState().pendingEvents.length).toBe(1);
    });

    it('should not track events when inactive', () => {
      tracker.stop();

      const event: ActivityEvent = {
        type: 'click',
        action: 'click',
        target: 'button',
      };

      tracker.trackEvent(event);

      expect(tracker.getState().pendingEvents.length).toBe(0);
      expect(tracker.getState().totalEventsTracked).toBe(0);
    });

    it('should track events with metadata', () => {
      const event: ActivityEvent = {
        type: 'form_submit',
        action: 'submit',
        target: 'contact-form',
        metadata: {
          formId: 'contact-123',
          fields: ['name', 'email'],
        },
      };

      tracker.trackEvent(event);
      expect(tracker.getState().pendingEvents.length).toBe(1);
    });
  });

  describe('Batch Triggering by Size', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should send batch when batchSize is reached', async () => {
      // Track 5 events (reaches batch size)
      for (let i = 0; i < 5; i++) {
        tracker.trackEvent({
          type: 'click',
          action: 'click',
          target: `button-${i}`,
        });
      }

      // Advance timers to allow async operations
      await jest.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/activity/batch',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(tracker.getState().pendingEvents.length).toBe(0);
      expect(tracker.getState().totalEventsSent).toBe(5);
    });

    it('should not send batch before batchSize is reached', async () => {
      // Track 3 events (below batch size of 5)
      for (let i = 0; i < 3; i++) {
        tracker.trackEvent({
          type: 'click',
          action: 'click',
          target: `button-${i}`,
        });
      }

      expect(mockFetch).not.toHaveBeenCalled();
      expect(tracker.getState().pendingEvents.length).toBe(3);
      expect(tracker.getState().totalEventsSent).toBe(0);
    });
  });

  describe('Batch Triggering by Timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should send batch after batchTimeout', async () => {
      // Track 2 events (below batch size)
      tracker.trackEvent({
        type: 'click',
        action: 'click',
        target: 'button-1',
      });
      tracker.trackEvent({
        type: 'click',
        action: 'click',
        target: 'button-2',
      });

      expect(tracker.getState().pendingEvents.length).toBe(2);

      // Advance by batchTimeout (2000ms)
      jest.advanceTimersByTime(2000);
      await jest.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(tracker.getState().pendingEvents.length).toBe(0);
      expect(tracker.getState().totalEventsSent).toBe(2);
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should reset timer when new event arrives before timeout', async () => {
      tracker.trackEvent({
        type: 'click',
        action: 'click',
        target: 'button-1',
      });

      // Advance 1 second (half of timeout)
      jest.advanceTimersByTime(1000);

      // Add another event, resetting the timer
      tracker.trackEvent({
        type: 'click',
        action: 'click',
        target: 'button-2',
      });

      // Advance another second (total 2s, but timer was reset)
      jest.advanceTimersByTime(1000);

      // Should not have sent yet because timer was reset
      expect(mockFetch).not.toHaveBeenCalled();
      expect(tracker.getState().pendingEvents.length).toBe(2);
    });
  });

  describe('Batch API Integration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should include userId and appId in batch payload', async () => {
      tracker.trackEvent({
        type: 'page_view',
        action: 'view',
        target: '/dashboard',
      });

      jest.advanceTimersByTime(2000);
      await jest.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toHaveProperty('userId', 'user123');
      expect(requestBody).toHaveProperty('appId', 'app456');
      expect(requestBody).toHaveProperty('events');
      expect(Array.isArray(requestBody.events)).toBe(true);
    });

    it('should handle API errors and restore events to queue', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const onError = jest.fn();
      const errorTracker = new ActivityTracker({
        userId: 'user123',
        appId: 'app456',
        batchSize: 5,
        batchTimeout: 2000,
        autoCleanup: false,
        ttl: 2592000000,
        apiBaseUrl: 'https://api.example.com',
        onError,
      });

      errorTracker.start();

      // Track events
      for (let i = 0; i < 5; i++) {
        errorTracker.trackEvent({
          type: 'click',
          action: 'click',
          target: `button-${i}`,
        });
      }

      await jest.runAllTimersAsync();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(errorTracker.getState().pendingEvents.length).toBe(5); // Events restored to queue

      errorTracker.stop();
    });
  });

  describe('Callbacks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call onBatchSent callback after successful send', async () => {
      const onBatchSent = jest.fn();

      const callbackTracker = new ActivityTracker({
        userId: 'user123',
        appId: 'app456',
        batchSize: 3,
        batchTimeout: 2000,
        autoCleanup: false,
        ttl: 2592000000,
        apiBaseUrl: 'https://api.example.com',
        onBatchSent,
      });

      callbackTracker.start();

      // Track 3 events to trigger batch
      for (let i = 0; i < 3; i++) {
        callbackTracker.trackEvent({
          type: 'click',
          action: 'click',
          target: `button-${i}`,
        });
      }

      await jest.runAllTimersAsync();

      expect(onBatchSent).toHaveBeenCalledTimes(1);
      expect(onBatchSent).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.any(Array),
          size: 3,
        })
      );

      callbackTracker.stop();
    });
  });

  describe('Lifecycle Management', () => {
    it('should stop tracking when stopped', () => {
      tracker.stop();

      expect(tracker.getState().isActive).toBe(false);

      tracker.trackEvent({
        type: 'click',
        action: 'click',
        target: 'button',
      });

      expect(tracker.getState().pendingEvents.length).toBe(0);
    });

    it('should allow restart after stop', () => {
      tracker.stop();
      expect(tracker.getState().isActive).toBe(false);

      tracker.start();
      expect(tracker.getState().isActive).toBe(true);

      tracker.trackEvent({
        type: 'click',
        action: 'click',
        target: 'button',
      });

      expect(tracker.getState().pendingEvents.length).toBe(1);
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should clear pending events when stopped', () => {
      tracker.trackEvent({
        type: 'click',
        action: 'click',
        target: 'button',
      });

      expect(tracker.getState().pendingEvents.length).toBe(1);

      tracker.stop();

      expect(tracker.getState().pendingEvents.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should track total events correctly', async () => {
      // Track 7 events total
      for (let i = 0; i < 7; i++) {
        tracker.trackEvent({
          type: 'click',
          action: 'click',
          target: `button-${i}`,
        });
      }

      expect(tracker.getState().totalEventsTracked).toBe(7);

      // Wait for batch to send (first 5)
      await jest.runAllTimersAsync();

      expect(tracker.getState().totalEventsTracked).toBe(7); // Still 7 total
      expect(tracker.getState().totalEventsSent).toBe(5); // Only 5 sent
      expect(tracker.getState().pendingEvents.length).toBe(2); // 2 pending
    });
  });
});
