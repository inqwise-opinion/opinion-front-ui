/**
 * BreadcrumbsManager Implementation
 * 
 * Concrete implementation of BreadcrumbsManager that wraps the existing
 * BreadcrumbsComponent to provide the clean grouped API.
 */

import type { BreadcrumbsManager } from '../interfaces/BreadcrumbsManager';
import type { BreadcrumbItem } from '../interfaces/BreadcrumbItem';
import type { BreadcrumbsComponent } from '../components/BreadcrumbsComponent';
import type { LayoutContext } from './LayoutContext';

export class BreadcrumbsManagerImpl implements BreadcrumbsManager {
  private layoutContext: LayoutContext;
  private enableLogging: boolean;

  constructor(layoutContext: LayoutContext, enableLogging: boolean = false) {
    this.layoutContext = layoutContext;
    this.enableLogging = enableLogging;
  }

  /**
   * Get the underlying BreadcrumbsComponent
   */
  private getBreadcrumbsComponent(): BreadcrumbsComponent | null {
    const header = this.layoutContext.getHeader();
    return header?.getBreadcrumbsComponent() || null;
  }

  /**
   * Set the complete breadcrumb trail
   */
  set(items: BreadcrumbItem[]): void {
    const component = this.getBreadcrumbsComponent();
    if (component) {
      component.setBreadcrumbs(items);
      if (this.enableLogging) {
        console.log(`🍞 PageContext - Set ${items.length} breadcrumbs:`, items.map(item => item.text));
      }
    } else if (this.enableLogging) {
      console.warn('🍞 PageContext - BreadcrumbsComponent not available for set operation');
    }
  }

  /**
   * Clear all breadcrumbs
   */
  clear(): void {
    const component = this.getBreadcrumbsComponent();
    if (component) {
      component.clearBreadcrumbs();
      if (this.enableLogging) {
        console.log('🍞 PageContext - Cleared all breadcrumbs');
      }
    } else if (this.enableLogging) {
      console.warn('🍞 PageContext - BreadcrumbsComponent not available for clear operation');
    }
  }

  /**
   * Add a breadcrumb item
   */
  add(item: BreadcrumbItem): void {
    const component = this.getBreadcrumbsComponent();
    if (component) {
      component.addBreadcrumb(item);
      if (this.enableLogging) {
        console.log(`🍞 PageContext - Added breadcrumb: ${item.text}`);
      }
    } else if (this.enableLogging) {
      console.warn('🍞 PageContext - BreadcrumbsComponent not available for add operation');
    }
  }

  /**
   * Remove a breadcrumb item by ID
   */
  remove(id: string): void {
    const component = this.getBreadcrumbsComponent();
    if (component) {
      component.removeBreadcrumb(id);
      if (this.enableLogging) {
        console.log(`🍞 PageContext - Removed breadcrumb: ${id}`);
      }
    } else if (this.enableLogging) {
      console.warn('🍞 PageContext - BreadcrumbsComponent not available for remove operation');
    }
  }

  /**
   * Update a breadcrumb item
   */
  update(id: string, updates: Partial<BreadcrumbItem>): void {
    const component = this.getBreadcrumbsComponent();
    if (component) {
      component.updateBreadcrumb(id, updates);
      if (this.enableLogging) {
        console.log(`🍞 PageContext - Updated breadcrumb: ${id}`, updates);
      }
    } else if (this.enableLogging) {
      console.warn('🍞 PageContext - BreadcrumbsComponent not available for update operation');
    }
  }

  /**
   * Get current breadcrumbs
   */
  get(): BreadcrumbItem[] {
    const component = this.getBreadcrumbsComponent();
    if (component) {
      return component.getBreadcrumbs();
    }
    if (this.enableLogging) {
      console.warn('🍞 PageContext - BreadcrumbsComponent not available for get operation');
    }
    return [];
  }

  /**
   * Check if breadcrumbs are available
   */
  isAvailable(): boolean {
    return this.getBreadcrumbsComponent() !== null;
  }
}