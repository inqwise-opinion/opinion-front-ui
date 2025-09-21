/**
 * App Header Component Implementation - Clean CSS Grid Integration
 * Basic header functionality with clean layout integration
 */

// Import component-scoped CSS
import "../assets/styles/components/header.css";

// Import required components
import { UserMenu } from "./UserMenu";
import { BreadcrumbsComponent } from "./BreadcrumbsComponent";
import type { UserMenuItem } from "./Layout";
import type { BreadcrumbItem } from "../interfaces/BreadcrumbItem";

// Type-only import for the interface
import { Dimensions } from "./Sidebar";
// Import layout context
import { getLayoutContext } from "../contexts/index";
import type { LayoutEvent, LayoutContext } from "../contexts/LayoutContext";
import { LayoutEventFactory } from "../contexts/LayoutEventFactory";
import { AppHeader, HeaderUser } from "./AppHeader";
import {
  ComponentStatus,
  ComponentWithStatus,
} from "../interfaces/ComponentStatus";
import {
  ChainHotkeyProvider,
  ChainHotkeyHandler,
  HotkeyExecutionContext,
} from "../hotkeys/HotkeyChainSystem";

export interface HeaderConfig {
  brandTitle?: string; // Header brand/logo title (default: "Opinion")
  brandHref?: string; // Header brand/logo link (default: "/dashboard")
  showMobileToggle?: boolean; // Show mobile menu toggle (default: true)
  showBreadcrumbs?: boolean; // Show breadcrumb navigation (default: true)
  showUserMenu?: boolean; // Show user menu (default: true)
}

export class AppHeaderImpl
  implements AppHeader, ChainHotkeyProvider, ComponentWithStatus
{
  private userMenuHandler?: (userMenu: UserMenu) => void;
  private container: HTMLElement | null = null;
  private userMenu: UserMenu | null = null;
  private breadcrumbsComponent: BreadcrumbsComponent | null = null;
  private user: HeaderUser | null = null;
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];
  private config: Required<HeaderConfig>;
  private chainProviderUnsubscriber: (() => void) | null = null;
  private isInitialized: boolean = false;
  private initTime: number | null = null;
  private domEventListeners: number = 0;
  private updateCount: number = 0;

  constructor(config: HeaderConfig = {}, layoutContext?: LayoutContext) {
    // Apply configuration with defaults
    this.config = {
      brandTitle: config.brandTitle ?? "Opinion",
      brandHref: config.brandHref ?? "/",
      showMobileToggle: config.showMobileToggle ?? true,
      showBreadcrumbs: config.showBreadcrumbs ?? true,
      showUserMenu: config.showUserMenu ?? true,
    };

    console.log(
      "AppHeaderImpl - Creating clean header with config:",
      this.config,
    );

    // Use provided LayoutContext or fallback to singleton (for backwards compatibility)
    this.layoutContext = layoutContext || getLayoutContext();
    console.log(`AppHeaderImpl - Using LayoutContext:`, {
      provided: !!layoutContext,
      contextType: this.layoutContext.constructor.name,
    });
  }

  public setUserMenuHandler(handler: (userMenu: UserMenu) => void): void {
    this.userMenuHandler = handler;
  }

  /**
   * Initialize the header component
   */
  async init(): Promise<void> {
    console.log("AppHeaderImpl - Initializing...");

    try {
      // Create header first - it should exist independently
      await this.createHeader();

      // Wait for DOM to be ready and elements to be available
      await this.waitForDOMReady();

      console.log(`AppHeaderImpl - Current viewport: ${window.innerWidth}px`);

      // Initialize breadcrumbs component
      await this.initBreadcrumbs();

      // Initialize user menu component (desktop only)
      await this.initUserMenu();

      // Setup event listeners
      this.setupEventListeners();

      // Setup layout subscriptions
      this.subscribeToLayoutContext();

      this.layoutContext.registerHeader(this);

      // Register as chain hotkey provider for ESC key handling (if user menu enabled)
      if (this.config.showUserMenu) {
        this.chainProviderUnsubscriber =
          this.layoutContext.registerChainProvider(this);
      }

      this.isInitialized = true;
      this.initTime = Date.now();
      console.log("AppHeaderImpl - Ready");
    } catch (error) {
      console.error("AppHeaderImpl - Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Creates or uses existing header element and populate content
   */
  private async createHeader(): Promise<void> {
    // Find existing header element
    this.container = document.getElementById("app-header");

    if (!this.container) {
      // Create the element if it doesn't exist
      this.container = document.createElement("header");
      this.container.id = "app-header";
      this.container.className = "app-header";

      // Create header container
      const headerContainer = document.createElement("div");
      headerContainer.className = "header-container";
      this.container.appendChild(headerContainer);

      // Add to DOM - prefer app-layout container if present
      const appLayout = document.querySelector(".app-layout");
      if (appLayout) {
        appLayout.insertBefore(this.container, appLayout.firstChild);
      } else {
        document.body.insertBefore(this.container, document.body.firstChild);
      }

      console.log("AppHeaderImpl - Created new header element");
    } else {
      console.log("AppHeaderImpl - Using existing element");
    }

    this.finalizeHeaderCreation();
  }

  /**
   * Finalize header creation after element is found
   */
  private finalizeHeaderCreation(): void {
    // Populate the existing structure with dynamic content
    this.populateContent();

    console.log("AppHeaderImpl - Content populated successfully");
  }

  /**
   * Populate header content into existing HTML structure
   */
  private populateContent(): void {
    if (!this.container) return;

    // Find or create header container
    let headerContainer = this.container.querySelector(".header-container");
    if (!headerContainer) {
      headerContainer = document.createElement("div");
      headerContainer.className = "header-container";
      this.container.appendChild(headerContainer);
    }

    // Populate header content using configuration
    const mobileToggleHtml = this.config.showMobileToggle
      ? `
        <button class="mobile-menu-toggle" id="mobile_menu_toggle" aria-label="Toggle Menu" title="Toggle Menu">
          <div class="hamburger-icon">
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
          </div>
        </button>
    `
      : "";

    const breadcrumbsHtml = this.config.showBreadcrumbs
      ? `
        <!-- Breadcrumbs container - managed by BreadcrumbsComponent -->
        <div class="header-breadcrumbs" id="breadcrumbs_container">
          <!-- BreadcrumbsComponent will render content here -->
        </div>
    `
      : "";

    const userMenuHtml = this.config.showUserMenu
      ? `
        <!-- User Menu -->
        <div id="user_menu_container"></div>
    `
      : "";

    headerContainer.innerHTML = `
      <!-- Left section: Mobile toggle button -->
      <div class="header-left">
        ${mobileToggleHtml}
      </div>

      <!-- Center section: Enhanced breadcrumbs and page title -->
      <div class="header-center" style="${window.innerWidth <= 767 ? "padding-left: 16px;" : "padding-left: 0;"}">
        ${breadcrumbsHtml}
      </div>

      <!-- Right section: User menu only -->
      <div class="header-right">
        ${userMenuHtml}
      </div>
    `;
  }

  /**
   * Initialize breadcrumbs component
   */
  private async initBreadcrumbs(): Promise<void> {
    if (!this.config.showBreadcrumbs) {
      console.log(
        "AppHeaderImpl - Breadcrumbs disabled in config, skipping initialization",
      );
      return;
    }

    const breadcrumbsContainer = await this.waitForElement(
      "#breadcrumbs_container",
    );
    if (breadcrumbsContainer) {
      this.breadcrumbsComponent = new BreadcrumbsComponent(
        breadcrumbsContainer,
        this.layoutContext,
      );
      await this.breadcrumbsComponent.init();
      console.log("AppHeaderImpl - BreadcrumbsComponent initialized");
    } else {
      console.warn("AppHeaderImpl - Breadcrumbs container not found");
    }
  }

  /**
   * Initialize user menu component (responsive - works on both mobile and desktop)
   */
  private async initUserMenu(): Promise<void> {
    if (!this.config.showUserMenu) {
      console.log(
        "AppHeaderImpl - User menu disabled in config, skipping initialization",
      );
      return;
    }

    const userMenuContainer = await this.waitForElement("#user_menu_container");
    if (userMenuContainer) {
      this.userMenu = new UserMenu(userMenuContainer, this.layoutContext);
      if (this.userMenuHandler) {
        this.userMenuHandler(this.userMenu);
      }
      await this.userMenu.init();
      console.log(
        "AppHeaderImpl - UserMenu component initialized (responsive)",
      );
    } else {
      console.warn("AppHeaderImpl - User menu container not found");
    }
  }

  /**
   * Setup event listeners for header interactions
   */
  private setupEventListeners(): void {
    // Register global hotkeys via LayoutContext instead of direct listeners
    this.registerHotkeys();

    // Handle data-action based interactions
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const actionElement = target.closest("[data-action]") as HTMLElement;
      if (actionElement && this.container?.contains(actionElement)) {
        const action = actionElement.getAttribute("data-action");
        this.handleAction(action, actionElement);
      }
    });

    // Mobile menu toggle handler (disabled - managed by LayoutContext + Sidebar)
    this.setupMobileMenuHandler();

  }


  /**
   * Register chain hotkey provider with LayoutContext
   */
  private registerHotkeys(): void {
    // Register this component as a chain provider for ESC key handling
    this.chainProviderUnsubscriber =
      this.layoutContext.registerChainProvider(this);
    console.log(
      "AppHeaderImpl - Registered as chain hotkey provider for user menu ESC handling",
    );
  }

  /**
   * Handle ESC key via LayoutContext hotkey system
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    // Emit user menu request event instead of direct call
    // This maintains separation between header and user menu components
    const requestEvent = LayoutEventFactory.createUserMenuRequestEvent(
      "hide", // Request to hide/close
      "keyboard",
    );

    this.layoutContext.emit("user-menu-request", requestEvent.data);
    console.log(
      "📡 AppHeaderImpl - ESC key: User menu close request emitted (via LayoutContext hotkey)",
    );
  }

  /**
   * Setup mobile menu toggle handler
   */
  private setupMobileMenuHandler(): void {
    // Intentionally disabled: Sidebar visibility and behavior are coordinated by
    // LayoutContext (mode changes) and handled internally by Sidebar.
    // Leaving this as a no-op to avoid cross-component DOM manipulation from header.
    if (!this.config.showMobileToggle) {
      return;
    }

    const mobileMenuToggle = document.getElementById("mobile_menu_toggle");
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("📱 AppHeaderImpl - Mobile menu toggle clicked");

        // Emit mobile menu request event instead of directly calling sidebar
        // This decouples header from sidebar and allows sidebar to handle the request when ready
        const requestEvent = LayoutEventFactory.createMobileMenuRequestEvent(
          "show",
          "menu-button",
        );

        this.layoutContext.emit("mobile-menu-request", requestEvent.data);
        console.log("📡 AppHeaderImpl - Mobile menu request event emitted");
      });
      this.domEventListeners++;
    }
  }

  /**
   * Handle data-action based interactions
   */
  private handleAction(action: string | null, element: HTMLElement): void {
    if (!action) return;

    switch (action) {
      case "feedback":
        this.showFeedbackModal();
        break;
      case "logout":
        this.handleLogoutAction();
        break;
      default:
        console.warn(`Unknown header action: ${action}`);
    }
  }

  /**
   * Handle logout action - delegate to AppHeaderBinderService via LayoutContext
   */
  private async handleLogoutAction(): Promise<void> {
    console.log("🚺 AppHeaderImpl - Logout action triggered");

    try {
      // Get the AppHeaderBinderService using the helper method
      const { AppHeaderBinderService } = await import(
        "../services/AppHeaderBinderService"
      );
      const binderRef = AppHeaderBinderService.getRegisteredReference(
        this.layoutContext,
        {
          enableLogging: false,
          maxRetries: 5,
        },
      );

      const binderService = await binderRef.get();
      if (binderService) {
        // Delegate logout to the binder service
        await binderService.handleLogoutAction();
        console.log("✅ AppHeaderImpl - Logout action completed successfully");
      } else {
        console.warn(
          "⚠️ AppHeaderImpl - AppHeaderBinderService not available for logout",
        );
        // Fallback: redirect to logout page
        window.location.href = "/logout";
      }
    } catch (error) {
      console.error("❌ AppHeaderImpl - Error handling logout action:", error);
      // Fallback: redirect to logout page
      window.location.href = "/logout";
    }
  }
  /**
   * Show feedback modal
   */
  private showFeedbackModal(): void {
    const message =
      "Thank you for your interest in providing feedback!\n\n" +
      "This would typically open a feedback form or modal dialog " +
      "where you could submit your comments and suggestions.";

    if (
      confirm(
        message + "\n\nWould you like to be redirected to our feedback page?",
      )
    ) {
      console.log("Redirecting to feedback page...");
      // In a real implementation, this would redirect to the actual feedback page
    }
  }

  /**
   * Update user information in header
   */
  updateUser(user: HeaderUser): void {
    this.user = user;
    this.updateCount++;

    console.log(`AppHeaderImpl - updateUser called: ${user.username}`);

    // Always use UserMenu - it will handle responsive display via CSS
    if (this.userMenu) {
      this.userMenu.updateUser({
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      });
      console.log("AppHeaderImpl - User updated via UserMenu");
    } else {
      console.warn("AppHeaderImpl - UserMenu not available for user update");
    }
  }

  /**
   * Update user menu items
   */
  updateUserMenuItems(items: UserMenuItem[]): void {
    console.log(
      `AppHeaderImpl - updateUserMenuItems called with ${items.length} items`,
    );

    if (this.userMenu) {
      this.userMenu.updateMenuItems(items);
      console.log("AppHeaderImpl - User menu items updated via UserMenu");
    } else {
      console.warn(
        "AppHeaderImpl - UserMenu not available for menu items update",
      );
    }
  }

  /**
   * Update logo/brand link
   */
  updateBrand(title?: string, href?: string): void {
    const finalTitle = title ?? this.config.brandTitle;
    const finalHref = href ?? this.config.brandHref;

    const logo = this.container?.querySelector(".logo") as HTMLAnchorElement;
    if (logo) {
      logo.textContent = finalTitle;
      logo.href = finalHref;
      console.log(
        `AppHeaderImpl - Brand updated: "${finalTitle}" -> ${finalHref}`,
      );
    }
  }

  /**
   * Set breadcrumb items using new BreadcrumbsComponent
   */
  setBreadcrumbItems(items: BreadcrumbItem[]): void {
    if (this.breadcrumbsComponent) {
      this.breadcrumbsComponent.setBreadcrumbs(items);

      // Update document title based on breadcrumbs
      if (items.length > 0) {
        const titleParts = items.map((item) => item.text).reverse();
        document.title = `${titleParts.join(" - ")} - Opinion`;
      } else {
        document.title = "Opinion";
      }
    } else {
      console.warn("AppHeaderImpl - BreadcrumbsComponent not initialized");
    }
  }

  /**
   * Get breadcrumbs component for direct access
   */
  getBreadcrumbsComponent(): BreadcrumbsComponent | null {
    return this.breadcrumbsComponent;
  }

  /**
   * Show/hide header
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? "block" : "none";
    }
  }

  /**
   * Get header configuration
   */
  public getConfig(): Required<HeaderConfig> {
    return { ...this.config };
  }

  /**
   * Wait for DOM to be ready
   */
  private async waitForDOMReady(): Promise<void> {
    if (document.readyState === "loading") {
      return new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", () => resolve(), {
          once: true,
        });
      });
    }
    return Promise.resolve();
  }

  /**
   * Wait for a specific element to be available in the DOM
   */
  private async waitForElement(
    selector: string,
    timeout: number = 5000,
  ): Promise<HTMLElement | null> {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      return element;
    }

    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Update header layout based on current layout mode
   */
  private updateHeaderLayout(ctx: LayoutContext): void {
    if (!this.container) {
      console.warn(
        "AppHeaderImpl - Cannot update layout: container not available",
      );
      return;
    }

    // Remove all positioning inline styles - let CSS handle layout
    this.container.style.left = "";
    this.container.style.width = "";
    this.container.style.right = "";

    // Update CSS classes based on layout mode
    const sidebar = ctx.getSidebar();
    const isCompact = sidebar?.isCompactMode() || false;
    this.container.classList.toggle(
      "header-sidebar-compact",
      isCompact && !ctx.isLayoutMobile(),
    );
    this.container.classList.toggle(
      "header-sidebar-normal",
      !isCompact && !ctx.isLayoutMobile(),
    );
    this.container.classList.toggle("header-mobile", ctx.isLayoutMobile());

    // Dispatch custom event for other components
    const event = new CustomEvent("header-layout-updated", {
      detail: {
        layoutContext: ctx,
      },
    });
    document.dispatchEvent(event);

    console.log(`✅ AppHeaderImpl - Layout updated`);
  }

  /**
   * Subscribe to layout context events
   */
  private subscribeToLayoutContext(): void {
    console.log("AppHeaderImpl - Subscribing to layout context events...");

    // Subscribe to layout mode changes to update header layout
    const layoutModeChangeUnsubscribe = this.layoutContext.subscribe(
      "layout-mode-change",
      (event: LayoutEvent) => {
        console.log("AppHeaderImpl - Received layout mode change", event.data);
        this.updateHeaderLayout(this.layoutContext);
      },
    );
    this.layoutUnsubscribers.push(layoutModeChangeUnsubscribe);

    // Subscribe to sidebar compact mode changes to update header position
    const compactModeChangeUnsubscribe = this.layoutContext.subscribe(
      "sidebar-compact-mode-change",
      (event: LayoutEvent) => {
        console.log(
          "AppHeaderImpl - Received sidebar compact mode change",
          event.data,
        );
        this.updateHeaderLayout(this.layoutContext);
      },
    );
    this.layoutUnsubscribers.push(compactModeChangeUnsubscribe);

    // Set initial layout based on current layout mode
    this.updateHeaderLayout(this.layoutContext);

    console.log(
      "AppHeaderImpl - Successfully subscribed to layout context events ✅",
    );
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy(): void {
    console.log("AppHeaderImpl - Destroying...");

    // Unsubscribe from layout context events
    this.layoutUnsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error(
          "AppHeaderImpl - Error unsubscribing from layout context:",
          error,
        );
      }
    });
    this.layoutUnsubscribers = [];

    // Cleanup chain provider (new system)
    this.cleanupChainProvider();

    // Unregister all legacy hotkeys for this component (backward compatibility)
    this.layoutContext.unregisterAllHotkeys("AppHeaderImpl");
    console.log("AppHeaderImpl - Hotkeys unregistered from LayoutContext");

    // Destroy user menu component
    if (this.userMenu) {
      this.userMenu.destroy();
      this.userMenu = null;
    }


    // Remove event listeners and cleanup resources
    if (this.container) {
      this.container.remove();
    }

    this.container = null;
    this.user = null;
  }

  /**
   * Legacy/test adapter: expose sidebar reference via layout context
   */
  public getSidebar(): any {
    return this.layoutContext.getSidebar();
  }

  /**
   * Legacy/test adapter: trigger layout update
   */
  public updatePosition(): void {
    this.updateHeaderLayout(this.layoutContext);
  }

  // =================================================================================
  // ChainHotkeyProvider Implementation
  // =================================================================================

  /**
   * Get provider identifier for chain hotkey system
   */
  getHotkeyProviderId(): string {
    return "AppHeaderImpl";
  }

  /**
   * Get provider priority - Menu systems get medium-high priority (600)
   */
  getProviderPriority(): number {
    return 600; // Menu systems priority
  }

  /**
   * Get chain hotkeys for user menu ESC handling
   */
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    // Only provide ESC handler if user menu is available and potentially open
    if (!this.config.showUserMenu || !this.userMenu) {
      return null;
    }

    const hotkeys = new Map<string, ChainHotkeyHandler>();

    hotkeys.set("Escape", {
      key: "Escape",
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.handleEscapeKeyChain(ctx);
      },
      description: "Close user menu via chain system",
      priority: this.getProviderPriority(),
      enable: () => {
        /* User menu ESC is always enabled when menu exists */
      },
      disable: () => {
        /* Could disable if needed */
      },
      isEnabled: () => this.config.showUserMenu && !!this.userMenu,
    });

    return hotkeys;
  }

  /**
   * Default chain behavior - continue to next handler (cooperative)
   */
  getDefaultChainBehavior(): "next" | "break" {
    return "next"; // Be cooperative with other components
  }

  /**
   * Handle ESC key via chain system with smart cooperation
   */
  private handleEscapeKeyChain(ctx: HotkeyExecutionContext): void {
    console.log("🎯 AppHeaderImpl - ESC key pressed via chain system");

    // Check if user menu is actually open/relevant
    if (this.shouldHandleEscapeKey()) {
      // Close user menu by emitting event
      const requestEvent = LayoutEventFactory.createUserMenuRequestEvent(
        "hide", // Request to hide/close
        "keyboard",
      );

      this.layoutContext.emit("user-menu-request", requestEvent.data);
      ctx.preventDefault();

      console.log(
        "📡 AppHeaderImpl - ESC handled: User menu close request emitted",
      );

      // Smart chain control:
      // Check if higher priority components (like modals) are in the chain
      if (ctx.hasProvider("ModalDialog") || ctx.hasProvider("MobileSidebar")) {
        // Let higher priority components also handle if they need to
        ctx.next();
      } else {
        // We're likely the primary handler, prevent default browser behavior
        ctx.break();
      }
    } else {
      // User menu not relevant, let others handle
      ctx.next();
    }
  }

  /**
   * Check if AppHeaderImpl should handle the ESC key
   * This could check if user menu is open, visible, etc.
   */
  private shouldHandleEscapeKey(): boolean {
    // For now, always handle if user menu is configured and available
    // In the future, this could check if the user menu is actually open
    return this.config.showUserMenu && !!this.userMenu;
  }

  /**
   * Get current component status for debugging
   */
  getStatus(): ComponentStatus {
    const containerDimensions = this.container
      ? {
          width: this.container.offsetWidth,
          height: this.container.offsetHeight,
          offsetTop: this.container.offsetTop,
          offsetLeft: this.container.offsetLeft,
        }
      : undefined;

    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for potential issues
    if (!this.container) {
      issues.push("DOM container element not found");
    }
    if (this.config.showUserMenu && !this.userMenu) {
      warnings.push("User menu enabled but not initialized");
    }
    if (this.layoutUnsubscribers.length === 0) {
      warnings.push("No layout event subscriptions active");
    }

    const currentTime = Date.now();
    const uptime = this.initTime ? currentTime - this.initTime : 0;

    return {
      componentType: "AppHeaderImpl",
      id: "app-header",
      initialized: this.isInitialized,
      initTime: this.initTime,
      uptime: uptime,
      domElement: this.container
        ? {
            tagName: this.container.tagName,
            id: this.container.id,
            className: this.container.className,
            childCount: this.container.children.length,
            hasContent: this.container.children.length > 0,
            isVisible: this.container.style.display !== "none",
            ariaLabel: this.container.getAttribute("aria-label") || undefined,
            role: this.container.getAttribute("role") || undefined,
            dimensions: containerDimensions,
          }
        : undefined,
      eventListeners: {
        domEvents: this.domEventListeners,
        layoutSubscriptions: this.layoutUnsubscribers.length,
        eventBusSubscriptions: this.chainProviderUnsubscriber ? 1 : 0,
      },
      configuration: {
        brandTitle: this.config.brandTitle,
        brandHref: this.config.brandHref,
        showMobileToggle: this.config.showMobileToggle,
        showBreadcrumbs: this.config.showBreadcrumbs,
        showUserMenu: this.config.showUserMenu,
      },
      currentState: {
        userMenuInitialized: !!this.userMenu,
        userSet: !!this.user,
        updateCount: this.updateCount,
        containerVisible: this.container
          ? this.container.style.display !== "none"
          : false,
      },
      performance: {
        updateCount: this.updateCount,
        lastUpdate: this.user ? Date.now() : undefined,
      },
      issues:
        issues.length > 0 || warnings.length > 0
          ? issues.concat(warnings)
          : undefined,
      customData: {
        chainHotkeyProvider: {
          registered: !!this.chainProviderUnsubscriber,
          providerId: this.getHotkeyProviderId(),
          priority: this.getProviderPriority(),
          hotkeyCount: this.getChainHotkeys()?.size || 0,
        },
        userMenuConfig: {
          enabled: this.config.showUserMenu,
          instance: !!this.userMenu,
          userSet: !!this.user,
          userName: this.user?.username,
        },
      },
    };
  }

  /**
   * Cleanup chain provider on destroy
   */
  private cleanupChainProvider(): void {
    if (this.chainProviderUnsubscriber) {
      this.chainProviderUnsubscriber();
      this.chainProviderUnsubscriber = null;
      console.log("AppHeaderImpl - Chain provider unregistered");
    }
  }
}

export default AppHeaderImpl;
