/**
 * Layout Controller
 * Manages all master page components (Header, Sidebar, Footer) and their coordination
 */

import AppHeaderImpl, { HeaderUser, HeaderConfig } from "./AppHeaderImpl";
import AppFooterImpl, { FooterConfig } from "./AppFooterImpl";
import MainContentImpl from "./MainContentImpl";
import { NavigationItem, Sidebar, SidebarConfig } from "./Sidebar";
import SidebarComponent from "./SidebarComponent";
import MessagesComponent from "./MessagesComponent";
import type { Messages } from "../interfaces/Messages";
// Import layout context
import {
  type LayoutContext,
  type LayoutEvent,
  type LayoutMode,
  type LayoutModeType,
} from "../contexts/index.js";
import LayoutContextImpl from "../contexts/LayoutContextImpl.js";

/**
 * User menu item interface for configurable user menu
 */
export interface UserMenuItem {
  id: string;
  text: string;
  icon: string;
  href?: string;
  action?: string; // For JavaScript actions like "feedback", "logout"
  type?: "link" | "action" | "divider"; // Default is 'link'
  className?: string; // Additional CSS classes
  style?: string; // Additional inline styles
}

/**
 * Layout configuration interface
 */
export interface LayoutConfig {
  header?: {
    enabled?: boolean;
    brandTitle?: string;
    brandHref?: string;
    showMobileToggle?: boolean;
    showBreadcrumbs?: boolean;
    showUserMenu?: boolean;
  };
  sidebar?: {
    enabled?: boolean;
    defaultWidth?: number; // Default sidebar width
    compactWidth?: number; // Compact sidebar width
    footer?: {
      text?: string; // Footer text (default: "© 2025 Opinion")
      showFooter?: boolean; // Whether to show footer (default: true)
    };
  };
  footer?: FooterConfig & {
    enabled?: boolean;
  };
  navigation?: NavigationItem[]; // Configuration for sidebar navigation items
  userMenu?: UserMenuItem[]; // Configuration for user menu items
}

export class Layout {
  private header: AppHeaderImpl;
  private footer: AppFooterImpl;
  private mainContent: MainContentImpl;
  private sidebar: SidebarComponent | null = null;
  private messagesComponent: MessagesComponent | null = null;
  private config: LayoutConfig;
  private isInitialized: boolean = false;
  private layoutContext: LayoutContextImpl;
  private layoutUnsubscribers: Array<() => void> = [];
  private deferredContextHandlers: Array<
    (layoutContext: LayoutContext) => void
  > = [];

  // Navigation and user menu state
  private navigationItems: NavigationItem[] = [];
  private userMenuItems: UserMenuItem[] = [];

  constructor(config: LayoutConfig = {}) {
    this.config = {
      header: {
        enabled: true,
        brandTitle: "Opinion",
        brandHref: "/dashboard",
        showMobileToggle: true,
        showBreadcrumbs: true,
        showUserMenu: true,
        ...config.header,
      },
      sidebar: {
        enabled: true,
        defaultWidth: 280,
        compactWidth: 80,
        footer: {
          text: "© 2025 Opinion",
          showFooter: true,
        },
        ...config.sidebar,
      },
      footer: {
        enabled: true,
        showCopyright: true,
        copyrightText: "© 2025 Inqwise Ltd",
        showNavigation: true,
        ...config.footer,
      },
      navigation: config.navigation || [],
      userMenu: config.userMenu || [],
    };

    // Initialize layout context first
    this.layoutContext = new LayoutContextImpl();

    this.header = new AppHeaderImpl(this.config.header);
    this.footer = new AppFooterImpl(this.config.footer);
    this.mainContent = new MainContentImpl({
      className: "main-content",
      id: "app",
      ariaLabel: "Main application content",
    });

    // Note: Components will be registered with LayoutContext at the start of init()
  }

  /**
   * Initialize the layout and all components
   */
  async init(): Promise<void> {
    console.log("🏢 LAYOUT - init() START");

    try {
      console.log("🏢 LAYOUT - Starting layout initialization...");

      // Initialize header
      if (this.config.header?.enabled) {
        console.log("🏢 LAYOUT - Header enabled, initializing...");
        await this.header.init();
        console.log("✅ LAYOUT - Header initialized successfully");

        // Update brand if configured
        if (this.config.header.brandTitle) {
          console.log("🏢 LAYOUT - Updating header brand...");
          this.header.updateBrand(
            this.config.header.brandTitle,
            this.config.header.brandHref,
          );
          console.log("✅ LAYOUT - Header brand updated");
        }

        // Apply user menu items to header
        console.log("🏢 LAYOUT - Applying user menu items to header...");

        console.log("✅ LAYOUT - User menu items applied to header");
      } else {
        console.log("⚠️ LAYOUT - Header disabled in config");
      }

      // Initialize MainContent area (manages existing element)
      console.log("🏢 LAYOUT - Initializing MainContent...");
      this.mainContent.init();
      console.log("✅ LAYOUT - MainContent initialized");

      // Initialize Messages component
      console.log("🏢 LAYOUT - Initializing MessagesComponent...");
      this.messagesComponent = new MessagesComponent(this.layoutContext);
      await this.messagesComponent.init();

      console.log("✅ LAYOUT - MessagesComponent initialized");

      // Initialize sidebar component if enabled
      if (this.config.sidebar?.enabled) {
        console.log("🏢 LAYOUT - Sidebar enabled, initializing...");
        await this.initSidebar();
        console.log("✅ LAYOUT - Sidebar initialized successfully");
      } else {
        console.log("⚠️ LAYOUT - Sidebar disabled in config");
      }

      // Initialize footer
      if (this.config.footer?.enabled) {
        console.log("🏢 LAYOUT - Footer enabled, initializing...");
        await this.footer.init();
        console.log("✅ LAYOUT - Footer initialized successfully");
      } else {
        console.log("⚠️ LAYOUT - Footer disabled in config");
      }

      // Setup component coordination
      console.log("🏢 LAYOUT - Setting up component coordination...");
      this.setupComponentCoordination();
      console.log("✅ LAYOUT - Component coordination setup complete");

      // Setup responsive behavior
      console.log("🏢 LAYOUT - Setting up responsive behavior...");
      this.setupResponsiveBehavior();
      console.log("✅ LAYOUT - Responsive behavior setup complete");

      // Subscribe to layout context events
      console.log("🏢 LAYOUT - Subscribing to layout context events...");
      this.subscribeToLayoutContext();
      console.log("✅ LAYOUT - Layout context subscription complete");

      // Mark layout as ready
      this.layoutContext.markReady();

      // Execute any deferred context handlers now that everything is ready
      this.executeDeferredContextHandlers();

      this.isInitialized = true;
      console.log("✅ LAYOUT - Layout initialization completed successfully!");
    } catch (error) {
      console.error("❌ LAYOUT - Layout initialization failed:", error);
      console.error("❌ LAYOUT - Error stack:", error.stack);
      throw error;
    }

    console.log("🏢 LAYOUT - init() END");
  }

  /**
   * Initialize the sidebar component
   */
  private async initSidebar(): Promise<void> {
    try {
      // Create sidebar configuration
      const sidebarConfig: SidebarConfig = {
        defaultWidth: this.config.sidebar?.defaultWidth ?? 280,
        compactWidth: this.config.sidebar?.compactWidth ?? 80,
        footer: {
          text: this.config.sidebar?.footer?.text ?? "© 2025 Opinion",
          showFooter: this.config.sidebar?.footer?.showFooter ?? true,
        },
      };

      console.log("🏢 LAYOUT - Creating sidebar with config:", sidebarConfig);
      this.sidebar = new SidebarComponent(sidebarConfig);

      // Initialize the sidebar
      await this.sidebar.init();
    } catch (error) {
      console.error("❌ LAYOUT - Sidebar initialization failed:", error);
      throw error;
    }
  }

  /**
   * Setup coordination between components
   */
  private setupComponentCoordination(): void {
    // Note: Component coordination is now handled by the layout context
    // All components subscribe to layout context events for coordination
    console.log("Layout - Component coordination delegated to layout context");
  }

  /**
   * Setup responsive behavior for the entire layout
   */
  private setupResponsiveBehavior(): void {
    // Initial responsive setup based on current mode
    this.updateComponentCSSClasses(this.layoutContext);
  }

  /**
   * Get header component reference
   */
  getHeader(): AppHeaderImpl {
    return this.header;
  }

  /**
   * Get footer component reference
   */
  getFooter(): AppFooterImpl {
    return this.footer;
  }

  /**
   * Get main content component reference
   */
  getMainContent(): MainContent {
    return this.mainContent;
  }

  /**
   * Get sidebar component reference
   */
  getSidebar(): Sidebar | null {
    return this.sidebar;
  }

  /**
   * Get layout context instance
   */
  getLayoutContext(): LayoutContext {
    return this.layoutContext;
  }

  /**
   * Update user information across all components
   */
  updateUser(user: HeaderUser): void {
    if (this.config.header?.enabled) {
      this.header.updateUser(user);
    }

    console.log("Layout - User updated across components");
  }

  /**
   * Update layout configuration
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };

    // Update header config
    if (config.header) {
      if (config.header.brandTitle || config.header.brandHref) {
        this.header.updateBrand(
          config.header.brandTitle ||
            this.config.header?.brandTitle ||
            "Opinion",
          config.header.brandHref ||
            this.config.header?.brandHref ||
            "/dashboard",
        );
      }
    }

    // Footer config cannot be updated after initialization
    // Footer configuration is set only at construction time
  }

  /**
   * Show/hide header
   */
  showHeader(show: boolean): void {
    this.header.setVisible(show);
    this.config.header!.enabled = show;
  }

  /**
   * Show/hide footer
   */
  showFooter(show: boolean): void {
    this.footer.setVisible(show);
    this.config.footer!.enabled = show;
  }

  /**
   * Show/hide sidebar
   */
  showSidebar(show: boolean): void {
    // Note: Sidebar visibility is now managed by the page component
    this.config.sidebar!.enabled = show;
  }

  /**
   * Get component references (duplicate methods removed)
   */
  getSidebarLegacy(): any | null {
    // Legacy method - use getSidebar() instead
    return this.getSidebar();
  }

  /**
   * Check if layout is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current layout state
   */
  getLayoutState(): {
    headerVisible: boolean;
    footerVisible: boolean;
    sidebarEnabled: boolean;
    viewport: "mobile" | "tablet" | "desktop";
  } {
    const width = window.innerWidth;
    const isMobile = width <= 768;
    const isTablet = width <= 1024;

    return {
      headerVisible: this.config.header?.enabled || false,
      footerVisible: this.config.footer?.enabled || false,
      sidebarEnabled: this.config.sidebar?.enabled || false,
      viewport: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
    };
  }

  /**
   * Update copyright text across components
   * Note: Footer copyright is now immutable (set at construction time)
   */
  updateCopyrightText(text: string): void {
    // Footer copyright is immutable - set only during construction
    console.warn(
      "Layout - Footer copyright text cannot be updated after initialization",
    );

    // Update sidebar copyright (if it exists) - this may still be dynamic
    const sidebarCopyright = document.querySelector(
      ".sidebar-footer .copyright-text",
    ) as HTMLElement;
    if (sidebarCopyright) {
      sidebarCopyright.textContent = text;
      console.log("Layout - Sidebar copyright text updated:", text);
    }
  }

  /**
   * Subscribe to layout context events
   */
  private subscribeToLayoutContext(): void {
    console.log("Layout - Subscribing to layout context events...");

    // Subscribe to layout ready events
    const layoutReadyUnsubscribe = this.layoutContext.subscribe(
      "layout-ready",
      this.handleLayoutReady.bind(this),
    );
    this.layoutUnsubscribers.push(layoutReadyUnsubscribe);

    // Subscribe to layout mode changes for CSS class management
    const layoutModeUnsubscribe = this.layoutContext.subscribe(
      "layout-mode-change",
      (event) => {
        if (event && event.data) {
          this.handleLayoutModeChange(event);
        } else {
          console.error(
            "Layout - Received invalid layout-mode-change event:",
            event,
          );
        }
      },
    );
    this.layoutUnsubscribers.push(layoutModeUnsubscribe);

    console.log("Layout - Successfully subscribed to layout context events ✅");
  }

  /**
   * Handle layout ready event
   */
  private handleLayoutReady(event: any): void {
    console.log("Layout - Layout context marked as ready:", event.data);

    // Perform any final coordination between components
    this.finalizeComponentCoordination();
  }

  /**
   * Handle sidebar dimension changes for global coordination
   */
  private handleSidebarDimensionsChange(event: any): void {
    const dimensions = event.data;
    console.log(
      "Layout - Received sidebar dimensions change for coordination:",
      dimensions,
    );

    // Layout component can perform any global coordination here
    // Individual components already handle their own layout updates

    // Example: Could update global CSS variables or dispatch custom events
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${dimensions.width}px`,
    );
    document.documentElement.style.setProperty(
      "--content-margin-left",
      `${dimensions.width}px`,
    );
  }

  /**
   * Finalize component coordination after layout is ready
   */
  private finalizeComponentCoordination(): void {
    console.log("Layout - Finalizing component coordination...");
  }

  /**
   * Handle layout mode changes and update component CSS classes
   */
  private handleLayoutModeChange(event: LayoutEvent): void {
    const layoutMode = event.data as LayoutMode;
    console.log("Layout - Received layout mode change:", layoutMode);

    if (layoutMode) {
      this.updateComponentCSSClasses(this.layoutContext);
    } else {
      console.error(
        "Layout - Received undefined layout mode data in event:",
        event,
      );
    }
  }

  /**
   * Update CSS classes for all layout components based on layout mode
   */
  private updateComponentCSSClasses(ctx: LayoutContextImpl): void {
    const type = ctx.getModeType();
    const isMobile = ctx.isLayoutMobile();
    const isTablet = ctx.isLayoutTablet();
    const isDesktop = ctx.isLayoutDesktop();
    const sidebarCompactMode = ctx.getSidebar()?.isCompactMode();

    console.log(`Layout - Updating component CSS classes for mode: ${type}`);

    // Get all layout components
    const components = {
      layout: document.querySelector(".app-layout") as HTMLElement,
      sidebar: document.querySelector(".app-sidebar") as HTMLElement,
      header: document.querySelector(".app-header") as HTMLElement,
      content: document.querySelector(
        ".app-content-scroll, .app-main",
      ) as HTMLElement,
      footer: document.querySelector(".app-footer") as HTMLElement,
    };

    // Define CSS class mappings for each mode
    const modeClasses = {
      mobile: "layout-mode-mobile",
      tablet: "layout-mode-tablet",
      desktop: "layout-mode-desktop",
      "desktop-compact": "layout-mode-desktop-compact",
    };

    const stateClasses = {
      compact: "layout-compact",
      mobile: "layout-mobile",
      tablet: "layout-tablet",
      desktop: "layout-desktop",
    };

    // Remove all existing layout mode classes and add current ones
    Object.values(components).forEach((element) => {
      if (element) {
        // Remove all previous layout mode classes
        Object.values(modeClasses).forEach((className) => {
          element.classList.remove(className);
        });
        Object.values(stateClasses).forEach((className) => {
          element.classList.remove(className);
        });

        // Add current layout mode class
        element.classList.add(modeClasses[type]);

        // Add state-based classes
        if (sidebarCompactMode) element.classList.add(stateClasses.compact);
        if (isMobile) element.classList.add(stateClasses.mobile);
        if (isTablet) element.classList.add(stateClasses.tablet);
        if (isDesktop) element.classList.add(stateClasses.desktop);
      }
    });

    // Update body classes for global CSS targeting
    const body = document.body;
    Object.values(modeClasses).forEach((className) => {
      body.classList.remove(className);
    });
    Object.values(stateClasses).forEach((className) => {
      body.classList.remove(className);
    });

    body.classList.add(modeClasses[type]);
    if (sidebarCompactMode) body.classList.add(stateClasses.compact);
    if (isMobile) body.classList.add(stateClasses.mobile);
    if (isTablet) body.classList.add(stateClasses.tablet);
    if (isDesktop) body.classList.add(stateClasses.desktop);

    // Set CSS custom properties for mode-specific styling
    const root = document.documentElement;
    root.style.setProperty("--layout-mode", type);
    root.style.setProperty("--is-compact", sidebarCompactMode ? "1" : "0");
    root.style.setProperty("--is-mobile", isMobile ? "1" : "0");
    root.style.setProperty("--is-tablet", isTablet ? "1" : "0");
    root.style.setProperty("--is-desktop", isDesktop ? "1" : "0");

    console.log("Layout - CSS classes updated:", {
      mode: type,
      addedClasses: [
        modeClasses[type],
        ...(sidebarCompactMode ? [stateClasses.compact] : []),
        ...(isMobile ? [stateClasses.mobile] : []),
        ...(isTablet ? [stateClasses.tablet] : []),
        ...(isDesktop ? [stateClasses.desktop] : []),
      ],
      components: Object.keys(components).filter(
        (key) => components[key as keyof typeof components] !== null,
      ),
    });
  }

  // =================================================================================
  // Navigation and User Menu Building Methods
  // =================================================================================

  /**
   * Set navigation items for the sidebar
   */
  public setNavigationItems(items: NavigationItem[]): void {
    this.navigationItems = [...items];
    console.log(
      "Layout - Navigation items updated:",
      this.navigationItems.length,
      "items",
    );

    // Update sidebar if it's available through layout context
    const sidebar = this.layoutContext.getSidebar();
    if (sidebar) {
      sidebar.updateNavigation(this.navigationItems);
      console.log("Layout - Navigation items applied to existing sidebar");
    } else {
      console.log(
        "Layout - Navigation items stored, will be applied when sidebar is registered",
      );
    }
  }

  /**
   * Get current navigation items
   */
  public getNavigationItems(): NavigationItem[] {
    return [...this.navigationItems];
  }

  /**
   * Update a specific navigation item
   */
  public updateNavigationItem(
    id: string,
    updates: Partial<NavigationItem>,
  ): void {
    const index = this.navigationItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.navigationItems[index] = {
        ...this.navigationItems[index],
        ...updates,
      };

      // Update sidebar if available
      const sidebar = this.layoutContext.getSidebar();
      if (sidebar) {
        sidebar.updateNavigation(this.navigationItems);
      }

      console.log(`Layout - Navigation item '${id}' updated`);
    } else {
      console.warn(`Layout - Navigation item with id '${id}' not found`);
    }
  }

  /**
   * Add a navigation item
   */
  public addNavigationItem(item: NavigationItem, position?: number): void {
    if (
      position !== undefined &&
      position >= 0 &&
      position <= this.navigationItems.length
    ) {
      this.navigationItems.splice(position, 0, item);
    } else {
      this.navigationItems.push(item);
    }

    // Update sidebar if available
    const sidebar = this.layoutContext.getSidebar();
    if (sidebar) {
      sidebar.updateNavigation(this.navigationItems);
    }

    console.log(`Layout - Navigation item '${item.id}' added`);
  }

  /**
   * Remove a navigation item
   */
  public removeNavigationItem(id: string): void {
    const index = this.navigationItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.navigationItems.splice(index, 1);

      // Update sidebar if available
      const sidebar = this.layoutContext.getSidebar();
      if (sidebar) {
        sidebar.updateNavigation(this.navigationItems);
      }

      console.log(`Layout - Navigation item '${id}' removed`);
    } else {
      console.warn(`Layout - Navigation item with id '${id}' not found`);
    }
  }

  /**
   * Set active navigation item
   */
  public setActiveNavigationItem(id: string): void {
    // Clear all active states
    this.navigationItems.forEach((item) => {
      item.active = false;
      if (item.children) {
        item.children.forEach((child) => (child.active = false));
      }
    });

    // Set active state for the specified item
    const item = this.navigationItems.find((item) => item.id === id);
    if (item) {
      item.active = true;
    } else {
      // Check in children
      for (const parentItem of this.navigationItems) {
        if (parentItem.children) {
          const childItem = parentItem.children.find(
            (child) => child.id === id,
          );
          if (childItem) {
            childItem.active = true;
            parentItem.expanded = true; // Expand parent if child is active
            break;
          }
        }
      }
    }

    // Update sidebar if available
    const sidebar = this.layoutContext.getSidebar();
    if (sidebar) {
      sidebar.updateNavigation(this.navigationItems);
      sidebar.setActivePage(id);
    }

    console.log(`Layout - Navigation item '${id}' set as active`);
  }

  /**
   * Set user menu items
   */
  public setUserMenuItems(items: UserMenuItem[]): void {
    this.userMenuItems = [...items];
    console.log(
      "Layout - User menu items updated:",
      this.userMenuItems.length,
      "items",
    );

    // Update header/user menu if it's available
    if (this.header) {
      this.header.updateUserMenuItems(this.userMenuItems);
      console.log("Layout - User menu items applied to header");
    } else {
      console.log(
        "Layout - User menu items stored, will be applied when header is available",
      );
    }
  }

  /**
   * Get current user menu items
   */
  public getUserMenuItems(): UserMenuItem[] {
    return [...this.userMenuItems];
  }

  /**
   * Update a specific user menu item
   */
  public updateUserMenuItem(id: string, updates: Partial<UserMenuItem>): void {
    const index = this.userMenuItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.userMenuItems[index] = { ...this.userMenuItems[index], ...updates };

      // Update header if available
      if (this.header) {
        this.header.updateUserMenuItems(this.userMenuItems);
      }

      console.log(`Layout - User menu item '${id}' updated`);
    } else {
      console.warn(`Layout - User menu item with id '${id}' not found`);
    }
  }

  /**
   * Add a user menu item
   */
  public addUserMenuItem(item: UserMenuItem, position?: number): void {
    if (
      position !== undefined &&
      position >= 0 &&
      position <= this.userMenuItems.length
    ) {
      this.userMenuItems.splice(position, 0, item);
    } else {
      this.userMenuItems.push(item);
    }

    // Update header if available
    if (this.header) {
      this.header.updateUserMenuItems(this.userMenuItems);
    }

    console.log(`Layout - User menu item '${item.id}' added`);
  }

  /**
   * Remove a user menu item
   */
  public removeUserMenuItem(id: string): void {
    const index = this.userMenuItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.userMenuItems.splice(index, 1);

      // Update header if available
      if (this.header) {
        this.header.updateUserMenuItems(this.userMenuItems);
      }

      console.log(`Layout - User menu item '${id}' removed`);
    } else {
      console.warn(`Layout - User menu item with id '${id}' not found`);
    }
  }

  /**
   * Get the navigation items to pass to sidebar components
   * This method is called by page components when creating sidebars
   */
  public getNavigationForSidebar(): NavigationItem[] {
    return this.getNavigationItems();
  }

  /**
   * Get the user menu items to pass to header components
   * This method is called during header initialization
   */
  public getUserMenuForHeader(): UserMenuItem[] {
    return this.getUserMenuItems();
  }

  /**
   * Get sidebar footer configuration to pass to sidebar components
   * This method is called by page components when creating sidebars
   */
  public getSidebarFooterConfig(): { text: string; showFooter: boolean } {
    return {
      text: this.config.sidebar?.footer?.text || "© 2025 Opinion",
      showFooter: this.config.sidebar?.footer?.showFooter ?? true,
    };
  }

  /**
   * Get sidebar configuration
   */
  public getSidebarConfig(): SidebarConfig {
    return {
      defaultWidth: this.config.sidebar?.defaultWidth ?? 280,
      compactWidth: this.config.sidebar?.compactWidth ?? 80,
      footer: {
        text: this.config.sidebar?.footer?.text ?? "© 2025 Opinion",
        showFooter: this.config.sidebar?.footer?.showFooter ?? true,
      },
    };
  }

  // =================================================================================
  // Error Messages Methods
  // =================================================================================

  /**
   * Get Messages interface - delegates to LayoutContext (exclusive access point)
   */
  public getMessages(): Messages | null {
    return this.layoutContext.getMessages();
  }

  /**
   * Check if layout is fully initialized
   */
  public get isLayoutInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Fluent interface method to work with LayoutContext
   * Provides safe access to LayoutContext with proper error handling
   * Defers handler execution until LayoutContext is fully initialized
   *
   * @param handler - Function that receives the LayoutContext instance
   * @returns Layout instance for method chaining
   */
  public withContext<T>(handler: (layoutContext: LayoutContext) => T): Layout {
    if (!this.layoutContext) {
      console.warn("Layout - LayoutContext not initialized yet");
      return this;
    }

    // If layout is already initialized and ready, execute immediately
    if (this.isInitialized && this.layoutContext.isReady()) {
      try {
        handler(this.layoutContext);
      } catch (error) {
        console.error("Layout - Error in withContext handler:", error);
      }
    } else {
      // Otherwise, save handler to class member for deferred execution
      this.deferredContextHandlers.push(handler);
      console.log(
        `Layout - Handler deferred, total pending: ${this.deferredContextHandlers.length}`,
      );
    }

    return this; // Return Layout for method chaining
  }

  /**
   * Execute all deferred context handlers
   * Called when LayoutContext is fully ready
   */
  private executeDeferredContextHandlers(): void {
    if (this.deferredContextHandlers.length === 0) {
      return;
    }

    console.log(
      `Layout - Executing ${this.deferredContextHandlers.length} deferred context handlers`,
    );

    const handlers = [...this.deferredContextHandlers];
    this.deferredContextHandlers = []; // Clear the array

    handlers.forEach((handler, index) => {
      try {
        console.log(
          `Layout - Executing deferred handler ${index + 1}/${handlers.length}`,
        );
        handler(this.layoutContext);
      } catch (error) {
        console.error(
          `Layout - Error in deferred context handler ${index + 1}:`,
          error,
        );
      }
    });

    console.log(
      `Layout - All ${handlers.length} deferred context handlers executed`,
    );
  }

  // All message methods are now accessed exclusively through LayoutContext.getMessages()
  // Use layout.getMessages() or layoutContext.getMessages() instead

  /**
   * Cleanup when layout is destroyed
   */
  destroy(): void {
    console.log("Layout - Destroying...");

    // Unsubscribe from layout context events
    this.layoutUnsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error(
          "Layout - Error unsubscribing from layout context:",
          error,
        );
      }
    });
    this.layoutUnsubscribers = [];

    // Clear any pending deferred context handlers
    if (this.deferredContextHandlers.length > 0) {
      console.log(
        `Layout - Clearing ${this.deferredContextHandlers.length} pending deferred context handlers`,
      );
      this.deferredContextHandlers = [];
    }

    // Unregister all components from LayoutContext
    this.layoutContext.unregisterAllComponents();

    // Destroy LayoutContext
    if (this.layoutContext) {
      this.layoutContext.destroy();
    }

    // Destroy all components
    if (this.header) {
      this.header.destroy();
    }

    if (this.sidebar) {
      this.layoutContext.unregisterSidebar();
      this.sidebar.destroy();
      this.sidebar = null;
    }

    if (this.footer) {
      this.footer.destroy();
    }

    if (this.messagesComponent) {
      this.messagesComponent.destroy();
      this.messagesComponent = null; // Clear reference after destruction
    }

    // Note: Sidebar destruction is now handled by the page component

    // Clean up global CSS variables
    const root = document.documentElement;
    root.style.removeProperty("--sidebar-width");
    root.style.removeProperty("--sidebar-right-border");
    root.style.removeProperty("--content-margin-left");
    root.style.removeProperty("--layout-mode");
    root.style.removeProperty("--is-compact");
    root.style.removeProperty("--is-mobile");
    root.style.removeProperty("--is-tablet");
    root.style.removeProperty("--is-desktop");

    // Clean up layout mode classes from body
    const layoutModeClasses = [
      "layout-mode-mobile",
      "layout-mode-tablet",
      "layout-mode-desktop",
      "layout-mode-desktop-compact",
      "layout-compact",
      "layout-mobile",
      "layout-tablet",
      "layout-desktop",
    ];
    layoutModeClasses.forEach((className) => {
      document.body.classList.remove(className);
    });

    // Remove window event listeners
    // Note: In a real app, you'd want to keep track of listeners to remove them properly

    this.isInitialized = false;
    console.log("Layout - Destroyed");
  }
}

export default Layout;
