/**
 * AppFooter Interface
 * Defines the contract for app footer components
 */

import {
  ComponentReference,
  ComponentReferenceConfig,
} from "./ComponentReference";
import type { LayoutContext } from "../contexts/LayoutContext";

export interface FooterConfig {
  showCopyright?: boolean;
  copyrightText?: string;
  showNavigation?: boolean;
  navigationLinks?: FooterLink[];
}

export interface FooterLink {
  href: string;
  title: string;
  text: string;
}

/**
 * Interface for app footer components
 */
export interface AppFooter {
  /**
   * Initialize the footer component
   */
  init(): Promise<void>;

  /**
   * Show/hide footer
   */
  setVisible(visible: boolean): void;

  /**
   * Cleanup when component is destroyed
   */
  destroy(): void;
}

/**
 * AppFooter reference utilities
 */
export class AppFooterRef {
  static readonly COMPONENT_ID = "AppFooter" as const;

  /**
   * Get a ComponentReference for safely accessing registered AppFooter
   *
   * @param context - The LayoutContext to resolve from
   * @param config - Optional configuration for the ComponentReference
   * @returns ComponentReference<AppFooter> for lazy resolution
   *
   * @example
   * ```typescript
   * const footerRef = AppFooterRef.getRegisteredReference(layoutContext);
   * const footer = await footerRef.get(); // Returns AppFooter | null
   * ```
   */
  static getRegisteredReference(
    context: LayoutContext,
    config?: ComponentReferenceConfig,
  ): ComponentReference<AppFooter> {
    return new ComponentReference<AppFooter>(
      context,
      AppFooterRef.COMPONENT_ID,
      () => context.getFooter(),
      config,
    );
  }
}
