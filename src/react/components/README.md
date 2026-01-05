# React Components

Framework-agnostic React components for ChabadUniverse authentication.

## AuthGuard Component

The `AuthGuard` component provides flexible authentication guarding with support for Valu Social and Merkos Platform authentication.

### Features

- **Multiple Authentication Modes:**
  - Legacy mode (either Valu OR Merkos)
  - Dual authentication (both required)
  - Valu-only mode
  - Merkos-only mode

- **Framework Agnostic:** Works with any React framework (Next.js, Remix, Vite, etc.)

- **Customizable:** Accept custom dialog components, loading states, and error messages

- **Timing Protection:** 100ms stabilization delay prevents premature UI states

### Installation

The component requires these dependencies from the core library:

```typescript
import { useAuth } from "../../core/contexts/AuthContext";
import { useValuAuth } from "../../core/hooks/useValuAuth";
```

### Basic Usage

```tsx
import { AuthGuard } from '@chabaduniverse/auth/react/components';

// Basic usage - require Merkos authentication
function App() {
  return (
    <AuthGuard requireMerkosAuth>
      <ProtectedContent />
    </AuthGuard>
  );
}
```

### Authentication Modes

#### 1. Legacy Mode (Either Auth Sufficient)

```tsx
<AuthGuard requireAuth>
  <ProtectedContent />
</AuthGuard>
```

#### 2. Valu-Only Mode

```tsx
<AuthGuard requireValuAuth>
  <ProtectedContent />
</AuthGuard>
```

#### 3. Merkos-Only Mode

```tsx
<AuthGuard requireMerkosAuth>
  <ProtectedContent />
</AuthGuard>
```

#### 4. Dual Authentication Mode

```tsx
<AuthGuard requireValuAuth requireMerkosAuth>
  <ProtectedContent />
</AuthGuard>
```

### Custom Bearer Token Dialog

Create a dialog component that matches the `BearerTokenDialogProps` interface:

```tsx
import { BearerTokenDialogProps } from '@chabaduniverse/auth/react/components';

function MyBearerTokenDialog({
  open,
  onOpenChange,
  onTokenSubmit,
  error,
  isLoading
}: BearerTokenDialogProps) {
  const [token, setToken] = useState('');

  const handleSubmit = async () => {
    await onTokenSubmit(token);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Bearer Token</DialogTitle>
        </DialogHeader>
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your bearer token"
        />
        {error && <p className="text-red-500">{error}</p>}
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Authenticating...' : 'Submit'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Use it with AuthGuard
<AuthGuard
  requireMerkosAuth
  BearerTokenDialog={MyBearerTokenDialog}
>
  <ProtectedContent />
</AuthGuard>
```

### Custom Fallback

```tsx
<AuthGuard
  requireMerkosAuth
  fallback={
    <div>
      <h1>Access Denied</h1>
      <p>You need to authenticate to access this page</p>
    </div>
  }
>
  <ProtectedContent />
</AuthGuard>
```

### Custom Loading Component

```tsx
<AuthGuard
  requireMerkosAuth
  loadingComponent={
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="large" />
      <p>Verifying your credentials...</p>
    </div>
  }
>
  <ProtectedContent />
</AuthGuard>
```

### Token Prompt Callback

```tsx
function MyApp() {
  const handleTokenPrompt = (show: boolean) => {
    console.log('Bearer token dialog state:', show);
    // Track analytics, show notifications, etc.
  };

  return (
    <AuthGuard
      requireMerkosAuth
      onTokenPrompt={handleTokenPrompt}
    >
      <ProtectedContent />
    </AuthGuard>
  );
}
```

### Props API

```typescript
interface AuthGuardProps {
  // Children to render when authenticated
  children: ReactNode;

  // Legacy mode: Either Valu OR Merkos auth is sufficient
  requireAuth?: boolean;

  // Require Valu Social authentication
  requireValuAuth?: boolean;

  // Require Merkos Platform authentication
  requireMerkosAuth?: boolean;

  // Custom fallback component for auth failures
  fallback?: ReactNode;

  // Callback when token prompt state changes
  onTokenPrompt?: (show: boolean) => void;

  // Custom Bearer Token dialog component
  BearerTokenDialog?: ComponentType<BearerTokenDialogProps>;

  // Custom loading component
  loadingComponent?: ReactNode;
}
```

### BearerTokenDialogProps Interface

```typescript
interface BearerTokenDialogProps {
  // Whether dialog is open
  open: boolean;

  // Callback to change dialog open state
  onOpenChange: (open: boolean) => void;

  // Callback to submit bearer token
  onTokenSubmit: (token: string) => Promise<void>;

  // Error message to display (null if no error)
  error: string | null;

  // Whether authentication is in progress
  isLoading: boolean;
}
```

### Authentication Priority

The component checks authentication in this order:

1. **First:** Check if user is authenticated via Valu Social (if in iframe)
2. **Second:** Check if user is authenticated via Merkos Platform (Bearer token)
3. **Enforce:** Apply requirements based on props (`requireValuAuth`, `requireMerkosAuth`)

### Timing Behavior

- **100ms stabilization delay:** Prevents premature Bearer Token dialog during navigation
- **isInitialized flag:** Ensures auth check completes before showing UI
- **No race conditions:** Proper cleanup of timeouts prevents memory leaks

### Integration Examples

#### Next.js App Router

```tsx
// app/dashboard/layout.tsx
import { AuthGuard } from '@chabaduniverse/auth/react/components';
import { BearerTokenDialog } from '@/components/BearerTokenDialog';

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard
      requireMerkosAuth
      BearerTokenDialog={BearerTokenDialog}
    >
      {children}
    </AuthGuard>
  );
}
```

#### Remix

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

#### Vite + React

```tsx
// src/App.tsx
import { AuthGuard } from '@chabaduniverse/auth/react/components';

function App() {
  return (
    <AuthGuard requireMerkosAuth>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthGuard>
  );
}
```

## Best Practices

1. **Provide a custom Bearer Token dialog** for better UX matching your design system
2. **Use `onTokenPrompt` callback** to track when users are prompted for authentication
3. **Implement proper error handling** in your Bearer Token dialog component
4. **Show loading states** during authentication to provide feedback
5. **Use fallback components** for custom error messages
6. **Combine with route guards** for comprehensive protection

## See Also

- [Core Authentication Context](../../core/contexts/README.md)
- [Valu Authentication Hook](../../core/hooks/README.md)
- [Authentication Guide](../../../docs/authentication.md)
