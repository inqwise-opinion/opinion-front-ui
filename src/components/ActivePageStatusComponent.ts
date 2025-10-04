/**
 * ActivePageStatusComponent
 * 
 * An example component that demonstrates how to consume active page changes
 * and use the EventBus for communication. This component tracks the active page
 * and provides status information that other components can consume.
 */

import { ActivePage, ActivePageConsumer } from '../interfaces/ActivePage';
import { LayoutContext } from '../contexts/LayoutContext';
import { globalEventBus, Consumer } from '../lib';

/**
 * Events published by ActivePageStatusComponent
 */
export interface ActivePageStatusEvents {
  'page:activated': { page: ActivePage };
  'page:deactivated': { page: ActivePage };
  'page:changed': { currentPage: ActivePage | null; previousPage: ActivePage | null };
}

/**
 * Status information about the active page
 */
export interface ActivePageStatus {
  currentPage: ActivePage | null;
  hasActivePage: boolean;
  pageId: string | null;
  pageName: string | null;
  pagePath: string | null;
  changeTimestamp: number;
}

export class ActivePageStatusComponent implements ActivePageConsumer {
  private layoutContext: LayoutContext;
  private currentStatus: ActivePageStatus;
  private unregisterActivePageConsumer: (() => void) | null = null;
  private eventBusConsumers: Consumer[] = [];

  constructor(layoutContext: LayoutContext) {
    this.layoutContext = layoutContext;
    
    // Initialize status
    this.currentStatus = this.createEmptyStatus();
    
    console.log('🔄 ActivePageStatusComponent - Initialized');
  }

  /**
   * Initialize the component and start tracking active page changes
   */
  public init(): void {
    // Register as active page consumer
    this.unregisterActivePageConsumer = this.layoutContext.registerActivePageConsumer(this);
    
    // Set up EventBus consumers for external queries
    this.setupEventBusConsumers();
    
    // Initialize with current active page
    const currentPage = this.layoutContext.getActivePage();
    if (currentPage) {
      this.onActivePageChanged(currentPage, null);
    }
    
    console.log('🔄 ActivePageStatusComponent - Started tracking active pages');
  }

  /**
   * Destroy the component and cleanup
   */
  public destroy(): void {
    // Unregister from active page changes
    if (this.unregisterActivePageConsumer) {
      this.unregisterActivePageConsumer();
      this.unregisterActivePageConsumer = null;
    }
    
    // Cleanup EventBus consumers
    this.eventBusConsumers.forEach(consumer => {
      consumer.unregister();
    });
    this.eventBusConsumers = [];
    
    console.log('🔄 ActivePageStatusComponent - Destroyed');
  }

  /**
   * Handle active page changes (ActivePageConsumer interface)
   */
  public onActivePageChanged(activePage: ActivePage | null, previousPage: ActivePage | null): void {
    console.log('🔄 ActivePageStatusComponent - Page changed:', {
      current: activePage?.getPageId() || 'none',
      previous: previousPage?.getPageId() || 'none'
    });

    // Update status
    this.currentStatus = this.createStatusFromPage(activePage);
    
    // Publish events via EventBus
    if (activePage && !previousPage) {
      // Page activated (first page)
      globalEventBus.publish('page:activated', { page: activePage });
    } else if (!activePage && previousPage) {
      // Page deactivated (no active page)
      globalEventBus.publish('page:deactivated', { page: previousPage });
    } else if (activePage && previousPage) {
      // Page changed
      globalEventBus.publish('page:changed', { 
        currentPage: activePage, 
        previousPage: previousPage 
      });
    }
    
    // Always publish general page change event
    globalEventBus.publish('page:status-updated', this.currentStatus);
  }

  /**
   * Get current active page status
   */
  public getStatus(): ActivePageStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if there's an active page
   */
  public hasActivePage(): boolean {
    return this.currentStatus.hasActivePage;
  }

  /**
   * Get current page ID
   */
  public getCurrentPageId(): string | null {
    return this.currentStatus.pageId;
  }

  /**
   * Setup EventBus consumers to respond to external queries
   */
  private setupEventBusConsumers(): void {
    // Handle requests for current page status
    const statusConsumer = globalEventBus.consume('page:get-status', () => {
      return this.getStatus();
    });
    this.eventBusConsumers.push(statusConsumer);

    // Handle requests for active page info
    const pageInfoConsumer = globalEventBus.consume('page:get-current-info', () => {
      const activePage = this.layoutContext.getActivePage();
      return activePage ? activePage.getPageInfo() : null;
    });
    this.eventBusConsumers.push(pageInfoConsumer);

    // Handle requests to check if page is active
    const isActiveConsumer = globalEventBus.consume('page:is-active', (data: unknown) => {
      const typedData = data as { pageId: string };
      return this.currentStatus.pageId === typedData.pageId;
    });
    this.eventBusConsumers.push(isActiveConsumer);

    console.log('🔄 ActivePageStatusComponent - EventBus consumers registered');
  }

  /**
   * Create status object from page
   */
  private createStatusFromPage(page: ActivePage | null): ActivePageStatus {
    if (!page) {
      return this.createEmptyStatus();
    }

    const pageInfo = page.getPageInfo();
    return {
      currentPage: page,
      hasActivePage: true,
      pageId: pageInfo.id,
      pageName: pageInfo.name,
      pagePath: pageInfo.path,
      changeTimestamp: Date.now()
    };
  }

  /**
   * Create empty status object
   */
  private createEmptyStatus(): ActivePageStatus {
    return {
      currentPage: null,
      hasActivePage: false,
      pageId: null,
      pageName: null,
      pagePath: null,
      changeTimestamp: Date.now()
    };
  }
}

export default ActivePageStatusComponent;
