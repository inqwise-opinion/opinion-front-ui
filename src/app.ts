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
import type { ContextHandler } from "./components/Layout";
import type { LayoutContext } from "./contexts/LayoutContext";
import { RouterService } from "./router/RouterService";
import { SurveysRouter } from "./router/SurveysRouter";
import {
  SERVICE_ID,
  type NavigationService,
} from "./services/navigation/NavigationService";
import { NavigationServiceImpl } from "./services/navigation/NavigationServiceImpl";

export class OpinionApp {
  private initialized: boolean = false;
  private apiService: MockApiService;
  private routerService: RouterService | null = null;

  // Global layout components
  private appHeader: AppHeaderImpl | null = null;
  private appFooter: AppFooterImpl | null = null;
  private mainContent: MainContentImpl | null = null;
  private layout: Layout | null = null;

  constructor() {
    this.apiService = new MockApiService();
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack =
        error instanceof Error ? error.stack : "No stack trace";
      const isCritical =
        !this.layout ||
        errorMessage.includes("critical") ||
        errorMessage.includes("layout");

      // 1. Log the error with details
      console.error(
        `❌ APP.TS - ${isCritical ? "Critical" : "Non-critical"} initialization error:`,
        {
          message: errorMessage,
          stack: errorStack,
          isCritical,
        },
      );

      // 2. Show error UI based on app state
      if (this.layout) {
        // Layout available - show in message system
        this.layout.onContextReady((ctx) => {
          ctx
            .getMessages()
            ?.showError(
              isCritical ? "Critical Error" : "Initialization Warning",
              isCritical
                ? "Application failed to initialize. Please refresh the page."
                : "Some features may be unavailable. You can continue with limited functionality.",
            );
        });
      } else {
        // No layout - show full page error
        document.body.innerHTML = `
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2>${isCritical ? "Critical Error" : "Application Error"}</h2>
            <p>${
              isCritical
                ? "The application cannot start due to a critical error. Please refresh the page or contact support if the issue persists."
                : "Failed to load some application features. You may continue with limited functionality or refresh the page to try again."
            }</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">Reload Page</button>
            <details style="margin-top: 20px; text-align: left; max-width: 800px; margin-left: auto; margin-right: auto;">
              <summary>Technical Details</summary>
              <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${errorStack}</pre>
            </details>
          </div>
        `;
      }

      // Don't rethrow - we've handled the error completely
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
            console.log(
              "Unknown postMessage action:",
              event.data.action,
            );
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
      console.error("❌ APP.TS - Failed to sync NavigationService with Sidebar:", error);
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
      console.warn(
        "⚠️ APP.TS - Layout not initialized, cannot show error message",
      );
      return;
    }

    const { type, title, description, source } = messageData;

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
          console.warn("⚠️ APP.TS - Unknown message type:", type);
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
      console.warn("⚠️ APP.TS - Layout not initialized, cannot clear messages");
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
}
