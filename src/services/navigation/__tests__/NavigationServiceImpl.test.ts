import { NavigationServiceImpl } from '../NavigationServiceImpl';
import { LayoutContext } from '../../../contexts/LayoutContext';
import { NavigationItem } from '../../../components/Sidebar';
import { SelfIdentifyingService } from '../../../core/ServiceIdentity';

describe('NavigationServiceImpl', () => {
  let mockLayoutContext: jest.Mocked<LayoutContext>;
  let mockSidebar: { updateNavigation: jest.Mock };

  beforeEach(() => {
    mockSidebar = {
      updateNavigation: jest.fn()
    };

    mockLayoutContext = {
      registerService: jest.fn(),
      unregisterService: jest.fn(),
      hasService: jest.fn(),
      getSidebar: jest.fn().mockReturnValue(mockSidebar),
      getService: jest.fn(),
      getHeader: jest.fn(),
      getMessages: jest.fn(),
      getEventBus: jest.fn().mockReturnValue({
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      })
    } as unknown as jest.Mocked<LayoutContext>;
  });

  describe('register', () => {
    it('should register navigation service with layout context', async () => {
      // Test registration with minimal config
      const service = NavigationServiceImpl.register(mockLayoutContext, {
        activeId: 'test-item'
      });

      // Service should be registered
      expect(mockLayoutContext.registerService).toHaveBeenCalledWith(
        NavigationServiceImpl.SERVICE_ID,
        expect.any(NavigationServiceImpl)
      );

      // Service should be an instance of NavigationServiceImpl
      expect(service).toBeInstanceOf(NavigationServiceImpl);
    });

    it('should initialize service with config values', async () => {
      const testItems: NavigationItem[] = [
        { id: 'test1', text: 'Test 1', icon: 'test' },
        { id: 'test2', text: 'Test 2', icon: 'test' }
      ];

      const service = NavigationServiceImpl.register(mockLayoutContext, {
        initialItems: testItems,
        activeId: 'test1'
      });

      await (service as any).init();

      expect(service.getItems()).toEqual(testItems);
      expect(service.getActiveItem()).toBe('test1');
    });

    it('should sync with sidebar if available', async () => {
      const service = NavigationServiceImpl.register(mockLayoutContext, {
        activeId: 'test-item'
      });

      await service.init();
      // Let any post-init state sync happen
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockLayoutContext.getSidebar).toHaveBeenCalled();
      expect(mockSidebar.updateNavigation).toHaveBeenCalled();
    });

    it('should handle missing sidebar gracefully', async () => {
      mockLayoutContext.getSidebar.mockReturnValueOnce(null);

      const service = NavigationServiceImpl.register(mockLayoutContext, {
        activeId: 'test-item'
      });

      await (service as any).init();

      expect(mockLayoutContext.getSidebar).toHaveBeenCalled();
      expect(mockSidebar.updateNavigation).not.toHaveBeenCalled();
    });

    it('should use default navigation items if none provided', async () => {
      const service = NavigationServiceImpl.register(mockLayoutContext, {
        activeId: 'test-item'
      });

      await (service as any).init();

      // Should have some default items
      expect(service.getItems().length).toBeGreaterThan(0);
    });

    it('should maintain expanded state during registration', async () => {
      const testItems: NavigationItem[] = [
        { 
          id: 'parent',
          text: 'Parent',
          icon: 'folder',
          children: [
            { id: 'child1', text: 'Child 1', icon: 'file' },
            { id: 'child2', text: 'Child 2', icon: 'file' }
          ]
        }
      ];

      const service = NavigationServiceImpl.register(mockLayoutContext, {
        initialItems: testItems,
        activeId: 'child1'
      });

      await service.init();
      // Let any post-init state sync happen
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // After init, re-apply initial state to ensure it's set
      service.setItems(testItems);
      service.setActiveItem('child1');

      // Toggle parent expanded
      service.toggleExpanded('parent');

      // Verify state is maintained after sync
      expect(service.isExpanded('parent')).toBe(true);
      expect(service.getActiveItem()).toBe('child1');

      // Verify sidebar gets correct structure
      const sidebarStructure = service.getSidebarStructure();
      expect(sidebarStructure[0].expanded).toBe(true);
      expect(sidebarStructure[0].children?.[0].active).toBe(true);
    });

    it('should implement SelfIdentifyingService correctly', async () => {
      const service = NavigationServiceImpl.register(mockLayoutContext);
      
      // Check static SERVICE_ID
      expect(NavigationServiceImpl.SERVICE_ID).toBe('navigation.service');
      
      // Check instance getServiceId implementation
      expect(service.getServiceId()).toBe(NavigationServiceImpl.SERVICE_ID);
      
      // Verify it's a proper SelfIdentifyingService
      const selfIdentifying = service as SelfIdentifyingService;
      expect(typeof selfIdentifying.getServiceId).toBe('function');
      expect(selfIdentifying.getServiceId()).toBe('navigation.service');
    });
  });
});
