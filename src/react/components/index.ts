/**
 * React Components for ChabadUniverse Authentication
 *
 * This module exports framework-agnostic React components for authentication.
 */

export { AuthGuard, default as AuthGuardDefault } from "./AuthGuard";
export type { AuthGuardProps, AuthGuardBearerTokenDialogProps } from "./AuthGuard";

export {
  BearerTokenDialog,
  default as BearerTokenDialogDefault,
} from "./BearerTokenDialog";
export type {
  BearerTokenDialogProps,
  BearerTokenDialogRenderProps,
} from "./BearerTokenDialog";
