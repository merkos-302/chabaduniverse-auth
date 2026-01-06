/**
 * ChabadUniverse Auth Provider
 *
 * Unified provider component that composes all authentication modules:
 * - Core Authentication (Phase 1-2)
 * - Profile Management
 * - Preferences
 * - Activity Tracking
 * - App Data Storage
 * - Authorization (RBAC)
 * - Analytics
 * - Data Synchronization
 */

import React, { useMemo } from 'react';
import { ProfileProvider } from '../profile/context/ProfileContext.js';
import { PreferencesProvider } from '../preferences/context/PreferencesContext.js';
import { ActivityProvider } from '../activity/context/ActivityContext.js';
import { AppDataProvider } from '../app-data/context/AppDataContext.js';
import { AuthorizationProvider } from '../authorization/context/AuthorizationContext.js';
import { AnalyticsProvider } from '../analytics/context/AnalyticsContext.js';
import type { ChabadUniverseAuthConfig } from '../config/index.js';
import { mergeConfig, validateConfig } from '../config/index.js';
import type { Role } from '../authorization/types.js';

/**
 * ChabadUniverse Auth Provider Props
 */
export interface ChabadUniverseAuthProviderProps {
  children: React.ReactNode;
  /** User ID */
  userId: string;
  /** App ID */
  appId: string;
  /** User roles for authorization */
  userRoles?: Role[];
  /** Configuration (merged with defaults) */
  config?: Partial<ChabadUniverseAuthConfig>;
}

/**
 * ChabadUniverse Auth Provider Component
 *
 * Provides all authentication modules in a single wrapper component.
 *
 * @example
 * ```tsx
 * import { ChabadUniverseAuthProvider } from '@chabaduniverse/auth';
 *
 * function App() {
 *   return (
 *     <ChabadUniverseAuthProvider
 *       userId="user123"
 *       appId="my-app"
 *       userRoles={['user', 'editor']}
 *       config={{
 *         sync: { defaultInterval: 45000 },
 *         analytics: { sampleRate: 0.5 }
 *       }}
 *     >
 *       <YourApp />
 *     </ChabadUniverseAuthProvider>
 *   );
 * }
 * ```
 */
export function ChabadUniverseAuthProvider({
  children,
  userId,
  appId,
  userRoles = ['user'],
  config: userConfig = {},
}: ChabadUniverseAuthProviderProps): JSX.Element {
  // Merge and validate configuration
  const config = useMemo(() => {
    const merged = mergeConfig(userConfig);
    validateConfig(merged);
    return merged;
  }, [userConfig]);

  // Build the provider tree
  return (
    <AuthorizationProvider
      userRoles={userRoles}
      config={config.authorization}
      {...(config.apiBaseUrl && { apiBaseUrl: config.apiBaseUrl })}
    >
      <ProfileProvider
        userId={userId}
        config={config.profile}
        {...(config.apiBaseUrl && { apiBaseUrl: config.apiBaseUrl })}
      >
        <PreferencesProvider
          userId={userId}
          config={config.preferences}
          {...(config.apiBaseUrl && { apiBaseUrl: config.apiBaseUrl })}
        >
          <ActivityProvider
            userId={userId}
            appId={appId}
            config={config.activity}
            {...(config.apiBaseUrl && { apiBaseUrl: config.apiBaseUrl })}
          >
            <AppDataProvider
              userId={userId}
              appId={appId}
              config={config.appData}
              {...(config.apiBaseUrl && { apiBaseUrl: config.apiBaseUrl })}
            >
              <AnalyticsProvider
                userId={userId}
                appId={appId}
                config={config.analytics}
                {...(config.apiBaseUrl && { apiBaseUrl: config.apiBaseUrl })}
              >
                {children}
              </AnalyticsProvider>
            </AppDataProvider>
          </ActivityProvider>
        </PreferencesProvider>
      </ProfileProvider>
    </AuthorizationProvider>
  );
}

/**
 * Export individual providers for composable use
 *
 * Note: AuthProvider from Phase 1-2 is not included here as it requires
 * framework-specific adapters (apiAdapter, userServiceAdapter, cdssoUtils).
 * Use the core authentication module directly if needed.
 */
export {
  ProfileProvider,
  PreferencesProvider,
  ActivityProvider,
  AppDataProvider,
  AuthorizationProvider,
  AnalyticsProvider,
};
