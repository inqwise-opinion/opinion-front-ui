/**
 * Layout Context Implementation - Manages sidebar dimensions and layout coordination
 * Provides a centralized event system for layout components
 */

import type { Dimensions, Sidebar } from "../components/Sidebar";
import type { AppHeader } from "../components/AppHeader";
import type { AppFooter } from "../components/AppFooter";
import type { MainContent } from "../components/MainContent";
import type { Messages } from "../interfaces/Messages";
import type {
  LayoutContext,
  LayoutEventType,
  LayoutModeType,
  LayoutEvent,
  LayoutEventListener,
  LayoutViewPort,
} from "./LayoutContext";

export class LayoutContextImpl implements LayoutContext {
  private listeners: Map<LayoutEventType, Set<LayoutEventListener>> = new Map();
  private viewport: LayoutViewPort;
  private modeType: LayoutModeType;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private sidebarInstance: Sidebar | null = null;
  private isLayoutReady: boolean = false;

  // Component registry
  private headerInstance: AppHeader | null = null;
  private footerInstance: AppFooter | null = null;
  private mainContentInstance: MainContent | null = null;
  private messagesInstance: Messages | null = null;

  public constructor() {
    this.viewport = this.calculateViewPort();
    this.modeType = this.identifyModeType(this.viewport);
    this.setupViewportObserver();
    console.log("LayoutContext - Initialized with viewport:", this.viewport);
    console.log("LayoutContext - Initialized layout mode type:", this.modeType);
  }

  public getModeType(): LayoutModeType {
    return this.modeType;
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
  private calculateViewPort(): LayoutViewPort {
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
    const oldViewport = this.viewport;
    const oldModeType = this.modeType;

    const newViewPort = this.calculateViewPort();
    const newModeType = this.identifyModeType(this.viewport);

    this.viewport = newViewPort;

    // Check if layout mode type changed
    const layoutModeTypeChanged = oldModeType !== newModeType;
    console.debug(
      `LayoutContext - Viewport changed: ${newViewPort.width}x${newViewPort.height}`,
    );
    // Only log if layout mode type changed, not every pixel change
    if (layoutModeTypeChanged) {
      this.modeType = newModeType;
      console.log(
        `LayoutContext - Layout mode type changed: (${oldModeType} → ${newModeType})`,
      );

      // Emit layout mode change event when layout mode type actually changes
      this.emitLayoutModeChange(newViewPort, newModeType);
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

    this.emit("layout-ready", this);
  }

  /**
   * Check if layout is ready
   */
  public isReady(): boolean {
    return this.isLayoutReady;
  }

  /**
   * Destroy context and cleanup
   */
  public destroy(): void {
    console.log("LayoutContext - Destroying...");

    // Reset ready state
    this.isLayoutReady = false;

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
   * Emit layout mode change event
   */
  private emitLayoutModeChange(
    newViewPort: LayoutViewPort,
    newModeType: LayoutModeType,
  ): void {
    console.log("LayoutContext - fire layout-mode-change event");
    this.emit("layout-mode-change", {
      context: this,
      viewport: newViewPort,
      modeType: newModeType,
    });
  }

  // =================================================================================
  // Helper Methods for Viewport Type Checking
  // =================================================================================

  /**
   * Check if current layout mode type is mobile
   */
  public isLayoutMobile(): boolean {
    return this.modeType === "mobile";
  }

  /**
   * Check if current layout mode type is tablet
   */
  public isLayoutTablet(): boolean {
    return this.modeType === "tablet";
  }

  /**
   * Check if current layout mode type is desktop
   */
  public isLayoutDesktop(): boolean {
    return this.modeType === "desktop";
  }

  // =================================================================================
  // Sidebar Instance Management
  // =================================================================================

  /**
   * Register a sidebar instance with the LayoutContext
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
   * Get the current sidebar instance
   */
  public getSidebar(): Sidebar | null {
    return this.sidebarInstance;
  }

  // =================================================================================
  // Component Registration System
  // =================================================================================


  /**
   * Register the Header component instance with the context
   * Allows the context to coordinate header-related layout changes
   */
  public registerHeader(header: AppHeader): void {
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
  public registerFooter(footer: AppFooter): void {
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
  public registerMainContent(mainContent: MainContent): void {
    if (this.mainContentInstance && this.mainContentInstance !== mainContent) {
      console.warn(
        "LayoutContext - Replacing existing MainContent instance. This might indicate a setup issue.",
      );
    }

    this.mainContentInstance = mainContent;
    console.log(
      "LayoutContext - MainContent component registered successfully",
    );
  }

  /**
   * Register the Messages component instance with the context
   * Allows the context to coordinate message display
   */
  public registerMessages(messages: Messages): void {
    if (this.messagesInstance && this.messagesInstance !== messages) {
      console.warn(
        "LayoutContext - Replacing existing Messages instance. This might indicate a setup issue.",
      );
    }

    this.messagesInstance = messages;
    console.log("LayoutContext - Messages component registered successfully");
  }

  /**
   * Get the registered Header instance
   */
  public getHeader(): AppHeader | null {
    return this.headerInstance;
  }

  /**
   * Get the registered Footer instance
   */
  public getFooter(): AppFooter | null {
    return this.footerInstance;
  }

  /**
   * Get the registered MainContent instance
   */
  public getMainContent(): MainContent | null {
    return this.mainContentInstance;
  }

  /**
   * Get the registered Messages instance
   */
  public getMessagesComponent(): Messages | null {
    return this.messagesInstance;
  }

  /**
   * Get all registered component instances
   * Useful for debugging and coordination purposes
   */
  public getRegisteredComponents(): {
    header: AppHeader | null;
    footer: AppFooter | null;
    mainContent: MainContent | null;
    messages: Messages | null;
    sidebar: Sidebar | null;
  } {
    return {
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
    return !!(
      this.headerInstance &&
      this.footerInstance &&
      this.mainContentInstance &&
      this.messagesInstance
    );
  }

  /**
   * Unregister all components (used during cleanup)
   */
  public unregisterAllComponents(): void {
    console.log("LayoutContext - Unregistering all components");

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
  public getMessages(): import("../interfaces/Messages").Messages | null {
    const messagesComponent = this.getMessagesComponent();
    // MessagesComponent implements Messages interface directly
    return messagesComponent;
  }
}

export default LayoutContextImpl;
