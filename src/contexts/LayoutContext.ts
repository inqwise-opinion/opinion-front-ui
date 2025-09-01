/**
 * Layout Context Interface
 * Defines the contract for layout management and coordination
 */

import type { Sidebar } from '../components/Sidebar.js';

// Re-export types for consumers
export type SidebarDimensions = {
  width: number;
  rightBorder: number;
  isCompact: boolean;
  isMobile: boolean;
  isVisible: boolean;
};

/**
 * Extended sidebar state interface - includes behavior configuration
 */
export interface SidebarState extends SidebarDimensions {
  canToggle: boolean;      // Whether compact toggle is allowed
  isLocked: boolean;       // Whether sidebar is locked in expanded mode
  defaultWidth: number;    // Default expanded width
  compactWidth: number;    // Compact mode width
}

export interface LayoutState {
  viewport: {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
  sidebar: {
    width: number;
    isVisible: boolean;
  };
}

export type LayoutEventType = 'sidebar-dimensions-change' | 'layout-ready' | 'layout-mode-change' | 'responsive-mode-change';

export type ResponsiveModeType = 'mobile' | 'tablet' | 'desktop';

export type LayoutModeType = 'mobile' | 'tablet' | 'desktop' | 'desktop-compact';

export interface ResponsiveMode {
  type: ResponsiveModeType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewport: {
    width: number;
    height: number;
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
  
  // Responsive Management
  getResponsiveMode(): ResponsiveMode;
  isMobile(): boolean;
  isTablet(): boolean;
  isDesktop(): boolean;
  getBreakpoints(): ResponsiveMode['breakpoints'];
  canSidebarToggle(): boolean;
  
  // Layout Mode Management
  getLayoutMode(): LayoutMode;
  calculateSidebarDimensions(isCompact?: boolean): { width: number; isVisible: boolean };
  
  // Sidebar Instance Management
  registerSidebar(sidebar: Sidebar): void;
  unregisterSidebar(): void;
  getSidebar(): Sidebar | null;
  hasSidebar(): boolean;
  withSidebar<T>(callback: (sidebar: Sidebar) => T): T | null;
  getSidebarState(): (SidebarDimensions & {
    isLocked: boolean;
    element: HTMLElement | null;
  }) | null;
  
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
