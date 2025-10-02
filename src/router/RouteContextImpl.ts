/**
 * Route Context Implementation
 * Concrete implementation of RouteContext interface
 */

import { RouteContext, ErrorParams } from './RouteContext';
import { LayoutContext } from '../contexts/LayoutContext';

export class RouteContextImpl implements RouteContext {
  private path: string;
  private basePath: string;
  private params: Record<string, string>;
  private accountId?: string;
  private layoutContext: LayoutContext;
  private _failed: boolean = false;
  private _failure: ErrorParams | null = null;

  constructor(
    path: string,
    params: Record<string, string>,
    layoutContext: LayoutContext,
    accountId?: string,
    basePath?: string
  ) {
    this.path = path;
    this.basePath = basePath || '/';
    this.params = params;
    this.layoutContext = layoutContext;
    this.accountId = accountId;
  }

  /**
   * Get the current route path (full path)
   */
  getPath(): string {
    return this.path;
  }

  /**
   * Get the base path for this route context
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Get route parameters
   */
  getParams(): Record<string, string> {
    return { ...this.params };
  }

  /**
   * Get a specific route parameter
   */
  getParam(key: string): string | undefined {
    return this.params[key];
  }

  /**
   * Check if a parameter exists
   */
  hasParam(key: string): boolean {
    return key in this.params;
  }

  /**
   * Get account ID if available
   */
  getAccountId(): string | undefined {
    return this.accountId;
  }

  /**
   * Get layout context for accessing services and layout functionality
   */
  getLayoutContext(): LayoutContext {
    return this.layoutContext;
  }

  /**
   * Mark this route as failed with error information
   */
  fail(error: ErrorParams): void {
    this._failed = true;
    this._failure = error;
  }

  /**
   * Check if this route has failed
   */
  failed(): boolean {
    return this._failed;
  }

  /**
   * Get failure information if route failed
   */
  failure(): ErrorParams | null {
    return this._failure;
  }
}
