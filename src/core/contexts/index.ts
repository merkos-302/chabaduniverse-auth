/**
 * Core Authentication Contexts
 *
 * Framework-agnostic authentication contexts using the adapter pattern
 */

export {
  AuthContext,
  AuthProvider,
  useAuth,
  type AuthState,
  type AuthContextType,
  type AuthProviderConfig,
  type AuthProviderProps,
  type AuthAPIAdapter,
  type UserServiceAdapter,
  type AuthResponse,
  type UserInfoResponse,
} from './AuthContext';
