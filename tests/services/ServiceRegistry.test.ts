import { LayoutContextImpl } from '@/contexts/LayoutContextImpl';
import { TestService } from '@/services/TestService';
import { Service } from '@/interfaces/Service';

describe('Service Registry', () => {
  let layoutContext: LayoutContextImpl;
  let testService1: TestService;
  let testService2: TestService;

  beforeEach(() => {
    layoutContext = new LayoutContextImpl();
    testService1 = new TestService('TestService1');
    testService2 = new TestService('TestService2');
  });

  afterEach(async () => {
    await layoutContext.destroy();
  });

  describe('Service Registration', () => {
    it('should register a service successfully', () => {
      layoutContext.registerService('test1', testService1);
      
      expect(layoutContext.hasService('test1')).toBe(true);
      expect(layoutContext.getService('test1')).toBe(testService1);
    });

    it('should allow replacing existing service', () => {
      layoutContext.registerService('test1', testService1);
      
      // Should allow replacement (warns but doesn't throw)
      expect(() => {
        layoutContext.registerService('test1', testService2);
      }).not.toThrow();
      
      // Should have the new service
      expect(layoutContext.getService('test1')).toBe(testService2);
    });

    it('should register multiple services', () => {
      layoutContext.registerService('test1', testService1);
      layoutContext.registerService('test2', testService2);
      
      expect(layoutContext.hasService('test1')).toBe(true);
      expect(layoutContext.hasService('test2')).toBe(true);
      expect(layoutContext.getService('test1')).toBe(testService1);
      expect(layoutContext.getService('test2')).toBe(testService2);
    });
  });

  describe('Service Retrieval', () => {
    beforeEach(() => {
      layoutContext.registerService('test1', testService1);
    });

    it('should retrieve registered service', () => {
      const service = layoutContext.getService<TestService>('test1');
      expect(service).toBe(testService1);
      expect(service.getName()).toBe('TestService1');
    });

    it('should return null when retrieving non-existent service', () => {
      const service = layoutContext.getService('nonexistent');
      expect(service).toBeNull();
    });

    it('should check service existence correctly', () => {
      expect(layoutContext.hasService('test1')).toBe(true);
      expect(layoutContext.hasService('nonexistent')).toBe(false);
    });
  });

  describe('Service Unregistration', () => {
    beforeEach(() => {
      layoutContext.registerService('test1', testService1);
      layoutContext.registerService('test2', testService2);
    });

    it('should unregister a service successfully', async () => {
      const result = await layoutContext.unregisterService('test1');
      
      expect(result).toBe(true);
      expect(layoutContext.hasService('test1')).toBe(false);
      expect(layoutContext.hasService('test2')).toBe(true);
    });

    it('should call destroy on unregistered service', async () => {
      const destroySpy = jest.spyOn(testService1, 'destroy');
      
      const result = await layoutContext.unregisterService('test1');
      
      expect(result).toBe(true);
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should return false when unregistering non-existent service', async () => {
      const result = await layoutContext.unregisterService('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Service Discovery', () => {
    beforeEach(() => {
      layoutContext.registerService('test1', testService1);
      layoutContext.registerService('test2', testService2);
    });

    it('should return all registered services', () => {
      const services = layoutContext.getRegisteredServices();
      
      expect(services.size).toBe(2);
      expect(services.get('test1')).toBe(testService1);
      expect(services.get('test2')).toBe(testService2);
    });

    it('should return all service names', () => {
      const names = layoutContext.getServiceNames();
      
      expect(names).toHaveLength(2);
      expect(names).toContain('test1');
      expect(names).toContain('test2');
    });

    it('should return empty collections when no services registered', () => {
      const emptyContext = new LayoutContextImpl();
      
      expect(emptyContext.getRegisteredServices().size).toBe(0);
      expect(emptyContext.getServiceNames()).toHaveLength(0);
      
      emptyContext.destroy();
    });
  });

  describe('Service Lifecycle Management', () => {
    beforeEach(() => {
      layoutContext.registerService('test1', testService1);
      layoutContext.registerService('test2', testService2);
    });

    it('should initialize all services', async () => {
      const init1Spy = jest.spyOn(testService1, 'init');
      const init2Spy = jest.spyOn(testService2, 'init');
      
      await layoutContext.initializeServices();
      
      expect(init1Spy).toHaveBeenCalled();
      expect(init2Spy).toHaveBeenCalled();
      expect(testService1.isInitialized()).toBe(true);
      expect(testService2.isInitialized()).toBe(true);
    });

    it('should destroy all services', async () => {
      await layoutContext.initializeServices();
      
      const destroy1Spy = jest.spyOn(testService1, 'destroy');
      const destroy2Spy = jest.spyOn(testService2, 'destroy');
      
      await layoutContext.destroyServices();
      
      expect(destroy1Spy).toHaveBeenCalled();
      expect(destroy2Spy).toHaveBeenCalled();
      expect(testService1.isInitialized()).toBe(false);
      expect(testService2.isInitialized()).toBe(false);
    });

    it('should handle service initialization errors gracefully', async () => {
      const errorService = {
        getServiceId: jest.fn().mockReturnValue('error-service-123'),
        init: jest.fn().mockRejectedValue(new Error('Init failed')),
        destroy: jest.fn().mockResolvedValue(undefined)
      } as Service;
      
      layoutContext.registerService('errorService', errorService);
      
      // Spy on the logger's warn method instead of console.warn
      const loggerWarnSpy = jest.spyOn(layoutContext['logger'], 'warn').mockImplementation();
      
      await layoutContext.initializeServices();
      
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'LayoutContext - 1 services had initialization errors:',
        expect.arrayContaining([expect.objectContaining({
          name: 'errorService',
          error: expect.any(Error)
        })])
      );
      
      loggerWarnSpy.mockRestore();
    });

    it('should handle service destruction errors gracefully', async () => {
      const errorService = {
        getServiceId: jest.fn().mockReturnValue('error-service-456'),
        init: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn().mockRejectedValue(new Error('Destroy failed'))
      } as Service;
      
      layoutContext.registerService('errorService', errorService);
      
      // Spy on the logger's error method instead of console.error
      const loggerErrorSpy = jest.spyOn(layoutContext['logger'], 'error').mockImplementation();
      
      await layoutContext.destroyServices();
      
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'LayoutContext - Service \'errorService\' destruction failed:',
        expect.any(Error)
      );
      
      loggerErrorSpy.mockRestore();
    });
  });

  describe('Integration with LayoutContext Lifecycle', () => {
    it('should destroy services when LayoutContext is destroyed', async () => {
      layoutContext.registerService('test1', testService1);
      await layoutContext.initializeServices();
      
      const destroySpy = jest.spyOn(testService1, 'destroy');
      
      await layoutContext.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect(testService1.isInitialized()).toBe(false);
    });
    
    it('should clear service registry on destroy', async () => {
      layoutContext.registerService('test1', testService1);
      layoutContext.registerService('test2', testService2);
      
      expect(layoutContext.getServiceNames()).toHaveLength(2);
      
      await layoutContext.destroy();
      
      expect(layoutContext.getServiceNames()).toHaveLength(0);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with generic service retrieval', () => {
      layoutContext.registerService('test1', testService1);
      
      const service = layoutContext.getService<TestService>('test1');
      
      // These methods should be available due to type safety
      expect(typeof service.getName).toBe('function');
      expect(typeof service.isInitialized).toBe('function');
      expect(typeof service.getData).toBe('function');
      expect(typeof service.addData).toBe('function');
    });
  });

  describe('Service Functionality', () => {
    it('should allow service interaction after initialization', async () => {
      layoutContext.registerService('test1', testService1);
      await layoutContext.initializeServices();
      
      const service = layoutContext.getService<TestService>('test1');
      
      expect(service.getData()).toEqual(['item1', 'item2', 'item3']);
      
      service.addData('item4');
      expect(service.getData()).toEqual(['item1', 'item2', 'item3', 'item4']);
    });
    
    it('should prevent service interaction before initialization', () => {
      layoutContext.registerService('test1', testService1);
      
      const service = layoutContext.getService<TestService>('test1');
      
      expect(() => service.getData()).toThrow('TestService1 is not initialized');
      expect(() => service.addData('item')).toThrow('TestService1 is not initialized');
    });
  });
});