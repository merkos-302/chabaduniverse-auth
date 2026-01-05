import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState, AuthConfig } from '../types';
import { AuthManager } from '../core/AuthManager';

/**
 * Authentication context
 */
export interface AuthContextValue extends AuthState {
  loginWithBearerToken: (token: string) => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  loginWithChabadOrg: (token: string) => Promise<void>;
  loginWithCDSSO: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Authentication provider props
 */
export interface AuthProviderProps {
  config: AuthConfig;
  children: React.ReactNode;
}

/**
 * Authentication provider component
 *
 * Wraps your React application to provide authentication context.
 *
 * @example
 * ```tsx
 * import { AuthProvider } from '@chabaduniverse/auth/react';
 * import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
 *
 * const adapter = new MerkosAPIAdapter({ baseUrl: 'https://shop.merkos302.com' });
 *
 * function App() {
 *   return (
 *     <AuthProvider config={{ adapter }}>
 *       <YourApp />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ config, children }: AuthProviderProps) {
  const [authManager] = useState(() => new AuthManager(config));
  const [state, setState] = useState<AuthState>(authManager.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const handleStateChange = (newState: AuthState) => {
      setState(newState);
    };

    authManager.on('auth:state-change', handleStateChange);

    return () => {
      authManager.off('auth:state-change', handleStateChange);
    };
  }, [authManager]);

  const contextValue: AuthContextValue = {
    ...state,
    loginWithBearerToken: (token: string) => authManager.loginWithBearerToken(token),
    loginWithCredentials: (username: string, password: string) =>
      authManager.loginWithCredentials(username, password),
    loginWithGoogle: (code: string) => authManager.loginWithGoogle(code),
    loginWithChabadOrg: (token: string) => authManager.loginWithChabadOrg(token),
    loginWithCDSSO: () => authManager.loginWithCDSSO(),
    logout: () => authManager.logout(),
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 *
 * Must be used within an AuthProvider.
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
