/**
 * Universe Identity Hooks
 *
 * React hooks for accessing the Universe Portal Auth API.
 * These hooks provide identity management, Merkos enrichment,
 * and (future) Valu Social integration.
 *
 * @packageDocumentation
 */

// Configuration
export {
  configureIdentityHooks,
  getIdentityHooksConfig,
  resetIdentityHooksConfig,
  type IdentityHooksConfig,
} from './config';

// Identity Hook
export {
  useIdentity,
  type UseIdentityReturn,
} from './useIdentity';

// Merkos Enrichment Hook
export {
  useMerkosEnrichment,
  type UseMerkosEnrichmentReturn,
} from './useMerkosEnrichment';

// Valu Enrichment Hook (Scaffold)
export {
  useValuEnrichment,
  type UseValuEnrichmentReturn,
} from './useValuEnrichment';
