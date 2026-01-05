import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../../../src/react/useAuth';
import { AuthProvider } from '../../../src/react/AuthProvider';
import { MockAdapter } from '../../helpers/mock-adapter';
import { MemoryTokenStorage } from '../../../src/core/TokenStorage';

describe('useAuth', () => {
  let mockAdapter: MockAdapter;
  let tokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    tokenStorage = new MemoryTokenStorage();
  });

  describe('hook functionality', () => {
    it('should return auth state', () => {
      function TestComponent() {
        const auth = useAuth();
        return <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>;
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    it('should return authentication methods', () => {
      function TestComponent() {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="has-login">
              {typeof auth.loginWithBearerToken === 'function' ? 'yes' : 'no'}
            </div>
            <div data-testid="has-logout">
              {typeof auth.logout === 'function' ? 'yes' : 'no'}
            </div>
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('has-login')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-logout')).toHaveTextContent('yes');
    });

    it('should allow calling authentication methods', async () => {
      mockAdapter.mockSuccessfulLogin();

      function TestComponent() {
        const { loginWithBearerToken, isAuthenticated } = useAuth();
        return (
          <div>
            <button onClick={() => loginWithBearerToken('test-token')}>Login</button>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });
  });

  describe('state updates', () => {
    it('should reflect state changes', async () => {
      mockAdapter.mockSuccessfulLogin();

      function TestComponent() {
        const { loginWithBearerToken, user } = useAuth();
        return (
          <div>
            <button onClick={() => loginWithBearerToken('test-token')}>Login</button>
            <div data-testid="user">{user?.email || 'no user'}</div>
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user')).toHaveTextContent('no user');

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });

    it('should reflect loading state', async () => {
      mockAdapter.mockSuccessfulLogin();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });

      mockAdapter.loginWithBearerTokenMock.mockImplementation(async () => {
        await loginPromise;
        return mockAdapter.mockSuccessfulLogin();
      });

      function TestComponent() {
        const { loginWithBearerToken, isLoading } = useAuth();
        return (
          <div>
            <button onClick={() => loginWithBearerToken('test-token')}>Login</button>
            <div data-testid="loading">{isLoading.toString()}</div>
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('true');
      });

      resolveLogin!();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should reflect error state', async () => {
      mockAdapter.mockFailedLogin(new Error('Login failed'));

      function TestComponent() {
        const { loginWithBearerToken, error } = useAuth();
        return (
          <div>
            <button
              onClick={() => loginWithBearerToken('test-token').catch(() => {})}
            >
              Login
            </button>
            <div data-testid="error">{error?.message || 'no error'}</div>
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed');
      });
    });
  });

  describe('method calls', () => {
    it('should support loginWithCredentials', async () => {
      mockAdapter.mockSuccessfulLogin();

      function TestComponent() {
        const { loginWithCredentials } = useAuth();
        return (
          <button onClick={() => loginWithCredentials('user@test.com', 'pass')}>
            Login
          </button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(mockAdapter.loginWithCredentialsMock).toHaveBeenCalledWith(
          'user@test.com',
          'pass'
        );
      });
    });

    it('should support loginWithGoogle', async () => {
      mockAdapter.mockSuccessfulLogin();

      function TestComponent() {
        const { loginWithGoogle } = useAuth();
        return (
          <button onClick={() => loginWithGoogle('google-code')}>Login</button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(mockAdapter.loginWithGoogleMock).toHaveBeenCalledWith('google-code');
      });
    });

    it('should support loginWithChabadOrg', async () => {
      mockAdapter.mockSuccessfulLogin();

      function TestComponent() {
        const { loginWithChabadOrg } = useAuth();
        return (
          <button onClick={() => loginWithChabadOrg('chabad-token')}>Login</button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(mockAdapter.loginWithChabadOrgMock).toHaveBeenCalledWith('chabad-token');
      });
    });

    it('should support loginWithCDSSO', async () => {
      mockAdapter.mockSuccessfulLogin();

      function TestComponent() {
        const { loginWithCDSSO } = useAuth();
        return <button onClick={() => loginWithCDSSO()}>Login</button>;
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(mockAdapter.loginWithCDSSOMock).toHaveBeenCalled();
      });
    });

    it('should support logout', async () => {
      mockAdapter.mockSuccessfulLogin();

      function TestComponent() {
        const { loginWithBearerToken, logout, isAuthenticated } = useAuth();
        return (
          <div>
            <button onClick={() => loginWithBearerToken('token')}>Login</button>
            <button onClick={() => logout()}>Logout</button>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      // Login
      screen.getByText('Login').click();
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Logout
      screen.getByText('Logout').click();
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('error scenarios', () => {
    it('should throw when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      function TestComponent() {
        useAuth();
        return <div>Test</div>;
      }

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuthContext must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });
});
