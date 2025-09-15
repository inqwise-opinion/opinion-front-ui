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
import type { HotkeyProvider } from "../contexts/LayoutContext";
import type { ActivePage, PageInfo } from "../interfaces/ActivePage";
import {
  ChainHotkeyProvider,
  ChainHotkeyHandler,
  HotkeyExecutionContext,
} from "../hotkeys/HotkeyChainSystem";

export interface PageComponentConfig {
  pageTitle?: string;
  layoutConfig?: any;
  autoInit?: boolean;
  pageId?: string; // Optional override for page ID
  pagePath?: string; // URL path for this page
}

export abstract class PageComponent implements ChainHotkeyProvider, HotkeyProvider, ActivePage {
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
  protected pageId: string;
  protected pagePath: string;
  protected chainProviderUnsubscriber: (() => void) | null = null;

  constructor(mainContent: MainContentImpl, config: PageComponentConfig = {}) {
    this.mainContent = mainContent;
    this.config = {
      autoInit: false,
      ...config,
    };

    this.pageTitle = config.pageTitle || "Page";
    this.pageId = config.pageId || this.constructor.name;
    this.pagePath = config.pagePath || window.location.pathname;

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
      
      // Register this page as chain hotkey provider (new system)
      this.chainProviderUnsubscriber = this.layoutContext.registerChainProvider(this);
      
      // Also register as active hotkey provider for backward compatibility
      this.layoutContext.setActiveHotkeyProvider(this);
      
      // Register this page as the active page
      this.layoutContext.setActivePage(this);

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

      // Remove this page from active hotkeys
      this.layoutContext.removeActiveHotkeyProvider(this);
      
      // Cleanup chain provider (new system)
      this.cleanupChainProvider();
      
      // Deactivate this page if it's currently active
      this.layoutContext.deactivatePage(this);
      
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
   * Scoped to MainContent container instead of global document
   */
  protected setupEventDelegation(): void {
    const container = this.mainContent.getElement();
    if (container) {
      this.addEventListener(container, "click", (event) => {
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
    } else {
      console.warn(`${this.constructor.name}: Cannot setup event delegation - MainContent container not available`);
    }
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
   * Set up common keyboard shortcuts via LayoutContext hotkey system
   * Page-specific hotkeys are registered via getPageHotkeys() method
   */
  protected setupKeyboardShortcuts(): void {
    // Page-specific hotkeys are automatically registered via HotkeyProvider interface
    // when setActiveHotkeyProvider(this) is called in init()
    console.log(`${this.constructor.name}: Page-specific hotkeys will be registered via HotkeyProvider interface`);
  }

  // Note: handleKeydown() method removed - keyboard shortcuts now handled via LayoutContext hotkey system

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
  
  // =================================================================================
  // HotkeyProvider Implementation
  // =================================================================================
  
  /**
   * Default implementation - provides common page hotkeys
   * Override in subclasses to provide additional page-specific hotkeys
   */
  getPageHotkeys(): Map<string, (event: KeyboardEvent) => void | boolean> | null {
    const hotkeys = new Map<string, (event: KeyboardEvent) => void | boolean>();
    
    // Common ESC key handler for pages (lower priority than global)
    hotkeys.set("Escape", (event: KeyboardEvent) => {
      this.handleEscape(event);
      return true; // Allow event to continue (don't prevent default)
    });
    
    return hotkeys;
  }
  
  /**
   * Component identifier for hotkey management
   */
  getHotkeyComponentId(): string {
    return this.constructor.name;
  }
  
  // =================================================================================
  // ChainHotkeyProvider Implementation (New System)
  // =================================================================================
  
  /**
   * Get provider identifier for chain hotkey system
   */
  getHotkeyProviderId(): string {
    return this.constructor.name;
  }
  
  /**
   * Get provider priority - Page components get lower priority (200)
   */
  getProviderPriority(): number {
    return 200; // Lower priority than UI components, higher than fallback
  }
  
  /**
   * Get chain hotkeys - converts legacy getPageHotkeys() to chain format
   */
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    const legacyHotkeys = this.getPageHotkeys();
    if (!legacyHotkeys || legacyHotkeys.size === 0) {
      return null;
    }
    
    const chainHotkeys = new Map<string, ChainHotkeyHandler>();
    
    for (const [key, legacyHandler] of legacyHotkeys) {
      chainHotkeys.set(key, {
        key,
        providerId: this.getHotkeyProviderId(),
        enabled: true,
        handler: (ctx: HotkeyExecutionContext) => {
          this.handleChainHotkey(key, ctx, legacyHandler);
        },
        description: `Page hotkey: ${key} for ${this.constructor.name}`,
        priority: this.getProviderPriority(),
        enable: () => { /* Page hotkeys are always enabled when page is active */ },
        disable: () => { /* Could disable specific hotkeys if needed */ },
        isEnabled: () => this.initialized && !this.destroyed
      });
    }
    
    return chainHotkeys;
  }
  
  /**
   * Default chain behavior - continue to lower priority handlers
   */
  getDefaultChainBehavior(): 'next' | 'break' {
    return 'next'; // Pages are cooperative, allow fallback handlers
  }
  
  /**
   * Handle chain hotkey execution with legacy compatibility
   */
  private handleChainHotkey(
    key: string, 
    ctx: HotkeyExecutionContext, 
    legacyHandler: (event: KeyboardEvent) => void | boolean
  ): void {
    console.log(`🔤 ${this.constructor.name} - Chain hotkey: ${key}`);
    
    try {
      // Call the legacy handler
      const result = legacyHandler(ctx.event);
      
      // Handle legacy return values
      if (result === false) {
        // Legacy convention: false = prevent default and stop
        ctx.preventDefault();
        ctx.break();
      } else if (result === true || result === undefined) {
        // Legacy convention: true/undefined = continue normally
        // For pages, usually continue to allow lower priority handlers
        ctx.next();
      }
      
      console.log(`✅ ${this.constructor.name} - Handled ${key}: ${result === false ? 'break' : 'next'}`);
    } catch (error) {
      console.error(`❌ ${this.constructor.name} - Error handling ${key}:`, error);
      ctx.next(); // Continue chain on error
    }
  }
  
  /**
   * Cleanup chain provider
   */
  private cleanupChainProvider(): void {
    if (this.chainProviderUnsubscriber) {
      this.chainProviderUnsubscriber();
      this.chainProviderUnsubscriber = null;
      console.log(`${this.constructor.name} - Chain provider unregistered`);
    }
  }
  
  // =================================================================================
  // ActivePage Implementation
  // =================================================================================
  
  /**
   * Get information about this page
   */
  getPageInfo(): PageInfo {
    return {
      id: this.pageId,
      name: this.pageTitle,
      path: this.pagePath,
      metadata: {
        className: this.constructor.name,
        initialized: this.initialized,
        destroyed: this.destroyed,
      }
    };
  }
  
  /**
   * Get unique identifier for this page instance
   */
  getPageId(): string {
    return this.pageId;
  }
}

export default PageComponent;
