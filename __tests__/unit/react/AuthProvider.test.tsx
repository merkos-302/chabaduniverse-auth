import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../../../src/react/AuthProvider';
import { MockAdapter } from '../../helpers/mock-adapter';
import { MemoryTokenStorage } from '../../../src/core/TokenStorage';
import { mockUsers } from '../../helpers/fixtures';

// Test component that uses auth context
function TestComponent() {
  const { isAuthenticated, user, isLoading, error } = useAuthContext();

  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="user">{user?.email || 'no user'}</div>
      <div data-testid="error">{error?.message || 'no error'}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  let mockAdapter: MockAdapter;
  let tokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    tokenStorage = new MemoryTokenStorage();
  });

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <div data-testid="child">Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide initial unauthenticated state', () => {
      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    it('should render multiple children', () => {
      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('state propagation', () => {
    it('should update state when authentication changes', async () => {
      mockAdapter.mockSuccessfulLogin();

      function LoginButton() {
        const { loginWithBearerToken } = useAuthContext();
        return (
          <button onClick={() => loginWithBearerToken('test-token')}>
            Login
          </button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
          <LoginButton />
        </AuthProvider>
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');

      // Click login button
      screen.getByText('Login').click();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });

    it('should propagate loading state', async () => {
      mockAdapter.mockSuccessfulLogin();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });

      mockAdapter.loginWithBearerTokenMock.mockImplementation(async () => {
        await loginPromise;
        return mockAdapter.mockSuccessfulLogin();
      });

      function LoginButton() {
        const { loginWithBearerToken } = useAuthContext();
        return (
          <button onClick={() => loginWithBearerToken('test-token')}>
            Login
          </button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
          <LoginButton />
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

    it('should propagate error state', async () => {
      mockAdapter.mockFailedLogin(new Error('Login failed'));

      function LoginButton() {
        const { loginWithBearerToken } = useAuthContext();
        return (
          <button onClick={() => loginWithBearerToken('test-token').catch(() => {})}>
            Login
          </button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
          <LoginButton />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed');
      });
    });
  });

  describe('authentication methods', () => {
    it('should expose loginWithBearerToken', async () => {
      mockAdapter.mockSuccessfulLogin(mockUsers.testUser);

      function LoginButton() {
        const { loginWithBearerToken } = useAuthContext();
        return (
          <button onClick={() => loginWithBearerToken('test-token')}>
            Login
          </button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
          <LoginButton />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });

    it('should expose loginWithCredentials', async () => {
      mockAdapter.mockSuccessfulLogin(mockUsers.testUser);

      function LoginButton() {
        const { loginWithCredentials } = useAuthContext();
        return (
          <button onClick={() => loginWithCredentials('user@test.com', 'password')}>
            Login
          </button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
          <LoginButton />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(mockAdapter.loginWithCredentialsMock).toHaveBeenCalledWith(
          'user@test.com',
          'password'
        );
      });
    });

    it('should expose logout', async () => {
      mockAdapter.mockSuccessfulLogin();

      function AuthButtons() {
        const { loginWithBearerToken, logout } = useAuthContext();
        return (
          <>
            <button onClick={() => loginWithBearerToken('test-token')}>
              Login
            </button>
            <button onClick={() => logout()}>Logout</button>
          </>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
          <AuthButtons />
        </AuthProvider>
      );

      // Login first
      screen.getByText('Login').click();
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Then logout
      screen.getByText('Logout').click();
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('event handling', () => {
    it('should update state on auth:state-change event', async () => {
      mockAdapter.mockSuccessfulLogin();

      function LoginButton() {
        const { loginWithBearerToken } = useAuthContext();
        return (
          <button onClick={() => loginWithBearerToken('test-token')}>
            Login
          </button>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
          <LoginButton />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw error when useAuthContext used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuthContext must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('configuration', () => {
    it('should accept custom token storage', () => {
      const customStorage = new MemoryTokenStorage();

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage: customStorage }}>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    });

    it('should accept onAuthStateChange callback', async () => {
      const onAuthStateChange = jest.fn();
      mockAdapter.mockSuccessfulLogin();

      function LoginButton() {
        const { loginWithBearerToken } = useAuthContext();
        return (
          <button onClick={() => loginWithBearerToken('test-token')}>
            Login
          </button>
        );
      }

      render(
        <AuthProvider
          config={{
            adapter: mockAdapter,
            tokenStorage,
            onAuthStateChange,
          }}
        >
          <LoginButton />
        </AuthProvider>
      );

      screen.getByText('Login').click();

      await waitFor(() => {
        expect(onAuthStateChange).toHaveBeenCalled();
      });
    });
  });
});
