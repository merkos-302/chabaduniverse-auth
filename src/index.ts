/**
 * @chabaduniverse/auth - Authentication library for ChabadUniverse applications
 *
 * @packageDocumentation
 */

/**
 * Package version
 */
export const VERSION = '1.0.0';

/**
 * Export core authentication modules
 */
export * from './core';

/**
 * Export adapters
 */
export * from './adapters';

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
