/**
 * Session Authentication Service - Extended Authentication with Account Management
 * 
 * Extends the base AuthService with session-specific capabilities including
 * multi-tenant account management and account switching functionality.
 * 
 * Design Principles:
 * - Extends AuthService for core authentication functionality
 * - Adds account context management for multi-tenant scenarios  
 * - Works specifically with SessionAuthProvider implementations
 * - Maintains clean separation between core auth and session features
 * 
 * Service Registration:
 * - Registered with key 'auth' in LayoutContext (replaces base AuthService)
 * - Depends on SessionAuthProvider service ('authProvider')
 * - Publishes user.authenticated events with account context
 */

import { AuthService, AuthServiceConfig } from './AuthService';
import { SessionAuthProvider, Account } from './SessionAuthProvider';
import { AuthenticatedUser } from './AuthenticatedUser';
import { AUTH_EVENTS, AuthEventFactory } from './AuthEvents';
import { AuthenticationError } from './exceptions/AuthenticationExceptions';
import { User } from '../types';
import type { LayoutContext } from '../contexts/LayoutContext';

/**
 * Session authentication service configuration
 */
export interface SessionAuthServiceConfig extends AuthServiceConfig {
  /** SessionAuthProvider service name (default: 'sessionAuthProvider') */
  sessionAuthProviderServiceName?: string;
}

/**
 * Session-based authentication service implementation
 * 
 * Extends base AuthService with account management capabilities
 * for multi-tenant authentication scenarios.
 */
export class SessionAuthService extends AuthService {
  private sessionAuthProvider: SessionAuthProvider | null = null;
  
  constructor(context: LayoutContext, config: SessionAuthServiceConfig = {}) {
    const mergedConfig: Required<SessionAuthServiceConfig> = {
      autoInit: true,
      allowReplace: false,
      initTimeout: 5000,
      authProviderServiceName: 'sessionAuthProvider', // Different default
      sessionAuthProviderServiceName: 'sessionAuthProvider',
      autoValidate: false,
      ...config,
    };
    
    super(context, mergedConfig);
    
    this.log('🔐', 'SessionAuthService created', { 
      sessionAuthProviderServiceName: mergedConfig.sessionAuthProviderServiceName,
      autoValidate: mergedConfig.autoValidate 
    });
  }
  
  /**
   * Get service identifier for registration
   */
  getServiceId(): string {
    return 'session-auth';
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
      
      // Update current user with new account context
      if (this.currentUser) {
        const updatedUser = new AuthenticatedUser(
          this.currentUser.toUser(),
          accountId,
          new Date() // New authentication timestamp
        );
        this.currentUser = updatedUser;
        
        // Publish event with updated account context
        this.publishUserAuthenticatedEvent(updatedUser, 'account-switch');
      }
      
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
  
  // Protected method overrides for session-specific functionality
  
  /**
   * Create AuthenticatedUser with account context from SessionAuthProvider
   */
  protected async createAuthenticatedUser(user: User): Promise<AuthenticatedUser> {
    // Get account context from SessionAuthProvider if available
    let accountId: number | undefined = undefined;
    
    if (this.sessionAuthProvider) {
      try {
        accountId = await this.sessionAuthProvider.getCurrentAccountId() || undefined;
      } catch (error) {
        this.log('⚠️', 'Failed to get account context during user creation', { error });
        // Continue without account context rather than failing
      }
    }
    
    return new AuthenticatedUser(user, accountId);
  }
  
  /**
   * Override validateAuthentication to use async createAuthenticatedUser
   */
  async validateAuthentication(operation: string = 'validation'): Promise<AuthenticatedUser> {
    if (!this.authProvider) {
      throw new AuthenticationError('AuthProvider not available - service may not be initialized');
    }
    
    this.log('🔍', 'Validating session authentication...', { operation });
    
    try {
      // Get current user from AuthProvider (this validates with server)
      const user: User = await this.authProvider.getCurrentUser();
      
      // Create AuthenticatedUser with session-specific account context
      const authenticatedUser = await this.createAuthenticatedUser(user);
      
      // Update internal state
      this.currentUser = authenticatedUser;
      
      this.log('✅', 'Session authentication validation successful', { 
        userId: user.id,
        username: user.username,
        accountId: authenticatedUser.accountId,
        operation 
      });
      
      // Publish user authenticated event BEFORE returning
      this.publishUserAuthenticatedEvent(authenticatedUser, operation);
      
      return authenticatedUser;
      
    } catch (error) {
      // Clear cached state on authentication failure
      this.currentUser = null;
      
      if (error instanceof AuthenticationError) {
        this.log('❌', 'Session authentication validation failed', { operation, error: error.message });
        throw error;
      } else {
        const authError = new AuthenticationError('Session authentication validation failed', error as Error);
        this.log('❌', 'Session authentication validation failed with unexpected error', { operation, error });
        throw authError;
      }
    }
  }
  
  /**
   * Override publishUserAuthenticatedEvent to include account context
   */
  protected publishUserAuthenticatedEvent(user: AuthenticatedUser, operation: string): void {
    try {
      const event = AuthEventFactory.userAuthenticated(user, operation);
      const eventBus = this.getEventBus();
      
      if (typeof eventBus.publish === 'function') {
        eventBus.publish(AUTH_EVENTS.USER_AUTHENTICATED, event.payload);
        
        this.log('📡', 'Published session user authenticated event', { 
          userId: user.id, 
          accountId: user.accountId,
          operation 
        });
      } else {
        this.log('❌', 'EventBus.publish method not available');
      }
    } catch (error) {
      this.log('❌', 'Failed to publish session user authenticated event', { error });
      // Don't throw - event publication failure shouldn't break authentication
    }
  }
  
  // BaseService template method override
  
  /**
   * Initialize SessionAuthService - resolve SessionAuthProvider dependency
   */
  protected async onInit(): Promise<void> {
    this.log('🚀', 'Initializing SessionAuthService...');
    
    // Resolve SessionAuthProvider from LayoutContext service registry
    const authProviderServiceName = this.authServiceConfig.authProviderServiceName;
    this.authProvider = this.getService<SessionAuthProvider>(authProviderServiceName);
    this.sessionAuthProvider = this.authProvider as SessionAuthProvider;
    
    if (!this.sessionAuthProvider) {
      throw new AuthenticationError(
        `SessionAuthProvider service '${authProviderServiceName}' not found in LayoutContext. ` +
        `Available services: [${this.getContext().getServiceNames().join(', ')}]`
      );
    }
    
    this.log('✅', 'SessionAuthProvider resolved', { 
      authProviderServiceName,
      authProviderId: this.sessionAuthProvider.getServiceId?.() || 'unknown'
    });
    
    // Auto-validate if configured (but don't fail initialization if validation fails)
    if (this.authServiceConfig.autoValidate) {
      try {
        await this.validateAuthentication('initialization');
        this.log('✅', 'Auto-validation successful during initialization');
      } catch (error) {
        this.log('⚠️', 'Auto-validation failed during initialization (continuing)', { error });
        // Don't throw - initialization should continue even if user isn't authenticated
      }
    }
    
    this.log('✅', 'SessionAuthService initialized successfully');
  }
  
  /**
   * Cleanup SessionAuthService resources
   */
  protected async onDestroy(): Promise<void> {
    this.log('🧹', 'Destroying SessionAuthService...');
    
    // Clear session-specific state
    this.sessionAuthProvider = null;
    
    // Call parent cleanup
    await super.onDestroy();
    
    this.log('✅', 'SessionAuthService destroyed successfully');
  }
}