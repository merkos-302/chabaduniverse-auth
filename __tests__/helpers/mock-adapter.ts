import type { AuthAPIAdapter, AuthResponse, User } from '../../src/types';

/**
 * Mock adapter for testing
 */
export class MockAdapter implements AuthAPIAdapter {
  public loginWithBearerTokenMock = jest.fn();
  public loginWithCredentialsMock = jest.fn();
  public loginWithGoogleMock = jest.fn();
  public loginWithChabadOrgMock = jest.fn();
  public loginWithCDSSOMock = jest.fn();
  public getCurrentUserMock = jest.fn();
  public refreshTokenMock = jest.fn();
  public logoutMock = jest.fn();
  public verifyTokenMock = jest.fn();

  async loginWithBearerToken(token: string): Promise<AuthResponse> {
    return this.loginWithBearerTokenMock(token);
  }

  async loginWithCredentials(username: string, password: string): Promise<AuthResponse> {
    return this.loginWithCredentialsMock(username, password);
  }

  async loginWithGoogle(code: string): Promise<AuthResponse> {
    return this.loginWithGoogleMock(code);
  }

  async loginWithChabadOrg(token: string): Promise<AuthResponse> {
    return this.loginWithChabadOrgMock(token);
  }

  async loginWithCDSSO(): Promise<AuthResponse> {
    return this.loginWithCDSSOMock();
  }

  async getCurrentUser(): Promise<User> {
    return this.getCurrentUserMock();
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.refreshTokenMock(refreshToken);
  }

  async logout(): Promise<void> {
    return this.logoutMock();
  }

  async verifyToken(token: string): Promise<boolean> {
    return this.verifyTokenMock(token);
  }

  // Helper methods for setting up mock responses
  mockSuccessfulLogin(user?: Partial<User>, token = 'mock-token') {
    const defaultUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      ...user,
    };

    const response: AuthResponse = {
      user: defaultUser,
      token,
    };

    this.loginWithBearerTokenMock.mockResolvedValue(response);
    this.loginWithCredentialsMock.mockResolvedValue(response);
    this.loginWithGoogleMock.mockResolvedValue(response);
    this.loginWithChabadOrgMock.mockResolvedValue(response);
    this.loginWithCDSSOMock.mockResolvedValue(response);
    this.getCurrentUserMock.mockResolvedValue(defaultUser);
    this.verifyTokenMock.mockResolvedValue(true);

    return { user: defaultUser, token, response };
  }

  mockFailedLogin(error = new Error('Login failed')) {
    this.loginWithBearerTokenMock.mockRejectedValue(error);
    this.loginWithCredentialsMock.mockRejectedValue(error);
    this.loginWithGoogleMock.mockRejectedValue(error);
    this.loginWithChabadOrgMock.mockRejectedValue(error);
    this.loginWithCDSSOMock.mockRejectedValue(error);
  }

  mockTokenRefresh(token = 'new-token') {
    const response: AuthResponse = {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token,
    };
    this.refreshTokenMock.mockResolvedValue(response);
    return response;
  }

  reset() {
    this.loginWithBearerTokenMock.mockReset();
    this.loginWithCredentialsMock.mockReset();
    this.loginWithGoogleMock.mockReset();
    this.loginWithChabadOrgMock.mockReset();
    this.loginWithCDSSOMock.mockReset();
    this.getCurrentUserMock.mockReset();
    this.refreshTokenMock.mockReset();
    this.logoutMock.mockReset();
    this.verifyTokenMock.mockReset();
  }
}
