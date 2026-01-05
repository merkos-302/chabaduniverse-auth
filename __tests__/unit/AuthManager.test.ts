import { AuthManager } from '../../src/core/AuthManager';
import { MemoryTokenStorage } from '../../src/core/TokenStorage';
import type { AuthAPIAdapter, AuthResponse, User } from '../../src/types';

/**
 * Mock adapter for testing
 */
class MockAdapter implements AuthAPIAdapter {
  async loginWithBearerToken(token: string): Promise<AuthResponse> {
    return {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'mock-token',
    };
  }

  async loginWithCredentials(username: string, password: string): Promise<AuthResponse> {
    return {
      user: { id: '1', email: username, name: 'Test User' },
      token: 'mock-token',
    };
  }

  async loginWithGoogle(code: string): Promise<AuthResponse> {
    return {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'mock-token',
    };
  }

  async loginWithChabadOrg(token: string): Promise<AuthResponse> {
    return {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'mock-token',
    };
  }

  async loginWithCDSSO(): Promise<AuthResponse> {
    return {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'mock-token',
    };
  }

  async getCurrentUser(): Promise<User> {
    return { id: '1', email: 'test@example.com', name: 'Test User' };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'new-mock-token',
    };
  }

  async logout(): Promise<void> {
    // Mock logout
  }

  async verifyToken(token: string): Promise<boolean> {
    return token === 'valid-token';
  }
}

describe('AuthManager', () => {
  let authManager: AuthManager;
  let mockAdapter: MockAdapter;
  let tokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    tokenStorage = new MemoryTokenStorage();
    authManager = new AuthManager({
      adapter: mockAdapter,
      tokenStorage,
    });
  });

  describe('initialization', () => {
    it('should create an AuthManager instance', () => {
      expect(authManager).toBeInstanceOf(AuthManager);
    });

    it('should have initial unauthenticated state', () => {
      const state = authManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('loginWithBearerToken', () => {
    it('should login successfully with bearer token', async () => {
      await authManager.loginWithBearerToken('test-token');
      const state = authManager.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.token).toBe('mock-token');
    });

    it('should store token in token storage', async () => {
      await authManager.loginWithBearerToken('test-token');
      const storedToken = await tokenStorage.getToken();

      expect(storedToken).toBe('mock-token');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Login first
      await authManager.loginWithBearerToken('test-token');
      expect(authManager.getState().isAuthenticated).toBe(true);

      // Then logout
      await authManager.logout();
      const state = authManager.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should clear token from storage', async () => {
      // Login first
      await authManager.loginWithBearerToken('test-token');
      expect(await tokenStorage.getToken()).toBe('mock-token');

      // Then logout
      await authManager.logout();
      expect(await tokenStorage.getToken()).toBeNull();
    });
  });

  describe('getState', () => {
    it('should return current auth state', () => {
      const state = authManager.getState();

      expect(state).toHaveProperty('isAuthenticated');
      expect(state).toHaveProperty('isLoading');
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('error');
      expect(state).toHaveProperty('token');
    });
  });
});
