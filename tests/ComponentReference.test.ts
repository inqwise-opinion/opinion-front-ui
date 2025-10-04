/**
 * Unit Tests for ComponentReference
 * 
 * Tests lazy component resolution, caching, retry logic, and error handling.
 * This test suite helps ensure the ComponentReference class works correctly
 * and can help debug the timing issues we've been seeing with AppHeaderBinderService.
 */

import { ComponentReference } from '../src/components/ComponentReference';
import type { ComponentReferenceConfig } from '../src/components/ComponentReference';
import type { LayoutContext } from '../src/contexts/LayoutContext';

// Mock component interface for testing
interface MockComponent {
  id: string;
  name: string;
  initialize(): void;
  destroy(): void;
}

// Mock component implementation
class MockComponentImpl implements MockComponent {
  constructor(public id: string, public name: string) {}
  
  initialize(): void {
    console.log(`MockComponent ${this.id} initialized`);
  }
  
  destroy(): void {
    console.log(`MockComponent ${this.id} destroyed`);
  }
}

// Mock LayoutContext for testing
const createMockLayoutContext = (): LayoutContext => {
  const mockComponents: { [key: string]: MockComponent } = {};
  
  return {
    // Component registration methods
    registerHeader: jest.fn(),
    registerFooter: jest.fn(),
    registerMainContent: jest.fn(),
    registerMessages: jest.fn(),
    registerSidebar: jest.fn(),
    
    // Component retrieval methods
    getHeader: jest.fn(() => mockComponents['header'] || null),
    getFooter: jest.fn(() => mockComponents['footer'] || null),
    getMainContent: jest.fn(() => mockComponents['main'] || null),
    getMessagesComponent: jest.fn(() => mockComponents['messages'] || null),
    getSidebar: jest.fn(() => mockComponents['sidebar'] || null),
    getRegisteredComponents: jest.fn(() => ({
      header: mockComponents['header'] || null,
      footer: mockComponents['footer'] || null,
      mainContent: mockComponents['main'] || null,
      messages: mockComponents['messages'] || null,
      sidebar: mockComponents['sidebar'] || null,
    })),
    areAllComponentsRegistered: jest.fn(() => false),
    unregisterAllComponents: jest.fn(),
    
    // Test helper to register mock components
    _registerMockComponent: (key: string, component: MockComponent) => {
      mockComponents[key] = component;
    },
    
    // Test helper to clear mock components
    _clearMockComponents: () => {
      Object.keys(mockComponents).forEach(key => delete mockComponents[key]);
    },
    
    // Other required LayoutContext methods (minimal mocks)
    subscribe: jest.fn(),
    emit: jest.fn(),
    getEventBus: jest.fn(),
    publish: jest.fn(),
    send: jest.fn(),
    request: jest.fn(),
    consume: jest.fn(),
    getViewport: jest.fn(() => ({ width: 1280, height: 720 })),
    markReady: jest.fn(),
    isReady: jest.fn(() => true),
    toggleMobileSidebar: jest.fn(),
    registerHotkey: jest.fn(),
    unregisterHotkey: jest.fn(),
    unregisterAllHotkeys: jest.fn(),
    getRegisteredHotkeys: jest.fn(() => []),
    setActiveHotkeyProvider: jest.fn(),
    removeActiveHotkeyProvider: jest.fn(),
    getActiveHotkeyProvider: jest.fn(() => null),
    setActivePage: jest.fn(),
    getActivePage: jest.fn(() => null),
    clearActivePage: jest.fn(),
    isLayoutMobile: jest.fn(() => false),
    isLayoutTablet: jest.fn(() => false),
    isLayoutDesktop: jest.fn(() => true),
    getModeType: jest.fn(() => 'desktop' as const),
    getMessages: jest.fn(() => null),
    destroy: jest.fn(),
    registerService: jest.fn(),
    getService: jest.fn(),
    hasService: jest.fn(),
    getServiceNames: jest.fn(() => []),
    getServiceReference: jest.fn()
  } as any;
};

describe('ComponentReference', () => {
  let mockContext: LayoutContext;
  let consoleSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockContext = createMockLayoutContext();
    
    // Mock console methods to capture logging
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clear any registered components
    (mockContext as any)._clearMockComponents();
    
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('Constructor and Basic Properties', () => {
    test('should create ComponentReference with default config', () => {
      const resolver = () => null;
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'TestComponent',
        resolver
      );

      expect(componentRef.getComponentName()).toBe('TestComponent');
      expect(componentRef.isAvailable()).toBe(false);
      expect(componentRef.getCached()).toBeNull();
    });

    test('should create ComponentReference with custom config', () => {
      const config: ComponentReferenceConfig = {
        enableLogging: true,
        retryInterval: 50,
        maxRetries: 5,
        timeout: 1000
      };

      const resolver = () => null;
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'TestComponent',
        resolver,
        config
      );

      expect(componentRef.getComponentName()).toBe('TestComponent');
      
      // Check that logging was enabled (constructor logs with enableLogging: true)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ComponentReference[TestComponent]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Created with config')
      );
    });

    test('should use default config values when partial config provided', () => {
      const config: ComponentReferenceConfig = {
        enableLogging: true,
        maxRetries: 10
      };

      const resolver = () => null;
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'TestComponent',
        resolver,
        config
      );

      // Check that defaults were merged (constructor logs with enableLogging: true)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ComponentReference[TestComponent]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Created with config')
      );
    });
  });

  describe('Immediate Resolution (Component Already Available)', () => {
    test('should resolve component immediately when available', async () => {
      const mockComponent = new MockComponentImpl('test-1', 'Test Component');
      const resolver = jest.fn(() => mockComponent);
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'TestComponent',
        resolver,
        { enableLogging: true }
      );

      const result = await componentRef.get();

      expect(result).toBe(mockComponent);
      expect(resolver).toHaveBeenCalledTimes(1);
      expect(componentRef.isAvailable()).toBe(true);
      expect(componentRef.getCached()).toBe(mockComponent);
      
      // Should log successful resolution
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ComponentReference[TestComponent]')
      );
    });

    test('should return cached component on subsequent calls', async () => {
      const mockComponent = new MockComponentImpl('test-2', 'Test Component');
      const resolver = jest.fn(() => mockComponent);
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'TestComponent',
        resolver
      );

      // First call
      const result1 = await componentRef.get();
      expect(result1).toBe(mockComponent);
      expect(resolver).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await componentRef.get();
      expect(result2).toBe(mockComponent);
      expect(resolver).toHaveBeenCalledTimes(1); // Should not call resolver again
    });

    test('should handle multiple concurrent calls correctly', async () => {
      const mockComponent = new MockComponentImpl('test-3', 'Test Component');
      const resolver = jest.fn(() => mockComponent);
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'TestComponent',
        resolver
      );

      // Start multiple concurrent resolutions
      const promises = [
        componentRef.get(),
        componentRef.get(),
        componentRef.get()
      ];

      const results = await Promise.all(promises);

      // All should return the same component
      expect(results[0]).toBe(mockComponent);
      expect(results[1]).toBe(mockComponent);
      expect(results[2]).toBe(mockComponent);
      
      // Resolver should only be called once
      expect(resolver).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delayed Resolution (Component Not Initially Available)', () => {
    test('should retry until component becomes available', async () => {
      const mockComponent = new MockComponentImpl('test-4', 'Delayed Component');
      let callCount = 0;
      const resolver = jest.fn(() => {
        callCount++;
        // Return component on 3rd attempt
        return callCount >= 3 ? mockComponent : null;
      });
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'DelayedComponent',
        resolver,
        { 
          enableLogging: true,
          retryInterval: 10, // Fast retry for testing
          maxRetries: 10 
        }
      );

      const startTime = Date.now();
      const result = await componentRef.get();
      const endTime = Date.now();

      expect(result).toBe(mockComponent);
      expect(resolver).toHaveBeenCalledTimes(3);
      expect(componentRef.isAvailable()).toBe(true);
      
      // Should have taken at least 2 retry intervals (2 * 10ms = 20ms)
      expect(endTime - startTime).toBeGreaterThanOrEqual(15);
      
      // Should log successful resolution on attempt 3
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ComponentReference[DelayedComponent]')
      );
    });

    test('should return null if component never becomes available', async () => {
      const resolver = jest.fn(() => null); // Always returns null
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'UnavailableComponent',
        resolver,
        { 
          enableLogging: true,
          retryInterval: 5, // Very fast retry for testing
          maxRetries: 3 
        }
      );

      const result = await componentRef.get();

      expect(result).toBeNull();
      expect(resolver).toHaveBeenCalledTimes(3);
      expect(componentRef.isAvailable()).toBe(false);
      expect(componentRef.getCached()).toBeNull();
      
      // Should log failure
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/WARN\s+\[ComponentReference\[UnavailableComponent\]\].*Failed to resolve after 3 attempts/)
      );
    });

    test('should respect timeout configuration', async () => {
      const resolver = jest.fn(() => null); // Always returns null
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'TimeoutComponent',
        resolver,
        { 
          enableLogging: true,
          retryInterval: 50,
          maxRetries: 100, // High retry count
          timeout: 100     // But low timeout
        }
      );

      const startTime = Date.now();
      const result = await componentRef.get();
      const endTime = Date.now();

      expect(result).toBeNull();
      
      // Should timeout around 100ms, not wait for all 100 retries
      expect(endTime - startTime).toBeLessThan(200);
      
      // Should log timeout
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/WARN\s+\[ComponentReference\[TimeoutComponent\]\].*Resolution timed out after 100ms/)
      );
    });

    test('should simulate realistic LayoutContext component registration timing', async () => {
      // Simulate a component being registered after some delay
      const mockComponent = new MockComponentImpl('layout-test', 'Layout Component');
      
      // Start with no component registered
      const resolver = jest.fn(() => (mockContext as any).getHeader());
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'LayoutComponent',
        resolver,
        { 
          enableLogging: true,
          retryInterval: 20,
          maxRetries: 10
        }
      );

      // Start resolution
      const resolutionPromise = componentRef.get();
      
      // Simulate component registration after 60ms (3 retry attempts)
      setTimeout(() => {
        (mockContext as any)._registerMockComponent('header', mockComponent);
      }, 60);

      const result = await resolutionPromise;

      expect(result).toBe(mockComponent);
      expect(componentRef.isAvailable()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle resolver exceptions gracefully', async () => {
      const resolver = jest.fn(() => {
        throw new Error('Resolver error');
      });
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'ErrorComponent',
        resolver,
        { 
          enableLogging: true,
          retryInterval: 5,
          maxRetries: 2 
        }
      );

      const result = await componentRef.get();

      expect(result).toBeNull();
      expect(resolver).toHaveBeenCalledTimes(2);
      
      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR \[ComponentReference\[ErrorComponent\]\].*Error during resolution/)
      );
    });

    test('should handle resolver throwing on some attempts but succeeding later', async () => {
      const mockComponent = new MockComponentImpl('recovery-test', 'Recovery Component');
      let callCount = 0;
      const resolver = jest.fn(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error(`Attempt ${callCount} failed`);
        }
        return mockComponent;
      });
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'RecoveryComponent',
        resolver,
        { 
          enableLogging: true,
          retryInterval: 5,
          maxRetries: 5 
        }
      );

      const result = await componentRef.get();

      expect(result).toBe(mockComponent);
      expect(resolver).toHaveBeenCalledTimes(3);
      expect(componentRef.isAvailable()).toBe(true);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache correctly', async () => {
      const mockComponent1 = new MockComponentImpl('cache-1', 'Component 1');
      const mockComponent2 = new MockComponentImpl('cache-2', 'Component 2');
      
      let useSecondComponent = false;
      const resolver = jest.fn(() => useSecondComponent ? mockComponent2 : mockComponent1);
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'CacheComponent',
        resolver,
        { enableLogging: true }
      );

      // First resolution
      const result1 = await componentRef.get();
      expect(result1).toBe(mockComponent1);
      expect(componentRef.isAvailable()).toBe(true);

      // Clear cache
      componentRef.clearCache();
      expect(componentRef.isAvailable()).toBe(false);
      expect(componentRef.getCached()).toBeNull();
      
      // Should log cache clear
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG \[ComponentReference\[CacheComponent\]\].*Cache cleared/)
      );

      // Change resolver behavior and resolve again
      useSecondComponent = true;
      const result2 = await componentRef.get();
      expect(result2).toBe(mockComponent2);
    });

    test('should handle clearCache when no component is cached', () => {
      const resolver = () => null;
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'EmptyCache',
        resolver,
        { enableLogging: true }
      );

      // Clear cache when nothing is cached
      componentRef.clearCache();
      
      expect(componentRef.isAvailable()).toBe(false);
      expect(componentRef.getCached()).toBeNull();
    });
  });

  describe('Configuration Validation', () => {
    test('should handle zero retries configuration', async () => {
      const resolver = jest.fn(() => null);
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'ZeroRetries',
        resolver,
        { 
          enableLogging: true,
          maxRetries: 0 
        }
      );

      const result = await componentRef.get();

      expect(result).toBeNull();
      expect(resolver).not.toHaveBeenCalled(); // Should not even try since maxRetries is 0
      
      // Should still log failure since no attempts were made
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/WARN\s+\[ComponentReference\[ZeroRetries\]\].*Failed to resolve after 0 attempts/)
      );
    });

    test('should handle very short retry interval', async () => {
      const mockComponent = new MockComponentImpl('fast-retry', 'Fast Component');
      let callCount = 0;
      const resolver = jest.fn(() => {
        callCount++;
        return callCount >= 2 ? mockComponent : null;
      });
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'FastRetry',
        resolver,
        { 
          retryInterval: 1,
          maxRetries: 5 
        }
      );

      const startTime = Date.now();
      const result = await componentRef.get();
      const endTime = Date.now();

      expect(result).toBe(mockComponent);
      expect(resolver).toHaveBeenCalledTimes(2);
      
      // Should be very fast
      expect(endTime - startTime).toBeLessThan(50);
    });

    test('should handle very long timeout', async () => {
      const resolver = jest.fn(() => null);
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'LongTimeout',
        resolver,
        { 
          retryInterval: 10,
          maxRetries: 2,
          timeout: 10000 // Very long timeout
        }
      );

      const startTime = Date.now();
      const result = await componentRef.get();
      const endTime = Date.now();

      expect(result).toBeNull();
      expect(resolver).toHaveBeenCalledTimes(2);
      
      // Should be limited by maxRetries, not timeout
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Real-world Scenarios', () => {
    test('should work with AppHeader-like scenario', async () => {
      // Simulate the actual AppHeader scenario from AppHeaderBinderService
      interface MockAppHeader {
        updateUser(user: { username: string; email?: string }): void;
        updateBrand(title: string, href?: string): void;
        destroy(): void;
      }
      
      class MockAppHeaderImpl implements MockAppHeader {
        updateUser(user: { username: string; email?: string }): void {
          console.log(`Updating user: ${user.username}`);
        }
        
        updateBrand(title: string, href?: string): void {
          console.log(`Updating brand: ${title}`);
        }
        
        destroy(): void {
          console.log('AppHeader destroyed');
        }
      }

      // Create mock header that will be "registered" later
      const mockHeader = new MockAppHeaderImpl();
      
      // Resolver that uses LayoutContext.getHeader()
      const resolver = () => (mockContext as any).getHeader() as MockAppHeader | null;
      
      const headerRef = new ComponentReference<MockAppHeader>(
        mockContext,
        'AppHeader',
        resolver,
        {
          enableLogging: true,
          retryInterval: 100,
          maxRetries: 50
        }
      );

      // Start getting header (should retry while null)
      const headerPromise = headerRef.get();
      
      // Simulate AppHeaderImpl registering itself after initialization delay
      setTimeout(() => {
        (mockContext as any)._registerMockComponent('header', mockHeader);
      }, 150); // Simulate realistic initialization delay

      const header = await headerPromise;

      expect(header).toBe(mockHeader);
      expect(headerRef.isAvailable()).toBe(true);
      
      // Test that we can use the header
      header?.updateUser({ username: 'testuser', email: 'test@example.com' });
      header?.updateBrand('Test App', '/dashboard');
    });

    test('should handle service initialization race conditions', async () => {
      // Simulate the race condition between Layout.init() and AppHeaderBinderService.init()
      const mockComponent = new MockComponentImpl('race-test', 'Race Component');
      const resolver = jest.fn(() => (mockContext as any).getHeader());
      
      const componentRef = new ComponentReference<MockComponent>(
        mockContext,
        'RaceComponent',
        resolver,
        {
          enableLogging: true,
          retryInterval: 50,
          maxRetries: 20,
          timeout: 2000
        }
      );

      // Simulate multiple services trying to access the same component
      const service1Promise = componentRef.get();
      const service2Promise = componentRef.get();
      
      // Simulate component registration happening during resolution
      setTimeout(() => {
        (mockContext as any)._registerMockComponent('header', mockComponent);
      }, 200);

      const [result1, result2] = await Promise.all([service1Promise, service2Promise]);

      expect(result1).toBe(mockComponent);
      expect(result2).toBe(mockComponent);
      expect(componentRef.isAvailable()).toBe(true);
      
      // Resolver should be called multiple times during retry process before success
      expect(resolver.mock.calls.length).toBeGreaterThanOrEqual(3); // At least a few retries
      expect(resolver.mock.calls.length).toBeLessThanOrEqual(10); // But not too many
    });
  });
});