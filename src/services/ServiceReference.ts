/**
 * Service Reference - Dependency Resolution Without Initialization Order Management
 *
 * Provides lazy service resolution that eliminates the need for complex initialization
 * order management. Services can be resolved on-demand when actually needed, allowing
 * for flexible service registration without dependency ordering constraints.
 *
 * Design Principles:
 * - Lazy resolution: Services resolved only when accessed
 * - No initialization order dependencies
 * - Caching: Services cached after first resolution
 * - Error handling: Clear errors for missing services
 * - Type safety: Generic type support for service resolution
 *
 * Usage:
 * ```typescript
 * const authProvider = new ServiceReference<AuthProvider>(context, 'authProvider');
 * const provider = await authProvider.get(); // Resolves on first access
 * ```
 */

import type { LayoutContext } from "../contexts/LayoutContext";
import type { Service } from "../interfaces/Service";
import { AuthenticationError } from "../auth/exceptions/AuthenticationExceptions";

/**
 * Service reference configuration
 */
export interface ServiceReferenceConfig {
  /** Maximum number of resolution attempts before giving up (default: 3) */
  maxRetries?: number;
  /** Delay between retry attempts in milliseconds (default: 100) */
  retryDelay?: number;
  /** Whether to cache resolved services (default: true) */
  enableCaching?: boolean;
  /** Whether to log resolution attempts (default: false) */
  enableLogging?: boolean;
}

/**
 * Service reference for on-demand service resolution
 *
 * Wraps service resolution to provide lazy loading without initialization order dependencies.
 * Supports retries, caching, and type-safe service access.
 */
export class ServiceReference<T extends Service> {
  private readonly config: Required<ServiceReferenceConfig>;
  private readonly context: LayoutContext;
  private readonly serviceName: string;
  private cachedService: T | null = null;
  private resolutionAttempts = 0;

  constructor(
    context: LayoutContext,
    serviceName: string,
    config: ServiceReferenceConfig = {},
  ) {
    this.context = context;
    this.serviceName = serviceName;
    this.config = {
      maxRetries: 3,
      retryDelay: 100,
      enableCaching: true,
      enableLogging: false,
      ...config,
    };

    if (this.config.enableLogging) {
      console.log(`🔄 ServiceReference created for service '${serviceName}'`);
    }
  }

  /**
   * Get the wrapped service, resolving lazily on first access
   *
   * @returns Promise<T> - resolved service instance
   * @throws AuthenticationError if service cannot be resolved after retries
   */
  async get(): Promise<T> {
    // Return cached service if available and caching is enabled
    if (this.config.enableCaching && this.cachedService) {
      if (this.config.enableLogging) {
        console.log(
          `🎯 ServiceReference: Using cached service '${this.serviceName}'`,
        );
      }
      return this.cachedService;
    }

    // Attempt to resolve service
    const service = await this.resolveServiceWithRetry();

    // Cache the resolved service if caching is enabled
    if (this.config.enableCaching) {
      this.cachedService = service;
    }

    return service;
  }

  /**
   * Get the wrapped service synchronously if already resolved
   *
   * @returns T | null - cached service instance or null if not yet resolved
   */
  getCached(): T | null {
    return this.config.enableCaching ? this.cachedService : null;
  }

  /**
   * Check if service is available without resolving it
   *
   * @returns boolean - true if service is registered in LayoutContext
   */
  isAvailable(): boolean {
    return this.context.hasService(this.serviceName);
  }

  /**
   * Clear cached service (forces re-resolution on next get())
   */
  clearCache(): void {
    if (this.config.enableCaching) {
      this.cachedService = null;
      this.resolutionAttempts = 0;

      if (this.config.enableLogging) {
        console.log(
          `🗑️ ServiceReference: Cache cleared for service '${this.serviceName}'`,
        );
      }
    }
  }

  /**
   * Get service information without resolving the service
   *
   * @returns object with service metadata
   */
  getServiceInfo(): {
    serviceName: string;
    isAvailable: boolean;
    isCached: boolean;
    resolutionAttempts: number;
  } {
    return {
      serviceName: this.serviceName,
      isAvailable: this.isAvailable(),
      isCached: this.config.enableCaching && this.cachedService !== null,
      resolutionAttempts: this.resolutionAttempts,
    };
  }

  // Private helper methods

  /**
   * Resolve service with retry logic
   */
  private async resolveServiceWithRetry(): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      this.resolutionAttempts = attempt;

      try {
        const service = this.context.getService<T>(this.serviceName);

        if (service) {
          if (this.config.enableLogging) {
            console.log(
              `✅ ServiceReference: Resolved service '${this.serviceName}' on attempt ${attempt}`,
            );
          }
          return service;
        } else {
          throw new AuthenticationError(
            `Service '${this.serviceName}' not found in LayoutContext`,
          );
        }
      } catch (error) {
        lastError = error as Error;

        if (this.config.enableLogging) {
          console.warn(
            `⚠️ ServiceReference: Resolution attempt ${attempt} failed for '${this.serviceName}':`,
            error,
          );
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay);
        }
      }
    }

    // All attempts failed
    const availableServices = this.context.getServiceNames();
    throw new AuthenticationError(
      `Failed to resolve service '${this.serviceName}' after ${this.config.maxRetries} attempts. ` +
        `Available services: [${availableServices.join(", ")}]. ` +
        `Last error: ${lastError?.message || "Unknown error"}`,
    );
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create service references with less boilerplate
 */
export function createServiceReference<T extends Service>(
  context: LayoutContext,
  serviceName: string,
  config?: ServiceReferenceConfig,
): ServiceReference<T> {
  return new ServiceReference<T>(context, serviceName, config);
}

/**
 * Utility class for managing multiple service references
 */
export class ServiceReferenceManager {
  private readonly context: LayoutContext;
  private readonly references = new Map<string, ServiceReference<any>>();
  private readonly config: ServiceReferenceConfig;

  constructor(context: LayoutContext, config: ServiceReferenceConfig = {}) {
    this.context = context;
    this.config = config;
  }

  /**
   * Create and register a service reference
   */
  register<T extends Service>(serviceName: string): ServiceReference<T> {
    const reference = new ServiceReference<T>(
      this.context,
      serviceName,
      this.config,
    );
    this.references.set(serviceName, reference);
    return reference;
  }

  /**
   * Get a registered service reference
   */
  get<T extends Service>(serviceName: string): ServiceReference<T> | null {
    return this.references.get(serviceName) || null;
  }

  /**
   * Clear all cached services
   */
  clearAllCaches(): void {
    this.references.forEach((reference) => reference.clearCache());
  }

  /**
   * Get status of all managed services
   */
  getServiceStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    this.references.forEach((reference, serviceName) => {
      statuses[serviceName] = reference.getServiceInfo();
    });
    return statuses;
  }
}
