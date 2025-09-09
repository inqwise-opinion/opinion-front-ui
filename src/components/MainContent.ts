/**
 * MainContent Component - Clean CSS Grid Integration
 * Manages the semantic main content area with Flexbox layout
 */

// Import component-scoped CSS
import "../assets/styles/components/main-content.css";
// Import layout context
import {
  getLayoutContext,
  type LayoutContext,
  type LayoutEvent,
} from "../contexts/index.js";
import type { Dimensions } from "./Sidebar.js";

export interface MainContentConfig {
  className?: string;
  id?: string;
  role?: string;
  ariaLabel?: string;
}

export class MainContent {
  private container: HTMLElement | null = null;
  private config: MainContentConfig;
  private isInitialized: boolean = false;
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];

  constructor(config: MainContentConfig = {}) {
    this.config = {
      className: "app-main main-content",
      id: "app", // Keep the existing id from HTML
      ...config,
    };

    this.layoutContext = getLayoutContext();
    console.log(
      "MainContent - Creating clean component with Flexbox layout...",
    );
  }

  /**
   * Initialize the main content area
   */
  init(): void {
    console.log("MainContent - Initializing...");

    if (this.isInitialized) {
      console.warn("MainContent - Already initialized");
      return;
    }

    // Create the main content element (will use existing app-main if available)
    this.createMainElement();

    // Subscribe to layout changes to ensure proper content positioning
    this.subscribeToLayoutContext();

    this.isInitialized = true;
    console.log("MainContent - Ready ✅");
  }

  /**
   * Create or use the existing main element
   */
  private createMainElement(): void {
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

    console.log("MainContent - Content updated");
  }

  /**
   * Append content to the main area
   */
  appendContent(content: string | HTMLElement): void {
    if (!this.container) {
      console.warn("MainContent - Cannot append content: not initialized");
      return;
    }

    if (typeof content === "string") {
      const temp = document.createElement("div");
      temp.innerHTML = content;
      while (temp.firstChild) {
        this.container.appendChild(temp.firstChild);
      }
    } else {
      this.container.appendChild(content);
    }

    console.log("MainContent - Content appended");
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
    console.log("MainContent - Content cleared");
  }

  /**
   * Add CSS class to main element
   */
  addClass(className: string): void {
    if (!this.container) {
      console.warn("MainContent - Cannot add class: not initialized");
      return;
    }

    this.container.classList.add(className);
  }

  /**
   * Remove CSS class from main element
   */
  removeClass(className: string): void {
    if (!this.container) {
      console.warn("MainContent - Cannot remove class: not initialized");
      return;
    }

    this.container.classList.remove(className);
  }

  /**
   * Toggle CSS class on main element
   */
  toggleClass(className: string): void {
    if (!this.container) {
      console.warn("MainContent - Cannot toggle class: not initialized");
      return;
    }

    this.container.classList.toggle(className);
  }

  /**
   * Update main content configuration
   */
  updateConfig(config: Partial<MainContentConfig>): void {
    this.config = { ...this.config, ...config };

    if (!this.container) return;

    // Update className if changed
    if (config.className) {
      this.container.className = config.className;
    }

    // Update id if changed
    if (config.id) {
      this.container.id = config.id;
    }

    // Update role if changed
    if (config.role) {
      this.container.setAttribute("role", config.role);
    }

    // Update aria-label if changed
    if (config.ariaLabel) {
      this.container.setAttribute("aria-label", config.ariaLabel);
    }

    console.log("MainContent - Configuration updated");
  }

  /**
   * Get the main content element
   */
  getElement(): HTMLElement | null {
    return this.container;
  }

  /**
   * Get current configuration
   */
  getConfig(): MainContentConfig {
    return { ...this.config };
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
   * Destroy the component
   */
  destroy(): void {
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

export default MainContent;
