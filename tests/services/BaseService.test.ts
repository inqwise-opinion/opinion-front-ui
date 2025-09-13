/**
 * BaseService Unit Tests
 * 
 * Tests for the abstract BaseService class including lifecycle management,
 * event integration, service discovery, and error handling.
 */

import { BaseService, ServiceHelper } from '../../src/services/BaseService';
import type { LayoutContext } from '../../src/contexts/LayoutContext';
import type { EventBus } from '../../src/lib/EventBus';
import type { Service, ServiceConfig } from '../../src/interfaces/Service';
import { ServiceError } from '../../src/interfaces/Service';

// Mock implementations for testing
class MockEventBus implements EventBus {
  private listeners = new Map<string, Function[]>();
  
  on(event: string, handler: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
    
    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }
  
  emit(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }
  
  removeAllConsumers(): void {
    this.listeners.clear();
  }
  
  getActiveConsumerCount(): number {
    return Array.from(this.listeners.values()).reduce((total, handlers) => total + handlers.length, 0);
  }
}

class MockLayoutContext implements Partial<LayoutContext> {
  private services = new Map<string, Service>();
  private eventBus = new MockEventBus();
  
  registerService<T extends Service>(name: string, service: T): void {
    this.services.set(name, service);
  }
  
  getService<T extends Service>(name: string): T | null {
    return (this.services.get(name) as T) || null;
  }
  
  hasService(name: string): boolean {
    return this.services.has(name);
  }
  
  getEventBus(): EventBus {
    return this.eventBus;
  }
  
  async unregisterService(name: string): Promise<boolean> {
    return this.services.delete(name);
  }
  
  getRegisteredServices(): Map<string, Service> {
    return new Map(this.services);
  }
  
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
  
  async initializeServices(): Promise<void> {
    // Mock implementation
  }
  
  async destroyServices(): Promise<void> {
    // Mock implementation
  }
}

// Test service implementation
class TestService extends BaseService {
  public initCalled = false;
  public destroyCalled = false;
  public shouldFailInit = false;
  public shouldFailDestroy = false;
  
  constructor(context: LayoutContext, config?: ServiceConfig) {
    super(context, config);
  }
  
  getServiceId(): string {
    return 'testService';
  }
  
  protected async onInit(): Promise<void> {
    if (this.shouldFailInit) {
      throw new Error('Test init failure');
    }
    this.initCalled = true;
  }
  
  protected async onDestroy(): Promise<void> {
    if (this.shouldFailDestroy) {
      throw new Error('Test destroy failure');
    }
    this.destroyCalled = true;
  }
  
  // Expose protected methods for testing
  public testGetContext(): LayoutContext {
    return this.getContext();
  }
  
  public testGetEventBus(): EventBus {
    return this.getEventBus();
  }
  
  public testGetService<T extends Service>(name: string): T | null {
    return this.getService<T>(name);
  }
  
  public testEmitEvent(event: string, data: any): void {
    this.emitEvent(event, data);
  }
  
  public testOnEvent(event: string, handler: (data: any) => void): () => void {
    return this.onEvent(event, handler);
  }
}

describe('BaseService', () => {
  let mockContext: MockLayoutContext;
  let testService: TestService;
  
  beforeEach(() => {
    mockContext = new MockLayoutContext();
    testService = new TestService(mockContext as LayoutContext);
  });
  
  afterEach(() => {
    // Suppress console.log for clean test output
    jest.restoreAllMocks();
  });
  
  describe('Constructor', () => {
    it('should initialize with LayoutContext and default config', () => {
      expect(testService.testGetContext()).toBe(mockContext);
      expect(testService.getServiceId()).toBe('testService');
      expect(testService.isReady()).toBe(false);
    });
    
    it('should accept custom config', () => {
      const customConfig = { autoInit: false, initTimeout: 10000 };
      const service = new TestService(mockContext as LayoutContext, customConfig);
      
      expect(service.testGetContext()).toBe(mockContext);
    });
  });
  
  describe('Service Lifecycle', () => {
    it('should initialize successfully', async () => {
      await testService.init();
      
      expect(testService.initCalled).toBe(true);
      expect(testService.isReady()).toBe(true);
    });
    
    it('should handle initialization failure', async () => {
      testService.shouldFailInit = true;
      
      await expect(testService.init()).rejects.toThrow(ServiceError);
      expect(testService.initCalled).toBe(false);
      expect(testService.isReady()).toBe(false);
    });
    
    it('should prevent double initialization', async () => {
      await testService.init();
      testService.initCalled = false; // Reset flag
      
      await testService.init(); // Second call should be ignored
      expect(testService.initCalled).toBe(false);
      expect(testService.isReady()).toBe(true);
    });
    
    it('should destroy successfully', async () => {
      await testService.init();
      await testService.destroy();
      
      expect(testService.destroyCalled).toBe(true);
      expect(testService.isReady()).toBe(false);
    });
    
    it('should handle destruction failure', async () => {
      await testService.init();
      testService.shouldFailDestroy = true;
      
      await expect(testService.destroy()).rejects.toThrow(ServiceError);
      expect(testService.destroyCalled).toBe(false);
    });
    
    it('should prevent initialization of destroyed service', async () => {
      await testService.init();
      await testService.destroy();
      
      await expect(testService.init()).rejects.toThrow(ServiceError);
    });
  });
  
  describe('Service Discovery', () => {
    it('should find registered services', () => {
      const otherService = new TestService(mockContext as LayoutContext);
      mockContext.registerService('otherService', otherService);
      
      const found = testService.testGetService<TestService>('otherService');
      expect(found).toBe(otherService);
    });
    
    it('should return null for missing services', () => {
      const found = testService.testGetService('nonexistent');
      expect(found).toBeNull();
    });
    
    it('should check service existence', () => {
      const otherService = new TestService(mockContext as LayoutContext);
      mockContext.registerService('otherService', otherService);
      
      expect(testService.hasService('otherService')).toBe(true);
      expect(testService.hasService('nonexistent')).toBe(false);
    });
  });
  
  describe('Event Integration', () => {
    it('should access EventBus through LayoutContext', () => {
      const eventBus = testService.testGetEventBus();
      expect(eventBus).toBe(mockContext.getEventBus());
    });
    
    it('should emit events', () => {
      const eventData = { test: 'data' };
      let receivedData: any = null;
      
      testService.testGetEventBus().on('test:event', (data) => {
        receivedData = data;
      });
      
      testService.testEmitEvent('test:event', eventData);
      expect(receivedData).toEqual(eventData);
    });
    
    it('should subscribe to events', () => {
      let receivedData: any = null;
      const unsubscribe = testService.testOnEvent('test:event', (data) => {
        receivedData = data;
      });
      
      const eventData = { test: 'data' };
      testService.testGetEventBus().emit('test:event', eventData);
      
      expect(receivedData).toEqual(eventData);
      
      // Test unsubscribe
      receivedData = null;
      unsubscribe();
      testService.testGetEventBus().emit('test:event', eventData);
      expect(receivedData).toBeNull();
    });
    
    it('should emit lifecycle events', async () => {
      const events: any[] = [];
      
      testService.testGetEventBus().on('service:initialized', (data) => {
        events.push({ type: 'initialized', data });
      });
      
      testService.testGetEventBus().on('service:destroyed', (data) => {
        events.push({ type: 'destroyed', data });
      });
      
      await testService.init();
      await testService.destroy();
      
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('initialized');
      expect(events[0].data.service).toBe('testService');
      expect(events[1].type).toBe('destroyed');
      expect(events[1].data.service).toBe('testService');
    });
  });
  
  describe('Error Handling', () => {
    it('should create ServiceError with context', () => {
      const error = testService.createError('Test error', 'init');
      
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.serviceName).toBe('testService');
      expect(error.operation).toBe('init');
      expect(error.message).toBe('Test error');
    });
    
    it('should emit error events on initialization failure', async () => {
      let errorEvent: any = null;
      
      testService.testGetEventBus().on('service:error', (data) => {
        errorEvent = data;
      });
      
      testService.shouldFailInit = true;
      
      try {
        await testService.init();
      } catch (error) {
        // Expected
      }
      
      expect(errorEvent).toBeTruthy();
      expect(errorEvent.service).toBe('testService');
      expect(errorEvent.operation).toBe('init');
    });
  });
  
  describe('Safe Execution', () => {
    it('should handle successful operations', async () => {
      const result = await testService.safeExecute(
        async () => 'success',
        'Operation failed'
      );
      
      expect(result).toBe('success');
    });
    
    it('should handle failed operations', async () => {
      const result = await testService.safeExecute(
        async () => { throw new Error('Test error'); },
        'Operation failed'
      );
      
      expect(result).toBeNull();
    });
  });
});

describe('ServiceHelper', () => {
  let mockContext: MockLayoutContext;
  
  beforeEach(() => {
    mockContext = new MockLayoutContext();
  });
  
  describe('Service Registration', () => {
    it('should register service successfully', () => {
      const service = new TestService(mockContext as LayoutContext);
      
      ServiceHelper.registerService(mockContext as LayoutContext, 'testService', service);
      
      expect(mockContext.hasService('testService')).toBe(true);
      expect(mockContext.getService('testService')).toBe(service);
    });
    
    it('should create and register service', () => {
      const factory = (context: LayoutContext, config?: ServiceConfig) => {
        return new TestService(context, config);
      };
      
      const service = ServiceHelper.createAndRegister(
        mockContext as LayoutContext,
        'testService',
        factory,
        { autoInit: false }
      );
      
      expect(service).toBeInstanceOf(TestService);
      expect(mockContext.hasService('testService')).toBe(true);
      expect(mockContext.getService('testService')).toBe(service);
    });
  });
});