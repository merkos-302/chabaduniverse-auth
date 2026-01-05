# Authentication Hooks

## useValuAuth Hook

Framework-agnostic React hook for Valu Social authentication integration.

### Overview

The `useValuAuth` hook provides comprehensive Valu API authentication with:

- Automatic user authentication when Valu API connects
- User data mapping from Valu format to portal format
- Integration with AuthContext for unified auth state
- Cookie-based authentication caching (4-hour expiration)
- User icon retrieval with caching and debouncing
- Role mapping from Valu roles to portal roles
- Error handling with graceful degradation

### Installation

```typescript
import { useValuAuth, ValuAPIProvider } from '@/core/hooks/useValuAuth';
import { AuthProvider } from '@/core/contexts/AuthContext';
```

### Setup

#### 1. Create Valu API Adapter

First, create an adapter that implements the `ValuAPIAdapter` interface for your framework:

```typescript
import type { ValuAPIAdapter, ValuAPIConnectionState } from '@/core/hooks/useValuAuth';

// Example: Next.js adapter using useValuApi hook
class NextJsValuAPIAdapter implements ValuAPIAdapter {
  constructor(private valuApi: any) {}

  getConnectionState(): ValuAPIConnectionState {
    return {
      isConnected: this.valuApi.isConnected,
      isReady: this.valuApi.isReady,
      isInIframe: this.valuApi.isInIframe,
      isNavigatingApp: this.valuApi.isNavigatingApp
    };
  }

  async getApi(apiName: string): Promise<any> {
    return await this.valuApi.getApi(apiName);
  }

  async runConsoleCommand(command: string): Promise<any> {
    return await this.valuApi.runConsoleCommand(command);
  }
}
```

#### 2. Wrap Your App

Wrap your application with the required providers:

```typescript
import { AuthProvider } from '@/core/contexts/AuthContext';
import { ValuAPIProvider } from '@/core/hooks/useValuAuth';

function App({ children }) {
  // Your Valu API instance (framework-specific)
  const valuApi = useValuApi(); // or however you get your Valu API instance

  // Create adapter
  const valuAdapter = useMemo(() => new NextJsValuAPIAdapter(valuApi), [valuApi]);

  // Your API adapter and user service (for AuthContext)
  const authConfig = {
    apiAdapter: yourAPIAdapter,
    userServiceAdapter: yourUserService,
    cdssoUtils: yourCDSSOUtils // optional
  };

  return (
    <AuthProvider config={authConfig}>
      <ValuAPIProvider adapter={valuAdapter}>
        {children}
      </ValuAPIProvider>
    </AuthProvider>
  );
}
```

### Usage

#### Basic Usage

```typescript
import { useValuAuth } from '@/core/hooks/useValuAuth';

function MyComponent() {
  const {
    isLoading,
    isAuthenticated,
    user,
    error,
    isValuConnected,
    authMethod,
    login,
    logout,
    refreshUser,
    clearError,
    getUserIcon
  } = useValuAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <button onClick={login}>Login with Valu</button>;
  }

  return (
    <div>
      <h1>Welcome, {user?.displayName}!</h1>
      <p>Email: {user?.email}</p>
      <p>Roles: {user?.roles.join(', ')}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### User Icon Retrieval

```typescript
import { useValuAuth } from '@/core/hooks/useValuAuth';

function UserAvatar({ userId, size = 64 }) {
  const { getUserIcon } = useValuAuth();
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    getUserIcon(userId, size).then(setIconUrl);
  }, [userId, size, getUserIcon]);

  if (!iconUrl) {
    return <div className="avatar-placeholder" />;
  }

  return <img src={iconUrl} alt="User avatar" width={size} height={size} />;
}
```

#### Manual Refresh

```typescript
import { useValuAuth } from '@/core/hooks/useValuAuth';

function RefreshButton() {
  const { refreshUser } = useValuAuth();

  const handleRefresh = async () => {
    const user = await refreshUser();
    if (user) {
      console.log('User refreshed:', user);
    } else {
      console.log('Refresh failed');
    }
  };

  return <button onClick={handleRefresh}>Refresh User Data</button>;
}
```

### API Reference

#### Hook Return Value

```typescript
interface UseValuAuthReturn {
  // State
  isLoading: boolean;              // True while authenticating
  isAuthenticated: boolean;        // True if user is authenticated
  user: PortalUser | null;         // Current user data
  error: string | null;            // Error message if authentication failed
  isValuConnected: boolean;        // True if Valu API is connected
  authMethod: 'valu' | null;       // Authentication method used

  // Actions
  login: () => Promise<PortalUser | null>;              // Authenticate with Valu API
  logout: () => Promise<void>;                          // Clear authentication
  refreshUser: () => Promise<PortalUser | null>;        // Refresh user data from API
  clearError: () => void;                               // Clear error state
  getUserIcon: (userId?: string, size?: number) => Promise<string | null>; // Get user icon URL
}
```

#### User Data Types

```typescript
// Valu user data from API
interface ValuUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
  profile?: {
    displayName?: string;
    profileImage?: string;
    bio?: string;
  };
  network?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

// Portal user data (mapped from Valu)
interface PortalUser {
  id: string;                      // Prefixed with 'valu_'
  valuUserId: string;              // Original Valu user ID
  email?: string;
  name: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  roles: string[];                 // Mapped portal roles
  permissions: string[];
  isValuAuthenticated: boolean;
  network?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
  createdAt?: string;
  lastLoginAt?: string;
}
```

### Role Mapping

Valu roles are automatically mapped to portal roles:

| Valu Role | Portal Role |
|-----------|-------------|
| admin, administrator, super_admin | admin |
| moderator, mod, community_manager | moderator |
| member, user, basic, premium, verified | user |

### Cookie Caching

The hook automatically caches user data in cookies with:

- **Duration**: 4 hours
- **Cookie name**: `valu_user_cache`
- **SameSite**: None (for iframe support)
- **Secure**: true (HTTPS required)
- **Auto-refresh**: Cache timestamp refreshed on successful API refresh

### Framework-Specific Examples

#### Next.js

```typescript
// lib/valu-api-adapter.ts
import { useValuApi } from '@/hooks/useValuApi';
import type { ValuAPIAdapter } from '@chabaduniverse/auth';

export class NextJsValuAPIAdapter implements ValuAPIAdapter {
  constructor(private valuApi: ReturnType<typeof useValuApi>) {}

  getConnectionState() {
    return {
      isConnected: this.valuApi.isConnected,
      isReady: this.valuApi.isReady,
      isInIframe: this.valuApi.isInIframe,
      isNavigatingApp: this.valuApi.isNavigatingApp
    };
  }

  async getApi(apiName: string) {
    return await this.valuApi.getApi(apiName);
  }

  async runConsoleCommand(command: string) {
    return await this.valuApi.runConsoleCommand(command);
  }
}

// pages/_app.tsx
import { AuthProvider } from '@chabaduniverse/auth';
import { ValuAPIProvider, useValuAuth } from '@chabaduniverse/auth';
import { useValuApi } from '@/hooks/useValuApi';
import { NextJsValuAPIAdapter } from '@/lib/valu-api-adapter';

function MyApp({ Component, pageProps }) {
  const valuApi = useValuApi();
  const valuAdapter = useMemo(() => new NextJsValuAPIAdapter(valuApi), [valuApi]);

  return (
    <AuthProvider config={authConfig}>
      <ValuAPIProvider adapter={valuAdapter}>
        <Component {...pageProps} />
      </ValuAPIProvider>
    </AuthProvider>
  );
}
```

#### React (Vite/CRA)

```typescript
// src/adapters/valu-api-adapter.ts
import type { ValuAPIAdapter } from '@chabaduniverse/auth';

export class ReactValuAPIAdapter implements ValuAPIAdapter {
  constructor(private valuApiInstance: any) {}

  getConnectionState() {
    return {
      isConnected: this.valuApiInstance.isConnected,
      isReady: this.valuApiInstance.isReady,
      isInIframe: this.valuApiInstance.isInIframe,
      isNavigatingApp: this.valuApiInstance.isNavigatingApp
    };
  }

  async getApi(apiName: string) {
    return await this.valuApiInstance.getApi(apiName);
  }

  async runConsoleCommand(command: string) {
    return await this.valuApiInstance.runConsoleCommand(command);
  }
}

// src/App.tsx
import { AuthProvider, ValuAPIProvider } from '@chabaduniverse/auth';
import { ReactValuAPIAdapter } from './adapters/valu-api-adapter';

function App() {
  const valuApi = useMyValuApi(); // Your Valu API hook
  const valuAdapter = useMemo(() => new ReactValuAPIAdapter(valuApi), [valuApi]);

  return (
    <AuthProvider config={authConfig}>
      <ValuAPIProvider adapter={valuAdapter}>
        <YourApp />
      </ValuAPIProvider>
    </AuthProvider>
  );
}
```

### Performance Considerations

- **Icon Caching**: User icons are cached for 5 minutes to reduce API calls
- **Debouncing**: Duplicate icon requests are automatically deduplicated
- **Retry Throttling**: Authentication retries are throttled to minimum 3 seconds
- **Memoization**: All return values are memoized to prevent unnecessary re-renders
- **SSR Safety**: All refs and caches are SSR-safe with proper checks

### Error Handling

The hook provides graceful error handling:

```typescript
const { error, clearError } = useValuAuth();

if (error) {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

### Testing

Example test with mocked adapter:

```typescript
import { renderHook } from '@testing-library/react';
import { useValuAuth, ValuAPIProvider } from '@/core/hooks/useValuAuth';

const mockAdapter = {
  getConnectionState: () => ({
    isConnected: true,
    isReady: true,
    isInIframe: true,
    isNavigatingApp: false
  }),
  getApi: jest.fn(),
  runConsoleCommand: jest.fn()
};

test('useValuAuth authenticates user', async () => {
  const wrapper = ({ children }) => (
    <ValuAPIProvider adapter={mockAdapter}>
      {children}
    </ValuAPIProvider>
  );

  const { result } = renderHook(() => useValuAuth(), { wrapper });

  // Test authentication flow
  await result.current.login();

  expect(result.current.isAuthenticated).toBe(true);
});
```

### Migration from Framework-Specific Hook

If you're migrating from a framework-specific `useValuAuth`:

1. Create an adapter for your Valu API implementation
2. Wrap your app with `ValuAPIProvider`
3. Replace `useSimpleAuth` with `useAuth`
4. Update logging from `authLogger` to `console` with `[ValuAuth]` prefix
5. All other functionality remains the same

### See Also

- [AuthContext Documentation](../contexts/README.md)
- [Cookie Utilities](../utils/cookies.ts)
- [CDSSO Utils](../utils/cdsso.ts)
