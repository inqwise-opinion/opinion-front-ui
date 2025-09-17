/**
 * Hierarchical BreadcrumbsManager Implementation
 * 
 * This implementation provides page-scoped breadcrumb management where each page
 * can only modify breadcrumbs at or below its level in the hierarchy.
 * 
 * The hierarchy is determined by:
 * 1. Finding the current page's position in the global breadcrumb trail
 * 2. Scoping all operations to affect only breadcrumbs at or below that position
 * 3. Leaving parent-level breadcrumbs untouched
 */

import type { BreadcrumbsManager } from '../interfaces/BreadcrumbsManager';
import type { BreadcrumbItem } from '../interfaces/BreadcrumbItem';
import type { BreadcrumbsComponent } from '../components/BreadcrumbsComponent';
import type { LayoutContext } from './LayoutContext';
import type { ActivePage } from '../interfaces/ActivePage';

export class HierarchicalBreadcrumbsManagerImpl implements BreadcrumbsManager {
  private layoutContext: LayoutContext;
  private activePage: ActivePage;
  private enableLogging: boolean;

  constructor(
    layoutContext: LayoutContext, 
    activePage: ActivePage, 
    enableLogging: boolean = false
  ) {
    this.layoutContext = layoutContext;
    this.activePage = activePage;
    this.enableLogging = enableLogging;
  }

  /**
   * Get the underlying BreadcrumbsComponent (with async safety)
   */
  private getBreadcrumbsComponent(): BreadcrumbsComponent | null {
    const header = this.layoutContext.getHeader();
    return header?.getBreadcrumbsComponent() || null;
  }

  /**
   * Find the current page's position in the breadcrumb hierarchy
   * Returns the index where the current page starts its scope, or -1 if not found
   */
  private findPageScopeIndex(): number {
    const component = this.getBreadcrumbsComponent();
    if (!component) {
      // Component not ready - return -1 to indicate unavailable
      return -1;
    }

    const items = component.getBreadcrumbs();
    const pageId = this.activePage.getPageId();
    
    // First, try exact match (case-sensitive)
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === pageId) {
        return i;
      }
    }
    
    // Then try case-insensitive match
    const pageIdLower = pageId.toLowerCase();
    for (let i = 0; i < items.length; i++) {
      if (items[i].id.toLowerCase() === pageIdLower) {
        if (this.enableLogging) {
          console.log(`🍞 HierarchicalBreadcrumbs - Found case-insensitive match for ${pageId}: ${items[i].id} at index ${i}`);
        }
        return i;
      }
    }
    
    // Page ID not found - fallback to append-only mode (after last item)
    const fallbackIndex = items.length;
    if (this.enableLogging) {
      console.warn(`🍞 HierarchicalBreadcrumbs - Page ID "${pageId}" not found in breadcrumbs. Scope limited to append-only after index ${fallbackIndex}`, {
        currentBreadcrumbs: items.map(item => item.id),
        pageId: pageId,
        fallbackScope: 'append-only'
      });
    }
    return fallbackIndex;
  }

  /**
   * Get the current breadcrumbs that are in scope for this page
   */
  private getScopedBreadcrumbs(): { parentItems: BreadcrumbItem[], scopedItems: BreadcrumbItem[], scopeIndex: number } | null {
    const component = this.getBreadcrumbsComponent();
    if (!component) {
      return null; // Component not available
    }

    const allItems = component.getBreadcrumbs();
    const scopeIndex = this.findPageScopeIndex();
    
    if (scopeIndex === -1) {
      return null; // Component not ready
    }

    const parentItems = allItems.slice(0, scopeIndex);
    const scopedItems = allItems.slice(scopeIndex);
    
    return { parentItems, scopedItems, scopeIndex };
  }

  /**
   * Apply scoped changes back to the global breadcrumb trail
   */
  private applyScopedChanges(newScopedItems: BreadcrumbItem[]): void {
    const scopeData = this.getScopedBreadcrumbs();
    if (!scopeData) {
      if (this.enableLogging) {
        console.warn('🍞 HierarchicalBreadcrumbs - Component not available for applying changes');
      }
      return;
    }

    const { parentItems } = scopeData;
    const newFullTrail = [...parentItems, ...newScopedItems];
    
    const component = this.getBreadcrumbsComponent();
    if (component) {
      component.setBreadcrumbs(newFullTrail);
      if (this.enableLogging) {
        console.log(`🍞 HierarchicalBreadcrumbs - Applied scoped changes for ${this.activePage.getPageId()}: ${newScopedItems.length} scoped items`);
      }
    }
  }

  /**
   * Set the complete breadcrumb trail for this page's scope
   */
  set(items: BreadcrumbItem[]): void {
    // In hierarchical mode, 'set' replaces only the scoped portion
    this.applyScopedChanges(items);
  }

  /**
   * Clear breadcrumbs in this page's scope
   */
  clear(): void {
    // Clear only the scoped portion, leaving parent breadcrumbs intact
    this.applyScopedChanges([]);
  }

  /**
   * Add a breadcrumb item to this page's scope
   */
  add(item: BreadcrumbItem): void {
    const scopeData = this.getScopedBreadcrumbs();
    if (!scopeData) {
      if (this.enableLogging) {
        console.warn('🍞 HierarchicalBreadcrumbs - Component not available for add operation');
      }
      return;
    }

    const { scopedItems } = scopeData;
    const newScopedItems = [...scopedItems, item];
    this.applyScopedChanges(newScopedItems);
    
    if (this.enableLogging) {
      console.log(`🍞 HierarchicalBreadcrumbs - Added: ${item.text}`);
    }
  }

  /**
   * Remove a breadcrumb item by ID from this page's scope
   */
  remove(id: string): void {
    const scopeData = this.getScopedBreadcrumbs();
    if (!scopeData) {
      if (this.enableLogging) {
        console.warn('🍞 HierarchicalBreadcrumbs - Component not available for remove operation');
      }
      return;
    }

    const { scopedItems } = scopeData;
    const newScopedItems = scopedItems.filter(item => item.id !== id);
    
    if (newScopedItems.length === scopedItems.length) {
      // Item not found in scope - silently ignore (hierarchical behavior)
      if (this.enableLogging) {
        console.log(`🍞 HierarchicalBreadcrumbs - Item ${id} not in scope, ignoring`);
      }
      return;
    }
    
    this.applyScopedChanges(newScopedItems);
    
    if (this.enableLogging) {
      console.log(`🍞 HierarchicalBreadcrumbs - Removed: ${id}`);
    }
  }

  /**
   * Update a breadcrumb item in this page's scope
   */
  update(id: string, updates: Partial<BreadcrumbItem>): void {
    const scopeData = this.getScopedBreadcrumbs();
    if (!scopeData) {
      if (this.enableLogging) {
        console.warn('🍞 HierarchicalBreadcrumbs - Component not available for update operation');
      }
      return;
    }

    const { scopedItems } = scopeData;
    const itemIndex = scopedItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      // Item not found in scope - silently ignore (hierarchical behavior)
      if (this.enableLogging) {
        console.log(`🍞 HierarchicalBreadcrumbs - Item ${id} not in scope for update, ignoring`);
      }
      return;
    }
    
    const newScopedItems = [...scopedItems];
    newScopedItems[itemIndex] = { ...newScopedItems[itemIndex], ...updates };
    
    this.applyScopedChanges(newScopedItems);
    
    if (this.enableLogging) {
      console.log(`🍞 HierarchicalBreadcrumbs - Updated: ${id}`);
    }
  }

  /**
   * Get current breadcrumbs in this page's scope
   */
  get(): BreadcrumbItem[] {
    const scopeData = this.getScopedBreadcrumbs();
    if (!scopeData) {
      if (this.enableLogging) {
        console.warn('🍞 HierarchicalBreadcrumbs - Component not available for get operation');
      }
      return [];
    }

    return scopeData.scopedItems;
  }

  /**
   * Check if breadcrumbs are available
   */
  isAvailable(): boolean {
    return this.getBreadcrumbsComponent() !== null;
  }

  /**
   * Get debug information about the current scope
   */
  getDebugInfo(): { pageId: string, scopeIndex: number, parentCount: number, scopedCount: number, totalCount: number, isFallbackMode: boolean, scopeType: string } | null {
    const scopeData = this.getScopedBreadcrumbs();
    if (!scopeData) {
      return null;
    }

    const component = this.getBreadcrumbsComponent();
    if (!component) {
      return null;
    }

    const allItems = component.getBreadcrumbs();
    const isFallbackMode = scopeData.scopeIndex === allItems.length;
    const scopeType = isFallbackMode ? 'append-only' : 'hierarchical';

    return {
      pageId: this.activePage.getPageId(),
      scopeIndex: scopeData.scopeIndex,
      parentCount: scopeData.parentItems.length,
      scopedCount: scopeData.scopedItems.length,
      totalCount: scopeData.parentItems.length + scopeData.scopedItems.length,
      isFallbackMode: isFallbackMode,
      scopeType: scopeType
    };
  }
}