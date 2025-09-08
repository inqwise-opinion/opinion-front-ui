/**
 * Sidebar interface and related types
 * Defines the contract for sidebar components
 */

/**
 * Configuration interface for sidebar dimensions and behavior
 */
export interface SidebarConfig {
  defaultWidth?: number; // Default expanded width (default: 280px)
  compactWidth?: number; // Compact mode width (default: 80px)
  footer?: {
    text?: string; // Footer text (default: "© 2025 Opinion")
    showFooter?: boolean; // Whether to show footer (default: true)
  };
}

/**
 * Sidebar interface - defines the contract for sidebar components
 */
export interface Sidebar {
  // Core properties
  isCompactMode(): boolean;
  isLocked(): boolean;
  getDimensions(): Dimensions;
  
  // State management
  toggleCompactMode(): void;
  expandSidebar(): void;
  compactSidebar(): void;
  lockExpanded(): void;
  unlockSidebar(): void;
  
  // Mobile behavior
  toggleMobileVisibility(): void;
  
  // Navigation
  updateNavigation(items: NavigationItem[]): void;
  setActivePage(navId: string): void;
  
  // Footer management
  updateFooterText(text: string): void;
  setFooterVisibility(show: boolean): void;
  
  // Lifecycle
  init(): Promise<void>;
  destroy(): void;
}

/**
 * Navigation item interface
 */
export interface NavigationItem {
  id: string;
  text: string;
  icon: string;
  href: string;
  caption?: string; // Optional caption/description for menu items
  badge?: string;
  active?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  children?: NavigationItem[];
}


/**
 * Sidebar dimensions interface - pure dimensional data
 * Behavioral state should be accessed via dedicated methods or layout mode
 */
export interface Dimensions {
  width: number;           // Current width in pixels
  isVisible: boolean;      // Whether sidebar is visible
}

