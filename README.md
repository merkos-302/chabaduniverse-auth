# @chabaduniverse/auth

> Pluggable authentication library for ChabadUniverse applications with multiple provider support

[![npm version](https://img.shields.io/npm/v/@chabaduniverse/auth.svg)](https://www.npmjs.com/package/@chabaduniverse/auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

## Features

- ✨ **Multiple Authentication Methods**: Bearer Token, Credentials, Google OAuth, Chabad.org SSO, Cross-Domain SSO
- 🔌 **Adapter Pattern**: Framework-agnostic core with pluggable adapters
- ⚛️ **React Integration**: Ready-to-use hooks and components
- 🎭 **Dual Authentication**: Simultaneous Valu Social + Merkos Platform authentication
- 🔒 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🎨 **Headless Components**: UI-library independent with render props
- 📦 **Tree-Shakeable**: Modular design for optimal bundle sizes
- 🧪 **Well Tested**: Comprehensive test suite with 80%+ coverage
- 📚 **Fully Documented**: Complete API documentation and integration guides

## Installation

```bash
npm install @chabaduniverse/auth
```

### Peer Dependencies

For React applications:

```bash
npm install react react-dom
```

## Quick Start

### 1. Set Up Authentication Provider

```typescript
import { AuthProvider } from '@chabaduniverse/auth/react';
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

// Create adapter
const merkosAdapter = new MerkosAPIAdapter({
  baseUrl: 'https://shop.merkos302.com',
  apiVersion: 'v2',
});

// Configure provider
const authConfig = {
  apiAdapter: merkosAdapter,
  userServiceAdapter: yourUserService,
};

function App() {
  return (
    <AuthProvider config={authConfig}>
      <YourApp />
    </AuthProvider>
  );
}
```

### 2. Use Authentication in Components

```typescript
import { useAuth } from '@chabaduniverse/auth/react';

function Dashboard() {
  const { isAuthenticated, user, loginWithBearerToken, logout } = useAuth();

  if (!isAuthenticated) {
    return <button onClick={() => loginWithBearerToken('token')}>Login</button>;
  }

  return (
    <div>
      <h2>Welcome, {user?.name}!</h2>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Protect Routes

```typescript
import { AuthGuard, BearerTokenDialog } from '@chabaduniverse/auth/react';

function ProtectedPage() {
  return (
    <AuthGuard
      requireMerkosAuth
      BearerTokenDialog={BearerTokenDialog}
    >
      <YourProtectedContent />
    </AuthGuard>
  );
}
```

## Core Concepts

### Adapter Pattern

All external dependencies are abstracted through adapter interfaces:

```typescript
interface AuthAPIAdapter {
  loginWithBearerToken(token: string): Promise<AuthResponse>;
  loginWithCredentials(username: string, password: string): Promise<AuthResponse>;
  loginWithGoogle(code: string): Promise<AuthResponse>;
  getCurrentUser(): Promise<User>;
  logout(): Promise<void>;
  // ... more methods
}
```

This allows you to:
- Switch between API implementations without changing your code
- Mock adapters for testing
- Use custom API clients
- Support multiple backends

### Dual Authentication

Support for simultaneous Valu Social and Merkos Platform authentication:

```typescript
import { useAuth, useValuAuth } from '@chabaduniverse/auth/react';

function Component() {
  const { isAuthenticated: merkosAuth } = useAuth();
  const { isAuthenticated: valuAuth, isInValuFrame } = useValuAuth();

  // Handle both authentication states
}
```

### Headless Components

UI components use render props for maximum flexibility:

```typescript
<BearerTokenDialog
  open={open}
  onTokenSubmit={handleSubmit}
  render={({ token, setToken, handleSubmit, isLoading }) => (
    <YourCustomUI />
  )}
/>
```

## API Reference

### Hooks

#### `useAuth()`

Main authentication hook providing state and methods:

```typescript
const {
  // State
  isAuthenticated,
  isLoading,
  isInitialized,
  user,
  error,
  hasMerkosBearerToken,

  // Methods
  loginWithBearerToken,
  loginWithCredentials,
  loginWithGoogle,
  loginWithChabadOrg,
  loginWithCDSSO,
  logout,
  refreshAuth,
} = useAuth();
```

#### `useValuAuth()`

Valu Social authentication hook:

```typescript
const {
  user,
  isAuthenticated,
  isInValuFrame,
  isConnected,
  getUserIcon,
  refreshUser,
} = useValuAuth();
```

### Components

#### `<AuthProvider>`

Root authentication provider component.

**Props:**
- `config` - Authentication configuration with adapters

#### `<AuthGuard>`

Route protection component with automatic bearer token prompt.

**Props:**
- `children` - Protected content
- `requireMerkosAuth` - Require Merkos authentication
- `requireValuAuth` - Require Valu authentication
- `BearerTokenDialog` - Optional custom dialog component
- `fallback` - Loading/unauthorized fallback UI

#### `<BearerTokenDialog>`

Headless bearer token input dialog.

**Props:**
- `open` - Dialog open state
- `onOpenChange` - State change callback
- `onTokenSubmit` - Token submission handler
- `render` - Optional custom render function

### Adapters

#### `MerkosAPIAdapter`

Merkos Platform API adapter implementation.

```typescript
const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://shop.merkos302.com',
  apiVersion: 'v2',
  timeout: 30000,
});
```

### Database Models

Six MongoDB models for complete user data management:

- `User` - Core user authentication
- `Profile` - User profile data
- `Preferences` - User preferences and settings
- `Activity` - User activity tracking
- `AppData` - App-specific data storage
- `Analytics` - User engagement analytics

## Package Exports

```typescript
// Core (framework-agnostic)
import { AuthManager, TokenStorage } from '@chabaduniverse/auth';

// React bindings
import { AuthProvider, useAuth, AuthGuard } from '@chabaduniverse/auth/react';

// Adapters
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

// Database models
import { User, Profile, Preferences } from '@chabaduniverse/auth/database';
```

## Documentation

- 📘 [Integration Guide](./INTEGRATION_GUIDE.md) - Complete integration walkthrough
- 🚀 [Quick Start Guide](./QUICK_START.md) - Get started in 5 minutes
- 📖 [API Documentation](./docs/) - Detailed API reference
- 🔄 [Migration Guide](./docs/MIGRATION.md) - Migrate from universe-portal

## Examples

### Next.js Integration

```typescript
// pages/_app.tsx
import { AuthProvider } from '@chabaduniverse/auth/react';
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

const merkosAdapter = new MerkosAPIAdapter({ baseUrl: process.env.API_URL });

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider config={{ apiAdapter: merkosAdapter, userServiceAdapter }}>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

### Custom UI with shadcn/ui

```typescript
import { BearerTokenDialog } from '@chabaduniverse/auth/react';
import { Dialog, DialogContent, Input, Button } from '@/components/ui';

<BearerTokenDialog
  open={open}
  onTokenSubmit={handleSubmit}
  render={({ token, setToken, handleSubmit, isLoading, inputRef }) => (
    <Dialog open onOpenChange={handleCancel}>
      <DialogContent>
        <Input
          ref={inputRef}
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={isLoading}>
          Submit
        </Button>
      </DialogContent>
    </Dialog>
  )}
/>
```

## Testing

```typescript
import { render } from '@testing-library/react';
import { AuthProvider, useAuth } from '@chabaduniverse/auth/react';
import { mockAdapter } from './mocks';

test('authentication flow', async () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: ({ children }) => (
      <AuthProvider config={{ apiAdapter: mockAdapter }}>
        {children}
      </AuthProvider>
    ),
  });

  await act(() => result.current.loginWithBearerToken('token'));
  expect(result.current.isAuthenticated).toBe(true);
});
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- React 16.8+ (hooks support required)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT © ChabadUniverse Team

## Support

- 📧 Email: support@chabaduniverse.com
- 🐛 Issues: [GitHub Issues](https://github.com/merkos-302/chabaduniverse-auth/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/merkos-302/chabaduniverse-auth/discussions)

---

**Made with ❤️ by the ChabadUniverse Team**
