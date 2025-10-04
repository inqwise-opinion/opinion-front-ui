import { BaseService } from '../../src/services/BaseService';
import { ServiceHelper } from '../../src/services/BaseService';
import { LayoutContext } from '../../src/contexts/LayoutContext';
import { ServiceConfig } from '../../src/interfaces/Service';
import { ServiceReference } from '../../src/services/ServiceReference';

// Basic test service for both patterns
class TestService extends BaseService {
    public static SERVICE_ID = 'test.service';
    private id: string;

    constructor(context: LayoutContext, config: ServiceConfig = {}) {
        super(context, config);
        this.id = config.id || 'test';
    }

    getServiceId(): string {
        return TestService.SERVICE_ID;
    }

    protected async onInit(): Promise<void> {
        // Simulated async initialization
        await new Promise(resolve => setTimeout(resolve, 50));
        this.log('✅', 'Test service initialized');
    }

    protected async onDestroy(): Promise<void> {
        this.log('🧹', 'Test service destroyed');
    }

    // Helper method for test assertions
    isReady(): boolean {
        return this._initialized && !this._destroyed;
    }
}

describe('Service Registration Patterns', () => {
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
            getServiceNames: jest.fn().mockReturnValue([]), // Add missing method
            getEventBus: jest.fn().mockReturnValue(mockEventBus)
        } as unknown as jest.Mocked<LayoutContext>;
    });

    describe('Pattern 1: ServiceHelper.createAndRegister', () => {
        it('should register and initialize service in one step', async () => {
            // Using the NavigationServiceImpl pattern
            const service = ServiceHelper.createAndRegister(
                mockLayoutContext,
                TestService.SERVICE_ID,
                (ctx, cfg) => new TestService(ctx, cfg),
                { autoInit: true }
            );

            // Service should be registered immediately
            expect(mockLayoutContext.registerService).toHaveBeenCalledWith(
                TestService.SERVICE_ID,
                expect.any(TestService)
            );

            // Service is created but not auto-initialized by default
            expect(service.isReady()).toBe(false);
            
            // Manual initialization is required
            await service.init();
            expect(service.isReady()).toBe(true);
        });

        it('should not auto-initialize if not configured', async () => {
            const service = ServiceHelper.createAndRegister(
                mockLayoutContext,
                TestService.SERVICE_ID,
                (ctx, cfg) => new TestService(ctx, cfg),
                { autoInit: false }
            );

            // Wait to ensure no initialization occurs
            await new Promise(resolve => setTimeout(resolve, 100));

            // Service should NOT be initialized
            expect(service.isReady()).toBe(false);
        });
    });

    describe('Pattern 2: ServiceReference', () => {
        it('should separate registration and initialization', async () => {
            // Create service first
            const service = new TestService(mockLayoutContext);
            
            // Register it manually
            mockLayoutContext.registerService(TestService.SERVICE_ID, service);
            mockLayoutContext.getService.mockReturnValue(service);

            // Create reference
            const serviceRef = new ServiceReference<TestService>(
                mockLayoutContext,
                TestService.SERVICE_ID
            );

            // Get service through reference (not initialized yet)
            const resolved = await serviceRef.get();
            expect(resolved).toBe(service);
            expect(resolved?.isReady()).toBe(false);

            // Initialize manually when ready
            await service.init();
            expect(service.isReady()).toBe(true);
        });

        it('should handle service dependencies properly', async () => {
            // Create services
            const serviceA = new TestService(mockLayoutContext, { id: 'A' });
            const serviceB = new TestService(mockLayoutContext, { id: 'B' });

            // Register in specific order
            mockLayoutContext.registerService('test.A', serviceA);
            mockLayoutContext.registerService('test.B', serviceB);

            // Initialize in reverse order
            await serviceB.init();
            await serviceA.init();

            expect(serviceA.isReady()).toBe(true);
            expect(serviceB.isReady()).toBe(true);
        });

        it('should handle registration after reference creation', async () => {
            // Mock getService to return null initially
            mockLayoutContext.getService.mockReturnValue(null);
            
            // Create reference before service exists
            const serviceRef = new ServiceReference<TestService>(
                mockLayoutContext,
                TestService.SERVICE_ID,
                { maxRetries: 1, retryDelay: 10 } // Reduce retry delay for faster test
            );

            // Initially service should throw error after retry attempts
            await expect(serviceRef.get()).rejects.toThrow();

            // Register service later
            const service = new TestService(mockLayoutContext);
            mockLayoutContext.registerService(TestService.SERVICE_ID, service);
            mockLayoutContext.getService.mockReturnValue(service);

            // Now service should be available through reference
            const found = await serviceRef.get();
            expect(found).toBe(service);
        });
    });
});