import { 
  Consumer, 
  EventBus, 
  EventBusError, 
  EventBusOptions 
} from './EventBus';
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

type EventHandler<T = unknown> = (data: T) => unknown | Promise<unknown>;

interface ConsumerImpl extends Consumer {
  handler: EventHandler;
}

/**
 * EventBus Implementation
 * 
 * Non-blocking event communication system with three communication patterns:
 * - PUBLISH: Broadcast to ALL consumers 
 * - SEND: Deliver to FIRST consumer only
 * - REQUEST: Send to FIRST consumer and await response
 */
export class EventBusImpl implements EventBus {
  private listeners: Map<string, Set<ConsumerImpl>> = new Map();
  private options: EventBusOptions;
  private logger: Logger;

  constructor(options: EventBusOptions = {}) {
    this.options = {
      defaultTimeout: 5000,
      debug: false,
      maxConsumersPerEvent: 0,
      ...options
    };
    this.logger = LoggerFactory.getInstance().getLogger('EventBusImpl');
  }

  /**
   * PUBLISH - Broadcast to ALL consumers (non-blocking)
   */
  publish(event: string, data: unknown): void {
    if (this.options.debug) {
      this.logger.debug(`📢 EventBus PUBLISH: ${event}`, data);
    }

    const consumers = this.listeners.get(event);
    if (!consumers || consumers.size === 0) {
      if (this.options.debug) {
        this.logger.debug(`📢 EventBus: No consumers for event '${event}'`);
      }
      return;
    }

    // Execute all handlers asynchronously
    consumers.forEach(consumer => {
      if (consumer.isActive()) {
        setTimeout(() => {
          try {
            consumer.handler(data);
          } catch (error) {
            this.logger.error(`EventBus PUBLISH error in handler for '${event}':`, error);
          }
        }, 0);
      }
    });
  }

  /**
   * SEND - Deliver to FIRST consumer only (non-blocking)
   */
  send(event: string, data: unknown): void {
    if (this.options.debug) {
      this.logger.debug(`📤 EventBus SEND: ${event}`, data);
    }

    const consumers = this.listeners.get(event);
    if (!consumers || consumers.size === 0) {
      if (this.options.debug) {
        this.logger.debug(`📤 EventBus: No consumers for SEND event '${event}'`);
      }
      return;
    }

    // Get first active consumer
    const firstConsumer = Array.from(consumers).find(c => c.isActive());
    if (!firstConsumer) {
      if (this.options.debug) {
        this.logger.debug(`📤 EventBus: No active consumers for SEND event '${event}'`);
      }
      return;
    }

    // Execute handler asynchronously
    setTimeout(() => {
      try {
        firstConsumer.handler(data);
      } catch (error) {
        this.logger.error(`EventBus SEND error in handler for '${event}':`, error);
      }
    }, 0);
  }

  /**
   * REQUEST - Send to FIRST consumer and await response (non-blocking Promise)
   */
  request(event: string, data: unknown, timeout?: number): Promise<unknown> {
    if (this.options.debug) {
      this.logger.debug(`📬 EventBus REQUEST: ${event}`, data);
    }

    return new Promise((resolve, reject) => {
      const consumers = this.listeners.get(event);
      if (!consumers || consumers.size === 0) {
        const error = new EventBusError(
          `No consumers for request event: ${event}`,
          'NO_CONSUMER',
          event
        );
        reject(error);
        return;
      }

      // Get first active consumer
      const firstConsumer = Array.from(consumers).find(c => c.isActive());
      if (!firstConsumer) {
        const error = new EventBusError(
          `No active consumers for request event: ${event}`,
          'NO_CONSUMER',
          event
        );
        reject(error);
        return;
      }

      // Set up timeout
      const timeoutMs = timeout || this.options.defaultTimeout || 5000;
      const timeoutId = setTimeout(() => {
        reject(new EventBusError(
          `Request timeout for event: ${event}`,
          'TIMEOUT',
          event
        ));
      }, timeoutMs);

      // Execute handler asynchronously
      setTimeout(() => {
        try {
          const result = firstConsumer.handler(data);
          
          if (result instanceof Promise) {
            result
              .then(response => {
                clearTimeout(timeoutId);
                resolve(response);
              })
              .catch(() => {
                clearTimeout(timeoutId);
                reject(new EventBusError(
                  `Consumer error for request event: ${event}`,
                  'CONSUMER_ERROR',
                  event
                ));
              });
          } else {
            clearTimeout(timeoutId);
            resolve(result);
          }
        } catch {
          clearTimeout(timeoutId);
          reject(new EventBusError(
            `Consumer error for request event: ${event}`,
            'CONSUMER_ERROR',
            event
          ));
        }
      }, 0);
    });
  }

  /**
   * CONSUME - Subscribe to events, returns Consumer object
   */
  consume(event: string, handler: EventHandler): Consumer {
    if (this.options.debug) {
      this.logger.debug(`🎯 EventBus CONSUME: Registering handler for '${event}'`);
    }

    if (!event || typeof event !== 'string') {
      throw new EventBusError(
        'Event name must be a non-empty string',
        'INVALID_EVENT',
        event
      );
    }

    // Check max consumers limit
    if (this.options.maxConsumersPerEvent && this.options.maxConsumersPerEvent > 0) {
      const currentCount = this.getConsumerCount(event);
      if (currentCount >= this.options.maxConsumersPerEvent) {
        throw new EventBusError(
          `Maximum consumers limit (${this.options.maxConsumersPerEvent}) reached for event: ${event}`,
          'INVALID_EVENT',
          event
        );
      }
    }

    // Create consumers set if it doesn't exist
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const consumers = this.listeners.get(event)!;
    let active = true;

    const consumer: ConsumerImpl = {
      handler,
      unregister: () => {
        if (active) {
          consumers.delete(consumer);
          active = false;
          if (this.options.debug) {
            this.logger.debug(`🎯 EventBus: Unregistered consumer for '${event}'`);
          }
          // Clean up empty consumer sets
          if (consumers.size === 0) {
            this.listeners.delete(event);
          }
        }
      },
      isActive: () => active,
      getEventName: () => event
    };

    consumers.add(consumer);
    return consumer;
  }

  /**
   * Check if there are any consumers for an event
   */
  hasConsumers(event: string): boolean {
    const consumers = this.listeners.get(event);
    return consumers ? consumers.size > 0 : false;
  }

  /**
   * Get the number of consumers for an event
   */
  getConsumerCount(event: string): number {
    const consumers = this.listeners.get(event);
    return consumers ? consumers.size : 0;
  }

  /**
   * Remove all consumers for a specific event, or all events if no event specified
   */
  removeAllConsumers(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      if (this.options.debug) {
        this.logger.debug(`🗑️ EventBus: Removed all consumers for '${event}'`);
      }
    } else {
      this.listeners.clear();
      if (this.options.debug) {
        this.logger.debug(`🗑️ EventBus: Removed all consumers for all events`);
      }
    }
  }

  /**
   * Get list of all event names that have consumers
   */
  getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get debug information about the EventBus state
   */
  getDebugInfo(): { eventCount: number; totalConsumers: number; events: Array<{ name: string; consumers: number }> } {
    const events = Array.from(this.listeners.entries()).map(([name, consumers]) => ({
      name,
      consumers: consumers.size
    }));

    return {
      eventCount: this.listeners.size,
      totalConsumers: events.reduce((sum, event) => sum + event.consumers, 0),
      events
    };
  }
}

export default EventBusImpl;
