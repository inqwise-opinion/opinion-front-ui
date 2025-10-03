/**
 * ComponentReference - Lazy Component Resolution
 * 
 * Provides lazy, cached, and retry-enabled component resolution without requiring
 * explicit initialization order management. Similar to ServiceReference but for UI components.
 * 
 * Design Principles:
 * - Lazy resolution: Components resolved only when needed via get()
 * - Cached resolution: Once resolved, component reference is cached
 * - Retry logic: If component not found, retries with configurable intervals
 * - Type-safe: Full TypeScript support with generic component types
 * - Error resilient: Graceful handling of missing or unregistered components
 * 
 * Usage:
 * ```typescript
 * const headerRef = AppHeader.getRegisteredReference(layoutContext);
 * const header = await headerRef.get(); // Returns AppHeader | null
 * ```
 */

import type { LayoutContext } from '../contexts/LayoutContext';
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

/**
 * Configuration options for ComponentReference
 */
export interface ComponentReferenceConfig {
  /** Enable debug logging (default: false) */
  enableLogging?: boolean;
  /** Retry interval in milliseconds (default: 100) */
  retryInterval?: number;
  /** Maximum retry attempts (default: 20) */
  maxRetries?: number;
  /** Timeout for component resolution in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * ComponentReference implementation for lazy component resolution
 * 
 * @template T - The component type to resolve
 */
export class ComponentReference<T> {
  private readonly context: LayoutContext;
  private readonly resolver: () => T | null;
  private readonly componentName: string;
  private readonly config: Required<ComponentReferenceConfig>;
  private readonly logger: Logger;
  private cachedComponent: T | null = null;
  private resolving: Promise<T | null> | null = null;
  
  constructor(
    context: LayoutContext,
    componentName: string,
    resolver: () => T | null,
    config: ComponentReferenceConfig = {}
  ) {
    this.context = context;
    this.componentName = componentName;
    this.resolver = resolver;
    this.config = {
      enableLogging: false,
      retryInterval: 100,
      maxRetries: 20,
      timeout: 5000,
      ...config,
    };
    
    this.logger = LoggerFactory.getInstance().getLogger(`ComponentReference[${componentName}]`);
    
    if (this.config.enableLogging) {
      this.logger.debug('Created with config', this.config);
    }
  }
  
  /**
   * Get the component instance, resolving it lazily if needed
   * 
   * @returns Promise<T | null> - The resolved component or null if not found
   */
  async get(): Promise<T | null> {
    // Return cached component if available
    if (this.cachedComponent) {
      return this.cachedComponent;
    }
    
    // If already resolving, wait for existing resolution
    if (this.resolving) {
      return this.resolving;
    }
    
    // Start new resolution
    this.resolving = this.resolveComponent();
    const result = await this.resolving;
    this.resolving = null;
    
    return result;
  }
  
  /**
   * Check if component is immediately available (synchronous check)
   * 
   * @returns boolean - True if component is cached and available
   */
  isAvailable(): boolean {
    return this.cachedComponent !== null;
  }
  
  /**
   * Get cached component without resolution (synchronous)
   * 
   * @returns T | null - Cached component or null if not resolved yet
   */
  getCached(): T | null {
    return this.cachedComponent;
  }
  
  /**
   * Clear cached component (forces re-resolution on next get())
   */
  clearCache(): void {
    if (this.config.enableLogging) {
      this.logger.debug('Cache cleared');
    }
    this.cachedComponent = null;
  }
  
  /**
   * Get component name being resolved
   */
  getComponentName(): string {
    return this.componentName;
  }
  
  // Private helper methods
  
  /**
   * Resolve component with retry logic and caching
   */
  private async resolveComponent(): Promise<T | null> {
    const startTime = Date.now();
    
    if (this.config.enableLogging) {
      this.logger.debug('Starting resolution...');
    }
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      // Check timeout
      if (Date.now() - startTime > this.config.timeout) {
        if (this.config.enableLogging) {
          this.logger.warn(`Resolution timed out after ${this.config.timeout}ms`);
        }
        break;
      }
      
      // Try to resolve component
      const component = this.tryResolveComponent();
      if (component) {
        this.cachedComponent = component;
        if (this.config.enableLogging) {
          this.logger.debug(`Resolved successfully (attempt ${attempt + 1})`);
        }
        return component;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < this.config.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryInterval));
      }
    }
    
    if (this.config.enableLogging) {
      this.logger.warn(`Failed to resolve after ${this.config.maxRetries} attempts`);
    }
    
    return null;
  }
  
  /**
   * Try to resolve component using the provided resolver (single attempt)
   */
  private tryResolveComponent(): T | null {
    try {
      return this.resolver();
    } catch (error) {
      if (this.config.enableLogging) {
        this.logger.error('Error during resolution', error);
      }
      return null;
    }
  }
}