/**
 * BreadcrumbsComponent
 * 
 * Manages breadcrumb navigation display and interactions.
 * Follows the same pattern as UserMenu - AppHeader provides container,
 * BreadcrumbsComponent manages content and rendering.
 */

// Import component-scoped CSS
import "../assets/styles/components/breadcrumbs.css";

import type { BreadcrumbItem } from "../interfaces/BreadcrumbItem";
import { getBreadcrumbItemAction, hasClickHandler, hasHref } from "../interfaces/BreadcrumbItem";
import type { LayoutContext } from "../contexts/LayoutContext";
import { ComponentStatus, ComponentWithStatus } from "../interfaces/ComponentStatus";
import { LoggerFactory } from "../logging/LoggerFactory";
import { Logger } from "../logging/Logger";

export class BreadcrumbsComponent implements ComponentWithStatus {
  private container: HTMLElement | null = null;
  private breadcrumbs: BreadcrumbItem[] = [];
  private layoutContext?: LayoutContext;
  private logger: Logger;
  private isInitialized: boolean = false;
  private initTime: number | null = null;
  private eventListeners: Array<{
    element: Element;
    event: string;
    handler: EventListener;
  }> = [];

  constructor(private parentContainer: HTMLElement, layoutContext?: LayoutContext) {
    this.container = parentContainer;
    this.layoutContext = layoutContext;
    this.logger = LoggerFactory.getInstance().getLogger('BreadcrumbsComponent');
    
    this.logger.info("BreadcrumbsComponent - Created with container:", {
      containerId: parentContainer.id,
      containerClass: parentContainer.className
    });
  }

  /**
   * Initialize the breadcrumbs component
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn("BreadcrumbsComponent - Already initialized");
      return;
    }

    this.logger.info("BreadcrumbsComponent - Initializing...");
    
    try {
      // Clear existing content and setup container
      this.setupContainer();
      
      // Setup event listeners for breadcrumb interactions
      this.setupEventListeners();
      
      // Initialize with empty breadcrumbs (pages will set them later)
      this.renderBreadcrumbs();
      
      this.isInitialized = true;
      this.initTime = Date.now();
      this.logger.info("BreadcrumbsComponent - Ready");
    } catch (error) {
      this.logger.error("BreadcrumbsComponent - Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Setup the container for breadcrumb rendering
   */
  private setupContainer(): void {
    if (!this.container) {
      throw new Error("BreadcrumbsComponent - No container provided");
    }

    // Clear existing content
    this.container.innerHTML = '';
    
    // Ensure container has proper structure for breadcrumb rendering
    this.container.innerHTML = `
      <nav class="breadcrumbs-nav" aria-label="Breadcrumb">
        <ol class="breadcrumbs-list" role="list">
          <!-- Breadcrumb items will be rendered here -->
        </ol>
      </nav>
    `;

    this.logger.info("BreadcrumbsComponent - Container setup complete");
  }

  /**
   * Setup event listeners for breadcrumb interactions
   */
  private setupEventListeners(): void {
    // Use event delegation to handle clicks on breadcrumb items
    if (this.container) {
      const clickHandler = (event: Event) => {
        this.handleBreadcrumbClick(event);
      };
      
      this.container.addEventListener('click', clickHandler);
      this.eventListeners.push({
        element: this.container,
        event: 'click',
        handler: clickHandler
      });
      
      this.logger.info("BreadcrumbsComponent - Event listeners setup");
    }
  }

  /**
   * Handle clicks on breadcrumb items
   */
  private handleBreadcrumbClick(event: Event): void {
    const target = event.target as Element;
    const breadcrumbElement = target.closest('[data-breadcrumb-id]');
    
    if (!breadcrumbElement) {
      return; // Not a breadcrumb click
    }

    const breadcrumbId = breadcrumbElement.getAttribute('data-breadcrumb-id');
    if (!breadcrumbId) {
      return;
    }

    const breadcrumbItem = this.breadcrumbs.find(item => item.id === breadcrumbId);
    if (!breadcrumbItem) {
      this.logger.warn(`BreadcrumbsComponent - Breadcrumb not found: ${breadcrumbId}`);
      return;
    }

    // Handle the click based on breadcrumb item type
    if (hasClickHandler(breadcrumbItem)) {
      event.preventDefault();
      this.logger.info(`BreadcrumbsComponent - Executing click handler for: ${breadcrumbItem.text}`);
      breadcrumbItem.clickHandler(breadcrumbItem);
    } else if (hasHref(breadcrumbItem)) {
      // Let the natural link behavior handle navigation
      this.logger.info(`BreadcrumbsComponent - Navigation to: ${breadcrumbItem.href}`);
    } else {
      // Display-only breadcrumb, prevent any action
      event.preventDefault();
      this.logger.info(`BreadcrumbsComponent - Display-only breadcrumb clicked: ${breadcrumbItem.text}`);
    }
  }

  /**
   * Set the complete breadcrumb trail
   */
  setBreadcrumbs(items: BreadcrumbItem[]): void {
    this.logger.info(`BreadcrumbsComponent - Setting ${items.length} breadcrumbs:`, items.map(item => item.text));
    
    this.breadcrumbs = [...items]; // Create a copy to avoid external modifications
    this.renderBreadcrumbs();
  }

  /**
   * Add a breadcrumb to the end of the trail
   */
  addBreadcrumb(item: BreadcrumbItem): void {
    this.logger.info(`BreadcrumbsComponent - Adding breadcrumb: ${item.text}`);
    
    // Check for duplicates
    if (this.breadcrumbs.find(existing => existing.id === item.id)) {
      this.logger.warn(`BreadcrumbsComponent - Breadcrumb with id '${item.id}' already exists, updating instead`);
      this.updateBreadcrumb(item.id, item);
      return;
    }
    
    this.breadcrumbs.push(item);
    this.renderBreadcrumbs();
  }

  /**
   * Remove a breadcrumb by ID
   */
  removeBreadcrumb(id: string): void {
    this.logger.info(`BreadcrumbsComponent - Removing breadcrumb: ${id}`);
    
    const initialLength = this.breadcrumbs.length;
    this.breadcrumbs = this.breadcrumbs.filter(item => item.id !== id);
    
    if (this.breadcrumbs.length === initialLength) {
      this.logger.warn(`BreadcrumbsComponent - Breadcrumb not found for removal: ${id}`);
      return;
    }
    
    this.renderBreadcrumbs();
  }

  /**
   * Update a specific breadcrumb item
   */
  updateBreadcrumb(id: string, updates: Partial<BreadcrumbItem>): void {
    this.logger.info(`BreadcrumbsComponent - Updating breadcrumb: ${id}`, updates);
    
    const index = this.breadcrumbs.findIndex(item => item.id === id);
    if (index === -1) {
      this.logger.warn(`BreadcrumbsComponent - Breadcrumb not found for update: ${id}`);
      return;
    }
    
    this.breadcrumbs[index] = { ...this.breadcrumbs[index], ...updates };
    this.renderBreadcrumbs();
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.logger.info("BreadcrumbsComponent - Clearing all breadcrumbs");
    this.breadcrumbs = [];
    this.renderBreadcrumbs();
  }

  /**
   * Get current breadcrumbs
   */
  getBreadcrumbs(): BreadcrumbItem[] {
    return [...this.breadcrumbs]; // Return a copy
  }

  /**
   * Render breadcrumbs to DOM
   */
  private renderBreadcrumbs(): void {
    if (!this.container) {
      this.logger.warn("BreadcrumbsComponent - Cannot render, no container available");
      return;
    }

    const breadcrumbsList = this.container.querySelector('.breadcrumbs-list');
    if (!breadcrumbsList) {
      this.logger.error("BreadcrumbsComponent - Breadcrumbs list container not found");
      return;
    }

    // Clear existing items
    breadcrumbsList.innerHTML = '';

    if (this.breadcrumbs.length === 0) {
      // Show default empty state or hide completely
      breadcrumbsList.innerHTML = `
        <li class="breadcrumb-item breadcrumb-empty">
          <span class="breadcrumb-text">Page</span>
        </li>
      `;
      return;
    }

    // Render breadcrumb items
    const breadcrumbsHTML = this.breadcrumbs.map((item, index) => {
      return this.renderBreadcrumbItem(item, index, index === this.breadcrumbs.length - 1);
    }).join('');

    breadcrumbsList.innerHTML = breadcrumbsHTML;
    
    this.logger.info(`BreadcrumbsComponent - Rendered ${this.breadcrumbs.length} breadcrumbs`);
  }

  /**
   * Render a single breadcrumb item
   */
  private renderBreadcrumbItem(item: BreadcrumbItem, index: number, isLast: boolean): string {
    const action = getBreadcrumbItemAction(item);
    const isClickable = action !== 'none';
    
    // Build the breadcrumb content
    let content = '';
    
    if (action === 'link' && hasHref(item)) {
      // Render as link
      content = `
        <a href="${item.href}" 
           class="breadcrumb-link" 
           data-breadcrumb-id="${item.id}"
           title="${item.caption || item.text}">
          <span class="breadcrumb-text">${item.text}</span>
        </a>
      `;
    } else if (action === 'action') {
      // Render as button
      content = `
        <button type="button" 
                class="breadcrumb-button" 
                data-breadcrumb-id="${item.id}"
                title="${item.caption || item.text}">
          <span class="breadcrumb-text">${item.text}</span>
        </button>
      `;
    } else {
      // Render as span (display-only)
      content = `
        <span class="breadcrumb-span" 
              data-breadcrumb-id="${item.id}"
              title="${item.caption || item.text}">
          <span class="breadcrumb-text">${item.text}</span>
        </span>
      `;
    }

    // Add separator for non-last items
    const separator = !isLast ? `
      <li class="breadcrumb-separator" aria-hidden="true">
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L4.5 5L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </li>
    ` : '';

    return `
      <li class="breadcrumb-item ${isLast ? 'breadcrumb-current' : ''} ${isClickable ? 'breadcrumb-clickable' : ''}" 
          ${isLast ? 'aria-current="page"' : ''}>
        ${content}
      </li>
      ${separator}
    `;
  }

  /**
   * Component status information for debugging
   */
  getStatus(): ComponentStatus {
    return {
      componentType: "BreadcrumbsComponent",
      id: "breadcrumbs",
      initialized: this.isInitialized,
      initTime: this.initTime,
      uptime: this.initTime ? Date.now() - this.initTime : undefined,
      domElement: this.container ? {
        tagName: this.container.tagName,
        id: this.container.id,
        className: this.container.className,
        childCount: this.container.children.length,
        hasContent: this.container.innerHTML.trim().length > 0
      } : undefined,
      eventListeners: {
        count: this.eventListeners.length,
        types: this.eventListeners.map(listener => listener.event)
      },
      configuration: {
        hasLayoutContext: !!this.layoutContext
      },
      currentState: {
        breadcrumbsCount: this.breadcrumbs.length,
        breadcrumbs: this.breadcrumbs.map(item => ({
          id: item.id,
          text: item.text,
          hasHref: !!item.href,
          hasClickHandler: !!item.clickHandler
        }))
      }
    };
  }

  /**
   * Destroy the component and clean up resources
   */
  destroy(): void {
    this.logger.info("BreadcrumbsComponent - Destroying...");
    
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
    
    // Clear breadcrumbs
    this.breadcrumbs = [];
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.isInitialized = false;
    this.initTime = null;
    
    this.logger.info("BreadcrumbsComponent - Destroyed");
  }
}