/**
 * AppHeader Interface
 * Defines the contract for app header components
 */

import type { Sidebar } from "./Sidebar.js";

export interface HeaderUser {
  username: string;
  email?: string;
  avatar?: string;
}

export interface SidebarInfo {
  width: number;
  isCompact: boolean;
  isMobile: boolean;
}

export interface HeaderPosition {
  left: number;
  width: number;
  right: number;
}

/**
 * Interface for app header components
 */
export interface AppHeader {
  /**
   * Initialize the header component
   */
  init(): Promise<void>;

  /**
   * Update user information in header
   */
  updateUser(user: HeaderUser): void;

  /**
   * Update logo/brand link
   */
  updateBrand(title: string, href?: string): void;

  /**
   * Update page title in header breadcrumb
   */
  updatePageTitle(title: string): void;

  /**
   * Update breadcrumbs with main page and optional sub-page
   * @param mainPage - The main menu item (e.g., "Dashboard", "Surveys")
   * @param subPage - Optional sub-page (e.g., "Settings", "Create Survey")
   */
  updateBreadcrumbs(mainPage: string, subPage?: string): void;

  /**
   * Show/hide header
   */
  setVisible(visible: boolean): void;

  /**
   * Get sidebar instance for external access
   */
  getSidebar(): Sidebar | null;

  /**
   * Simulate user loading - for testing/demo purposes
   */
  simulateUserLoading(): void;

  /**
   * Get current sidebar information (useful for other components)
   */
  getSidebarInfo(): SidebarInfo | null;

  /**
   * Get current header position information
   */
  getHeaderPosition(): HeaderPosition | null;

  /**
   * Force update header position (useful after window resize)
   */
  updatePosition(): void;

  /**
   * Cleanup when component is destroyed
   */
  destroy(): void;
}
