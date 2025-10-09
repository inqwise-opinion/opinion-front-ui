import EventBus, { globalEventBus, AppEvents, EventCallback } from '../../src/utils/EventBus';
import { LoggerFactory } from '../../src/logging/LoggerFactory';

// Mock the logger to avoid console output during tests
jest.mock('../../src/logging/LoggerFactory', () => ({
  LoggerFactory: {
    getInstance: () => ({
      getLogger: () => ({
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
      })
    })
  }
}));

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    // Clear any existing subscriptions on the global event bus
    globalEventBus.clearAll();
  });

  afterEach(() => {
    eventBus.clearAll();
    globalEventBus.clearAll();
  });

  describe('Basic functionality', () => {
    it('should create new EventBus instance', () => {
      expect(eventBus).toBeInstanceOf(EventBus);
    });

    it('should start with no events or subscribers', () => {
      expect(eventBus.getEventNames()).toEqual([]);
      expect(eventBus.getSubscriberCount('test-event')).toBe(0);
    });
  });

  describe('Event subscription', () => {
    it('should subscribe to events and return subscription object', () => {
      const callback = jest.fn();
      const subscription = eventBus.subscribe('test-event', callback);
      
      expect(subscription).toHaveProperty('unsubscribe');
      expect(typeof subscription.unsubscribe).toBe('function');
      expect(eventBus.getSubscriberCount('test-event')).toBe(1);
      expect(eventBus.getEventNames()).toContain('test-event');
    });

    it('should support multiple subscribers for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.subscribe('test-event', callback1);
      eventBus.subscribe('test-event', callback2);
      
      expect(eventBus.getSubscriberCount('test-event')).toBe(2);
    });

    it('should support different events', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.subscribe('event-1', callback1);
      eventBus.subscribe('event-2', callback2);
      
      expect(eventBus.getEventNames()).toContain('event-1');
      expect(eventBus.getEventNames()).toContain('event-2');
      expect(eventBus.getSubscriberCount('event-1')).toBe(1);
      expect(eventBus.getSubscriberCount('event-2')).toBe(1);
    });
  });

  describe('Event publishing', () => {
    it('should publish events to subscribers', () => {
      const callback = jest.fn();
      eventBus.subscribe('test-event', callback);
      
      eventBus.publish('test-event', { message: 'test data' });
      
      expect(callback).toHaveBeenCalledWith({ message: 'test data' });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should publish events to all subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();
      
      eventBus.subscribe('test-event', callback1);
      eventBus.subscribe('test-event', callback2);
      eventBus.subscribe('other-event', callback3);
      
      eventBus.publish('test-event', 'shared data');
      
      expect(callback1).toHaveBeenCalledWith('shared data');
      expect(callback2).toHaveBeenCalledWith('shared data');
      expect(callback3).not.toHaveBeenCalled();
    });

    it('should publish without data parameter', () => {
      const callback = jest.fn();
      eventBus.subscribe('test-event', callback);
      
      eventBus.publish('test-event');
      
      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it('should handle publishing to non-existent events gracefully', () => {
      expect(() => {
        eventBus.publish('non-existent-event', 'data');
      }).not.toThrow();
    });

    it('should handle errors in event handlers gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalCallback = jest.fn();
      
      eventBus.subscribe('test-event', errorCallback);
      eventBus.subscribe('test-event', normalCallback);
      
      // Should not throw and should still call the normal callback
      expect(() => {
        eventBus.publish('test-event', 'test data');
      }).not.toThrow();
      
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('Event unsubscription', () => {
    it('should unsubscribe specific callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const subscription1 = eventBus.subscribe('test-event', callback1);
      eventBus.subscribe('test-event', callback2);
      
      expect(eventBus.getSubscriberCount('test-event')).toBe(2);
      
      subscription1.unsubscribe();
      
      expect(eventBus.getSubscriberCount('test-event')).toBe(1);
      
      eventBus.publish('test-event', 'test data');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should clean up empty event sets after unsubscription', () => {
      const callback = jest.fn();
      const subscription = eventBus.subscribe('test-event', callback);
      
      expect(eventBus.getEventNames()).toContain('test-event');
      
      subscription.unsubscribe();
      
      expect(eventBus.getEventNames()).not.toContain('test-event');
      expect(eventBus.getSubscriberCount('test-event')).toBe(0);
    });

    it('should handle multiple unsubscribe calls safely', () => {
      const callback = jest.fn();
      const subscription = eventBus.subscribe('test-event', callback);
      
      subscription.unsubscribe();
      
      expect(() => {
        subscription.unsubscribe();
      }).not.toThrow();
    });
  });

  describe('Utility methods', () => {
    it('should correctly report hasSubscribers', () => {
      expect(eventBus.hasSubscribers('test-event')).toBe(false);
      
      const subscription = eventBus.subscribe('test-event', jest.fn());
      
      expect(eventBus.hasSubscribers('test-event')).toBe(true);
      
      subscription.unsubscribe();
      
      expect(eventBus.hasSubscribers('test-event')).toBe(false);
    });

    it('should clear specific events', () => {
      eventBus.subscribe('event-1', jest.fn());
      eventBus.subscribe('event-2', jest.fn());
      
      expect(eventBus.hasSubscribers('event-1')).toBe(true);
      expect(eventBus.hasSubscribers('event-2')).toBe(true);
      
      eventBus.clearEvent('event-1');
      
      expect(eventBus.hasSubscribers('event-1')).toBe(false);
      expect(eventBus.hasSubscribers('event-2')).toBe(true);
    });

    it('should clear all events', () => {
      eventBus.subscribe('event-1', jest.fn());
      eventBus.subscribe('event-2', jest.fn());
      
      expect(eventBus.getEventNames().length).toBe(2);
      
      eventBus.clearAll();
      
      expect(eventBus.getEventNames().length).toBe(0);
    });
  });

  describe('Type safety', () => {
    it('should work with typed callbacks', () => {
      interface TestData {
        id: number;
        name: string;
      }
      
      const typedCallback: EventCallback<TestData> = jest.fn();
      eventBus.subscribe<TestData>('typed-event', typedCallback);
      
      const testData: TestData = { id: 1, name: 'Test' };
      eventBus.publish<TestData>('typed-event', testData);
      
      expect(typedCallback).toHaveBeenCalledWith(testData);
    });
  });

  describe('Global EventBus', () => {
    it('should provide global event bus instance', () => {
      expect(globalEventBus).toBeInstanceOf(EventBus);
    });

    it('should maintain separate state from new instances', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      globalEventBus.subscribe('global-event', callback1);
      eventBus.subscribe('instance-event', callback2);
      
      globalEventBus.publish('global-event', 'global data');
      eventBus.publish('instance-event', 'instance data');
      
      expect(callback1).toHaveBeenCalledWith('global data');
      expect(callback2).toHaveBeenCalledWith('instance data');
      
      // Cross-publish should not trigger callbacks
      globalEventBus.publish('instance-event', 'should not reach callback2');
      eventBus.publish('global-event', 'should not reach callback1');
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('AppEvents helper functions', () => {
    beforeEach(() => {
      globalEventBus.clearAll();
    });

    it('should publish sidebar events', () => {
      const callback = jest.fn();
      globalEventBus.subscribe('sidebar:compact-mode-changed', callback);
      
      AppEvents.sidebarCompactModeChanged(true);
      
      expect(callback).toHaveBeenCalledWith({ isCompact: true });
    });

    it('should publish header events', () => {
      const callback = jest.fn();
      globalEventBus.subscribe('header:user-updated', callback);
      
      AppEvents.headerUserUpdated('testuser', 'test@example.com');
      
      expect(callback).toHaveBeenCalledWith({ 
        username: 'testuser', 
        email: 'test@example.com' 
      });
    });

    it('should publish main content events', () => {
      const callback = jest.fn();
      globalEventBus.subscribe('main:content-loaded', callback);
      
      AppEvents.mainContentLoaded('Dashboard');
      
      expect(callback).toHaveBeenCalledWith({ title: 'Dashboard' });
    });

    it('should publish app-wide events', () => {
      const layoutCallback = jest.fn();
      const errorCallback = jest.fn();
      
      globalEventBus.subscribe('app:layout-ready', layoutCallback);
      globalEventBus.subscribe('app:error', errorCallback);
      
      AppEvents.appLayoutReady();
      AppEvents.appError('Header', 'Failed to initialize');
      
      expect(layoutCallback).toHaveBeenCalledWith({});
      expect(errorCallback).toHaveBeenCalledWith({ 
        component: 'Header', 
        error: 'Failed to initialize' 
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle subscribing same callback multiple times', () => {
      const callback = jest.fn();
      
      eventBus.subscribe('test-event', callback);
      eventBus.subscribe('test-event', callback);
      
      // Should only add callback once (Set behavior)
      expect(eventBus.getSubscriberCount('test-event')).toBe(1);
      
      eventBus.publish('test-event', 'data');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle empty event names', () => {
      const callback = jest.fn();
      
      expect(() => {
        eventBus.subscribe('', callback);
        eventBus.publish('', 'data');
      }).not.toThrow();
      
      expect(callback).toHaveBeenCalledWith('data');
    });

    it('should handle null/undefined data', () => {
      const callback = jest.fn();
      eventBus.subscribe('test-event', callback);
      
      eventBus.publish('test-event', null);
      eventBus.publish('test-event', undefined);
      
      expect(callback).toHaveBeenNthCalledWith(1, null);
      expect(callback).toHaveBeenNthCalledWith(2, undefined);
    });
  });

  describe('Memory management', () => {
    it('should not leak memory after unsubscription', () => {
      const callbacks = Array.from({ length: 100 }, () => jest.fn());
      const subscriptions = callbacks.map(cb => 
        eventBus.subscribe('memory-test', cb)
      );
      
      expect(eventBus.getSubscriberCount('memory-test')).toBe(100);
      
      subscriptions.forEach(sub => sub.unsubscribe());
      
      expect(eventBus.getSubscriberCount('memory-test')).toBe(0);
      expect(eventBus.getEventNames()).not.toContain('memory-test');
    });

    it('should handle high-frequency publish/subscribe cycles', () => {
      const callback = jest.fn();
      
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          const subscription = eventBus.subscribe('high-freq', callback);
          eventBus.publish('high-freq', i);
          subscription.unsubscribe();
        }
      }).not.toThrow();
      
      expect(callback).toHaveBeenCalledTimes(1000);
    });
  });
});