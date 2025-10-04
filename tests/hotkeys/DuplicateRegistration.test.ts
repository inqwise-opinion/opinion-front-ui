/**
 * Test for reproducing duplicate provider registration warnings
 * 
 * This test specifically reproduces the issue where rapid calls to
 * updateLegacyProvidersInChain() cause the same providers to be
 * registered multiple times, triggering "already registered, replacing" warnings.
 */

import { ChainHotkeyManagerImpl } from '../../src/hotkeys/ChainHotkeyManagerImpl';
import { LegacyHotkeyAdapter, HotkeyHandler } from '../../src/hotkeys/LegacyHotkeyAdapter';

// Mock console to capture structured logs that contain warnings
const mockConsoleLog = jest.fn();
const originalLog = console.log;

describe('Duplicate Provider Registration', () => {
  let chainManager: ChainHotkeyManagerImpl;
  let legacyAdapter: LegacyHotkeyAdapter;

  beforeEach(() => {
    chainManager = new ChainHotkeyManagerImpl();
    legacyAdapter = new LegacyHotkeyAdapter();
    
    // Mock document to avoid DOM dependencies
    const mockDocument = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    (global as any).document = mockDocument;
    
    // Replace console.log to capture structured warnings
    console.log = mockConsoleLog;
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    chainManager.destroy?.();
    legacyAdapter.destroy();
    console.log = originalLog;
  });

  test('should reproduce duplicate registration warning with legacy adapter', () => {
    // Create a legacy hotkey handler
    const legacyHandler: HotkeyHandler = {
      key: 'Escape',
      component: 'TestComponent',
      handler: (event: KeyboardEvent) => {
        console.log('Test handler executed');
      },
      description: 'Test escape handler',
      context: 'global'
    };

    // Register the legacy hotkey
    legacyAdapter.registerHotkey(legacyHandler);

    // Get all providers from the adapter
    const providers = legacyAdapter.getAllProviders();
    
    // Simulate multiple rapid calls to register the same providers
    // This mimics what happens in updateLegacyProvidersInChain()
    const unregisterFunctions: Array<() => void> = [];

    // First registration
    providers.forEach(provider => {
      const unregister = chainManager.registerProvider(provider);
      unregisterFunctions.push(unregister);
    });

    // Second registration without unregistering first (simulating race condition)
    providers.forEach(provider => {
      const unregister = chainManager.registerProvider(provider);
      unregisterFunctions.push(unregister);
    });

    // Check if warning was logged through structured logging
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("already registered, replacing")
    );

    // Clean up
    unregisterFunctions.forEach(unregister => unregister());
  });

  test('should reproduce rapid updateLegacyProvidersInChain scenario', () => {
    // This simulates the exact scenario from LayoutContextImpl
    class MockLayoutContext {
      private legacyAdapter = new LegacyHotkeyAdapter();
      private chainHotkeyManager = new ChainHotkeyManagerImpl();
      private legacyProviderUnsubscribers: Array<() => void> = [];

      registerHotkey(hotkey: HotkeyHandler): () => void {
        // Use legacy adapter to register with chain system
        const unregister = this.legacyAdapter.registerHotkey(hotkey);
        
        // Update legacy providers in chain manager (first call)
        this.updateLegacyProvidersInChain();
        
        // Return composite unregister function
        return () => {
          unregister();
          // Update legacy providers in chain manager (second call)
          this.updateLegacyProvidersInChain();
        };
      }

      private updateLegacyProvidersInChain(): void {
        // Simulate race condition - sometimes skip unregistration
        // to reproduce duplicate registration scenario
        const shouldSkipUnregister = this.legacyProviderUnsubscribers.length > 0;
        
        if (!shouldSkipUnregister) {
          // Normal case: Unregister existing legacy providers
          this.legacyProviderUnsubscribers.forEach(unregister => {
            try {
              unregister();
            } catch (error) {
              console.error('Error unregistering legacy provider:', error);
            }
          });
          this.legacyProviderUnsubscribers = [];
        }
        
        // Register current legacy providers (will cause duplicates if we skipped unregister)
        const legacyProviders = this.legacyAdapter.getAllProviders();
        for (const provider of legacyProviders) {
          const unregister = this.chainHotkeyManager.registerProvider(provider);
          this.legacyProviderUnsubscribers.push(unregister);
        }
      }

      destroy(): void {
        this.legacyProviderUnsubscribers.forEach(unregister => unregister());
        this.chainHotkeyManager.destroy?.();
        this.legacyAdapter.destroy();
      }
    }

    const mockLayoutContext = new MockLayoutContext();

    // Create multiple legacy hotkeys rapidly
    const hotkey1: HotkeyHandler = {
      key: 'Escape',
      component: 'Component1',
      handler: () => {},
      description: 'Test 1'
    };

    const hotkey2: HotkeyHandler = {
      key: 'Enter',
      component: 'Component1', // Same component
      handler: () => {},
      description: 'Test 2'
    };

    // Register hotkeys rapidly - this should trigger duplicate registration warnings
    const unregister1 = mockLayoutContext.registerHotkey(hotkey1);
    const unregister2 = mockLayoutContext.registerHotkey(hotkey2);

    // Check if warning was logged through structured logging
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("already registered, replacing")
    );

    // Clean up
    unregister1();
    unregister2();
    mockLayoutContext.destroy();
  });

  test('should reproduce timing-based duplicate registration', async () => {
    // This test simulates timing issues where unregister/register calls overlap
    const legacyHandler: HotkeyHandler = {
      key: 'Escape',
      component: 'TimingTestComponent',
      handler: () => {},
      description: 'Timing test handler'
    };

    legacyAdapter.registerHotkey(legacyHandler);
    const providers = legacyAdapter.getAllProviders();

    // Simulate rapid fire registration/unregistration with microtasks
    // This can happen when multiple updateLegacyProvidersInChain() calls
    // are queued in the same event loop tick

    const registrationPromises = [];

    for (let i = 0; i < 5; i++) {
      registrationPromises.push(
        Promise.resolve().then(() => {
          // Each microtask tries to register the same provider
          providers.forEach(provider => {
            chainManager.registerProvider(provider);
          });
        })
      );
    }

    await Promise.all(registrationPromises);

    // Should have generated multiple warnings through structured logging
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("already registered, replacing")
    );

    // The call count should be >= 4 (first registration doesn't warn, subsequent ones do)
    const warnCalls = mockConsoleLog.mock.calls.filter(call => 
      call[0] && call[0].includes("already registered, replacing")
    );
    expect(warnCalls.length).toBeGreaterThanOrEqual(4);
  });
});