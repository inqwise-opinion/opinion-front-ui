/**
 * Layout Context Interface
 * Defines the contract for layout management and coordination
 */

import type { Sidebar } from "../components/Sidebar.js";
import type { Messages } from "../interfaces/Messages.js";

export interface LayoutViewPort {
  width: number;
  height: number;
}

export type LayoutEventType =
  | "sidebar-dimensions-change"
  | "layout-ready"
  | "layout-mode-change";

export type LayoutModeType =
  | "mobile"
  | "tablet"
  | "desktop"
  | "desktop-compact";

export interface LayoutMode {
  type: LayoutModeType;
  isCompact: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewport: {
    width: number;
    height: number;
  };
  sidebar: {
    width: number;
    isVisible: boolean;
  };
  breakpoints: {
    mobile: number; // ≤ 768px
    tablet: number; // 769px - 1024px
    desktop: number; // > 1024px
  };
  sidebarBehavior: {
    isVisible: boolean;
    canToggle: boolean;
    defaultWidth: number;
    compactWidth: number;
  };
}

export interface LayoutEvent {
  type: LayoutEventType;
  data: any;
  timestamp: number;
}

export type LayoutEventListener = (event: LayoutEvent) => void;

/**
 * Main LayoutContext Interface
 * Defines all the methods that layout components can use
 */
export interface LayoutContext {
  // Event Management
  subscribe(
    eventType: LayoutEventType,
    listener: LayoutEventListener,
  ): () => void;
  emit(eventType: LayoutEventType, data: any): void;

  // State Management
  getViewport(): LayoutViewPort;

  // Layout Management
  markReady(): void;
  calculateContentArea(): {
    left: number;
    width: number;
    availableWidth: number;
  };

  // Layout Mode Management
  getLayoutMode(): LayoutMode;
  getBreakpoints(): LayoutMode["breakpoints"];
  canSidebarToggle(): boolean;
  calculateSidebarDimensions(isCompact?: boolean): {
    width: number;
    isVisible: boolean;
  };

  // Sidebar Instance Management
  registerSidebar(sidebar: Sidebar): void;
  unregisterSidebar(): void;
  getSidebar(): Sidebar | null;
  hasSidebar(): boolean;
  withSidebar<T>(callback: (sidebar: Sidebar) => T): T | null;

  // Component Registration System
  registerLayout(layout: any): void;
  registerHeader(header: any): void;
  registerFooter(footer: any): void;
  registerMainContent(mainContent: any): void;
  registerMessages(messages: any): void;
  getLayout(): any | null;
  getHeader(): any | null;
  getFooter(): any | null;
  getMainContent(): any | null;
  getMessagesComponent(): any | null;
  getRegisteredComponents(): {
    layout: any | null;
    header: any | null;
    footer: any | null;
    mainContent: any | null;
    messages: any | null;
    sidebar: Sidebar | null;
  };
  areAllComponentsRegistered(): boolean;
  unregisterAllComponents(): void;

  // Notification System
  notifySidebarDimensionsChanged(): void;

  // Error Messages System
  showError(title: string, description?: string, options?: any): void;
  showWarning(title: string, description?: string, options?: any): void;
  showInfo(title: string, description?: string, options?: any): void;
  showSuccess(title: string, description?: string, options?: any): void;
  clearMessages(includesPersistent?: boolean): void;
  clearMessagesByType(type: 'error' | 'warning' | 'info' | 'success'): void;
  hasMessages(type?: 'error' | 'warning' | 'info' | 'success'): boolean;

  // Messages Interface Access
  getMessages(): Messages | null;

  // Lifecycle
  destroy(): void;
}
