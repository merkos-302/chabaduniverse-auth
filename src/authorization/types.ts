/**
 * Authorization Types
 *
 * Type definitions for RBAC (Role-Based Access Control)
 */

/**
 * User role
 */
export type Role = 'user' | 'admin' | 'moderator' | 'editor' | 'viewer' | string;

/**
 * Permission
 */
export type Permission =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'admin'
  | string;

/**
 * Resource type
 */
export type Resource = 'profile' | 'preferences' | 'app-data' | 'analytics' | string;

/**
 * Role permissions mapping
 */
export interface RolePermissions {
  role: Role;
  permissions: Permission[];
  resources?: Resource[];
}

/**
 * Authorization rules
 */
export interface AuthorizationRules {
  /** Roles and their permissions */
  roles: RolePermissions[];
  /** Default role for new users (optional - for future use) */
  defaultRole?: Role;
}

/**
 * Authorization state
 */
export interface AuthorizationState {
  /** User roles */
  roles: Role[];
  /** Authorization rules */
  rules: AuthorizationRules | null;
  /** Whether initialized */
  isInitialized: boolean;
}

/**
 * Authorization context value
 */
export interface AuthorizationContextValue extends AuthorizationState {
  /** Check if user has role */
  hasRole: (role: Role) => boolean;
  /** Check if user has permission on resource */
  hasPermission: (permission: Permission, resource?: Resource) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: Role[]) => boolean;
  /** Check if user has all of the specified roles */
  hasAllRoles: (roles: Role[]) => boolean;
  /** Check if user can perform action on resource */
  can: (action: Permission, resource?: Resource) => boolean;
  /** Get all permissions for current user */
  getPermissions: () => Permission[];
  /** Load authorization rules */
  loadRules: () => Promise<void>;
}
