/**
 * Authorization Context
 *
 * React context for role-based access control (RBAC)
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import type {
  Role,
  Permission,
  Resource,
  AuthorizationRules,
  AuthorizationState,
  AuthorizationContextValue,
} from '../types.js';
import type { AuthorizationConfig } from '../../config/index.js';

/**
 * Authorization Context
 */
const AuthorizationContext = createContext<AuthorizationContextValue | null>(null);

/**
 * Authorization Provider Props
 */
export interface AuthorizationProviderProps {
  children: React.ReactNode;
  /** User roles */
  userRoles: Role[];
  /** Authorization configuration */
  config: AuthorizationConfig;
  /** API base URL */
  apiBaseUrl?: string;
  /** Authorization rules (optional, can be loaded from API) */
  rules?: AuthorizationRules;
}

/**
 * Authorization Provider Component
 */
export function AuthorizationProvider({
  children,
  userRoles,
  config,
  apiBaseUrl = '',
  rules: initialRules,
}: AuthorizationProviderProps): JSX.Element {
  // State
  const [state, setState] = useState<AuthorizationState>({
    roles: userRoles,
    rules: initialRules || null,
    isInitialized: !!initialRules,
  });

  /**
   * Load authorization rules from API
   */
  const loadRules = useCallback(async (): Promise<void> => {
    if (!config.enabled || state.rules) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/authorization/rules`);
      if (!response.ok) {
        throw new Error(`Failed to load authorization rules: ${response.statusText}`);
      }

      const data = await response.json();
      const rules: AuthorizationRules = data.rules;

      setState((prev) => ({
        ...prev,
        rules,
        isInitialized: true,
      }));
    } catch (error) {
      console.error('Failed to load authorization rules:', error);
    }
  }, [config.enabled, apiBaseUrl, state.rules]);

  // Memoized permission checks
  const permissionsMap = useMemo(() => {
    if (!state.rules) {
      return new Map<Role, Set<Permission>>();
    }

    const map = new Map<Role, Set<Permission>>();
    state.rules.roles.forEach((rolePerms) => {
      map.set(rolePerms.role, new Set(rolePerms.permissions));
    });

    return map;
  }, [state.rules]);

  /**
   * Check if user has role
   */
  const hasRole = useCallback(
    (role: Role): boolean => {
      return state.roles.includes(role);
    },
    [state.roles]
  );

  /**
   * Check if user has permission
   */
  const hasPermission = useCallback(
    (permission: Permission, _resource?: Resource): boolean => {
      if (!config.enabled) {
        return true; // Allow all if authorization disabled
      }

      // Check each user role
      for (const role of state.roles) {
        const perms = permissionsMap.get(role);
        if (perms && (perms.has(permission) || perms.has('admin'))) {
          return true;
        }
      }

      return false;
    },
    [config.enabled, state.roles, permissionsMap]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: Role[]): boolean => {
      return roles.some((role) => hasRole(role));
    },
    [hasRole]
  );

  /**
   * Check if user has all of the specified roles
   */
  const hasAllRoles = useCallback(
    (roles: Role[]): boolean => {
      return roles.every((role) => hasRole(role));
    },
    [hasRole]
  );

  /**
   * Check if user can perform action on resource
   */
  const can = useCallback(
    (action: Permission, resource?: Resource): boolean => {
      return hasPermission(action, resource);
    },
    [hasPermission]
  );

  /**
   * Get all permissions for current user
   */
  const getPermissions = useCallback((): Permission[] => {
    const allPermissions = new Set<Permission>();

    for (const role of state.roles) {
      const perms = permissionsMap.get(role);
      if (perms) {
        perms.forEach((p) => allPermissions.add(p));
      }
    }

    return Array.from(allPermissions);
  }, [state.roles, permissionsMap]);

  // Initialize on mount
  useEffect(() => {
    if (config.enabled && !state.rules) {
      loadRules();
    }
  }, [config.enabled, state.rules, loadRules]);

  // Context value
  const value: AuthorizationContextValue = {
    ...state,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    can,
    getPermissions,
    loadRules,
  };

  return (
    <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>
  );
}

/**
 * Hook to use authorization context
 */
export function useAuthorizationContext(): AuthorizationContextValue {
  const context = useContext(AuthorizationContext);
  if (!context) {
    throw new Error('useAuthorizationContext must be used within AuthorizationProvider');
  }
  return context;
}
