import { useAuthContext } from './AuthProvider';

/**
 * Hook to access authentication state and methods
 *
 * @returns Authentication state and methods
 *
 * @example
 * ```tsx
 * import { useAuth } from '@chabaduniverse/auth/react';
 *
 * function LoginForm() {
 *   const { loginWithBearerToken, isLoading, error } = useAuth();
 *
 *   const handleSubmit = async (token: string) => {
 *     await loginWithBearerToken(token);
 *   };
 *
 *   return (
 *     // Your login form
 *   );
 * }
 * ```
 */
export function useAuth() {
  return useAuthContext();
}
