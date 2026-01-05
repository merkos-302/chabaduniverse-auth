import type { User, AuthResponse, AuthState } from '../../src/types';

/**
 * Test data fixtures
 */

export const mockUsers = {
  testUser: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  } as User,

  adminUser: {
    id: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
  } as User,

  userWithMetadata: {
    id: '3',
    email: 'metadata@example.com',
    name: 'Metadata User',
    metadata: {
      organization: 'Merkos',
      department: 'CTeen',
    },
  } as User,
};

export const mockTokens = {
  validToken: 'valid-token-12345',
  expiredToken: 'expired-token-67890',
  invalidToken: 'invalid-token-abcde',
  refreshToken: 'refresh-token-xyz',
};

export const mockAuthResponses = {
  successful: {
    user: mockUsers.testUser,
    token: mockTokens.validToken,
    refreshToken: mockTokens.refreshToken,
    expiresIn: 3600,
  } as AuthResponse,

  withoutRefreshToken: {
    user: mockUsers.testUser,
    token: mockTokens.validToken,
  } as AuthResponse,

  adminLogin: {
    user: mockUsers.adminUser,
    token: mockTokens.validToken,
    refreshToken: mockTokens.refreshToken,
  } as AuthResponse,
};

export const mockAuthStates = {
  unauthenticated: {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
    token: null,
    refreshToken: null,
  } as AuthState,

  authenticated: {
    isAuthenticated: true,
    isLoading: false,
    user: mockUsers.testUser,
    error: null,
    token: mockTokens.validToken,
    refreshToken: mockTokens.refreshToken,
  } as AuthState,

  loading: {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
    token: null,
    refreshToken: null,
  } as AuthState,

  error: {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: new Error('Authentication failed'),
    token: null,
    refreshToken: null,
  } as AuthState,
};

export const mockErrors = {
  invalidCredentials: new Error('Invalid credentials'),
  tokenExpired: new Error('Token expired'),
  networkError: new Error('Network error'),
  unauthorized: new Error('Unauthorized'),
};
