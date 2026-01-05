# AuthGuard Quick Start Guide

## Installation

```bash
npm install @chabaduniverse/auth
```

## Basic Setup

### 1. Wrap your app with providers

```tsx
import { AuthProvider } from '@chabaduniverse/auth/react';

function App() {
  return (
    <AuthProvider config={{ apiUrl: 'https://api.merkos302.com' }}>
      <YourApp />
    </AuthProvider>
  );
}
```

### 2. Protect routes with AuthGuard

```tsx
import { AuthGuard } from '@chabaduniverse/auth/react/components';

function ProtectedPage() {
  return (
    <AuthGuard requireMerkosAuth>
      <DashboardContent />
    </AuthGuard>
  );
}
```

## Common Use Cases

### Require Merkos Authentication Only

```tsx
<AuthGuard requireMerkosAuth>
  <MerkosContent />
</AuthGuard>
```

### Require Valu Authentication Only

```tsx
<AuthGuard requireValuAuth>
  <ValuContent />
</AuthGuard>
```

### Require Both Authentications

```tsx
<AuthGuard requireValuAuth requireMerkosAuth>
  <DualAuthContent />
</AuthGuard>
```

### Custom Error Message

```tsx
<AuthGuard
  requireMerkosAuth
  fallback={
    <div className="error-page">
      <h1>Access Denied</h1>
      <p>Please contact support for access</p>
    </div>
  }
>
  <Content />
</AuthGuard>
```

## With Custom Bearer Token Dialog

### 1. Create your dialog component

```tsx
import { AuthGuardBearerTokenDialogProps } from '@chabaduniverse/auth/react/components';

function MyBearerTokenDialog({
  open,
  onOpenChange,
  onTokenSubmit,
  error,
  isLoading
}: AuthGuardBearerTokenDialogProps) {
  const [token, setToken] = useState('');

  const handleSubmit = async () => {
    await onTokenSubmit(token);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <h2>Enter Bearer Token</h2>
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your token here"
        />
        {error && <p className="error">{error}</p>}
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Authenticating...' : 'Submit'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Use it with AuthGuard

```tsx
<AuthGuard
  requireMerkosAuth
  BearerTokenDialog={MyBearerTokenDialog}
>
  <Content />
</AuthGuard>
```

## Tracking Dialog State

```tsx
function MyPage() {
  const handleTokenPrompt = (show: boolean) => {
    if (show) {
      // Track analytics
      analytics.track('bearer_token_prompt_shown');
    }
  };

  return (
    <AuthGuard
      requireMerkosAuth
      onTokenPrompt={handleTokenPrompt}
    >
      <Content />
    </AuthGuard>
  );
}
```

## Framework-Specific Examples

### Next.js App Router

```tsx
// app/dashboard/layout.tsx
import { AuthGuard } from '@chabaduniverse/auth/react/components';

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard requireMerkosAuth>
      {children}
    </AuthGuard>
  );
}
```

### Next.js Pages Router

```tsx
// pages/dashboard.tsx
import { AuthGuard } from '@chabaduniverse/auth/react/components';

export default function Dashboard() {
  return (
    <AuthGuard requireMerkosAuth>
      <DashboardContent />
    </AuthGuard>
  );
}
```

### Remix

```tsx
// app/routes/dashboard.tsx
import { AuthGuard } from '@chabaduniverse/auth/react/components';

export default function Dashboard() {
  return (
    <AuthGuard requireMerkosAuth>
      <DashboardContent />
    </AuthGuard>
  );
}
```

## Troubleshooting

### Dialog doesn't show

Make sure you're passing a `BearerTokenDialog` component:

```tsx
<AuthGuard
  requireMerkosAuth
  BearerTokenDialog={YourDialogComponent}
>
  <Content />
</AuthGuard>
```

### Loading state never ends

Verify that your `AuthProvider` is properly configured:

```tsx
<AuthProvider config={{ apiUrl: 'YOUR_API_URL' }}>
```

### Authentication fails immediately

Check that required hooks are providing correct data:

```tsx
const { isAuthenticated, hasMerkosBearerToken } = useAuth();
console.log('Auth status:', { isAuthenticated, hasMerkosBearerToken });
```

## API Reference

See [README.md](./README.md) for complete API documentation.

## More Examples

See [README.md](./README.md) for:
- Custom loading components
- Complex authentication scenarios
- Integration with different frameworks
- Advanced configuration options
