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
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

export class BreadcrumbsManagerImpl implements BreadcrumbsManager {
  private layoutContext: LayoutContext;
  private enableLogging: boolean;
  private logger: Logger;

  constructor(layoutContext: LayoutContext, enableLogging: boolean = false) {
    this.layoutContext = layoutContext;
    this.enableLogging = enableLogging;
    this.logger = LoggerFactory.getInstance().getLogger('BreadcrumbsManager');
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
        this.logger.debug(`Set ${items.length} breadcrumbs`, items.map(item => item.text));
      }
    } else if (this.enableLogging) {
      this.logger.warn('BreadcrumbsComponent not available for set operation');
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
        this.logger.debug('Cleared all breadcrumbs');
      }
    } else if (this.enableLogging) {
      this.logger.warn('BreadcrumbsComponent not available for clear operation');
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
        this.logger.debug(`Added breadcrumb: ${item.text}`);
      }
    } else if (this.enableLogging) {
      this.logger.warn('BreadcrumbsComponent not available for add operation');
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
        this.logger.debug(`Removed breadcrumb: ${id}`);
      }
    } else if (this.enableLogging) {
      this.logger.warn('BreadcrumbsComponent not available for remove operation');
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
        this.logger.debug(`Updated breadcrumb: ${id}`, updates);
      }
    } else if (this.enableLogging) {
      this.logger.warn('BreadcrumbsComponent not available for update operation');
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
      this.logger.warn('BreadcrumbsComponent not available for get operation');
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