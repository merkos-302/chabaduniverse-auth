import { useState, useEffect, ReactNode, ComponentType } from "react";
import { useAuth } from "../../core/contexts/AuthContext";
import { useValuAuth } from "../../core/hooks/useValuAuth";

/**
 * Props interface for the Bearer Token dialog component used by AuthGuard.
 * This is a simplified interface - implementers can use the full BearerTokenDialogProps
 * from BearerTokenDialog.tsx which includes additional features.
 */
export interface AuthGuardBearerTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenSubmit: (token: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

/**
 * Props interface for the AuthGuard component.
 */
export interface AuthGuardProps {
  /**
   * Children to render when authentication requirements are met
   */
  children: ReactNode;

  /**
   * Legacy mode: Either Valu OR Merkos auth is sufficient
   * @default false
   */
  requireAuth?: boolean;

  /**
   * Require Valu Social authentication
   * @default false
   */
  requireValuAuth?: boolean;

  /**
   * Require Merkos Platform authentication (Bearer token)
   * @default false
   */
  requireMerkosAuth?: boolean;

  /**
   * Custom fallback to render when authentication fails.
   * If not provided, a default error message is shown.
   */
  fallback?: ReactNode;

  /**
   * Callback fired when the token prompt state changes.
   * Useful for parent components to know when dialog should be shown.
   */
  onTokenPrompt?: (show: boolean) => void;

  /**
   * Optional Bearer Token dialog component.
   * If not provided, only guard functionality is active (no dialog).
   */
  BearerTokenDialog?: ComponentType<AuthGuardBearerTokenDialogProps>;

  /**
   * Custom loading component to show while authentication is being verified.
   * If not provided, a default loading spinner is shown.
   */
  loadingComponent?: ReactNode;
}

/**
 * AuthGuard component that checks authentication status
 * with hybrid Valu/Merkos authentication support.
 *
 * @description
 * This component provides flexible authentication guarding with support for:
 * - Valu Social authentication (iframe-based)
 * - Merkos Platform authentication (Bearer token)
 * - Dual authentication (both required)
 * - Legacy mode (either sufficient)
 *
 * @authentication-modes
 * 1. **Legacy mode** (requireAuth only): Either Valu OR Merkos auth is sufficient
 * 2. **Dual auth mode** (requireValuAuth + requireMerkosAuth): BOTH authentications required
 * 3. **Valu-only mode** (requireValuAuth only): Only Valu authentication required
 * 4. **Merkos-only mode** (requireMerkosAuth only): Only Merkos authentication required
 *
 * @authentication-priority
 * 1. First check: Is user authenticated via Valu? (if in iframe)
 * 2. Second check: Is user authenticated via Merkos? (Bearer token, credentials, etc.)
 * 3. Enforce requirements based on props (requireValuAuth, requireMerkosAuth)
 *
 * @timing-behavior
 * - Uses 100ms stabilization delay before showing Bearer Token dialog
 * - Prevents premature UI states during initialization
 * - Waits for isInitialized flag to prevent race conditions
 *
 * @example
 * ```tsx
 * // Basic usage with default error message
 * <AuthGuard requireMerkosAuth>
 *   <ProtectedContent />
 * </AuthGuard>
 *
 * // With custom Bearer Token dialog
 * <AuthGuard
 *   requireMerkosAuth
 *   BearerTokenDialog={MyCustomDialog}
 * >
 *   <ProtectedContent />
 * </AuthGuard>
 *
 * // Dual authentication with custom fallback
 * <AuthGuard
 *   requireValuAuth
 *   requireMerkosAuth
 *   fallback={<CustomErrorPage />}
 * >
 *   <ProtectedContent />
 * </AuthGuard>
 *
 * // With token prompt callback
 * <AuthGuard
 *   requireMerkosAuth
 *   onTokenPrompt={(show) => console.log('Dialog state:', show)}
 * >
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requireAuth = false,
  requireValuAuth = false,
  requireMerkosAuth = false,
  fallback = null,
  onTokenPrompt,
  BearerTokenDialog,
  loadingComponent
}: AuthGuardProps) {
  // Primary authentication via Valu Social
  const {
    isAuthenticated: isValuAuthenticated,
    isLoading: isValuLoading,
    isInValuFrame: isValuConnected
  } = useValuAuth();

  // Fallback authentication via Merkos (Bearer token, credentials, etc.)
  const {
    isAuthenticated: isMerkosAuthenticated,
    token: merkosBearerToken,
    isLoading: isMerkosLoading,
    isInitialized: isMerkosInitialized,
    needsBearerToken,
    loginWithBearerToken,
    error: merkosError,
    hasMerkosBearerToken
  } = useAuth();

  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Determine overall authentication status based on requirements
  let isAuthenticated: boolean;

  if (requireValuAuth && requireMerkosAuth) {
    // Dual authentication mode: BOTH Valu AND Merkos required
    isAuthenticated = isValuAuthenticated && hasMerkosBearerToken;
  } else if (requireValuAuth) {
    // Valu-only mode: Only Valu authentication required
    isAuthenticated = isValuAuthenticated;
  } else if (requireMerkosAuth) {
    // Merkos-only mode: Only Merkos authentication required
    isAuthenticated = hasMerkosBearerToken;
  } else if (requireAuth) {
    // Legacy mode: Either Valu OR Merkos is sufficient
    isAuthenticated = isValuAuthenticated || isMerkosAuthenticated;
  } else {
    // No authentication required
    isAuthenticated = true;
  }

  // Overall loading state - loading if either auth method is loading
  const isLoading = isValuLoading || isMerkosLoading;

  // Show Bearer Token dialog only when:
  // 1. Initial auth check has completed (isInitialized)
  // 2. Not currently loading
  // 3. Merkos authentication is required (either alone or dual auth)
  // 4. No Merkos bearer token exists yet
  // 5. Valu auth requirement is satisfied (if required)
  // 6. Wait briefly after initialization to allow state to stabilize during navigation
  useEffect(() => {
    // Add a small delay after initialization to allow state to stabilize
    let timeoutId: NodeJS.Timeout;

    if (isMerkosInitialized && !isLoading) {
      timeoutId = setTimeout(() => {
        const shouldShowDialog =
          isMerkosInitialized &&
          !isLoading &&
          requireMerkosAuth &&
          !hasMerkosBearerToken &&
          (!requireValuAuth || isValuAuthenticated);

        setShowTokenDialog(shouldShowDialog);

        // Notify parent component of dialog state change
        if (onTokenPrompt) {
          onTokenPrompt(shouldShowDialog);
        }
      }, 100); // Small delay to allow context state to stabilize
    } else {
      setShowTokenDialog(false);
      if (onTokenPrompt) {
        onTokenPrompt(false);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    isMerkosInitialized,
    isMerkosAuthenticated,
    requireMerkosAuth,
    requireValuAuth,
    isLoading,
    isValuAuthenticated,
    hasMerkosBearerToken,
    merkosBearerToken,
    needsBearerToken,
    onTokenPrompt
  ]);

  const handleTokenSubmit = async (token: string) => {
    setAuthError(null);

    try {
      await loginWithBearerToken(token);
      setShowTokenDialog(false);
      setAuthError(null);
      if (onTokenPrompt) {
        onTokenPrompt(false);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate with bearer token");
    }
  };

  // Show loading state while checking both authentication methods
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    // Determine what we're loading based on requirements
    let loadingMessage = "Checking authentication...";

    if (requireValuAuth && requireMerkosAuth) {
      loadingMessage = isValuLoading && isMerkosLoading
        ? "Checking Valu and Merkos authentication..."
        : isValuLoading
        ? "Checking Valu authentication..."
        : "Checking Merkos authentication...";
    } else if (requireValuAuth) {
      loadingMessage = "Checking Valu authentication...";
    } else if (requireMerkosAuth) {
      loadingMessage = "Checking Merkos authentication...";
    } else {
      loadingMessage = isValuLoading && isMerkosLoading
        ? "Checking authentication..."
        : isValuLoading
        ? "Checking Valu authentication..."
        : "Checking Merkos authentication...";
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Check if we should show the Bearer Token dialog instead of error
  const shouldShowBearerTokenDialog =
    requireMerkosAuth &&
    !hasMerkosBearerToken &&
    (!requireValuAuth || isValuAuthenticated);

  // If authentication is required but user is not authenticated, show error message
  // BUT skip the error if we should be showing the Bearer Token dialog
  const needsAuth = requireAuth || requireValuAuth || requireMerkosAuth;

  if (needsAuth && !isAuthenticated && !shouldShowBearerTokenDialog) {
    // Determine what authentication is missing and provide specific messages
    let errorTitle = "Authentication Required";
    let errorMessage = "";

    if (requireValuAuth && requireMerkosAuth) {
      // Dual auth required
      if (!isValuAuthenticated && !hasMerkosBearerToken) {
        errorMessage = "This page requires both Valu Social authentication and a Merkos Bearer Token";
      } else if (!isValuAuthenticated) {
        if (!isValuConnected) {
          errorTitle = "Valu Social Required";
          errorMessage = "This page requires access through the Valu Social platform";
        } else {
          errorTitle = "Valu Authentication Required";
          errorMessage = "Please authenticate with Valu Social first";
        }
      } else if (!hasMerkosBearerToken) {
        // Valu is authenticated, but missing Merkos token
        // Bearer token dialog should be showing, so this shouldn't normally be reached
        errorMessage = "Please provide your Merkos bearer token to access Merkos Platform features";
      }
    } else if (requireValuAuth) {
      // Valu-only required
      if (!isValuConnected) {
        errorTitle = "Valu Social Required";
        errorMessage = "This page requires access through the Valu Social platform";
      } else {
        errorTitle = "Valu Authentication Required";
        errorMessage = "Please authenticate with Valu Social to continue";
      }
    } else if (requireMerkosAuth) {
      // Merkos-only required
      if (requireValuAuth && !isValuAuthenticated) {
        // Edge case: User has Merkos token but no Valu auth when both are required
        errorMessage = "Please authenticate through Valu Social first";
      } else {
        // Bearer token dialog should be showing, so this shouldn't normally be reached
        errorMessage = "Please provide a Merkos Bearer Token to access Merkos Platform features";
      }
    } else if (requireAuth) {
      // Legacy mode - either auth method is acceptable
      errorMessage = isValuConnected
        ? "Please authenticate through Valu Social or provide a Bearer Token"
        : "Please provide a Bearer Token to continue";
    }

    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">{errorTitle}</p>
          {errorMessage && (
            <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // When waiting for Bearer Token, show a waiting message with the dialog (if provided)
  if (shouldShowBearerTokenDialog && BearerTokenDialog) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg text-gray-600">Authentication Required</p>
            <p className="mt-2 text-sm text-gray-500">
              Please provide your Merkos bearer token to access Merkos Platform features
            </p>
          </div>
        </div>
        <BearerTokenDialog
          open={showTokenDialog}
          onOpenChange={setShowTokenDialog}
          onTokenSubmit={handleTokenSubmit}
          error={authError || merkosError}
          isLoading={isMerkosLoading}
        />
      </>
    );
  }

  // When waiting for Bearer Token but no dialog component provided
  if (shouldShowBearerTokenDialog && !BearerTokenDialog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">Authentication Required</p>
          <p className="mt-2 text-sm text-gray-500">
            Please provide your Merkos bearer token to access Merkos Platform features
          </p>
          <p className="mt-4 text-xs text-gray-400">
            No BearerTokenDialog component provided to AuthGuard
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Bearer Token dialog - only shown when provided and when Merkos auth is required and Valu requirement is satisfied */}
      {BearerTokenDialog && (
        <BearerTokenDialog
          open={showTokenDialog}
          onOpenChange={setShowTokenDialog}
          onTokenSubmit={handleTokenSubmit}
          error={authError || merkosError}
          isLoading={isMerkosLoading}
        />
      )}
    </>
  );
}

export default AuthGuard;
