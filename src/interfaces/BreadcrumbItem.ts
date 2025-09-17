/**
 * BreadcrumbItem Interface
 * 
 * Defines the structure for individual breadcrumb items in navigation trails.
 * Each item can be either a link (href) or an action (clickHandler).
 */

export interface BreadcrumbItem {
  /**
   * Unique identifier for the breadcrumb item
   * Used for updates, removal, and deduplication
   */
  id: string;

  /**
   * Display text for the breadcrumb item
   * Main visible content in the breadcrumb trail
   */
  text: string;

  /**
   * Optional subtitle or description
   * Displayed below or alongside the main text (implementation dependent)
   */
  caption?: string;

  /**
   * Optional URL link for navigation
   * If provided, clicking the breadcrumb will navigate to this URL
   * Mutually exclusive with clickHandler in practice
   */
  href?: string;

  /**
   * Optional click handler for custom actions
   * If provided, clicking the breadcrumb will execute this function
   * Receives the full BreadcrumbItem for context
   * Mutually exclusive with href in practice
   */
  clickHandler?: (item: BreadcrumbItem) => void;
}

/**
 * Type guard to check if a breadcrumb item has a click handler
 */
export function hasClickHandler(item: BreadcrumbItem): item is BreadcrumbItem & { clickHandler: (item: BreadcrumbItem) => void } {
  return typeof item.clickHandler === 'function';
}

/**
 * Type guard to check if a breadcrumb item has an href
 */
export function hasHref(item: BreadcrumbItem): item is BreadcrumbItem & { href: string } {
  return typeof item.href === 'string' && item.href.length > 0;
}

/**
 * Get the appropriate action for a breadcrumb item
 * Returns 'link' for href items, 'action' for clickHandler items, 'none' for display-only items
 */
export function getBreadcrumbItemAction(item: BreadcrumbItem): 'link' | 'action' | 'none' {
  if (hasHref(item)) return 'link';
  if (hasClickHandler(item)) return 'action';
  return 'none';
}