/**
 * Unit tests for Universe Identity Hooks
 *
 * Tests for useIdentity, useMerkosEnrichment, useValuEnrichment, and configuration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useIdentity,
  useMerkosEnrichment,
  useValuEnrichment,
  configureIdentityHooks,
  getIdentityHooksConfig,
  resetIdentityHooksConfig,
} from '../../../src/hooks';
import type { UniverseIdentity, MerkosEnrichment } from '../../../src/types/identity';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage with persistent store
let localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: jest.fn((key: string) => localStorageStore[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: jest.fn(() => {
    localStorageStore = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Identity Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageStore = {};
    resetIdentityHooksConfig();

    // Re-apply mock implementations (needed due to resetMocks: true in jest.config)
    localStorageMock.getItem.mockImplementation((key: string) => localStorageStore[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageStore[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete localStorageStore[key];
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('configureIdentityHooks', () => {
    it('should set custom API base URL', () => {
      configureIdentityHooks({
        apiBaseUrl: 'https://portal.chabaduniverse.com',
      });

      const config = getIdentityHooksConfig();
      expect(config.apiBaseUrl).toBe('https://portal.chabaduniverse.com');
    });

    it('should set custom token key', () => {
      configureIdentityHooks({
        tokenKey: 'custom_token_key',
      });

      const config = getIdentityHooksConfig();
      expect(config.tokenKey).toBe('custom_token_key');
    });

    it('should merge with existing config', () => {
      configureIdentityHooks({
        apiBaseUrl: 'https://api.example.com',
      });

      configureIdentityHooks({
        timeout: 5000,
      });

      const config = getIdentityHooksConfig();
      expect(config.apiBaseUrl).toBe('https://api.example.com');
      expect(config.timeout).toBe(5000);
    });

    it('should reset to defaults', () => {
      configureIdentityHooks({
        apiBaseUrl: 'https://custom.api.com',
        timeout: 5000,
      });

      resetIdentityHooksConfig();

      const config = getIdentityHooksConfig();
      expect(config.apiBaseUrl).toBe('');
      expect(config.timeout).toBe(30000);
    });
  });

  // ============================================================================
  // useIdentity Tests
  // ============================================================================

  describe('useIdentity', () => {
    const mockIdentity: UniverseIdentity = {
      universeUserId: 'universe-123',
      merkosUserId: 'merkos-456',
      email: 'test@example.com',
      displayName: 'Test User',
      linkedAccounts: ['merkos'],
    };

    it('should auto-fetch identity on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ identity: mockIdentity }),
      });

      const { result } = renderHook(() => useIdentity());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.identity).toEqual(mockIdentity);
      expect(result.current.isAuthenticated).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/me',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should not auto-fetch when autoFetch is false', async () => {
      const { result } = renderHook(() => useIdentity(false));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.identity).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle 401 response as unauthenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useIdentity());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.identity).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull(); // 401 is not an error, just unauthenticated
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useIdentity());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Network error');
    });

    it('should call linkMerkos endpoint correctly', async () => {
      // First, set up authenticated state
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ identity: mockIdentity }),
      });

      const { result } = renderHook(() => useIdentity());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock link-merkos response
      const linkedIdentity = {
        ...mockIdentity,
        merkosUserId: 'new-merkos-789',
        linkedAccounts: ['merkos', 'valu'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, identity: linkedIdentity }),
      });

      // Call linkMerkos
      let linkResult;
      await act(async () => {
        linkResult = await result.current.linkMerkos('merkos-token-123');
      });

      expect(linkResult).toEqual({ success: true, identity: linkedIdentity });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/link-merkos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ merkosToken: 'merkos-token-123' }),
        })
      );
    });

    it('should call logout endpoint and clear session', async () => {
      // First, set up authenticated state
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ identity: mockIdentity }),
      });

      const { result } = renderHook(() => useIdentity());

      await waitFor(() => {
        expect(result.current.identity).toEqual(mockIdentity);
      });

      // Mock logout response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Call logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.identity).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  // ============================================================================
  // useMerkosEnrichment Tests
  // ============================================================================

  describe('useMerkosEnrichment', () => {
    const mockEnrichment: MerkosEnrichment = {
      organizations: [
        { id: 'org-1', name: 'Test Organization', isPrimary: true },
      ],
      roles: [
        { id: 'role-1', name: 'admin', scope: 'org-1' },
      ],
      permissions: ['admin:access', 'users:read', 'users:write'],
    };

    it('should NOT auto-fetch on mount', () => {
      const { result } = renderHook(() => useMerkosEnrichment());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.enrichment).toBeNull();
      expect(result.current.hasFetched).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch enrichment data when refresh is called', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enrichment: mockEnrichment }),
      });

      const { result } = renderHook(() => useMerkosEnrichment());

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.enrichment).toBeTruthy();
      expect(result.current.enrichment?.organizations).toHaveLength(1);
      expect(result.current.enrichment?.roles).toHaveLength(1);
      expect(result.current.enrichment?.permissions).toContain('admin:access');
      expect(result.current.hasFetched).toBe(true);
    });

    it('should handle 404 as no enrichment data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      const { result } = renderHook(() => useMerkosEnrichment());

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.enrichment).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.hasFetched).toBe(true);
    });

    it('should clear enrichment data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enrichment: mockEnrichment }),
      });

      const { result } = renderHook(() => useMerkosEnrichment());

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.enrichment).toBeTruthy();

      act(() => {
        result.current.clear();
      });

      expect(result.current.enrichment).toBeNull();
      expect(result.current.hasFetched).toBe(false);
    });
  });

  // ============================================================================
  // useValuEnrichment Tests
  // ============================================================================

  describe('useValuEnrichment', () => {
    it('should return scaffold state with not implemented error', () => {
      const { result } = renderHook(() => useValuEnrichment());

      expect(result.current.enrichment).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error?.message).toBe('Valu enrichment not yet implemented');
      expect(result.current.isImplemented).toBe(false);
    });

    it('should return null from refresh and log warning', async () => {
      const { result } = renderHook(() => useValuEnrichment());

      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refresh();
      });

      expect(refreshResult).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Valu enrichment is not yet implemented')
      );
    });

    it('should have no-op clear function', () => {
      const { result } = renderHook(() => useValuEnrichment());

      // Should not throw
      expect(() => result.current.clear()).not.toThrow();
    });
  });

  // ============================================================================
  // Token Storage Tests
  // ============================================================================

  describe('Token Storage', () => {
    it('should include Authorization header when token is stored', async () => {
      // Store a token
      localStorageMock.setItem('universe_jwt_token', 'test-token-123');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ identity: { universeUserId: '123', email: 'test@test.com', displayName: 'Test', linkedAccounts: [] } }),
      });

      renderHook(() => useIdentity());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer test-token-123');
    });

    it('should remove token on logout', async () => {
      localStorageMock.setItem('universe_jwt_token', 'test-token-123');

      // First fetch identity
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ identity: { universeUserId: '123', email: 'test@test.com', displayName: 'Test', linkedAccounts: [] } }),
      });

      const { result } = renderHook(() => useIdentity());

      await waitFor(() => {
        expect(result.current.identity).toBeTruthy();
      });

      // Mock logout
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('universe_jwt_token');
    });
  });
});
