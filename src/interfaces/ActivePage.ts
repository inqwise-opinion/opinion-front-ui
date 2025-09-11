/**
 * Active Page Interfaces
 * 
 * These interfaces define the contract for objects that can be tracked as
 * active pages in the application, along with metadata about the page.
 * 
 * This system allows the LayoutContext to maintain awareness of which page
 * is currently active, enabling features like context-aware hotkeys,
 * navigation state management, and component lifecycle coordination.
 */

/**
 * Basic information about a page that is active in the application
 */
export interface PageInfo {
  /**
   * Unique identifier for the page
   */
  id: string;
  
  /**
   * Display name of the page
   */
  name: string;
  
  /**
   * URL path associated with the page
   */
  path: string;
  
  /**
   * Optional additional page metadata 
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for any object that can be tracked as an active page
 */
export interface ActivePage {
  /**
   * Get information about this page
   */
  getPageInfo(): PageInfo;
  
  /**
   * Get unique identifier for this page instance
   * This should be consistent across renders of the same page
   */
  getPageId(): string;
}

/**
 * Interface for components that need to be notified when active page changes
 */
export interface ActivePageConsumer {
  /**
   * Handle active page change notification
   * @param activePage The new active page
   * @param previousPage The previous active page
   */
  onActivePageChanged(activePage: ActivePage | null, previousPage: ActivePage | null): void;
}

/**
 * Interface for objects that can set and manage the active page
 */
export interface ActivePageProvider {
  /**
   * Set the current active page
   * @param page The page to set as active (must not be null)
   */
  setActivePage(page: ActivePage): void;
  
  /**
   * Deactivate the specified page if it's currently active
   * @param page The page to deactivate
   * @returns true if the page was deactivated, false if it wasn't active
   */
  deactivatePage(page: ActivePage): boolean;
  
  /**
   * Get the currently active page
   */
  getActivePage(): ActivePage | null;
  
  /**
   * Register a consumer to be notified of active page changes
   * @param consumer The consumer to register
   * @returns A function to unregister the consumer
   */
  registerActivePageConsumer(consumer: ActivePageConsumer): () => void;
  
  /**
   * Unregister a previously registered consumer
   * @param consumer The consumer to unregister
   */
  unregisterActivePageConsumer(consumer: ActivePageConsumer): void;
}
