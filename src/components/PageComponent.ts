/**
 * Base PageComponent Class
 *
 * Provides common functionality for all page-level components including:
 * - Initialization and cleanup lifecycle
 * - Event handling and delegation
 * - Layout management
 * - Common UI interactions
 * - Error handling
 */

import MainContentImpl from "./MainContentImpl";
import type { MainContent } from "./MainContent";

export interface PageComponentConfig {
  pageTitle?: string;
  layoutConfig?: any;
  autoInit?: boolean;
}

export abstract class PageComponent {
  protected initialized: boolean = false;
  protected destroyed: boolean = false;
  protected mainContent: MainContentImpl;
  protected config: PageComponentConfig;
  protected eventListeners: Array<{
    element: Element | Window | Document;
    event: string;
    handler: EventListener;
  }> = [];
  protected pageTitle: string;

  constructor(mainContent: MainContentImpl, config: PageComponentConfig = {}) {
    this.mainContent = mainContent;
    this.config = {
      autoInit: false,
      ...config,
    };

    this.pageTitle = config.pageTitle || "Page";

    if (this.config.autoInit) {
      // Initialize on next tick to allow subclass constructor to complete
      setTimeout(() => this.init(), 0);
    }
  }

  /**
   * Initialize the page component
   * Called automatically if autoInit is true, or manually by subclasses
   */
  public async init(): Promise<void> {
    if (!this.mainContent.isReady) {
      console.warn(`${this.constructor.name}: mainContent not ready`);
      return;
    }

    if (this.initialized || this.destroyed) {
      console.warn(
        `${this.constructor.name}: Cannot initialize - already initialized or destroyed`,
      );
      return;
    }

    try {
      console.log(`${this.constructor.name}: Initializing...`);

      // Wait for DOM if needed
      if (document.readyState === "loading") {
        await new Promise((resolve) => {
          document.addEventListener("DOMContentLoaded", resolve, {
            once: true,
          });
        });
      }

      // Initialize page-specific functionality
      await this.onInit();

      // Set up event listeners
      this.setupEventListeners();

      // Set up keyboard shortcuts
      this.setupKeyboardShortcuts();

      this.initialized = true;
      console.log(`${this.constructor.name}: Initialized successfully`);

      // Trigger post-initialization hook
      await this.onPostInit();
    } catch (error) {
      console.error(`${this.constructor.name}: Initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Cleanup and destroy the page component
   */
  public destroy(): void {
    if (this.destroyed) {
      console.warn(`${this.constructor.name}: Already destroyed`);
      return;
    }

    try {
      console.log(`${this.constructor.name}: Destroying...`);

      // Cleanup page-specific functionality
      this.onDestroy();

      // Remove all event listeners
      this.removeAllEventListeners();

      // Clear any intervals/timeouts
      this.clearTimers();

      this.destroyed = true;
      this.initialized = false;

      console.log(`${this.constructor.name}: Destroyed successfully`);
    } catch (error) {
      console.error(`${this.constructor.name}: Destruction failed:`, error);
    }
  }

  /**
   * Add an event listener with automatic cleanup tracking
   */
  protected addEventListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    element.addEventListener(event, handler, options);
    this.eventListeners.push({ element, event, handler });
  }

  /**
   * Remove all tracked event listeners
   */
  private removeAllEventListeners(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  /**
   * Handle event delegation for data-action attributes
   */
  protected setupEventDelegation(): void {
    this.addEventListener(document, "click", (event) => {
      const target = event.target as Element;
      const actionElement = target.closest("[data-action]");

      if (actionElement) {
        const action = actionElement.getAttribute("data-action");
        if (action) {
          event.preventDefault();
          this.handleAction(action, actionElement, event);
        }
      }
    });
  }

  /**
   * Handle data-action clicks
   */
  protected handleAction(action: string, element: Element, event: Event): void {
    const methodName = `handle${this.capitalizeFirst(action)}`;

    if (typeof (this as any)[methodName] === "function") {
      (this as any)[methodName](element, event);
    } else {
      console.warn(
        `${this.constructor.name}: No handler found for action '${action}' (${methodName})`,
      );
    }
  }

  /**
   * Set up common keyboard shortcuts
   */
  protected setupKeyboardShortcuts(): void {
    this.addEventListener(document, "keydown", (event: KeyboardEvent) => {
      this.handleKeydown(event);
    });
  }

  /**
   * Handle keyboard shortcuts - override in subclasses
   */
  protected handleKeydown(event: KeyboardEvent): void {
    // Common keyboard shortcuts
    if (event.key === "Escape") {
      this.handleEscape(event);
    }
  }

  /**
   * Handle Escape key - override in subclasses
   */
  protected handleEscape(event: KeyboardEvent): void {
    // Close any open dropdowns, modals, etc.
    const openDropdowns = document.querySelectorAll('[aria-expanded="true"]');
    openDropdowns.forEach((dropdown) => {
      dropdown.setAttribute("aria-expanded", "false");
    });
  }

  /**
   * Utility method to capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Clear any timers - override in subclasses if needed
   */
  protected clearTimers(): void {
    // Override in subclasses to clear specific timers
  }

  /**
   * Update the page title
   */
  protected updatePageTitle(title: string): void {
    this.pageTitle = title;
    document.title = title;

    // Update breadcrumb if exists
    const breadcrumbTitle = document.getElementById("current_page_title");
    if (breadcrumbTitle) {
      breadcrumbTitle.textContent = title;
    }
  }

  /**
   * Show loading state - delegates to MainContent
   */
  protected showLoading(message: string = "Loading..."): void {
    if (this.mainContent.isReady()) {
      this.mainContent.setLoading(true);
    }
    console.log(`${this.constructor.name}: ${message}`);
  }

  /**
   * Hide loading state - delegates to MainContent
   */
  protected hideLoading(): void {
    if (this.mainContent.isReady()) {
      this.mainContent.setLoading(false);
    }
    console.log(`${this.constructor.name}: Loading complete`);
  }

  /**
   * Show error message - delegates to MainContent
   */
  protected showError(message: string, error?: Error): void {
    if (this.mainContent.isReady()) {
      this.mainContent.setError(message);
    }
    console.error(`${this.constructor.name}: ${message}`, error);
  }

  /**
   * Clear error state - delegates to MainContent
   */
  protected clearError(): void {
    if (this.mainContent.isReady()) {
      this.mainContent.setError(null);
    }
  }

  /**
   * Get element with error handling
   */
  protected getElement(
    selector: string,
    required: boolean = true,
  ): Element | null {
    const element = document.querySelector(selector);

    if (!element && required) {
      console.error(
        `${this.constructor.name}: Required element not found: ${selector}`,
      );
    }

    return element;
  }

  /**
   * Get elements with error handling
   */
  protected getElements(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(selector);
  }

  // Abstract methods that subclasses must implement

  /**
   * Initialize page-specific functionality
   * Called during init() - override in subclasses
   */
  protected abstract onInit(): Promise<void> | void;

  /**
   * Post-initialization hook
   * Called after init() completes - override in subclasses if needed
   */
  protected onPostInit(): Promise<void> | void {
    // Optional override
  }

  /**
   * Cleanup page-specific functionality
   * Called during destroy() - override in subclasses
   */
  protected abstract onDestroy(): void;

  /**
   * Set up page-specific event listeners
   * Called during init() - override in subclasses
   */
  protected abstract setupEventListeners(): void;

  // Getters

  public get isInitialized(): boolean {
    return this.initialized;
  }

  public get isDestroyed(): boolean {
    return this.destroyed;
  }

  public get getPageTitle(): string {
    return this.pageTitle;
  }

  /**
   * Get layout context through MainContent
   */
  protected get layoutContext() {
    return this.mainContent.getLayoutContext();
  }

}

export default PageComponent;
