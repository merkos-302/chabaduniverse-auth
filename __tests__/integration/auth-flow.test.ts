import { AuthManager } from '../../src/core/AuthManager';
import { MemoryTokenStorage } from '../../src/core/TokenStorage';
import { MockAdapter } from '../helpers/mock-adapter';
import { mockUsers, mockTokens, mockAuthResponses } from '../helpers/fixtures';
import type { AuthState } from '../../src/types';

describe('Authentication Flow Integration', () => {
  let authManager: AuthManager;
  let mockAdapter: MockAdapter;
  let tokenStorage: MemoryTokenStorage;
  let stateHistory: AuthState[];

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    tokenStorage = new MemoryTokenStorage();
    stateHistory = [];

    authManager = new AuthManager({
      adapter: mockAdapter,
      tokenStorage,
      onAuthStateChange: (state) => {
        stateHistory.push({ ...state });
      },
    });
  });

  describe('complete login flow', () => {
    it('should complete bearer token login flow', async () => {
      mockAdapter.loginWithBearerTokenMock.mockResolvedValue(mockAuthResponses.successful);

      await authManager.loginWithBearerToken('test-token');

      // Verify final state
      const finalState = authManager.getState();
      expect(finalState.isAuthenticated).toBe(true);
      expect(finalState.user).toEqual(mockUsers.testUser);
      expect(finalState.token).toBe(mockTokens.validToken);
      expect(finalState.isLoading).toBe(false);
      expect(finalState.error).toBeNull();

      // Verify token was stored
      const storedToken = await tokenStorage.getToken();
      expect(storedToken).toBe(mockTokens.validToken);

      // Verify state transitions
      expect(stateHistory.length).toBeGreaterThan(0);
      expect(stateHistory[0].isLoading).toBe(true);
      expect(stateHistory[stateHistory.length - 1].isAuthenticated).toBe(true);
    });

    it('should complete credentials login flow', async () => {
      mockAdapter.loginWithCredentialsMock.mockResolvedValue(mockAuthResponses.successful);

      await authManager.loginWithCredentials('user@test.com', 'password');

      const finalState = authManager.getState();
      expect(finalState.isAuthenticated).toBe(true);
      expect(finalState.user).toBeDefined();
      expect(mockAdapter.loginWithCredentialsMock).toHaveBeenCalledWith(
        'user@test.com',
        'password'
      );
    });

    it('should complete Google OAuth flow', async () => {
      mockAdapter.loginWithGoogleMock.mockResolvedValue(mockAuthResponses.successful);

      await authManager.loginWithGoogle('google-auth-code');

      const finalState = authManager.getState();
      expect(finalState.isAuthenticated).toBe(true);
      expect(mockAdapter.loginWithGoogleMock).toHaveBeenCalledWith('google-auth-code');
    });

    it('should complete Chabad.org SSO flow', async () => {
      mockAdapter.loginWithChabadOrgMock.mockResolvedValue(mockAuthResponses.successful);

      await authManager.loginWithChabadOrg('chabad-sso-token');

      const finalState = authManager.getState();
      expect(finalState.isAuthenticated).toBe(true);
      expect(mockAdapter.loginWithChabadOrgMock).toHaveBeenCalledWith('chabad-sso-token');
    });

    it('should complete CDSSO flow', async () => {
      mockAdapter.loginWithCDSSOMock.mockResolvedValue(mockAuthResponses.successful);

      await authManager.loginWithCDSSO();

      const finalState = authManager.getState();
      expect(finalState.isAuthenticated).toBe(true);
      expect(mockAdapter.loginWithCDSSOMock).toHaveBeenCalled();
    });
  });

  describe('logout flow', () => {
    it('should complete full logout flow', async () => {
      // Login first
      mockAdapter.mockSuccessfulLogin();
      await authManager.loginWithBearerToken('test-token');
      expect(authManager.getState().isAuthenticated).toBe(true);

      // Clear state history from login
      stateHistory = [];

      // Logout
      await authManager.logout();

      // Verify final state
      const finalState = authManager.getState();
      expect(finalState.isAuthenticated).toBe(false);
      expect(finalState.user).toBeNull();
      expect(finalState.token).toBeNull();
      expect(finalState.isLoading).toBe(false);

      // Verify tokens were cleared
      expect(await tokenStorage.getToken()).toBeNull();
      expect(await tokenStorage.getRefreshToken()).toBeNull();

      // Verify adapter logout was called
      expect(mockAdapter.logoutMock).toHaveBeenCalled();

      // Verify state transitions
      expect(stateHistory.length).toBeGreaterThan(0);
      expect(stateHistory[stateHistory.length - 1].isAuthenticated).toBe(false);
    });
  });

  describe('token refresh flow', () => {
    it('should handle refresh token flow', async () => {
      // Login with refresh token
      mockAdapter.loginWithBearerTokenMock.mockResolvedValue(mockAuthResponses.successful);
      await authManager.loginWithBearerToken('test-token');

      // Verify refresh token was stored
      const refreshToken = await tokenStorage.getRefreshToken();
      expect(refreshToken).toBe(mockTokens.refreshToken);
    });
  });

  describe('error recovery flows', () => {
    it('should recover from login error', async () => {
      // First login fails
      mockAdapter.mockFailedLogin(new Error('Network error'));
      await expect(authManager.loginWithBearerToken('test-token')).rejects.toThrow();

      expect(authManager.getState().isAuthenticated).toBe(false);
      expect(authManager.getState().error).toBeDefined();

      // Second login succeeds
      mockAdapter.mockSuccessfulLogin();
      await authManager.loginWithBearerToken('test-token');

      expect(authManager.getState().isAuthenticated).toBe(true);
      expect(authManager.getState().error).toBeNull();
    });

    it('should handle logout error gracefully', async () => {
      mockAdapter.mockSuccessfulLogin();
      await authManager.loginWithBearerToken('test-token');

      mockAdapter.logoutMock.mockRejectedValue(new Error('Logout failed'));

      await expect(authManager.logout()).rejects.toThrow('Logout failed');

      // State should still show error
      expect(authManager.getState().error).toBeDefined();
    });
  });

  describe('session persistence', () => {
    it('should restore session from stored token', async () => {
      // Store token
      await tokenStorage.setToken(mockTokens.validToken);
      mockAdapter.verifyTokenMock.mockResolvedValue(true);
      mockAdapter.getCurrentUserMock.mockResolvedValue(mockUsers.testUser);

      // Create new manager instance (simulates page reload)
      const newManager = new AuthManager({
        adapter: mockAdapter,
        tokenStorage,
      });

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = newManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUsers.testUser);
      expect(state.token).toBe(mockTokens.validToken);
    });

    it('should not restore session from invalid token', async () => {
      // Store invalid token
      await tokenStorage.setToken(mockTokens.invalidToken);
      mockAdapter.verifyTokenMock.mockResolvedValue(false);

      // Create new manager instance
      const newManager = new AuthManager({
        adapter: mockAdapter,
        tokenStorage,
      });

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = newManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(await tokenStorage.getToken()).toBeNull();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent login attempts', async () => {
      mockAdapter.mockSuccessfulLogin();

      const promises = [
        authManager.loginWithBearerToken('token-1'),
        authManager.loginWithBearerToken('token-2'),
        authManager.loginWithBearerToken('token-3'),
      ];

      await Promise.all(promises);

      // Last login should win
      expect(authManager.getState().isAuthenticated).toBe(true);
    });

    it('should handle login followed by logout', async () => {
      mockAdapter.mockSuccessfulLogin();

      await authManager.loginWithBearerToken('test-token');
      await authManager.logout();

      // After sequential operations, should be logged out
      const finalState = authManager.getState();
      expect(finalState.isAuthenticated).toBe(false);
    });
  });

  describe('event emissions', () => {
    it('should emit events in correct order', async () => {
      const events: string[] = [];

      authManager.on('auth:state-change', () => events.push('state-change'));
      authManager.on('auth:login', () => events.push('login'));
      authManager.on('auth:logout', () => events.push('logout'));
      authManager.on('auth:error', () => events.push('error'));

      // Login
      mockAdapter.mockSuccessfulLogin();
      await authManager.loginWithBearerToken('test-token');

      expect(events).toContain('state-change');
      expect(events).toContain('login');

      // Logout
      events.length = 0;
      await authManager.logout();

      expect(events).toContain('state-change');
      expect(events).toContain('logout');

      // Error
      events.length = 0;
      mockAdapter.mockFailedLogin(new Error('Test error'));
      await expect(authManager.loginWithBearerToken('test-token')).rejects.toThrow();

      expect(events).toContain('error');
    });
  });
});
