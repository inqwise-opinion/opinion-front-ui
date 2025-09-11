/**
 * EventBus Test Suite
 * 
 * Comprehensive tests for EventBus implementation covering:
 * - PUBLISH: Broadcast to ALL consumers
 * - SEND: Deliver to FIRST consumer only  
 * - REQUEST: Send to FIRST consumer, expect response
 * - CONSUME: Subscribe with cleanup management
 * - Error handling and edge cases
 * - Non-blocking behavior verification
 * - Consumer lifecycle management
 */

import { EventBusImpl } from '../../src/lib/EventBusImpl';
import { EventBusError } from '../../src/lib/EventBus';

describe('EventBus', () => {
  let eventBus: EventBusImpl;

  beforeEach(() => {
    eventBus = new EventBusImpl({ debug: false }); // Disable debug logs for tests
  });

  afterEach(() => {
    eventBus.removeAllConsumers();
  });

  // =================================================================================
  // PUBLISH Tests - Broadcast to ALL consumers
  // =================================================================================

  describe('PUBLISH - Broadcast to ALL consumers', () => {
    it('should publish to all consumers', (done) => {
      const results: string[] = [];
      let callCount = 0;

      // Register multiple consumers
      const consumer1 = eventBus.consume('test-event', (data) => {
        results.push(`consumer1: ${data.message}`);
        callCount++;
      });

      const consumer2 = eventBus.consume('test-event', (data) => {
        results.push(`consumer2: ${data.message}`);
        callCount++;
      });

      const consumer3 = eventBus.consume('test-event', (data) => {
        results.push(`consumer3: ${data.message}`);
        callCount++;
      });

      // Publish event
      eventBus.publish('test-event', { message: 'hello' });

      // Check results asynchronously (since EventBus is non-blocking)
      setTimeout(() => {
        expect(callCount).toBe(3);
        expect(results).toHaveLength(3);
        expect(results).toContain('consumer1: hello');
        expect(results).toContain('consumer2: hello');
        expect(results).toContain('consumer3: hello');

        consumer1.unregister();
        consumer2.unregister();
        consumer3.unregister();
        done();
      }, 10);
    });

    it('should handle publish to non-existent event gracefully', () => {
      expect(() => {
        eventBus.publish('non-existent-event', { data: 'test' });
      }).not.toThrow();
    });

    it('should handle publish with no consumers gracefully', () => {
      expect(() => {
        eventBus.publish('empty-event', { data: 'test' });
      }).not.toThrow();
    });

    it('should continue publishing to other consumers if one throws error', (done) => {
      const results: string[] = [];
      let callCount = 0;

      const consumer1 = eventBus.consume('test-event', () => {
        throw new Error('Consumer 1 error');
      });

      const consumer2 = eventBus.consume('test-event', (data) => {
        results.push(`consumer2: ${data.message}`);
        callCount++;
      });

      const consumer3 = eventBus.consume('test-event', (data) => {
        results.push(`consumer3: ${data.message}`);
        callCount++;
      });

      eventBus.publish('test-event', { message: 'test' });

      setTimeout(() => {
        expect(callCount).toBe(2); // Only 2 successful calls
        expect(results).toHaveLength(2);
        expect(results).toContain('consumer2: test');
        expect(results).toContain('consumer3: test');

        consumer1.unregister();
        consumer2.unregister();
        consumer3.unregister();
        done();
      }, 10);
    });

    it('should be non-blocking', () => {
      let executed = false;

      eventBus.consume('test-event', () => {
        executed = true;
      });

      eventBus.publish('test-event', { data: 'test' });

      // Should not be executed immediately (non-blocking)
      expect(executed).toBe(false);
    });
  });

  // =================================================================================
  // SEND Tests - Deliver to FIRST consumer only
  // =================================================================================

  describe('SEND - Deliver to FIRST consumer only', () => {
    it('should send to first consumer only', (done) => {
      const results: string[] = [];

      const consumer1 = eventBus.consume('test-event', (data) => {
        results.push(`consumer1: ${data.message}`);
      });

      const consumer2 = eventBus.consume('test-event', (data) => {
        results.push(`consumer2: ${data.message}`);
      });

      const consumer3 = eventBus.consume('test-event', (data) => {
        results.push(`consumer3: ${data.message}`);
      });

      eventBus.send('test-event', { message: 'hello' });

      setTimeout(() => {
        expect(results).toHaveLength(1);
        expect(results[0]).toBe('consumer1: hello'); // First registered consumer
        
        consumer1.unregister();
        consumer2.unregister();
        consumer3.unregister();
        done();
      }, 10);
    });

    it('should handle send to non-existent event gracefully', () => {
      expect(() => {
        eventBus.send('non-existent-event', { data: 'test' });
      }).not.toThrow();
    });

    it('should handle send with no consumers gracefully', () => {
      expect(() => {
        eventBus.send('empty-event', { data: 'test' });
      }).not.toThrow();
    });

    it('should send to first active consumer when first is unregistered', (done) => {
      const results: string[] = [];

      const consumer1 = eventBus.consume('test-event', (data) => {
        results.push(`consumer1: ${data.message}`);
      });

      const consumer2 = eventBus.consume('test-event', (data) => {
        results.push(`consumer2: ${data.message}`);
      });

      // Unregister first consumer
      consumer1.unregister();

      eventBus.send('test-event', { message: 'hello' });

      setTimeout(() => {
        expect(results).toHaveLength(1);
        expect(results[0]).toBe('consumer2: hello'); // Second consumer becomes first active
        
        consumer2.unregister();
        done();
      }, 10);
    });

    it('should be non-blocking', () => {
      let executed = false;

      eventBus.consume('test-event', () => {
        executed = true;
      });

      eventBus.send('test-event', { data: 'test' });

      // Should not be executed immediately (non-blocking)
      expect(executed).toBe(false);
    });
  });

  // =================================================================================
  // REQUEST Tests - Send to FIRST consumer, expect response
  // =================================================================================

  describe('REQUEST - Send to FIRST consumer, expect response', () => {
    it('should request and receive synchronous response', async () => {
      const consumer = eventBus.consume('test-request', (data) => {
        return `Response to: ${data.message}`;
      });

      const response = await eventBus.request('test-request', { message: 'hello' });

      expect(response).toBe('Response to: hello');
      consumer.unregister();
    });

    it('should request and receive asynchronous Promise response', async () => {
      const consumer = eventBus.consume('test-request', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
        return `Async response to: ${data.message}`;
      });

      const response = await eventBus.request('test-request', { message: 'hello' });

      expect(response).toBe('Async response to: hello');
      consumer.unregister();
    });

    it('should request only first consumer when multiple exist', async () => {
      const consumer1 = eventBus.consume('test-request', () => {
        return 'Response from consumer 1';
      });

      const consumer2 = eventBus.consume('test-request', () => {
        return 'Response from consumer 2';
      });

      const response = await eventBus.request('test-request', { message: 'hello' });

      expect(response).toBe('Response from consumer 1'); // First consumer only

      consumer1.unregister();
      consumer2.unregister();
    });

    it('should reject when no consumers exist', async () => {
      await expect(
        eventBus.request('non-existent-event', { data: 'test' })
      ).rejects.toThrow(EventBusError);

      await expect(
        eventBus.request('non-existent-event', { data: 'test' })
      ).rejects.toThrow('No consumers for request event: non-existent-event');
    });

    it('should reject when no active consumers exist', async () => {
      const consumer = eventBus.consume('test-request', () => 'response');
      consumer.unregister();

      await expect(
        eventBus.request('test-request', { data: 'test' })
      ).rejects.toThrow(EventBusError);

      // When all consumers are unregistered, the event has no consumers at all
      await expect(
        eventBus.request('test-request', { data: 'test' })
      ).rejects.toThrow('No consumers for request event: test-request');
    });

    it('should reject when consumer throws error', async () => {
      const consumer = eventBus.consume('test-request', () => {
        throw new Error('Consumer error');
      });

      await expect(
        eventBus.request('test-request', { data: 'test' })
      ).rejects.toThrow(EventBusError);

      consumer.unregister();
    });

    it('should reject when consumer Promise rejects', async () => {
      const consumer = eventBus.consume('test-request', async () => {
        throw new Error('Async consumer error');
      });

      await expect(
        eventBus.request('test-request', { data: 'test' })
      ).rejects.toThrow(EventBusError);

      consumer.unregister();
    });

    it('should timeout after default timeout', async () => {
      const eventBusWithTimeout = new EventBusImpl({ defaultTimeout: 50 });

      const consumer = eventBusWithTimeout.consume('test-request', async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Longer than timeout
        return 'response';
      });

      await expect(
        eventBusWithTimeout.request('test-request', { data: 'test' })
      ).rejects.toThrow('Request timeout for event: test-request');

      consumer.unregister();
    });

    it('should timeout after custom timeout', async () => {
      const consumer = eventBus.consume('test-request', async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Longer than timeout
        return 'response';
      });

      await expect(
        eventBus.request('test-request', { data: 'test' }, 30) // Custom 30ms timeout
      ).rejects.toThrow('Request timeout for event: test-request');

      consumer.unregister();
    });

    it('should return response before timeout', async () => {
      const consumer = eventBus.consume('test-request', async () => {
        await new Promise(resolve => setTimeout(resolve, 10)); // Shorter than timeout
        return 'fast response';
      });

      const response = await eventBus.request('test-request', { data: 'test' }, 100);

      expect(response).toBe('fast response');
      consumer.unregister();
    });
  });

  // =================================================================================
  // CONSUME Tests - Subscribe with cleanup management
  // =================================================================================

  describe('CONSUME - Subscribe with cleanup management', () => {
    it('should return Consumer with unregister function', () => {
      const consumer = eventBus.consume('test-event', () => {});

      expect(consumer).toHaveProperty('unregister');
      expect(consumer).toHaveProperty('isActive');
      expect(consumer).toHaveProperty('getEventName');

      expect(typeof consumer.unregister).toBe('function');
      expect(typeof consumer.isActive).toBe('function');
      expect(typeof consumer.getEventName).toBe('function');

      consumer.unregister();
    });

    it('should track consumer active state', () => {
      const consumer = eventBus.consume('test-event', () => {});

      expect(consumer.isActive()).toBe(true);
      expect(consumer.getEventName()).toBe('test-event');

      consumer.unregister();

      expect(consumer.isActive()).toBe(false);
    });

    it('should handle double unregister gracefully', () => {
      const consumer = eventBus.consume('test-event', () => {});

      consumer.unregister();
      expect(consumer.isActive()).toBe(false);

      // Should not throw on double unregister
      expect(() => consumer.unregister()).not.toThrow();
      expect(consumer.isActive()).toBe(false);
    });

    it('should not call unregistered consumers', (done) => {
      let called = false;

      const consumer = eventBus.consume('test-event', () => {
        called = true;
      });

      consumer.unregister();

      eventBus.publish('test-event', { data: 'test' });

      setTimeout(() => {
        expect(called).toBe(false);
        done();
      }, 10);
    });

    it('should throw error for invalid event name', () => {
      expect(() => {
        eventBus.consume('', () => {});
      }).toThrow(EventBusError);

      expect(() => {
        eventBus.consume(null as any, () => {});
      }).toThrow(EventBusError);

      expect(() => {
        eventBus.consume(undefined as any, () => {});
      }).toThrow(EventBusError);
    });

    it('should enforce max consumers limit', () => {
      const eventBusWithLimit = new EventBusImpl({ maxConsumersPerEvent: 2 });

      const consumer1 = eventBusWithLimit.consume('test-event', () => {});
      const consumer2 = eventBusWithLimit.consume('test-event', () => {});

      // Third consumer should throw error
      expect(() => {
        eventBusWithLimit.consume('test-event', () => {});
      }).toThrow(EventBusError);

      expect(() => {
        eventBusWithLimit.consume('test-event', () => {});
      }).toThrow('Maximum consumers limit (2) reached for event: test-event');

      consumer1.unregister();
      consumer2.unregister();
    });

    it('should allow new consumers after unregistering when at limit', () => {
      const eventBusWithLimit = new EventBusImpl({ maxConsumersPerEvent: 1 });

      const consumer1 = eventBusWithLimit.consume('test-event', () => {});

      // Second consumer should throw error
      expect(() => {
        eventBusWithLimit.consume('test-event', () => {});
      }).toThrow(EventBusError);

      // Unregister first consumer
      consumer1.unregister();

      // Now should be able to register new consumer
      expect(() => {
        const consumer2 = eventBusWithLimit.consume('test-event', () => {});
        consumer2.unregister();
      }).not.toThrow();
    });
  });

  // =================================================================================
  // Utility Methods Tests
  // =================================================================================

  describe('Utility Methods', () => {
    it('should check if event has consumers', () => {
      expect(eventBus.hasConsumers('test-event')).toBe(false);

      const consumer = eventBus.consume('test-event', () => {});
      expect(eventBus.hasConsumers('test-event')).toBe(true);

      consumer.unregister();
      expect(eventBus.hasConsumers('test-event')).toBe(false);
    });

    it('should count consumers for event', () => {
      expect(eventBus.getConsumerCount('test-event')).toBe(0);

      const consumer1 = eventBus.consume('test-event', () => {});
      expect(eventBus.getConsumerCount('test-event')).toBe(1);

      const consumer2 = eventBus.consume('test-event', () => {});
      expect(eventBus.getConsumerCount('test-event')).toBe(2);

      consumer1.unregister();
      expect(eventBus.getConsumerCount('test-event')).toBe(1);

      consumer2.unregister();
      expect(eventBus.getConsumerCount('test-event')).toBe(0);
    });

    it('should get event names', () => {
      expect(eventBus.getEventNames()).toEqual([]);

      const consumer1 = eventBus.consume('event1', () => {});
      const consumer2 = eventBus.consume('event2', () => {});
      const consumer3 = eventBus.consume('event1', () => {});

      const eventNames = eventBus.getEventNames();
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toHaveLength(2);

      consumer1.unregister();
      consumer2.unregister();
      consumer3.unregister();
    });

    it('should remove all consumers for specific event', () => {
      const consumer1 = eventBus.consume('event1', () => {});
      const consumer2 = eventBus.consume('event2', () => {});
      const consumer3 = eventBus.consume('event1', () => {});

      expect(eventBus.getConsumerCount('event1')).toBe(2);
      expect(eventBus.getConsumerCount('event2')).toBe(1);

      eventBus.removeAllConsumers('event1');

      expect(eventBus.getConsumerCount('event1')).toBe(0);
      expect(eventBus.getConsumerCount('event2')).toBe(1);

      consumer2.unregister();
    });

    it('should remove all consumers for all events', () => {
      eventBus.consume('event1', () => {});
      eventBus.consume('event2', () => {});
      eventBus.consume('event3', () => {});

      expect(eventBus.getEventNames()).toHaveLength(3);

      eventBus.removeAllConsumers();

      expect(eventBus.getEventNames()).toHaveLength(0);
    });

    it('should get debug information', () => {
      const consumer1 = eventBus.consume('event1', () => {});
      const consumer2 = eventBus.consume('event2', () => {});
      const consumer3 = eventBus.consume('event1', () => {});

      const debugInfo = eventBus.getDebugInfo();

      expect(debugInfo.eventCount).toBe(2);
      expect(debugInfo.totalConsumers).toBe(3);
      expect(debugInfo.events).toHaveLength(2);

      const event1Info = debugInfo.events.find(e => e.name === 'event1');
      const event2Info = debugInfo.events.find(e => e.name === 'event2');

      expect(event1Info?.consumers).toBe(2);
      expect(event2Info?.consumers).toBe(1);

      consumer1.unregister();
      consumer2.unregister();
      consumer3.unregister();
    });
  });

  // =================================================================================
  // EventBusError Tests
  // =================================================================================

  describe('EventBusError', () => {
    it('should create EventBusError with correct properties', () => {
      const error = new EventBusError('Test message', 'NO_CONSUMER', 'test-event');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EventBusError);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('NO_CONSUMER');
      expect(error.eventName).toBe('test-event');
      expect(error.name).toBe('EventBusError');
    });

    it('should create EventBusError without eventName', () => {
      const error = new EventBusError('Test message', 'CONSUMER_ERROR');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CONSUMER_ERROR');
      expect(error.eventName).toBeUndefined();
    });
  });

  // =================================================================================
  // Options and Configuration Tests
  // =================================================================================

  describe('Options and Configuration', () => {
    it('should use default options when none provided', () => {
      const bus = new EventBusImpl();
      
      // Test default timeout (5000ms) by checking it doesn't timeout quickly
      const consumer = bus.consume('test', () => 'response');
      
      const start = Date.now();
      bus.request('test', {}).then(() => {
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(100); // Should resolve quickly, not timeout
        consumer.unregister();
      });
    });

    it('should use custom options', () => {
      const bus = new EventBusImpl({
        defaultTimeout: 100,
        debug: true,
        maxConsumersPerEvent: 1
      });

      // Test max consumers
      const consumer1 = bus.consume('test', () => {});
      expect(() => bus.consume('test', () => {})).toThrow();
      
      consumer1.unregister();
    });

    it('should merge provided options with defaults', () => {
      const bus = new EventBusImpl({
        defaultTimeout: 200
        // debug and maxConsumersPerEvent should use defaults
      });

      // Should not enforce consumers limit (default 0 = unlimited)
      const consumer1 = bus.consume('test', () => {});
      const consumer2 = bus.consume('test', () => {});
      
      expect(() => bus.consume('test', () => {})).not.toThrow();

      consumer1.unregister();
      consumer2.unregister();
    });
  });

  // =================================================================================
  // Concurrent Access Tests
  // =================================================================================

  describe('Concurrent Access', () => {
    it('should handle multiple simultaneous publishes', (done) => {
      const results: number[] = [];
      let callCount = 0;

      const consumer = eventBus.consume('test-event', (data) => {
        results.push(data.value);
        callCount++;
      });

      // Publish multiple events simultaneously
      eventBus.publish('test-event', { value: 1 });
      eventBus.publish('test-event', { value: 2 });
      eventBus.publish('test-event', { value: 3 });

      setTimeout(() => {
        expect(callCount).toBe(3);
        expect(results).toContain(1);
        expect(results).toContain(2);
        expect(results).toContain(3);
        
        consumer.unregister();
        done();
      }, 20);
    });

    it('should handle consumers being unregistered during event processing', (done) => {
      const results: string[] = [];

      const consumer1 = eventBus.consume('test-event', (data) => {
        results.push('consumer1');
        // Unregister itself during processing
        consumer1.unregister();
      });

      const consumer2 = eventBus.consume('test-event', (data) => {
        results.push('consumer2');
      });

      eventBus.publish('test-event', { data: 'test' });

      setTimeout(() => {
        expect(results).toContain('consumer1');
        expect(results).toContain('consumer2');
        
        consumer2.unregister();
        done();
      }, 20);
    });
  });
});
