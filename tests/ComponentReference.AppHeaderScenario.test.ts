/**
 * Targeted Test for AppHeaderBinderService ComponentReference Scenario
 * 
 * This test specifically reproduces the timing issue we've been seeing with
 * AppHeaderBinderService and its ComponentReference to AppHeader.
 */

import { ComponentReference } from '../src/components/ComponentReference';
import type { LayoutContext } from '../src/contexts/LayoutContext';

interface MockAppHeader {
  updateUser(user: { username: string; email?: string }): void;
  updateBrand(title: string, href?: string): void;
  destroy(): void;
}

class MockAppHeaderImpl implements MockAppHeader {
  constructor(public readonly id: string) {}
  
  updateUser(user: { username: string; email?: string }): void {
    console.log(`[${this.id}] Updating user: ${user.username}`);
  }
  
  updateBrand(title: string, href?: string): void {
    console.log(`[${this.id}] Updating brand: ${title} -> ${href}`);
  }
  
  destroy(): void {
    console.log(`[${this.id}] AppHeader destroyed`);
  }
}

// Simplified LayoutContext mock focused on the header registration scenario
const createLayoutContextMock = () => {
  let registeredHeader: MockAppHeader | null = null;
  
  const context = {
    registerHeader: (header: MockAppHeader) => {
      registeredHeader = header;
      console.log(`🎯 LayoutContext - Header registered: ${(header as any).id}`);
    },
    
    getHeader: () => {
      console.log(`🔍 LayoutContext - getHeader() called, returning:`, registeredHeader ? (registeredHeader as any).id : 'null');
      return registeredHeader;
    },
    
    // Test helper
    _simulateHeaderRegistration: (delay: number = 0) => {
      const header = new MockAppHeaderImpl('mock-header');
      setTimeout(() => {
        context.registerHeader(header);
      }, delay);
      return header;
    }
  } as LayoutContext & { _simulateHeaderRegistration: (delay?: number) => MockAppHeader };
  
  return context;
};

describe('ComponentReference AppHeader Scenario', () => {
  beforeEach(() => {
    // Clear console spies but allow logging for debugging
    jest.clearAllMocks();
  });

  test('should handle immediate header availability (no timing issue)', async () => {
    const layoutContext = createLayoutContextMock();
    
    // Register header immediately (no timing issue)
    const expectedHeader = layoutContext._simulateHeaderRegistration(0);
    
    // Create ComponentReference that resolves via LayoutContext.getHeader()
    const headerRef = new ComponentReference<MockAppHeader>(
      layoutContext,
      'AppHeader',
      () => layoutContext.getHeader(),
      { 
        enableLogging: true,
        retryInterval: 50,
        maxRetries: 10
      }
    );

    const header = await headerRef.get();
    
    expect(header).toBe(expectedHeader);
    expect(headerRef.isAvailable()).toBe(true);
  });

  test('should handle delayed header registration (timing issue scenario)', async () => {
    const layoutContext = createLayoutContextMock();
    
    // Create ComponentReference first (before header is registered)
    const headerRef = new ComponentReference<MockAppHeader>(
      layoutContext,
      'AppHeader', 
      () => layoutContext.getHeader(),
      { 
        enableLogging: true,
        retryInterval: 50,
        maxRetries: 20,
        timeout: 3000
      }
    );

    console.log('🚀 Starting header resolution...');
    
    // Start resolution (will retry while header is null)
    const headerPromise = headerRef.get();
    
    // Simulate header registration after some initialization delay (realistic scenario)
    console.log('⏱️  Scheduling header registration in 200ms...');
    const expectedHeader = layoutContext._simulateHeaderRegistration(200);
    
    const startTime = Date.now();
    const header = await headerPromise;
    const endTime = Date.now();
    
    console.log(`✅ Resolution completed in ${endTime - startTime}ms`);
    
    expect(header).toBe(expectedHeader);
    expect(headerRef.isAvailable()).toBe(true);
    expect(endTime - startTime).toBeGreaterThanOrEqual(190); // Should wait for registration
    expect(endTime - startTime).toBeLessThan(500); // But not too long
  });

  test('should handle very long delays (near timeout)', async () => {
    const layoutContext = createLayoutContextMock();
    
    const headerRef = new ComponentReference<MockAppHeader>(
      layoutContext,
      'AppHeader',
      () => layoutContext.getHeader(),
      { 
        enableLogging: true,
        retryInterval: 100,
        maxRetries: 50,
        timeout: 1500 // 1.5 second timeout
      }
    );

    // Start resolution
    const headerPromise = headerRef.get();
    
    // Register header just before timeout
    const expectedHeader = layoutContext._simulateHeaderRegistration(1000); // 1 second delay
    
    const startTime = Date.now();
    const header = await headerPromise;
    const endTime = Date.now();
    
    expect(header).toBe(expectedHeader);
    expect(headerRef.isAvailable()).toBe(true);
    expect(endTime - startTime).toBeGreaterThanOrEqual(950);
  });

  test('should timeout if header is never registered', async () => {
    const layoutContext = createLayoutContextMock();
    
    const headerRef = new ComponentReference<MockAppHeader>(
      layoutContext,
      'AppHeader',
      () => layoutContext.getHeader(),
      { 
        enableLogging: true,
        retryInterval: 50,
        maxRetries: 10,
        timeout: 300 // Short timeout
      }
    );

    // Don't register any header - should timeout
    const startTime = Date.now();
    const header = await headerRef.get();
    const endTime = Date.now();
    
    expect(header).toBeNull();
    expect(headerRef.isAvailable()).toBe(false);
    expect(endTime - startTime).toBeGreaterThanOrEqual(250); // Should timeout around 300ms
    expect(endTime - startTime).toBeLessThan(500); // But not too much longer
  });

  test('should handle race condition with multiple services accessing header', async () => {
    const layoutContext = createLayoutContextMock();
    
    // Create multiple ComponentReferences (simulating different services)
    const headerRef1 = new ComponentReference<MockAppHeader>(
      layoutContext,
      'AppHeader-Service1',
      () => layoutContext.getHeader(),
      { 
        enableLogging: true,
        retryInterval: 25,
        maxRetries: 20
      }
    );
    
    const headerRef2 = new ComponentReference<MockAppHeader>(
      layoutContext,
      'AppHeader-Service2', 
      () => layoutContext.getHeader(),
      { 
        enableLogging: true,
        retryInterval: 35,
        maxRetries: 20
      }
    );

    // Start multiple concurrent resolutions
    console.log('🏁 Starting race condition test...');
    const promise1 = headerRef1.get();
    const promise2 = headerRef2.get();
    
    // Register header during resolution
    const expectedHeader = layoutContext._simulateHeaderRegistration(150);
    
    const [header1, header2] = await Promise.all([promise1, promise2]);
    
    // Both should get the same header
    expect(header1).toBe(expectedHeader);
    expect(header2).toBe(expectedHeader);
    expect(headerRef1.isAvailable()).toBe(true);
    expect(headerRef2.isAvailable()).toBe(true);
  });

  test('should demonstrate realistic AppHeaderBinderService initialization sequence', async () => {
    const layoutContext = createLayoutContextMock();
    
    // Simulate the exact scenario from AppHeaderBinderService
    const appHeaderRef = new ComponentReference<MockAppHeader>(
      layoutContext,
      'AppHeader',
      () => layoutContext.getHeader(),
      {
        enableLogging: true,
        retryInterval: 100,
        maxRetries: 50
      }
    );

    console.log('🔐 Simulating AppHeaderBinderService.init() sequence...');
    
    // Simulate AppHeaderBinderService.init() calling updateAppHeader()
    const updateAppHeaderSimulation = async () => {
      console.log('📝 AppHeaderBinderService - updateAppHeader() called');
      const header = await appHeaderRef.get();
      if (header) {
        console.log('✅ AppHeaderBinderService - Header available, updating UI');
        header.updateUser({ username: 'testuser', email: 'test@example.com' });
        return true;
      } else {
        console.log('⚠️ AppHeaderBinderService - Header not available, skipping UI update');
        return false;
      }
    };

    // Start the binder service initialization
    const binderPromise = updateAppHeaderSimulation();
    
    // Simulate Layout.init() completing and AppHeaderImpl registering itself
    console.log('🏗️ Simulating Layout.init() -> AppHeaderImpl.init() -> registerHeader()');
    setTimeout(() => {
      layoutContext._simulateHeaderRegistration();
    }, 300); // Realistic initialization delay
    
    const binderResult = await binderPromise;
    
    expect(binderResult).toBe(true);
    expect(appHeaderRef.isAvailable()).toBe(true);
    
    console.log('🎉 AppHeaderBinderService simulation completed successfully');
  });
});