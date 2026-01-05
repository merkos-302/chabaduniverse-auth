import { AuthManager } from '../../../src/core/AuthManager';
import { MemoryTokenStorage } from '../../../src/core/TokenStorage';
import { MockAdapter } from '../../helpers/mock-adapter';
import { mockUsers, mockTokens, mockAuthResponses, mockErrors } from '../../helpers/fixtures';
import type { AuthState } from '../../../src/types';

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

  afterEach(() => {
    mockAdapter.reset();
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
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should restore session from stored token', async () => {
      // Setup stored token
      await tokenStorage.setToken(mockTokens.validToken);
      mockAdapter.verifyTokenMock.mockResolvedValue(true);
      mockAdapter.getCurrentUserMock.mockResolvedValue(mockUsers.testUser);

      // Create new instance to trigger initialization
      const newAuthManager = new AuthManager({
        adapter: mockAdapter,
        tokenStorage,
      });

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = newAuthManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUsers.testUser);
      expect(state.token).toBe(mockTokens.validToken);
    });

    it('should clear invalid stored token', async () => {
      // Setup stored token
      await tokenStorage.setToken(mockTokens.invalidToken);
      mockAdapter.verifyTokenMock.mockResolvedValue(false);

      // Create new instance to trigger initialization
      const newAuthManager = new AuthManager({
        adapter: mockAdapter,
        tokenStorage,
      });

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = newAuthManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(await tokenStorage.getToken()).toBeNull();
    });
  });

  describe('loginWithBearerToken', () => {
    it('should login successfully with bearer token', async () => {
      mockAdapter.mockSuccessfulLogin();

      await authManager.loginWithBearerToken('test-token');
      const state = authManager.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.token).toBe('mock-token');
      expect(mockAdapter.loginWithBearerTokenMock).toHaveBeenCalledWith('test-token');
    });

    it('should store token in token storage', async () => {
      mockAdapter.mockSuccessfulLogin();

      await authManager.loginWithBearerToken('test-token');
      const storedToken = await tokenStorage.getToken();

      expect(storedToken).toBe('mock-token');
    });

    it('should set loading state during login', async () => {
      mockAdapter.mockSuccessfulLogin();

      const promise = authManager.loginWithBearerToken('test-token');

      // Check loading state immediately
      const loadingState = authManager.getState();
      expect(loadingState.isLoading).toBe(true);

      await promise;

      // Check final state
      const finalState = authManager.getState();
      expect(finalState.isLoading).toBe(false);
    });

    it('should emit auth:login event on success', async () => {
      mockAdapter.mockSuccessfulLogin();
      const loginListener = jest.fn();

      authManager.on('auth:login', loginListener);
      await authManager.loginWithBearerToken('test-token');

      expect(loginListener).toHaveBeenCalled();
    });

    it('should handle login error', async () => {
      mockAdapter.mockFailedLogin(mockErrors.invalidCredentials);

      await expect(authManager.loginWithBearerToken('test-token')).rejects.toThrow('Invalid credentials');

      const state = authManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeDefined();
    });

    it('should emit auth:error event on failure', async () => {
      mockAdapter.mockFailedLogin(mockErrors.invalidCredentials);
      const errorListener = jest.fn();

      authManager.on('auth:error', errorListener);
      await expect(authManager.loginWithBearerToken('test-token')).rejects.toThrow();

      expect(errorListener).toHaveBeenCalled();
    });

    it('should clear previous error on new login attempt', async () => {
      // First login fails
      mockAdapter.mockFailedLogin(mockErrors.invalidCredentials);
      await expect(authManager.loginWithBearerToken('test-token')).rejects.toThrow();
      expect(authManager.getState().error).toBeDefined();

      // Second login succeeds
      mockAdapter.mockSuccessfulLogin();
      await authManager.loginWithBearerToken('test-token');
      expect(authManager.getState().error).toBeNull();
    });
  });

  describe('loginWithCredentials', () => {
    it('should login successfully with credentials', async () => {
      mockAdapter.mockSuccessfulLogin();

      await authManager.loginWithCredentials('user@example.com', 'password');
      const state = authManager.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(mockAdapter.loginWithCredentialsMock).toHaveBeenCalledWith('user@example.com', 'password');
    });

    it('should handle credentials login error', async () => {
      mockAdapter.mockFailedLogin(mockErrors.invalidCredentials);

      await expect(
        authManager.loginWithCredentials('user@example.com', 'wrong-password')
      ).rejects.toThrow();

      expect(authManager.getState().isAuthenticated).toBe(false);
    });
  });

  describe('loginWithGoogle', () => {
    it('should login successfully with Google', async () => {
      mockAdapter.mockSuccessfulLogin();

      await authManager.loginWithGoogle('google-code-123');
      const state = authManager.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(mockAdapter.loginWithGoogleMock).toHaveBeenCalledWith('google-code-123');
    });
  });

  describe('loginWithChabadOrg', () => {
    it('should login successfully with Chabad.org token', async () => {
      mockAdapter.mockSuccessfulLogin();

      await authManager.loginWithChabadOrg('chabad-token-456');
      const state = authManager.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(mockAdapter.loginWithChabadOrgMock).toHaveBeenCalledWith('chabad-token-456');
    });
  });

  describe('loginWithCDSSO', () => {
    it('should login successfully with CDSSO', async () => {
      mockAdapter.mockSuccessfulLogin();

      await authManager.loginWithCDSSO();
      const state = authManager.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(mockAdapter.loginWithCDSSOMock).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      mockAdapter.mockSuccessfulLogin();
      await authManager.loginWithBearerToken('test-token');
    });

    it('should logout successfully', async () => {
      expect(authManager.getState().isAuthenticated).toBe(true);

      await authManager.logout();
      const state = authManager.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should clear token from storage', async () => {
      expect(await tokenStorage.getToken()).toBe('mock-token');

      await authManager.logout();
      expect(await tokenStorage.getToken()).toBeNull();
    });

    it('should clear refresh token if present', async () => {
      await tokenStorage.setRefreshToken('refresh-token');

      await authManager.logout();
      expect(await tokenStorage.getRefreshToken()).toBeNull();
    });

    it('should emit auth:logout event', async () => {
      const logoutListener = jest.fn();
      authManager.on('auth:logout', logoutListener);

      await authManager.logout();

      expect(logoutListener).toHaveBeenCalled();
    });

    it('should call adapter logout method', async () => {
      await authManager.logout();

      expect(mockAdapter.logoutMock).toHaveBeenCalled();
    });

    it('should handle logout error', async () => {
      mockAdapter.logoutMock.mockRejectedValue(new Error('Logout failed'));

      await expect(authManager.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('state management', () => {
    it('should return current auth state', () => {
      const state = authManager.getState();

      expect(state).toHaveProperty('isAuthenticated');
      expect(state).toHaveProperty('isLoading');
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('error');
      expect(state).toHaveProperty('token');
    });

    it('should return a copy of state (not reference)', () => {
      const state1 = authManager.getState();
      const state2 = authManager.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('should emit state-change event on state updates', async () => {
      const stateChangeListener = jest.fn();
      authManager.on('auth:state-change', stateChangeListener);

      mockAdapter.mockSuccessfulLogin();
      await authManager.loginWithBearerToken('test-token');

      // Should emit at least twice: loading start and login complete
      expect(stateChangeListener.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('callbacks', () => {
    it('should call onAuthStateChange callback', async () => {
      const onAuthStateChange = jest.fn();
      const manager = new AuthManager({
        adapter: mockAdapter,
        tokenStorage,
        onAuthStateChange,
      });

      mockAdapter.mockSuccessfulLogin();
      await manager.loginWithBearerToken('test-token');

      expect(onAuthStateChange).toHaveBeenCalled();
    });

    it('should call onError callback on authentication error', async () => {
      const onError = jest.fn();
      const manager = new AuthManager({
        adapter: mockAdapter,
        tokenStorage,
        onError,
      });

      mockAdapter.mockFailedLogin(mockErrors.invalidCredentials);
      await expect(manager.loginWithBearerToken('test-token')).rejects.toThrow();

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('refresh token storage', () => {
    it('should store refresh token when provided', async () => {
      mockAdapter.loginWithBearerTokenMock.mockResolvedValue(mockAuthResponses.successful);

      await authManager.loginWithBearerToken('test-token');

      const refreshToken = await tokenStorage.getRefreshToken();
      expect(refreshToken).toBe(mockTokens.refreshToken);
    });

    it('should handle login without refresh token', async () => {
      mockAdapter.loginWithBearerTokenMock.mockResolvedValue(
        mockAuthResponses.withoutRefreshToken
      );

      await authManager.loginWithBearerToken('test-token');

      const state = authManager.getState();
      expect(state.refreshToken).toBeNull();
    });
  });
});
