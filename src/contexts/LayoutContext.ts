/**
 * Layout Context Interface
 * Defines the contract for layout management and coordination
 */

import type { Sidebar } from '../components/Sidebar.js';


export interface LayoutState {
  layoutModeType: LayoutModeType;
  viewport: {
    width: number;
    height: number;
  };
}

export type LayoutEventType = 'sidebar-dimensions-change' | 'layout-ready' | 'layout-mode-change';

export type LayoutModeType = 'mobile' | 'tablet' | 'desktop' | 'desktop-compact';

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
    mobile: number;    // ≤ 768px
    tablet: number;    // 769px - 1024px  
    desktop: number;   // > 1024px
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
  subscribe(eventType: LayoutEventType, listener: LayoutEventListener): () => void;
  emit(eventType: LayoutEventType, data: any): void;
  
  // State Management
  getState(): LayoutState;
  getViewport(): LayoutState['viewport'];
  
  // Layout Management
  markReady(): void;
  calculateContentArea(): {
    left: number;
    width: number;
    availableWidth: number;
  };
  
  // Layout Mode Management
  getLayoutMode(): LayoutMode;
  isMobile(): boolean;
  isTablet(): boolean;
  isDesktop(): boolean;
  getBreakpoints(): LayoutMode['breakpoints'];
  canSidebarToggle(): boolean;
  calculateSidebarDimensions(isCompact?: boolean): { width: number; isVisible: boolean };
  
  // Sidebar Instance Management
  registerSidebar(sidebar: Sidebar): void;
  unregisterSidebar(): void;
  getSidebar(): Sidebar | null;
  hasSidebar(): boolean;
  withSidebar<T>(callback: (sidebar: Sidebar) => T): T | null;
  
  // Notification System
  notifySidebarDimensionsChanged(): void;
  
  // Lifecycle
  destroy(): void;
}

/**
 * Factory function type for getting LayoutContext instance
 */
export interface LayoutContextFactory {
  getInstance(): LayoutContext;
}
