/**
 * EventBus Library - Non-blocking Event Communication System
 * 
 * Features:
 * - PUBLISH: Broadcast to ALL consumers (non-blocking)
 * - SEND: Deliver to FIRST consumer only (non-blocking)
 * - REQUEST: Send to FIRST consumer, expect response (non-blocking Promise)
 * - Consumer management with unregister capability
 */

export interface Consumer {
  /**
   * Unregister this consumer from the event
   */
  unregister(): void;
  
  /**
   * Check if this consumer is still active
   */
  isActive(): boolean;
  
  /**
   * Get the event name this consumer is subscribed to
   */
  getEventName(): string;
}

export interface EventBus {
  /**
   * PUBLISH - Broadcast to ALL consumers (non-blocking)
   * All registered consumers will receive the event
   */
  publish(event: string, data: any): void;
  
  /**
   * SEND - Deliver to FIRST consumer only (non-blocking)
   * Only the first registered consumer receives the event
   */
  send(event: string, data: any): void;
  
  /**
   * REQUEST - Send to FIRST consumer, expect response (non-blocking Promise)
   * Only the first registered consumer receives and can respond
   */
  request(event: string, data: any): Promise<any>;
  
  /**
   * CONSUME - Subscribe to events, returns Consumer object
   * Handler function receives the event data and can optionally return a response
   */
  consume(event: string, handler: (data: any) => any): Consumer;
  
  /**
   * Check if there are any consumers for an event
   */
  hasConsumers(event: string): boolean;
  
  /**
   * Get the number of consumers for an event
   */
  getConsumerCount(event: string): number;
  
  /**
   * Remove all consumers for a specific event, or all events if no event specified
   */
  removeAllConsumers(event?: string): void;
  
  /**
   * Get list of all event names that have consumers
   */
  getEventNames(): string[];
}

export class EventBusError extends Error {
  constructor(
    message: string,
    public code: 'NO_CONSUMER' | 'CONSUMER_ERROR' | 'TIMEOUT' | 'INVALID_EVENT',
    public eventName?: string
  ) {
    super(message);
    this.name = 'EventBusError';
  }
}

export interface EventBusOptions {
  /**
   * Default timeout for request operations (in milliseconds)
   */
  defaultTimeout?: number;
  
  /**
   * Whether to log debug information
   */
  debug?: boolean;
  
  /**
   * Maximum number of consumers per event (0 = unlimited)
   */
  maxConsumersPerEvent?: number;
}
