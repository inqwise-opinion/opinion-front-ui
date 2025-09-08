/**
 * Layout Context Implementation - Manages sidebar dimensions and layout coordination
 * Provides a centralized event system for layout components
 */

import type { Dimensions, Sidebar } from "../components/Sidebar";
import type {
  LayoutContext,
  LayoutEventType,
  LayoutModeType,
  LayoutMode,
  LayoutEvent,
  LayoutEventListener,
  LayoutViewPort,
} from "./LayoutContext";

export class LayoutContextImpl implements LayoutContext {
  private listeners: Map<LayoutEventType, Set<LayoutEventListener>> = new Map();
  private viewport: LayoutViewPort;
  private modeType: LayoutModeType;
  private layoutMode: LayoutMode;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private sidebarInstance: Sidebar | null = null;
  private isLayoutReady: boolean = false;
  private compact: boolean = false;
  
  // Component registry
  private layoutInstance: any = null;
  private headerInstance: any = null;
  private footerInstance: any = null;
  private mainContentInstance: any = null;
  private messagesInstance: any = null;

  public constructor() {
    this.viewport = this.getViewPort();
    this.modeType = this.identifyModeType(this.viewport);
    this.layoutMode = this.getInitialLayoutMode();
    this.setupViewportObserver();
    console.log("LayoutContext - Initialized with viewport:", this.viewport);
    console.log("LayoutContext - Initialized layout mode:", this.layoutMode);
  }

  private identifyModeType(viewport: LayoutViewPort): LayoutModeType {
    const isMobile = viewport.width <= 768;
    const isTablet = viewport.width > 768 && viewport.width <= 1024;
    const isDesktop = viewport.width > 1024;

    // Determine layout mode type
    let layoutModeType: LayoutModeType;
    if (isMobile) {
      layoutModeType = "mobile";
    } else if (isTablet) {
      layoutModeType = "tablet";
    } else {
      layoutModeType = "desktop"; // Default to non-compact desktop
    }

    return layoutModeType;
  }

  /**
   * Get current viewport dimensions
   */
  private getViewPort(): LayoutViewPort {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * Setup viewport observer for responsive updates
   */
  private setupViewportObserver(): void {
    // Use ResizeObserver for better performance if available
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        this.handleViewportChange();
      });
      this.resizeObserver.observe(document.body);
    }

    // Fallback to resize event listener
    window.addEventListener("resize", () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        this.handleViewportChange();
      }, 100);
    });
  }

  /**
   * Handle viewport changes - Pure event-driven approach
   */
  private handleViewportChange(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Calculate new layout mode type from viewport dimensions
    const newLayoutModeType = this.getLayoutModeTypeFromViewport(width);
    const oldLayoutModeType = this.modeType;

    // Update viewport state
    this.viewport = { width, height };

    // Check if layout mode type changed
    const layoutModeTypeChanged = oldLayoutModeType !== newLayoutModeType;

    // Only log if layout mode type changed, not every pixel change
    if (layoutModeTypeChanged) {
      console.log(
        `LayoutContext - Viewport type changed: ${width}x${height} (${oldLayoutModeType} → ${newLayoutModeType})`,
      );
    }

    // Update layout mode first (this will trigger layout-mode-change event only if type changed)
    this.updateLayoutMode();

    // For layout mode transitions, update CSS and emit events based on current sidebar instance state
    if (layoutModeTypeChanged) {
      const oldSidebarState = this.getSidebarDimensionsInternal();

      console.log("LayoutContext - Layout mode type changed:", {
        from: oldLayoutModeType,
        to: newLayoutModeType,
        sidebarState: oldSidebarState,
      });

      // Update CSS Grid variables based on current sidebar state
      this.updateCSSGridVariables();

      // Get current sidebar dimensions after viewport change (might be different due to mobile/desktop differences)
      const newSidebarState = this.getSidebarDimensionsInternal();

      // Emit sidebar dimensions change if the calculated dimensions changed
      if (JSON.stringify(oldSidebarState) !== JSON.stringify(newSidebarState)) {
        console.log(
          "LayoutContext - Sidebar dimensions changed due to layout mode transition:",
          {
            old: oldSidebarState,
            new: newSidebarState,
          },
        );
        this.emit("sidebar-dimensions-change", newSidebarState);
      }

      // Emit layout mode change event when layout mode type actually changes
      this.emitLayoutModeChange();
    }
  }

  /**
   * Subscribe to layout events
   */
  public subscribe(
    eventType: LayoutEventType,
    listener: LayoutEventListener,
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    console.log(
      `LayoutContext - Subscribed to ${eventType} (${this.listeners.get(eventType)!.size} total listeners)`,
    );

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(listener);
        console.log(
          `LayoutContext - Unsubscribed from ${eventType} (${eventListeners.size} remaining)`,
        );
      }
    };
  }

  /**
   * Emit layout event
   */
  public emit(eventType: LayoutEventType, data: any): void {
    const event: LayoutEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
    };

    const eventListeners = this.listeners.get(eventType);
    if (eventListeners && eventListeners.size > 0) {
      console.log(
        `LayoutContext - Emitting ${eventType} to ${eventListeners.size} listeners:`,
        data,
      );

      eventListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(
            `LayoutContext - Error in ${eventType} listener:`,
            error,
          );
        }
      });
    } else {
      // Only log on first occurrence or important events to reduce console noise
      if (eventType === "layout-ready") {
        console.log(
          `LayoutContext - No listeners for ${eventType}, event ignored`,
        );
      }
    }
  }

  /**
   * Notify that sidebar dimensions have changed (called by sidebar component)
   * This method triggers layout updates based on current sidebar instance state
   * NOTE: This method does NOT emit layout-mode-change events to prevent infinite recursion
   */
  public notifySidebarDimensionsChanged(): void {
    if (!this.sidebarInstance) {
      console.warn(
        "LayoutContext - No sidebar instance registered, ignoring dimension change notification",
      );
      return;
    }

    const currentDimensions = this.getSidebarDimensionsInternal();

    console.log(
      "LayoutContext - Sidebar dimensions change notification received:",
      currentDimensions,
    );

    // Update CSS Grid variables immediately based on current sidebar state
    this.updateCSSGridVariables();

    // Emit change event with current sidebar dimensions
    //this.emit("sidebar-dimensions-change", currentDimensions);

    // NOTE: Do NOT emit layout-mode-change here to prevent circular dependency
    // Layout mode changes are only emitted when viewport type changes (mobile/tablet/desktop)
  }

  /**
   * Internal method to get current sidebar dimensions with fallback
   * Used internally by methods that need sidebar dimensions
   */
  private getSidebarDimensionsInternal(): Dimensions {
    const sidebar = this.getSidebar();
    if (sidebar) {
      return sidebar.getDimensions();
    }

    // Fallback: calculate dimensions based on current layout mode type
    const isMobile = this.isLayoutMobile();

    if (isMobile) {
      return {
        width: 0,
        isVisible: false,
      };
    }

    // For desktop/tablet without registered sidebar, use layout mode defaults
    const mode = this.layoutMode;
    return {
      width: mode.sidebarBehavior.defaultWidth,
      isVisible: mode.sidebarBehavior.isVisible,
    };
  }

  /**
   * Get current viewport info
   */
  public getViewport(): LayoutViewPort {
    return { ...this.viewport };
  }

  /**
   * Mark layout as ready (called when all components are initialized)
   */
  public markReady(): void {
    console.log("LayoutContext - Layout marked as ready");

    // Set ready state
    this.isLayoutReady = true;

    // Ensure CSS Grid variables are set correctly on initialization
    this.updateCSSGridVariables();

    // Emit initial layout mode
    this.emitLayoutModeChange();

    this.emit("layout-ready", this.getLayoutMode());
  }

  /**
   * Check if layout is ready
   */
  public isReady(): boolean {
    return this.isLayoutReady;
  }

  /**
   * Calculate layout dimensions for components
   */
  public calculateContentArea(): {
    left: number;
    width: number;
    availableWidth: number;
  } {
    const viewport = this.viewport;
    const sidebar = this.getSidebarDimensionsInternal();
    const isMobile = this.isLayoutMobile();

    if (isMobile) {
      // Mobile: full width content
      return {
        left: 0,
        width: viewport.width,
        availableWidth: viewport.width,
      };
    }

    // Desktop/tablet: account for sidebar
    return {
      left: sidebar.width,
      width: viewport.width - sidebar.width,
      availableWidth: viewport.width - sidebar.width,
    };
  }

  /**
   * Destroy context and cleanup
   */
  public destroy(): void {
    console.log("LayoutContext - Destroying...");

    // Reset ready state
    this.isLayoutReady = false;
    
    // Reset compact state
    this.compact = false;

    // Clear all listeners
    this.listeners.clear();

    // Cleanup resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clear timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Remove window listeners
    // Note: In a real implementation, you'd want to track listeners to remove them properly

    // No singleton cleanup needed
    console.log("LayoutContext - Destroyed");
  }

  /**
   * Update CSS Grid variables to reflect current sidebar state
   */
  private updateCSSGridVariables(): void {
    const root = document.documentElement;
    const appLayout = document.querySelector(".app-layout") as HTMLElement;

    if (appLayout) {
      const sidebar = this.getSidebarDimensionsInternal();
      const isMobile = this.isLayoutMobile();

      if (isMobile) {
        // Mobile: sidebar is overlay, so grid should be single column
        appLayout.style.gridTemplateColumns = "1fr";
        appLayout.style.gridTemplateAreas = `
          "header"
          "content"
        `;
      } else {
        // Desktop/tablet: update sidebar width in grid using CSS variables
        const sidebarWidth = `${sidebar.width}px`;
        const isCompact = this.layoutMode.type === "desktop-compact";
        const compactWidth = `${
          isCompact
            ? this.layoutMode.sidebarBehavior.compactWidth
            : this.layoutMode.sidebarBehavior.defaultWidth
        }px`;

        // Set CSS custom properties on the layout element (higher specificity than media queries)
        appLayout.style.setProperty("--sidebar-width", sidebarWidth);
        appLayout.style.setProperty("--sidebar-compact-width", compactWidth);
        appLayout.style.setProperty(
          "--sidebar-right-border",
          `${sidebar.width}px`,
        );

        // Also update root for other components
        root.style.setProperty("--sidebar-width", sidebarWidth);
        root.style.setProperty("--sidebar-right-border", `${sidebar.width}px`);

        // Let CSS handle grid template columns via variables
        appLayout.style.gridTemplateColumns = "";
        appLayout.style.gridTemplateAreas = `
          "sidebar header"
          "sidebar content"
        `;
      }

      // Update layout classes for CSS hooks
      const isCompact = this.layoutMode.type === "desktop-compact";
      appLayout.classList.toggle("sidebar-compact", isCompact && !isMobile);
      appLayout.classList.toggle("mobile-layout", isMobile);

      console.log("LayoutContext - CSS Grid variables updated:", {
        sidebarWidth: sidebar.width,
        gridColumns: appLayout.style.gridTemplateColumns,
        isCompact: this.layoutMode.type === "desktop-compact",
        isMobile: isMobile,
      });
    }
  }

  /**
   * Calculate current layout mode based on viewport and sidebar state
   */
  private calculateLayoutMode(): LayoutMode {
    const viewport = this.viewport;
    const sidebar = this.getSidebarDimensionsInternal();
    const isCompact = this.sidebarInstance?.isCompactMode() || false;

    // Update internal compact state
    this.compact = isCompact;

    // Use current layout mode type and check for compact state
    const currentType = this.modeType;
    let type: LayoutModeType = currentType;

    // Only apply compact mode for desktop layout mode type
    if (currentType === "desktop" && isCompact) {
      type = "desktop-compact";
    }

    // Calculate flags based on layout mode type
    const isMobile = type === "mobile";
    const isTablet = type === "tablet";
    const isDesktop = type === "desktop" || type === "desktop-compact";

    return {
      type,
      isCompact,
      isMobile,
      isTablet,
      isDesktop,
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
      sidebar: {
        width: sidebar.width,
        isVisible: sidebar.isVisible,
      },
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1025,
      },
      sidebarBehavior: {
        isVisible: !isMobile,
        canToggle: !isMobile,
        defaultWidth: 280,
        compactWidth: 80,
      },
    };
  }

  /**
   * Emit layout mode change event
   */
  private emitLayoutModeChange(): void {
    const layoutMode = this.calculateLayoutMode();
    console.log("LayoutContext - Layout mode changed:", layoutMode);
    this.emit("layout-mode-change", layoutMode);
  }

  /**
   * Get current layout mode
   */
  public getLayoutMode(): LayoutMode {
    return this.calculateLayoutMode();
  }

  /**
   * Get initial layout mode
   */
  private getInitialLayoutMode(): LayoutMode {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;

    let type: LayoutModeType;
    if (isMobile) {
      type = "mobile";
    } else if (isTablet) {
      type = "tablet";
    } else {
      type = "desktop";
    }

    return {
      type,
      isCompact: false, // Default to non-compact mode
      isMobile,
      isTablet,
      isDesktop,
      viewport: { width, height },
      sidebar: {
        width: isMobile ? 0 : 280, // Fallback for initial load
        isVisible: !isMobile,
      },
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1025,
      },
      sidebarBehavior: {
        isVisible: !isMobile, // Visible on both tablet and desktop
        canToggle: !isMobile, // Can toggle on both tablet and desktop
        defaultWidth: 280, // CSS strict width - consistent across all screen sizes
        compactWidth: 80, // CSS strict width - consistent across all screen sizes
      },
    };
  }

  /**
   * Update layout mode when viewport changes
   */
  private updateLayoutMode(): void {
    const oldMode = { ...this.layoutMode };
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= this.layoutMode.breakpoints.mobile;
    const isTablet =
      width > this.layoutMode.breakpoints.mobile &&
      width <= this.layoutMode.breakpoints.tablet;
    const isDesktop = width > this.layoutMode.breakpoints.tablet;

    let type: LayoutModeType;
    if (isMobile) {
      type = "mobile";
    } else if (isTablet) {
      type = "tablet";
    } else {
      type = "desktop";
    }

    // Check if layout mode type changed
    const modeTypeChanged = oldMode.type !== type;

    // Always update layout mode (for viewport dimensions)
    const sidebar = this.getSidebarDimensionsInternal();
    const isCompact = this.sidebarInstance?.isCompactMode() || false;
    
    // Update internal compact state
    this.compact = isCompact;
    
    this.layoutMode = {
      ...this.layoutMode,
      type,
      isCompact,
      isMobile,
      isTablet,
      isDesktop,
      viewport: { width, height },
      sidebar: {
        width: sidebar.width,
        isVisible: sidebar.isVisible,
      },
      sidebarBehavior: {
        isVisible: !isMobile, // Visible on both tablet and desktop
        canToggle: !isMobile, // Can toggle on both tablet and desktop
        defaultWidth: 280, // CSS strict width - consistent across all screen sizes
        compactWidth: 80, // CSS strict width - consistent across all screen sizes
      },
    };

    // Update the mode type
    this.modeType = type;

    // Only emit layout mode change event if the mode TYPE changed (mobile ↔ tablet ↔ desktop)
    if (modeTypeChanged) {
      console.log(
        `LayoutContext - Layout mode TYPE changed: ${oldMode.type} → ${type}`,
      );
      this.emit("layout-mode-change", this.layoutMode);
    }
    // Note: Viewport size changes within the same mode are tracked silently (no logging/events)
  }

  /**
   * Get sidebar dimensions based on current layout mode and compact state
   */
  public calculateSidebarDimensions(isCompact: boolean = false): {
    width: number;
    isVisible: boolean;
  } {
    const mode = this.layoutMode;

    if (!mode.sidebarBehavior.isVisible) {
      return { width: 0, isVisible: false };
    }

    return {
      width: isCompact
        ? mode.sidebarBehavior.compactWidth
        : mode.sidebarBehavior.defaultWidth,
      isVisible: true,
    };
  }

  /**
   * Get layout breakpoints
   */
  public getBreakpoints() {
    return { ...this.layoutMode.breakpoints };
  }

  /**
   * Check if sidebar can toggle in current mode
   */
  public canSidebarToggle(): boolean {
    return this.layoutMode.sidebarBehavior.canToggle;
  }

  /**
   * Check if current layout is in compact mode
   */
  public isCompact(): boolean {
    return this.compact;
  }

  // =================================================================================
  // Helper Methods for Viewport Type Checking
  // =================================================================================

  /**
   * Check if current layout mode type is mobile
   */
  private isLayoutMobile(): boolean {
    return this.modeType === "mobile";
  }

  /**
   * Check if current layout mode type is tablet
   */
  private isLayoutTablet(): boolean {
    return this.modeType === "tablet";
  }

  /**
   * Check if current layout mode type is desktop (including compact)
   */
  private isLayoutDesktop(): boolean {
    return (
      this.modeType === "desktop" ||
      this.modeType === "desktop-compact"
    );
  }

  /**
   * Get layout mode type from viewport dimensions
   */
  private getLayoutModeTypeFromViewport(width: number): LayoutModeType {
    if (width <= 768) {
      return "mobile";
    } else if (width <= 1024) {
      return "tablet";
    } else {
      return "desktop";
    }
  }

  // =================================================================================
  // Sidebar Instance Management
  // =================================================================================

  /**
   * Register a sidebar instance with the LayoutContext
   * This allows centralized access to the sidebar through the context
   *
   * @param sidebar - The sidebar instance implementing ISidebar interface
   */
  public registerSidebar(sidebar: Sidebar): void {
    if (this.sidebarInstance && this.sidebarInstance !== sidebar) {
      console.warn(
        "LayoutContext - Replacing existing sidebar instance. This might indicate a setup issue.",
      );
    }

    this.sidebarInstance = sidebar;
    console.log("LayoutContext - Sidebar instance registered successfully");
  }

  /**
   * Unregister the current sidebar instance
   * Should be called during cleanup or when switching sidebars
   */
  public unregisterSidebar(): void {
    if (this.sidebarInstance) {
      console.log("LayoutContext - Unregistering sidebar instance");
      this.sidebarInstance = null;
    }
  }

  /**
   * Get the current sidebar instance
   * Provides centralized access to the sidebar through LayoutContext
   *
   * @returns The registered sidebar instance or null if none is registered
   */
  public getSidebar(): Sidebar | null {
    return this.sidebarInstance;
  }

  /**
   * Check if a sidebar instance is currently registered
   *
   * @returns True if a sidebar is registered, false otherwise
   */
  public hasSidebar(): boolean {
    return this.sidebarInstance !== null;
  }

  /**
   * Execute a method on the registered sidebar instance if available
   * This provides a safe way to interact with the sidebar without null checks
   *
   * @param callback - Function that receives the sidebar instance
   * @returns The result of the callback, or null if no sidebar is registered
   */
  public withSidebar<T>(callback: (sidebar: Sidebar) => T): T | null {
    if (this.sidebarInstance) {
      try {
        return callback(this.sidebarInstance);
      } catch (error) {
        console.error(
          "LayoutContext - Error executing sidebar callback:",
          error,
        );
        return null;
      }
    }
    return null;
  }

  // =================================================================================
  // Component Registration System
  // =================================================================================

  /**
   * Register the Layout component instance with the context
   * Allows the context to coordinate with the main layout controller
   */
  public registerLayout(layout: any): void {
    if (this.layoutInstance && this.layoutInstance !== layout) {
      console.warn(
        "LayoutContext - Replacing existing Layout instance. This might indicate a setup issue.",
      );
    }

    this.layoutInstance = layout;
    console.log("LayoutContext - Layout component registered successfully");
  }

  /**
   * Register the Header component instance with the context
   * Allows the context to coordinate header-related layout changes
   */
  public registerHeader(header: any): void {
    if (this.headerInstance && this.headerInstance !== header) {
      console.warn(
        "LayoutContext - Replacing existing Header instance. This might indicate a setup issue.",
      );
    }

    this.headerInstance = header;
    console.log("LayoutContext - Header component registered successfully");
  }

  /**
   * Register the Footer component instance with the context
   * Allows the context to coordinate footer-related layout changes
   */
  public registerFooter(footer: any): void {
    if (this.footerInstance && this.footerInstance !== footer) {
      console.warn(
        "LayoutContext - Replacing existing Footer instance. This might indicate a setup issue.",
      );
    }

    this.footerInstance = footer;
    console.log("LayoutContext - Footer component registered successfully");
  }

  /**
   * Register the MainContent component instance with the context
   * Allows the context to coordinate content area layout changes
   */
  public registerMainContent(mainContent: any): void {
    if (this.mainContentInstance && this.mainContentInstance !== mainContent) {
      console.warn(
        "LayoutContext - Replacing existing MainContent instance. This might indicate a setup issue.",
      );
    }

    this.mainContentInstance = mainContent;
    console.log("LayoutContext - MainContent component registered successfully");
  }

  /**
   * Register the Messages component instance with the context
   * Allows the context to coordinate message display
   */
  public registerMessages(messages: any): void {
    if (this.messagesInstance && this.messagesInstance !== messages) {
      console.warn(
        "LayoutContext - Replacing existing Messages instance. This might indicate a setup issue.",
      );
    }

    this.messagesInstance = messages;
    console.log("LayoutContext - Messages component registered successfully");
  }

  /**
   * Get the registered Layout instance
   */
  public getLayout(): any | null {
    return this.layoutInstance;
  }

  /**
   * Get the registered Header instance
   */
  public getHeader(): any | null {
    return this.headerInstance;
  }

  /**
   * Get the registered Footer instance
   */
  public getFooter(): any | null {
    return this.footerInstance;
  }

  /**
   * Get the registered MainContent instance
   */
  public getMainContent(): any | null {
    return this.mainContentInstance;
  }

  /**
   * Get the registered Messages instance
   */
  public getMessagesComponent(): any | null {
    return this.messagesInstance;
  }

  /**
   * Get all registered component instances
   * Useful for debugging and coordination purposes
   */
  public getRegisteredComponents(): {
    layout: any | null;
    header: any | null;
    footer: any | null;
    mainContent: any | null;
    messages: any | null;
    sidebar: Sidebar | null;
  } {
    return {
      layout: this.layoutInstance,
      header: this.headerInstance,
      footer: this.footerInstance,
      mainContent: this.mainContentInstance,
      messages: this.messagesInstance,
      sidebar: this.sidebarInstance,
    };
  }

  /**
   * Check if all core components are registered
   */
  public areAllComponentsRegistered(): boolean {
    return !!(this.layoutInstance && this.headerInstance && this.footerInstance && this.mainContentInstance && this.messagesInstance);
  }

  /**
   * Unregister all components (used during cleanup)
   */
  public unregisterAllComponents(): void {
    console.log("LayoutContext - Unregistering all components");
    
    this.layoutInstance = null;
    this.headerInstance = null;
    this.footerInstance = null;
    this.mainContentInstance = null;
    this.messagesInstance = null;
    this.sidebarInstance = null;
    
    console.log("LayoutContext - All components unregistered");
  }

  // =================================================================================
  // Messages Interface Access - All message functionality accessed via getMessages()
  // =================================================================================

  /**
   * Get Messages interface - exclusive access point to messages functionality
   * Returns MessagesComponent instance that implements Messages interface
   */
  public getMessages(): import('../interfaces/Messages').Messages | null {
    const messagesComponent = this.getMessagesComponent();
    // MessagesComponent implements Messages interface directly
    return messagesComponent;
  }
}

export default LayoutContextImpl;
