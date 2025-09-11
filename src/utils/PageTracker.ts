/**
 * PageTracker Utility
 * 
 * A utility class for testing and demonstrating the active page tracking 
 * and EventBus communication system. This provides console-accessible 
 * methods for developers to inspect and interact with the page tracking system.
 */

import { globalEventBus, Consumer } from '../lib';
import { ActivePageStatus } from '../components/ActivePageStatusComponent';
import { PageInfo } from '../interfaces/ActivePage';

export interface PageTrackerInfo {
  hasActivePage: boolean;
  currentPageId: string | null;
  currentPageName: string | null;
  currentPagePath: string | null;
  eventBusInfo: {
    eventCount: number;
    totalConsumers: number;
  };
}

export class PageTracker {
  private consumers: Consumer[] = [];
  private eventHistory: Array<{ event: string; data: any; timestamp: number }> = [];
  private maxHistorySize: number = 20;

  constructor() {
    console.log('📊 PageTracker - Initialized');
    this.setupEventListeners();
  }

  /**
   * Get current page tracking information
   */
  public async getInfo(): Promise<PageTrackerInfo> {
    try {
      // Request current page status via EventBus
      const status = await globalEventBus.request('page:get-status', {});
      const debugInfo = globalEventBus.getDebugInfo();

      return {
        hasActivePage: status.hasActivePage,
        currentPageId: status.pageId,
        currentPageName: status.pageName,
        currentPagePath: status.pagePath,
        eventBusInfo: {
          eventCount: debugInfo.eventCount,
          totalConsumers: debugInfo.totalConsumers
        }
      };
    } catch (error) {
      console.error('📊 PageTracker - Error getting info:', error);
      return {
        hasActivePage: false,
        currentPageId: null,
        currentPageName: null,
        currentPagePath: null,
        eventBusInfo: {
          eventCount: 0,
          totalConsumers: 0
        }
      };
    }
  }

  /**
   * Get current page information
   */
  public async getCurrentPageInfo(): Promise<PageInfo | null> {
    try {
      return await globalEventBus.request('page:get-current-info', {});
    } catch (error) {
      console.error('📊 PageTracker - Error getting current page info:', error);
      return null;
    }
  }

  /**
   * Check if a specific page is currently active
   */
  public async isPageActive(pageId: string): Promise<boolean> {
    try {
      return await globalEventBus.request('page:is-active', { pageId });
    } catch (error) {
      console.error('📊 PageTracker - Error checking if page is active:', error);
      return false;
    }
  }

  /**
   * Get recent event history
   */
  public getEventHistory(): Array<{ event: string; data: any; timestamp: number; ago: string }> {
    return this.eventHistory.map(entry => ({
      ...entry,
      ago: this.timeAgo(entry.timestamp)
    }));
  }

  /**
   * Get EventBus debug information
   */
  public getEventBusDebugInfo() {
    return globalEventBus.getDebugInfo();
  }

  /**
   * Test EventBus by publishing a test message
   */
  public testEventBus(message: string = 'Hello from PageTracker!'): void {
    console.log('📊 PageTracker - Publishing test event...');
    globalEventBus.publish('test:page-tracker', {
      message,
      timestamp: Date.now(),
      source: 'PageTracker'
    });
  }

  /**
   * Print current status to console
   */
  public async printStatus(): Promise<void> {
    const info = await this.getInfo();
    const pageInfo = await this.getCurrentPageInfo();
    
    console.group('📊 PageTracker Status');
    console.log('🔍 Has Active Page:', info.hasActivePage);
    
    if (info.hasActivePage) {
      console.log('📄 Current Page ID:', info.currentPageId);
      console.log('📄 Current Page Name:', info.currentPageName);
      console.log('📄 Current Page Path:', info.currentPagePath);
      
      if (pageInfo) {
        console.log('📄 Page Metadata:', pageInfo.metadata);
      }
    }
    
    console.log('📡 EventBus Events:', info.eventBusInfo.eventCount);
    console.log('📡 EventBus Consumers:', info.eventBusInfo.totalConsumers);
    
    if (this.eventHistory.length > 0) {
      console.log('📜 Recent Events:', this.eventHistory.length);
      this.eventHistory.slice(-3).forEach(event => {
        console.log(`  • ${event.event} (${this.timeAgo(event.timestamp)})`);
      });
    }
    
    console.groupEnd();
  }

  /**
   * Setup event listeners to track page changes
   */
  private setupEventListeners(): void {
    // Listen to page status updates
    const statusConsumer = globalEventBus.consume('page:status-updated', (status: ActivePageStatus) => {
      this.addEventToHistory('page:status-updated', {
        pageId: status.pageId,
        pageName: status.pageName,
        hasActivePage: status.hasActivePage
      });
    });
    this.consumers.push(statusConsumer);

    // Listen to page activations
    const activatedConsumer = globalEventBus.consume('page:activated', (data) => {
      this.addEventToHistory('page:activated', {
        pageId: data.page.getPageId(),
        pageName: data.page.getPageInfo().name
      });
    });
    this.consumers.push(activatedConsumer);

    // Listen to page deactivations
    const deactivatedConsumer = globalEventBus.consume('page:deactivated', (data) => {
      this.addEventToHistory('page:deactivated', {
        pageId: data.page.getPageId(),
        pageName: data.page.getPageInfo().name
      });
    });
    this.consumers.push(deactivatedConsumer);

    // Listen to page changes
    const changedConsumer = globalEventBus.consume('page:changed', (data) => {
      this.addEventToHistory('page:changed', {
        fromPageId: data.previousPage?.getPageId(),
        toPageId: data.currentPage?.getPageId(),
        fromPageName: data.previousPage?.getPageInfo().name,
        toPageName: data.currentPage?.getPageInfo().name
      });
    });
    this.consumers.push(changedConsumer);

    // Listen to test events
    const testConsumer = globalEventBus.consume('test:page-tracker', (data) => {
      this.addEventToHistory('test:page-tracker', data);
      console.log('📊 PageTracker - Received test event:', data);
    });
    this.consumers.push(testConsumer);

    console.log('📊 PageTracker - Event listeners setup complete');
  }

  /**
   * Add event to history
   */
  private addEventToHistory(event: string, data: any): void {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });

    // Trim history if too long
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Format time ago string
   */
  private timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Cleanup method
   */
  public destroy(): void {
    this.consumers.forEach(consumer => consumer.unregister());
    this.consumers = [];
    this.eventHistory = [];
    console.log('📊 PageTracker - Destroyed');
  }
}

// Create global instance for console access
const pageTracker = new PageTracker();

// Make available on window for console debugging
declare global {
  interface Window {
    pageTracker: PageTracker;
  }
}

if (typeof window !== 'undefined') {
  window.pageTracker = pageTracker;
}

export default pageTracker;
