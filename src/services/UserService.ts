/**
 * User Service - Account Management and User Context
 * 
 * Provides user account management functionality for multi-tenant scenarios.
 * Uses composition to work with AuthService for authentication concerns.
 * 
 * Design Principles:
 * - Single Responsibility: Only handles user account management
 * - Composition over Inheritance: Uses AuthService instead of extending it
 * - Clean Separation: Authentication vs Account Management
 * - Dependency Injection: AuthService and SessionAuthProvider injected
 * 
 * Service Registration:
 * - Registered with key 'user' in LayoutContext
 * - Depends on AuthService ('auth') and SessionAuthProvider services
 * - Publishes account.switched events on account context changes
 */

import { BaseService } from './BaseService';
import { SessionAuthProvider, Account } from '../auth/SessionAuthProvider';
import { MockSessionAuthProvider } from '../auth/MockSessionAuthProvider';
import { AuthService } from '../auth/AuthService';
import { AuthenticatedUser } from '../auth/AuthenticatedUser';
import { AuthenticationError } from '../auth/exceptions/AuthenticationExceptions';
import { ServiceReference, ServiceReferenceConfig } from './ServiceReference';
import type { LayoutContext } from '../contexts/LayoutContext';
import type { ServiceConfig } from '../interfaces/Service';
import { SelfIdentifyingService, ServiceIdentity, validateServiceIdentity } from '../core/ServiceIdentity';

/**
 * User service configuration
 */
export interface UserServiceConfig extends ServiceConfig {
  /** AuthService service ID (default: uses AuthService.SERVICE_ID) */
  authServiceId?: string;
  /** SessionAuthProvider service ID (default: uses MockSessionAuthProvider.SERVICE_ID) */
  sessionAuthProviderServiceId?: string;
}

/**
 * User account management service implementation
 * 
 * Handles user account operations independent of core authentication.
 * Works alongside AuthService using composition pattern.
 */
export class UserService extends BaseService implements SelfIdentifyingService {
  // 🎯 SELF-DECLARED IDENTITY CONSTANTS
  static readonly SERVICE_ID = 'user.service' as const;
  static readonly SERVICE_DESCRIPTION = 'User account management service - handles multi-tenant account operations';
  static readonly SERVICE_DEPENDENCIES = [
    AuthService.SERVICE_ID,
    MockSessionAuthProvider.SERVICE_ID
  ] as const;
  private readonly userServiceConfig: Required<UserServiceConfig>;
  private authService: AuthService | null = null;
  private sessionAuthProvider: SessionAuthProvider | null = null;
  
  constructor(context: LayoutContext, config: UserServiceConfig = {}) {
    super(context, config);
    
    this.userServiceConfig = {
      autoInit: true,
      allowReplace: false,
      initTimeout: 5000,
      authServiceId: AuthService.SERVICE_ID,                          // Type-safe reference!
      sessionAuthProviderServiceId: MockSessionAuthProvider.SERVICE_ID, // Type-safe reference!
      ...config,
    };
    
    // Validate this service implements required identity interface
    validateServiceIdentity(UserService, this);
    
    this.log('👤', 'UserService created', {
      serviceId: UserService.SERVICE_ID,
      authServiceId: this.userServiceConfig.authServiceId,
      sessionAuthProviderServiceId: this.userServiceConfig.sessionAuthProviderServiceId,
      dependencies: UserService.SERVICE_DEPENDENCIES
    });
  }
  
  /**
   * Get service identifier for registration
   */
  getServiceId(): string {
    return UserService.SERVICE_ID;
  }
  
  /**
   * Get current authenticated user (delegates to AuthService)
   */
  getCurrentUser(): AuthenticatedUser | null {
    if (!this.authService) {
      this.log('⚠️', 'AuthService not available - returning null');
      return null;
    }
    return this.authService.getCurrentUser();
  }
  
  /**
   * Check if user is currently authenticated (delegates to AuthService)
   */
  isAuthenticated(): boolean {
    if (!this.authService) {
      return false;
    }
    return this.authService.isAuthenticated();
  }
  
  /**
   * Validate authentication (delegates to AuthService)
   */
  async validateAuthentication(operation: string = 'validation'): Promise<AuthenticatedUser> {
    if (!this.authService) {
      throw new AuthenticationError('AuthService not available - service may not be initialized');
    }
    return this.authService.validateAuthentication(operation);
  }
  
  /**
   * Get available accounts for current authenticated user
   * 
   * @returns Promise<Account[]> - array of available accounts
   * @throws AuthenticationError if not authenticated or retrieval fails
   */
  async getAccounts(): Promise<Account[]> {
    if (!this.sessionAuthProvider) {
      throw new AuthenticationError('SessionAuthProvider not available - service may not be initialized');
    }
    
    if (!this.isAuthenticated()) {
      throw new AuthenticationError('User not authenticated - cannot retrieve accounts');
    }
    
    this.log('📋', 'Retrieving user accounts...');
    
    try {
      const accounts = await this.sessionAuthProvider.getAccounts();
      this.log('✅', 'Accounts retrieved successfully', { accountCount: accounts.length });
      return accounts;
    } catch (error) {
      const authError = error instanceof AuthenticationError 
        ? error 
        : new AuthenticationError('Failed to retrieve accounts', error as Error);
      
      this.log('❌', 'Account retrieval failed', { error: authError.message });
      throw authError;
    }
  }
  
  /**
   * Switch to a different account context
   * 
   * @param accountId - ID of the account to switch to
   * @throws AuthenticationError if not authenticated or switch fails
   */
  async switchAccount(accountId: number): Promise<void> {
    if (!this.sessionAuthProvider) {
      throw new AuthenticationError('SessionAuthProvider not available - service may not be initialized');
    }
    
    if (!this.isAuthenticated()) {
      throw new AuthenticationError('User not authenticated - cannot switch accounts');
    }
    
    this.log('🔄', 'Switching account...', { accountId });
    
    try {
      await this.sessionAuthProvider.switchAccount(accountId);
      
      // Notify AuthService to refresh authentication with new account context
      if (this.authService) {
        await this.authService.validateAuthentication('account-switch');
      }
      
      // Publish account switched event
      this.publishAccountSwitchedEvent(accountId);
      
      this.log('✅', 'Account switch successful', { accountId });
    } catch (error) {
      const authError = error instanceof AuthenticationError 
        ? error 
        : new AuthenticationError('Account switch failed', error as Error);
      
      this.log('❌', 'Account switch failed', { accountId, error: authError.message });
      throw authError;
    }
  }
  
  /**
   * Get current active account ID
   * 
   * @returns Promise<number | null> - current account ID or null
   */
  async getCurrentAccountId(): Promise<number | null> {
    if (!this.sessionAuthProvider) {
      return null;
    }
    
    try {
      return await this.sessionAuthProvider.getCurrentAccountId();
    } catch (error) {
      this.log('⚠️', 'Failed to get current account ID', { error });
      return null;
    }
  }
  
  /**
   * Publish account switched event
   */
  private publishAccountSwitchedEvent(accountId: number): void {
    try {
      const eventBus = this.getEventBus();
      
      if (typeof eventBus.publish === 'function') {
        eventBus.publish('account.switched', { 
          accountId, 
          timestamp: new Date().toISOString(),
          serviceId: UserService.SERVICE_ID
        });
        
        this.log('📡', 'Published account switched event', { accountId });
      } else {
        this.log('❌', 'EventBus.publish method not available');
      }
    } catch (error) {
      this.log('❌', 'Failed to publish account switched event', { error });
      // Don't throw - event publication failure shouldn't break account switching
    }
  }
  
  // BaseService template method implementations
  
  /**
   * Initialize UserService - resolve dependencies using their SERVICE_ID constants
   */
  protected async onInit(): Promise<void> {
    this.log('🚀', 'Initializing UserService...');
    
    // Resolve AuthService dependency using its SERVICE_ID
    const authServiceId = this.userServiceConfig.authServiceId;
    this.authService = this.getService<AuthService>(authServiceId);
    
    if (!this.authService) {
      throw new Error(
        `AuthService '${authServiceId}' not found in LayoutContext. ` +
        `Available services: [${this.getContext().getServiceNames().join(', ')}]`
      );
    }
    
    // Resolve SessionAuthProvider dependency using its SERVICE_ID
    const sessionAuthProviderServiceId = this.userServiceConfig.sessionAuthProviderServiceId;
    const sessionAuthProviderService = this.getService(sessionAuthProviderServiceId);
    if (sessionAuthProviderService && 'getAccounts' in sessionAuthProviderService && 'switchAccount' in sessionAuthProviderService) {
      this.sessionAuthProvider = sessionAuthProviderService as any as SessionAuthProvider;
    } else {
      this.sessionAuthProvider = null;
    }
    
    if (!this.sessionAuthProvider) {
      throw new Error(
        `SessionAuthProvider '${sessionAuthProviderServiceId}' not found in LayoutContext. ` +
        `Available services: [${this.getContext().getServiceNames().join(', ')}]`
      );
    }
    
    this.log('✅', 'Dependencies resolved', { 
      authServiceId,
      sessionAuthProviderServiceId
    });
    
    this.log('✅', 'UserService initialized successfully');
  }
  
  /**
   * Cleanup UserService resources
   */
  protected async onDestroy(): Promise<void> {
    this.log('🧹', 'Destroying UserService...');
    
    // Clear references
    this.authService = null;
    this.sessionAuthProvider = null;
    
    this.log('✅', 'UserService destroyed successfully');
  }
  
  /**
   * Get a ServiceReference for safely accessing registered UserService
   * 
   * @param context - The LayoutContext to resolve from
   * @param config - Optional configuration for the ServiceReference
   * @returns ServiceReference<UserService> for lazy resolution
   * 
   * @example
   * ```typescript
   * const userServiceRef = UserService.getRegisteredReference(layoutContext);
   * const userService = await userServiceRef.get(); // Returns UserService | null
   * if (userService) {
   *   const accounts = await userService.getAccounts();
   * }
   * ```
   */
  static getRegisteredReference(
    context: LayoutContext,
    config?: ServiceReferenceConfig
  ): ServiceReference<UserService> {
    return new ServiceReference<UserService>(
      context,
      UserService.SERVICE_ID, // Uses own static constant
      config
    );
  }
}