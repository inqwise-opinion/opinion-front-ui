/**
 * AppHeader Interface
 * Defines the contract for app header components
 */

import UserMenu from "./UserMenu";
import type { BreadcrumbsComponent } from "./BreadcrumbsComponent";
import { ComponentReference, ComponentReferenceConfig } from "./ComponentReference";
import type { LayoutContext } from "../contexts/LayoutContext";

export interface HeaderUser {
  username: string;
  email?: string;
  avatar?: string;
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

  /**
   * Set user menu handler
   */
  setUserMenuHandler(handler: (userMenu: UserMenu) => void): void;
  
  /**
   * Get breadcrumbs component for direct access
   */
  getBreadcrumbsComponent(): BreadcrumbsComponent | null;
}

/**
 * AppHeader reference utilities
 */
export class AppHeaderRef {
  static readonly COMPONENT_ID = 'AppHeader' as const;
  /**
   * Get a ComponentReference for safely accessing registered AppHeader
   * 
   * @param context - The LayoutContext to resolve from
   * @param config - Optional configuration for the ComponentReference
   * @returns ComponentReference<AppHeader> for lazy resolution
   * 
   * @example
   * ```typescript
   * const headerRef = AppHeaderRef.getRegisteredReference(layoutContext);
   * const header = await headerRef.get(); // Returns AppHeader | null
   * ```
   */
  static getRegisteredReference(
    context: LayoutContext,
    config?: ComponentReferenceConfig
  ): ComponentReference<AppHeader> {
    return new ComponentReference<AppHeader>(
      context,
      AppHeaderRef.COMPONENT_ID,
      () => context.getHeader(),
      config
    );
  }
}
