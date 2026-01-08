# Authentication Adapters

This directory contains adapter implementations for different backend authentication systems. Adapters provide a consistent interface for authentication operations while allowing flexibility in the underlying API implementation.

## Adapter Pattern

The @chabaduniverse/auth library uses the Adapter Pattern to decouple authentication logic from specific API implementations. This enables:

- **Flexibility**: Switch between different authentication backends without changing application code
- **Testability**: Mock adapters easily for unit testing
- **Extensibility**: Add new authentication backends by implementing the adapter interface
- **Maintainability**: Isolate API-specific code in adapters

## Available Adapters

### MerkosAPIAdapter

**Status**: Phase 5A ✅ Completed | Phase 5B ✅ Completed

The `MerkosAPIAdapter` implements authentication for the Merkos Platform API v2. It provides a complete foundation for all Merkos-based authentication operations.

#### Configuration

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2',
  timeout: 30000, // optional, defaults to 30000ms
});
```

#### Core Methods (Phase 5A)

**1. Token Management**

```typescript
// Store JWT token for authenticated requests
adapter.setToken('your-jwt-token');

// Clear token on logout
adapter.clearToken();
```

**2. v2 API Requests**

```typescript
// Make type-safe requests to Merkos Platform API v2
const response = await adapter.v2Request<ResponseType>(
  'service',      // Service name: 'auth', 'orgs', 'orgcampaigns', etc.
  'path',         // Service path: 'auth:username:login', 'auth:user:info', etc.
  { /* params */ } // Request parameters
);
```

#### Authentication Methods (Phase 5B)

**1. Bearer Token Authentication**

```typescript
const response = await adapter.loginWithBearerToken('your-jwt-token', 'optional-site-id');
console.log('User:', response.user);
console.log('Token:', response.token);
```

**2. Credentials Authentication**

```typescript
const response = await adapter.loginWithCredentials(
  'user@example.com',
  'password123',
  'optional-site-id'
);
console.log('User:', response.user);
console.log('Token:', response.token);
```

**3. Google OAuth Authentication**

```typescript
const response = await adapter.loginWithGoogle(
  'google-auth-code',
  'https://yourdomain.com',  // optional redirect host
  'optional-site-id'
);
console.log('User:', response.user);
console.log('Token:', response.token);
```

**4. Chabad.org SSO Authentication**

```typescript
const response = await adapter.loginWithChabadOrg(
  'chabad-org-sso-key',
  'optional-site-id'
);
console.log('User:', response.user);
console.log('Token:', response.token);
```

#### Features

- **Unified Endpoint**: All requests go to `POST /api/v2`
- **Custom Header**: Uses `identifier` header (not standard `Authorization`)
- **Error Handling**: Intelligent error code mapping (Merkos errors → AuthErrorCode)
- **Timeout Management**: AbortController-based request timeouts
- **Type Safety**: Generic type parameters for type-safe responses

#### v2 API Structure

The Merkos Platform API v2 uses a unified endpoint structure:

- **Endpoint**: `POST /api/v2`
- **Headers**:
  - `Content-Type: application/json` (always)
  - `identifier: <jwt-token>` (when authenticated)
- **Request Body**:
  ```json
  {
    "service": "service-name",
    "path": "service:resource:action",
    "params": { /* parameters */ }
  }
  ```

**Service Names:**
- `auth` - Authentication and user management
- `orgs` - Organization management
- `orgcampaigns` - Campaign management
- `orgforms` - Form builder and submissions

**Path Format:**
Colon-separated: `service:resource:action`

Examples:
- `auth:username:login` - Login with username/password
- `auth:user:info` - Get current user information
- `orgs:admin:list` - List organizations
- `orgcampaigns:members:add` - Add campaign member

#### Error Handling

The adapter provides comprehensive error detection and mapping:

```typescript
import { AuthError, AuthErrorCode } from '@chabaduniverse/auth';

try {
  const response = await adapter.v2Request('auth', 'auth:user:info', {});
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Auth error:', error.code, error.message);
    // error.code is one of AuthErrorCode enum values
    // error.originalError contains the original error for debugging
  }
}
```

**Error Types:**
- `INVALID_TOKEN` - Token is invalid or expired
- `UNAUTHORIZED` - Not authenticated or missing token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found (404)
- `NETWORK_ERROR` - Network connectivity issues
- `TIMEOUT` - Request exceeded timeout limit
- `UNKNOWN_ERROR` - Other API errors

#### Usage Examples

**Example 1: Login and Store Token**

```typescript
interface AuthResponse {
  user: {
    uuid: string;
    email: string;
    name: string;
  };
  token: string;
  refreshToken?: string;
}

const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2',
});

// Login (unauthenticated request)
const response = await adapter.v2Request<AuthResponse>(
  'auth',
  'auth:username:login',
  {
    username: 'user@example.com',
    password: 'password123'
  }
);

// Store token for future authenticated requests
adapter.setToken(response.token);
```

**Example 2: Make Authenticated Request**

```typescript
interface UserInfo {
  uuid: string;
  email: string;
  name: string;
  roles: string[];
}

// Token must be set first via setToken()
const user = await adapter.v2Request<UserInfo>(
  'auth',
  'auth:user:info',
  {}
);

console.log('Current user:', user);
```

**Example 3: Handle Errors**

```typescript
try {
  const user = await adapter.v2Request<UserInfo>(
    'auth',
    'auth:user:info',
    {}
  );
} catch (error) {
  if (error instanceof AuthError) {
    switch (error.code) {
      case AuthErrorCode.INVALID_TOKEN:
        // Redirect to login
        break;
      case AuthErrorCode.TIMEOUT:
        // Retry or show timeout message
        break;
      case AuthErrorCode.NETWORK_ERROR:
        // Show offline message
        break;
      default:
        // Show generic error
        console.error(error.message);
    }
  }
}
```

**Example 4: Logout**

```typescript
// Clear stored token
adapter.clearToken();

// Optional: Call logout endpoint
await adapter.v2Request('auth', 'auth:logout', {});
```

#### Testing

Mock the adapter in tests using Jest:

```typescript
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

beforeEach(() => {
  (global.fetch as jest.Mock) = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

it('should make v2 request', async () => {
  const mockResponse = { user: { uuid: '123', name: 'Test' } };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  const adapter = new MerkosAPIAdapter({
    baseUrl: 'https://org.merkos302.com',
    apiVersion: 'v2',
  });

  const result = await adapter.v2Request('auth', 'auth:user:info', {});

  expect(result).toEqual(mockResponse);
});
```

#### Implementation Status

**Phase 5A (✅ Completed - Issue #10):**
- ✅ `setToken(token: string): void` - Token storage
- ✅ `clearToken(): void` - Token cleanup
- ✅ `v2Request<T>(service, path, params): Promise<T>` - Core API request method
- ✅ Comprehensive error handling
- ✅ 20 unit tests
- ✅ Full JSDoc documentation

**Phase 5B (✅ Completed):**
- ✅ `loginWithBearerToken(token, siteId?): Promise<AuthResponse>` - Bearer token authentication
- ✅ `loginWithCredentials(username, password, siteId?): Promise<AuthResponse>` - Username/password login
- ✅ `loginWithGoogle(code, host?, siteId?): Promise<AuthResponse>` - Google OAuth login
- ✅ `loginWithChabadOrg(key, siteId?): Promise<AuthResponse>` - Chabad.org SSO login
- ✅ 26 comprehensive unit tests
- ✅ Secure logger utility (prevents token exposure)
- ✅ Fixed HIGH PRIORITY security issue

**Future Phases:**
- Phase 5C: User management (getCurrentUser, refreshToken, verifyToken)
- Phase 5D: Additional Merkos API v2 endpoints
- Phase 5E: Integration with Universe Portal Auth API

## Creating Custom Adapters

To create a custom adapter, implement the `AuthAPIAdapter` interface:

```typescript
import { AuthAPIAdapter, AuthResponse, User } from '@chabaduniverse/auth';

export class CustomAPIAdapter implements AuthAPIAdapter {
  setToken(token: string): void {
    // Store token for authenticated requests
  }

  clearToken(): void {
    // Clear stored token
  }

  async loginWithBearerToken(token: string, siteId?: string): Promise<AuthResponse> {
    // Implement bearer token authentication
  }

  async loginWithCredentials(
    username: string,
    password: string,
    siteId?: string
  ): Promise<AuthResponse> {
    // Implement username/password authentication
  }

  async loginWithGoogle(
    code: string,
    host?: string,
    siteId?: string
  ): Promise<AuthResponse> {
    // Implement Google OAuth authentication
  }

  async loginWithChabadOrg(key: string, siteId?: string): Promise<AuthResponse> {
    // Implement Chabad.org SSO authentication
  }

  async loginWithCDSSO(): Promise<AuthResponse> {
    // Implement Cross-Domain SSO authentication
  }

  async getCurrentUser(): Promise<User> {
    // Get current authenticated user
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Refresh authentication token
  }

  async logout(): Promise<void> {
    // Logout current user
  }

  async verifyToken(token: string): Promise<boolean> {
    // Verify token validity
  }

  async v2Request<T>(
    service: string,
    path: string,
    params: Record<string, unknown>
  ): Promise<T> {
    // Make generic API request
    // This method is optional for custom adapters
    throw new Error('Not implemented');
  }
}
```

### Adapter Best Practices

1. **Error Handling**: Always throw `AuthError` with appropriate `AuthErrorCode`
2. **Type Safety**: Use TypeScript generics for type-safe responses
3. **Token Security**: Never log or expose tokens in error messages
4. **Timeout Handling**: Implement request timeouts to prevent hanging requests
5. **Retries**: Consider implementing retry logic for transient failures
6. **Logging**: Log errors without exposing sensitive information

## File Structure

```
src/adapters/
├── README.md                 # This file
├── index.ts                  # Adapter exports
├── MerkosAPIAdapter.ts       # Merkos Platform API v2 adapter
└── BaseAdapter.ts            # Base adapter interface (if needed)
```

## Related Documentation

- [Integration Guide](../../INTEGRATION_GUIDE.md) - Complete integration examples
- [Merkos Platform API Documentation](../../docs/MERKOS_PLATFORM_API_DOCUMENTATION.md) - API reference
- [Testing Guide](../../TESTING_GUIDE.md) - Testing patterns and examples

---

**Last Updated:** January 8, 2026 (Phase 5A Completion)
