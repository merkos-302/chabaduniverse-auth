/**
 * useAuthorization Hook
 *
 * React hook for role-based access control
 */

import { useAuthorizationContext } from '../context/AuthorizationContext.js';
import type { Role, Permission, Resource } from '../types.js';

/**
 * Authorization hook return value
 */
export interface UseAuthorizationReturn {
  /** User roles */
  roles: Role[];
  /** Check if user has role */
  hasRole: (role: Role) => boolean;
  /** Check if user has permission */
  hasPermission: (permission: Permission, resource?: Resource) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: Role[]) => boolean;
  /** Check if user has all of the specified roles */
  hasAllRoles: (roles: Role[]) => boolean;
  /** Check if user can perform action */
  can: (action: Permission, resource?: Resource) => boolean;
  /** Get all permissions */
  getPermissions: () => Permission[];
}

/**
 * Hook for authorization and role-based access control
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { hasRole, can } = useAuthorization();
 *
 *   if (!hasRole('admin')) {
 *     return <div>Access Denied</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Admin Panel</h1>
 *       {can('delete', 'profile') && (
 *         <button>Delete Profile</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthorization(): UseAuthorizationReturn {
  const context = useAuthorizationContext();

  return {
    roles: context.roles,
    hasRole: context.hasRole,
    hasPermission: context.hasPermission,
    hasAnyRole: context.hasAnyRole,
    hasAllRoles: context.hasAllRoles,
    can: context.can,
    getPermissions: context.getPermissions,
  };
}
