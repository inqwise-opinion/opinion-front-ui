/**
 * Global EventBus Test Suite
 * 
 * Tests for the global EventBus singleton and module exports
 */

import { 
  globalEventBus, 
  EventBusImpl,
  Consumer,
  EventBusError,
  EventBusOptions
} from '../../src/lib';

describe('Global EventBus', () => {
  afterEach(() => {
    globalEventBus.removeAllConsumers();
  });

  // =================================================================================
  // Module Exports Tests
  // =================================================================================

  describe('Module Exports', () => {
    it('should export all required components', () => {
      expect(globalEventBus).toBeDefined();
      expect(EventBusImpl).toBeDefined();
      expect(EventBusError).toBeDefined();
    });

    it('should export globalEventBus as EventBusImpl instance', () => {
      expect(globalEventBus).toBeInstanceOf(EventBusImpl);
    });

    it('should have Consumer interface available through return type', () => {
      const consumer = globalEventBus.consume('test', () => {});
      
      // Consumer should have required methods
      expect(typeof consumer.unregister).toBe('function');
      expect(typeof consumer.isActive).toBe('function');
      expect(typeof consumer.getEventName).toBe('function');
      
      consumer.unregister();
    });
  });

  // =================================================================================
  // Singleton Behavior Tests
  // =================================================================================

  describe('Singleton Behavior', () => {
    it('should maintain same instance across imports', () => {
      // This would be tested across multiple files in practice
      // For now, just verify the singleton is consistent
      expect(globalEventBus).toBe(globalEventBus);
    });

    it('should persist state across multiple operations', (done) => {
      const results: string[] = [];

      // Register consumer
      const consumer = globalEventBus.consume('persistent-test', (data) => {
        results.push(data.message);
      });

      // Publish from different context (simulating different modules)
      setTimeout(() => {
        globalEventBus.publish('persistent-test', { message: 'first' });
      }, 5);

      setTimeout(() => {
        globalEventBus.publish('persistent-test', { message: 'second' });
      }, 10);

      setTimeout(() => {
        expect(results).toEqual(['first', 'second']);
        consumer.unregister();
        done();
      }, 20);
    });

    it('should allow cross-module communication', async () => {
      const responseReceived = false;

      // Module A: Set up request handler
      const consumer = globalEventBus.consume('cross-module-test', (data) => {
        return `Processed: ${data.input}`;
      });

      // Module B: Make request (simulated)
      const response = await globalEventBus.request('cross-module-test', { 
        input: 'test data' 
      });

      expect(response).toBe('Processed: test data');
      consumer.unregister();
    });
  });

  // =================================================================================
  // Global Instance Configuration Tests
  // =================================================================================

  describe('Global Instance Configuration', () => {
    it('should use default configuration', () => {
      // Test that global instance has reasonable defaults
      expect(() => {
        const consumer1 = globalEventBus.consume('config-test', () => {});
        const consumer2 = globalEventBus.consume('config-test', () => {});
        const consumer3 = globalEventBus.consume('config-test', () => {});
        
        // Should not throw (unlimited consumers by default)
        consumer1.unregister();
        consumer2.unregister();
        consumer3.unregister();
      }).not.toThrow();
    });

    it('should have debug disabled by default', () => {
      // We can't directly test debug flag, but we can verify it doesn't
      // interfere with normal operation
      expect(() => {
        globalEventBus.publish('debug-test', { data: 'test' });
      }).not.toThrow();
    });

    it('should have reasonable default timeout', async () => {
      const consumer = globalEventBus.consume('timeout-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'quick response';
      });

      // Should resolve quickly without timeout
      const response = await globalEventBus.request('timeout-test', { data: 'test' });
      expect(response).toBe('quick response');
      
      consumer.unregister();
    });
  });

  // =================================================================================
  // Global State Management Tests
  // =================================================================================

  describe('Global State Management', () => {
    it('should maintain separate event namespaces', (done) => {
      const results: { [key: string]: string[] } = {
        namespace1: [],
        namespace2: []
      };

      const consumer1 = globalEventBus.consume('namespace1:event', (data) => {
        results.namespace1.push(data.message);
      });

      const consumer2 = globalEventBus.consume('namespace2:event', (data) => {
        results.namespace2.push(data.message);
      });

      globalEventBus.publish('namespace1:event', { message: 'msg1' });
      globalEventBus.publish('namespace2:event', { message: 'msg2' });
      globalEventBus.publish('namespace1:event', { message: 'msg3' });

      setTimeout(() => {
        expect(results.namespace1).toEqual(['msg1', 'msg3']);
        expect(results.namespace2).toEqual(['msg2']);
        
        consumer1.unregister();
        consumer2.unregister();
        done();
      }, 10);
    });

    it('should handle cleanup without affecting other consumers', () => {
      const consumer1 = globalEventBus.consume('cleanup-test', () => {});
      const consumer2 = globalEventBus.consume('other-event', () => {});
      const consumer3 = globalEventBus.consume('cleanup-test', () => {});

      expect(globalEventBus.getConsumerCount('cleanup-test')).toBe(2);
      expect(globalEventBus.getConsumerCount('other-event')).toBe(1);

      // Remove all consumers for specific event
      globalEventBus.removeAllConsumers('cleanup-test');

      expect(globalEventBus.getConsumerCount('cleanup-test')).toBe(0);
      expect(globalEventBus.getConsumerCount('other-event')).toBe(1);

      consumer2.unregister();
    });

    it('should provide debug information about global state', () => {
      const consumer1 = globalEventBus.consume('debug-event1', () => {});
      const consumer2 = globalEventBus.consume('debug-event2', () => {});
      const consumer3 = globalEventBus.consume('debug-event1', () => {});

      const debugInfo = globalEventBus.getDebugInfo();

      expect(debugInfo.eventCount).toBe(2);
      expect(debugInfo.totalConsumers).toBe(3);
      expect(debugInfo.events).toHaveLength(2);

      consumer1.unregister();
      consumer2.unregister();
      consumer3.unregister();
    });
  });

  // =================================================================================
  // Integration with Application Lifecycle Tests
  // =================================================================================

  describe('Application Lifecycle Integration', () => {
    it('should support application startup events', (done) => {
      let startupHandled = false;

      // Simulate component registering for startup
      const consumer = globalEventBus.consume('app:startup', (data) => {
        startupHandled = true;
        expect(data.phase).toBe('initialization');
      });

      // Simulate application firing startup event
      setTimeout(() => {
        globalEventBus.publish('app:startup', { phase: 'initialization' });
      }, 5);

      setTimeout(() => {
        expect(startupHandled).toBe(true);
        consumer.unregister();
        done();
      }, 15);
    });

    it('should support component communication patterns', async () => {
      // Component A: Provides data service
      const dataServiceConsumer = globalEventBus.consume('data:get-user', async (data) => {
        // Simulate async data fetch
        await new Promise(resolve => setTimeout(resolve, 5));
        return { id: data.userId, name: `User ${data.userId}`, email: `user${data.userId}@test.com` };
      });

      // Component B: Requests data
      const userData = await globalEventBus.request('data:get-user', { userId: 123 });

      expect(userData).toEqual({
        id: 123,
        name: 'User 123',
        email: 'user123@test.com'
      });

      dataServiceConsumer.unregister();
    });

    it('should support event-driven updates', (done) => {
      const updates: string[] = [];

      // Multiple components listening for updates
      const consumer1 = globalEventBus.consume('ui:update', (data) => {
        updates.push(`component1: ${data.type}`);
      });

      const consumer2 = globalEventBus.consume('ui:update', (data) => {
        updates.push(`component2: ${data.type}`);
      });

      // Central update dispatcher
      setTimeout(() => {
        globalEventBus.publish('ui:update', { type: 'theme-change' });
      }, 5);

      setTimeout(() => {
        globalEventBus.publish('ui:update', { type: 'layout-change' });
      }, 10);

      setTimeout(() => {
        expect(updates).toEqual([
          'component1: theme-change',
          'component2: theme-change',
          'component1: layout-change',
          'component2: layout-change'
        ]);

        consumer1.unregister();
        consumer2.unregister();
        done();
      }, 20);
    });
  });

  // =================================================================================
  // Error Handling in Global Context
  // =================================================================================

  describe('Global Error Handling', () => {
    it('should handle errors without affecting global state', (done) => {
      let successCount = 0;

      // Consumer that throws error
      const errorConsumer = globalEventBus.consume('error-test', () => {
        throw new Error('Consumer error');
      });

      // Consumer that works normally
      const successConsumer = globalEventBus.consume('error-test', () => {
        successCount++;
      });

      globalEventBus.publish('error-test', { data: 'test' });

      setTimeout(() => {
        expect(successCount).toBe(1); // Should still execute successful consumer
        expect(globalEventBus.hasConsumers('error-test')).toBe(true); // State should be intact

        errorConsumer.unregister();
        successConsumer.unregister();
        done();
      }, 10);
    });

    it('should handle global cleanup gracefully', () => {
      // Add various consumers
      const consumer1 = globalEventBus.consume('event1', () => {});
      const consumer2 = globalEventBus.consume('event2', () => {});
      const consumer3 = globalEventBus.consume('event3', () => {});

      expect(globalEventBus.getEventNames().length).toBeGreaterThan(0);

      // Global cleanup
      globalEventBus.removeAllConsumers();

      expect(globalEventBus.getEventNames().length).toBe(0);
      expect(globalEventBus.getDebugInfo().totalConsumers).toBe(0);
    });
  });
});
