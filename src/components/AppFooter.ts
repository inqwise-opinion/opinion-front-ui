/**
 * AppFooter Interface
 * Defines the contract for app footer components
 */

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
