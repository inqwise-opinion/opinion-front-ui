/**
 * PageContext Implementation
 * 
 * Concrete implementation of PageContext that provides page-level functionality
 * including breadcrumb management and other future page features.
 */

import type { PageContext, PageContextConfig } from '../interfaces/PageContext';
import type { BreadcrumbsManager } from '../interfaces/BreadcrumbsManager';
import type { ActivePage } from '../interfaces/ActivePage';
import type { LayoutContext } from './LayoutContext';
import { HierarchicalBreadcrumbsManagerImpl } from './HierarchicalBreadcrumbsManagerImpl';

export class PageContextImpl implements PageContext {
  private page: ActivePage;
  private layoutContext: LayoutContext;
  private config: Required<PageContextConfig>;
  private createdAt: number;
  private breadcrumbsManager: BreadcrumbsManager;
  private ready: boolean = false;

  constructor(
    page: ActivePage,
    layoutContext: LayoutContext,
    config: PageContextConfig = {}
  ) {
    this.page = page;
    this.layoutContext = layoutContext;
    this.createdAt = Date.now();
    
    // Apply configuration with defaults
    this.config = {
      initializeBreadcrumbs: config.initializeBreadcrumbs ?? true,
      breadcrumbInitDelay: config.breadcrumbInitDelay ?? 100,
      enableDebugLogging: config.enableDebugLogging ?? false,
    };

    // Initialize hierarchical breadcrumbs manager
    this.breadcrumbsManager = new HierarchicalBreadcrumbsManagerImpl(
      this.layoutContext,
      this.page,
      this.config.enableDebugLogging
    );

    // Initialize after a short delay to ensure components are ready
    setTimeout(() => {
      this.initialize();
    }, this.config.breadcrumbInitDelay);

    if (this.config.enableDebugLogging) {
      console.log(`🔧 PageContext - Created for page: ${page.getPageId()}`, {
        config: this.config,
        createdAt: this.createdAt
      });
    }
  }

  /**
   * Initialize the page context
   */
  private initialize(): void {
    if (this.config.initializeBreadcrumbs) {
      // Verify breadcrumbs are available
      if (this.breadcrumbsManager.isAvailable()) {
        this.ready = true;
        if (this.config.enableDebugLogging) {
          console.log(`🔧 PageContext - Initialized successfully for page: ${this.page.getPageId()}`);
        }
      } else {
        // Retry after a short delay
        if (this.config.enableDebugLogging) {
          console.warn(`🔧 PageContext - Breadcrumbs not available yet, retrying...`);
        }
        setTimeout(() => {
          this.initialize();
        }, 50);
      }
    } else {
      this.ready = true;
      if (this.config.enableDebugLogging) {
        console.log(`🔧 PageContext - Initialized (breadcrumbs disabled) for page: ${this.page.getPageId()}`);
      }
    }
  }

  /**
   * Get the page this context is associated with
   */
  getPage(): ActivePage {
    return this.page;
  }

  /**
   * Access breadcrumb management functionality
   */
  breadcrumbs(): BreadcrumbsManager {
    return this.breadcrumbsManager;
  }

  /**
   * Check if the page context is ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Get context creation timestamp
   */
  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * Get context configuration
   */
  getConfig(): Required<PageContextConfig> {
    return { ...this.config };
  }

  /**
   * Get layout context
   */
  getLayoutContext(): LayoutContext {
    return this.layoutContext;
  }

  /**
   * Enable or disable debug logging
   */
  setDebugLogging(enabled: boolean): void {
    this.config.enableDebugLogging = enabled;
    if (this.breadcrumbsManager instanceof HierarchicalBreadcrumbsManagerImpl) {
      // Update the breadcrumbs manager logging setting
      (this.breadcrumbsManager as any).enableLogging = enabled;
    }
  }
}