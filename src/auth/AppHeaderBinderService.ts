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
import { AuthService } from './AuthService';
import { AUTH_EVENTS, UserAuthenticatedPayload } from './AuthEvents';
import { AuthenticatedUser } from './AuthenticatedUser';
import { AuthenticationError } from './exceptions/AuthenticationExceptions';
import { AppHeader, HeaderUser } from '../components/AppHeader';
import { UserMenu } from '../components/UserMenu';
import type { Consumer } from '../lib/EventBus';
import type { LayoutContext } from '../contexts/LayoutContext';
import type { ServiceConfig } from '../interfaces/Service';

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
export class AppHeaderBinderService extends BaseService {
  private readonly binderConfig: Required<AppHeaderBinderServiceConfig>;
  private authService: AuthService | null = null;
  private appHeader: AppHeader | null = null;
  private eventConsumer: Consumer | null = null;
  
  constructor(context: LayoutContext, config: AppHeaderBinderServiceConfig = {}) {
    super(context, config);
    
    this.binderConfig = {
      autoInit: true,
      allowReplace: false,
      initTimeout: 5000,
      authServiceName: 'auth',
      updateOnInit: true,
      ...config,
    };
    
    this.log('🔗', 'AppHeaderBinderService created', { 
      authServiceName: this.binderConfig.authServiceName,
      updateOnInit: this.binderConfig.updateOnInit
    });
  }
  
  /**
   * Get service identifier for registration
   */
  getServiceId(): string {
    return 'appHeaderBinder';
  }
  
  /**
   * Update AppHeader with current authentication state
   * 
   * @param force - Force update even if no authenticated user
   */
  async updateAppHeader(force: boolean = false): Promise<void> {
    if (!this.appHeader) {
      this.log('⚠️', 'AppHeader not available - cannot update UI');
      return;
    }
    
    if (!this.authService) {
      this.log('⚠️', 'AuthService not available - cannot get authentication state');
      return;
    }
    
    const authenticatedUser = this.authService.getCurrentUser();
    
    if (authenticatedUser) {
      this.updateAppHeaderWithUser(authenticatedUser);
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
    if (!this.authService) {
      this.log('❌', 'AuthService not available - cannot perform logout');
      return;
    }
    
    this.log('🚪', 'Handling logout action from UI...');
    
    try {
      await this.authService.logout();
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
  private handleUserAuthenticated(payload: UserAuthenticatedPayload): void {
    this.log('📥', 'Received user authenticated event', { 
      userId: payload.user.id,
      username: payload.user.username,
      operation: payload.operation,
      accountId: payload.user.accountId
    });
    
    try {
      this.updateAppHeaderWithUser(payload.user);
    } catch (error) {
      this.log('❌', 'Failed to update AppHeader with authenticated user', { error });
    }
  }
  
  /**
   * Update AppHeader and UserMenu with authenticated user data
   */
  private updateAppHeaderWithUser(authenticatedUser: AuthenticatedUser): void {
    if (!this.appHeader) {
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
      this.appHeader.updateUser(headerUser);
      
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
   * Resolve AppHeader component from LayoutContext
   */
  private resolveAppHeader(): void {
    // Try to get AppHeader from LayoutContext (registered components)
    // Note: This depends on how AppHeader is registered in the system
    
    // Method 1: Try to get from LayoutContext component registry (if exists)
    const layoutContext = this.getContext();
    if (typeof layoutContext.getHeader === 'function') {
      this.appHeader = layoutContext.getHeader() as AppHeader;
      this.log('✅', 'AppHeader resolved from LayoutContext.getHeader()');
      return;
    }
    
    // Method 2: Try to get from service registry (if AppHeader is registered as service)
    const appHeaderService = this.getService<AppHeader>('appHeader');
    if (appHeaderService) {
      this.appHeader = appHeaderService;
      this.log('✅', 'AppHeader resolved from service registry');
      return;
    }
    
    // Method 3: Could try DOM-based approach as fallback
    this.log('⚠️', 'AppHeader not found in LayoutContext - will try to resolve later');
    this.appHeader = null;
  }
  
  /**
   * Setup user action handlers for UserMenu
   */
  private setupUserActionHandlers(): void {
    if (!this.appHeader) {
      this.log('⚠️', 'AppHeader not available - cannot setup user action handlers');
      return;
    }
    
    // Set up UserMenu handler for logout actions
    this.appHeader.setUserMenuHandler((userMenu: UserMenu) => {
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
    
    // Resolve AuthService dependency
    const authServiceName = this.binderConfig.authServiceName;
    this.authService = this.getService<AuthService>(authServiceName);
    
    if (!this.authService) {
      throw new AuthenticationError(
        `AuthService '${authServiceName}' not found in LayoutContext. ` +
        `Available services: [${this.getContext().getServiceNames().join(', ')}]`
      );
    }
    
    this.log('✅', 'AuthService resolved', { 
      authServiceName,
      authServiceId: this.authService.getServiceId()
    });
    
    // Resolve AppHeader component
    this.resolveAppHeader();
    
    // Subscribe to authentication events
    this.subscribeToAuthEvents();
    
    // Setup user action handlers
    this.setupUserActionHandlers();
    
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
    
    // Clear references
    this.authService = null;
    this.appHeader = null;
    
    this.log('✅', 'AppHeaderBinderService destroyed successfully');
  }
}