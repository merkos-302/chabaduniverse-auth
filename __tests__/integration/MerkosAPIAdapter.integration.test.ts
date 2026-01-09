/**
 * MerkosAPIAdapter Integration Tests
 *
 * These tests verify that MerkosAPIAdapter integrates correctly with AuthManager.
 * Unlike unit tests, these test the real adapter with mocked fetch to verify
 * end-to-end behavior including state transitions and header handling.
 */

import { MerkosAPIAdapter } from '../../src/adapters/MerkosAPIAdapter';
import { AuthManager } from '../../src/core/AuthManager';
import { MemoryTokenStorage } from '../../src/core/TokenStorage';
import { AuthError, AuthErrorCode } from '../../src/types/auth';
import type { AuthState, User } from '../../src/types';
import { mockUsers, mockTokens } from '../helpers/fixtures';

// Mock fetch globally
global.fetch = jest.fn();

describe('MerkosAPIAdapter Integration with AuthManager', () => {
  let adapter: MerkosAPIAdapter;
  let authManager: AuthManager;
  let tokenStorage: MemoryTokenStorage;
  let stateHistory: AuthState[];

  // Helper to create mock v2 API response
  const createMockV2Response = (data: unknown, ok = true) => ({
    ok,
    json: async () => data,
    status: ok ? 200 : 401,
    statusText: ok ? 'OK' : 'Unauthorized',
  });

  // Helper to create successful auth response
  const createAuthResponse = (overrides = {}) => ({
    user: {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    },
    token: 'jwt-token-from-api-12345',
    refreshToken: 'refresh-token-xyz',
    expiresIn: 3600,
    ...overrides,
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create fresh instances
    adapter = new MerkosAPIAdapter({
      baseUrl: 'https://org.merkos302.com',
    });
    tokenStorage = new MemoryTokenStorage();
    stateHistory = [];

    authManager = new AuthManager({
      adapter,
      tokenStorage,
      onAuthStateChange: (state) => {
        stateHistory.push({ ...state });
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // TEST 1: Full Authentication Lifecycle
  // ==========================================================================

  describe('Full Authentication Lifecycle', () => {
    it('should complete login -> getCurrentUser -> logout flow with correct state transitions', async () => {
      // Arrange: Mock login response
      const authResponse = createAuthResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(authResponse)
      );

      // Act 1: Login with credentials
      await authManager.loginWithCredentials('test@example.com', 'password123');

      // Assert 1: Verify authenticated state
      let state = authManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(authResponse.user);
      expect(state.token).toBe('jwt-token-from-api-12345');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Assert 1b: Verify token was stored
      const storedToken = await tokenStorage.getToken();
      expect(storedToken).toBe('jwt-token-from-api-12345');

      // Arrange 2: Mock getCurrentUser response
      const userInfo: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        permissions: ['read', 'write'],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(userInfo)
      );

      // Act 2: Get current user
      const currentUser = await adapter.getCurrentUser();

      // Assert 2: Verify user matches
      expect(currentUser).toEqual(userInfo);

      // Arrange 3: Mock logout response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({ success: true })
      );

      // Act 3: Logout
      await authManager.logout();

      // Assert 3: Verify logged out state
      state = authManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);

      // Assert 3b: Verify token was cleared from storage
      const tokenAfterLogout = await tokenStorage.getToken();
      expect(tokenAfterLogout).toBeNull();

      // Assert: Verify state transitions occurred
      expect(stateHistory.length).toBeGreaterThan(0);
      // First state: loading true
      expect(stateHistory[0].isLoading).toBe(true);
      // Should have transitioned through authenticated state
      const authenticatedState = stateHistory.find(s => s.isAuthenticated === true);
      expect(authenticatedState).toBeDefined();
    });
  });

  // ==========================================================================
  // TEST 2: Token Persistence Across Methods
  // ==========================================================================

  describe('Token Persistence Across Methods', () => {
    it('should include identifier header in authenticated requests after login', async () => {
      // Arrange: Mock login response
      const authResponse = createAuthResponse({ token: 'my-auth-token-xyz' });
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(authResponse)
      );

      // Act 1: Login
      await authManager.loginWithBearerToken('initial-token');

      // Verify login request was made (identifier header not needed for login)
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const loginCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(loginCall[0]).toBe('https://org.merkos302.com/api/v2');
      expect(loginCall[1].method).toBe('POST');

      // Arrange 2: Mock authenticated request
      const userInfo: User = { id: '123', email: 'test@example.com' };
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(userInfo)
      );

      // Act 2: Make authenticated request
      await adapter.getCurrentUser();

      // Assert: Verify identifier header was included
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const authenticatedCall = (global.fetch as jest.Mock).mock.calls[1];
      const headers = authenticatedCall[1].headers;
      expect(headers['identifier']).toBe('my-auth-token-xyz');
      expect(headers['Content-Type']).toBe('application/json');

      // Verify the body structure for v2 request
      const body = JSON.parse(authenticatedCall[1].body);
      expect(body.service).toBe('auth');
      expect(body.path).toBe('auth:user:info');
    });

    it('should not include identifier header before login', async () => {
      // Arrange: Mock user info response (would fail in real API without auth)
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({ err: 'Not authenticated', code: 'UNAUTHORIZED' })
      );

      // Act & Assert: Request fails and no identifier header
      await expect(adapter.getCurrentUser()).rejects.toThrow(AuthError);

      const requestCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = requestCall[1].headers;
      expect(headers['identifier']).toBeUndefined();
    });
  });

  // ==========================================================================
  // TEST 3: Re-authentication After Logout
  // ==========================================================================

  describe('Re-authentication After Logout', () => {
    it('should allow clean login after logout', async () => {
      // First login
      const firstAuthResponse = createAuthResponse({
        user: { id: '1', email: 'first@example.com', name: 'First User' },
        token: 'first-token-123',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(firstAuthResponse)
      );

      await authManager.loginWithCredentials('first@example.com', 'pass1');

      let state = authManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('first@example.com');
      expect(state.token).toBe('first-token-123');

      // Logout
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({ success: true })
      );

      await authManager.logout();

      state = authManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();

      // Second login with different user
      const secondAuthResponse = createAuthResponse({
        user: { id: '2', email: 'second@example.com', name: 'Second User' },
        token: 'second-token-456',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(secondAuthResponse)
      );

      await authManager.loginWithCredentials('second@example.com', 'pass2');

      state = authManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('second@example.com');
      expect(state.token).toBe('second-token-456');

      // Verify clean state transitions
      const loggedOutStates = stateHistory.filter(s => !s.isAuthenticated && !s.isLoading);
      expect(loggedOutStates.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // TEST 4: Multi-Method Login Sequence
  // ==========================================================================

  describe('Multi-Method Login Sequence', () => {
    it('should support different login methods sequentially', async () => {
      // Login with bearer token
      const bearerResponse = createAuthResponse({
        user: { id: 'bearer-user', email: 'bearer@test.com' },
        token: 'bearer-jwt-token',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(bearerResponse)
      );

      await authManager.loginWithBearerToken('my-bearer-token');
      expect(authManager.getState().user?.id).toBe('bearer-user');

      // Verify correct API call for bearer login
      let lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
      let body = JSON.parse(lastCall[1].body);
      expect(body.path).toBe('auth:bearer:login');
      expect(body.params.token).toBe('my-bearer-token');

      // Logout
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({ success: true })
      );
      await authManager.logout();

      // Login with credentials
      const credentialsResponse = createAuthResponse({
        user: { id: 'creds-user', email: 'creds@test.com' },
        token: 'credentials-jwt-token',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(credentialsResponse)
      );

      await authManager.loginWithCredentials('creds@test.com', 'mypassword');
      expect(authManager.getState().user?.id).toBe('creds-user');

      // Verify correct API call for credentials login
      lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
      body = JSON.parse(lastCall[1].body);
      expect(body.path).toBe('auth:username:login');
      expect(body.params.username).toBe('creds@test.com');
      expect(body.params.password).toBe('mypassword');

      // Logout
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({ success: true })
      );
      await authManager.logout();

      // Login with Google
      const googleResponse = createAuthResponse({
        user: { id: 'google-user', email: 'google@test.com' },
        token: 'google-jwt-token',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(googleResponse)
      );

      await authManager.loginWithGoogle('google-oauth-code-xyz');
      expect(authManager.getState().user?.id).toBe('google-user');

      // Verify correct API call for Google login
      lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
      body = JSON.parse(lastCall[1].body);
      expect(body.path).toBe('auth:google:login');
      expect(body.params.code).toBe('google-oauth-code-xyz');

      // Logout
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({ success: true })
      );
      await authManager.logout();

      // Login with Chabad.org SSO
      const chabadResponse = createAuthResponse({
        user: { id: 'chabad-user', email: 'rabbi@chabad.org' },
        token: 'chabad-jwt-token',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(chabadResponse)
      );

      await authManager.loginWithChabadOrg('chabad-sso-key-abc');
      expect(authManager.getState().user?.id).toBe('chabad-user');

      // Verify correct API call for Chabad.org login
      lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
      body = JSON.parse(lastCall[1].body);
      expect(body.path).toBe('auth:chabadorg:login');
      expect(body.params.key).toBe('chabad-sso-key-abc');
    });
  });

  // ==========================================================================
  // TEST 5: Error Recovery Flow
  // ==========================================================================

  describe('Error Recovery Flow', () => {
    it('should recover from network error and successfully login on retry', async () => {
      // First attempt: Network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error: Connection refused')
      );

      // Act & Assert: Login fails
      await expect(
        authManager.loginWithCredentials('test@example.com', 'password')
      ).rejects.toThrow();

      // Verify error state
      let state = authManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeDefined();
      expect(state.isLoading).toBe(false);

      // Second attempt: Success
      const authResponse = createAuthResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(authResponse)
      );

      await authManager.loginWithCredentials('test@example.com', 'password');

      // Verify successful recovery
      state = authManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(state.user).toBeDefined();
    });

    it('should handle API error and recover on retry', async () => {
      // First attempt: Invalid credentials error from API
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({
          err: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        })
      );

      await expect(
        authManager.loginWithCredentials('wrong@example.com', 'wrongpass')
      ).rejects.toThrow(AuthError);

      let state = authManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeDefined();

      // Second attempt with correct credentials
      const authResponse = createAuthResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(authResponse)
      );

      await authManager.loginWithCredentials('test@example.com', 'correctpass');

      state = authManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  // ==========================================================================
  // TEST 6: Token State Verification
  // ==========================================================================

  describe('Token State Verification', () => {
    it('should use token for authenticated requests and fail after clearToken', async () => {
      // Login to get token
      const authResponse = createAuthResponse({ token: 'valid-session-token' });
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(authResponse)
      );

      await authManager.loginWithCredentials('test@example.com', 'password');
      expect(authManager.getState().token).toBe('valid-session-token');

      // Mock successful getCurrentUser with token
      const userInfo: User = { id: '123', email: 'test@example.com', name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(userInfo)
      );

      // getCurrentUser should work
      const user = await adapter.getCurrentUser();
      expect(user).toEqual(userInfo);

      // Verify identifier header was sent
      let lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
      expect(lastCall[1].headers['identifier']).toBe('valid-session-token');

      // Clear token directly on adapter
      adapter.clearToken();

      // Mock failed getCurrentUser without token
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({
          err: 'Not authenticated',
          code: 'UNAUTHORIZED',
        })
      );

      // getCurrentUser should fail
      await expect(adapter.getCurrentUser()).rejects.toThrow(AuthError);

      // Verify no identifier header was sent
      lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
      expect(lastCall[1].headers['identifier']).toBeUndefined();
    });
  });

  // ==========================================================================
  // TEST 7: V2 Request Structure Validation
  // ==========================================================================

  describe('V2 Request Structure Validation', () => {
    it('should send correctly structured v2 API requests', async () => {
      // Login
      const authResponse = createAuthResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(authResponse)
      );

      await authManager.loginWithCredentials('user@example.com', 'pass123');

      // Verify request structure
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];

      // URL should be v2 endpoint
      expect(fetchCall[0]).toBe('https://org.merkos302.com/api/v2');

      // Method should be POST
      expect(fetchCall[1].method).toBe('POST');

      // Headers should include Content-Type
      expect(fetchCall[1].headers['Content-Type']).toBe('application/json');

      // Body should have service, path, params structure
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toHaveProperty('service', 'auth');
      expect(body).toHaveProperty('path', 'auth:username:login');
      expect(body).toHaveProperty('params');
      expect(body.params).toEqual({
        username: 'user@example.com',
        password: 'pass123',
      });
    });
  });

  // ==========================================================================
  // TEST 8: Event Emission During Lifecycle
  // ==========================================================================

  describe('Event Emission During Lifecycle', () => {
    it('should emit correct events during login and logout', async () => {
      const events: string[] = [];

      authManager.on('auth:state-change', () => events.push('state-change'));
      authManager.on('auth:login', () => events.push('login'));
      authManager.on('auth:logout', () => events.push('logout'));
      authManager.on('auth:error', () => events.push('error'));

      // Login
      const authResponse = createAuthResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response(authResponse)
      );

      await authManager.loginWithCredentials('test@example.com', 'password');

      expect(events).toContain('state-change');
      expect(events).toContain('login');
      expect(events).not.toContain('error');

      // Clear events for logout test
      events.length = 0;

      // Logout
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockV2Response({ success: true })
      );

      await authManager.logout();

      expect(events).toContain('state-change');
      expect(events).toContain('logout');

      // Test error event
      events.length = 0;
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authManager.loginWithCredentials('test@example.com', 'password')
      ).rejects.toThrow();

      expect(events).toContain('error');
    });
  });

  // ==========================================================================
  // TODO: Future Enhancement Tests
  // ==========================================================================

  // TODO: Future enhancement - test concurrent request handling
  // describe('Concurrent Request Handling', () => {
  //   it('should handle multiple simultaneous requests correctly', async () => {
  //     // Test that concurrent requests all receive proper authentication headers
  //     // Test race conditions during login/logout
  //   });
  // });

  // TODO: Future enhancement - test rate limiting scenarios
  // describe('Rate Limiting Handling', () => {
  //   it('should handle rate limit responses gracefully', async () => {
  //     // Test 429 response handling
  //     // Test retry-after header parsing
  //     // Test automatic retry with backoff
  //   });
  // });

  // TODO: Future enhancement - performance benchmarks
  // describe('Performance Benchmarks', () => {
  //   it('should complete auth cycle within acceptable time', async () => {
  //     // Measure login latency
  //     // Measure token validation time
  //     // Track memory usage during auth operations
  //   });
  // });
});
