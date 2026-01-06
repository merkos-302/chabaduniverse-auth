# Merkos OIDC React Authentication System

**Complete guide to using Merkos OIDC authentication in React components**

## Overview

The Merkos OIDC React authentication system provides a clean, type-safe interface for accessing OpenID Connect authentication state in React components. It uses HTTP-only cookies for secure token storage and provides automatic token validation, expiration tracking, and logout functionality.

### Key Features

- **HTTP-only Cookie Storage** - Tokens never exposed to JavaScript
- **Automatic Validation** - Server-side token validation on every check
- **Type-Safe API** - Full TypeScript support with comprehensive interfaces
- **Loading States** - Built-in loading and error state management
- **Token Expiration** - Automatic expiration tracking with polling
- **Refresh Capability** - Manual authentication refresh
- **CORS Support** - Cross-origin requests handled properly
- **Caching** - Request caching to avoid unnecessary API calls

---

## Architecture

### Components

1. **`useMerkosOidcAuth` Hook** (`hooks/useMerkosOidcAuth.ts`)
   - React hook providing authentication state
   - Manages loading, error, and authenticated states
   - Polls for token expiration
   - Provides logout and refresh functions

2. **`/api/merkos-oidc-proxy/auth/me` Endpoint** (`pages/api/merkos-oidc-proxy/auth/me.ts`)
   - Validates ID token from HTTP-only cookie
   - Returns user information and token expiration
   - Handles CORS for cross-origin requests

3. **Cookie Utilities** (`lib/merkos-oidc-utils.ts`)
   - Server-side cookie management
   - JWT validation and decoding
   - Expiration checking

---

## Installation & Setup

### Prerequisites

The authentication system requires:

1. **Merkos OIDC utilities** - Already installed
2. **Merkos OIDC proxy endpoints** - Login/logout endpoints configured
3. **HTTP-only cookies** - Cookie domain configured for your environment

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://your-app.chabaduniverse.com
```

---

## Basic Usage

### 1. Import the Hook

```typescript
import { useMerkosOidcAuth } from '@/hooks/useMerkosOidcAuth';
```

### 2. Use in Component

```typescript
function MyComponent() {
  const { user, isAuthenticated, isLoading, logout, error } = useMerkosOidcAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## API Reference

### Hook Interface

```typescript
interface UseMerkosOidcAuthReturn {
  /** Decoded user information from ID token */
  user: JwtPayload | null;

  /** Whether user is currently authenticated */
  isAuthenticated: boolean;

  /** Whether authentication check is in progress */
  isLoading: boolean;

  /** Raw ID token (always null - HTTP-only cookie) */
  idToken: null;

  /** Token expiration date */
  expiresAt: Date | null;

  /** Logout function */
  logout: () => Promise<void>;

  /** Error message if authentication failed */
  error: string | null;

  /** Manually refresh authentication state */
  refreshAuth: () => Promise<void>;
}
```

### User Object (JwtPayload)

```typescript
interface JwtPayload {
  /** Subject - unique user identifier */
  sub: string;

  /** Issuer - OIDC provider URL */
  iss: string;

  /** Audience - client ID */
  aud: string | string[];

  /** Expiration time - Unix timestamp */
  exp: number;

  /** Issued at time - Unix timestamp */
  iat: number;

  /** User's email address */
  email?: string;

  /** Whether email has been verified */
  email_verified?: boolean;

  /** User's full name */
  name?: string;

  /** User's given name */
  given_name?: string;

  /** User's family name */
  family_name?: string;

  /** User's profile picture URL */
  picture?: string;

  /** Additional custom claims */
  [key: string]: any;
}
```

---

## Advanced Usage

### Protected Route Component

```typescript
import { useMerkosOidcAuth } from '@/hooks/useMerkosOidcAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useMerkosOidcAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login
      router.push('/api/merkos-oidc-proxy/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div>Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
```

### User Profile Component

```typescript
import { useMerkosOidcAuth } from '@/hooks/useMerkosOidcAuth';

function UserProfile() {
  const { user, expiresAt, refreshAuth, logout } = useMerkosOidcAuth();

  if (!user) return null;

  const timeRemaining = expiresAt
    ? Math.floor((expiresAt.getTime() - Date.now()) / 60000)
    : 0;

  return (
    <div className="user-profile">
      <img src={user.picture} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>

      {expiresAt && (
        <div className="token-info">
          <p>Session expires in {timeRemaining} minutes</p>
          {timeRemaining < 5 && (
            <button onClick={refreshAuth}>Refresh Session</button>
          )}
        </div>
      )}

      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Authentication Context Provider

```typescript
import { createContext, useContext, ReactNode } from 'react';
import { useMerkosOidcAuth, UseMerkosOidcAuthReturn } from '@/hooks/useMerkosOidcAuth';

const AuthContext = createContext<UseMerkosOidcAuthReturn | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useMerkosOidcAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Usage in _app.tsx
function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

### Conditional Rendering Based on Roles

```typescript
import { useMerkosOidcAuth } from '@/hooks/useMerkosOidcAuth';

function AdminPanel() {
  const { user, isAuthenticated } = useMerkosOidcAuth();

  // Check custom claims for roles
  const isAdmin = user?.roles?.includes('admin') || false;

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  if (!isAdmin) {
    return <div>Access denied - Admin only</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {/* Admin content */}
    </div>
  );
}
```

---

## Performance Optimizations

### Request Caching

The hook automatically caches authentication checks for 30 seconds to avoid excessive API calls:

```typescript
// Automatic caching - no configuration needed
const { user } = useMerkosOidcAuth();
```

### Request Throttling

Minimum 1-second interval between authentication checks prevents rapid API calls:

```typescript
// Automatic throttling - no configuration needed
```

### Expiration Polling

Token expiration is checked every 60 seconds (configurable):

```typescript
// In useMerkosOidcAuth.ts
const EXPIRATION_CHECK_INTERVAL = 60000; // 1 minute
```

---

## Error Handling

### Network Errors

```typescript
function MyComponent() {
  const { error, refreshAuth } = useMerkosOidcAuth();

  if (error) {
    return (
      <div>
        <p>Authentication failed: {error}</p>
        <button onClick={refreshAuth}>Retry</button>
      </div>
    );
  }

  // ...
}
```

### Token Expiration

```typescript
function MyComponent() {
  const { expiresAt, refreshAuth } = useMerkosOidcAuth();

  useEffect(() => {
    if (!expiresAt) return;

    const now = new Date();
    const timeUntilExpiration = expiresAt.getTime() - now.getTime();

    // Show warning 5 minutes before expiration
    if (timeUntilExpiration < 5 * 60 * 1000) {
      alert('Your session will expire soon. Please refresh.');
    }
  }, [expiresAt, refreshAuth]);

  // ...
}
```

### Logout Errors

```typescript
async function handleLogout() {
  try {
    await logout();
    router.push('/');
  } catch (error) {
    console.error('Logout failed:', error);
    // State is still cleared for security
    router.push('/');
  }
}
```

---

## Testing

### Mock Hook for Tests

```typescript
// __mocks__/useMerkosOidcAuth.ts
export const useMerkosOidcAuth = jest.fn(() => ({
  user: {
    sub: 'test-user',
    email: 'test@example.com',
    name: 'Test User'
  },
  isAuthenticated: true,
  isLoading: false,
  idToken: null,
  expiresAt: new Date(Date.now() + 3600000),
  logout: jest.fn(),
  error: null,
  refreshAuth: jest.fn()
}));
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { useMerkosOidcAuth } from '@/hooks/useMerkosOidcAuth';
import MyComponent from './MyComponent';

jest.mock('@/hooks/useMerkosOidcAuth');

describe('MyComponent', () => {
  it('should show user name when authenticated', () => {
    (useMerkosOidcAuth as jest.Mock).mockReturnValue({
      user: { name: 'John Doe' },
      isAuthenticated: true,
      isLoading: false
    });

    render(<MyComponent />);
    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
  });
});
```

---

## Security Considerations

### HTTP-Only Cookies

Tokens are stored in HTTP-only cookies and **never exposed to JavaScript**:

```typescript
// idToken is always null in the hook
const { idToken } = useMerkosOidcAuth();
console.log(idToken); // Always null
```

### Token Validation

Every authentication check validates the token server-side:

1. Check cookie exists
2. Decode JWT structure
3. Validate signature (provider's responsibility)
4. Check expiration
5. Verify required claims

### CORS Configuration

The `/auth/me` endpoint includes proper CORS headers:

```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Credentials': 'true'
};
```

### Secure Logout

Logout always clears local state, even on error:

```typescript
// From useMerkosOidcAuth.ts
try {
  await fetch('/api/merkos-oidc-proxy/logout', { ... });
} catch (error) {
  // Even on error, clear state for security
  setIsAuthenticated(false);
  setUser(null);
}
```

---

## Troubleshooting

### "No authentication token found"

**Problem:** Not authenticated or cookie expired

**Solutions:**
- Redirect to login: `/api/merkos-oidc-proxy/login`
- Check cookie domain configuration
- Verify cookie expiration time (4 hours default)

### "Token expired"

**Problem:** Token expiration time exceeded

**Solutions:**
- Call `refreshAuth()` to get new token
- Redirect to login page
- Implement auto-refresh before expiration

### "Failed to check authentication status"

**Problem:** Network error or server issue

**Solutions:**
- Check network connection
- Verify `/api/merkos-oidc-proxy/auth/me` endpoint is accessible
- Check server logs for errors

### Loading State Never Changes

**Problem:** Authentication check hangs

**Solutions:**
- Check browser console for errors
- Verify API endpoint is running
- Check CORS configuration
- Verify fetch credentials include cookies

---

## Migration Guide

### From SimpleAuthContext to useMerkosOidcAuth

```typescript
// Before (SimpleAuthContext)
const { user, isAuthenticated } = useSimpleAuth();

// After (useMerkosOidcAuth)
const { user, isAuthenticated } = useMerkosOidcAuth();
```

### From useValuAuth to useMerkosOidcAuth

```typescript
// Before (Valu)
const { user, isAuthenticated, logout } = useValuAuth();

// After (Merkos OIDC)
const { user, isAuthenticated, logout } = useMerkosOidcAuth();

// Note: user structure may be different
// Valu: user.valuUserId
// OIDC: user.sub
```

---

## Example Component

See the complete example component at:

```
components/merkos/MerkosOidcAuthExample.tsx
```

This component demonstrates:
- Loading states
- Error handling
- User display
- Token information
- Logout functionality
- Responsive design

---

## API Endpoint Details

### GET /api/merkos-oidc-proxy/auth/me

**Request:**
- Method: GET
- Headers: Cookie (automatic)
- Credentials: include

**Response (200 OK):**
```json
{
  "authenticated": true,
  "user": {
    "sub": "user-123",
    "email": "user@example.com",
    "name": "User Name",
    ...
  },
  "expiresAt": "2025-12-18T12:00:00.000Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "authenticated": false,
  "error": "No authentication token found"
}
```

---

## Further Reading

- **Merkos OIDC Utils Documentation:** `lib/merkos-oidc-utils.ts`
- **Cookie Management Guide:** `docs/MERKOS_OIDC_COOKIE_MANAGEMENT.md`
- **Authentication Flow:** `docs/MERKOS_OIDC_AUTHENTICATION_FLOW.md`
- **OpenID Connect Specification:** https://openid.net/specs/openid-connect-core-1_0.html

---

**Last Updated:** December 18, 2025
**Version:** 1.0.0
**Maintainer:** Chabad Universe Portal Team
