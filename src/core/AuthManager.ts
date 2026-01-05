import { EventEmitter } from 'eventemitter3';
import type {
  AuthState,
  AuthConfig,
  AuthResponse,
  AuthEvent,
  AuthError,
} from '../types';
import { LocalStorageTokenStorage } from './TokenStorage';

/**
 * Core authentication manager
 *
 * Manages authentication state, token storage, and authentication flows.
 * Provides event-based state change notifications.
 */
export class AuthManager extends EventEmitter<Record<AuthEvent, AuthState>> {
  private state: AuthState;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    super();
    this.config = config;
    this.state = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      token: null,
      refreshToken: null,
    };

    // Use provided token storage or default to localStorage
    if (!this.config.tokenStorage) {
      this.config.tokenStorage = new LocalStorageTokenStorage();
    }

    // Initialize from stored token
    this.initialize();
  }

  /**
   * Initialize authentication state from stored token
   */
  private async initialize(): Promise<void> {
    try {
      const token = await this.config.tokenStorage!.getToken();
      if (token) {
        // Verify token and get user info
        const isValid = await this.config.adapter.verifyToken(token);
        if (isValid) {
          const user = await this.config.adapter.getCurrentUser();
          this.updateState({
            isAuthenticated: true,
            user,
            token,
            error: null,
          });
        } else {
          // Token invalid, clear storage
          await this.config.tokenStorage!.removeToken();
        }
      }
    } catch (error) {
      // Initialization error, continue with unauthenticated state
      console.error('Auth initialization error:', error);
    }
  }

  /**
   * Login with bearer token
   */
  async loginWithBearerToken(token: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.config.adapter.loginWithBearerToken(token);
      await this.handleAuthResponse(response);
      this.emit('auth:login', this.state);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Login with username and password
   */
  async loginWithCredentials(username: string, password: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.config.adapter.loginWithCredentials(username, password);
      await this.handleAuthResponse(response);
      this.emit('auth:login', this.state);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(code: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.config.adapter.loginWithGoogle(code);
      await this.handleAuthResponse(response);
      this.emit('auth:login', this.state);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Login with Chabad.org SSO
   */
  async loginWithChabadOrg(token: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.config.adapter.loginWithChabadOrg(token);
      await this.handleAuthResponse(response);
      this.emit('auth:login', this.state);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Login with Cross-Domain SSO
   */
  async loginWithCDSSO(): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.config.adapter.loginWithCDSSO();
      await this.handleAuthResponse(response);
      this.emit('auth:login', this.state);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    this.updateState({ isLoading: true });
    try {
      await this.config.adapter.logout();
      await this.config.tokenStorage!.removeToken();
      if (this.config.tokenStorage!.removeRefreshToken) {
        await this.config.tokenStorage!.removeRefreshToken();
      }
      this.updateState({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        error: null,
      });
      this.emit('auth:logout', this.state);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Handle successful authentication response
   */
  private async handleAuthResponse(response: AuthResponse): Promise<void> {
    // Store tokens
    await this.config.tokenStorage!.setToken(response.token);
    if (response.refreshToken && this.config.tokenStorage!.setRefreshToken) {
      await this.config.tokenStorage!.setRefreshToken(response.refreshToken);
    }

    // Update state
    this.updateState({
      isAuthenticated: true,
      user: response.user,
      token: response.token,
      refreshToken: response.refreshToken ?? null,
      error: null,
    });
  }

  /**
   * Handle authentication error
   */
  private handleAuthError(error: unknown): void {
    const authError = error instanceof Error
      ? error as AuthError
      : new Error('Unknown authentication error') as AuthError;

    this.updateState({
      isAuthenticated: false,
      user: null,
      token: null,
      error: authError,
    });

    this.emit('auth:error', this.state);
    if (this.config.onError) {
      this.config.onError(authError);
    }
  }

  /**
   * Update authentication state
   */
  private updateState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates };
    this.emit('auth:state-change', this.state);
    if (this.config.onAuthStateChange) {
      this.config.onAuthStateChange(this.state);
    }
  }
}
