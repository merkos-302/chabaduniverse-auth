# MerkosAPIAdapter Usage Examples

This document provides comprehensive usage examples for the `MerkosAPIAdapter`, the built-in adapter for integrating with the Merkos Platform API v2.

## Overview

The `MerkosAPIAdapter` is a type-safe adapter that implements the `AuthAPIAdapter` interface for authenticating with the Merkos Platform API. It provides:

- **Four authentication methods**: Bearer Token, Credentials, Google OAuth, Chabad.org SSO
- **Unified API v2 endpoint**: All requests use POST to `/api/v2` with service-based routing
- **Custom header authentication**: Uses `identifier` header (not `Authorization`)
- **Comprehensive error handling**: Maps Merkos errors to typed `AuthErrorCode` values
- **Automatic token management**: Stores tokens after successful authentication
- **Timeout handling**: AbortController-based request timeouts

## Installation & Setup

### Basic Setup

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  timeout: 30000, // Optional: 30 seconds (default)
});
```

### Configuration Options

```typescript
interface MerkosAPIAdapterConfig {
  baseUrl: string;       // Required: Merkos Platform API base URL
  apiVersion?: 'v2';     // Optional: API version (default: 'v2')
  timeout?: number;      // Optional: Request timeout in ms (default: 30000)
}
```

**Important:** The correct base URL is `https://org.merkos302.com` (NOT `shop.merkos302.com`).

---

## Authentication Examples

### Login with Bearer Token

Authenticate using an existing JWT bearer token. This is useful when you have a token from another source (e.g., CDSSO, stored session).

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
import { AuthError, AuthErrorCode } from '@chabaduniverse/auth';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

async function authenticateWithToken(token: string) {
  try {
    const response = await adapter.loginWithBearerToken(token);

    console.log('Authenticated successfully');
    console.log('User:', response.user.name);
    console.log('Email:', response.user.email);
    console.log('Token expires in:', response.expiresIn, 'seconds');

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.code) {
        case AuthErrorCode.TOKEN_EXPIRED:
          console.error('Token has expired, please login again');
          break;
        case AuthErrorCode.TOKEN_INVALID:
          console.error('Token is invalid');
          break;
        case AuthErrorCode.NETWORK_ERROR:
          console.error('Network error:', error.message);
          break;
        default:
          console.error('Authentication failed:', error.message);
      }
    }
    throw error;
  }
}
```

#### With Site ID (Multi-tenant)

```typescript
// For multi-tenant applications, pass the site ID
const response = await adapter.loginWithBearerToken(token, 'site123');
```

---

### Login with Credentials

Traditional username/password authentication.

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
import { AuthError, AuthErrorCode } from '@chabaduniverse/auth';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

async function loginWithCredentials(email: string, password: string) {
  try {
    const response = await adapter.loginWithCredentials(email, password);

    console.log('Login successful');
    console.log('Welcome,', response.user.name);

    // Token is automatically stored in the adapter for subsequent requests
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === AuthErrorCode.INVALID_CREDENTIALS) {
        console.error('Invalid username or password');
      } else if (error.code === AuthErrorCode.USER_NOT_FOUND) {
        console.error('User account not found');
      } else {
        console.error('Login failed:', error.message);
      }
    }
    throw error;
  }
}

// Usage
await loginWithCredentials('user@example.com', 'mySecurePassword123');
```

---

### Login with Google OAuth

Complete the OAuth flow by exchanging a Google authorization code for a Merkos JWT.

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
import { AuthError } from '@chabaduniverse/auth';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

// After user is redirected back from Google OAuth
async function handleGoogleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (!code) {
    console.error('No authorization code in URL');
    return;
  }

  try {
    const response = await adapter.loginWithGoogle(
      code,
      'myapp.example.com',  // OAuth redirect host
      'site123'              // Optional site ID
    );

    console.log('Google authentication successful');
    console.log('User:', response.user.email);

    // Clear the URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('Google OAuth failed:', error.message);
    }
    throw error;
  }
}
```

---

### Login with Chabad.org SSO

Authenticate users coming from the Chabad.org ecosystem.

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
import { AuthError, AuthErrorCode } from '@chabaduniverse/auth';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

async function authenticateFromChabadOrg(ssoKey: string) {
  try {
    const response = await adapter.loginWithChabadOrg(ssoKey);

    console.log('Chabad.org SSO successful');
    console.log('User:', response.user.name);
    console.log('Permissions:', response.user.permissions);

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === AuthErrorCode.TOKEN_INVALID) {
        console.error('Invalid or expired Chabad.org SSO key');
      } else {
        console.error('Chabad.org SSO failed:', error.message);
      }
    }
    throw error;
  }
}
```

---

## Token Management

### Setting and Clearing Tokens

Tokens are automatically managed after successful authentication, but you can also manage them manually.

```typescript
const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

// Manually set a token (e.g., from storage)
adapter.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Make authenticated requests...
const user = await adapter.getCurrentUser();

// Clear the token (logout at adapter level)
adapter.clearToken();
```

### Getting Current User

Retrieve the authenticated user's profile after login.

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
import { AuthError, AuthErrorCode } from '@chabaduniverse/auth';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

async function getUserProfile() {
  // First, ensure user is authenticated
  await adapter.loginWithCredentials('user@example.com', 'password');

  try {
    const user = await adapter.getCurrentUser();

    console.log('User ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Permissions:', user.permissions);

    return user;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === AuthErrorCode.UNAUTHORIZED) {
        console.error('Not authenticated - please login first');
      } else if (error.code === AuthErrorCode.TOKEN_EXPIRED) {
        console.error('Session expired - please login again');
      }
    }
    throw error;
  }
}
```

### Logout

End the user session on both server and client.

```typescript
const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

// After authentication...
await adapter.loginWithCredentials('user@example.com', 'password');

// Logout when done
await adapter.logout();

// Token is now cleared
// Subsequent requests will be unauthenticated
```

The `logout()` method:
1. Calls the server-side logout endpoint to invalidate the session
2. Clears the local token regardless of server response
3. Ensures cleanup even if server is unreachable

---

## Using with AuthManager

For full authentication state management, use `MerkosAPIAdapter` with `AuthManager`.

```typescript
import { AuthManager, TokenStorage } from '@chabaduniverse/auth';
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

// Create the adapter
const merkosAdapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  timeout: 30000,
});

// Create token storage (optional - for persistence)
const tokenStorage: TokenStorage = {
  async getToken() {
    return localStorage.getItem('merkos_token');
  },
  async setToken(token: string) {
    localStorage.setItem('merkos_token', token);
  },
  async removeToken() {
    localStorage.removeItem('merkos_token');
  },
};

// Create the AuthManager
const authManager = new AuthManager({
  adapter: merkosAdapter,
  tokenStorage,
  autoRefresh: true,
  refreshThreshold: 300, // Refresh 5 minutes before expiry
  onAuthStateChange: (state) => {
    console.log('Auth state changed:', state.isAuthenticated);
  },
  onError: (error) => {
    console.error('Auth error:', error.message);
  },
});

// Use the AuthManager
async function login(email: string, password: string) {
  const response = await authManager.loginWithCredentials(email, password);
  console.log('Logged in as:', response.user.name);
}

async function checkAuth() {
  if (authManager.isAuthenticated) {
    const user = await authManager.getCurrentUser();
    console.log('Current user:', user.name);
  }
}
```

---

## Using with React

For React applications, use `MerkosAPIAdapter` with `AuthProvider`.

```typescript
import { AuthProvider, useAuth } from '@chabaduniverse/auth/react';
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

// Create the adapter
const merkosAdapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

// Configure the provider
const authConfig = {
  apiAdapter: merkosAdapter,
  userServiceAdapter: yourUserService,
};

// App component
function App() {
  return (
    <AuthProvider config={authConfig}>
      <Dashboard />
    </AuthProvider>
  );
}

// Dashboard component using auth
function Dashboard() {
  const {
    isAuthenticated,
    isLoading,
    user,
    error,
    loginWithCredentials,
    logout
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isAuthenticated) {
    return (
      <LoginForm
        onSubmit={({ email, password }) =>
          loginWithCredentials(email, password)
        }
      />
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Error Handling

### AuthError Class

All authentication errors are instances of `AuthError` with typed error codes.

```typescript
import { AuthError, AuthErrorCode } from '@chabaduniverse/auth';

class AuthError extends Error {
  code: AuthErrorCode;        // Typed error code
  originalError?: unknown;    // Original error (if any)
}
```

### AuthErrorCode Enum

```typescript
enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',  // Wrong username/password
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',              // JWT has expired
  TOKEN_INVALID = 'TOKEN_INVALID',              // JWT is malformed/invalid
  NETWORK_ERROR = 'NETWORK_ERROR',              // Network/timeout error
  UNAUTHORIZED = 'UNAUTHORIZED',                // Not authenticated
  FORBIDDEN = 'FORBIDDEN',                      // Access denied
  USER_NOT_FOUND = 'USER_NOT_FOUND',           // User doesn't exist
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',             // Unexpected error
}
```

### Comprehensive Error Handling Pattern

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
import { AuthError, AuthErrorCode } from '@chabaduniverse/auth';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

async function authenticate(email: string, password: string) {
  try {
    const response = await adapter.loginWithCredentials(email, password);
    return { success: true, user: response.user };
  } catch (error) {
    if (!(error instanceof AuthError)) {
      // Unexpected non-auth error
      console.error('Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }

    // Handle specific error codes
    switch (error.code) {
      case AuthErrorCode.INVALID_CREDENTIALS:
        return {
          success: false,
          error: 'Invalid email or password'
        };

      case AuthErrorCode.USER_NOT_FOUND:
        return {
          success: false,
          error: 'No account found with this email'
        };

      case AuthErrorCode.NETWORK_ERROR:
        return {
          success: false,
          error: 'Network error - please check your connection'
        };

      case AuthErrorCode.UNAUTHORIZED:
        return {
          success: false,
          error: 'Please log in to continue'
        };

      case AuthErrorCode.TOKEN_EXPIRED:
        return {
          success: false,
          error: 'Your session has expired - please log in again'
        };

      case AuthErrorCode.FORBIDDEN:
        return {
          success: false,
          error: 'You do not have permission to access this resource'
        };

      default:
        return {
          success: false,
          error: error.message || 'Authentication failed'
        };
    }
  }
}
```

---

## Making Direct API Requests

For advanced use cases, you can make direct v2 API requests.

```typescript
const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
});

// First, authenticate
await adapter.loginWithCredentials('user@example.com', 'password');

// Make authenticated API requests
interface Organization {
  id: string;
  name: string;
  type: string;
}

interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
}

const response = await adapter.v2Request<OrganizationsResponse>(
  'orgs',                    // Service name
  'orgs:admin:list',         // Path
  { limit: 10, offset: 0 }   // Parameters
);

console.log('Organizations:', response.organizations);
console.log('Total:', response.total);
```

### Available Services

| Service | Description | Example Paths |
|---------|-------------|---------------|
| `auth` | Authentication operations | `auth:username:login`, `auth:google:login`, `auth:logout` |
| `orgs` | Organization management | `orgs:admin:list`, `orgs:admin:get` |
| `orgcampaigns` | Campaign management | `orgcampaigns:list`, `orgcampaigns:create` |
| `orgforms` | Form management | `orgforms:list`, `orgforms:submissions:list` |

See [MERKOS_API_ENDPOINTS.md](./MERKOS_API_ENDPOINTS.md) for a complete list of available endpoints.

---

## Best Practices

### Security Considerations

1. **Never log tokens**: Avoid logging JWT tokens to prevent credential exposure.

   ```typescript
   // BAD - exposes token in logs
   console.log('Token:', token);

   // GOOD - log only non-sensitive data
   console.log('User authenticated:', user.email);
   ```

2. **Use HTTPS**: Always use `https://org.merkos302.com` as the base URL.

3. **Handle token expiration**: Implement proper token refresh or re-authentication flows.

4. **Clear tokens on logout**: Always call `logout()` to clear both server and client state.

### Configuration Best Practices

```typescript
// Use environment variables for configuration
const adapter = new MerkosAPIAdapter({
  baseUrl: process.env.MERKOS_API_URL || 'https://org.merkos302.com',
  timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
});
```

### Understanding the `identifier` Header

The Merkos Platform API v2 uses the `identifier` header for authentication, NOT the standard `Authorization` header. This is handled automatically by the adapter.

```http
POST /api/v2
Content-Type: application/json
identifier: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Type Definitions

### AuthResponse

```typescript
interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;  // Seconds until token expires
}
```

### User

```typescript
interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}
```

### MerkosAPIAdapterConfig

```typescript
interface MerkosAPIAdapterConfig {
  baseUrl: string;
  apiVersion?: 'v2' | 'v4';
  timeout?: number;
}
```

---

## Related Documentation

- [Integration Guide](../INTEGRATION_GUIDE.md) - Complete integration walkthrough
- [CDSSO Setup Guide](./CDSSO_SETUP_GUIDE.md) - Cross-Domain SSO configuration
- [Merkos API Endpoints](./MERKOS_API_ENDPOINTS.md) - Full API endpoint reference
- [Merkos Platform API Documentation](./MERKOS_PLATFORM_API_DOCUMENTATION.md) - Detailed API documentation

---

**Last Updated:** 2026-01-09
