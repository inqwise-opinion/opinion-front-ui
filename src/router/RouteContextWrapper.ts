/**
 * RouteContextWrapper - Wraps an existing RouteContext to modify path and basePath
 * while delegating all other operations to the original context
 */

import { RouteContext, ErrorParams } from './RouteContext';
import { LayoutContext } from '../contexts/LayoutContext';

export class RouteContextWrapper implements RouteContext {
  constructor(
    private originalContext: RouteContext,
    private wrappedPath: string,
    private wrappedBasePath: string
  ) {}

  /**
   * Get the wrapped route path
   */
  getPath(): string {
    return this.wrappedPath;
  }

  /**
   * Get the wrapped base path
   */
  getBasePath(): string {
    return this.wrappedBasePath;
  }

  /**
   * Delegate to original context - route parameters are the same
   */
  getParams(): Record<string, string> {
    return this.originalContext.getParams();
  }

  /**
   * Delegate to original context
   */
  getParam(key: string): string | undefined {
    return this.originalContext.getParam(key);
  }

  /**
   * Delegate to original context
   */
  hasParam(key: string): boolean {
    return this.originalContext.hasParam(key);
  }

  /**
   * Delegate to original context
   */
  getAccountId(): string | undefined {
    return this.originalContext.getAccountId();
  }

  /**
   * Delegate to original context
   */
  getLayoutContext(): LayoutContext {
    return this.originalContext.getLayoutContext();
  }

  /**
   * Delegate to original context - error state is shared
   */
  fail(error: ErrorParams): void {
    return this.originalContext.fail(error);
  }

  /**
   * Delegate to original context
   */
  failed(): boolean {
    return this.originalContext.failed();
  }

  /**
   * Delegate to original context
   */
  failure(): ErrorParams | null {
    return this.originalContext.failure();
  }
}