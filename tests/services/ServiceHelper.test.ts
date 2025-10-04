import { ServiceHelper } from '../../src/services/BaseService';
import { LayoutContext } from '../../src/contexts/LayoutContext';
import { Service, ServiceConfig } from '../../src/interfaces/Service';
import { BaseService } from '../../src/services/BaseService';

// Mock test service implementation
class TestService extends BaseService {
  private id: string;
  
  constructor(context: LayoutContext, config: ServiceConfig = {}) {
    super(context, config);
    this.id = config.id || 'test-service';
  }

  getServiceId(): string {
    return this.id;
  }

  protected async onInit(): Promise<void> {
    // Test initialization
  }

  protected async onDestroy(): Promise<void> {
    // Test cleanup
  }
}

describe('ServiceHelper', () => {
  let mockLayoutContext: jest.Mocked<LayoutContext>;
  let mockEventBus: { publish: jest.Mock; subscribe: jest.Mock };

  beforeEach(() => {
    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn()
    };

    mockLayoutContext = {
      registerService: jest.fn(),
      getService: jest.fn(),
      hasService: jest.fn(),
      getEventBus: jest.fn().mockReturnValue(mockEventBus)
    } as unknown as jest.Mocked<LayoutContext>;
  });

  describe('createAndRegister', () => {
    it('should create and register a service with layout context', () => {
      const factory = (ctx: LayoutContext, cfg?: ServiceConfig) => new TestService(ctx, cfg);
      const config = { id: 'test-1' };

      const service = ServiceHelper.createAndRegister(
        mockLayoutContext,
        'test.service',
        factory,
        config
      );

      // Service should be created with correct config
      expect(service).toBeInstanceOf(TestService);
      expect(service.getServiceId()).toBe('test-1');

      // Service should be registered
      expect(mockLayoutContext.registerService).toHaveBeenCalledWith(
        'test.service',
        expect.any(TestService)
      );
    });

    it('should handle service registration failure', () => {
      const factory = (ctx: LayoutContext, cfg?: ServiceConfig) => new TestService(ctx, cfg);
      mockLayoutContext.registerService.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      expect(() => {
        ServiceHelper.createAndRegister(
          mockLayoutContext,
          'test.service',
          factory
        );
      }).toThrow('Registration failed');
    });

    it('should pass configuration to factory function', () => {
      const factory = jest.fn((ctx: LayoutContext, cfg?: ServiceConfig) => new TestService(ctx, cfg));
      const config = {
        id: 'custom-service',
        autoInit: true,
        allowReplace: false
      };

      ServiceHelper.createAndRegister(
        mockLayoutContext,
        'test.service',
        factory,
        config
      );

      expect(factory).toHaveBeenCalledWith(mockLayoutContext, config);
    });

    it('should handle factory function failures', () => {
      const factory = () => {
        throw new Error('Factory failed');
      };

      expect(() => {
        ServiceHelper.createAndRegister(
          mockLayoutContext,
          'test.service',
          factory
        );
      }).toThrow('Factory failed');

      // Service should not be registered if factory fails
      expect(mockLayoutContext.registerService).not.toHaveBeenCalled();
    });

    it('should preserve factory return value', () => {
      const specialService = new TestService(mockLayoutContext, { id: 'special' });
      const factory = jest.fn().mockReturnValue(specialService);

      const result = ServiceHelper.createAndRegister(
        mockLayoutContext,
        'test.service',
        factory
      );

      expect(result).toBe(specialService);
    });

    it('should register service without initializing', () => {
      const service = new TestService(mockLayoutContext, { 
        id: 'test-reg'
      });
      
      const initSpy = jest.spyOn(service, 'init');
      const factory = jest.fn().mockReturnValue(service);

      ServiceHelper.createAndRegister(
        mockLayoutContext,
        'test.service',
        factory
      );

      expect(initSpy).not.toHaveBeenCalled();
      expect(mockLayoutContext.registerService).toHaveBeenCalledWith(
        'test.service',
        service
      );
    });
  });
});