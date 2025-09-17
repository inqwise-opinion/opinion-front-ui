/**
 * BreadcrumbsManager Interface
 * 
 * Provides a clean, grouped API for managing breadcrumbs within PageContext.
 * This interface abstracts the underlying BreadcrumbsComponent implementation.
 */

import type { BreadcrumbItem } from './BreadcrumbItem';

/**
 * Manager interface for breadcrumb operations
 * Used within PageContext to provide ctx.breadcrumbs().set(), etc.
 */
export interface BreadcrumbsManager {
  /**
   * Set the complete breadcrumb trail, replacing any existing breadcrumbs
   * @param items Array of breadcrumb items to display
   */
  set(items: BreadcrumbItem[]): void;

  /**
   * Clear all breadcrumbs from the trail
   */
  clear(): void;

  /**
   * Add a breadcrumb item to the end of the trail
   * @param item Breadcrumb item to add
   */
  add(item: BreadcrumbItem): void;

  /**
   * Remove a breadcrumb item by ID
   * @param id ID of the breadcrumb item to remove
   */
  remove(id: string): void;

  /**
   * Update a specific breadcrumb item
   * @param id ID of the breadcrumb item to update
   * @param updates Partial breadcrumb item with fields to update
   */
  update(id: string, updates: Partial<BreadcrumbItem>): void;

  /**
   * Get the current breadcrumb trail
   * @returns Array of current breadcrumb items (copy)
   */
  get(): BreadcrumbItem[];

  /**
   * Check if breadcrumbs are available/initialized
   * @returns True if breadcrumbs component is ready
   */
  isAvailable(): boolean;
}