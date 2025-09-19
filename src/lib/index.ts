/**
 * Library Module Exports
 * 
 * Provides centralized access to utility libraries including EventBus
 */

// EventBus exports
export type { Consumer, EventBus, EventBusOptions } from './EventBus';
export { EventBusError } from './EventBus';

export { EventBusImpl } from './EventBusImpl';

// Create and export a default EventBus singleton instance for global app communication
import { EventBusImpl } from './EventBusImpl';

/**
 * Global EventBus singleton instance
 * 
 * This is the primary EventBus instance for application-wide communication.
 * Use this for global events, inter-component communication, and system-wide messaging.
 * 
 * For specialized use cases or isolated communication patterns, 
 * you can create separate EventBusImpl instances.
 */
export const globalEventBus = new EventBusImpl({
  debug: false, // Set to true for development debugging
  defaultTimeout: 5000,
  maxConsumersPerEvent: 0 // Unlimited consumers
});

// Default export is the global singleton
export default globalEventBus;
