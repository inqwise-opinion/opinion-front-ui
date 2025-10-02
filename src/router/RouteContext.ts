/**
 * Route Context Interface
 * Provides route information and access to layout functionality
 */

import { LayoutContext } from '../contexts/LayoutContext';

/**
 * Error parameters for route failures
 */
export interface ErrorParams {
  code?: string;
  message?: string;
  details?: string;
}

/**
 * Route context interface providing route information through getters
 */
export interface RouteContext {
  /**
   * Get the current route path (full path)
   */
  getPath(): string;

  /**
   * Get the base path for this route context
   */
  getBasePath(): string;

  /**
   * Get route parameters
   */
  getParams(): Record<string, string>;

  /**
   * Get a specific route parameter
   */
  getParam(key: string): string | undefined;

  /**
   * Check if a parameter exists
   */
  hasParam(key: string): boolean;

  /**
   * Get account ID if available
   */
  getAccountId(): string | undefined;

  /**
   * Get layout context for accessing services and layout functionality
   */
  getLayoutContext(): LayoutContext;

  /**
   * Mark this route as failed with error information
   */
  fail(error: ErrorParams): void;

  /**
   * Check if this route has failed
   */
  failed(): boolean;

  /**
   * Get failure information if route failed
   */
  failure(): ErrorParams | null;
}
