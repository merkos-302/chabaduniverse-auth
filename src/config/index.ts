/**
 * Configuration System for ChabadUniverse Auth
 *
 * Provides centralized configuration for all auth modules including:
 * - Profile management
 * - Preferences sync
 * - Activity tracking
 * - App data storage
 * - Authorization/RBAC
 * - Analytics
 * - Data synchronization
 */

export interface SyncConfig {
  /** Enable/disable data synchronization */
  enabled: boolean;
  /** Default polling interval in milliseconds */
  defaultInterval: number;
  /** Polling interval when user is active (in milliseconds) */
  activeInterval: number;
  /** Polling interval when user is idle (in milliseconds) */
  idleInterval: number;
  /** Time in milliseconds before switching to idle mode */
  idleTimeout: number;
}

export interface ActivityConfig {
  /** Enable/disable activity tracking */
  enabled: boolean;
  /** Maximum number of events to batch before sending */
  batchSize: number;
  /** Maximum time in milliseconds to wait before sending batch */
  batchTimeout: number;
  /** Enable automatic event cleanup (TTL) */
  autoCleanup: boolean;
  /** Time in milliseconds before events expire */
  ttl: number;
}

export interface PreferencesConfig {
  /** Enable/disable preferences sync */
  enabled: boolean;
  /** Enable local storage caching */
  enableCache: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
}

export interface ProfileConfig {
  /** Enable/disable profile management */
  enabled: boolean;
  /** Enable local storage caching */
  enableCache: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
}

export interface AuthorizationConfig {
  /** Enable/disable RBAC */
  enabled: boolean;
  /** Default roles for new users */
  defaultRoles: string[];
  /** Enable permission caching */
  enableCache: boolean;
}

export interface AnalyticsConfig {
  /** Enable/disable analytics tracking */
  enabled: boolean;
  /** Sample rate (0-1) for analytics events */
  sampleRate: number;
  /** Enable automatic page view tracking */
  autoPageViews: boolean;
}

export interface AppDataConfig {
  /** Enable/disable app data storage */
  enabled: boolean;
  /** Default namespace for app data */
  defaultNamespace: string;
  /** Enable versioning for app data */
  enableVersioning: boolean;
}

/**
 * Complete configuration for ChabadUniverse Auth system
 */
export interface ChabadUniverseAuthConfig {
  /** Sync configuration */
  sync: SyncConfig;
  /** Activity tracking configuration */
  activity: ActivityConfig;
  /** Preferences configuration */
  preferences: PreferencesConfig;
  /** Profile configuration */
  profile: ProfileConfig;
  /** Authorization configuration */
  authorization: AuthorizationConfig;
  /** Analytics configuration */
  analytics: AnalyticsConfig;
  /** App data configuration */
  appData: AppDataConfig;
  /** API base URL */
  apiBaseUrl?: string;
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Default configuration values
 */
export const defaultConfig: ChabadUniverseAuthConfig = {
  sync: {
    enabled: true,
    defaultInterval: 30000, // 30 seconds
    activeInterval: 10000,  // 10 seconds
    idleInterval: 60000,    // 60 seconds (1 minute)
    idleTimeout: 300000,    // 5 minutes
  },
  activity: {
    enabled: true,
    batchSize: 5,
    batchTimeout: 2000, // 2 seconds
    autoCleanup: true,
    ttl: 2592000000, // 30 days in milliseconds
  },
  preferences: {
    enabled: true,
    enableCache: true,
    cacheTTL: 300000, // 5 minutes
  },
  profile: {
    enabled: true,
    enableCache: true,
    cacheTTL: 300000, // 5 minutes
  },
  authorization: {
    enabled: true,
    defaultRoles: ['user'],
    enableCache: true,
  },
  analytics: {
    enabled: true,
    sampleRate: 1.0, // Track 100% of events
    autoPageViews: true,
  },
  appData: {
    enabled: true,
    defaultNamespace: 'default',
    enableVersioning: true,
  },
  debug: false,
};

/**
 * Merge user config with defaults (deep merge)
 */
export function mergeConfig(
  userConfig: Partial<ChabadUniverseAuthConfig>
): ChabadUniverseAuthConfig {
  const merged: ChabadUniverseAuthConfig = {
    sync: { ...defaultConfig.sync, ...userConfig.sync },
    activity: { ...defaultConfig.activity, ...userConfig.activity },
    preferences: { ...defaultConfig.preferences, ...userConfig.preferences },
    profile: { ...defaultConfig.profile, ...userConfig.profile },
    authorization: { ...defaultConfig.authorization, ...userConfig.authorization },
    analytics: { ...defaultConfig.analytics, ...userConfig.analytics },
    appData: { ...defaultConfig.appData, ...userConfig.appData },
  };

  // Conditionally add optional properties
  if (userConfig.apiBaseUrl) {
    merged.apiBaseUrl = userConfig.apiBaseUrl;
  }
  if (userConfig.debug !== undefined) {
    merged.debug = userConfig.debug;
  } else if (defaultConfig.debug !== undefined) {
    merged.debug = defaultConfig.debug;
  }

  return merged;
}

/**
 * Validate configuration values
 */
export function validateConfig(config: ChabadUniverseAuthConfig): void {
  // Validate sync intervals
  if (config.sync.activeInterval > config.sync.defaultInterval) {
    console.warn(
      'activeInterval should be less than defaultInterval for optimal performance'
    );
  }
  if (config.sync.idleInterval < config.sync.defaultInterval) {
    console.warn(
      'idleInterval should be greater than defaultInterval to reduce server load'
    );
  }

  // Validate activity batch size
  if (config.activity.batchSize < 1) {
    throw new Error('activity.batchSize must be at least 1');
  }

  // Validate analytics sample rate
  if (config.analytics.sampleRate < 0 || config.analytics.sampleRate > 1) {
    throw new Error('analytics.sampleRate must be between 0 and 1');
  }

  // Validate cache TTL values
  if (config.preferences.cacheTTL < 0) {
    throw new Error('preferences.cacheTTL must be non-negative');
  }
  if (config.profile.cacheTTL < 0) {
    throw new Error('profile.cacheTTL must be non-negative');
  }
}
