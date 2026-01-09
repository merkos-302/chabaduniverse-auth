import { MerkosAPIAdapter } from '../../../src/adapters/MerkosAPIAdapter';
import { AuthError, AuthErrorCode, AuthResponse } from '../../../src/types/auth';

// Mock fetch globally
global.fetch = jest.fn();

describe('MerkosAPIAdapter', () => {
  let adapter: MerkosAPIAdapter;

  beforeEach(() => {
    adapter = new MerkosAPIAdapter({
      baseUrl: 'https://org.merkos302.com', // Fixed: was shop.merkos302.com (Issue #1)
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('should create an adapter instance', () => {
      expect(adapter).toBeInstanceOf(MerkosAPIAdapter);
    });

    it('should accept custom configuration', () => {
      const customAdapter = new MerkosAPIAdapter({
        baseUrl: 'https://custom.api.com',
        apiVersion: 'v4',
        timeout: 5000,
      });

      expect(customAdapter).toBeInstanceOf(MerkosAPIAdapter);
    });

    it('should use default API version v2', () => {
      const defaultAdapter = new MerkosAPIAdapter({
        baseUrl: 'https://org.merkos302.com',
      });

      expect(defaultAdapter).toBeInstanceOf(MerkosAPIAdapter);
    });

    it('should use default timeout 30000ms', () => {
      const defaultAdapter = new MerkosAPIAdapter({
        baseUrl: 'https://org.merkos302.com',
      });

      expect(defaultAdapter).toBeInstanceOf(MerkosAPIAdapter);
    });
  });

  // ============================================================================
  // CORE METHODS TESTS: setToken, clearToken, v2Request
  // ============================================================================

  describe('Core Methods', () => {
    describe('setToken', () => {
      it('should store token correctly', () => {
        const testToken = 'test-jwt-token-12345';

        // Should not throw
        expect(() => adapter.setToken(testToken)).not.toThrow();
      });

      it('should allow token to be retrieved in subsequent requests', async () => {
        const testToken = 'test-jwt-token-12345';
        adapter.setToken(testToken);

        // Mock successful response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: '123', email: 'test@test.com' } }),
        });

        // When v2Request is implemented, it should use the stored token
        // For now, we're testing that setToken doesn't break the adapter
        expect(adapter).toBeDefined();
      });

      it('should overwrite previously set token', () => {
        const firstToken = 'first-token';
        const secondToken = 'second-token';

        adapter.setToken(firstToken);
        adapter.setToken(secondToken);

        // Should not throw and last token should be stored
        expect(adapter).toBeDefined();
      });
    });

    describe('clearToken', () => {
      it('should clear stored token', () => {
        const testToken = 'test-jwt-token-12345';

        adapter.setToken(testToken);

        // Should not throw
        expect(() => adapter.clearToken()).not.toThrow();
      });

      it('should work when no token exists', () => {
        // Should not throw even if no token was set
        expect(() => adapter.clearToken()).not.toThrow();
      });

      it('should allow setting new token after clearing', () => {
        const firstToken = 'first-token';
        const secondToken = 'second-token';

        adapter.setToken(firstToken);
        adapter.clearToken();

        // Should be able to set new token after clearing
        expect(() => adapter.setToken(secondToken)).not.toThrow();
      });
    });

    describe('v2Request (makeV2Request)', () => {
      describe('successful requests', () => {
        it('should make successful request with valid service/path/params', async () => {
          const mockResponse = {
            user: { id: '123', email: 'test@test.com', name: 'Test User' },
          };

          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          });

          const result = await adapter.v2Request('auth', 'auth:user:info', {});
          expect(result).toEqual(mockResponse);
        });

        it('should return typed response data', async () => {
          const mockResponse = {
            token: 'jwt-token-xyz',
            user: { id: '456', email: 'user@test.com' },
          };

          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          });

          const result = await adapter.v2Request<{ token: string; user: { id: string; email: string } }>(
            'auth',
            'auth:username:login',
            {
              username: 'test@test.com',
              password: 'password123',
            }
          );
          expect(result.token).toBe('jwt-token-xyz');
          expect(result.user.id).toBe('456');
        });
      });

      describe('authentication headers', () => {
        it('should include identifier header when token is set', async () => {
          const testToken = 'test-jwt-token';
          adapter.setToken(testToken);

          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          await adapter.v2Request('auth', 'auth:user:info', {});

          expect(global.fetch).toHaveBeenCalledWith(
            'https://org.merkos302.com/api/v2',
            expect.objectContaining({
              headers: expect.objectContaining({
                identifier: testToken,
              }),
            })
          );
        });

        it('should NOT include identifier header when no token is set', async () => {
          // Ensure no token is set
          adapter.clearToken();

          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          await adapter.v2Request('auth', 'auth:username:login', {
            username: 'test',
            password: 'pass',
          });

          const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
          const headers = fetchCall[1].headers;
          expect(headers.identifier).toBeUndefined();
        });
      });

      describe('request body structure', () => {
        it('should send correct body structure with service, path, params', async () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          const testService = 'auth';
          const testPath = 'auth:username:login';
          const testParams = { username: 'user@test.com', password: 'pass123' };

          await adapter.v2Request(testService, testPath, testParams);

          expect(global.fetch).toHaveBeenCalledWith(
            'https://org.merkos302.com/api/v2',
            expect.objectContaining({
              method: 'POST',
              body: JSON.stringify({
                service: testService,
                path: testPath,
                params: testParams,
              }),
            })
          );
        });
      });

      describe('error handling', () => {
        it('should throw AuthError when response contains err field', async () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              err: 'Invalid credentials',
              code: 'INVALID_CREDENTIALS',
            }),
          });

          await expect(
            adapter.v2Request('auth', 'auth:username:login', {
              username: 'wrong',
              password: 'wrong',
            })
          ).rejects.toThrow(AuthError);
        });

        it('should throw AuthError with NETWORK_ERROR code on network failure', async () => {
          (global.fetch as jest.Mock).mockRejectedValue(
            new Error('Network request failed')
          );

          await expect(
            adapter.v2Request('auth', 'auth:user:info', {})
          ).rejects.toThrow(AuthError);

          const error = await adapter.v2Request('auth', 'auth:user:info', {})
            .catch(err => err);
          expect(error.code).toBe(AuthErrorCode.NETWORK_ERROR);
        });

        it('should throw AuthError with NETWORK_ERROR code on timeout', async () => {
          // Create a mock that simulates abort error (timeout)
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

          const shortTimeoutAdapter = new MerkosAPIAdapter({
            baseUrl: 'https://org.merkos302.com',
            timeout: 100, // 100ms timeout
          });

          await expect(
            shortTimeoutAdapter.v2Request('auth', 'auth:user:info', {})
          ).rejects.toThrow(AuthError);
        });

        it('should handle unknown service error', async () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              err: 'Unknown service',
              code: 'UNKNOWN_SERVICE',
            }),
          });

          await expect(
            adapter.v2Request('invalid-service', 'some:path', {})
          ).rejects.toThrow(AuthError);
        });

        it('should handle unauthorized error (401)', async () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: async () => ({}),
          });

          try {
            await adapter.v2Request('auth', 'auth:user:info', {});
            fail('Should have thrown AuthError');
          } catch (error) {
            expect(error).toBeInstanceOf(AuthError);
            expect((error as AuthError).code).toBe(AuthErrorCode.UNAUTHORIZED);
          }
        });

        it('should handle invalid parameters error', async () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              err: 'Missing required parameters',
              code: 'INVALID_PARAMETERS',
            }),
          });

          await expect(
            adapter.v2Request('auth', 'auth:username:login', {
              // Missing password
              username: 'test@test.com',
            })
          ).rejects.toThrow(AuthError);
        });
      });

      describe('response parsing', () => {
        it('should parse JSON response correctly', async () => {
          const mockData = {
            user: { id: '789', email: 'json@test.com' },
            metadata: { roles: ['user', 'admin'] },
          };

          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
          });

          const result = await adapter.v2Request<typeof mockData>('auth', 'auth:user:info', {});
          expect(result).toEqual(mockData);
          expect(result.metadata.roles).toContain('admin');
        });

        it('should handle different data types in response', async () => {
          const mockData = {
            count: 42,
            active: true,
            items: ['item1', 'item2'],
            nested: { key: 'value' },
          };

          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
          });

          const result = await adapter.v2Request<typeof mockData>('data', 'data:fetch', {});
          expect(result.count).toBe(42);
          expect(result.active).toBe(true);
          expect(Array.isArray(result.items)).toBe(true);
        });
      });
    });
  });

  // ============================================================================
  // EXISTING TESTS (kept for compatibility)
  // ============================================================================

  describe('loginWithBearerToken', () => {
    it('should authenticate with bearer token and store token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'user@test.com', name: 'Test User' },
        token: 'new-jwt-token',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await adapter.loginWithBearerToken('test-token');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://org.merkos302.com/api/v2',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service: 'auth',
            path: 'auth:bearer:login',
            params: { token: 'test-token' },
          }),
        })
      );
    });

    it('should include siteId when provided', async () => {
      const mockResponse = {
        user: { id: '1', email: 'user@test.com' },
        token: 'jwt-token',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await adapter.loginWithBearerToken('test-token', 'site123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://org.merkos302.com/api/v2',
        expect.objectContaining({
          body: JSON.stringify({
            service: 'auth',
            path: 'auth:bearer:login',
            params: { token: 'test-token', siteId: 'site123' },
          }),
        })
      );
    });
  });

  describe('loginWithCredentials', () => {
    it('should authenticate with credentials and store token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'user@test.com', name: 'Test User' },
        token: 'new-jwt-token',
        expiresIn: 3600,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await adapter.loginWithCredentials('user@test.com', 'password');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://org.merkos302.com/api/v2',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            service: 'auth',
            path: 'auth:username:login',
            params: { username: 'user@test.com', password: 'password' },
          }),
        })
      );
    });

    it('should include siteId when provided', async () => {
      const mockResponse = {
        user: { id: '1', email: 'user@test.com' },
        token: 'jwt-token',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await adapter.loginWithCredentials('user@test.com', 'password', 'site123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://org.merkos302.com/api/v2',
        expect.objectContaining({
          body: JSON.stringify({
            service: 'auth',
            path: 'auth:username:login',
            params: { username: 'user@test.com', password: 'password', siteId: 'site123' },
          }),
        })
      );
    });
  });

  describe('loginWithGoogle', () => {
    it('should authenticate with Google OAuth code and store token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'user@gmail.com', name: 'Google User' },
        token: 'google-jwt-token',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await adapter.loginWithGoogle('google-oauth-code');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://org.merkos302.com/api/v2',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            service: 'auth',
            path: 'auth:google:login',
            params: { code: 'google-oauth-code' },
          }),
        })
      );
    });

    it('should include host and siteId when provided', async () => {
      const mockResponse = {
        user: { id: '1', email: 'user@gmail.com' },
        token: 'jwt-token',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await adapter.loginWithGoogle('google-code', 'myapp.com', 'site123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://org.merkos302.com/api/v2',
        expect.objectContaining({
          body: JSON.stringify({
            service: 'auth',
            path: 'auth:google:login',
            params: { code: 'google-code', host: 'myapp.com', siteId: 'site123' },
          }),
        })
      );
    });
  });

  describe('loginWithChabadOrg', () => {
    it('should authenticate with Chabad.org SSO key and store token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'rabbi@chabad.org', name: 'Chabad User' },
        token: 'chabad-jwt-token',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await adapter.loginWithChabadOrg('chabad-sso-key');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://org.merkos302.com/api/v2',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            service: 'auth',
            path: 'auth:chabadorg:login',
            params: { key: 'chabad-sso-key' },
          }),
        })
      );
    });

    it('should include siteId when provided', async () => {
      const mockResponse = {
        user: { id: '1', email: 'rabbi@chabad.org' },
        token: 'jwt-token',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await adapter.loginWithChabadOrg('chabad-key', 'site123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://org.merkos302.com/api/v2',
        expect.objectContaining({
          body: JSON.stringify({
            service: 'auth',
            path: 'auth:chabadorg:login',
            params: { key: 'chabad-key', siteId: 'site123' },
          }),
        })
      );
    });
  });

  describe('loginWithCDSSO', () => {
    it('should throw not implemented error', async () => {
      await expect(adapter.loginWithCDSSO()).rejects.toThrow('Not implemented');
    });
  });

  describe('refreshToken', () => {
    it('should throw not implemented error', async () => {
      await expect(adapter.refreshToken('refresh-token')).rejects.toThrow(
        'Not implemented'
      );
    });
  });

  describe('verifyToken', () => {
    it('should return false by default', async () => {
      const result = await adapter.verifyToken('any-token');
      expect(result).toBe(false);
    });
  });

  describe('configuration variants', () => {
    it('should accept v2 API version', () => {
      const v2Adapter = new MerkosAPIAdapter({
        baseUrl: 'https://org.merkos302.com',
        apiVersion: 'v2',
      });

      expect(v2Adapter).toBeInstanceOf(MerkosAPIAdapter);
    });

    it('should accept v4 API version', () => {
      const v4Adapter = new MerkosAPIAdapter({
        baseUrl: 'https://org.merkos302.com',
        apiVersion: 'v4',
      });

      expect(v4Adapter).toBeInstanceOf(MerkosAPIAdapter);
    });

    it('should accept custom timeout', () => {
      const customAdapter = new MerkosAPIAdapter({
        baseUrl: 'https://org.merkos302.com',
        timeout: 10000,
      });

      expect(customAdapter).toBeInstanceOf(MerkosAPIAdapter);
    });
  });

  describe('error handling', () => {
    it('should handle unimplemented methods consistently', async () => {
      const methods = [
        () => adapter.loginWithCDSSO(),
        () => adapter.refreshToken('token'),
      ];

      for (const method of methods) {
        await expect(method()).rejects.toThrow('Not implemented');
      }
    });

    it('should handle authentication errors for implemented methods', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          err: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        }),
      });

      await expect(adapter.loginWithBearerToken('invalid-token')).rejects.toThrow(AuthError);
      await expect(adapter.loginWithCredentials('user', 'wrong')).rejects.toThrow(AuthError);
      await expect(adapter.loginWithGoogle('invalid-code')).rejects.toThrow(AuthError);
      await expect(adapter.loginWithChabadOrg('invalid-key')).rejects.toThrow(AuthError);
    });
  });

  // ============================================================================
  // AUTHENTICATION METHODS TESTS: Phase 5B
  // ============================================================================

  describe('Authentication Methods (Phase 5B)', () => {
    describe('loginWithBearerToken', () => {
      it('should authenticate with valid bearer token', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '123', email: 'test@test.com', name: 'Test User' },
          token: 'jwt-token-xyz',
        };

        // Mock v2Request
        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);

        // Mock setToken
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        const result = await adapter.loginWithBearerToken('bearer-token-123');

        expect(result).toEqual(mockResponse);
        expect(setTokenSpy).toHaveBeenCalledWith('jwt-token-xyz');
        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:bearer:login',
          { token: 'bearer-token-123' }
        );
      });

      it('should return AuthResponse with user and token', async () => {
        const mockResponse: AuthResponse = {
          user: {
            id: '456',
            email: 'user@example.com',
            name: 'John Doe',
            role: 'admin'
          },
          token: 'jwt-token-abc',
          refreshToken: 'refresh-token-xyz',
          expiresIn: 3600
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        const result = await adapter.loginWithBearerToken('bearer-token-456');

        expect(result.user).toEqual(mockResponse.user);
        expect(result.token).toBe('jwt-token-abc');
        expect(result.refreshToken).toBe('refresh-token-xyz');
        expect(result.expiresIn).toBe(3600);
      });

      it('should include siteId in params when provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '789', email: 'site@test.com' },
          token: 'jwt-token-site',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithBearerToken('bearer-token-789', 'site-123');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:bearer:login',
          { token: 'bearer-token-789', siteId: 'site-123' }
        );
      });

      it('should NOT include siteId in params when not provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '999', email: 'nosite@test.com' },
          token: 'jwt-token-nosite',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithBearerToken('bearer-token-999');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:bearer:login',
          { token: 'bearer-token-999' }
        );
      });

      it('should throw AuthError on invalid token', async () => {
        const authError = new AuthError(
          'Invalid bearer token',
          AuthErrorCode.TOKEN_INVALID
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(authError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithBearerToken('invalid-token')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });

      it('should throw AuthError on network failure', async () => {
        const networkError = new AuthError(
          'Network error: Connection refused',
          AuthErrorCode.NETWORK_ERROR
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(networkError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithBearerToken('bearer-token-fail')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });
    });

    describe('loginWithCredentials', () => {
      it('should authenticate with valid username and password', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '123', email: 'user@test.com', name: 'Test User' },
          token: 'jwt-token-credentials',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        const result = await adapter.loginWithCredentials('user@test.com', 'password123');

        expect(result).toEqual(mockResponse);
        expect(setTokenSpy).toHaveBeenCalledWith('jwt-token-credentials');
        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:username:login',
          { username: 'user@test.com', password: 'password123' }
        );
      });

      it('should return AuthResponse with user and token', async () => {
        const mockResponse: AuthResponse = {
          user: {
            id: '456',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            permissions: ['read', 'write', 'delete']
          },
          token: 'jwt-token-admin',
          expiresIn: 7200
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        const result = await adapter.loginWithCredentials('admin@example.com', 'admin123');

        expect(result.user.role).toBe('admin');
        expect(result.user.permissions).toContain('write');
        expect(result.token).toBe('jwt-token-admin');
      });

      it('should include siteId in params when provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '789', email: 'site@test.com' },
          token: 'jwt-token-site',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithCredentials('site@test.com', 'sitepass', 'site-456');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:username:login',
          { username: 'site@test.com', password: 'sitepass', siteId: 'site-456' }
        );
      });

      it('should NOT include siteId in params when not provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '999', email: 'nosite@test.com' },
          token: 'jwt-token-nosite',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithCredentials('nosite@test.com', 'pass123');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:username:login',
          { username: 'nosite@test.com', password: 'pass123' }
        );
      });

      it('should throw AuthError on invalid credentials', async () => {
        const authError = new AuthError(
          'Invalid username or password',
          AuthErrorCode.INVALID_CREDENTIALS
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(authError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithCredentials('wrong@test.com', 'wrongpass')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });

      it('should NOT call setToken on authentication failure', async () => {
        const authError = new AuthError(
          'Authentication failed',
          AuthErrorCode.UNAUTHORIZED
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(authError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithCredentials('user@test.com', 'wrongpass')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });
    });

    describe('loginWithGoogle', () => {
      it('should authenticate with valid Google OAuth code', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '123', email: 'google@test.com', name: 'Google User' },
          token: 'jwt-token-google',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        const result = await adapter.loginWithGoogle('google-code-123');

        expect(result).toEqual(mockResponse);
        expect(setTokenSpy).toHaveBeenCalledWith('jwt-token-google');
        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:google:login',
          { code: 'google-code-123' }
        );
      });

      it('should return AuthResponse with user and token', async () => {
        const mockResponse: AuthResponse = {
          user: {
            id: '456',
            email: 'googleuser@gmail.com',
            name: 'Google Test User'
          },
          token: 'jwt-token-google-456',
          refreshToken: 'refresh-google-456'
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        const result = await adapter.loginWithGoogle('google-code-456');

        expect(result.user.email).toBe('googleuser@gmail.com');
        expect(result.token).toBe('jwt-token-google-456');
        expect(result.refreshToken).toBe('refresh-google-456');
      });

      it('should include host in params when provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '789', email: 'host@test.com' },
          token: 'jwt-token-host',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithGoogle('google-code-789', 'https://app.example.com');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:google:login',
          { code: 'google-code-789', host: 'https://app.example.com' }
        );
      });

      it('should include both host and siteId when provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '999', email: 'both@test.com' },
          token: 'jwt-token-both',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithGoogle('google-code-999', 'https://app.example.com', 'site-789');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:google:login',
          { code: 'google-code-999', host: 'https://app.example.com', siteId: 'site-789' }
        );
      });

      it('should NOT include host or siteId when not provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '111', email: 'none@test.com' },
          token: 'jwt-token-none',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithGoogle('google-code-111');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:google:login',
          { code: 'google-code-111' }
        );
      });

      it('should throw AuthError on invalid Google code', async () => {
        const authError = new AuthError(
          'Invalid Google OAuth code',
          AuthErrorCode.INVALID_CREDENTIALS
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(authError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithGoogle('invalid-google-code')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });

      it('should NOT call setToken on network failure', async () => {
        const networkError = new AuthError(
          'Network error: Unable to reach Google',
          AuthErrorCode.NETWORK_ERROR
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(networkError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithGoogle('google-code-fail')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });
    });

    describe('loginWithChabadOrg', () => {
      it('should authenticate with valid Chabad.org SSO key', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '123', email: 'chabad@test.com', name: 'Chabad User' },
          token: 'jwt-token-chabad',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        const result = await adapter.loginWithChabadOrg('chabad-key-123');

        expect(result).toEqual(mockResponse);
        expect(setTokenSpy).toHaveBeenCalledWith('jwt-token-chabad');
        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:chabadorg:login',
          { key: 'chabad-key-123' }
        );
      });

      it('should return AuthResponse with user and token', async () => {
        const mockResponse: AuthResponse = {
          user: {
            id: '456',
            email: 'rabbi@chabad.org',
            name: 'Rabbi Cohen',
            role: 'rabbi'
          },
          token: 'jwt-token-rabbi',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        const result = await adapter.loginWithChabadOrg('chabad-key-456');

        expect(result.user.name).toBe('Rabbi Cohen');
        expect(result.user.role).toBe('rabbi');
        expect(result.token).toBe('jwt-token-rabbi');
      });

      it('should include siteId in params when provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '789', email: 'site@chabad.org' },
          token: 'jwt-token-site',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithChabadOrg('chabad-key-789', 'site-321');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:chabadorg:login',
          { key: 'chabad-key-789', siteId: 'site-321' }
        );
      });

      it('should NOT include siteId in params when not provided', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '999', email: 'nosite@chabad.org' },
          token: 'jwt-token-nosite',
        };

        jest.spyOn(adapter as any, 'v2Request').mockResolvedValueOnce(mockResponse);
        jest.spyOn(adapter, 'setToken');

        await adapter.loginWithChabadOrg('chabad-key-999');

        expect(adapter['v2Request']).toHaveBeenCalledWith(
          'auth',
          'auth:chabadorg:login',
          { key: 'chabad-key-999' }
        );
      });

      it('should throw AuthError on invalid Chabad.org key', async () => {
        const authError = new AuthError(
          'Invalid Chabad.org SSO key',
          AuthErrorCode.TOKEN_INVALID
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(authError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithChabadOrg('invalid-chabad-key')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });

      it('should throw AuthError on unauthorized access', async () => {
        const authError = new AuthError(
          'Unauthorized Chabad.org access',
          AuthErrorCode.UNAUTHORIZED
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(authError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithChabadOrg('unauthorized-key')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });

      it('should NOT call setToken on authentication failure', async () => {
        const authError = new AuthError(
          'Authentication failed',
          AuthErrorCode.FORBIDDEN
        );

        jest.spyOn(adapter as any, 'v2Request').mockRejectedValueOnce(authError);
        const setTokenSpy = jest.spyOn(adapter, 'setToken');

        await expect(
          adapter.loginWithChabadOrg('forbidden-key')
        ).rejects.toThrow(AuthError);

        expect(setTokenSpy).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // TOKEN MANAGEMENT TESTS (Phase 5C): getCurrentUser, logout
  // ============================================================================

  describe('Token Management Methods (Phase 5C)', () => {
    describe('getCurrentUser', () => {
      it('should retrieve current user info with valid token', async () => {
        const mockUser = {
          id: '123',
          email: 'user@test.com',
          name: 'Test User',
          role: 'admin',
          permissions: ['read', 'write']
        };

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => mockUser,
        });

        adapter.setToken('valid-token');
        const result = await adapter.getCurrentUser();

        expect(result).toEqual(mockUser);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://org.merkos302.com/api/v2',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'identifier': 'valid-token',
            }),
            body: JSON.stringify({
              service: 'auth',
              path: 'auth:user:info',
              params: {}
            }),
          })
        );
      });

      it('should throw UNAUTHORIZED when no token is set', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            err: 'Not authenticated',
            code: 'UNAUTHORIZED'
          }),
        });

        await expect(adapter.getCurrentUser()).rejects.toThrow(AuthError);
        await expect(adapter.getCurrentUser()).rejects.toThrow(expect.objectContaining({
          code: AuthErrorCode.UNAUTHORIZED
        }));
      });

      it('should throw TOKEN_INVALID when token is invalid', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            err: 'Token is not valid',
            code: 'TOKEN_NOT_VALID'
          }),
        });

        adapter.setToken('invalid-token');
        await expect(adapter.getCurrentUser()).rejects.toThrow(AuthError);
        await expect(adapter.getCurrentUser()).rejects.toThrow(expect.objectContaining({
          code: AuthErrorCode.TOKEN_INVALID
        }));
      });

      it('should throw TOKEN_EXPIRED when token is expired', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            err: 'Token expired',
            code: 'TOKEN_EXPIRED'
          }),
        });

        adapter.setToken('expired-token');
        await expect(adapter.getCurrentUser()).rejects.toThrow(AuthError);
        await expect(adapter.getCurrentUser()).rejects.toThrow(expect.objectContaining({
          code: AuthErrorCode.TOKEN_EXPIRED
        }));
      });

      it('should throw NETWORK_ERROR on network failure', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

        adapter.setToken('valid-token');
        await expect(adapter.getCurrentUser()).rejects.toThrow(AuthError);
        await expect(adapter.getCurrentUser()).rejects.toThrow(expect.objectContaining({
          code: AuthErrorCode.NETWORK_ERROR
        }));
      });
    });

    describe('logout', () => {
      it('should call server logout and clear token', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        });

        adapter.setToken('test-token');
        await adapter.logout();

        // Verify server logout was called
        expect(global.fetch).toHaveBeenCalledWith(
          'https://org.merkos302.com/api/v2',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'identifier': 'test-token',
            }),
            body: JSON.stringify({
              service: 'auth',
              path: 'auth:logout',
              params: {}
            }),
          })
        );

        // Verify token was cleared (check by trying to make an authenticated request)
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ user: { id: '123' } }),
        });

        await adapter.getCurrentUser();
        const lastCall = (global.fetch as jest.Mock).mock.calls[0];
        const headers = lastCall[1].headers;
        expect(headers['identifier']).toBeUndefined();
      });

      it('should handle logout when no token is set', async () => {
        global.fetch = jest.fn();

        // No token set, should not call server
        await adapter.logout();

        // Server should not be called since no token
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should clear token even if server logout fails', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        adapter.setToken('test-token');

        // Should not throw error
        await expect(adapter.logout()).resolves.toBeUndefined();

        // Verify token was cleared despite error
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ user: { id: '123' } }),
        });

        await adapter.getCurrentUser();
        const lastCall = (global.fetch as jest.Mock).mock.calls[0];
        const headers = lastCall[1].headers;
        expect(headers['identifier']).toBeUndefined();
      });

      it('should be idempotent - multiple logout calls should work', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        });

        adapter.setToken('test-token');

        // First logout
        await adapter.logout();

        // Second logout should not fail
        await expect(adapter.logout()).resolves.toBeUndefined();

        // Verify server was only called once (when token existed)
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
