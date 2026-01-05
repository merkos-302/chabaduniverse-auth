import { LocalStorageTokenStorage, MemoryTokenStorage } from '../../../src/core/TokenStorage';
import { mockLocalStorage, cleanupLocalStorage } from '../../helpers/test-utils';

describe('MemoryTokenStorage', () => {
  let storage: MemoryTokenStorage;

  beforeEach(() => {
    storage = new MemoryTokenStorage();
  });

  describe('token operations', () => {
    it('should store and retrieve token', async () => {
      await storage.setToken('test-token');
      const token = await storage.getToken();

      expect(token).toBe('test-token');
    });

    it('should return null when no token is stored', async () => {
      const token = await storage.getToken();

      expect(token).toBeNull();
    });

    it('should remove token', async () => {
      await storage.setToken('test-token');
      await storage.removeToken();
      const token = await storage.getToken();

      expect(token).toBeNull();
    });

    it('should update token', async () => {
      await storage.setToken('old-token');
      await storage.setToken('new-token');
      const token = await storage.getToken();

      expect(token).toBe('new-token');
    });
  });

  describe('refresh token operations', () => {
    it('should store and retrieve refresh token', async () => {
      await storage.setRefreshToken('refresh-token');
      const refreshToken = await storage.getRefreshToken();

      expect(refreshToken).toBe('refresh-token');
    });

    it('should return null when no refresh token is stored', async () => {
      const refreshToken = await storage.getRefreshToken();

      expect(refreshToken).toBeNull();
    });

    it('should remove refresh token', async () => {
      await storage.setRefreshToken('refresh-token');
      await storage.removeRefreshToken();
      const refreshToken = await storage.getRefreshToken();

      expect(refreshToken).toBeNull();
    });

    it('should store token and refresh token independently', async () => {
      await storage.setToken('access-token');
      await storage.setRefreshToken('refresh-token');

      expect(await storage.getToken()).toBe('access-token');
      expect(await storage.getRefreshToken()).toBe('refresh-token');
    });
  });

  describe('isolation', () => {
    it('should maintain separate storage for different instances', async () => {
      const storage1 = new MemoryTokenStorage();
      const storage2 = new MemoryTokenStorage();

      await storage1.setToken('token-1');
      await storage2.setToken('token-2');

      expect(await storage1.getToken()).toBe('token-1');
      expect(await storage2.getToken()).toBe('token-2');
    });
  });
});

describe('LocalStorageTokenStorage', () => {
  let storage: LocalStorageTokenStorage;

  beforeEach(() => {
    mockLocalStorage();
    storage = new LocalStorageTokenStorage();
  });

  afterEach(() => {
    cleanupLocalStorage();
  });

  describe('token operations', () => {
    it('should store and retrieve token from localStorage', async () => {
      await storage.setToken('test-token');
      const token = await storage.getToken();

      expect(token).toBe('test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
    });

    it('should return null when no token is stored', async () => {
      const token = await storage.getToken();

      expect(token).toBeNull();
    });

    it('should remove token from localStorage', async () => {
      await storage.setToken('test-token');
      await storage.removeToken();
      const token = await storage.getToken();

      expect(token).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should use custom token key', async () => {
      const customStorage = new LocalStorageTokenStorage('custom_token');
      await customStorage.setToken('test-token');

      expect(localStorage.setItem).toHaveBeenCalledWith('custom_token', 'test-token');
    });
  });

  describe('refresh token operations', () => {
    it('should store and retrieve refresh token from localStorage', async () => {
      await storage.setRefreshToken('refresh-token');
      const refreshToken = await storage.getRefreshToken();

      expect(refreshToken).toBe('refresh-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_refresh_token', 'refresh-token');
    });

    it('should remove refresh token from localStorage', async () => {
      await storage.setRefreshToken('refresh-token');
      await storage.removeRefreshToken();
      const refreshToken = await storage.getRefreshToken();

      expect(refreshToken).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_refresh_token');
    });

    it('should use custom refresh token key', async () => {
      const customStorage = new LocalStorageTokenStorage('token', 'custom_refresh');
      await customStorage.setRefreshToken('refresh-token');

      expect(localStorage.setItem).toHaveBeenCalledWith('custom_refresh', 'refresh-token');
    });
  });

  describe('SSR safety', () => {
    beforeEach(() => {
      // Remove window object to simulate SSR
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
      });
    });

    afterEach(() => {
      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: global,
        writable: true,
      });
    });

    it('should return null when window is undefined (getToken)', async () => {
      const token = await storage.getToken();
      expect(token).toBeNull();
    });

    it('should return null when window is undefined (getRefreshToken)', async () => {
      const refreshToken = await storage.getRefreshToken();
      expect(refreshToken).toBeNull();
    });

    it('should not throw when window is undefined (setToken)', async () => {
      await expect(storage.setToken('test-token')).resolves.toBeUndefined();
    });

    it('should not throw when window is undefined (removeToken)', async () => {
      await expect(storage.removeToken()).resolves.toBeUndefined();
    });
  });

  describe('concurrent access', () => {
    it('should handle concurrent reads', async () => {
      await storage.setToken('test-token');

      const results = await Promise.all([
        storage.getToken(),
        storage.getToken(),
        storage.getToken(),
      ]);

      expect(results).toEqual(['test-token', 'test-token', 'test-token']);
    });

    it('should handle concurrent writes', async () => {
      await Promise.all([
        storage.setToken('token-1'),
        storage.setToken('token-2'),
        storage.setToken('token-3'),
      ]);

      const token = await storage.getToken();
      // Last write wins
      expect(['token-1', 'token-2', 'token-3']).toContain(token);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string token', async () => {
      await storage.setToken('');
      const token = await storage.getToken();

      // localStorage returns null for empty string
      expect(token).toBe(null);
    });

    it('should handle very long token', async () => {
      const longToken = 'x'.repeat(10000);
      await storage.setToken(longToken);
      const token = await storage.getToken();

      expect(token).toBe(longToken);
    });

    it('should handle special characters in token', async () => {
      const specialToken = 'token-with-!@#$%^&*()_+{}:"<>?[];,./';
      await storage.setToken(specialToken);
      const token = await storage.getToken();

      expect(token).toBe(specialToken);
    });
  });
});
