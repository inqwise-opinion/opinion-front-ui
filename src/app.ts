/**
 * Main application class for Opinion Front UI
 * Handles routing and page management with global layout
 */

import { MockApiService } from "./services/MockApiService";
import DashboardPage from "./pages/DashboardPage";
import DebugPage from "./pages/DebugPage";
import { AppHeaderImpl } from "./components/AppHeaderImpl";
import AppFooterImpl from "./components/AppFooterImpl";
import { MainContentImpl } from "./components/MainContentImpl";
import Layout from "./components/Layout";
import {
  AuthService,
  MockSessionAuthProvider,
} from "./auth";
import { AppHeaderBinderService } from "./services/AppHeaderBinderService";
import { UserService } from "./services/UserService";
import { registerService } from "./core/ServiceIdentity";

export class OpinionApp {
  private initialized: boolean = false;
  private currentPage: any = null;
  private apiService: MockApiService;

  // Global layout components
  private appHeader: AppHeaderImpl | null = null;
  private appFooter: AppFooterImpl | null = null;
  private mainContent: MainContentImpl | null = null;
  private layout: Layout | null = null;

  constructor() {
    console.log("🎯 APP.TS - Constructor START");
    try {
      console.log("🎯 APP.TS - Creating MockApiService...");
      this.apiService = new MockApiService();
      console.log("✅ APP.TS - Constructor completed successfully");
    } catch (error) {
      console.error("❌ APP.TS - Constructor failed:", error);
      throw error;
    }
  }

  public async init(): Promise<void> {
    console.log("🎯 APP.TS - init()");
    try {
      if (this.initialized) {
        console.warn("🎯 APP.TS - Application already initialized");
        return;
      }

      this.setupEventListeners();

      console.log("🎯 APP.TS - Initializing global layout...");
      await this.initializeGlobalLayout();

      console.log("🎯 APP.TS - Initializing routing...");
      await this.initializeRouting();

      this.initialized = true;
      console.log("✅ APP.TS - Opinion Front UI - Ready");
    } catch (error) {
      console.error("❌ APP.TS - init() failed:", error);
      console.error("❌ APP.TS - Error stack:", error.stack);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Setup global event listeners
    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOM Content Loaded");
    });

    // Handle browser navigation
    window.addEventListener("popstate", () => {
      this.handleRouteChange();
    });

    // Handle postMessage events for testing (e.g., from test-positioning.html iframe)
    window.addEventListener("message", (event) => {
      console.log("🎯 APP.TS - Received postMessage:", event.data);

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
              "🎯 APP.TS - Unknown postMessage action:",
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
    try {
      // 0. Initialize Layout component first (manages CSS classes and coordination)
      console.log("🏗️ APP.TS - Initializing Layout coordinator...");
      this.layout = new Layout();

        await this.layout
        .onContextReady((ctx) => {
          console.log('🏗️ APP.TS - Layout context ready callback 1 - setting up sidebar navigation');
          ctx.getSidebar()?.updateNavigation([
            {
              id: "dashboard",
              text: "Dashboard",
              icon: "dashboard",
              href: "/dashboard",
              caption: "View analytics, reports and key metrics",
              active: false,
            },
            {
              id: "surveys",
              text: "Surveys",
              icon: "poll",
              href: "/surveys",
              caption: "Create and manage survey questionnaires",
              active: false,
            },
            {
              id: "debug",
              text: "Debug",
              icon: "bug_report",
              href: "/",
              caption: "Development tools and troubleshooting",
              active: false,
            },
          ]);

          ctx.getSidebar()?.setActivePage("debug");

          ctx.getHeader()?.setUserMenuHandler((user) => {
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
          console.log('🏗️ APP.TS - Layout context ready callback 1 - configuration complete');
        })
        .init();
      console.log("✅ APP.TS - Layout coordinator initialized");

      // Register authentication services after layout is ready
      console.log("🔐 APP.TS - Registering authentication services...");
      await this.initializeAuthenticationServices();
      console.log("✅ APP.TS - Authentication services registered");

      // Semantic structure is now complete:
      // <nav class="app-sidebar"> (created by AppHeader)
      // <header class="app-header">
      // <main class="main-content">
      // <footer class="app-footer">
    } catch (error) {
      console.error("❌ APP.TS - Failed to initialize global layout:", error);
      throw error;
    }
  }

  /**
   * Initialize and register authentication services
   */
  private async initializeAuthenticationServices(): Promise<void> {
    if (!this.layout) {
      throw new Error(
        "Layout must be initialized before authentication services",
      );
    }

    // Get the layout context for service registration
    this.layout.onContextReady(async (ctx) => {
      console.log('🔐 APP.TS - Layout context ready callback 2 - starting authentication services initialization');
      console.log(
        '🔐 APP.TS - Initializing authentication services with layout context...',
      );

      try {
        // Create MockSessionAuthProvider instance
        const mockAuthProvider = new MockSessionAuthProvider(this.apiService, {
          authDelay: 300, // Shorter delay for development
          enableAccountSwitching: true,
          mockAccountCount: 3,
        });

        // Register MockSessionAuthProvider using type-safe registration
        registerService(ctx, MockSessionAuthProvider, mockAuthProvider);

        // Register AuthService using type-safe registration and configuration
        const authService = new AuthService(ctx, {
          authProviderServiceId: MockSessionAuthProvider.SERVICE_ID, // Type-safe reference!
          autoValidate: false,
        });
        registerService(ctx, AuthService, authService);

        // Register UserService using type-safe registration and configuration
        const userService = new UserService(ctx, {
          authServiceId: AuthService.SERVICE_ID,                        // Type-safe reference!
          sessionAuthProviderServiceId: MockSessionAuthProvider.SERVICE_ID, // Type-safe reference!
        });
        registerService(ctx, UserService, userService);

        // Register AppHeaderBinderService with type-safe service references
        const authServiceRef = AuthService.getRegisteredReference(ctx);
        const appHeaderBinderService = new AppHeaderBinderService(
          authServiceRef,
          ctx,
          { updateOnInit: true },
        );
        // Use self-identifying service ID for registration
        registerService(ctx, AppHeaderBinderService, appHeaderBinderService);
        console.log(
          `✅ APP.TS - AppHeaderBinderService registered as '${AppHeaderBinderService.SERVICE_ID}'`,
        );

        // Initialize services in dependency order (dependencies first)
        await mockAuthProvider.init();
        await authService.init();        // AuthService depends on mockAuthProvider
        await userService.init();        // UserService depends on authService and mockAuthProvider
        await appHeaderBinderService.init(); // AppHeaderBinderService depends on authService
        console.log("✅ APP.TS - All authentication services initialized");

        // Perform initial authentication validation
        console.log(
          "🔍 APP.TS - Performing initial authentication validation...",
        );
        try {
          const authenticatedUser =
            await authService.validateAuthentication("app-startup");
          console.log("✅ APP.TS - User is authenticated:", {
            username: authenticatedUser.username,
            userId: authenticatedUser.id,
            accountId: authenticatedUser.accountId,
          });
        } catch (error) {
          console.error("❌ APP.TS - Authentication validation failed:", error);
          console.log(
            "⚠️ APP.TS - App will continue in non-authenticated state",
          );
        }
      } catch (error) {
        console.error(
          "❌ APP.TS - Failed to initialize authentication services:",
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Initialize routing and load appropriate page
   */
  private async initializeRouting(): Promise<void> {
    const currentPath = window.location.pathname;
    await this.handleRoute(currentPath);
  }

  /**
   * Handle test error message from postMessage (for iframe testing)
   */
  private handleTestErrorMessage(messageData: any): void {
    console.log("🚨 APP.TS - Handling test error message:", messageData);

    if (!this.layout) {
      console.warn(
        "⚠️ APP.TS - Layout not initialized, cannot show error message",
      );
      return;
    }

    const { type, title, description, source } = messageData;
    console.log(
      `🎯 APP.TS - Showing ${type} message from ${source || "unknown"}`,
    );

    // Use the layout's error message system via onContextReady pattern
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
    console.log("🧹 APP.TS - Clearing all test messages");

    if (!this.layout) {
      console.warn("⚠️ APP.TS - Layout not initialized, cannot clear messages");
      return;
    }

    this.layout.onContextReady((ctx) => {
      ctx.getMessages()?.clearAll();
    });
  }

  /**
   * Handle route changes
   */
  private async handleRouteChange(): Promise<void> {
    const currentPath = window.location.pathname;
    await this.handleRoute(currentPath);
  }

  /**
   * Handle specific route and load appropriate page
   */
  private async handleRoute(path: string): Promise<void> {
    console.log(`🎯 APP.TS - handleRoute('${path}') START`);
    try {
      // Clean up current page if exists
      if (this.currentPage && typeof this.currentPage.destroy === "function") {
        console.log("🎯 APP.TS - Destroying current page...");
        this.currentPage.destroy();
        console.log("✅ APP.TS - Current page destroyed");
      }

      // Route to appropriate page based on path
      // Pages will now render their content inside the semantic <main> element
      if (path === "/") {
        console.log("🎯 APP.TS - Creating DebugPage for root path...");
        this.currentPage = new DebugPage(this.layout?.getMainContent());
        console.log("🎯 APP.TS - Initializing DebugPage...");
        await this.currentPage.init();
        console.log("✅ APP.TS - DebugPage initialized successfully");
      } else if (path === "/dashboard") {
        console.log("🎯 APP.TS - Creating DashboardPage...");
        this.currentPage = new DashboardPage(this.apiService, this.mainContent);
        console.log("🎯 APP.TS - Initializing DashboardPage...");
        await this.currentPage.init();
        console.log("✅ APP.TS - DashboardPage initialized successfully");
      }
      // Add more routes here as needed
      // else if (path === '/surveys') {
      //   this.currentPage = new SurveysPage();
      //   await this.currentPage.init();
      // }
      else {
        console.warn(`⚠️ APP.TS - Unknown route: ${path}`);
        console.log("🎯 APP.TS - Fallback: Creating DebugPage...");
        this.currentPage = new DebugPage(this.layout.getMainContent());
        console.log("🎯 APP.TS - Initializing fallback DebugPage...");
        await this.currentPage.init();
        console.log("✅ APP.TS - Fallback DebugPage initialized successfully");
      }
    } catch (error) {
      console.error(
        `❌ APP.TS - Failed to load page for route ${path}:`,
        error,
      );
      console.error(`❌ APP.TS - Route error stack:`, error.stack);
      // Show error page or fallback
      throw error;
    }
    console.log(`🎯 APP.TS - handleRoute('${path}') END`);
  }

  /**
   * Navigate to a specific route
   */
  public navigateTo(path: string): void {
    if (path !== window.location.pathname) {
      window.history.pushState({}, "", path);
      this.handleRouteChange();
    }
  }

  /**
   * Get current page instance
   */
  public getCurrentPage(): any {
    return this.currentPage;
  }

  /**
   * Get layout instance (for DebugPage access to LayoutContext)
   */
  public getLayout(): Layout | null {
    return this.layout;
  }
}
