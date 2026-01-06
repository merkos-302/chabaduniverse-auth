/**
 * Authorization Context Tests
 *
 * Tests for RBAC permission checking and role management
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import {
  AuthorizationProvider,
  useAuthorizationContext,
} from '../../../src/authorization/context/AuthorizationContext';
import type {
  Role,
  Permission,
  AuthorizationRules,
} from '../../../src/authorization/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('AuthorizationContext', () => {
  const mockFetch = global.fetch as jest.Mock;

  const defaultRules: AuthorizationRules = {
    roles: [
      {
        role: 'user' as Role,
        permissions: ['read' as Permission],
      },
      {
        role: 'editor' as Role,
        permissions: ['read' as Permission, 'write' as Permission],
      },
      {
        role: 'admin' as Role,
        permissions: ['admin' as Permission], // admin permission grants all
      },
    ],
  };

  const createWrapper = (
    userRoles: Role[],
    rules?: AuthorizationRules
  ) => {
    return ({ children }: { children: React.ReactNode }) => (
      <AuthorizationProvider
        userRoles={userRoles}
        config={{ enabled: true, defaultRoles: ['user'], enableCache: true }}
        rules={rules}
      >
        {children}
      </AuthorizationProvider>
    );
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Initialization', () => {
    it('should initialize with provided user roles', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user', 'editor']),
      });

      expect(result.current.roles).toEqual(['user', 'editor']);
      expect(result.current.isInitialized).toBe(false); // No rules provided
    });

    it('should initialize with provided rules', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      expect(result.current.roles).toEqual(['user']);
      expect(result.current.rules).toEqual(defaultRules);
      expect(result.current.isInitialized).toBe(true);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuthorizationContext());
      }).toThrow('useAuthorizationContext must be used within AuthorizationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Permission Checking', () => {
    it('should allow permission for user with correct role', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      expect(result.current.hasPermission('read' as Permission)).toBe(true);
    });

    it('should deny permission for user without correct role', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      expect(result.current.hasPermission('write' as Permission)).toBe(false);
    });

    it('should allow multiple permissions for editor role', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['editor'], defaultRules),
      });

      expect(result.current.hasPermission('read' as Permission)).toBe(true);
      expect(result.current.hasPermission('write' as Permission)).toBe(true);
    });

    it('should grant all permissions with admin permission', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['admin'], defaultRules),
      });

      expect(result.current.hasPermission('read' as Permission)).toBe(true);
      expect(result.current.hasPermission('write' as Permission)).toBe(true);
      expect(result.current.hasPermission('delete' as Permission)).toBe(true); // Admin has all
    });

    it('should check permissions across multiple user roles', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user', 'editor'], defaultRules),
      });

      // User has both user and editor permissions
      expect(result.current.hasPermission('read' as Permission)).toBe(true);
      expect(result.current.hasPermission('write' as Permission)).toBe(true);
    });

    it('should allow all permissions when authorization is disabled', () => {
      const DisabledWrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthorizationProvider
          userRoles={['user']}
          config={{ enabled: false, defaultRoles: ['user'], enableCache: true }}
          rules={defaultRules}
        >
          {children}
        </AuthorizationProvider>
      );

      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: DisabledWrapper,
      });

      // With authorization disabled, all permissions should be allowed
      expect(result.current.hasPermission('read' as Permission)).toBe(true);
      expect(result.current.hasPermission('write' as Permission)).toBe(true);
      expect(result.current.hasPermission('delete' as Permission)).toBe(true);
      expect(result.current.hasPermission('admin' as Permission)).toBe(true);
    });
  });

  describe('Role Checking', () => {
    it('should return true for hasRole when user has role', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user', 'editor'], defaultRules),
      });

      expect(result.current.hasRole('user' as Role)).toBe(true);
      expect(result.current.hasRole('editor' as Role)).toBe(true);
    });

    it('should return false for hasRole when user does not have role', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      expect(result.current.hasRole('admin' as Role)).toBe(false);
    });

    it('should return true for hasAnyRole when user has any of the roles', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      expect(
        result.current.hasAnyRole(['user', 'admin', 'editor'] as Role[])
      ).toBe(true);
    });

    it('should return false for hasAnyRole when user has none of the roles', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      expect(result.current.hasAnyRole(['admin', 'moderator'] as Role[])).toBe(false);
    });

    it('should return true for hasAllRoles when user has all roles', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user', 'editor'], defaultRules),
      });

      expect(result.current.hasAllRoles(['user', 'editor'] as Role[])).toBe(true);
    });

    it('should return false for hasAllRoles when user is missing one role', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      expect(result.current.hasAllRoles(['user', 'editor'] as Role[])).toBe(false);
    });
  });

  describe('can() Helper', () => {
    it('should be an alias for hasPermission', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['editor'], defaultRules),
      });

      expect(result.current.can('write' as Permission)).toBe(true);
      expect(result.current.can('delete' as Permission)).toBe(false);
    });
  });

  describe('getPermissions()', () => {
    it('should return all permissions for user roles', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user', 'editor'], defaultRules),
      });

      const permissions = result.current.getPermissions();

      expect(permissions).toContain('read');
      expect(permissions).toContain('write');
      expect(permissions.length).toBe(2); // read and write
    });

    it('should return unique permissions when roles overlap', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user', 'editor'], defaultRules),
      });

      const permissions = result.current.getPermissions();

      // Both user and editor have 'read', should only appear once
      expect(permissions.filter((p) => p === 'read').length).toBe(1);
    });

    it('should return admin permission for admin role', () => {
      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['admin'], defaultRules),
      });

      const permissions = result.current.getPermissions();

      expect(permissions).toContain('admin');
    });

    it('should return empty array for user with no permissions', () => {
      const noPermsRules: AuthorizationRules = {
        roles: [
          {
            role: 'guest' as Role,
            permissions: [],
          },
        ],
      };

      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['guest'], noPermsRules),
      });

      const permissions = result.current.getPermissions();

      expect(permissions).toEqual([]);
    });
  });

  describe('Rules Loading', () => {
    it('should load rules from API when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rules: defaultRules }),
      });

      const ApiWrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthorizationProvider
          userRoles={['user']}
          config={{ enabled: true, defaultRoles: ['user'], enableCache: true }}
          apiBaseUrl="https://api.example.com"
        >
          {children}
        </AuthorizationProvider>
      );

      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: ApiWrapper,
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/api/authorization/rules');
      expect(result.current.rules).toEqual(defaultRules);
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const ApiWrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthorizationProvider
          userRoles={['user']}
          config={{ enabled: true, defaultRoles: ['user'], enableCache: true }}
          apiBaseUrl="https://api.example.com"
        >
          {children}
        </AuthorizationProvider>
      );

      const { result } = renderHook(() => useAuthorizationContext(), {
        wrapper: ApiWrapper,
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Should still be usable, just without rules
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.rules).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should not load rules when already provided', () => {
      renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      // Should not call API when rules are provided
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not load rules when authorization is disabled', () => {
      const DisabledWrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthorizationProvider
          userRoles={['user']}
          config={{ enabled: false, defaultRoles: ['user'], enableCache: true }}
          apiBaseUrl="https://api.example.com"
        >
          {children}
        </AuthorizationProvider>
      );

      renderHook(() => useAuthorizationContext(), {
        wrapper: DisabledWrapper,
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Permission Caching', () => {
    it('should use memoized permissions map for performance', () => {
      const { result, rerender } = renderHook(() => useAuthorizationContext(), {
        wrapper: createWrapper(['user'], defaultRules),
      });

      const firstCheck = result.current.hasPermission('read' as Permission);

      // Rerender without changing rules
      rerender();

      const secondCheck = result.current.hasPermission('read' as Permission);

      // Both checks should return same result (memoization working)
      expect(firstCheck).toBe(secondCheck);
      expect(firstCheck).toBe(true);
    });
  });
});
