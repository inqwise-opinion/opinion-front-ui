/**
 * Base Service Implementation
 * 
 * Abstract base class providing common service functionality including
 * LayoutContext access, EventBus integration via LayoutContext, lifecycle 
 * management, and standardized error handling.
 */

import type { LayoutContext } from '../contexts/LayoutContext';
import type { EventBus } from '../lib/EventBus';
import type { Service, ServiceConfig } from '../interfaces/Service';
import { ServiceError } from '../interfaces/Service';
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

/**
 * Abstract base service implementation
 * 
 * Provides common functionality for all services:
 * - LayoutContext access for service discovery and component integration
 * - EventBus access via LayoutContext for reactive communication
 * - Standardized lifecycle management
 * - Error handling and logging
 * - Helper methods for service operations
 */
export abstract class BaseService implements Service {
  protected readonly _context: LayoutContext;
  protected readonly _config: ServiceConfig;
  protected readonly _logger: Logger;
  protected _initialized = false;
  protected _destroyed = false;

  constructor(context: LayoutContext, config: ServiceConfig = {}) {
    this._context = context;
    this._config = {
      autoInit: true,
      allowReplace: false,
      initTimeout: 5000,
      ...config,
    };

    // Initialize logger with service-specific name
    this._logger = LoggerFactory.getInstance().getLogger(`Service:${this.getServiceId()}`);
    this._logger.debug('Service created');
  }

  /**
   * Get service identifier - must be implemented by subclasses
   */
  abstract getServiceId(): string;

  /**
   * Initialize the service using template method pattern
   */
  async init(): Promise<void> {
    if (this._initialized) {
      this._log('⚠️', 'Service already initialized');
      return;
    }

    if (this._destroyed) {
      throw new ServiceError(
        'Cannot initialize destroyed service',
        this.getServiceId(),
        'init'
      );
    }

    this._log('🚀', 'Initializing service...');

    const startTime = Date.now();

    try {
      // Template method - subclasses implement onInit()
      await this.onInit();

      this._initialized = true;
      const initTime = Date.now() - startTime;

      this._log('✅', `Service initialized successfully in ${initTime}ms`);

      // Emit initialization event
      this._emitEvent('service:initialized', {
        service: this.getServiceId(),
        initTime,
      });

    } catch (error) {
      const initTime = Date.now() - startTime;
      const serviceError = new ServiceError(
        `Service initialization failed: ${error}`,
        this.getServiceId(),
        'init'
      );

      this._log('❌', `Service initialization failed after ${initTime}ms:`, error);

      // Emit error event
      this._emitEvent('service:error', {
        service: this.getServiceId(),
        error: serviceError,
        operation: 'init',
      });

      throw serviceError;
    }
  }

  /**
   * Destroy the service using template method pattern
   */
  async destroy(): Promise<void> {
    if (this._destroyed) {
      this._log('⚠️', 'Service already destroyed');
      return;
    }

    this._log('🧹', 'Destroying service...');

    try {
      // Template method - subclasses implement onDestroy()
      if (this._initialized) {
        await this.onDestroy();
      }

      this._destroyed = true;
      this._initialized = false;

      this._log('✅', 'Service destroyed successfully');

      // Emit destruction event
      this._emitEvent('service:destroyed', {
        service: this.getServiceId(),
      });

    } catch (error) {
      const serviceError = new ServiceError(
        `Service destruction failed: ${error}`,
        this.getServiceId(),
        'destroy'
      );

      this._log('❌', 'Service destruction failed:', error);

      // Emit error event
      this._emitEvent('service:error', {
        service: this.getServiceId(),
        error: serviceError,
        operation: 'destroy',
      });

      throw serviceError;
    }
  }

  /**
   * Check if service is ready for use
   */
  isReady(): boolean {
    return this._initialized && !this._destroyed;
  }

  /**
   * Get LayoutContext for accessing other services and components
   */
  protected getContext(): LayoutContext {
    return this._context;
  }

  /**
   * Get EventBus through LayoutContext for cross-service communication
   */
  protected getEventBus(): EventBus {
    return this._context.getEventBus();
  }

  /**
   * Get service configuration
   */
  protected getConfig(): ServiceConfig {
    return { ...this._config };
  }

  /**
   * Get another service from the LayoutContext
   * 
   * @param serviceName - Name of the service to retrieve
   * @returns Service instance or null if not found
   */
  protected getService<T extends Service>(serviceName: string): T | null {
    return this._context.getService<T>(serviceName);
  }

  /**
   * Check if another service is available
   * 
   * @param serviceName - Name of the service to check
   * @returns true if service is registered
   */
  protected hasService(serviceName: string): boolean {
    return this._context.hasService(serviceName);
  }


  /**
   * Log a message with service context
   * 
   * @param emoji - Emoji prefix for log message
   * @param message - Log message
   * @param args - Additional log arguments
   */
  protected log(emoji: string, message: string, ...args: any[]): void {
    this._log(emoji, message, ...args);
  }

  /**
   * Create a ServiceError with this service's context
   * 
   * @param message - Error message
   * @param operation - Operation that failed
   * @returns ServiceError instance
   */
  protected createError(
    message: string, 
    operation: 'register' | 'get' | 'init' | 'destroy' | 'unregister'
  ): ServiceError {
    return new ServiceError(message, this.getServiceId(), operation);
  }

  /**
   * Safe async operation wrapper with error handling
   * 
   * @param operation - Async operation to execute
   * @param errorMessage - Error message if operation fails
   * @returns Promise resolving to operation result or null on error
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this._log('❌', errorMessage, error);
      return null;
    }
  }

  // Private helper methods

  /**
   * Internal logging method
   */
  private _log(emoji: string, message: string, ...args: any[]): void {
    this._logger.debug(message, ...args);
  }

  /**
   * Internal event emission via LayoutContext EventBus
   * Uses publish() to broadcast to all consumers
   */
  private _emitEvent(event: string, data: any): void {
    try {
      const eventBus = this.getEventBus();
      // Use the correct EventBus interface method - publish for broadcasting
      if (typeof eventBus.publish === 'function') {
        eventBus.publish(event, data);
      } else {
        this._logger.warn('EventBus.publish method not available');
      }
    } catch (error) {
      this._logger.error(`Failed to publish event '${event}'`, error);
    }
  }

  // Template methods to be implemented by subclasses

  /**
   * Perform service-specific initialization
   * Override this method in subclasses to implement initialization logic
   */
  protected abstract onInit(): Promise<void>;

  /**
   * Perform service-specific cleanup
   * Override this method in subclasses to implement cleanup logic
   */
  protected abstract onDestroy(): Promise<void>;
}

/**
 * Static helper methods for service registration
 */
export class ServiceHelper {
  /**
   * Register a service with LayoutContext
   * 
   * @param context - LayoutContext to register with
   * @param name - Service registration name
   * @param service - Service instance to register
   */
  static registerService(
    context: LayoutContext,
    name: string,
    service: Service
  ): void {
    const logger = LoggerFactory.getInstance().getLogger('ServiceHelper');
    try {
      context.registerService(name, service);
      logger.debug(`Registered service: ${name} (${service.getServiceId()})`);
    } catch (error) {
      logger.error(`Failed to register service '${name}'`, error);
      throw error;
    }
  }

  /**
   * Create and register a service in one operation
   * 
   * @param context - LayoutContext to register with
   * @param name - Service registration name
   * @param factory - Factory function to create service
   * @param config - Service configuration
   * @returns Created service instance
   */
  static createAndRegister<T extends Service>(
    context: LayoutContext,
    name: string,
    factory: (context: LayoutContext, config?: ServiceConfig) => T,
    config?: ServiceConfig
  ): T {
    const service = factory(context, config);
    
    ServiceHelper.registerService(context, name, service);
    
    return service;
  }
}