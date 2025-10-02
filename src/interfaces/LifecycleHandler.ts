/**
 * Common interface for component lifecycle handling
 */
export interface LifecycleHandler {
  /**
   * Called before component initialization
   */
  onBeforeInit?(): Promise<void> | void;

  /**
   * Called during component initialization
   * This is the main setup method
   */
  onInit(): Promise<void> | void;

  /**
   * Called after component is fully initialized
   */
  onAfterInit?(): Promise<void> | void;

  /**
   * Called before component destruction
   */
  onBeforeDestroy?(): Promise<void> | void;

  /**
   * Called during component destruction
   * This is the main cleanup method
   */
  onDestroy(): void;

  /**
   * Called after component is fully destroyed
   */
  onAfterDestroy?(): Promise<void> | void;
}