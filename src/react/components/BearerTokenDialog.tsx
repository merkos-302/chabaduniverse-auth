import { useState, useRef, useEffect, ReactNode } from 'react';

/**
 * Render props interface for fully customizable UI
 */
export interface BearerTokenDialogRenderProps {
  /** Current token value */
  token: string;
  /** Update token value */
  setToken: (token: string) => void;
  /** Submit the token for authentication */
  handleSubmit: () => void;
  /** Cancel and close the dialog */
  handleCancel: () => void;
  /** Current error message (if any) */
  error: string | null;
  /** Whether authentication is in progress */
  isLoading: boolean;
  /** Whether the token is valid (non-empty after trim) */
  isValid: boolean;
  /** Ref for the input element (for auto-focus) */
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Props for BearerTokenDialog component
 */
export interface BearerTokenDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Callback when user submits bearer token
   * Should handle async authentication
   */
  onTokenSubmit: (token: string) => Promise<void>;

  /**
   * Error message to display (if any)
   */
  error?: string | null;

  /**
   * Loading state during token submission
   */
  loading?: boolean;

  /**
   * Optional: Custom render function for fully customizable UI
   *
   * @example
   * ```tsx
   * <BearerTokenDialog
   *   open={open}
   *   onOpenChange={setOpen}
   *   onTokenSubmit={handleSubmit}
   *   render={({ token, setToken, handleSubmit, handleCancel, error, isLoading, isValid, inputRef }) => (
   *     <div className="custom-dialog">
   *       <h2>Custom Title</h2>
   *       <input
   *         ref={inputRef}
   *         type="password"
   *         value={token}
   *         onChange={(e) => setToken(e.target.value)}
   *         disabled={isLoading}
   *       />
   *       {error && <p className="error">{error}</p>}
   *       <button onClick={handleCancel} disabled={isLoading}>Cancel</button>
   *       <button onClick={handleSubmit} disabled={!isValid || isLoading}>Submit</button>
   *     </div>
   *   )}
   * />
   * ```
   */
  render?: (props: BearerTokenDialogRenderProps) => ReactNode;
}

/**
 * Headless Bearer Token Dialog component
 *
 * A framework-agnostic component for collecting bearer token authentication.
 * Provides token input state management, validation, and submission handling
 * without imposing any specific UI implementation.
 *
 * **Headless by default:** Use the `render` prop to provide your own UI.
 * **Basic implementation included:** If no `render` prop is provided, renders a simple HTML dialog.
 *
 * @example Basic usage with render prop
 * ```tsx
 * import { BearerTokenDialog } from '@merkos/chabaduniverse-auth/react';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const handleTokenSubmit = async (token: string) => {
 *     try {
 *       await authenticateWithToken(token);
 *       setOpen(false);
 *     } catch (err) {
 *       setError(err.message);
 *     }
 *   };
 *
 *   return (
 *     <BearerTokenDialog
 *       open={open}
 *       onOpenChange={setOpen}
 *       onTokenSubmit={handleTokenSubmit}
 *       error={error}
 *       render={({ token, setToken, handleSubmit, handleCancel, error, isLoading, isValid, inputRef }) => (
 *         <YourCustomDialog>
 *           <input
 *             ref={inputRef}
 *             type="password"
 *             value={token}
 *             onChange={(e) => setToken(e.target.value)}
 *             disabled={isLoading}
 *           />
 *           {error && <div className="error">{error}</div>}
 *           <button onClick={handleCancel}>Cancel</button>
 *           <button onClick={handleSubmit} disabled={!isValid || isLoading}>
 *             {isLoading ? 'Authenticating...' : 'Submit'}
 *           </button>
 *         </YourCustomDialog>
 *       )}
 *     />
 *   );
 * }
 * ```
 *
 * @example Using default basic implementation
 * ```tsx
 * <BearerTokenDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   onTokenSubmit={handleTokenSubmit}
 *   error={error}
 * />
 * ```
 */
export function BearerTokenDialog({
  open,
  onOpenChange,
  onTokenSubmit,
  error = null,
  loading = false,
  render,
}: BearerTokenDialogProps) {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure dialog is fully rendered
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setToken('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    // Validate token
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onTokenSubmit(trimmedToken);
      // If successful, the parent component should close the dialog
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isLoading = loading || isSubmitting;
  const isValid = token.trim().length > 0;

  // If dialog is closed, don't render anything
  if (!open) {
    return null;
  }

  // If custom render function is provided, use it
  if (render) {
    return (
      <>
        {render({
          token,
          setToken,
          handleSubmit,
          handleCancel,
          error,
          isLoading,
          isValid,
          inputRef,
        })}
      </>
    );
  }

  // Default basic implementation
  return (
    <div
      className="bearer-token-dialog-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => {
        // Close on overlay click (not on dialog content click)
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        className="bearer-token-dialog"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              marginBottom: '8px',
            }}
          >
            Authentication Required
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
            }}
          >
            Please enter your Merkos Platform bearer token to continue. This
            token will be securely stored for future sessions.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ marginBottom: '16px' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="bearer-token"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              Bearer Token
            </label>
            <input
              ref={inputRef}
              id="bearer-token"
              type="password"
              placeholder="Enter your bearer token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
              aria-describedby={error ? 'token-error' : undefined}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <div
                id="token-error"
                role="alert"
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '4px',
                  color: '#c00',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: !isValid || isLoading ? '#ccc' : '#0066cc',
                color: 'white',
                cursor: !isValid || isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
        </form>

        {/* Instructions */}
        <div
          style={{
            fontSize: '12px',
            color: '#666',
            borderTop: '1px solid #eee',
            paddingTop: '16px',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
            Where to find your token:
          </p>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Log in to the Merkos Platform</li>
            <li>Navigate to your account settings</li>
            <li>Find the API or Developer section</li>
            <li>Copy your bearer token</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default BearerTokenDialog;
