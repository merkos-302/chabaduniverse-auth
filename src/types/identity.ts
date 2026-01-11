/**
 * Universe Identity Types
 *
 * Type definitions for the Universe Identity API, which provides
 * unified identity management across ChabadUniverse applications.
 *
 * @packageDocumentation
 */

/**
 * Universe Identity - Unified user identity from Universe Portal
 *
 * Represents the canonical identity for a user in the ChabadUniverse ecosystem.
 * This identity can be linked to multiple authentication providers (Merkos, Valu, etc.)
 */
export interface UniverseIdentity {
  /**
   * Universe Portal user ID (primary identifier)
   */
  universeUserId: string;

  /**
   * Linked Merkos Platform user ID (optional)
   */
  merkosUserId?: string;

  /**
   * Linked Valu Social user ID (optional)
   */
  valuUserId?: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's display name
   */
  displayName: string;

  /**
   * List of linked authentication providers
   * @example ['merkos', 'valu', 'google']
   */
  linkedAccounts: string[];

  /**
   * User's avatar/profile image URL (optional)
   */
  avatarUrl?: string;

  /**
   * User's first name (optional)
   */
  firstName?: string;

  /**
   * User's last name (optional)
   */
  lastName?: string;

  /**
   * Whether the email has been verified
   */
  emailVerified?: boolean;

  /**
   * When the identity was created
   */
  createdAt?: string;

  /**
   * When the identity was last updated
   */
  updatedAt?: string;

  /**
   * Additional metadata about the identity
   */
  metadata?: Record<string, unknown>;
}

/**
 * Organization from Merkos Platform
 *
 * Represents an organization the user is associated with in Merkos Platform
 */
export interface Organization {
  /**
   * Organization ID
   */
  id: string;

  /**
   * Organization name
   */
  name: string;

  /**
   * Organization type (e.g., 'chabad_house', 'school', 'camp')
   */
  type?: string;

  /**
   * User's role in this organization
   */
  role?: string;

  /**
   * Whether this is the user's primary organization
   */
  isPrimary?: boolean;
}

/**
 * Role from Merkos Platform
 *
 * Represents a role the user holds in Merkos Platform
 */
export interface Role {
  /**
   * Role ID
   */
  id: string;

  /**
   * Role name (e.g., 'admin', 'director', 'staff')
   */
  name: string;

  /**
   * Scope of the role (organization ID or 'global')
   */
  scope?: string;

  /**
   * Permissions associated with this role
   */
  permissions?: string[];
}

/**
 * Merkos Enrichment Data
 *
 * Additional organizational data from Merkos Platform, including
 * organizations, roles, and permissions the user has.
 */
export interface MerkosEnrichment {
  /**
   * Organizations the user is associated with
   */
  organizations: Organization[];

  /**
   * Roles the user holds
   */
  roles: Role[];

  /**
   * Aggregated permissions from all roles
   */
  permissions: string[];

  /**
   * Whether this data is from cache
   */
  fromCache?: boolean;

  /**
   * When the data was last fetched
   */
  fetchedAt?: string;

  /**
   * When the cache expires (if cached)
   */
  expiresAt?: string;
}

/**
 * Valu Enrichment Data (Future)
 *
 * Additional social/community data from Valu Social platform.
 * This is a scaffold for future implementation.
 */
export interface ValuEnrichment {
  /**
   * Valu communities the user belongs to
   */
  communities?: Array<{
    id: string;
    name: string;
    role?: string;
  }>;

  /**
   * Valu network information
   */
  network?: {
    id: string;
    name: string;
  };

  /**
   * Social connections count
   */
  connectionsCount?: number;

  /**
   * Whether this data is from cache
   */
  fromCache?: boolean;

  /**
   * When the data was last fetched
   */
  fetchedAt?: string;
}

/**
 * Link Merkos Request
 *
 * Request payload for linking a Merkos account to Universe Identity
 */
export interface LinkMerkosRequest {
  /**
   * Merkos JWT token to link
   */
  merkosToken: string;
}

/**
 * Link Merkos Response
 *
 * Response from linking a Merkos account
 */
export interface LinkMerkosResponse {
  /**
   * Whether linking was successful
   */
  success: boolean;

  /**
   * Updated identity after linking
   */
  identity?: UniverseIdentity;

  /**
   * Error message if linking failed
   */
  error?: string;
}

/**
 * Identity Hook State
 *
 * State returned by the useIdentity hook
 */
export interface IdentityHookState {
  /**
   * The current user's identity (null if not authenticated)
   */
  identity: UniverseIdentity | null;

  /**
   * Whether the identity is currently being fetched
   */
  isLoading: boolean;

  /**
   * Error that occurred during identity operations
   */
  error: Error | null;
}

/**
 * Merkos Enrichment Hook State
 *
 * State returned by the useMerkosEnrichment hook
 */
export interface MerkosEnrichmentHookState {
  /**
   * Merkos enrichment data (null if not fetched or not linked)
   */
  enrichment: MerkosEnrichment | null;

  /**
   * Whether enrichment data is currently being fetched
   */
  isLoading: boolean;

  /**
   * Error that occurred during enrichment fetch
   */
  error: Error | null;
}

/**
 * Valu Enrichment Hook State
 *
 * State returned by the useValuEnrichment hook
 */
export interface ValuEnrichmentHookState {
  /**
   * Valu enrichment data (null if not fetched or not linked)
   */
  enrichment: ValuEnrichment | null;

  /**
   * Whether enrichment data is currently being fetched
   */
  isLoading: boolean;

  /**
   * Error that occurred during enrichment fetch
   */
  error: Error | null;
}
