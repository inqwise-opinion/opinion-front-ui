/**
 * PageContext Interface
 * 
 * Provides page-level functionality and utilities for PageComponent instances.
 * This interface offers a clean, grouped API for common page operations like
 * breadcrumb management, with potential for future expansion to other page features.
 */

import type { BreadcrumbsManager } from './BreadcrumbsManager';
import type { ActivePage } from './ActivePage';
import type { RouteContext } from '../router/RouteContext';

/**
 * Page context interface providing grouped functionality for pages
 * Created by RouterService before page instantiation
 */
export interface PageContext {
  /**
   * Get the page this context is associated with (null until page is created)
   */
  getPage(): ActivePage | null;

  /**
   * Get route context for this page
   */
  getRouteContext(): RouteContext;

  /**
   * Access breadcrumb management functionality
   * @returns BreadcrumbsManager instance for this page
   */
  breadcrumbs(): BreadcrumbsManager;

  /**
   * Check if the page context is ready and functional
   * @returns True if all context features are available
   */
  isReady(): boolean;

  /**
   * Get context creation timestamp
   * @returns Timestamp when this context was created
   */
  getCreatedAt(): number;

  /**
   * Associate a page with this context (called by RouterService after page creation)
   */
  setPage(page: ActivePage): void;

  /**
   * Factory method to create a page with this context
   * Called by RouterService with page provider function
   */
  createPage<T extends ActivePage>(pageProvider: (mainContent: any, pageContext: PageContext) => T, mainContent: any): T;

  // Future extensions can be added here:
  // toolbar?(): ToolbarManager;
  // actions?(): ActionsManager; 
  // dialogs?(): DialogManager;
  // notifications?(): NotificationManager;
}

/**
 * Configuration options for creating a PageContext
 */
export interface PageContextConfig {
  /**
   * Whether to initialize breadcrumbs immediately
   * @default true
   */
  initializeBreadcrumbs?: boolean;

  /**
   * Custom breadcrumb initialization delay in milliseconds
   * @default 100
   */
  breadcrumbInitDelay?: number;

  /**
   * Whether to enable debug logging for this context
   * @default false
   */
  enableDebugLogging?: boolean;
}