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
import type {
  ActivePage,
  ActivePageConsumer,
  ActivePageProvider,
} from "../interfaces/ActivePage";
import type { Service, ServiceConfig } from "../interfaces/Service";
import { ServiceError } from "../interfaces/Service";
import type { EventBus, Consumer } from "../lib/EventBus";
import { EventBusImpl } from "../lib/EventBusImpl";
import {
  LayoutEventFactory,
  type TypedLayoutEvent,
} from "./LayoutEventFactory";
import {
  ChainHotkeyManager,
  ChainHotkeyProvider,
  ChainExecutionResult,
} from "../hotkeys/HotkeyChainSystem";
import { ChainHotkeyManagerImpl } from "../hotkeys/ChainHotkeyManagerImpl";
import type { PageContext, PageContextConfig } from "../interfaces/PageContext";
import { PageContextImpl } from "./PageContextImpl";
import { ServiceReference, ServiceReferenceConfig } from "../services/ServiceReference";

export class LayoutContextImpl implements LayoutContext {
  // Note: Removed dedicated listeners map - now using EventBus for all events
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

  // Chain-Based Hotkey Management (Only System)
  private chainHotkeyManager!: ChainHotkeyManager;

  // Active Page Management
  private currentActivePage: ActivePage | null = null;
  private activePageConsumers: Set<ActivePageConsumer> = new Set();

  // Service Registry Management
  private serviceRegistry: Map<string, Service> = new Map();

  // EventBus Management
  private eventBus!: EventBus; // Initialized in setupEventBus() called from constructor
  private eventBusConsumers: Map<string, Consumer[]> = new Map(); // Track consumers by component

  // PageContext Management
  private pageContexts: Map<string, PageContext> = new Map();

  public constructor() {
    this.viewport = this.calculateViewPort();
    this.modeType = this.identifyModeType(this.viewport);
    this.setupViewportObserver();
    this.setupChainHotkeySystem();
    this.setupEventBus();
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
      this.emitLayoutModeChange(newViewPort, newModeType, oldModeType);
    }
  }

  /**
   * Subscribe to layout events
   */
  public subscribe(
    eventType: LayoutEventType,
    listener: LayoutEventListener,
  ): () => void {
    console.log(
      `📋 LayoutContextImpl: Adding listener for event: ${eventType}`,
    );

    // Delegate to EventBus - wrap the listener to handle LayoutEvent structure
    const wrappedListener = (data: any) => {
      // If data is already a LayoutEvent, use it directly
      // Otherwise wrap it in a LayoutEvent structure
      let event: LayoutEvent;
      if (
        data &&
        typeof data === "object" &&
        "type" in data &&
        "timestamp" in data
      ) {
        event = data as LayoutEvent;
      } else {
        event = {
          type: eventType,
          data,
          timestamp: Date.now(),
        };
      }

      return listener(event);
    };

    // Use EventBus consume method and return its unsubscribe function
    const consumer = this.eventBus.consume(eventType, wrappedListener);

    return () => {
      console.log(
        `📋 LayoutContextImpl: Removing listener for event: ${eventType}`,
      );
      consumer.unregister();
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

    console.log(`📋 LayoutContextImpl: Emitting event: ${eventType}`);

    // Delegate to EventBus publish method
    this.eventBus.publish(eventType, event);
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

    // Create properly typed layout-ready event
    const event = LayoutEventFactory.createLayoutReadyEvent(this);
    this.emit("layout-ready", event.data);
  }

  /**
   * Check if layout is ready
   */
  public isReady(): boolean {
    return this.isLayoutReady;
  }

  /**
   * Emit layout mode change event and coordinate component states
   */
  private emitLayoutModeChange(
    newViewPort: LayoutViewPort,
    newModeType: LayoutModeType,
    previousModeType?: LayoutModeType,
  ): void {
    console.log(`LayoutContext - Layout mode switching to: ${newModeType}`);

    // Coordinate component states during layout mode switches
    this.coordinateComponentsForLayoutMode(newModeType);

    // Emit layout mode change event for components that need to respond
    console.log("LayoutContext - Firing layout-mode-change event");

    // Create properly typed event using the factory
    const event = LayoutEventFactory.createLayoutModeChangeEvent(
      this,
      newViewPort,
      newModeType,
      previousModeType || this.modeType,
    );

    // Emit the typed event
    this.emit("layout-mode-change", event.data);
  }

  /**
   * Coordinate registered components during mobile/non-mobile layout mode switches
   */
  private coordinateComponentsForLayoutMode(newModeType: LayoutModeType): void {
    console.log(
      `LayoutContext - Coordinating components for ${newModeType} mode...`,
    );

    const isMobile = newModeType === "mobile";
    const wasNonMobile = !isMobile;

    // Coordinate sidebar behavior during layout mode transitions
    if (this.sidebarInstance) {
      console.log(
        `LayoutContext - Coordinating sidebar for ${newModeType} mode`,
      );

      // Sidebar will handle its own DOM changes via layout-mode-change subscription
      // This coordination ensures proper sequencing of state changes
      if (isMobile) {
        console.log(
          "LayoutContext - Switching TO mobile: Sidebar will hide and enable overlay mode",
        );
      } else {
        console.log(
          "LayoutContext - Switching FROM mobile: Sidebar will show and disable overlay mode",
        );
      }
    }

    // Future: Other component coordination can be added here
    // - Header responsive behavior
    // - Footer layout adjustments
    // - MainContent responsive classes

    console.log(
      `LayoutContext - Component coordination for ${newModeType} complete`,
    );
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

  /**
   * Unregister the sidebar instance from the LayoutContext
   */
  public unregisterSidebar(): void {
    if (this.sidebarInstance) {
      console.log("LayoutContext - Sidebar instance unregistered");
      this.sidebarInstance = null;
    }
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

  /**
   * Setup the chain-based hotkey management system
   */
  private setupChainHotkeySystem(): void {
    console.log("LayoutContext - Setting up chain-based hotkey system...");
    
    // Initialize chain manager (it will setup its own global listener)
    this.chainHotkeyManager = new ChainHotkeyManagerImpl();
    
    console.log("LayoutContext - Chain hotkey system initialized ✅");
  }





  // =================================================================================
  // Chain-Based Hotkey Management System
  // =================================================================================

  /**
   * Get the chain hotkey manager instance
   */
  public getChainHotkeyManager(): ChainHotkeyManager {
    return this.chainHotkeyManager;
  }

  /**
   * Register a chain hotkey provider
   */
  public registerChainProvider(provider: ChainHotkeyProvider): () => void {
    const unregister = this.chainHotkeyManager.registerProvider(provider);
    
    console.log(
      `LayoutContext - Registered chain provider: ${provider.getHotkeyProviderId()} with priority ${provider.getProviderPriority()}`,
    );
    
    return unregister;
  }

  /**
   * Unregister a chain hotkey provider
   */
  public unregisterChainProvider(providerId: string): void {
    this.chainHotkeyManager.unregisterProvider(providerId);
    console.log(`LayoutContext - Unregistered chain provider: ${providerId}`);
  }

  /**
   * Execute hotkey chain for a specific key (primarily for testing)
   */
  public async executeHotkeyChain(key: string, event: KeyboardEvent): Promise<ChainExecutionResult> {
    return this.chainHotkeyManager.executeChain(key, event);
  }

  /**
   * Enable/disable all hotkeys for a chain provider
   */
  public setChainProviderEnabled(providerId: string, enabled: boolean): void {
    this.chainHotkeyManager.setProviderEnabled(providerId, enabled);
    console.log(`LayoutContext - Chain provider ${providerId} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get chain debug information for a specific key
   */
  public getChainDebugInfo(key: string): {
    providers: string[];
    handlers: Array<{
      providerId: string;
      key: string;
      enabled: boolean;
      priority: number;
      description?: string;
    }>;
    totalHandlers: number;
  } {
    return this.chainHotkeyManager.getChainDebugInfo(key);
  }

  // =================================================================================
  // Legacy Hotkey System Removed
  // =================================================================================
  // The legacy hotkey system has been completely removed in favor of the
  // chain-based system. All components now use ChainHotkeyProvider directly.

  // =================================================================================
  // EventBus Management System
  // =================================================================================

  /**
   * Setup the EventBus for cross-component communication
   */
  private setupEventBus(): void {
    console.log(
      "LayoutContext - Setting up EventBus for cross-component communication...",
    );

    this.eventBus = new EventBusImpl({
      debug: false, // Set to true for development debugging
      defaultTimeout: 5000,
      maxConsumersPerEvent: 0, // Unlimited consumers
    });

    console.log("LayoutContext - EventBus initialized ✅");
  }

  /**
   * Get the EventBus instance for direct access
   */
  public getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * PUBLISH - Broadcast event to ALL consumers (non-blocking)
   */
  public publish(event: string, data: any): void {
    console.log(`LayoutContext - Publishing event: ${event}`);
    this.eventBus.publish(event, data);
  }

  /**
   * SEND - Deliver event to FIRST consumer only (non-blocking)
   */
  public send(event: string, data: any): void {
    console.log(`LayoutContext - Sending event: ${event}`);
    this.eventBus.send(event, data);
  }

  /**
   * REQUEST - Send to FIRST consumer and await response (non-blocking Promise)
   */
  public request(event: string, data: any, timeout?: number): Promise<any> {
    console.log(`LayoutContext - Requesting response for event: ${event}`);
    return this.eventBus.request(event, data);
  }

  /**
   * CONSUME - Subscribe to events with component tracking
   */
  public consume(
    event: string,
    handler: (data: any) => any,
    component?: string,
  ): Consumer {
    console.log(
      `LayoutContext - Registering consumer for event: ${event}${component ? ` (component: ${component})` : ""}`,
    );

    const consumer = this.eventBus.consume(event, handler);

    // Track consumer for component cleanup
    if (component) {
      if (!this.eventBusConsumers.has(component)) {
        this.eventBusConsumers.set(component, []);
      }
      this.eventBusConsumers.get(component)!.push(consumer);
    }

    return consumer;
  }

  /**
   * Unregister all EventBus consumers for a specific component
   */
  public unregisterEventBusConsumers(component: string): number {
    const consumers = this.eventBusConsumers.get(component);
    if (!consumers) {
      return 0;
    }

    let unregisteredCount = 0;
    consumers.forEach((consumer) => {
      if (consumer.isActive()) {
        consumer.unregister();
        unregisteredCount++;
      }
    });

    this.eventBusConsumers.delete(component);

    console.log(
      `LayoutContext - Unregistered ${unregisteredCount} EventBus consumers for component: ${component}`,
    );
    return unregisteredCount;
  }

  /**
   * Get EventBus debug information
   */
  public getEventBusDebugInfo(): {
    eventCount: number;
    totalConsumers: number;
    events: Array<{ name: string; consumers: number }>;
    componentConsumers: Array<{ component: string; consumers: number }>;
  } {
    const eventNames = this.eventBus.getEventNames();
    const events = eventNames.map((name) => ({
      name,
      consumers: this.eventBus.getConsumerCount(name),
    }));

    const componentConsumers = Array.from(this.eventBusConsumers.entries()).map(
      ([component, consumers]) => ({
        component,
        consumers: consumers.filter((c) => c.isActive()).length,
      }),
    );

    return {
      eventCount: eventNames.length,
      totalConsumers: events.reduce((sum, event) => sum + event.consumers, 0),
      events,
      componentConsumers,
    };
  }

  // =================================================================================
  // Active Hotkey Provider Management - Removed
  // =================================================================================
  // The legacy HotkeyProvider system has been removed. Page components now
  // register themselves directly as ChainHotkeyProvider instances.

  // =================================================================================
  // ActivePageProvider Implementation
  // =================================================================================

  /**
   * Set the current active page
   */
  public setActivePage(page: ActivePage): void {
    const previousPage = this.currentActivePage;

    if (previousPage === page) {
      // Same page instance, no change needed
      return;
    }

    console.log(
      `LayoutContext - Setting active page: ${page.getPageId()} (${page.getPageInfo().name})`,
    );

    this.currentActivePage = page;

    // Notify all registered consumers
    this.notifyActivePageConsumers(page, previousPage);

    // Update hotkey context based on active page change
    this.updateHotkeysForActivePage(page, previousPage);
  }

  /**
   * Deactivate the specified page if it's currently active
   */
  public deactivatePage(page: ActivePage): boolean {
    if (this.currentActivePage !== page) {
      // Page is not currently active
      console.log(
        `LayoutContext - Cannot deactivate page ${page.getPageId()}: not currently active`,
      );
      return false;
    }

    console.log(
      `LayoutContext - Deactivating active page: ${page.getPageId()} (${page.getPageInfo().name})`,
    );

    const previousPage = this.currentActivePage;
    this.currentActivePage = null;

    // Notify all registered consumers
    this.notifyActivePageConsumers(null, previousPage);

    // Update hotkey context based on active page change
    this.updateHotkeysForActivePage(null, previousPage);

    return true;
  }

  /**
   * Get the currently active page
   */
  public getActivePage(): ActivePage | null {
    return this.currentActivePage;
  }

  /**
   * Register a consumer to be notified of active page changes
   */
  public registerActivePageConsumer(consumer: ActivePageConsumer): () => void {
    this.activePageConsumers.add(consumer);

    console.log(
      `LayoutContext - Registered active page consumer (${this.activePageConsumers.size} total)`,
    );

    // Immediately notify the new consumer of current state
    if (this.currentActivePage) {
      try {
        consumer.onActivePageChanged(this.currentActivePage, null);
      } catch (error) {
        console.error(
          "LayoutContext - Error in immediate active page consumer notification:",
          error,
        );
      }
    }

    // Return unregister function
    return () => {
      this.unregisterActivePageConsumer(consumer);
    };
  }

  /**
   * Unregister a previously registered consumer
   */
  public unregisterActivePageConsumer(consumer: ActivePageConsumer): void {
    const wasRegistered = this.activePageConsumers.delete(consumer);

    if (wasRegistered) {
      console.log(
        `LayoutContext - Unregistered active page consumer (${this.activePageConsumers.size} remaining)`,
      );
    }
  }

  /**
   * Notify all active page consumers of a page change
   */
  private notifyActivePageConsumers(
    activePage: ActivePage | null,
    previousPage: ActivePage | null,
  ): void {
    if (this.activePageConsumers.size === 0) {
      return;
    }

    console.log(
      `LayoutContext - Notifying ${this.activePageConsumers.size} consumers of active page change`,
    );

    // Notify synchronously for immediate UI updates - critical for navigation responsiveness
    this.activePageConsumers.forEach((consumer) => {
      try {
        consumer.onActivePageChanged(activePage, previousPage);
      } catch (error) {
        console.error(
          "LayoutContext - Error in active page consumer notification:",
          error,
        );
      }
    });
  }

  /**
   * Update hotkey context when active page changes
   */
  private updateHotkeysForActivePage(
    activePage: ActivePage | null,
    previousPage: ActivePage | null,
  ): void {
    // Currently the hotkey system uses HotkeyProvider interface
    // This method provides a hook for future integration between
    // ActivePage and HotkeyProvider systems

    if (activePage) {
      console.log(
        `LayoutContext - Active page context updated for page: ${activePage.getPageId()}`,
      );
    } else {
      console.log(
        `LayoutContext - Active page context cleared (no active page)`,
      );
    }

    // Future: Enable/disable hotkeys based on activePage context
    // This would require extending the hotkey system to be aware of ActivePage instances
  }

  // =================================================================================
  // Service Registry Management Implementation
  // =================================================================================

  /**
   * Register a service with the LayoutContext
   * Services must implement the Service interface and will be included in lifecycle management
   */
  public registerService<T extends Service>(name: string, service: T): void {
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new ServiceError(
        "Service name must be a non-empty string",
        name || "unknown",
        "register",
      );
    }

    if (!service) {
      throw new ServiceError("Service instance is required", name, "register");
    }

    // Validate service implements the Service interface
    if (typeof service.getServiceId !== "function") {
      throw new ServiceError(
        "Service must implement the Service interface (getServiceId method missing)",
        name,
        "register",
      );
    }

    const serviceId = service.getServiceId();

    if (this.serviceRegistry.has(name)) {
      console.warn(
        `LayoutContext - Service '${name}' is already registered, replacing existing service`,
        {
          existingServiceId: this.serviceRegistry.get(name)?.getServiceId(),
          newServiceId: serviceId,
        },
      );
    }

    this.serviceRegistry.set(name, service);

    console.log(
      `LayoutContext - Service '${name}' registered (${this.serviceRegistry.size} total services)`,
      { serviceId, serviceType: service.constructor?.name || "Unknown" },
    );
  }

  /**
   * Retrieve a registered service by name with type safety
   */
  public getService<T extends Service>(name: string): T | null {
    if (!name || typeof name !== "string" || name.trim() === "") {
      console.warn("LayoutContext - Service name must be a non-empty string");
      return null;
    }

    const service = this.serviceRegistry.get(name) as T;

    if (!service) {
      console.warn(`LayoutContext - Service '${name}' not found`);
      return null;
    }

    return service;
  }

  /**
   * Check if a service is registered
   */
  public hasService(name: string): boolean {
    if (!name || typeof name !== "string" || name.trim() === "") {
      return false;
    }

    return this.serviceRegistry.has(name);
  }

  /**
   * Unregister a service by name
   * Returns true if service was found and removed, false otherwise
   * Calls destroy on the service if it has a destroy method
   */
  public async unregisterService(name: string): Promise<boolean> {
    if (!name || typeof name !== "string" || name.trim() === "") {
      console.warn("LayoutContext - Service name must be a non-empty string");
      return false;
    }

    const service = this.serviceRegistry.get(name);
    const wasRegistered = this.serviceRegistry.delete(name);

    if (wasRegistered && service) {
      // Call destroy on the service if it has a destroy method
      if (typeof service.destroy === "function") {
        try {
          const result = service.destroy();
          if (result instanceof Promise) {
            await result;
          }
          console.log(
            `LayoutContext - Service '${name}' destroyed during unregistration`,
            { serviceId: service.getServiceId() },
          );
        } catch (error) {
          console.error(
            `LayoutContext - Service '${name}' destroy failed during unregistration:`,
            error,
          );
        }
      }

      console.log(
        `LayoutContext - Service '${name}' unregistered (${this.serviceRegistry.size} remaining services)`,
        { serviceId: service.getServiceId() },
      );
    } else {
      console.warn(`LayoutContext - Service '${name}' was not registered`);
    }

    return wasRegistered;
  }

  /**
   * Get all registered services as a Map
   * Useful for debugging and testing
   */
  public getRegisteredServices(): Map<string, Service> {
    return new Map(this.serviceRegistry);
  }

  /**
   * Get names of all registered services
   */
  public getServiceNames(): string[] {
    return Array.from(this.serviceRegistry.keys());
  }

  /**
   * Create a service reference for lazy service resolution
   * Enables service dependency resolution without initialization order management
   */
  public getServiceReference<T extends Service>(
    serviceName: string,
    config?: ServiceReferenceConfig,
  ): ServiceReference<T> {
    return new ServiceReference(
      this,
      serviceName,
      config,
    ) as ServiceReference<T>;
  }

  /**
   * Initialize all registered services
   * Services with init() method will be called in registration order
   */
  public async initializeServices(): Promise<void> {
    if (this.serviceRegistry.size === 0) {
      console.log("LayoutContext - No services to initialize");
      return;
    }

    console.log(
      `LayoutContext - Initializing ${this.serviceRegistry.size} services...`,
    );

    const initPromises: Promise<void>[] = [];
    const errors: { name: string; error: Error }[] = [];

    for (const [name, service] of this.serviceRegistry) {
      if (typeof service.init === "function") {
        try {
          const result = service.init();

          if (result instanceof Promise) {
            initPromises.push(
              result.catch((error) => {
                errors.push({ name, error });
                throw new ServiceError(
                  `Service '${name}' initialization failed: ${error.message}`,
                  name,
                  "init",
                );
              }),
            );
          }

          console.log(`LayoutContext - Service '${name}' initialized`, {
            serviceId: service.getServiceId(),
          });
        } catch (error) {
          errors.push({ name, error: error as Error });
          console.error(
            `LayoutContext - Service '${name}' initialization failed:`,
            error,
          );
        }
      } else {
        console.log(
          `LayoutContext - Service '${name}' has no init method, skipping`,
          { serviceId: service.getServiceId() },
        );
      }
    }

    // Wait for all async initializations
    if (initPromises.length > 0) {
      try {
        await Promise.all(initPromises);
      } catch (error) {
        console.error(
          "LayoutContext - Some services failed to initialize:",
          error,
        );
        // Continue execution - don't fail entire initialization for one service
      }
    }

    if (errors.length > 0) {
      console.warn(
        `LayoutContext - ${errors.length} services had initialization errors:`,
        errors,
      );
    }

    console.log(
      `LayoutContext - Service initialization complete (${this.serviceRegistry.size - errors.length}/${this.serviceRegistry.size} successful)`,
    );
  }

  /**
   * Destroy all registered services
   * Services with destroy() method will be called in reverse registration order
   */
  public async destroyServices(): Promise<void> {
    if (this.serviceRegistry.size === 0) {
      console.log("LayoutContext - No services to destroy");
      return;
    }

    console.log(
      `LayoutContext - Destroying ${this.serviceRegistry.size} services...`,
    );

    const destroyPromises: Promise<void>[] = [];
    const errors: { name: string; error: Error }[] = [];

    // Destroy services in reverse order
    const servicesArray = Array.from(this.serviceRegistry.entries()).reverse();

    for (const [name, service] of servicesArray) {
      if (typeof service.destroy === "function") {
        try {
          const result = service.destroy();

          if (result instanceof Promise) {
            destroyPromises.push(
              result.catch((error) => {
                errors.push({ name, error });
                console.error(
                  `LayoutContext - Service '${name}' destruction failed:`,
                  error,
                );
              }),
            );
          }

          console.log(`LayoutContext - Service '${name}' destroyed`, {
            serviceId: service.getServiceId(),
          });
        } catch (error) {
          errors.push({ name, error: error as Error });
          console.error(
            `LayoutContext - Service '${name}' destruction failed:`,
            error,
          );
        }
      } else {
        console.log(
          `LayoutContext - Service '${name}' has no destroy method, skipping`,
          { serviceId: service.getServiceId() },
        );
      }
    }

    // Wait for all async destructions
    if (destroyPromises.length > 0) {
      try {
        await Promise.all(destroyPromises);
      } catch (error) {
        console.error(
          "LayoutContext - Some services failed to destroy cleanly:",
          error,
        );
        // Continue cleanup - don't fail entire destruction for one service
      }
    }

    if (errors.length > 0) {
      console.warn(
        `LayoutContext - ${errors.length} services had destruction errors:`,
        errors,
      );
    }

    // Clear the registry after destruction attempts
    this.serviceRegistry.clear();

    console.log("LayoutContext - Service destruction complete");
  }

  // PageContext management removed - now handled by RouterService
  // LayoutContext focuses on layout coordination only

  // =================================================================================
  // Cleanup and Destruction
  // =================================================================================

  /**
   * Enhanced destroy method - cleanup all resources: services, hotkeys, active pages, layout state
   */
  public destroy(): void {
    console.log("LayoutContext - Destroying...");

    // Cleanup services first (async services will be destroyed synchronously, warnings logged)
    if (this.serviceRegistry.size > 0) {
      console.log("LayoutContext - Cleaning up services during destroy...");

      // Call destroy synchronously - any async cleanup will be logged as warnings
      for (const [name, service] of this.serviceRegistry) {
        if (typeof service.destroy === "function") {
          try {
            const result = service.destroy();
            if (result instanceof Promise) {
              console.warn(
                `LayoutContext - Service '${name}' returned Promise from destroy() during synchronous cleanup - async cleanup may not complete`,
              );
            }
          } catch (error) {
            console.error(
              `LayoutContext - Service '${name}' destruction failed during cleanup:`,
              error,
            );
          }
        }
      }

      this.serviceRegistry.clear();
      console.log("LayoutContext - Service registry cleared");
    }

    // Cleanup EventBus consumers
    console.log("LayoutContext - Cleaning up EventBus consumers...");
    let totalUnregistered = 0;
    for (const [component, consumers] of this.eventBusConsumers) {
      const count = consumers.filter((c) => c.isActive()).length;
      consumers.forEach((consumer) => {
        if (consumer.isActive()) {
          consumer.unregister();
          totalUnregistered++;
        }
      });
      console.log(
        `LayoutContext - Unregistered ${count} EventBus consumers for component: ${component}`,
      );
    }
    this.eventBusConsumers.clear();
    this.eventBus.removeAllConsumers();
    console.log(
      `LayoutContext - EventBus cleanup complete (${totalUnregistered} consumers unregistered)`,
    );

    // Cleanup active page tracking
    this.currentActivePage = null;
    this.activePageConsumers.clear();

    // Cleanup chain hotkey system
    console.log("LayoutContext - Cleaning up chain hotkey system...");
    if (this.chainHotkeyManager) {
      try {
        this.chainHotkeyManager.destroy();
        console.log("LayoutContext - Chain hotkey manager destroyed");
      } catch (error) {
        console.error("LayoutContext - Error destroying chain hotkey manager:", error);
      }
    }
    
    console.log("LayoutContext - Hotkey system cleanup complete");

    // Cleanup PageContexts
    console.log("LayoutContext - Cleaning up PageContexts...");
    this.pageContexts.clear();
    console.log("LayoutContext - PageContext cleanup complete");

    // Reset ready state
    this.isLayoutReady = false;

    // Note: Layout event listeners now managed by EventBus (cleaned up above)

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

    console.log("LayoutContext - Destroyed successfully");
  }
}

export default LayoutContextImpl;
