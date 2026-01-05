import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../src/react/AuthProvider';
import { useAuth } from '../../src/react/useAuth';
import { MockAdapter } from '../helpers/mock-adapter';
import { MemoryTokenStorage } from '../../src/core/TokenStorage';

describe('React Integration Tests', () => {
  let mockAdapter: MockAdapter;
  let tokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    tokenStorage = new MemoryTokenStorage();
  });

  describe('AuthProvider + useAuth integration', () => {
    it('should provide auth state to nested components', async () => {
      mockAdapter.mockSuccessfulLogin();

      function LoginButton() {
        const { loginWithBearerToken } = useAuth();
        return <button onClick={() => loginWithBearerToken('token')}>Login</button>;
      }

      function UserDisplay() {
        const { user, isAuthenticated } = useAuth();
        return (
          <div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
            <div data-testid="user">{user?.email || 'none'}</div>
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <LoginButton />
          <UserDisplay />
        </AuthProvider>
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');

      await userEvent.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });

    it('should handle multi-step authentication flow', async () => {
      mockAdapter.mockSuccessfulLogin();

      function MultiStepAuth() {
        const { loginWithBearerToken, logout, isAuthenticated } = useAuth();
        const [step, setStep] = React.useState(1);

        return (
          <div>
            <div data-testid="step">{step}</div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
            {step === 1 && (
              <button
                onClick={() => {
                  loginWithBearerToken('token').then(() => setStep(2));
                }}
              >
                Step 1: Login
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => {
                  logout().then(() => setStep(3));
                }}
              >
                Step 2: Logout
              </button>
            )}
            {step === 3 && <div data-testid="complete">Complete</div>}
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <MultiStepAuth />
        </AuthProvider>
      );

      // Step 1: Login
      await userEvent.click(screen.getByText('Step 1: Login'));
      await waitFor(() => {
        expect(screen.getByTestId('step')).toHaveTextContent('2');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Step 2: Logout
      await userEvent.click(screen.getByText('Step 2: Logout'));
      await waitFor(() => {
        expect(screen.getByTestId('step')).toHaveTextContent('3');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('complete')).toBeInTheDocument();
    });
  });

  describe('Route protection simulation', () => {
    function ProtectedRoute({ children }: { children: React.ReactNode }) {
      const { isAuthenticated, isLoading } = useAuth();

      if (isLoading) {
        return <div data-testid="loading">Loading...</div>;
      }

      if (!isAuthenticated) {
        return <div data-testid="unauthorized">Unauthorized</div>;
      }

      return <>{children}</>;
    }

    it('should protect routes when not authenticated', () => {
      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should allow access when authenticated', async () => {
      const protectedAdapter = new MockAdapter();
      protectedAdapter.mockSuccessfulLogin();
      const protectedStorage = new MemoryTokenStorage();

      function App() {
        const { loginWithBearerToken, isLoading } = useAuth();
        const [hasLoggedIn, setHasLoggedIn] = React.useState(false);

        useEffect(() => {
          if (!hasLoggedIn && !isLoading) {
            loginWithBearerToken('token');
            setHasLoggedIn(true);
          }
        }, [loginWithBearerToken, hasLoggedIn, isLoading]);

        return (
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        );
      }

      render(
        <AuthProvider config={{ adapter: protectedAdapter, tokenStorage: protectedStorage }}>
          <App />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Session persistence across components', () => {
    it('should maintain session state when navigating between components', async () => {
      mockAdapter.mockSuccessfulLogin();

      function LoginPage() {
        const { loginWithBearerToken } = useAuth();
        return <button onClick={() => loginWithBearerToken('token')}>Login</button>;
      }

      function ProfilePage() {
        const { user } = useAuth();
        return <div data-testid="profile">{user?.email}</div>;
      }

      function App() {
        const [page, setPage] = React.useState<'login' | 'profile'>('login');
        const { isAuthenticated } = useAuth();

        useEffect(() => {
          if (isAuthenticated) {
            setPage('profile');
          }
        }, [isAuthenticated]);

        return page === 'login' ? <LoginPage /> : <ProfilePage />;
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <App />
        </AuthProvider>
      );

      await userEvent.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('profile')).toHaveTextContent('test@example.com');
      });
    });
  });

  describe('Error handling in components', () => {
    it('should display errors from authentication attempts', async () => {
      mockAdapter.mockFailedLogin(new Error('Invalid credentials'));

      function LoginForm() {
        const { loginWithBearerToken, error } = useAuth();
        return (
          <div>
            <button
              onClick={() => loginWithBearerToken('token').catch(() => {})}
            >
              Login
            </button>
            {error && <div data-testid="error">{error.message}</div>}
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <LoginForm />
        </AuthProvider>
      );

      await userEvent.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });

    it('should clear errors on successful login after failure', async () => {
      // First login fails
      mockAdapter.mockFailedLogin(new Error('Network error'));

      function LoginForm() {
        const { loginWithBearerToken, error } = useAuth();
        return (
          <div>
            <button
              onClick={() => loginWithBearerToken('token').catch(() => {})}
            >
              Login
            </button>
            {error && <div data-testid="error">{error.message}</div>}
            {!error && <div data-testid="no-error">No error</div>}
          </div>
        );
      }

      const { rerender } = render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <LoginForm />
        </AuthProvider>
      );

      // First attempt fails
      await userEvent.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Second attempt succeeds
      mockAdapter.mockSuccessfulLogin();
      await userEvent.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('no-error')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple auth method usage', () => {
    it('should support switching between auth methods', async () => {
      mockAdapter.mockSuccessfulLogin();

      function AuthSelector() {
        const { loginWithBearerToken, loginWithCredentials, isAuthenticated } = useAuth();
        const [method, setMethod] = React.useState<'token' | 'credentials'>('token');

        return (
          <div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
            <select
              data-testid="method-select"
              value={method}
              onChange={(e) => setMethod(e.target.value as 'token' | 'credentials')}
            >
              <option value="token">Token</option>
              <option value="credentials">Credentials</option>
            </select>
            <button
              onClick={() => {
                if (method === 'token') {
                  loginWithBearerToken('token');
                } else {
                  loginWithCredentials('user', 'pass');
                }
              }}
            >
              Login
            </button>
          </div>
        );
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <AuthSelector />
        </AuthProvider>
      );

      // Login with token
      await userEvent.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
      expect(mockAdapter.loginWithBearerTokenMock).toHaveBeenCalled();

      // Switch to credentials and login again
      await userEvent.selectOptions(screen.getByTestId('method-select'), 'credentials');
      await userEvent.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(mockAdapter.loginWithCredentialsMock).toHaveBeenCalled();
      });
    });
  });

  describe('Concurrent component updates', () => {
    it('should handle multiple components updating state simultaneously', async () => {
      mockAdapter.mockSuccessfulLogin();

      function Component1() {
        const { isAuthenticated } = useAuth();
        return <div data-testid="comp1">{isAuthenticated.toString()}</div>;
      }

      function Component2() {
        const { user } = useAuth();
        return <div data-testid="comp2">{user?.email || 'none'}</div>;
      }

      function Component3() {
        const { loginWithBearerToken } = useAuth();
        return <button onClick={() => loginWithBearerToken('token')}>Login</button>;
      }

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <Component1 />
          <Component2 />
          <Component3 />
        </AuthProvider>
      );

      await userEvent.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('comp1')).toHaveTextContent('true');
        expect(screen.getByTestId('comp2')).toHaveTextContent('test@example.com');
      });
    });
  });
});
