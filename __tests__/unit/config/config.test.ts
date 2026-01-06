/**
 * Configuration System Tests
 *
 * Tests for config merging, validation, and default values
 */

import {
  defaultConfig,
  mergeConfig,
  validateConfig,
  type ChabadUniverseAuthConfig,
} from '../../../src/config';

describe('Configuration System', () => {
  describe('defaultConfig', () => {
    it('should have all required configuration sections', () => {
      expect(defaultConfig).toHaveProperty('sync');
      expect(defaultConfig).toHaveProperty('activity');
      expect(defaultConfig).toHaveProperty('preferences');
      expect(defaultConfig).toHaveProperty('profile');
      expect(defaultConfig).toHaveProperty('authorization');
      expect(defaultConfig).toHaveProperty('analytics');
      expect(defaultConfig).toHaveProperty('appData');
    });

    it('should have sensible sync defaults', () => {
      expect(defaultConfig.sync.enabled).toBe(true);
      expect(defaultConfig.sync.defaultInterval).toBe(30000); // 30 seconds
      expect(defaultConfig.sync.activeInterval).toBe(10000); // 10 seconds
      expect(defaultConfig.sync.idleInterval).toBe(60000); // 60 seconds
      expect(defaultConfig.sync.idleTimeout).toBe(300000); // 5 minutes
    });

    it('should have sensible activity defaults', () => {
      expect(defaultConfig.activity.enabled).toBe(true);
      expect(defaultConfig.activity.batchSize).toBe(5);
      expect(defaultConfig.activity.batchTimeout).toBe(2000); // 2 seconds
      expect(defaultConfig.activity.autoCleanup).toBe(true);
      expect(defaultConfig.activity.ttl).toBe(2592000000); // 30 days
    });

    it('should have caching enabled for profile and preferences', () => {
      expect(defaultConfig.profile.enableCache).toBe(true);
      expect(defaultConfig.profile.cacheTTL).toBe(300000); // 5 minutes
      expect(defaultConfig.preferences.enableCache).toBe(true);
      expect(defaultConfig.preferences.cacheTTL).toBe(300000); // 5 minutes
    });

    it('should have default user role configured', () => {
      expect(defaultConfig.authorization.defaultRoles).toEqual(['user']);
    });

    it('should have 100% analytics sampling by default', () => {
      expect(defaultConfig.analytics.sampleRate).toBe(1.0);
      expect(defaultConfig.analytics.autoPageViews).toBe(true);
    });

    it('should have versioning enabled for app data', () => {
      expect(defaultConfig.appData.enableVersioning).toBe(true);
      expect(defaultConfig.appData.defaultNamespace).toBe('default');
    });

    it('should have debug mode disabled by default', () => {
      expect(defaultConfig.debug).toBe(false);
    });
  });

  describe('mergeConfig', () => {
    it('should merge user config with defaults', () => {
      const userConfig = {
        sync: {
          defaultInterval: 45000, // Override to 45 seconds
        },
        analytics: {
          sampleRate: 0.5, // Override to 50%
        },
      };

      const merged = mergeConfig(userConfig);

      expect(merged.sync.defaultInterval).toBe(45000);
      expect(merged.sync.activeInterval).toBe(10000); // Kept from default
      expect(merged.analytics.sampleRate).toBe(0.5);
      expect(merged.analytics.autoPageViews).toBe(true); // Kept from default
    });

    it('should handle empty user config', () => {
      const merged = mergeConfig({});
      expect(merged).toEqual(defaultConfig);
    });

    it('should conditionally add apiBaseUrl when provided', () => {
      const userConfig = {
        apiBaseUrl: 'https://api.example.com',
      };

      const merged = mergeConfig(userConfig);
      expect(merged.apiBaseUrl).toBe('https://api.example.com');
    });

    it('should not add apiBaseUrl when not provided', () => {
      const merged = mergeConfig({});
      expect(merged.apiBaseUrl).toBeUndefined();
    });

    it('should conditionally add debug flag when provided', () => {
      const userConfig = {
        debug: true,
      };

      const merged = mergeConfig(userConfig);
      expect(merged.debug).toBe(true);
    });

    it('should use default debug value when user config does not specify it', () => {
      const merged = mergeConfig({});
      expect(merged.debug).toBe(false);
    });

    it('should handle deep partial user config', () => {
      const userConfig = {
        activity: {
          batchSize: 10, // Only override batch size
        },
      };

      const merged = mergeConfig(userConfig);
      expect(merged.activity.batchSize).toBe(10);
      expect(merged.activity.batchTimeout).toBe(2000); // Kept from default
      expect(merged.activity.autoCleanup).toBe(true); // Kept from default
    });
  });

  describe('validateConfig', () => {
    it('should not throw for valid config', () => {
      expect(() => validateConfig(defaultConfig)).not.toThrow();
    });

    it('should warn if activeInterval > defaultInterval', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const invalidConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        sync: {
          ...defaultConfig.sync,
          activeInterval: 40000, // Greater than default 30000
        },
      };

      validateConfig(invalidConfig);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('activeInterval should be less than defaultInterval')
      );

      consoleSpy.mockRestore();
    });

    it('should warn if idleInterval < defaultInterval', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const invalidConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        sync: {
          ...defaultConfig.sync,
          idleInterval: 20000, // Less than default 30000
        },
      };

      validateConfig(invalidConfig);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('idleInterval should be greater than defaultInterval')
      );

      consoleSpy.mockRestore();
    });

    it('should throw if batchSize < 1', () => {
      const invalidConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        activity: {
          ...defaultConfig.activity,
          batchSize: 0,
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(
        'activity.batchSize must be at least 1'
      );
    });

    it('should throw if analytics sampleRate < 0', () => {
      const invalidConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        analytics: {
          ...defaultConfig.analytics,
          sampleRate: -0.5,
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(
        'analytics.sampleRate must be between 0 and 1'
      );
    });

    it('should throw if analytics sampleRate > 1', () => {
      const invalidConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        analytics: {
          ...defaultConfig.analytics,
          sampleRate: 1.5,
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(
        'analytics.sampleRate must be between 0 and 1'
      );
    });

    it('should throw if preferences cacheTTL < 0', () => {
      const invalidConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        preferences: {
          ...defaultConfig.preferences,
          cacheTTL: -1000,
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(
        'preferences.cacheTTL must be non-negative'
      );
    });

    it('should throw if profile cacheTTL < 0', () => {
      const invalidConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        profile: {
          ...defaultConfig.profile,
          cacheTTL: -5000,
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(
        'profile.cacheTTL must be non-negative'
      );
    });

    it('should allow zero cacheTTL (no caching)', () => {
      const validConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        profile: {
          ...defaultConfig.profile,
          cacheTTL: 0,
        },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('should allow analytics sampleRate of 0 (no tracking)', () => {
      const validConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        analytics: {
          ...defaultConfig.analytics,
          sampleRate: 0,
        },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('should allow analytics sampleRate of 1 (100% tracking)', () => {
      const validConfig: ChabadUniverseAuthConfig = {
        ...defaultConfig,
        analytics: {
          ...defaultConfig.analytics,
          sampleRate: 1,
        },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });
  });
});
