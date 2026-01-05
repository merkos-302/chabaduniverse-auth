import type { TokenStorage } from '../types';

/**
 * LocalStorage-based token storage implementation
 *
 * Stores tokens in browser localStorage for persistence across sessions.
 */
export class LocalStorageTokenStorage implements TokenStorage {
  private tokenKey: string;
  private refreshTokenKey: string;

  constructor(tokenKey = 'auth_token', refreshTokenKey = 'auth_refresh_token') {
    this.tokenKey = tokenKey;
    this.refreshTokenKey = refreshTokenKey;
  }

  async getToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  async setToken(token: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
  }

  async removeToken(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.tokenKey);
  }

  async getRefreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  async setRefreshToken(token: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.refreshTokenKey, token);
  }

  async removeRefreshToken(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.refreshTokenKey);
  }
}

/**
 * In-memory token storage implementation
 *
 * Stores tokens in memory only. Tokens are lost on page refresh.
 * Useful for testing or when persistence is not desired.
 */
export class MemoryTokenStorage implements TokenStorage {
  private token: string | null = null;
  private refreshToken: string | null = null;

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
  }

  async removeToken(): Promise<void> {
    this.token = null;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.refreshToken;
  }

  async setRefreshToken(token: string): Promise<void> {
    this.refreshToken = token;
  }

  async removeRefreshToken(): Promise<void> {
    this.refreshToken = null;
  }
}
