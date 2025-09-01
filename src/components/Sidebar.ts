/**
 * Sidebar interface and related types
 * Defines the contract for sidebar components
 */

/**
 * Sidebar interface - defines the contract for sidebar components
 */
export interface Sidebar {
  // Core properties
  isCompactMode(): boolean;
  isLocked(): boolean;
  getElement(): HTMLElement | null;
  getDimensions(): Dimensions;
  getState(): SidebarState;
  
  // State management
  setCompactMode(compact: boolean): void;
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
 * Compact mode change handler type
 */
export type CompactModeChangeHandler = (isCompact: boolean) => void;

/**
 * Sidebar dimensions interface - layout state information
 */
export interface Dimensions {
  width: number;           // Current width in pixels
  rightBorder: number;     // Right edge position for layout calculations
  isCompact: boolean;      // Whether sidebar is in compact mode
  isMobile: boolean;       // Whether in mobile responsive mode
  isVisible: boolean;      // Whether sidebar is visible
}

/**
 * Sidebar state interface - comprehensive state information
 */
export interface SidebarState extends Dimensions {
  isLocked: boolean;           // Whether sidebar is locked in expanded mode
  isInitialized: boolean;      // Whether sidebar has been initialized
  activeNavigationId: string | null;  // ID of currently active navigation item
  navigationItems: NavigationItem[];  // Current navigation items
  canToggle: boolean;          // Whether compact mode toggle is allowed
  element: HTMLElement | null; // Reference to the sidebar DOM element
}
