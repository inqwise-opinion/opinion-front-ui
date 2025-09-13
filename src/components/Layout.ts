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
import type {
  ContextHandler,
  LifecycleHandler,
  HandlerConfig,
  HandlerRegistration,
  HandlerResult,
  HandlerPriority,
} from "../types/LayoutHandlers";
import { isLifecycleHandler, isContextHandler } from "../types/LayoutHandlers";

// Re-export handler types for convenience
export type { ContextHandler, LifecycleHandler, HandlerConfig, HandlerResult };
export { HandlerPriority };

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
  // Unified handler system (replaces old onReadyHandlers)
  private registeredHandlers: Array<HandlerRegistration> = [];
  private contextHandlers: Array<ContextHandler | LifecycleHandler> = [];

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

      // Execute all registered handlers (unified system)
      await this.executeRegisteredHandlers();

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

  // Layout context access removed - use onContextReady() for setup/configuration
  // Direct context access is available to pages via PageComponent.layoutContext

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
   * Register a callback to execute when LayoutContext is ready
   * Provides safe access to LayoutContext with proper error handling
   * Defers handler execution until LayoutContext is fully initialized
   * 
   * NOTE: This method now uses the unified handler system internally
   *
   * @param handler - Function that receives the LayoutContext instance when ready
   * @returns Layout instance for method chaining
   */
  public onContextReady<T>(handler: (layoutContext: LayoutContext) => T): Layout {
    // Convert simple handler to ContextHandler and use new system
    const contextHandler: ContextHandler<T> = handler;
    
    return this.setContextHandler(contextHandler, {
      enableLogging: false, // Keep simple usage quiet by default
      continueOnError: true,
      timeout: 5000,
    });
  }

  /**
   * Convenience method: Register a simple handler with standard configuration
   * For more advanced scenarios, use setContextHandler() directly
   * 
   * @param handler - Simple context handler function
   * @param priority - Execution priority (optional)
   * @returns Layout instance for method chaining
   */
  public addHandler(handler: ContextHandler, priority?: number): Layout {
    return this.setContextHandler(handler, {
      enableLogging: false,
      continueOnError: true, 
      timeout: 5000,
    });
  }

  /**
   * Convenience method: Register a service registration handler
   * 
   * @param services - Array of services to register
   * @param id - Handler identifier (optional)
   * @param priority - Execution priority (optional)
   * @returns Layout instance for method chaining
   */
  public addServiceRegistration(
    services: Array<{ name: string; factory: (context: LayoutContext) => any; dependencies?: string[] }>,
    id?: string,
    priority: number = 500 // Default to high priority for service registration
  ): Layout {
    const lifecycleHandler: LifecycleHandler = {
      id: id || 'service-registration',
      priority,
      onContextReady: (context) => {
        services.forEach(({ name, factory, dependencies = [] }) => {
          const service = factory(context);
          context.registerService(name, service);
        });
      },
    };

    return this.setContextHandler(lifecycleHandler, {
      enableLogging: true,
      continueOnError: false, // Service registration should not fail silently
      timeout: 10000, // More time for service initialization
    });
  }

  // =====================================================================================
  // FORMAL HANDLER SYSTEM (Advanced Pattern)
  // =====================================================================================
  
  /**
   * Register a formal context handler with lifecycle support
   * This is the advanced handler pattern for complex service registration scenarios
   *
   * @param handler - ContextHandler or LifecycleHandler
   * @param config - Handler configuration options
   * @returns Layout instance for method chaining
   */
  public setContextHandler(
    handler: ContextHandler | LifecycleHandler,
    config: HandlerConfig = {}
  ): Layout {
    const defaultConfig: HandlerConfig = {
      timeout: 5000,
      continueOnError: true,
      enableLogging: true,
      ...config,
    };

    const registration: HandlerRegistration = {
      handler,
      config: defaultConfig,
      registered: new Date(),
    };

    this.registeredHandlers.push(registration);
    this.contextHandlers.push(handler);

    if (defaultConfig.enableLogging) {
      const handlerType = isLifecycleHandler(handler) ? 'LifecycleHandler' : 'ContextHandler';
      const id = isLifecycleHandler(handler) ? handler.id : 'anonymous';
      console.log(`Layout - Registered ${handlerType} (${id})`);
    }

    // If layout is already initialized, execute immediately
    if (this.isInitialized && this.layoutContext.isReady()) {
      this.executeHandler(registration);
    }

    return this;
  }

  /**
   * Register multiple context handlers at once
   * Handlers will be executed in the order they are provided
   *
   * @param handlers - Array of handler configurations
   * @returns Layout instance for method chaining
   */
  public setContextHandlers(
    handlers: Array<{ handler: ContextHandler | LifecycleHandler; config?: HandlerConfig }>
  ): Layout {
    handlers.forEach(({ handler, config }) => {
      this.setContextHandler(handler, config);
    });
    return this;
  }

  /**
   * Execute a single formal handler with full lifecycle support
   * @private
   */
  private async executeHandler(registration: HandlerRegistration): Promise<HandlerResult> {
    const { handler, config } = registration;
    const startTime = Date.now();
    
    let result: HandlerResult = {
      success: false,
      executionTime: 0,
    };

    try {
      if (isLifecycleHandler(handler)) {
        await this.executeLifecycleHandler(handler, config);
      } else {
        await this.executeContextHandler(handler, config);
      }
      
      result.success = true;
    } catch (error) {
      result.error = error as Error;
      if (config.enableLogging) {
        console.error('Layout - Handler execution failed:', error);
      }
      
      // Execute error handler if it's a lifecycle handler
      if (isLifecycleHandler(handler) && handler.onError) {
        try {
          await handler.onError(error as Error, this.layoutContext);
        } catch (errorHandlerError) {
          console.error('Layout - Error handler also failed:', errorHandlerError);
        }
      }
      
      if (!config.continueOnError) {
        throw error;
      }
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Execute a lifecycle handler with all phases
   * @private
   */
  private async executeLifecycleHandler(handler: LifecycleHandler, config: HandlerConfig): Promise<void> {
    const id = handler.id || 'anonymous';
    
    if (config.enableLogging) {
      console.log(`Layout - Executing LifecycleHandler: ${id}`);
    }

    // Phase 1: Pre-init
    if (handler.onPreInit) {
      if (config.enableLogging) {
        console.log(`Layout - Executing onPreInit for: ${id}`);
      }
      await this.executeWithTimeout(handler.onPreInit, config.timeout!);
    }

    // Phase 2: Main context ready
    if (config.enableLogging) {
      console.log(`Layout - Executing onContextReady for: ${id}`);
    }
    await this.executeWithTimeout(
      () => handler.onContextReady(this.layoutContext),
      config.timeout!
    );

    // Phase 3: Post-init
    if (handler.onPostInit) {
      if (config.enableLogging) {
        console.log(`Layout - Executing onPostInit for: ${id}`);
      }
      await this.executeWithTimeout(
        () => handler.onPostInit!(this.layoutContext),
        config.timeout!
      );
    }

    if (config.enableLogging) {
      console.log(`Layout - Completed LifecycleHandler: ${id}`);
    }
  }

  /**
   * Execute a simple context handler
   * @private
   */
  private async executeContextHandler(handler: ContextHandler, config: HandlerConfig): Promise<void> {
    if (config.enableLogging) {
      console.log('Layout - Executing ContextHandler');
    }
    
    await this.executeWithTimeout(
      () => handler(this.layoutContext),
      config.timeout!
    );
  }

  /**
   * Execute a function with timeout support
   * @private
   */
  private async executeWithTimeout<T>(
    fn: () => T | Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Handler execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(fn())
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Execute all registered formal handlers
   * Called during layout initialization
   * @private
   */
  private async executeRegisteredHandlers(): Promise<void> {
    if (this.registeredHandlers.length === 0) {
      return;
    }

    console.log(`Layout - Executing ${this.registeredHandlers.length} registered handlers`);

    // Sort handlers by priority (higher priority = executed first)
    const sortedRegistrations = [...this.registeredHandlers].sort((a, b) => {
      const priorityA = isLifecycleHandler(a.handler) ? a.handler.priority || 0 : 0;
      const priorityB = isLifecycleHandler(b.handler) ? b.handler.priority || 0 : 0;
      return priorityB - priorityA;
    });

    for (const registration of sortedRegistrations) {
      await this.executeHandler(registration);
    }

    console.log('Layout - All registered handlers executed');
  }

  /**
   * Get information about registered handlers
   */
  public getRegisteredHandlers(): Array<{
    type: 'ContextHandler' | 'LifecycleHandler';
    id?: string;
    priority?: number;
    registered: Date;
  }> {
    return this.registeredHandlers.map(({ handler, registered }) => ({
      type: isLifecycleHandler(handler) ? 'LifecycleHandler' : 'ContextHandler',
      id: isLifecycleHandler(handler) ? handler.id : undefined,
      priority: isLifecycleHandler(handler) ? handler.priority : undefined,
      registered,
    }));
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

    // Clear all registered handlers (unified system)
    if (this.registeredHandlers.length > 0) {
      console.log(
        `Layout - Clearing ${this.registeredHandlers.length} registered handlers`,
      );
      this.registeredHandlers = [];
      this.contextHandlers = [];
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
