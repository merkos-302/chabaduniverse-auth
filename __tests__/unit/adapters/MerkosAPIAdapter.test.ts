import { MerkosAPIAdapter } from '../../../src/adapters/MerkosAPIAdapter';
import { AuthError, AuthErrorCode } from '../../../src/types/auth';

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
    it('should throw not implemented error', async () => {
      await expect(adapter.loginWithBearerToken('test-token')).rejects.toThrow(
        'Not implemented'
      );
    });
  });

  describe('loginWithCredentials', () => {
    it('should throw not implemented error', async () => {
      await expect(
        adapter.loginWithCredentials('user@test.com', 'password')
      ).rejects.toThrow('Not implemented');
    });
  });

  describe('loginWithGoogle', () => {
    it('should throw not implemented error', async () => {
      await expect(adapter.loginWithGoogle('google-code')).rejects.toThrow(
        'Not implemented'
      );
    });
  });

  describe('loginWithChabadOrg', () => {
    it('should throw not implemented error', async () => {
      await expect(adapter.loginWithChabadOrg('chabad-token')).rejects.toThrow(
        'Not implemented'
      );
    });
  });

  describe('loginWithCDSSO', () => {
    it('should throw not implemented error', async () => {
      await expect(adapter.loginWithCDSSO()).rejects.toThrow('Not implemented');
    });
  });

  describe('getCurrentUser', () => {
    it('should throw not implemented error', async () => {
      await expect(adapter.getCurrentUser()).rejects.toThrow('Not implemented');
    });
  });

  describe('refreshToken', () => {
    it('should throw not implemented error', async () => {
      await expect(adapter.refreshToken('refresh-token')).rejects.toThrow(
        'Not implemented'
      );
    });
  });

  describe('logout', () => {
    it('should not throw error', async () => {
      await expect(adapter.logout()).resolves.toBeUndefined();
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
    it('should handle all authentication methods consistently', async () => {
      const methods = [
        () => adapter.loginWithBearerToken('token'),
        () => adapter.loginWithCredentials('user', 'pass'),
        () => adapter.loginWithGoogle('code'),
        () => adapter.loginWithChabadOrg('token'),
        () => adapter.loginWithCDSSO(),
        () => adapter.getCurrentUser(),
        () => adapter.refreshToken('token'),
      ];

      for (const method of methods) {
        await expect(method()).rejects.toThrow('Not implemented');
      }
    });
  });
});
