/**
 * Session-Based Authentication Provider Interface
 *
 * Extends the core AuthProvider interface with session-specific functionality
 * including account management capabilities for multi-tenant scenarios.
 *
 * Design Notes:
 * - Supports multi-account access for users with multiple organization contexts
 * - Account data sourced from server session (similar to validateUser response)
 * - Account switching affects server-side session state
 * - Mark: Rethink account separation strategy in future iterations
 *
 * @example
 * ```typescript
 * const sessionProvider: SessionAuthProvider = new SessionAuthProviderImpl();
 *
 * try {
 *   const accounts = await sessionProvider.getAccounts();
 *   console.log('Available accounts:', accounts.length);
 *
 *   if (accounts.length > 1) {
 *     await sessionProvider.switchAccount(accounts[1].id);
 *     console.log('Switched to account:', accounts[1].name);
 *   }
 * } catch (error) {
 *   console.error('Account operation failed:', error);
 * }
 * ```
 */

import { AuthProvider } from "./AuthProvider";

/**
 * Account information structure
 *
 * Represents an organizational context that a user can access.
 * Maps to the accounts array returned by OpinionService.validateUser().
 */
export interface Account {
  /** Unique account identifier */
  id: number;
  /** Human-readable account name */
  name: string;
}

/**
 * Session-based authentication provider interface
 *
 * Extends core AuthProvider with account management functionality.
 * Designed for session-based authentication systems where users can
 * access multiple organizational contexts.
 */
export interface SessionAuthProvider extends AuthProvider {
  /**
   * Get available accounts for current authenticated user
   *
   * Returns the list of organizational contexts/accounts that the
   * current user has access to. This data is typically sourced from
   * the server session or authentication response.
   *
   * @returns Promise<Account[]> - array of available accounts
   * @throws AuthenticationError if not authenticated
   * @throws AuthenticationError if account retrieval fails
   */
  getAccounts(): Promise<Account[]>;

  /**
   * Switch to a different account context
   *
   * Changes the active account/organizational context for the current session.
   * This typically involves a server-side session update to reflect the new
   * active account context.
   *
   * @param accountId - ID of the account to switch to
   * @throws AuthenticationError if not authenticated
   * @throws AuthenticationError if account switch fails (invalid ID, access denied, etc.)
   */
  switchAccount(accountId: number): Promise<void>;

  /**
   * Get current active account ID
   *
   * Returns the ID of the currently active account context, or null if
   * no account context is set or if the user has access to only one account.
   *
   * @returns Promise<number | null> - current account ID or null
   */
  getCurrentAccountId(): Promise<number | null>;
}

/**
 * Type guard to check if an AuthProvider implements SessionAuthProvider interface
 */
export function isSessionAuthProvider(
  obj: AuthProvider,
): obj is SessionAuthProvider {
  return (
    "getAccounts" in obj &&
    "switchAccount" in obj &&
    "getCurrentAccountId" in obj &&
    typeof (obj as unknown as SessionAuthProvider).getAccounts === "function" &&
    typeof (obj as unknown as SessionAuthProvider).switchAccount === "function" &&
    typeof (obj as unknown as SessionAuthProvider).getCurrentAccountId === "function"
  );
}

// Re-export core types for convenience
export { AuthenticationError } from "./AuthProvider";
export type { AuthProvider } from "./AuthProvider";
