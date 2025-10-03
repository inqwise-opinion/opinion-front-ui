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
import { ActivePage, PageInfo } from "../interfaces/ActivePage";
import BaseComponent from './BaseComponent';
import type { PageContext } from "../interfaces/PageContext";
import {
  ChainHotkeyProvider,
  ChainHotkeyHandler,
  HotkeyExecutionContext,
} from "../hotkeys/HotkeyChainSystem";
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

export interface PageComponentConfig {
  pageTitle?: string;
  layoutConfig?: any;
  autoInit?: boolean;
  pageId?: string; // Optional override for page ID (deprecated - comes from PageContext)
  pagePath?: string; // URL path for this page (deprecated - comes from PageContext)
  params?: Record<string, string>; // Route parameters (deprecated - comes from PageContext)
}

export abstract class PageComponent extends BaseComponent implements ChainHotkeyProvider, ActivePage {
  protected initialized: boolean = false;
  protected destroyed: boolean = false;
  protected mainContent: MainContentImpl;
  protected config: PageComponentConfig;
  protected readonly logger: Logger;
  protected eventListeners: Array<{
    element: Element | Window | Document;
    event: string;
    handler: EventListener;
  }> = [];
  protected pageTitle: string;
  protected pageId: string;
  protected pagePath: string;
  protected params: Record<string, string> = {};
  protected chainProviderUnsubscriber: (() => void) | null = null;
  
  // PageContext integration (provided via constructor)
  protected pageContext: PageContext;

  constructor(mainContent: MainContentImpl, pageContext: PageContext, config: PageComponentConfig = {}) {
    super();
    this.logger = LoggerFactory.getInstance().getLogger(`PageComponent:${this.constructor.name}`);
    this.mainContent = mainContent;
    this.pageContext = pageContext;
    this.config = {
      autoInit: false,
      ...config,
    };

    // Get page info from PageContext (route-based)
    const routeContext = pageContext.getRouteContext();
    this.pagePath = routeContext.getPath();
    this.params = routeContext.getParams();
    
    // Use config overrides or defaults
    this.pageTitle = config.pageTitle || "Page";
    this.pageId = config.pageId || this.constructor.name;

    // Page association will be handled by RouterService

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
      this.logger.warn('mainContent not ready');
      return;
    }

    if (this.initialized || this.destroyed) {
      this.logger.warn('Cannot initialize - already initialized or destroyed');
      return;
    }

    try {
      this.logger.debug('Initializing...');

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
      
      // Register this page as chain hotkey provider
      this.logger.debug('Registering as chain hotkey provider...');
      this.chainProviderUnsubscriber = this.layoutContext.registerChainProvider(this);
      this.logger.debug('Chain provider registered successfully');
      
      // Register this page as the active page
      this.layoutContext.setActivePage(this);

      this.initialized = true;
      this.logger.info('Initialized successfully');

      // Trigger post-initialization hook
      await this.onPostInit();
    } catch (error) {
      this.logger.error('Initialization failed', error);
      throw error;
    }
  }

  /**
   * Cleanup and destroy the page component
   */
  public async destroy(): Promise<void> {
    if (this.destroyed) {
      this.logger.warn('Already destroyed');
      return;
    }

    try {
      this.logger.debug('Destroying...');

      // Cleanup chain provider
      this.cleanupChainProvider();
      
      // Deactivate this page if it's currently active
      this.layoutContext.deactivatePage(this);
      
      // PageContext cleanup handled by RouterService
      
      try {
        // Cleanup page-specific functionality
        this.onDestroy();
      } catch (error) {
        this.logger.error('onDestroy failed', error);
      }

      // Remove all event listeners
      this.removeAllEventListeners();

      // Clear any intervals/timeouts
      this.clearTimers();

      this.destroyed = true;
      this.initialized = false;

      this.logger.info('Destroyed successfully');
    } catch (error) {
      this.logger.error('Destruction failed', error);
      // Still mark as destroyed to prevent repeated attempts
      this.destroyed = true;
      this.initialized = false;
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
    
    // Also update title element if it exists
    const titleElement = document.getElementById('current_page_title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  /**
   * Show loading state
   */
  protected showLoading(message?: string): void {
    const loadingMessage = message || 'Loading...';
    console.log(`${this.constructor.name}: ${loadingMessage}`);
  }

  /**
   * Hide loading state
   */
  protected hideLoading(): void {
    console.log(`${this.constructor.name}: Loading complete`);
  }

  /**
   * Show error message
   */
  protected showError(message: string, error?: Error): void {
    console.error(`${this.constructor.name}: ${message}`, error);
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
   * Set route parameters
   */
  public setParams(params: Record<string, string>): void {
    this.params = params;
  }

  /**
   * Get current route parameters
   */
  public getParams(): Record<string, string> {
    return this.params;
  }

  /**
   * Get layout context through MainContent
   */
  protected get layoutContext() {
    return this.mainContent.getLayoutContext();
  }
  
  /**
   * Get PageContext
   * @returns PageContext instance
   */
  protected getPageContext(): PageContext {
    return this.pageContext;
  }
  
  /**
   * Check if PageContext is available (always true with new architecture)
   * @returns True (PageContext is always available)
   */
  protected hasPageContext(): boolean {
    return true;
  }
  
  
  // =================================================================================
  // ChainHotkeyProvider Implementation
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
   * Get chain hotkeys - override in subclasses to provide hotkeys
   * Base implementation provides common ESC key handling
   */
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    const hotkeys = new Map<string, ChainHotkeyHandler>();
    
    // Common ESC key handler for pages (cooperative)
    hotkeys.set('Escape', {
      key: 'Escape',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log(`🔤 ${this.constructor.name} - ESC key pressed via chain system`);
        this.handleEscape(ctx.event);
        ctx.next(); // Allow other handlers to also process ESC
      },
      description: `ESC key handling for ${this.constructor.name}`,
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable if needed */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    return hotkeys;
  }
  
  /**
   * Default chain behavior - continue to lower priority handlers
   */
  getDefaultChainBehavior(): 'next' | 'break' {
    return 'next'; // Pages are cooperative, allow fallback handlers
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
