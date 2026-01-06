/**
 * @chabaduniverse/auth - Authentication library for ChabadUniverse applications
 *
 * @packageDocumentation
 */

/**
 * Package version
 */
export const VERSION = '0.1.0';

/**
 * Export core authentication modules (Phase 1-2)
 */
export * from './core';

/**
 * Export adapters (Phase 1-2)
 */
export * from './adapters';

/**
 * Export configuration system (Phase 3-4)
 */
export * from './config';

/**
 * Export profile management (Phase 3-4)
 */
export * from './profile';

/**
 * Export preferences management (Phase 3-4)
 */
export * from './preferences';

/**
 * Export activity tracking (Phase 3-4)
 */
export * from './activity';

/**
 * Export app data storage (Phase 3-4)
 */
export * from './app-data';

/**
 * Export authorization (RBAC) (Phase 3-4)
 */
export * from './authorization';

/**
 * Export analytics (Phase 3-4)
 */
export * from './analytics';

/**
 * Export data synchronization (Phase 3-4)
 */
export * from './sync';

/**
 * Export unified provider components (Phase 3-4)
 */
export * from './providers';

/**
 * Note: React bindings are exported from '@chabaduniverse/auth/react'
 * Import them separately to avoid bundling React in non-React applications.
 *
 * @example
 * ```typescript
 * // Core usage (framework-agnostic)
 * import { AuthManager } from '@chabaduniverse/auth';
 * import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
 *
 * const adapter = new MerkosAPIAdapter({ baseUrl: 'https://shop.merkos302.com' });
 * const auth = new AuthManager({ adapter });
 *
 * // React usage
 * import { AuthProvider, useAuth } from '@chabaduniverse/auth/react';
 * ```
 */
