/**
 * Layout Handler Type Definitions
 * 
 * Provides TypeScript interfaces for the Layout handler pattern system.
 * Supports both simple context handlers and advanced lifecycle handlers.
 */

import type { LayoutContext } from '../contexts/LayoutContext';

/**
 * Basic context handler that receives LayoutContext when ready
 * Used for simple configuration and setup tasks
 */
export type ContextHandler<T = void> = (layoutContext: LayoutContext) => T | Promise<T>;

/**
 * Handler execution result with timing information
 */
export interface HandlerResult {
  success: boolean;
  executionTime: number;
  error?: Error;
  result?: any;
}

/**
 * Advanced lifecycle handler with pre/post hooks
 * Used for complex initialization scenarios requiring multiple phases
 */
export interface LifecycleHandler {
  /**
   * Optional handler called before LayoutContext is fully ready
   * Can be used for early setup tasks that don't require context
   */
  onPreInit?: () => void | Promise<void>;

  /**
   * Main handler called when LayoutContext is ready
   * Primary configuration and setup logic goes here
   */
  onContextReady: ContextHandler;

  /**
   * Optional handler called after main context handler completes
   * Can be used for cleanup or post-setup tasks
   */
  onPostInit?: (context: LayoutContext) => void | Promise<void>;

  /**
   * Optional handler called if context initialization fails
   * Can be used for error recovery or cleanup
   */
  onError?: (error: Error, context?: LayoutContext) => void | Promise<void>;

  /**
   * Optional identifier for this handler (useful for logging/debugging)
   */
  id?: string;

  /**
   * Optional priority for handler execution order (higher = earlier)
   * Default: 0
   */
  priority?: number;
}

/**
 * Handler configuration options
 */
export interface HandlerConfig {
  /**
   * Maximum time to wait for handler execution (ms)
   * Default: 5000ms
   */
  timeout?: number;

  /**
   * Whether to continue if this handler fails
   * Default: true
   */
  continueOnError?: boolean;

  /**
   * Whether to log handler execution details
   * Default: true
   */
  enableLogging?: boolean;
}

/**
 * Handler registration entry
 */
export interface HandlerRegistration {
  handler: ContextHandler | LifecycleHandler;
  config: HandlerConfig;
  registered: Date;
}

/**
 * Type guard to check if handler is a lifecycle handler
 */
export function isLifecycleHandler(handler: ContextHandler | LifecycleHandler): handler is LifecycleHandler {
  return typeof handler === 'object' && 'onContextReady' in handler;
}

/**
 * Type guard to check if handler is a simple context handler
 */
export function isContextHandler(handler: ContextHandler | LifecycleHandler): handler is ContextHandler {
  return typeof handler === 'function';
}

/**
 * Handler execution priority levels (convenience constants)
 */
export const HandlerPriority = {
  CRITICAL: 1000,     // System-critical handlers (e.g., error handling)
  HIGH: 500,          // Important setup (e.g., service registration)
  NORMAL: 0,          // Regular configuration (default)
  LOW: -500,          // Optional enhancements
  CLEANUP: -1000,     // Final cleanup tasks
} as const;

/**
 * Utility type for creating strongly-typed handler factories
 */
export type HandlerFactory<TConfig = any> = (config: TConfig) => ContextHandler | LifecycleHandler;

/**
 * Service registration handler specifically for service architecture
 */
export interface ServiceRegistrationHandler extends LifecycleHandler {
  /**
   * Services to register during context ready phase
   */
  services?: Array<{
    name: string;
    factory: (context: LayoutContext) => any;
    dependencies?: string[];
  }>;
}