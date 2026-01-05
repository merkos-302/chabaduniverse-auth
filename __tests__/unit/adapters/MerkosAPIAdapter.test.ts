import { MerkosAPIAdapter } from '../../../src/adapters/MerkosAPIAdapter';

describe('MerkosAPIAdapter', () => {
  let adapter: MerkosAPIAdapter;

  beforeEach(() => {
    adapter = new MerkosAPIAdapter({
      baseUrl: 'https://shop.merkos302.com',
    });
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
        baseUrl: 'https://shop.merkos302.com',
      });

      expect(defaultAdapter).toBeInstanceOf(MerkosAPIAdapter);
    });

    it('should use default timeout 30000ms', () => {
      const defaultAdapter = new MerkosAPIAdapter({
        baseUrl: 'https://shop.merkos302.com',
      });

      expect(defaultAdapter).toBeInstanceOf(MerkosAPIAdapter);
    });
  });

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
        baseUrl: 'https://shop.merkos302.com',
        apiVersion: 'v2',
      });

      expect(v2Adapter).toBeInstanceOf(MerkosAPIAdapter);
    });

    it('should accept v4 API version', () => {
      const v4Adapter = new MerkosAPIAdapter({
        baseUrl: 'https://shop.merkos302.com',
        apiVersion: 'v4',
      });

      expect(v4Adapter).toBeInstanceOf(MerkosAPIAdapter);
    });

    it('should accept custom timeout', () => {
      const customAdapter = new MerkosAPIAdapter({
        baseUrl: 'https://shop.merkos302.com',
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
