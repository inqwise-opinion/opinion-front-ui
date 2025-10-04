/**
 * Main application class for Opinion Front UI
 * Handles routing and page management with global layout
 */

import { MockApiService } from "./services/MockApiService";
import { AppHeaderImpl } from "./components/AppHeaderImpl";
import AppFooterImpl from "./components/AppFooterImpl";
import { MainContentImpl } from "./components/MainContentImpl";
import Layout from "./components/Layout";
import { AuthService, MockSessionAuthProvider } from "./auth";
import { AppHeaderBinderService } from "./services/AppHeaderBinderService";
import { UserService } from "./services/UserService";
import { registerService } from "./core/ServiceIdentity";
import type { LayoutContext } from "./contexts/LayoutContext";
import { RouterService } from "./router/RouterService";
import { SurveysRouter } from "./router/SurveysRouter";
import { NavigationServiceImpl } from "./services/navigation/NavigationServiceImpl";
import { LoggerFactory } from "./logging/LoggerFactory";
import { MessagesLogAdapter } from "./adapters/MessagesLogAdapter";
import { Logger } from "./logging/Logger";

export class OpinionApp {
  private initialized: boolean = false;
  private apiService: MockApiService;
  private routerService: RouterService | null = null;
  private errorHandler: (ex: Error | unknown) => void;
  private logger: Logger;

  /**
   * Default error handler implementation - private static const that outputs to console
   */
  private static readonly DEFAULT_ERROR_HANDLER = (ex: Error | unknown): void => {
    // Placeholder; constructor overrides with logger-based handler
    const err = ex instanceof Error ? ex : new Error(String(ex));
    // Fallback to console to avoid recursive dependency before logger is ready
    // This will only be used if someone calls OpinionApp.DEFAULT_ERROR_HANDLER directly
    // Normal flow replaces errorHandler in constructor
    console.error('OpinionApp error (default handler):', err);
  };

  // Global layout components
  private appHeader: AppHeaderImpl | null = null;
  private appFooter: AppFooterImpl | null = null;
  private mainContent: MainContentImpl | null = null;
  private layout: Layout | null = null;

  constructor() {
    this.apiService = new MockApiService();
    // Initialize logger for OpinionApp using string name to avoid typescript-logging conflicts
    this.logger = LoggerFactory.getInstance().getLogger('OpinionApp');
    // Default error handler uses logger
    this.errorHandler = (ex: Error | unknown) => {
      const err = ex instanceof Error ? ex : new Error(String(ex));
      this.logger.error('OpinionApp error', err);
    };
  }

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      this.setupEventListeners();
      await this.initializeGlobalLayout();
      this.initialized = true;
    } catch (error) {
      this.handleError(error);
    }
  }

  private setupEventListeners(): void {
    // Handle postMessage events for testing (e.g., from test-positioning.html iframe)
    window.addEventListener("message", (event) => {

      if (event.data && event.data.action) {
        switch (event.data.action) {
          case "showErrorMessage":
            this.handleTestErrorMessage(event.data);
            break;
          case "clearErrorMessages":
            this.handleClearMessages();
            break;
          default:
            this.logger.warn('Unknown postMessage action:', event.data.action);
        }
      }
    });
  }

  /**
   * Initialize global layout components in semantic order (header, main, footer)
   * Note: Sidebar is self-contained and initialized by AppHeader
   */
  private async initializeGlobalLayout(): Promise<void> {
    // Initialize Layout component first (manages CSS classes and coordination)
    this.layout = new Layout();
    
    // Set LayoutContext.fail as the error handler as soon as possible
    this.layout.onContextReady((ctx) => {
      this.setErrorHandler((error) => {
        ctx.fail(error instanceof Error ? error : String(error));
      });
      
      // Integrate LoggerFactory with Messages system
      const messages = ctx.getMessages();
      if (messages) {
        const adapter = new MessagesLogAdapter(messages);
        LoggerFactory.getInstance().messagesConsumer(adapter);
        this.logger.info('LoggerFactory integrated with Messages system');
      } else {
        this.logger.warn('Messages system not available for LoggerFactory integration');
      }
    });

    // Register formal handlers using the new handler system
    await this.layout
      .setContextHandler(
        {
          id: "app-layout-configuration",
          priority: 700, // Lower priority, runs after service registration
          onContextReady: async (context) => {
            await this.configureLayout(context);
          },
        },
        {
          enableLogging: true,
          continueOnError: false, // Layout configuration is critical
          timeout: 5000,
        },
      )
      .setContextHandler(
        {
          id: "app-service-registration",
          priority: 800, // High priority - services must be registered first
          onContextReady: async (context) => {
            await this.registerServices(context);
            await this.validateInitialAuthentication(context);
          },
        },
        {
          enableLogging: true,
          continueOnError: false, // Service registration is critical
          timeout: 15000, // More time for service initialization
        },
      )
      .init();
  }

  /**
   * Register services using the formal handler pattern
   * This method creates a LifecycleHandler for service registration
   */
  private async registerServices(context: LayoutContext): Promise<void> {
    // Create MockSessionAuthProvider instance
    const mockAuthProvider = new MockSessionAuthProvider(this.apiService, {
      authDelay: 300, // Shorter delay for development
      enableAccountSwitching: true,
      mockAccountCount: 3,
    });

    // Register MockSessionAuthProvider using type-safe registration
    registerService(context, MockSessionAuthProvider, mockAuthProvider);

    // Register AuthService using type-safe registration and configuration
    const authService = new AuthService(context, {
      authProviderServiceId: MockSessionAuthProvider.SERVICE_ID, // Type-safe reference!
      autoValidate: false,
    });
    registerService(context, AuthService, authService);
    // Register UserService using type-safe registration and configuration
    const userService = new UserService(context, {
      authServiceId: AuthService.SERVICE_ID, // Type-safe reference!
      sessionAuthProviderServiceId: MockSessionAuthProvider.SERVICE_ID, // Type-safe reference!
    });
    registerService(context, UserService, userService);

    // Register AppHeaderBinderService with type-safe service references
    const authServiceRef = AuthService.getRegisteredReference(context);
    const appHeaderBinderService = new AppHeaderBinderService(
      authServiceRef,
      context,
      { updateOnInit: true },
    );
    // Use self-identifying service ID for registration
    registerService(context, AppHeaderBinderService, appHeaderBinderService);

    // Register NavigationService using service reference pattern
    const navigationService = new NavigationServiceImpl(context);
    registerService(context, NavigationServiceImpl, navigationService);
    
    // Register SurveysRouter as a service
    const surveysRouter = new SurveysRouter(context, 'surveys');
    registerService(context, SurveysRouter, surveysRouter);

    // Initialize services in dependency order (dependencies first)
    await mockAuthProvider.init();
    await authService.init(); // AuthService depends on mockAuthProvider
    await userService.init(); // UserService depends on authService and mockAuthProvider
    await appHeaderBinderService.init(); // AppHeaderBinderService depends on authService
    await navigationService.init(); // Initialize NavigationService
    await surveysRouter.init(); // Initialize SurveysRouter

    // Instantiate and initialize RouterService as part of service registration
    this.routerService = new RouterService(context);
    await this.routerService.init();
  }

  /**
   * Configure layout components using the formal handler pattern
   * This method handles sidebar navigation and user menu setup
   */
  private async configureLayout(context: LayoutContext): Promise<void> {

    // Sync sidebar navigation via NavigationService using ServiceReference for lazy resolution
    try {
      const navServiceRef = NavigationServiceImpl.getRegisteredReference(context);
      const navService = await navServiceRef.get();
      const sidebar = context.getSidebar();
      
      if (!navService) {
        throw new Error("NavigationService not available after registration");
      }
      
      if (!sidebar) {
        throw new Error("Sidebar not available in LayoutContext");
      }
      
      navService.syncWithSidebar(sidebar);
      // Set active item through NavigationService - it will handle sidebar sync
      navService.setActiveItem("debug");
    } catch (error) {
      this.handleError(error);
      throw error; // Re-throw to trigger error handling
    }

    // Setup user menu handler
    context.getHeader()?.setUserMenuHandler((user) => {
      user.updateMenuItems([
        {
          id: "account",
          text: "Account Settings",
          icon: "settings",
          href: "/account",
          type: "link",
        },
        {
          id: "feedback",
          text: "Send Feedback",
          icon: "feedback",
          action: "feedback",
          type: "action",
        },
        {
          id: "divider1",
          text: "",
          icon: "",
          type: "divider",
        },
        {
          id: "logout",
          text: "Sign Out",
          icon: "logout",
          action: "logout",
          type: "action",
          className: "user-menu-signout",
          style: "color: #dc3545;",
        },
      ]);
    });

    // Note: User data will be set by AppHeaderBinderService after authentication
    // No hardcoded user data here
  }

  /**
   * Handle test error message from postMessage (for iframe testing)
   */
  private handleTestErrorMessage(messageData: any): void {

    if (!this.layout) {
      this.logger.warn('Layout not initialized, cannot show error message');
      return;
    }

    const { type, title, description } = messageData;

    // Use the layout's error message system via onContextReady pattern (legacy for test messages)
    this.layout.onContextReady((ctx) => {
      switch (type) {
        case "error":
          ctx
            .getMessages()
            ?.showError(
              title || "Test Error",
              description ||
                "This is a test error message from iframe testing.",
            );
          break;
        case "warning":
          ctx
            .getMessages()
            ?.showWarning(
              title || "Test Warning",
              description ||
                "This is a test warning message from iframe testing.",
            );
          break;
        case "info":
          ctx
            .getMessages()
            ?.showInfo(
              title || "Test Info",
              description || "This is a test info message from iframe testing.",
            );
          break;
        case "success":
          ctx
            .getMessages()
            ?.showSuccess(
              title || "Test Success",
              description ||
                "This is a test success message from iframe testing.",
            );
          break;
        default:
          this.logger.warn('Unknown message type:', type);
          ctx
            .getMessages()
            ?.showInfo("Test Message", "Unknown message type: " + type);
      }
    });
  }

  /**
   * Handle clearing all error messages (for iframe testing)
   */
  private handleClearMessages(): void {

    if (!this.layout) {
      this.logger.warn('Layout not initialized, cannot clear messages');
      return;
    }

    // Legacy onContextReady for test message handling
    this.layout.onContextReady((ctx) => {
      ctx.getMessages()?.clearAll();
    });
  }
  /**
   * Perform initial authentication validation (runs after registerServices)
   */
  private async validateInitialAuthentication(
    context: LayoutContext,
  ): Promise<void> {
    const authServiceRef = AuthService.getRegisteredReference(context);
    await authServiceRef
      .get()
      .then((service) => service.validateAuthentication("app-startup"));
  }

  /**
   * Set custom error handler
   */
  public setErrorHandler(handler: (ex: Error | unknown) => void): void {
    this.errorHandler = handler;
  }

  /**
   * Handle error using the configured error handler
   */
  public handleError(ex: Error | unknown): void {
    this.errorHandler(ex);
  }

  /**
   * Get the current error handler function
   */
  public getErrorHandler(): (ex: Error | unknown) => void {
    return this.errorHandler;
  }

}
