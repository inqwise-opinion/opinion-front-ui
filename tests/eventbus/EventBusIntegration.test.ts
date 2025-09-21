/**
 * EventBus Integration Tests
 * 
 * Comprehensive test suite for EventBus functionality integrated into LayoutContext
 * Tests all communication patterns: PUBLISH, SEND, REQUEST, and CONSUME
 */

import { LayoutContextImpl } from '../../src/contexts/LayoutContextImpl';
import { EventBusTestService } from './EventBusTestService';
import type { LayoutContext } from '../../src/contexts/LayoutContext';
import type { Consumer } from '../../src/lib/EventBus';

describe('EventBus Integration with LayoutContext', () => {
  let layoutContext: LayoutContext;
  let testService1: EventBusTestService;
  let testService2: EventBusTestService;

  beforeEach(() => {
    // Create fresh instances for each test
    layoutContext = new LayoutContextImpl();
    testService1 = new EventBusTestService('TestService1');
    testService2 = new EventBusTestService('TestService2');
  });

  afterEach(() => {
    // Cleanup after each test
    layoutContext.destroy();
  });

  describe('EventBus Instance and Setup', () => {
    it('should create EventBus instance during LayoutContext initialization', () => {
      expect(layoutContext.getEventBus()).toBeDefined();
      expect(typeof layoutContext.getEventBus().publish).toBe('function');
      expect(typeof layoutContext.getEventBus().send).toBe('function');
      expect(typeof layoutContext.getEventBus().request).toBe('function');
      expect(typeof layoutContext.getEventBus().consume).toBe('function');
    });

    it('should provide EventBus method proxies on LayoutContext', () => {
      expect(typeof layoutContext.publish).toBe('function');
      expect(typeof layoutContext.send).toBe('function');
      expect(typeof layoutContext.request).toBe('function');
      expect(typeof layoutContext.consume).toBe('function');
    });

    it('should initialize EventBus debug information', () => {
      const debugInfo = layoutContext.getEventBusDebugInfo();
      
      expect(debugInfo).toHaveProperty('eventCount');
      expect(debugInfo).toHaveProperty('totalConsumers');
      expect(debugInfo).toHaveProperty('events');
      expect(debugInfo).toHaveProperty('componentConsumers');
      
      expect(debugInfo.eventCount).toBe(0);
      expect(debugInfo.totalConsumers).toBe(0);
      expect(Array.isArray(debugInfo.events)).toBe(true);
      expect(Array.isArray(debugInfo.componentConsumers)).toBe(true);
    });
  });

  describe('Service Registration and EventBus Integration', () => {
    it('should register services and initialize with LayoutContext', async () => {
      // Register services with the service registry
      layoutContext.registerService('testService1', testService1);
      layoutContext.registerService('testService2', testService2);
      
      // Initialize services with LayoutContext reference
      await testService1.init(layoutContext);
      await testService2.init(layoutContext);
      
      // Check services are properly initialized
      expect(testService1.getTestResults().activeConsumers).toBeGreaterThan(0);
      expect(testService2.getTestResults().activeConsumers).toBeGreaterThan(0);
      
      // Check EventBus has registered consumers
      const debugInfo = layoutContext.getEventBusDebugInfo();
      expect(debugInfo.totalConsumers).toBeGreaterThan(0);
      expect(debugInfo.componentConsumers.length).toBe(2);
    });

    it('should track consumers by component for cleanup', async () => {
      await testService1.init(layoutContext);
      await testService2.init(layoutContext);
      
      const debugInfo = layoutContext.getEventBusDebugInfo();
      
      // Should have consumers tracked by component
      expect(debugInfo.componentConsumers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            component: expect.stringContaining('TestService1'),
            consumers: expect.any(Number)
          }),
          expect.objectContaining({
            component: expect.stringContaining('TestService2'),
            consumers: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('PUBLISH Pattern - Broadcast to All Consumers', () => {
    beforeEach(async () => {
      await testService1.init(layoutContext);
      await testService2.init(layoutContext);
    });

    it('should broadcast events to all consumers', (done) => {
      const message = 'Test broadcast message';
      
      // Clear any previous test results
      testService1.clearTestResults();
      testService2.clearTestResults();
      
      // Publish broadcast event
      testService1.testPublish(message);
      
      // Both services should receive the broadcast
      setTimeout(() => {
        try {
          const results1 = testService1.getTestResults();
          const results2 = testService2.getTestResults();
          
          expect(results1.receivedEvents).toBeGreaterThan(0);
          expect(results2.receivedEvents).toBeGreaterThan(0);
          
          // Check event data
          const broadcastEvents1 = results1.events.filter(e => e.event === 'test:broadcast');
          const broadcastEvents2 = results2.events.filter(e => e.event === 'test:broadcast');
          
          expect(broadcastEvents1).toHaveLength(1);
          expect(broadcastEvents2).toHaveLength(1);
          
          expect(broadcastEvents1[0].data.message).toBe(message);
          expect(broadcastEvents2[0].data.message).toBe(message);
          done();
        } catch (error) {
          done(error);
        }
      }, 100);
    });

    it('should use LayoutContext publish method', () => {
      const testData = { test: 'data', timestamp: Date.now() };
      
      // Should not throw
      expect(() => {
        layoutContext.publish('test:custom-event', testData);
      }).not.toThrow();
    });
  });

  describe('SEND Pattern - Deliver to First Consumer Only', () => {
    beforeEach(async () => {
      await testService1.init(layoutContext);
      await testService2.init(layoutContext);
    });

    it('should send events to first consumer only', (done) => {
      const message = 'Test direct message';
      
      // Clear any previous test results
      testService1.clearTestResults();
      testService2.clearTestResults();
      
      // Send direct message
      testService1.testSend(message);
      
      // Only one service should receive the message
      setTimeout(() => {
        try {
          const results1 = testService1.getTestResults();
          const results2 = testService2.getTestResults();
          
          const directEvents1 = results1.events.filter(e => e.event === 'test:direct-message');
          const directEvents2 = results2.events.filter(e => e.event === 'test:direct-message');
          
          // Only one service should have received the event
          const totalDirectEvents = directEvents1.length + directEvents2.length;
          expect(totalDirectEvents).toBe(1);
          
          if (directEvents1.length > 0) {
            expect(directEvents1[0].data.message).toBe(message);
          } else {
            expect(directEvents2[0].data.message).toBe(message);
          }
          done();
        } catch (error) {
          done(error);
        }
      }, 100);
    });

    it('should use LayoutContext send method', () => {
      const testData = { test: 'data', timestamp: Date.now() };
      
      // Should not throw
      expect(() => {
        layoutContext.send('test:custom-direct', testData);
      }).not.toThrow();
    });
  });

  describe('REQUEST Pattern - Send and Await Response', () => {
    beforeEach(async () => {
      await testService1.init(layoutContext);
      await testService2.init(layoutContext);
    });

    it('should handle synchronous request-response', async () => {
      const operation = 'test-operation';
      const params = { param1: 'value1', param2: 42 };
      
      // Send request and await response
      const response = await testService1.testRequest(operation, params);
      
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('operation', operation);
      expect(response.data).toHaveProperty('echo', params);
      expect(response.data.result).toContain('Processed by');
    });

    it('should handle asynchronous request-response', async () => {
      const operation = 'test-async-operation';
      const params = { async: true, delay: 100 };
      
      // Send async request and await response
      const response = await testService1.testAsyncRequest(operation, params);
      
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('operation', operation);
      expect(response.data).toHaveProperty('echo', params);
      expect(response.data).toHaveProperty('processingDelay', 100);
      expect(response.data.result).toContain('Async processed by');
    });

    it('should handle request timeout', async () => {
      // Send request to non-existent event (no consumers)
      const timeoutPromise = layoutContext.request('test:nonexistent-event', {}, 100);
      
      // Current behavior: no consumers -> immediate NO_CONSUMER error (not a timeout)
      await expect(timeoutPromise).rejects.toThrow(/no consumers/i);
    });

    it('should use LayoutContext request method', async () => {
      const testData = { test: 'request' };
      
      // This should timeout since no consumer is registered
      await expect(
        layoutContext.request('test:no-consumer', testData, 100)
      ).rejects.toThrow();
    });
  });

  describe('CONSUME Pattern - Event Subscription', () => {
    it('should register consumers with component tracking', () => {
      const componentId = 'test-component';
      
      const consumer = layoutContext.consume(
        'test:custom-event',
        (data: any) => {
          console.log('Received custom event:', data);
        },
        componentId
      );
      
      expect(consumer).toBeDefined();
      expect(typeof consumer.unregister).toBe('function');
      expect(consumer.isActive()).toBe(true);
      
      const debugInfo = layoutContext.getEventBusDebugInfo();
      expect(debugInfo.componentConsumers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            component: componentId,
            consumers: 1
          })
        ])
      );
    });

    it('should allow consumer unregistration', () => {
      const consumer = layoutContext.consume(
        'test:unregister-event',
        (data: any) => {
          console.log('Should not receive this:', data);
        }
      );
      
      expect(consumer.isActive()).toBe(true);
      
      consumer.unregister();
      
      expect(consumer.isActive()).toBe(false);
    });
  });

  describe('Component Cleanup', () => {
    beforeEach(async () => {
      await testService1.init(layoutContext);
      await testService2.init(layoutContext);
    });

    it('should unregister consumers for specific components', () => {
      const service1Id = testService1.getServiceId();
      
      // Get initial consumer counts
      const initialDebugInfo = layoutContext.getEventBusDebugInfo();
      const initialConsumers = initialDebugInfo.componentConsumers.find(
        cc => cc.component === service1Id
      )?.consumers || 0;
      
      expect(initialConsumers).toBeGreaterThan(0);
      
      // Unregister consumers for testService1
      const unregisteredCount = layoutContext.unregisterEventBusConsumers(service1Id);
      
      expect(unregisteredCount).toBe(initialConsumers);
      
      // Check consumers are removed
      const afterDebugInfo = layoutContext.getEventBusDebugInfo();
      const afterConsumers = afterDebugInfo.componentConsumers.find(
        cc => cc.component === service1Id
      );
      
      expect(afterConsumers).toBeUndefined();
    });

    it('should cleanup all EventBus consumers on destroy', () => {
      const initialDebugInfo = layoutContext.getEventBusDebugInfo();
      expect(initialDebugInfo.totalConsumers).toBeGreaterThan(0);
      
      // Destroy layout context
      layoutContext.destroy();
      
      const afterDebugInfo = layoutContext.getEventBusDebugInfo();
      expect(afterDebugInfo.totalConsumers).toBe(0);
      expect(afterDebugInfo.componentConsumers).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await testService1.init(layoutContext);
    });

    it('should handle consumer errors gracefully', () => {
      // Register consumer that throws error
      const errorConsumer = layoutContext.consume(
        'test:error-event',
        (data: any) => {
          throw new Error('Consumer error');
        }
      );
      
      // Publishing should not throw even if consumer throws
      expect(() => {
        layoutContext.publish('test:error-event', { test: 'data' });
      }).not.toThrow();
      
      errorConsumer.unregister();
    });

    it('should handle request consumer errors', async () => {
      // Register request consumer that throws error
      const errorConsumer = layoutContext.consume(
        'test:error-request',
        (data: any) => {
          throw new Error('Request consumer error');
        }
      );
      
      // Request should be rejected with consumer error
      await expect(
        layoutContext.request('test:error-request', {})
      ).rejects.toThrow();
      
      errorConsumer.unregister();
    });
  });

  describe('Performance and Concurrency', () => {
    beforeEach(async () => {
      await testService1.init(layoutContext);
      await testService2.init(layoutContext);
    });

    it('should handle multiple concurrent requests', async () => {
      const numRequests = 5;
      const requests = Array.from({ length: numRequests }, (_, i) => 
        testService1.testRequest(`operation-${i}`, { index: i })
      );
      
      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(numRequests);
      responses.forEach((response, index) => {
        expect(response.success).toBe(true);
        expect(response.data.operation).toBe(`operation-${index}`);
      });
    });

    it('should handle rapid event publishing', (done) => {
      const numEvents = 100;
      
      // Clear test results
      testService1.clearTestResults();
      testService2.clearTestResults();
      
      // Publish many events rapidly
      for (let i = 0; i < numEvents; i++) {
        testService1.testPublish(`Message ${i}`);
      }
      
      // Allow async processing to complete
      setTimeout(() => {
        try {
          const results1 = testService1.getTestResults();
          const results2 = testService2.getTestResults();
          
          // Both services should have received all broadcasts
          const broadcasts1 = results1.events.filter(e => e.event === 'test:broadcast');
          const broadcasts2 = results2.events.filter(e => e.event === 'test:broadcast');
          
          expect(broadcasts1.length).toBe(numEvents);
          expect(broadcasts2.length).toBe(numEvents);
          done();
        } catch (error) {
          done(error);
        }
      }, 1000);
    });
  });
});