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
  ActivePageProvider,
} from "../interfaces/ActivePage";
import type {
  Service,
  ServiceRegistry,
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
  | "user-menu-request"
;

export type LayoutModeType = "mobile" | "tablet" | "desktop";

export interface LayoutEvent {
  type: LayoutEventType;
  data: unknown;
  timestamp: number;
}

export type LayoutEventListener = (event: LayoutEvent) => void;

// Legacy hotkey management interfaces removed - using ChainHotkeyProvider only

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
  emit(eventType: LayoutEventType, data: unknown): void;

  // EventBus - Cross-component Communication
  getEventBus(): EventBus;
  publish(event: string, data: unknown): void;
  send(event: string, data: unknown): void;
  request(event: string, data: unknown, timeout?: number): Promise<unknown>;
  consume(
    event: string,
    handler: (data: unknown) => unknown,
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

  // Chain-Based Hotkey Management (Only System)
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

  // Failure Tracking
  fail(error: Error | string): void;
  failed(): boolean;
  failure(): Error | null;

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

  // PageContext management removed - now handled by RouterService
  // Pages receive pre-created PageContext via constructor
}
