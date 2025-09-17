/**
 * Layout Context Interface
 * Defines the contract for layout management and coordination
 */

import { AppHeader } from "../components/AppHeader";
import type { Sidebar } from "../components/Sidebar";
import type { Messages } from "../interfaces/Messages";
import { AppFooter } from "../components/AppFooter";
import { MainContent } from "../components/MainContent";
import {
  ActivePage,
  ActivePageConsumer,
  ActivePageProvider,
} from "../interfaces/ActivePage";
import type {
  Service,
  ServiceRegistry,
  ServiceConfig,
} from "../interfaces/Service";
import type { EventBus, Consumer } from "../lib/EventBus";
import type {
  ServiceReference,
  ServiceReferenceConfig,
} from "../services/ServiceReference";
import type {
  ChainHotkeyManager,
  ChainHotkeyProvider,
  ChainExecutionResult,
} from "../hotkeys/HotkeyChainSystem";
import type { PageContext, PageContextConfig } from "../interfaces/PageContext";

export interface LayoutViewPort {
  width: number;
  height: number;
}

export type LayoutEventType =
  | "sidebar-compact-mode-change"
  | "sidebar-compact-request"
  | "layout-ready"
  | "layout-mode-change"
  | "mobile-menu-mode-change"
  | "mobile-menu-request"
  | "user-menu-mode-change"
  | "user-menu-request";

export type LayoutModeType = "mobile" | "tablet" | "desktop";

export interface LayoutEvent {
  type: LayoutEventType;
  data: any;
  timestamp: number;
}

export type LayoutEventListener = (event: LayoutEvent) => void;

// Hotkey Management Types
export interface HotkeyHandler {
  key: string;
  handler: (event: KeyboardEvent) => void | boolean; // return false to prevent default
  description?: string;
  context?: "global" | "page"; // global = always active, page = only when page active
  component?: string; // component identifier for cleanup
}

export interface HotkeyManagerInterface {
  registerHotkey(hotkey: HotkeyHandler): () => void; // returns unregister function
  unregisterHotkey(key: string, component?: string): void;
  unregisterAllHotkeys(component?: string): void;
  getRegisteredHotkeys(): HotkeyHandler[];
}

// Abstract Hotkey Provider Interface
export interface HotkeyProvider {
  /**
   * Provide page/component-specific hotkeys as a Map
   * Key: hotkey string (e.g., 'Ctrl+s', 'Escape')
   * Value: handler function
   */
  getPageHotkeys(): Map<
    string,
    (event: KeyboardEvent) => void | boolean
  > | null;

  /**
   * Component identifier for hotkey management
   */
  getHotkeyComponentId(): string;
}

/**
 * Main LayoutContext Interface
 * Defines all the methods that layout components can use
 */
export interface LayoutContext extends ActivePageProvider, ServiceRegistry {
  // Service Reference Management (Lazy service resolution)
  getServiceReference<T extends Service>(
    serviceName: string,
    config?: ServiceReferenceConfig,
  ): ServiceReference<T>;

  // Event Management (Layout-specific events)
  subscribe(
    eventType: LayoutEventType,
    listener: LayoutEventListener,
  ): () => void;
  emit(eventType: LayoutEventType, data: any): void;

  // EventBus - Cross-component Communication
  getEventBus(): EventBus;
  publish(event: string, data: any): void;
  send(event: string, data: any): void;
  request(event: string, data: any, timeout?: number): Promise<any>;
  consume(
    event: string,
    handler: (data: any) => any,
    component?: string,
  ): Consumer;

  // State Management
  getViewport(): LayoutViewPort;

  // Layout Management
  markReady(): void;
  isReady(): boolean;

  // Sidebar Instance Management
  registerSidebar(sidebar: Sidebar): void;
  getSidebar(): Sidebar | null;

  // Legacy Hotkey Management (maintained for backward compatibility)
  registerHotkey(hotkey: HotkeyHandler): () => void;
  unregisterHotkey(key: string, component?: string): void;
  unregisterAllHotkeys(component?: string): void;
  getRegisteredHotkeys(): HotkeyHandler[];

  // Chain-Based Hotkey Management (New System)
  getChainHotkeyManager(): ChainHotkeyManager;
  registerChainProvider(provider: ChainHotkeyProvider): () => void;
  unregisterChainProvider(providerId: string): void;
  executeHotkeyChain(key: string, event: KeyboardEvent): Promise<ChainExecutionResult>;
  setChainProviderEnabled(providerId: string, enabled: boolean): void;
  getChainDebugInfo(key: string): {
    providers: string[];
    handlers: Array<{
      providerId: string;
      key: string;
      enabled: boolean;
      priority: number;
      description?: string;
    }>;
    totalHandlers: number;
  };

  // Active Hotkey Provider Management
  setActiveHotkeyProvider(provider: HotkeyProvider): void;
  removeActiveHotkeyProvider(provider: HotkeyProvider): void;
  getActiveHotkeyProvider(): HotkeyProvider | null;

  // Active Page Management
  // (implemented via ActivePageProvider interface)

  // Component Registration System
  registerHeader(header: AppHeader): void;
  registerFooter(footer: AppFooter): void;
  registerMainContent(mainContent: MainContent): void;
  registerMessages(messages: Messages): void;
  getHeader(): AppHeader | null;
  getFooter(): AppFooter | null;
  getMainContent(): MainContent | null;
  getMessagesComponent(): Messages | null;
  getRegisteredComponents(): {
    header: AppHeader | null;
    footer: AppFooter | null;
    mainContent: MainContent | null;
    messages: Messages | null;
    sidebar: Sidebar | null;
  };
  areAllComponentsRegistered(): boolean;
  unregisterAllComponents(): void;

  // Messages Interface Access - EXCLUSIVE access point for all message functionality
  getMessages(): Messages | null;

  // Lifecycle
  destroy(): void;

  /**
   * Check if current mode type is mobile
   */
  isLayoutMobile(): boolean;

  /**
   * Check if current mode type is tablet
   */
  isLayoutTablet(): boolean;

  /**
   * Check if current mode type is desktop
   */
  isLayoutDesktop(): boolean;

  /**
   * Get the current layout mode type
   */
  getModeType(): LayoutModeType;

  // =================================================================================
  // PageContext Management
  // =================================================================================

  /**
   * Create a PageContext for the given page (Promise-based for async initialization)
   * @param page The page to create context for
   * @param config Optional configuration for the PageContext
   * @returns Promise resolving to the PageContext instance
   */
  getPageContext(page: ActivePage, config?: PageContextConfig): Promise<PageContext>;

  /**
   * Get an existing PageContext for a page if it exists
   * @param page The page to get context for
   * @returns PageContext instance or null if not found
   */
  getExistingPageContext(page: ActivePage): PageContext | null;

  /**
   * Clear PageContext for a specific page
   * @param page The page to clear context for
   */
  clearPageContext(page: ActivePage): void;
}
