/**
 * Core Hooks for Authentication
 *
 * Framework-agnostic React hooks for authentication
 *
 * Note: useAuth is exported from AuthContext, not from hooks.
 * Import it from the core module or contexts module.
 */

export {
  useValuAuth,
  ValuAPIProvider,
  type UseValuAuthReturn,
  type PortalUser,
} from './useValuAuth.js';
