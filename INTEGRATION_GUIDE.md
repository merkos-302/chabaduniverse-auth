# Integration Guide: @chabaduniverse/auth

## Overview

This guide demonstrates how all the extracted components work together to provide a complete authentication solution for ChabadUniverse applications.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Basic Usage](#basic-usage)
5. [Advanced Integration](#advanced-integration)
6. [Component Reference](#component-reference)
7. [Testing](#testing)
8. [Migration from universe-portal](#migration-from-universe-portal)

---

## Architecture Overview

The @chabaduniverse/auth package is built on a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components Layer                     │
│  - AuthGuard (route protection)                              │
│  - BearerTokenDialog (token input UI)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     React Hooks Layer                         │
│  - useAuth (authentication state)                            │
│  - useValuAuth (Valu Social integration)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Context Providers Layer                    │
│  - AuthProvider (AuthContext)                                │
│  - ValuAPIProvider (ValuAPIContext)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Adapter Layer                            │
│  - AuthAPIAdapter (API communication)                        │
│  - ValuAPIAdapter (Valu Social API)                          │
│  - UserServiceAdapter (user data management)                 │
│  - CDSSOUtils (cross-domain SSO)                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                            │
│  - User model                                                │
│  - Profile model                                             │
│  - Preferences model                                         │
│  - Activity model                                            │
│  - AppData model                                             │
│  - Analytics model                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
npm install @chabaduniverse/auth
```

### Peer Dependencies

For React applications, ensure you have React installed:

```bash
npm install react react-dom
```

---

## Core Concepts

### 1. Adapter Pattern

All external dependencies (API clients, storage mechanisms, routing) are abstracted through adapter interfaces:

```typescript
// AuthAPIAdapter - Handles API communication
interface AuthAPIAdapter {
  setToken(token: string): void;
  clearToken(): void;
  loginWithBearerToken(token: string, siteId?: string | null): Promise<AuthResponse>;
  loginWithCredentials(username: string, password: string, siteId?: string | null): Promise<AuthResponse>;
  loginWithGoogle(code: string, host?: string | null, siteId?: string | null): Promise<AuthResponse>;
  loginWithChabadOrg(key: string, siteId?: string | null): Promise<AuthResponse>;
  loginWithCDSSO(): Promise<AuthResponse>;
  getCurrentUser(): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  logout(): Promise<void>;
  verifyToken(token: string): Promise<boolean>;
  v2Request<T>(service: string, path: string, params: Record<string, unknown>): Promise<T>;
}

// ValuAPIAdapter - Handles Valu Social integration
interface ValuAPIAdapter {
  getConnectionState(): ValuConnectionState;
  getCurrentUser(): Promise<ValuUser | null>;
  getUserIcon(userId?: string, size?: number): Promise<string | null>;
  runConsoleCommand(command: string): Promise<any>;
  isConnected(): boolean;
  isReady(): boolean;
  isInIframe(): boolean;
  isNavigatingApp(): boolean;
  getAuthApi(): ValuAuthAPI | null;
}
```

### 2. Dual Authentication

The system supports simultaneous Valu Social and Merkos Platform authentication:

- **Valu Social**: Primary authentication for iframe environments
- **Merkos Platform**: Fallback/alternative authentication with Bearer Token support

### 3. Framework-Agnostic Core

All core logic is framework-agnostic, allowing usage in:
- React applications
- Next.js applications
- Node.js backends
- Custom frameworks

---

## Basic Usage

### 1. Simple React Application Setup

```typescript
// app.tsx
import React from 'react';
import { AuthProvider } from '@chabaduniverse/auth/react';
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
import { createUserService } from './services/userService';

// Create adapters
const merkosAdapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2',
  timeout: 30000,
});

const userServiceAdapter = createUserService(); // Your implementation

// Configure auth provider
const authConfig = {
  apiAdapter: merkosAdapter,
  userServiceAdapter: userServiceAdapter,
};

function App() {
  return (
    <AuthProvider config={authConfig}>
      <YourAppContent />
    </AuthProvider>
  );
}

export default App;
```

### 2. Using Authentication in Components

```typescript
// components/Dashboard.tsx
import React from 'react';
import { useAuth } from '@chabaduniverse/auth/react';

function Dashboard() {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithBearerToken,
    logout,
    error,
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Please Login</h2>
        <button onClick={() => loginWithBearerToken('your-token')}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Welcome, {user?.name || user?.email}!</h2>
      <button onClick={logout}>Logout</button>
      {error && <div className="error">{error.message}</div>}
    </div>
  );
}
```

### 3. Route Protection with AuthGuard

```typescript
// pages/ProtectedPage.tsx
import React from 'react';
import { AuthGuard } from '@chabaduniverse/auth/react';
import { BearerTokenDialog } from '@chabaduniverse/auth/react';

function ProtectedPage() {
  return (
    <AuthGuard
      requireMerkosAuth={true}
      BearerTokenDialog={BearerTokenDialog}
      fallback={<div>Loading authentication...</div>}
    >
      <YourProtectedContent />
    </AuthGuard>
  );
}
```

---

## Advanced Integration

### 1. Dual Authentication (Valu + Merkos)

```typescript
// app.tsx
import React from 'react';
import {
  AuthProvider,
  ValuAPIProvider,
} from '@chabaduniverse/auth/react';
import {
  MerkosAPIAdapter,
  ValuAPIAdapterImpl, // Your Valu API adapter implementation
} from '@chabaduniverse/auth/adapters';

const merkosAdapter = new MerkosAPIAdapter({ baseUrl: '...' });
const valuAdapter = new ValuAPIAdapterImpl();

function App() {
  return (
    <AuthProvider config={{ apiAdapter: merkosAdapter, userServiceAdapter }}>
      <ValuAPIProvider adapter={valuAdapter}>
        <YourAppContent />
      </ValuAPIProvider>
    </AuthProvider>
  );
}
```

**Using Dual Authentication:**

```typescript
import { useAuth, useValuAuth } from '@chabaduniverse/auth/react';

function DualAuthComponent() {
  const {
    isAuthenticated: isMerkosAuth,
    user: merkosUser,
  } = useAuth();

  const {
    isAuthenticated: isValuAuth,
    user: valuUser,
    isInValuFrame,
  } = useValuAuth();

  if (isInValuFrame && isValuAuth) {
    return <div>Authenticated via Valu Social: {valuUser?.name}</div>;
  }

  if (isMerkosAuth) {
    return <div>Authenticated via Merkos Platform: {merkosUser?.name}</div>;
  }

  return <div>Not authenticated</div>;
}
```

### 2. Custom Bearer Token Dialog

```typescript
// components/CustomTokenDialog.tsx
import React from 'react';
import { BearerTokenDialog } from '@chabaduniverse/auth/react';
import { Dialog, DialogContent, Button, Input } from '@/components/ui';

function CustomTokenDialog() {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleTokenSubmit = async (token: string) => {
    try {
      // Your authentication logic
      await authenticateWithToken(token);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <BearerTokenDialog
      open={open}
      onOpenChange={setOpen}
      onTokenSubmit={handleTokenSubmit}
      error={error}
      render={({
        token,
        setToken,
        handleSubmit,
        handleCancel,
        isLoading,
        isValid,
        inputRef,
      }) => (
        <Dialog open onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent>
            <h2>Custom Authentication</h2>
            <Input
              ref={inputRef}
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
            />
            {error && <p className="error">{error}</p>}
            <Button onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
              {isLoading ? 'Authenticating...' : 'Submit'}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    />
  );
}
```

### 3. Cross-Domain SSO (CDSSO)

```typescript
// services/cdssoService.ts
import { CDSSOUtils } from '@chabaduniverse/auth';

const cdssoUtils = {
  async retrieveRemoteStatus() {
    // Call Merkos Platform CDSSO endpoint
    const response = await fetch('https://id.merkos302.com/apiv4/users/sso/remote/status');
    return await response.json();
  },

  async validateRemoteStatus(token: string) {
    // Validate with your backend
    const response = await fetch('/api/sso/remote/status', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return await response.json();
  },
};

// In your AuthProvider config
const authConfig = {
  apiAdapter: merkosAdapter,
  userServiceAdapter: userServiceAdapter,
  cdssoUtils: cdssoUtils, // Optional CDSSO support
};
```

### 4. Authentication with Multiple Methods

```typescript
function MultiMethodAuth() {
  const { loginWithBearerToken, loginWithCredentials, loginWithGoogle } = useAuth();

  const handleBearerLogin = async (token: string) => {
    await loginWithBearerToken(token);
  };

  const handleCredentialsLogin = async (username: string, password: string) => {
    await loginWithCredentials(username, password);
  };

  const handleGoogleLogin = async (code: string) => {
    await loginWithGoogle(code);
  };

  return (
    <div>
      <BearerTokenForm onSubmit={handleBearerLogin} />
      <CredentialsForm onSubmit={handleCredentialsLogin} />
      <GoogleLoginButton onClick={handleGoogleLogin} />
    </div>
  );
}
```

---

## MerkosAPIAdapter Usage

### Overview

The `MerkosAPIAdapter` implements the Merkos Platform API v2 integration. Phase 5A provides the core infrastructure methods that serve as the foundation for all authentication operations.

### Core Methods (Phase 5A - Completed)

#### 1. Token Management

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2',
  timeout: 30000,
});

// Store token for authenticated requests
adapter.setToken('your-jwt-token');

// Clear token on logout
adapter.clearToken();
```

#### 2. Making v2 API Requests

The `v2Request<T>()` method provides type-safe access to any Merkos Platform API v2 endpoint:

```typescript
// Example: Get user info (authenticated request)
interface UserInfo {
  uuid: string;
  email: string;
  name: string;
  roles: string[];
}

adapter.setToken('your-jwt-token');
const user = await adapter.v2Request<UserInfo>(
  'auth',
  'auth:user:info',
  {}
);

// Example: Login with credentials (unauthenticated request)
interface AuthResponse {
  user: UserInfo;
  token: string;
  refreshToken?: string;
}

const response = await adapter.v2Request<AuthResponse>(
  'auth',
  'auth:username:login',
  { username: 'user@example.com', password: 'password123' }
);
```

### v2 API Request Structure

The Merkos Platform API v2 uses a unified endpoint structure:

- **Endpoint**: `POST /api/v2` (single endpoint for all requests)
- **Headers**: `Content-Type: application/json`, `identifier: <token>` (when authenticated)
- **Body**: `{ service: string, path: string, params: object }`

#### Service Names
- `auth` - Authentication and user management
- `orgs` - Organization management
- `orgcampaigns` - Campaign management
- `orgforms` - Form builder and submissions

#### Path Format
Paths use colon-separated format: `service:resource:action`

Examples:
- `auth:username:login` - Username/password login
- `auth:user:info` - Get current user info
- `orgs:admin:list` - List organizations
- `orgcampaigns:members:add` - Add campaign member

### Error Handling

The adapter provides comprehensive error handling with intelligent error code mapping:

```typescript
import { AuthError, AuthErrorCode } from '@chabaduniverse/auth';

try {
  const response = await adapter.v2Request('auth', 'auth:user:info', {});
} catch (error) {
  if (error instanceof AuthError) {
    switch (error.code) {
      case AuthErrorCode.INVALID_TOKEN:
        console.log('Token is invalid or expired');
        break;
      case AuthErrorCode.UNAUTHORIZED:
        console.log('Not authenticated');
        break;
      case AuthErrorCode.NETWORK_ERROR:
        console.log('Network error occurred');
        break;
      case AuthErrorCode.TIMEOUT:
        console.log('Request timed out');
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  }
}
```

### Advanced Usage

#### Custom Timeout

```typescript
const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2',
  timeout: 60000, // 60 seconds for slow operations
});
```

#### Multiple Adapter Instances

```typescript
// Production adapter
const prodAdapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2',
});

// Development/testing adapter
const devAdapter = new MerkosAPIAdapter({
  baseUrl: 'http://localhost:3000',
  apiVersion: 'v2',
  timeout: 10000,
});
```

### Implementation Status

**Phase 5A (✅ Completed):**
- `setToken(token: string): void` - Token storage
- `clearToken(): void` - Token cleanup
- `v2Request<T>(service, path, params): Promise<T>` - Core API request method

**Coming in Future Phases:**
- Phase 5B: Authentication methods (loginWithCredentials, loginWithGoogle, etc.)
- Phase 5C: User info retrieval (getCurrentUser)
- Phase 5D: Token refresh and verification
- Phase 5E: Integration with Universe Portal Auth API

---

## Component Reference

### AuthProvider

**Props:**
```typescript
interface AuthProviderProps {
  children: React.ReactNode;
  config: AuthProviderConfig;
}

interface AuthProviderConfig {
  apiAdapter: AuthAPIAdapter;
  userServiceAdapter: UserServiceAdapter;
  cdssoUtils?: CDSSOUtils; // Optional CDSSO support
}
```

**Usage:**
```typescript
<AuthProvider config={authConfig}>
  {children}
</AuthProvider>
```

---

### useAuth Hook

**Returns:**
```typescript
interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: User | null;
  error: AuthError | null;

  // Merkos-specific
  hasMerkosBearerToken: boolean;

  // Valu-specific
  isValuAuthenticated: boolean;
  valuUserId: string | null;

  // Methods
  loginWithBearerToken: (token: string, siteId?: string | null) => Promise<void>;
  loginWithCredentials: (username: string, password: string, siteId?: string | null) => Promise<void>;
  loginWithGoogle: (code: string, host?: string | null, siteId?: string | null) => Promise<void>;
  loginWithChabadOrg: (key: string, siteId?: string | null) => Promise<void>;
  loginWithCDSSO: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
```

---

### useValuAuth Hook

**Returns:**
```typescript
interface UseValuAuthReturn {
  // State
  user: PortalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInValuFrame: boolean;
  error: string | null;

  // Valu API state
  isConnected: boolean;
  isReady: boolean;
  isNavigatingApp: boolean;

  // Methods
  getUserIcon: (userId?: string, size?: number) => Promise<string | null>;
  refreshUser: () => Promise<void>;
}
```

---

### AuthGuard Component

**Props:**
```typescript
interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireValuAuth?: boolean;
  requireMerkosAuth?: boolean;
  fallback?: ReactNode;
  onTokenPrompt?: (show: boolean) => void;
  BearerTokenDialog?: ComponentType<BearerTokenDialogProps>;
  loadingComponent?: ReactNode;
}
```

**Authentication Modes:**
1. **Legacy mode** (default): `requireAuth={true}` - requires any authentication
2. **Dual auth mode**: Both Valu and Merkos authentication
3. **Valu-only mode**: `requireValuAuth={true}` - only Valu authentication
4. **Merkos-only mode**: `requireMerkosAuth={true}` - only Merkos authentication

---

### BearerTokenDialog Component

**Props:**
```typescript
interface BearerTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenSubmit: (token: string) => Promise<void>;
  error?: string | null;
  loading?: boolean;
  render?: (props: BearerTokenDialogRenderProps) => ReactNode;
}
```

**Two Usage Modes:**
1. **Default**: Basic HTML implementation
2. **Custom**: Use `render` prop for complete UI control

---

## Testing

### Testing with Jest

```typescript
// __tests__/auth.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@chabaduniverse/auth/react';
import { mockAdapter } from './mocks';

describe('Authentication', () => {
  it('should authenticate with bearer token', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider config={{ apiAdapter: mockAdapter }}>
          {children}
        </AuthProvider>
      ),
    });

    await act(async () => {
      await result.current.loginWithBearerToken('test-token');
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Mock Adapters

```typescript
// __tests__/mocks/mockAdapter.ts
import { AuthAPIAdapter, AuthResponse, User } from '@chabaduniverse/auth';

export const mockAdapter: AuthAPIAdapter = {
  setToken: jest.fn(),
  clearToken: jest.fn(),
  loginWithBearerToken: jest.fn().mockResolvedValue({
    user: { id: '1', email: 'test@example.com', name: 'Test User' },
    token: 'mock-token',
  } as AuthResponse),
  loginWithCredentials: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithChabadOrg: jest.fn(),
  loginWithCDSSO: jest.fn(),
  getCurrentUser: jest.fn().mockResolvedValue({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  } as User),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  verifyToken: jest.fn().mockResolvedValue(true),
  v2Request: jest.fn(),
};
```

---

## Migration from universe-portal

### Step 1: Install Package

```bash
cd universe-portal
npm install @chabaduniverse/auth
```

### Step 2: Replace Imports

**Before:**
```typescript
import { SimpleAuthProvider, useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { useValuAuth } from '@/hooks/useValuAuth';
import { AuthenticationGuard } from '@/components/AuthenticationGuard';
import { BearerTokenPromptDialog } from '@/components/merkos/BearerTokenPromptDialog';
```

**After:**
```typescript
import {
  AuthProvider,
  useAuth,
  useValuAuth,
  AuthGuard,
  BearerTokenDialog,
} from '@chabaduniverse/auth/react';
```

### Step 3: Update Provider Setup

**Before (universe-portal):**
```typescript
<SimpleAuthProvider>
  <App />
</SimpleAuthProvider>
```

**After (@chabaduniverse/auth):**
```typescript
<AuthProvider config={{ apiAdapter: merkosAdapter, userServiceAdapter }}>
  <ValuAPIProvider adapter={valuAdapter}>
    <App />
  </ValuAPIProvider>
</AuthProvider>
```

### Step 4: Update Component Usage

**Before:**
```typescript
const { user, isAuthenticated, loginWithBearerToken } = useSimpleAuth();
```

**After:**
```typescript
const { user, isAuthenticated, loginWithBearerToken } = useAuth();
```

---

## Best Practices

1. **Always use adapters** - Never import external dependencies directly
2. **Type everything** - Leverage TypeScript for type safety
3. **Test with mocks** - Create mock adapters for testing
4. **Handle errors gracefully** - Always check for error states
5. **Initialize early** - Set up AuthProvider at root level
6. **Use AuthGuard** - Protect routes with AuthGuard component
7. **Customize UI** - Use render props for custom UI implementations

---

## Troubleshooting

### Issue: "Cannot read properties of undefined (reading 'loginWithBearerToken')"

**Solution:** Ensure AuthProvider is wrapped around your component:

```typescript
<AuthProvider config={authConfig}>
  <YourComponent />
</AuthProvider>
```

### Issue: "Bearer token dialog appears immediately"

**Solution:** Check `isInitialized` flag before showing dialog:

```typescript
const { isInitialized, hasMerkosBearerToken } = useAuth();

if (!isInitialized || hasMerkosBearerToken) {
  return null; // Don't show dialog yet
}
```

### Issue: "Valu authentication not working"

**Solution:** Ensure ValuAPIProvider is configured:

```typescript
<ValuAPIProvider adapter={valuAdapter}>
  <App />
</ValuAPIProvider>
```

---

## Conclusion

The @chabaduniverse/auth package provides a complete, framework-agnostic authentication solution with:

- ✅ Dual authentication (Valu + Merkos)
- ✅ Multiple authentication methods (Bearer Token, Credentials, Google, CDSSO)
- ✅ Adapter pattern for flexibility
- ✅ React components and hooks
- ✅ Full TypeScript support
- ✅ Comprehensive testing utilities
- ✅ Production-ready implementation

For more detailed documentation, see:
- [AuthContext README](src/core/contexts/README.md)
- [useValuAuth README](src/core/hooks/README.md)
- [AuthGuard README](src/react/components/README.md)
- [BearerTokenDialog README](src/react/components/BearerTokenDialog.README.md)
