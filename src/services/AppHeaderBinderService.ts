/**
 * AppHeader Binder Service - UI Authentication Integration
 * 
 * Bridges the gap between authentication services and UI components by subscribing
 * to authentication events and updating AppHeader/UserMenu with real user data.
 * Also handles user action delegation back to authentication services.
 * 
 * Design Principles:
 * - Extends BaseService for LayoutContext integration and lifecycle management
 * - Subscribes to AuthService events via EventBus.consume()
 * - Updates UI components with authentication state changes
 * - Delegates user actions (logout) back to AuthService
 * - No authentication logic - pure UI data binding and event handling
 * 
 * Service Registration:
 * - Registered with key 'appHeaderBinder' in LayoutContext
 * - Depends on AuthService ('auth' or 'session-auth') and AppHeader component
 * - Consumes user.authenticated events from EventBus
 */

import { BaseService } from '../services/BaseService';
import { AuthService } from '../auth/AuthService';
import { AUTH_EVENTS, UserAuthenticatedPayload } from '../auth/AuthEvents';
import { AuthenticatedUser } from '../auth/AuthenticatedUser';
import { AuthenticationError } from '../auth/exceptions/AuthenticationExceptions';
import { ServiceReference, ServiceReferenceConfig } from './ServiceReference';
import { ComponentReference } from '../components/ComponentReference';
import { AppHeader, HeaderUser, AppHeaderRef } from '../components/AppHeader';
import { UserMenu } from '../components/UserMenu';
import type { Consumer } from '../lib/EventBus';
import type { LayoutContext } from '../contexts/LayoutContext';
import type { ServiceConfig } from '../interfaces/Service';
import { SelfIdentifyingService, ServiceIdentity, validateServiceIdentity } from '../core/ServiceIdentity';

/**
 * AppHeader binder service configuration
 */
export interface AppHeaderBinderServiceConfig extends ServiceConfig {
  /** AuthService name to resolve from LayoutContext (default: 'auth') */
  authServiceName?: string;
  /** Whether to immediately update UI on service initialization (default: true) */
  updateOnInit?: boolean;
}

/**
 * AppHeader binder service implementation
 * 
 * Provides UI binding between authentication services and AppHeader components.
 * Handles event subscription, UI updates, and user action delegation.
 */
export class AppHeaderBinderService extends BaseService implements SelfIdentifyingService {
  // 🎯 SELF-DECLARED IDENTITY CONSTANTS
  static readonly SERVICE_ID = 'auth.header-binder' as const;
  static readonly SERVICE_DESCRIPTION = 'Authentication UI binding service - bridges AuthService and AppHeader component';
  static readonly SERVICE_DEPENDENCIES = [
    AuthService.SERVICE_ID
  ] as const;
  private readonly binderConfig: Required<AppHeaderBinderServiceConfig>;
  private authServiceRef: ServiceReference<AuthService>;
  private appHeaderRef: ComponentReference<AppHeader>;
  private eventConsumer: Consumer | null = null;
  
  constructor(
    authServiceRef: ServiceReference<AuthService>,
    context: LayoutContext,
    config: AppHeaderBinderServiceConfig = {}
  ) {
    const finalConfig = {
      autoInit: true,
      allowReplace: false,
      initTimeout: 5000,
      authServiceName: 'auth',
      updateOnInit: true,
      ...config,
    };
    
    super(context, finalConfig);
    
    this.binderConfig = finalConfig;
    
    // Store service reference for AuthService
    this.authServiceRef = authServiceRef;
    
    // Initialize ComponentReference for AppHeader
    this.appHeaderRef = AppHeaderRef.getRegisteredReference(context, {
      enableLogging: false, // Disable logging now that issue is resolved
      retryInterval: 100,
      maxRetries: 50 // Keep higher retry count for robustness
    });
    
    // Validate this service implements required identity interface
    validateServiceIdentity(AppHeaderBinderService, this);
    
    this.log('🔗', 'AppHeaderBinderService created', { 
      serviceId: AppHeaderBinderService.SERVICE_ID,
      authServiceName: this.binderConfig.authServiceName,
      updateOnInit: this.binderConfig.updateOnInit,
      dependencies: AppHeaderBinderService.SERVICE_DEPENDENCIES
    });
  }
  
  /**
   * Get service identifier for registration
   */
  getServiceId(): string {
    return AppHeaderBinderService.SERVICE_ID;
  }
  
  /**
   * Update AppHeader with current authentication state
   * 
   * @param force - Force update even if no authenticated user
   */
  async updateAppHeader(force: boolean = false): Promise<void> {
    const appHeader = await this.appHeaderRef.get();
    if (!appHeader) {
      this.log('⚠️', 'AppHeader not available - cannot update UI');
      return;
    }
    
    const authService = await this.authServiceRef.get();
    if (!authService) {
      this.log('⚠️', 'AuthService not available - cannot get authentication state');
      return;
    }
    
    const authenticatedUser = authService.getCurrentUser();
    
    if (authenticatedUser) {
      await this.updateAppHeaderWithUser(authenticatedUser);
    } else if (force) {
      this.log('⚠️', 'No authenticated user available for AppHeader update');
      // Could set default/guest state here if needed
    }
  }
  
  /**
   * Handle user logout action from UI
   * Delegates to AuthService for actual logout operation
   */
  async handleLogoutAction(): Promise<void> {
    const authService = await this.authServiceRef.get();
    if (!authService) {
      this.log('❌', 'AuthService not available - cannot perform logout');
      return;
    }
    
    this.log('🚺', 'Handling logout action from UI...');
    
    try {
      await authService.logout();
      this.log('✅', 'Logout action completed successfully');
    } catch (error) {
      this.log('❌', 'Logout action failed', { error });
      
      // Could show user-friendly error message here
      console.error('Logout failed:', error);
    }
  }
  
  // Private helper methods
  
  /**
   * Subscribe to authentication events from EventBus
   */
  private subscribeToAuthEvents(): void {
    const eventBus = this.getEventBus();
    
    if (typeof eventBus.consume !== 'function') {
      this.log('❌', 'EventBus.consume method not available - cannot subscribe to auth events');
      return;
    }
    
    try {
      this.eventConsumer = eventBus.consume(
        AUTH_EVENTS.USER_AUTHENTICATED,
        (payload: UserAuthenticatedPayload) => this.handleUserAuthenticated(payload)
      );
      
      this.log('📡', 'Subscribed to authentication events', { 
        event: AUTH_EVENTS.USER_AUTHENTICATED,
        hasConsumer: this.eventConsumer !== null
      });
    } catch (error) {
      this.log('❌', 'Failed to subscribe to authentication events', { error });
    }
  }
  
  /**
   * Handle user authenticated event from AuthService
   */
  private async handleUserAuthenticated(payload: UserAuthenticatedPayload): Promise<void> {
    this.log('📥', 'Received user authenticated event', { 
      userId: payload.user.id,
      username: payload.user.username,
      operation: payload.operation,
      accountId: payload.user.accountId
    });
    
    try {
      await this.updateAppHeaderWithUser(payload.user);
    } catch (error) {
      this.log('❌', 'Failed to update AppHeader with authenticated user', { error });
    }
  }
  
  /**
   * Update AppHeader and UserMenu with authenticated user data
   */
  private async updateAppHeaderWithUser(authenticatedUser: AuthenticatedUser): Promise<void> {
    const appHeader = await this.appHeaderRef.get();
    if (!appHeader) {
      this.log('⚠️', 'AppHeader not available - skipping UI update');
      return;
    }
    
    // Convert AuthenticatedUser to HeaderUser format for AppHeader
    const headerUser: HeaderUser = {
      username: authenticatedUser.username,
      email: authenticatedUser.email,
      avatar: undefined // Could be extended in the future
    };
    
    try {
      appHeader.updateUser(headerUser);
      
      this.log('✅', 'AppHeader updated with authenticated user', {
        userId: authenticatedUser.id,
        username: authenticatedUser.username,
        email: authenticatedUser.email,
        accountId: authenticatedUser.accountId
      });
    } catch (error) {
      this.log('❌', 'Failed to update AppHeader with user data', { error });
    }
  }
  
  /**
   * Unsubscribe from authentication events
   */
  private unsubscribeFromAuthEvents(): void {
    if (this.eventConsumer) {
      try {
        this.eventConsumer.unregister();
        this.log('📡', 'Unsubscribed from authentication events');
      } catch (error) {
        this.log('❌', 'Failed to unsubscribe from authentication events', { error });
      } finally {
        this.eventConsumer = null;
      }
    }
  }
  
  
  /**
   * Setup user action handlers for UserMenu
   */
  private async setupUserActionHandlers(): Promise<void> {
    const appHeader = await this.appHeaderRef.get();
    if (!appHeader) {
      this.log('⚠️', 'AppHeader not available - cannot setup user action handlers');
      return;
    }
    
    // Set up UserMenu handler for logout actions
    appHeader.setUserMenuHandler((userMenu: UserMenu) => {
      this.log('🔧', 'Setting up UserMenu action handlers');
      
      // Note: This is a conceptual approach - actual implementation 
      // depends on how UserMenu exposes action handling
      // 
      // Option 1: UserMenu could emit events that we subscribe to
      // Option 2: UserMenu could accept action handlers 
      // Option 3: We could use DOM event delegation
      
      // For now, we'll document this as a integration point
      this.log('📝', 'UserMenu action handlers setup - integration point for logout actions');
    });
  }
  
  // BaseService template method implementations
  
  /**
   * Initialize AppHeaderBinderService - resolve dependencies and setup event subscription
   */
  protected async onInit(): Promise<void> {
    this.log('🚀', 'Initializing AppHeaderBinderService...');
    
    // Test AuthService dependency via ServiceReference
    const authService = await this.authServiceRef.get();
    if (!authService) {
      throw new AuthenticationError(
        `AuthService could not be resolved via ServiceReference. ` +
        `Check that AuthService is properly registered in LayoutContext.`
      );
    }
    
    this.log('✅', 'AuthService resolved', { 
      authServiceId: authService.getServiceId()
    });
    
    // Subscribe to authentication events
    this.subscribeToAuthEvents();
    
    // Setup user action handlers
    await this.setupUserActionHandlers();
    
    // Update UI with current authentication state if configured
    if (this.binderConfig.updateOnInit) {
      await this.updateAppHeader(false);
    }
    
    this.log('✅', 'AppHeaderBinderService initialized successfully');
  }
  
  /**
   * Cleanup AppHeaderBinderService resources
   */
  protected async onDestroy(): Promise<void> {
    this.log('🧹', 'Destroying AppHeaderBinderService...');
    
    // Unsubscribe from events
    this.unsubscribeFromAuthEvents();
    
    // ComponentReference will be cleaned up automatically
    
    this.log('✅', 'AppHeaderBinderService destroyed successfully');
  }
  
  /**
   * Get a ServiceReference for safely accessing registered AppHeaderBinderService
   * 
   * @param context - The LayoutContext to resolve from
   * @param config - Optional configuration for the ServiceReference
   * @returns ServiceReference<AppHeaderBinderService> for lazy resolution
   * 
   * @example
   * ```typescript
   * const binderRef = AppHeaderBinderService.getRegisteredReference(layoutContext);
   * const binder = await binderRef.get(); // Returns AppHeaderBinderService | null
   * if (binder) {
   *   await binder.handleLogoutAction();
   * }
   * ```
   */
  static getRegisteredReference(
    context: LayoutContext,
    config?: ServiceReferenceConfig
  ): ServiceReference<AppHeaderBinderService> {
    return new ServiceReference<AppHeaderBinderService>(
      context,
      'auth.header-binder', // Standard service key for AppHeaderBinderService
      config
    );
  }
}
