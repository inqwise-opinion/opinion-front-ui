/**
 * Core Authentication Provider Interface
 * 
 * Defines the essential contract for authentication operations that must be 
 * supported by all authentication providers in the system.
 * 
 * Design Principles:
 * - Server-managed authentication state (no client-side caching)
 * - Caching handled at DataLoader level only
 * - Clean exception handling for authentication failures
 * - Provider-specific features handled by extended interfaces
 * 
 * @example
 * ```typescript
 * const authProvider: AuthProvider = new SessionAuthProviderImpl();
 * 
 * try {
 *   const isAuth = await authProvider.isAuthenticated();
 *   if (isAuth) {
 *     const user = await authProvider.getCurrentUser();
 *     console.log('Authenticated user:', user.username);
 *   }
 * } catch (error) {
 *   if (error instanceof AuthenticationError) {
 *     console.error('Authentication failed:', error.message);
 *   }
 * }
 * ```
 */

import { User } from '../types';

/**
 * Core authentication provider interface
 * 
 * All authentication providers must implement these essential operations.
 * Extended interfaces can add provider-specific functionality.
 */
export interface AuthProvider {
  /**
   * Get current authenticated user information
   * 
   * This method should always validate authentication status with the server
   * and return the current user data. No client-side caching should be performed.
   * 
   * @returns Promise<User> - authenticated user data
   * @throws AuthenticationError if not authenticated or validation fails
   */
  getCurrentUser(): Promise<User>;
  
  /**
   * Check if user is currently authenticated
   * 
   * This method should validate authentication status with the server.
   * Implementation should not cache results - caching is handled at DataLoader level.
   * 
   * @returns Promise<boolean> - true if authenticated, false otherwise
   */
  isAuthenticated(): Promise<boolean>;
  
  /**
   * Initiate authentication/login process
   * 
   * Implementation varies by provider:
   * - Session-based: Redirect to login page
   * - OAuth2/OIDC: Redirect to authorization server  
   * - Dev/Mock: Set mock authentication state
   * 
   * @throws AuthenticationError if login initiation fails
   */
  login(): Promise<void>;
  
  /**
   * Perform logout operation
   * 
   * Should clean up all authentication state and redirect/notify as appropriate.
   * Implementation should ensure complete session cleanup on server side.
   * 
   * @throws AuthenticationError if logout operation fails
   */
  logout(): Promise<void>;
}

/**
 * Type guard to check if an object implements AuthProvider interface
 */
export function isAuthProvider(obj: unknown): obj is AuthProvider {
  return obj &&
    typeof obj.getCurrentUser === 'function' &&
    typeof obj.isAuthenticated === 'function' &&
    typeof obj.login === 'function' &&
    typeof obj.logout === 'function';
}

// Re-export exception for convenience
export { AuthenticationError } from './exceptions/AuthenticationExceptions';