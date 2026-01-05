import React, { useState, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../src/react/AuthProvider';
import { useAuth } from '../../src/react/useAuth';
import { MockAdapter } from '../helpers/mock-adapter';
import { MemoryTokenStorage } from '../../src/core/TokenStorage';
import { mockUsers } from '../helpers/fixtures';

describe('User Journey E2E Tests', () => {
  let mockAdapter: MockAdapter;
  let tokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    tokenStorage = new MemoryTokenStorage();
  });

  describe('New user registration and login journey', () => {
    function RegistrationApp() {
      const { loginWithCredentials, isAuthenticated, user, isLoading } = useAuth();
      const [step, setStep] = useState<'register' | 'welcome'>('register');

      const handleRegister = async (email: string, password: string) => {
        await loginWithCredentials(email, password);
        setStep('welcome');
      };

      if (isLoading) {
        return <div data-testid="loading">Loading...</div>;
      }

      if (step === 'register') {
        return (
          <div>
            <h1>Register</h1>
            <button
              onClick={() => handleRegister('newuser@test.com', 'password123')}
            >
              Register
            </button>
          </div>
        );
      }

      return (
        <div>
          <h1>Welcome {user?.email}</h1>
          <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          <div data-testid="user-email">{user?.email}</div>
        </div>
      );
    }

    it('should complete new user registration flow', async () => {
      const regAdapter = new MockAdapter();
      regAdapter.mockSuccessfulLogin({ email: 'newuser@test.com' });
      const regStorage = new MemoryTokenStorage();

      render(
        <AuthProvider config={{ adapter: regAdapter, tokenStorage: regStorage }}>
          <RegistrationApp />
        </AuthProvider>
      );

      expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/Welcome/)).toBeInTheDocument();
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-email')).toHaveTextContent('newuser@test.com');
      });
    });
  });

  describe('Returning user login and session restore', () => {
    function LoginApp() {
      const { loginWithBearerToken, isAuthenticated, user } = useAuth();
      const [page, setPage] = useState<'login' | 'dashboard'>('login');

      useEffect(() => {
        if (isAuthenticated) {
          setPage('dashboard');
        }
      }, [isAuthenticated]);

      if (page === 'login') {
        return (
          <div>
            <h1>Login</h1>
            <button onClick={() => loginWithBearerToken('existing-token')}>
              Login
            </button>
          </div>
        );
      }

      return (
        <div>
          <h1>Dashboard</h1>
          <div data-testid="user-name">{user?.name}</div>
          <div data-testid="user-email">{user?.email}</div>
        </div>
      );
    }

    it('should handle returning user login', async () => {
      const loginAdapter = new MockAdapter();
      loginAdapter.mockSuccessfulLogin(mockUsers.testUser);
      const loginStorage = new MemoryTokenStorage();

      render(
        <AuthProvider config={{ adapter: loginAdapter, tokenStorage: loginStorage }}>
          <LoginApp />
        </AuthProvider>
      );

      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });

    it('should restore session from stored token', async () => {
      // Create separate token storage for this test
      const separateStorage = new MemoryTokenStorage();
      await separateStorage.setToken('stored-token');

      const separateAdapter = new MockAdapter();
      separateAdapter.verifyTokenMock.mockResolvedValue(true);
      separateAdapter.getCurrentUserMock.mockResolvedValue(mockUsers.testUser);

      render(
        <AuthProvider config={{ adapter: separateAdapter, tokenStorage: separateStorage }}>
          <LoginApp />
        </AuthProvider>
      );

      // Should automatically restore session and navigate to dashboard
      await waitFor(
        () => {
          expect(screen.queryByText('Dashboard')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Multi-device login scenarios', () => {
    it('should handle login on different devices with same account', async () => {
      const adapter1 = new MockAdapter();
      adapter1.mockSuccessfulLogin(mockUsers.testUser);

      function Device1() {
        const { loginWithBearerToken } = useAuth();
        return <button onClick={() => loginWithBearerToken('token-1')}>Login Device 1</button>;
      }

      // Device 1
      const storage1 = new MemoryTokenStorage();
      const { unmount } = render(
        <AuthProvider config={{ adapter: adapter1, tokenStorage: storage1 }}>
          <Device1 />
        </AuthProvider>
      );

      await userEvent.click(screen.getByText('Login Device 1'));
      await waitFor(() => expect(storage1.getToken()).resolves.toBe('mock-token'));

      unmount();

      const adapter2 = new MockAdapter();
      adapter2.mockSuccessfulLogin(mockUsers.testUser);

      function Device2() {
        const { loginWithBearerToken } = useAuth();
        return <button onClick={() => loginWithBearerToken('token-2')}>Login Device 2</button>;
      }

      // Device 2
      const storage2 = new MemoryTokenStorage();
      render(
        <AuthProvider config={{ adapter: adapter2, tokenStorage: storage2 }}>
          <Device2 />
        </AuthProvider>
      );

      await userEvent.click(screen.getByText('Login Device 2'));
      await waitFor(() => expect(storage2.getToken()).resolves.toBe('mock-token'));

      // Both devices should have valid tokens
      expect(await storage1.getToken()).toBe('mock-token');
      expect(await storage2.getToken()).toBe('mock-token');
    });
  });

  describe('Token expiration handling', () => {
    function TokenExpirationApp() {
      const { loginWithBearerToken, isAuthenticated, error } = useAuth();
      const [message, setMessage] = useState('');

      useEffect(() => {
        if (error) {
          setMessage(error.message);
        }
      }, [error]);

      return (
        <div>
          <button onClick={() => loginWithBearerToken('token').catch(() => {})}>
            Login
          </button>
          <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          <div data-testid="message">{message}</div>
        </div>
      );
    }

    it('should handle expired token', async () => {
      mockAdapter.mockFailedLogin(new Error('Token expired'));

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <TokenExpirationApp />
        </AuthProvider>
      );

      await userEvent.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('message')).toHaveTextContent('Token expired');
      });
    });
  });

  describe('Concurrent session management', () => {
    function ConcurrentSessionApp() {
      const { loginWithBearerToken, logout, isAuthenticated, user } = useAuth();

      return (
        <div>
          <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          <div data-testid="user">{user?.email || 'none'}</div>
          <button onClick={() => loginWithBearerToken('token-1')}>Login 1</button>
          <button onClick={() => loginWithBearerToken('token-2')}>Login 2</button>
          <button onClick={() => logout()}>Logout</button>
        </div>
      );
    }

    it('should handle multiple concurrent login attempts', async () => {
      const concurrentAdapter = new MockAdapter();
      concurrentAdapter.mockSuccessfulLogin();
      const concurrentStorage = new MemoryTokenStorage();

      render(
        <AuthProvider config={{ adapter: concurrentAdapter, tokenStorage: concurrentStorage }}>
          <ConcurrentSessionApp />
        </AuthProvider>
      );

      // Click both login buttons rapidly
      await userEvent.click(screen.getByText('Login 1'));
      await userEvent.click(screen.getByText('Login 2'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });

    it('should handle login followed immediately by logout', async () => {
      const concurrentAdapter = new MockAdapter();
      concurrentAdapter.mockSuccessfulLogin();
      const concurrentStorage = new MemoryTokenStorage();

      render(
        <AuthProvider config={{ adapter: concurrentAdapter, tokenStorage: concurrentStorage }}>
          <ConcurrentSessionApp />
        </AuthProvider>
      );

      await userEvent.click(screen.getByText('Login 1'));
      await userEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Full user lifecycle', () => {
    function FullLifecycleApp() {
      const {
        loginWithBearerToken,
        logout,
        isAuthenticated,
        user,
        isLoading,
        error,
      } = useAuth();

      return (
        <div>
          <div data-testid="loading">{isLoading.toString()}</div>
          <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          <div data-testid="user">{user?.email || 'none'}</div>
          <div data-testid="error">{error?.message || 'none'}</div>
          <button onClick={() => loginWithBearerToken('token').catch(() => {})}>
            Login
          </button>
          <button onClick={() => logout()}>Logout</button>
        </div>
      );
    }

    it('should complete full lifecycle: login -> use app -> logout', async () => {
      mockAdapter.mockSuccessfulLogin(mockUsers.testUser);

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <FullLifecycleApp />
        </AuthProvider>
      );

      // Initial state
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');

      // Login
      await userEvent.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Logout
      await userEvent.click(screen.getByText('Logout'));
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('none');
      });

      // Verify token was cleared
      expect(await tokenStorage.getToken()).toBeNull();
    });

    it('should handle error recovery in lifecycle', async () => {
      // First login fails
      mockAdapter.mockFailedLogin(new Error('Network error'));

      render(
        <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
          <FullLifecycleApp />
        </AuthProvider>
      );

      // Failed login attempt
      await userEvent.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      });

      // Second login succeeds
      mockAdapter.mockSuccessfulLogin();
      await userEvent.click(screen.getByText('Login'));
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });
    });
  });
});
