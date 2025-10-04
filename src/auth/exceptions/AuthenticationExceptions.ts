/**
 * Authentication Exception Hierarchy
 * 
 * Provides structured exception handling for authentication operations.
 * Designed to be simple and focused on basic error identification.
 * 
 * Design Principles:
 * - Keep exception hierarchy simple in this initial implementation
 * - Focus on clear error identification rather than granular error types
 * - Provide cause chaining for debugging complex error scenarios
 * - Mark: Extend with more specific exception types as needed in future
 * 
 * @example
 * ```typescript
 * try {
 *   const user = await authProvider.getCurrentUser();
 * } catch (error) {
 *   if (error instanceof AuthenticationError) {
 *     console.error('Auth failed:', error.message);
 *     if (error.cause) {
 *       console.error('Root cause:', error.cause);
 *     }
 *   }
 * }
 * ```
 */

/**
 * Base authentication error class
 * 
 * All authentication-related errors should extend this base class.
 * Provides consistent error identification and optional cause chaining.
 */
export class AuthenticationError extends Error {
  /**
   * Create a new authentication error
   * 
   * @param message - Human-readable error description
   * @param cause - Optional underlying error that caused this authentication failure
   */
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AuthenticationError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthenticationError.prototype);
    
    // Preserve stack trace from underlying cause if available
    if (cause && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
  
  /**
   * Create an authentication error from another error
   * 
   * @param cause - The underlying error to wrap
   * @param message - Optional custom message (defaults to cause message)
   */
  static from(cause: Error, message?: string): AuthenticationError {
    return new AuthenticationError(
      message || `Authentication failed: ${cause.message}`,
      cause
    );
  }
  
  /**
   * Check if an error is authentication-related
   * 
   * @param error - Error to check
   * @returns true if error is an AuthenticationError or has auth-related cause
   */
  static isAuthenticationError(error: unknown): error is AuthenticationError {
    return error instanceof AuthenticationError ||
           (error !== null && typeof error === 'object' && (error as any)?.name === 'AuthenticationError') ||
           (error !== null && typeof error === 'object' && (error as any)?.cause instanceof AuthenticationError);
  }
}

/**
 * Type guard function for authentication errors
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return AuthenticationError.isAuthenticationError(error);
}

/**
 * Helper function to create authentication errors with consistent formatting
 */
export function createAuthenticationError(
  operation: string,
  details?: string,
  cause?: Error
): AuthenticationError {
  const message = details 
    ? `${operation} failed: ${details}`
    : `${operation} failed`;
  
  return new AuthenticationError(message, cause);
}

// Common authentication error factory functions for consistency
export const AuthErrors = {
  /**
   * User is not authenticated
   */
  notAuthenticated: (details?: string) => 
    createAuthenticationError('Authentication check', details || 'User not authenticated'),
  
  /**
   * Login operation failed
   */
  loginFailed: (details?: string, cause?: Error) =>
    createAuthenticationError('Login', details || 'Login operation failed', cause),
  
  /**
   * Logout operation failed  
   */
  logoutFailed: (details?: string, cause?: Error) =>
    createAuthenticationError('Logout', details || 'Logout operation failed', cause),
  
  /**
   * User validation/retrieval failed
   */
  userValidationFailed: (details?: string, cause?: Error) =>
    createAuthenticationError('User validation', details || 'Failed to validate user', cause),
    
  /**
   * Account operation failed
   */
  accountOperationFailed: (operation: string, details?: string, cause?: Error) =>
    createAuthenticationError(`Account ${operation}`, details, cause)
} as const;