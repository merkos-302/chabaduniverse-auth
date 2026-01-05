# BearerTokenDialog Component

A headless, UI-library independent React component for collecting bearer token authentication.

## Overview

`BearerTokenDialog` provides token input state management, validation, and submission handling without imposing any specific UI implementation. It's designed to be framework-agnostic and can be styled with any UI library or custom CSS.

## Features

- **Headless by default** - Use render props to provide your own UI
- **Basic implementation included** - Works out of the box with minimal styling
- **SSR-safe** - No direct DOM access, compatible with Next.js and other SSR frameworks
- **Fully accessible** - Proper ARIA attributes and keyboard navigation
- **Auto-focus management** - Automatically focuses input when dialog opens
- **State management** - Handles token validation, submission, and error states
- **TypeScript support** - Fully typed interfaces and props

## Installation

```bash
npm install @merkos/chabaduniverse-auth
```

## Basic Usage

### Default Implementation (Basic HTML)

```tsx
import { BearerTokenDialog } from '@merkos/chabaduniverse-auth/react';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenSubmit = async (token: string) => {
    try {
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
    />
  );
}
```

### Custom UI with Render Props

```tsx
import { BearerTokenDialog } from '@merkos/chabaduniverse-auth/react';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenSubmit = async (token: string) => {
    try {
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
        error,
        isLoading,
        isValid,
        inputRef,
      }) => (
        <div className="custom-dialog">
          <h2>Enter Bearer Token</h2>
          <input
            ref={inputRef}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={isLoading}
            placeholder="Paste your token here"
          />
          {error && <p className="error">{error}</p>}
          <div className="buttons">
            <button onClick={handleCancel} disabled={isLoading}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!isValid || isLoading}>
              {isLoading ? 'Authenticating...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    />
  );
}
```

### With UI Library (shadcn/ui example)

```tsx
import { BearerTokenDialog } from '@merkos/chabaduniverse-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenSubmit = async (token: string) => {
    try {
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
        error,
        isLoading,
        isValid,
        inputRef,
      }) => (
        <Dialog open onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Authentication Required</DialogTitle>
              <DialogDescription>
                Enter your bearer token to continue
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="token">Bearer Token</Label>
                <Input
                  ref={inputRef}
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                  className="font-mono"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
                {isLoading ? 'Authenticating...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    />
  );
}
```

## API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | - | Whether the dialog is open |
| `onOpenChange` | `(open: boolean) => void` | Yes | - | Callback when dialog open state changes |
| `onTokenSubmit` | `(token: string) => Promise<void>` | Yes | - | Async callback when user submits token |
| `error` | `string \| null` | No | `null` | Error message to display |
| `loading` | `boolean` | No | `false` | External loading state (in addition to internal submission state) |
| `render` | `(props: RenderProps) => ReactNode` | No | - | Custom render function for the UI |

### Render Props

When using the `render` prop, you receive the following props:

| Prop | Type | Description |
|------|------|-------------|
| `token` | `string` | Current token value |
| `setToken` | `(token: string) => void` | Update token value |
| `handleSubmit` | `() => void` | Submit the token (calls `onTokenSubmit`) |
| `handleCancel` | `() => void` | Cancel and close the dialog (calls `onOpenChange(false)`) |
| `error` | `string \| null` | Current error message |
| `isLoading` | `boolean` | Whether authentication is in progress |
| `isValid` | `boolean` | Whether the token is valid (non-empty after trim) |
| `inputRef` | `React.RefObject<HTMLInputElement>` | Ref for the input element (for auto-focus) |

## Features in Detail

### Auto-Focus

The component automatically focuses the input field when the dialog opens (with a 100ms delay to ensure proper rendering).

### State Reset

When the dialog closes, the token value and submission state are automatically reset.

### Validation

- Token is trimmed before validation
- Empty tokens are considered invalid
- Submit button is disabled when token is invalid

### Loading States

The component tracks both:
1. Internal submission state (when `onTokenSubmit` is in progress)
2. External loading state (via `loading` prop)

The `isLoading` render prop combines both states.

### Error Handling

Errors should be managed by the parent component:

```tsx
const handleTokenSubmit = async (token: string) => {
  try {
    await authenticateWithToken(token);
    setOpen(false); // Close dialog on success
  } catch (err) {
    setError(err.message); // Set error to display in dialog
  }
};
```

### Accessibility

The default implementation includes:
- Proper `aria-describedby` for error messages
- Keyboard navigation support
- Screen reader compatible labels
- Disabled state management

## TypeScript

The component is fully typed. Import the types:

```tsx
import {
  BearerTokenDialog,
  BearerTokenDialogProps,
  BearerTokenDialogRenderProps,
} from '@merkos/chabaduniverse-auth/react';
```

## Styling

### Default Implementation

The default implementation uses inline styles for maximum portability. You can override these by:

1. Using CSS classes on wrapper elements
2. Using the `render` prop to provide custom markup
3. Customizing via CSS targeting `.bearer-token-dialog-overlay` and `.bearer-token-dialog`

### Custom Styling

For full control over styling, use the `render` prop and provide your own markup and styles.

## Best Practices

1. **Keep authentication logic in parent component** - The dialog only handles token collection, not authentication
2. **Clear errors on dialog open** - Reset error state when opening the dialog
3. **Close dialog on success** - Call `onOpenChange(false)` after successful authentication
4. **Provide helpful error messages** - Give users actionable feedback on authentication failures
5. **Use loading states** - Show loading indicator during authentication

## Examples

### With Form Validation

```tsx
function MyComponent() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenSubmit = async (token: string) => {
    // Clear previous errors
    setError(null);

    // Validate token format (example)
    if (!token.startsWith('eyJ')) {
      setError('Invalid token format. Token should be a JWT.');
      return;
    }

    try {
      await authenticateWithToken(token);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <BearerTokenDialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (open) setError(null); // Clear errors when opening
      }}
      onTokenSubmit={handleTokenSubmit}
      error={error}
    />
  );
}
```

### With Global Auth State

```tsx
import { useAuth } from '@merkos/chabaduniverse-auth/react';

function MyComponent() {
  const { login } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenSubmit = async (token: string) => {
    try {
      await login({ bearerToken: token });
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
    />
  );
}
```

## Migration from shadcn/ui Version

If you're migrating from the original `BearerTokenPromptDialog` component:

**Before:**
```tsx
<BearerTokenPromptDialog
  open={open}
  onOpenChange={setOpen}
  onSubmit={handleSubmit}
  error={error}
  loading={loading}
/>
```

**After (using default implementation):**
```tsx
<BearerTokenDialog
  open={open}
  onOpenChange={setOpen}
  onTokenSubmit={handleSubmit} // Renamed from onSubmit
  error={error}
  loading={loading}
/>
```

**After (using render props with shadcn/ui):**
See the "With UI Library (shadcn/ui example)" section above.

## License

MIT
