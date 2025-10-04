/**
 * MainContent Component Implementation - Clean CSS Grid Integration
 * Manages the semantic main content area with Flexbox layout
 */

// Import component-scoped CSS
import "../assets/styles/components/main-content.css";
import BaseComponent from './BaseComponent';
// Import layout context
import {
  getLayoutContext,
  type LayoutContext,
  type LayoutEvent,
} from "../contexts";
import type { MainContent, MainContentConfig } from "./MainContent";
import { ComponentStatus, ComponentWithStatus } from "../interfaces/ComponentStatus";

export class MainContentImpl extends BaseComponent implements MainContent, ComponentWithStatus {
  private container: HTMLElement | null = null;
  private config: MainContentConfig;
  private isInitialized: boolean = false;
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];
  private initTime: number | null = null;
  private contentUpdateCount: number = 0;
  private lastContentUpdate: number | null = null;

  constructor(config: MainContentConfig = {}, layoutContext?: LayoutContext) {
    super();
    this.config = {
      className: "app-main main-content",
      id: "app", // Keep the existing id from HTML
      ...config,
    };

    // Use provided LayoutContext or fallback to global one
    this.layoutContext = layoutContext || getLayoutContext();
    console.log(
      "MainContent - Creating clean component with Flexbox layout...",
      layoutContext ? "(using provided LayoutContext)" : "(using global LayoutContext)"
    );
  }

  /**
   * Initialize the main content area
   */
  protected async onInit(): Promise<void> {
    console.log("MainContent - Initializing...");

    // Init validation now handled by BaseComponent

    // Create the main content element (will use existing app-main if available)
    await this.createMainElement();

    // Subscribe to layout changes to ensure proper content positioning
    this.subscribeToLayoutContext();

    this.layoutContext.registerMainContent(this);

    this.initTime = Date.now();
    this.isInitialized = true;
    console.log("MainContent - Ready ✅");
  }

  /**
   * Create or use the existing main element
   */
  private async createMainElement(): Promise<void> {
    // First, try to find the existing app-main element
    this.container = document.querySelector(".app-main");

    if (this.container) {
      console.log("MainContent - Using existing app-main element");

      // Clear the existing content (loading spinner)
      this.container.innerHTML = "";

      // Add the main-content class to the existing element
      this.container.classList.add("main-content");

      // Update the id if specified
      if (this.config.id && this.config.id !== "app") {
        this.container.id = this.config.id;
      }
    } else {
      // Fallback: Create main element using semantic HTML5 main tag
      console.log("MainContent - Creating new main element (fallback)");
      this.container = document.createElement("main");

      // Set basic attributes
      if (this.config.id) {
        this.container.id = this.config.id;
      }

      if (this.config.className) {
        this.container.className = this.config.className;
      }

      // Insert main element into the app layout structure
      this.insertIntoLayout();
    }

    // Set ARIA attributes for accessibility
    if (this.config.role) {
      this.container.setAttribute("role", this.config.role);
    }

    if (this.config.ariaLabel) {
      this.container.setAttribute("aria-label", this.config.ariaLabel);
    } else {
      // Default aria-label for main content
      this.container.setAttribute("aria-label", "Main content");
    }

    console.log("MainContent - Main element ready");
  }

  /**
   * Insert main element into proper semantic position
   */
  private insertIntoLayout(): void {
    const appLayout = document.querySelector(".app-layout");

    if (appLayout) {
      // Find the header element to insert main after it
      const header = appLayout.querySelector(".app-header");
      const footer = appLayout.querySelector(".app-footer");

      if (header && footer) {
        // Insert between header and footer
        appLayout.insertBefore(this.container!, footer);
        console.log(
          "MainContent - Inserted between header and footer in app-layout",
        );
      } else if (header) {
        // Insert after header
        if (header.nextSibling) {
          appLayout.insertBefore(this.container!, header.nextSibling);
        } else {
          appLayout.appendChild(this.container!);
        }
        console.log("MainContent - Inserted after header in app-layout");
      } else {
        // No header found, append to app-layout
        appLayout.appendChild(this.container!);
        console.log("MainContent - Appended to app-layout");
      }
    } else {
      // Fallback: insert into body
      document.body.appendChild(this.container!);
      console.log(
        "MainContent - Fallback: Appended to body (app-layout not found)",
      );
    }
  }

  /**
   * Set content in the main area
   */
  setContent(content: string | HTMLElement): void {
    if (!this.container) {
      console.warn("MainContent - Cannot set content: not initialized");
      return;
    }

    if (typeof content === "string") {
      this.container.innerHTML = content;
    } else {
      this.container.innerHTML = "";
      this.container.appendChild(content);
    }

    this.contentUpdateCount++;
    this.lastContentUpdate = Date.now();
    console.log("MainContent - Content updated");
  }


  /**
   * Clear all content from main area
   */
  clearContent(): void {
    if (!this.container) {
      console.warn("MainContent - Cannot clear content: not initialized");
      return;
    }

    this.container.innerHTML = "";
    this.contentUpdateCount++;
    this.lastContentUpdate = Date.now();
    console.log("MainContent - Content cleared");
  }



  /**
   * Get the main content element
   */
  getElement(): HTMLElement | null {
    // Throw if the element is not available (destroyed or not created)
    if (this.container === null) {
      throw new Error('MainContent element is not available');
    }
    return this.container;
  }


  /**
   * Check if main content is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.container !== null;
  }

  /**
   * Get the LayoutContext instance
   */
  getLayoutContext(): LayoutContext {
    return this.layoutContext;
  }

  /**
   * Show main content
   */
  show(): void {
    if (!this.container) return;

    this.container.style.display = "";
    this.container.removeAttribute("aria-hidden");
  }

  /**
   * Hide main content
   */
  hide(): void {
    if (!this.container) return;

    this.container.style.display = "none";
    this.container.setAttribute("aria-hidden", "true");
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    if (!this.container) return;

    if (loading) {
      this.container.classList.add("loading");
      this.container.setAttribute("aria-busy", "true");

      // Add loading indicator if not already present
      if (!this.container.querySelector(".loading-indicator")) {
        const loadingIndicator = document.createElement("div");
        loadingIndicator.className = "loading-indicator";
        loadingIndicator.innerHTML = `
          <div class="loading-spinner" aria-label="Loading content...">
            <div class="spinner"></div>
            <span class="loading-text">Loading...</span>
          </div>
        `;
        this.container.appendChild(loadingIndicator);
      }
    } else {
      this.container.classList.remove("loading");
      this.container.removeAttribute("aria-busy");

      // Remove loading indicator
      const loadingIndicator =
        this.container.querySelector(".loading-indicator");
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
    }
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    if (!this.container) return;

    if (error) {
      this.container.classList.add("error");

      // Add error message if not already present
      if (!this.container.querySelector(".error-message")) {
        const errorElement = document.createElement("div");
        errorElement.className = "error-message";
        errorElement.innerHTML = `
          <div class="error-content" role="alert" aria-live="assertive">
            <h2>Error</h2>
            <p>${error}</p>
            <button class="retry-button" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        `;
        this.container.appendChild(errorElement);
      }
    } else {
      this.container.classList.remove("error");

      // Remove error message
      const errorElement = this.container.querySelector(".error-message");
      if (errorElement) {
        errorElement.remove();
      }
    }
  }

  /**
   * Subscribe to layout context events
   */
  private subscribeToLayoutContext(): void {
    console.log("MainContent - Subscribing to layout context events...");

    // Subscribe to sidebar dimension changes
    const sidebarDimensionsUnsubscribe = this.layoutContext.subscribe(
      "sidebar-compact-mode-change",
      this.handleSidebarDimensionsChange.bind(this),
    );
    this.layoutUnsubscribers.push(sidebarDimensionsUnsubscribe);

    // Note: No longer subscribing to viewport-change - sidebar-dimensions-change is sufficient
    // The sidebar dimensions already encode all the viewport information we need

    // Set initial layout based on current layout mode
    this.updateContentLayout();

    console.log(
      "MainContent - Successfully subscribed to layout context events ✅",
    );
  }

  /**
   * Handle sidebar dimension changes from layout context
   */
  private handleSidebarDimensionsChange(event: LayoutEvent): void {
    const sidebarCompactMode = event.data as Boolean;
    console.log(
      "MainContent - Received sidebar dimensions change to:",
      sidebarCompactMode ? "'compact'" : "'expanded'",
    );
    this.updateContentLayout();
  }

  /**
   * Update content layout based on current layout mode
   */
  private updateContentLayout(): void {
    if (!this.container) return;

    // Get layout state directly from LayoutContext
    const sidebar = this.layoutContext.getSidebar();
    const sidebarCompactMode = sidebar?.isCompactMode();
    const layoutModeType = this.layoutContext.getModeType();
    const layoutMobile = this.layoutContext.isLayoutMobile();

    console.log("MainContent - Updating layout:", {
      sidebarCompactMode: sidebarCompactMode,
      layoutModeType: layoutModeType,
    });

    // Update CSS classes based on layout mode
    this.container.classList.toggle(
      "content-sidebar-compact",
      sidebarCompactMode && !layoutMobile,
    );
    this.container.classList.toggle(
      "content-sidebar-normal",
      !sidebarCompactMode && !layoutMobile,
    );
    this.container.classList.toggle("content-mobile", layoutMobile);

    // Remove any inline positioning - let CSS Grid handle layout
    this.container.style.left = "";
    this.container.style.width = "";
    this.container.style.marginLeft = "";

    console.log("MainContent - Layout updated:", {
      layoutMode: {
        type: layoutModeType,
        sidebarCompactMode: sidebarCompactMode,
      },
      cssClasses: Array.from(this.container.classList).filter((cls) =>
        cls.startsWith("content-"),
      ),
    });
  }

  /**
   * Get detailed status information for this component
   */
  getStatus(): ComponentStatus {
    const currentTime = Date.now();
    const activeContentElement = this.container?.querySelector(':not(.loading-indicator):not(.error-message)');
    const hasContent = activeContentElement && (activeContentElement.children.length > 0 || activeContentElement.textContent?.trim());
    
    return {
      componentType: 'MainContent',
      id: 'main-content',
      initialized: this.isInitialized,
      initTime: this.initTime,
      uptime: this.initTime ? currentTime - this.initTime : 0,
      domElement: this.container ? {
        tagName: this.container.tagName,
        id: this.container.id,
        className: this.container.className,
        childCount: this.container.children.length,
        hasContent: !!hasContent,
        isVisible: this.container.style.display !== 'none',
        ariaLabel: this.container.getAttribute('aria-label') || undefined,
        role: this.container.getAttribute('role') || undefined
      } : undefined,
      eventListeners: {
        layoutSubscriptions: this.layoutUnsubscribers.length
      },
      configuration: {
        ...this.config
      },
      currentState: {
        contentUpdateCount: this.contentUpdateCount,
        lastContentUpdate: this.lastContentUpdate,
        lastContentUpdateAgo: this.lastContentUpdate ? currentTime - this.lastContentUpdate : null,
        isLoading: this.container?.classList.contains('loading') || false,
        hasError: this.container?.classList.contains('error') || false,
        layoutModeType: this.layoutContext?.getModeType(),
        isLayoutMobile: this.layoutContext?.isLayoutMobile(),
        sidebarCompactMode: this.layoutContext?.getSidebar()?.isCompactMode()
      },
      performance: {
        initDuration: this.initTime ? (this.initTime - (this.initTime - 50)) : null // Rough estimate
      },
      issues: this.getIssues(),
      customData: {
        layoutUnsubscribers: this.layoutUnsubscribers.length,
        cssClasses: this.container ? Array.from(this.container.classList) : [],
        contentElements: this.container ? {
          total: this.container.children.length,
          loadingIndicator: !!this.container.querySelector('.loading-indicator'),
          errorMessage: !!this.container.querySelector('.error-message')
        } : undefined
      }
    };
  }
  
  /**
   * Get current issues with the component
   */
  private getIssues(): string[] {
    const issues: string[] = [];
    
    if (!this.isInitialized) {
      issues.push('Component not initialized');
    }
    
    if (!this.container) {
      issues.push('DOM container element missing');
    }
    
    if (this.container?.classList.contains('error')) {
      issues.push('Component is in error state');
    }
    
    if (!this.layoutContext) {
      issues.push('LayoutContext not available');
    }
    
    if (this.layoutUnsubscribers.length === 0 && this.isInitialized) {
      issues.push('No layout subscriptions active (possible memory leak or initialization issue)');
    }
    
    return issues;
  }

  /**
   * Destroy the component
   */
  protected onDestroy(): void {
    console.log("MainContent - Destroying...");

    // Unsubscribe from layout context events
    this.layoutUnsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error(
          "MainContent - Error unsubscribing from layout context:",
          error,
        );
      }
    });
    this.layoutUnsubscribers = [];

    // Remove DOM element
    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    // Reset state
    this.isInitialized = false;

    console.log("MainContent - Destroyed successfully");
  }
}

export default MainContentImpl;
