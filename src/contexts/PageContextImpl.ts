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
import type { RouteContext } from '../router/RouteContext';
import { HierarchicalBreadcrumbsManagerImpl } from './HierarchicalBreadcrumbsManagerImpl';
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

export class PageContextImpl implements PageContext {
  private page: ActivePage | null;
  private routeContext: RouteContext;
  private layoutContext: LayoutContext;
  private config: Required<PageContextConfig>;
  private createdAt: number;
  private breadcrumbsManager: BreadcrumbsManager;
  private ready: boolean = false;
  private logger: Logger;

  constructor(
    routeContext: RouteContext,
    layoutContext: LayoutContext,
    config: PageContextConfig = {},
    page?: ActivePage
  ) {
    this.page = page || null;
    this.routeContext = routeContext;
    this.layoutContext = layoutContext;
    this.createdAt = Date.now();
    
    // Apply configuration with defaults - reduce default delay for faster UI
    this.config = {
      initializeBreadcrumbs: config.initializeBreadcrumbs ?? true,
      breadcrumbInitDelay: config.breadcrumbInitDelay ?? 0, // Immediate by default for responsive UI
      enableDebugLogging: config.enableDebugLogging ?? false,
    };

    this.logger = LoggerFactory.getInstance().getLogger('PageContext');

    // Initialize breadcrumbs manager - will be properly initialized when page is set
    this.breadcrumbsManager = this.createBreadcrumbsManager();

    // Initialize immediately for faster UI updates
    // Use setTimeout only if explicit delay is configured
    if (this.config.breadcrumbInitDelay > 0) {
      setTimeout(() => {
        this.initialize();
      }, this.config.breadcrumbInitDelay);
    } else {
      // Initialize immediately for responsive UI
      setTimeout(() => {
        this.initialize();
      }, 0);
    }

    if (this.config.enableDebugLogging) {
      const pageInfo = this.page ? `page: ${this.page.getPageId()}` : 'no page yet';
      this.logger.debug(`Created (${pageInfo})`, {
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
          const pageInfo = this.page ? this.page.getPageId() : 'no page yet';
          this.logger.debug(`Initialized successfully (${pageInfo})`);
        }
      } else {
        // Retry after a short delay
        if (this.config.enableDebugLogging) {
          this.logger.warn('Breadcrumbs not available yet, retrying...');
        }
        setTimeout(() => {
          this.initialize();
        }, 50);
      }
    } else {
      this.ready = true;
      if (this.config.enableDebugLogging) {
        const pageInfo = this.page ? this.page.getPageId() : 'no page yet';
        this.logger.debug(`Initialized (breadcrumbs disabled) (${pageInfo})`);
      }
    }
  }

  /**
   * Get the page this context is associated with (null until page is created)
   */
  getPage(): ActivePage | null {
    return this.page;
  }

  /**
   * Get route context for this page
   */
  getRouteContext(): RouteContext {
    return this.routeContext;
  }

  /**
   * Associate a page with this context (called by RouterService after page creation)
   */
  setPage(page: ActivePage): void {
    this.page = page;
    
    // Recreate breadcrumbs manager with the actual page
    this.breadcrumbsManager = this.createBreadcrumbsManager();
    
    if (this.config.enableDebugLogging) {
      this.logger.debug(`Page associated: ${page.getPageId()}`);
    }
  }

  /**
   * Factory method to create a page with this context
   * Called by RouterService with page provider function
   */
  createPage<T extends ActivePage>(pageProvider: (mainContent: any, pageContext: PageContext) => T, mainContent: any): T {
    // Create the page using the provider function
    const page = pageProvider(mainContent, this);
    
    // Associate the page with this context
    this.setPage(page);
    
    if (this.config.enableDebugLogging) {
      this.logger.debug(`Created and associated page: ${page.getPageId()}`);
    }
    
    return page;
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

  /**
   * Create breadcrumbs manager, handling null page case
   */
  private createBreadcrumbsManager(): BreadcrumbsManager {
    if (this.page) {
      return new HierarchicalBreadcrumbsManagerImpl(
        this.layoutContext,
        this.page,
        this.config.enableDebugLogging
      );
    } else {
      // Create a placeholder breadcrumbs manager until page is set
      return {
        set: () => {},
        clear: () => {},
        add: () => {},
        remove: () => {},
        update: () => {},
        get: () => [],
        isAvailable: () => false
      };
    }
  }
}
