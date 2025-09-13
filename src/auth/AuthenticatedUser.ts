/**
 * AuthenticatedUser - Extended User with Authentication Context
 * 
 * Extends the base User type with authentication-specific information
 * including account context for multi-tenant scenarios.
 * 
 * Design Notes:
 * - Supports current session-based authentication with account switching
 * - Provides authentication context that base User type doesn't include  
 * - Used in authentication events and service communication
 */

import { User } from '../types';

/**
 * Extended user class with authentication context
 * 
 * Represents a successfully authenticated user with additional
 * authentication-specific information such as account context.
 */
export class AuthenticatedUser {
  /** Base user information */
  public readonly id: number;
  public readonly username: string;
  public readonly email: string;
  public readonly role: string;
  public readonly created: Date;
  public readonly lastLogin?: Date;
  
  /** Authentication context */
  public readonly accountId?: number;
  public readonly authenticatedAt: Date;
  
  /**
   * Create an authenticated user instance
   * 
   * @param user - Base user information from authentication response
   * @param accountId - Optional current account context ID
   * @param authenticatedAt - When this authentication occurred (defaults to now)
   */
  constructor(
    user: User, 
    accountId?: number, 
    authenticatedAt: Date = new Date()
  ) {
    // Copy base user properties
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.role = user.role;
    this.created = user.created;
    this.lastLogin = user.lastLogin;
    
    // Add authentication context
    this.accountId = accountId;
    this.authenticatedAt = authenticatedAt;
  }
  
  /**
   * Get base User object (without authentication context)
   * 
   * @returns User - base user information
   */
  toUser(): User {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      created: this.created,
      lastLogin: this.lastLogin
    };
  }
  
  /**
   * Check if user has account context
   * 
   * @returns boolean - true if accountId is set
   */
  hasAccountContext(): boolean {
    return this.accountId !== undefined;
  }
  
  /**
   * Create AuthenticatedUser from authentication response data
   * 
   * @param authResponse - Response from authentication service (e.g., validateUser)
   * @returns AuthenticatedUser instance
   */
  static fromAuthResponse(authResponse: {
    userInfo: User;
    accountId?: number;
  }): AuthenticatedUser {
    return new AuthenticatedUser(
      authResponse.userInfo,
      authResponse.accountId
    );
  }
  
  /**
   * Type guard to check if an object is an AuthenticatedUser
   */
  static isAuthenticatedUser(obj: any): obj is AuthenticatedUser {
    return obj instanceof AuthenticatedUser ||
           (obj && 
            typeof obj.id === 'number' &&
            typeof obj.username === 'string' &&
            typeof obj.email === 'string' &&
            obj.authenticatedAt instanceof Date);
  }
}