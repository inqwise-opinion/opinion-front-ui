import { LifecycleHandler } from '../interfaces/LifecycleHandler';
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

/**
 * Base component class that implements lifecycle methods
 * Other components should extend this instead of implementing LifecycleHandler directly
 */
export abstract class BaseComponent {
  protected _initialized = false;
  protected _destroyed = false;
  protected logger: Logger;

  constructor() {
    this.logger = LoggerFactory.getInstance().getLogger(this.constructor.name);
  }

  /**
   * Called before component initialization
   * Optional hook for setup tasks
   */
  protected async onBeforeInit(): Promise<void> {
    // Optional override
  }

  /**
   * Main initialization method 
   * Must be implemented by concrete components
   */
  protected abstract onInit(): Promise<void> | void;

  /**
   * Called after component is fully initialized
   * Optional hook for post-initialization tasks
   */
  protected onPostInit(): Promise<void> | void {
    // Optional override
  }

  /**
   * Called before component destruction
   * Optional hook for cleanup preparation
   */
  protected async onBeforeDestroy(): Promise<void> {
    // Optional override
  }

  /**
   * Main cleanup method
   * Must be implemented by concrete components
   */
  protected abstract onDestroy(): void;

  /**
   * Called after component is fully destroyed
   * Optional hook for post-destruction tasks
   */
  protected async onAfterDestroy(): Promise<void> {
    // Optional override
  }

  /**
   * Initialize the component
   * Executes lifecycle hooks in order
   */
  public async init(): Promise<void> {
    if (this._initialized || this._destroyed) {
      this.logger.warn('Cannot initialize - already initialized or destroyed');
      return;
    }

    try {
      await this.onBeforeInit();
      await this.onInit();
      this._initialized = true;
      await this.onPostInit();
    } catch (error) {
      this.logger.error('Initialization failed', error);
      throw error;
    }
  }

  /**
   * Destroy the component
   * Executes lifecycle hooks in order
   */
  public async destroy(): Promise<void> {
    if (this._destroyed) {
      this.logger.warn('Already destroyed');
      return;
    }

    try {
      await this.onBeforeDestroy();
      this.onDestroy();
      this._destroyed = true;
      this._initialized = false;
      await this.onAfterDestroy();
    } catch (error) {
      this.logger.error('Destruction failed', error);
      throw error;
    }
  }

  /**
   * Check if component is initialized
   */
  public isComponentInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Check if component is destroyed
   */
  public isComponentDestroyed(): boolean {
    return this._destroyed;
  }
}

export default BaseComponent;