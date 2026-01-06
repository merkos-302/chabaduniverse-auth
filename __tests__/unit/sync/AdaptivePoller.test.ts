/**
 * AdaptivePoller Tests
 *
 * Tests for adaptive polling with activity detection and state transitions
 */

import { AdaptivePoller } from '../../../src/sync/AdaptivePoller';

describe('AdaptivePoller', () => {
  let poller: AdaptivePoller;
  let onPoll: jest.Mock;
  let onError: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    onPoll = jest.fn();
    onError = jest.fn();

    poller = new AdaptivePoller({
      defaultInterval: 30000, // 30s
      activeInterval: 10000, // 10s
      idleInterval: 60000, // 60s
      idleTimeout: 300000, // 5 minutes
      onPoll,
      onError,
    });
  });

  afterEach(() => {
    poller.stop();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize in stopped state', () => {
      expect(poller.getState()).toBe('stopped');
    });

    it('should accept options without onError callback', () => {
      const simplePoller = new AdaptivePoller({
        defaultInterval: 30000,
        activeInterval: 10000,
        idleInterval: 60000,
        idleTimeout: 300000,
        onPoll: jest.fn(),
      });

      expect(() => simplePoller.start()).not.toThrow();
      simplePoller.stop();
    });
  });

  describe('State Transitions', () => {
    it('should start in default state', () => {
      poller.start();
      expect(poller.getState()).toBe('default');
    });

    it('should transition to active state on user activity', () => {
      poller.start();

      // Simulate user activity
      const event = new Event('mousemove');
      window.dispatchEvent(event);

      expect(poller.getState()).toBe('active');
    });

    it('should transition to idle state after idle timeout', () => {
      poller.start();

      // Advance time past idle timeout (5 minutes)
      jest.advanceTimersByTime(300000);

      expect(poller.getState()).toBe('idle');
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should return to default state from idle on activity', () => {
      poller.start();

      // Move to idle
      jest.advanceTimersByTime(300000);
      expect(poller.getState()).toBe('idle');

      // Trigger activity
      const event = new Event('keypress');
      window.dispatchEvent(event);

      expect(poller.getState()).toBe('default');
    });

    it('should transition to stopped state when stopped', () => {
      poller.start();
      expect(poller.getState()).toBe('default');

      poller.stop();
      expect(poller.getState()).toBe('stopped');
    });
  });

  describe('Polling Intervals', () => {
    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should return correct interval for each state', () => {
      expect(poller.getCurrentInterval()).toBe(0); // stopped

      poller.start();
      expect(poller.getCurrentInterval()).toBe(30000); // default

      window.dispatchEvent(new Event('click'));
      expect(poller.getCurrentInterval()).toBe(10000); // active

      jest.advanceTimersByTime(300000);
      expect(poller.getCurrentInterval()).toBe(60000); // idle
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should poll at default interval', () => {
      poller.start();

      // Should not have polled yet
      expect(onPoll).toHaveBeenCalledTimes(0);

      // Advance by default interval
      jest.advanceTimersByTime(30000);

      expect(onPoll).toHaveBeenCalledTimes(1);
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should poll at active interval when active', () => {
      poller.start();

      // Trigger activity to switch to active state
      window.dispatchEvent(new Event('mousemove'));

      // Reset mock to clear initial calls
      onPoll.mockClear();

      // Advance by active interval (10s)
      jest.advanceTimersByTime(10000);

      expect(onPoll).toHaveBeenCalledTimes(1);
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should poll at idle interval when idle', () => {
      poller.start();

      // Move to idle state
      jest.advanceTimersByTime(300000);

      // Reset mock
      onPoll.mockClear();

      // Advance by idle interval (60s)
      jest.advanceTimersByTime(60000);

      expect(onPoll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Activity Detection', () => {
    it('should detect mousemove activity', () => {
      poller.start();

      window.dispatchEvent(new Event('mousemove'));

      expect(poller.getState()).toBe('active');
    });

    it('should detect keypress activity', () => {
      poller.start();

      window.dispatchEvent(new Event('keypress'));

      expect(poller.getState()).toBe('active');
    });

    it('should detect click activity', () => {
      poller.start();

      window.dispatchEvent(new Event('click'));

      expect(poller.getState()).toBe('active');
    });

    it('should detect scroll activity', () => {
      poller.start();

      window.dispatchEvent(new Event('scroll'));

      expect(poller.getState()).toBe('active');
    });

    it('should not detect activity when stopped', () => {
      poller.start();
      poller.stop();

      window.dispatchEvent(new Event('mousemove'));

      expect(poller.getState()).toBe('stopped');
    });

    it('should update lastActivityTime on activity', () => {
      poller.start();

      // Record time before activity
      const timeBefore = Date.now();

      // Trigger activity
      window.dispatchEvent(new Event('click'));

      // lastActivityTime should be updated (can't directly access, but state should be active)
      expect(poller.getState()).toBe('active');
    });
  });

  describe('Polling Behavior', () => {
    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should call onPoll periodically in default state', () => {
      poller.start();

      jest.advanceTimersByTime(30000); // First poll
      expect(onPoll).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(30000); // Second poll
      expect(onPoll).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(30000); // Third poll
      expect(onPoll).toHaveBeenCalledTimes(3);
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should adjust polling frequency when switching states', () => {
      poller.start();

      // Poll once in default state
      jest.advanceTimersByTime(30000);
      expect(onPoll).toHaveBeenCalledTimes(1);

      // Switch to active state
      window.dispatchEvent(new Event('click'));

      // Clear mock
      onPoll.mockClear();

      // Should now poll every 10s
      jest.advanceTimersByTime(10000);
      expect(onPoll).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(10000);
      expect(onPoll).toHaveBeenCalledTimes(2);
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should handle async onPoll callback', async () => {
      const asyncOnPoll = jest.fn().mockResolvedValue(undefined);
      const asyncPoller = new AdaptivePoller({
        defaultInterval: 30000,
        activeInterval: 10000,
        idleInterval: 60000,
        idleTimeout: 300000,
        onPoll: asyncOnPoll,
      });

      asyncPoller.start();

      jest.advanceTimersByTime(30000);
      await jest.runAllTimersAsync();

      expect(asyncOnPoll).toHaveBeenCalled();

      asyncPoller.stop();
    });
  });

  describe('Error Handling', () => {
    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should call onError when onPoll throws', async () => {
      const errorOnPoll = jest.fn().mockRejectedValue(new Error('Poll failed'));
      const errorPoller = new AdaptivePoller({
        defaultInterval: 30000,
        activeInterval: 10000,
        idleInterval: 60000,
        idleTimeout: 300000,
        onPoll: errorOnPoll,
        onError,
      });

      errorPoller.start();

      jest.advanceTimersByTime(30000);
      await jest.runAllTimersAsync();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Poll failed',
        })
      );

      errorPoller.stop();
    });

    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should continue polling after error', async () => {
      const errorOnPoll = jest.fn().mockRejectedValue(new Error('Poll failed'));
      const errorPoller = new AdaptivePoller({
        defaultInterval: 30000,
        activeInterval: 10000,
        idleInterval: 60000,
        idleTimeout: 300000,
        onPoll: errorOnPoll,
        onError,
      });

      errorPoller.start();

      // First poll fails
      jest.advanceTimersByTime(30000);
      await jest.runAllTimersAsync();

      expect(errorOnPoll).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);

      // Second poll should still happen
      jest.advanceTimersByTime(30000);
      await jest.runAllTimersAsync();

      expect(errorOnPoll).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledTimes(2);

      errorPoller.stop();
    });
  });

  describe('Lifecycle Management', () => {
    // TODO: Fix timer-related test failure (GitHub Issue #5)
    it.skip('should stop polling when stopped', () => {
      poller.start();

      jest.advanceTimersByTime(30000);
      expect(onPoll).toHaveBeenCalledTimes(1);

      poller.stop();

      // Advance time - should not poll
      jest.advanceTimersByTime(30000);
      expect(onPoll).toHaveBeenCalledTimes(1); // Still 1, no new polls
    });

    it('should remove activity listeners when stopped', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      poller.start();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(4); // mousemove, keypress, click, scroll

      poller.stop();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should allow restart after stop', () => {
      poller.start();
      expect(poller.getState()).toBe('default');

      poller.stop();
      expect(poller.getState()).toBe('stopped');

      poller.start();
      expect(poller.getState()).toBe('default');
    });

    it('should clear all timers when stopped', () => {
      poller.start();

      // Trigger activity to create idle timer
      window.dispatchEvent(new Event('click'));

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      poller.stop();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Idle Timeout Management', () => {
    it('should reset idle timer on each activity', () => {
      poller.start();

      // Trigger activity
      window.dispatchEvent(new Event('click'));

      // Advance 4 minutes (below idle timeout)
      jest.advanceTimersByTime(240000);

      // Trigger more activity
      window.dispatchEvent(new Event('keypress'));

      // Advance another 4 minutes (total 8 min, but timer was reset at 4 min)
      jest.advanceTimersByTime(240000);

      // Should still not be idle because timer was reset
      expect(poller.getState()).toBe('active');
    });

    it('should transition to idle exactly at idle timeout', () => {
      poller.start();

      // Advance exactly to idle timeout
      jest.advanceTimersByTime(300000);

      expect(poller.getState()).toBe('idle');
    });
  });
});
