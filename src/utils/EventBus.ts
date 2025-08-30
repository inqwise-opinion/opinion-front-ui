/**
 * Event Bus - Clean Event-Based Communication System
 * Simple Observer pattern implementation for component communication
 * Following Rule 3: Event-driven communication between components
 */

export type EventCallback<T = any> = (data: T) => void;

export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Simple Event Bus for component communication
 * Provides publish-subscribe pattern for loose coupling between components
 */
export class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   * @param eventName - Name of the event to listen to
   * @param callback - Function to call when event is fired
   * @returns Subscription object with unsubscribe method
   */
  subscribe<T = any>(eventName: string, callback: EventCallback<T>): EventSubscription {
    // Get or create event set
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    
    const eventSet = this.events.get(eventName)!;
    eventSet.add(callback);
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        eventSet.delete(callback);
        // Clean up empty event sets
        if (eventSet.size === 0) {
          this.events.delete(eventName);
        }
      }
    };
  }

  /**
   * Publish an event to all subscribers
   * @param eventName - Name of the event to fire
   * @param data - Data to pass to event handlers
   */
  publish<T = any>(eventName: string, data?: T): void {
    const eventSet = this.events.get(eventName);
    if (eventSet) {
      // Call all subscribers
      eventSet.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus - Error in event handler for '${eventName}':`, error);
        }
      });
    }
  }

  /**
   * Get number of subscribers for an event
   */
  getSubscriberCount(eventName: string): number {
    const eventSet = this.events.get(eventName);
    return eventSet ? eventSet.size : 0;
  }

  /**
   * Get all event names that have subscribers
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Clear all subscribers for a specific event
   */
  clearEvent(eventName: string): void {
    this.events.delete(eventName);
  }

  /**
   * Clear all events and subscribers
   */
  clearAll(): void {
    this.events.clear();
  }

  /**
   * Check if an event has any subscribers
   */
  hasSubscribers(eventName: string): boolean {
    const eventSet = this.events.get(eventName);
    return eventSet ? eventSet.size > 0 : false;
  }
}

// Create and export a global event bus instance
export const globalEventBus = new EventBus();

// Export commonly used event types for type safety
export interface ComponentEvents {
  // Sidebar events
  'sidebar:compact-mode-changed': { isCompact: boolean };
  'sidebar:navigation-changed': { activeItem: string };
  
  // Header events
  'header:user-updated': { username: string; email?: string };
  'header:breadcrumb-changed': { mainPage: string; subPage?: string };
  
  // Main content events
  'main:content-loaded': { title: string };
  'main:loading-state-changed': { isLoading: boolean };
  'main:error-occurred': { error: string | null };
  
  // Footer events
  'footer:link-clicked': { href: string; title: string };
  
  // App-wide events
  'app:layout-ready': {};
  'app:components-initialized': {};
  'app:error': { component: string; error: string };
}

// Type-safe event publishing helpers
export const AppEvents = {
  // Sidebar
  sidebarCompactModeChanged: (isCompact: boolean) => 
    globalEventBus.publish('sidebar:compact-mode-changed', { isCompact }),
  
  sidebarNavigationChanged: (activeItem: string) => 
    globalEventBus.publish('sidebar:navigation-changed', { activeItem }),
  
  // Header
  headerUserUpdated: (username: string, email?: string) => 
    globalEventBus.publish('header:user-updated', { username, email }),
  
  headerBreadcrumbChanged: (mainPage: string, subPage?: string) => 
    globalEventBus.publish('header:breadcrumb-changed', { mainPage, subPage }),
  
  // Main content
  mainContentLoaded: (title: string) => 
    globalEventBus.publish('main:content-loaded', { title }),
  
  mainLoadingStateChanged: (isLoading: boolean) => 
    globalEventBus.publish('main:loading-state-changed', { isLoading }),
  
  mainErrorOccurred: (error: string | null) => 
    globalEventBus.publish('main:error-occurred', { error }),
  
  // Footer
  footerLinkClicked: (href: string, title: string) => 
    globalEventBus.publish('footer:link-clicked', { href, title }),
  
  // App-wide
  appLayoutReady: () => 
    globalEventBus.publish('app:layout-ready', {}),
  
  appComponentsInitialized: () => 
    globalEventBus.publish('app:components-initialized', {}),
  
  appError: (component: string, error: string) => 
    globalEventBus.publish('app:error', { component, error })
};

export default EventBus;
