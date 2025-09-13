/**
 * Base Service Interface
 * Defines the contract for all services that can be registered with LayoutContext
 */

export interface Service {
  /**
   * Unique identifier for this service type
   * Used for debugging and service identification
   */
  getServiceId(): string;

  /**
   * Initialize the service
   * Called automatically when LayoutContext initializes services
   * Should return a promise if async initialization is required
   */
  init?(): Promise<void> | void;

  /**
   * Destroy/cleanup the service
   * Called automatically when LayoutContext is destroyed
   * Should clean up any resources, event listeners, timers, etc.
   */
  destroy?(): Promise<void> | void;

  /**
   * Check if the service is currently initialized and ready to use
   */
  isReady?(): boolean;
}

/**
 * Service Registry Interface
 * Defines how services can be registered and retrieved from LayoutContext
 */
export interface ServiceRegistry {
  /**
   * Register a service with the registry
   */
  registerService<T extends Service>(name: string, service: T): void;

  /**
   * Retrieve a registered service by name with type safety
   */
  getService<T extends Service>(name: string): T | null;

  /**
   * Check if a service is registered
   */
  hasService(name: string): boolean;

  /**
   * Unregister a service by name
   * Returns true if service was found and removed, false otherwise
   */
  unregisterService(name: string): Promise<boolean>;

  /**
   * Get all registered services
   */
  getRegisteredServices(): Map<string, Service>;

  /**
   * Get names of all registered services
   */
  getServiceNames(): string[];

  /**
   * Initialize all registered services
   */
  initializeServices(): Promise<void>;

  /**
   * Destroy all registered services
   */
  destroyServices(): Promise<void>;
}

/**
 * Service Error types for better error handling
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public serviceName: string,
    public operation: 'register' | 'get' | 'init' | 'destroy' | 'unregister'
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Service configuration options
 */
export interface ServiceConfig {
  /**
   * Whether to automatically initialize the service when registered
   */
  autoInit?: boolean;

  /**
   * Whether to allow replacing an existing service with the same name
   */
  allowReplace?: boolean;

  /**
   * Timeout for service initialization (in milliseconds)
   */
  initTimeout?: number;
}

export default Service;