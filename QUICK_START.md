# Quick Start Guide

Get up and running with @chabaduniverse/auth in 5 minutes!

## 1. Installation (30 seconds)

```bash
npm install @chabaduniverse/auth
```

## 2. Basic Setup (2 minutes)

### Create your API adapter

```typescript
// lib/authAdapter.ts
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

export const merkosAdapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2',
});
```

### Create your user service adapter

```typescript
// lib/userService.ts
import { UserServiceAdapter } from '@chabaduniverse/auth';

export const userService: UserServiceAdapter = {
  async getUserInfo(userId: string) {
    // Fetch user info from your backend
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  },

  async updateUser(userId: string, data: any) {
    // Update user in your backend
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return await response.json();
  },
};
```

### Set up the provider

```typescript
// app.tsx or pages/_app.tsx
import { AuthProvider } from '@chabaduniverse/auth/react';
import { merkosAdapter } from './lib/authAdapter';
import { userService } from './lib/userService';

const authConfig = {
  apiAdapter: merkosAdapter,
  userServiceAdapter: userService,
};

function App({ children }) {
  return (
    <AuthProvider config={authConfig}>
      {children}
    </AuthProvider>
  );
}
```

## 3. Use in Components (1 minute)

### Simple login component with multiple authentication methods

```typescript
import { useAuth } from '@chabaduniverse/auth/react';

function LoginButton() {
  const {
    loginWithBearerToken,
    loginWithCredentials,
    loginWithGoogle,
    loginWithChabadOrg
  } = useAuth();

  const handleBearerLogin = () => {
    const token = prompt('Enter bearer token:');
    if (token) {
      loginWithBearerToken(token);
    }
  };

  const handleCredentialsLogin = async () => {
    const username = prompt('Enter username:');
    const password = prompt('Enter password:');
    if (username && password) {
      await loginWithCredentials(username, password);
    }
  };

  const handleGoogleLogin = async (code: string) => {
    await loginWithGoogle(code);
  };

  return (
    <div>
      <button onClick={handleBearerLogin}>Login with Token</button>
      <button onClick={handleCredentialsLogin}>Login with Credentials</button>
      <button onClick={() => handleGoogleLogin('google-code')}>Login with Google</button>
    </div>
  );
}
```

### Protected page

```typescript
import { AuthGuard, BearerTokenDialog } from '@chabaduniverse/auth/react';

function ProtectedPage() {
  return (
    <AuthGuard
      requireMerkosAuth
      BearerTokenDialog={BearerTokenDialog}
    >
      <h1>Protected Content</h1>
    </AuthGuard>
  );
}
```

### Show user info

```typescript
import { useAuth } from '@chabaduniverse/auth/react';

function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h2>{user?.name || user?.email}</h2>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 4. Bonus: Custom Token Dialog (1 minute)

Use your own UI library (shadcn/ui example):

```typescript
import { BearerTokenDialog } from '@chabaduniverse/auth/react';
import { Dialog, DialogContent, Input, Button } from '@/components/ui';

function CustomTokenDialog() {
  const [open, setOpen] = useState(false);

  return (
    <BearerTokenDialog
      open={open}
      onOpenChange={setOpen}
      onTokenSubmit={handleSubmit}
      render={({ token, setToken, handleSubmit, handleCancel, isLoading }) => (
        <Dialog open onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent>
            <Input
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
  );
}
```

## Next Steps

- 📘 Read the [Integration Guide](./INTEGRATION_GUIDE.md) for advanced usage
- 🔍 Explore the [API Documentation](./docs/)
- 🎨 Check out [component examples](./docs/components/)
- 🧪 Learn about [testing](./docs/testing/)

## Common Issues

### "Cannot read properties of undefined"

**Solution:** Make sure AuthProvider wraps your component:

```typescript
<AuthProvider config={authConfig}>
  <YourComponent />
</AuthProvider>
```

### "Bearer token dialog doesn't appear"

**Solution:** Pass the BearerTokenDialog component to AuthGuard:

```typescript
<AuthGuard BearerTokenDialog={BearerTokenDialog}>
  {children}
</AuthGuard>
```

### TypeScript errors

**Solution:** Ensure types are properly exported:

```typescript
import type { User, AuthState } from '@chabaduniverse/auth';
```

## That's it!

You're now ready to use @chabaduniverse/auth in your application. 🎉

For more detailed information, check out the full [Integration Guide](./INTEGRATION_GUIDE.md).
