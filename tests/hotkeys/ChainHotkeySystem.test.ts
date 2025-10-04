/**
 * Unit Tests for Chain-Based Hotkey System
 * 
 * Tests cover:
 * - Basic chain execution
 * - Priority ordering
 * - Dynamic enable/disable
 * - Chain control (next/break)
 * - Error handling
 * - Provider lifecycle
 */

import { 
  ChainHotkeyProvider, 
  ChainHotkeyHandler, 
  HotkeyExecutionContext,
  HotkeyChainAction 
} from '../../src/hotkeys/HotkeyChainSystem';
import { ChainHotkeyManagerImpl } from '../../src/hotkeys/ChainHotkeyManagerImpl';

// Mock providers for testing
class MockProvider implements ChainHotkeyProvider {
  private hotkeys = new Map<string, ChainHotkeyHandler>();
  private _enabled = true;
  private _priority: number;
  private _defaultBehavior: HotkeyChainAction;
  private _providerId: string;
  public onRegisteredCalled = false;
  public onUnregisteredCalled = false;

  constructor(
    providerId: string, 
    priority: number = 500, 
    defaultBehavior: HotkeyChainAction = 'next'
  ) {
    this._providerId = providerId;
    this._priority = priority;
    this._defaultBehavior = defaultBehavior;
  }

  getHotkeyProviderId(): string {
    return this._providerId;
  }

  getProviderPriority(): number {
    return this._priority;
  }

  getDefaultChainBehavior(): HotkeyChainAction {
    return this._defaultBehavior;
  }

  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    if (!this._enabled) return null;
    return this.hotkeys;
  }

  onChainRegistered(): void {
    this.onRegisteredCalled = true;
  }

  onChainUnregistered(): void {
    this.onUnregisteredCalled = true;
  }

  // Test helper methods
  addHotkey(
    key: string, 
    handler: (ctx: HotkeyExecutionContext) => void,
    enabled: boolean = true,
    description?: string
  ): void {
    const hotkeyHandler: ChainHotkeyHandler = {
      key,
      providerId: this._providerId,
      enabled,
      handler,
      description,
      priority: this._priority,
      enable: () => { hotkeyHandler.enabled = true; },
      disable: () => { hotkeyHandler.enabled = false; },
      isEnabled: () => hotkeyHandler.enabled
    };
    
    this.hotkeys.set(key, hotkeyHandler);
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  getHotkey(key: string): ChainHotkeyHandler | undefined {
    return this.hotkeys.get(key);
  }
}

// Test utilities
const createKeyboardEvent = (key: string, modifiers: { 
  ctrl?: boolean, 
  alt?: boolean, 
  shift?: boolean, 
  meta?: boolean 
} = {}): KeyboardEvent => {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrl || false,
    altKey: modifiers.alt || false,
    shiftKey: modifiers.shift || false,
    metaKey: modifiers.meta || false,
    bubbles: true,
    cancelable: true
  });
};

describe('ChainHotkeySystem', () => {
  let manager: ChainHotkeyManagerImpl;

  beforeEach(() => {
    manager = new ChainHotkeyManagerImpl();
    // Mock document to avoid DOM dependencies in tests
    const mockDocument = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    (global as any).document = mockDocument;
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Provider Registration', () => {
    test('should register provider successfully', () => {
      const provider = new MockProvider('TestProvider', 500);
      const unregister = manager.registerProvider(provider);

      expect(provider.onRegisteredCalled).toBe(true);
      expect(manager.getProviders()).toContain(provider);
      expect(typeof unregister).toBe('function');
    });

    test('should unregister provider successfully', () => {
      const provider = new MockProvider('TestProvider', 500);
      const unregister = manager.registerProvider(provider);

      unregister();

      expect(provider.onUnregisteredCalled).toBe(true);
      expect(manager.getProviders()).not.toContain(provider);
    });

    test('should replace provider with same ID', () => {
      const provider1 = new MockProvider('TestProvider', 500);
      const provider2 = new MockProvider('TestProvider', 600);

      manager.registerProvider(provider1);
      manager.registerProvider(provider2);

      const providers = manager.getProviders();
      expect(providers).toContain(provider2);
      expect(providers).not.toContain(provider1);
      expect(providers.length).toBe(1);
    });
  });

  describe('Chain Execution - Basic', () => {
    test('should execute single handler chain', async () => {
      const provider = new MockProvider('TestProvider', 500);
      const handler = jest.fn((ctx: HotkeyExecutionContext) => {
        ctx.break();
      });
      
      provider.addHotkey('Escape', handler);
      manager.registerProvider(provider);

      const event = createKeyboardEvent('Escape');
      const result = await manager.executeChain('Escape', event);

      expect(result.executed).toBe(true);
      expect(result.handlersExecuted).toBe(1);
      expect(result.totalHandlers).toBe(1);
      expect(result.finalAction).toBe('break');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('should not execute disabled handlers', async () => {
      const provider = new MockProvider('TestProvider', 500);
      const handler = jest.fn();
      
      provider.addHotkey('Escape', handler, false); // disabled
      manager.registerProvider(provider);

      const event = createKeyboardEvent('Escape');
      const result = await manager.executeChain('Escape', event);

      expect(result.executed).toBe(false);
      expect(result.handlersExecuted).toBe(0);
      expect(handler).not.toHaveBeenCalled();
    });

    test('should not execute when provider returns null hotkeys', async () => {
      const provider = new MockProvider('TestProvider', 500);
      provider.setEnabled(false); // This makes getChainHotkeys() return null
      
      const handler = jest.fn();
      provider.addHotkey('Escape', handler);
      manager.registerProvider(provider);

      const event = createKeyboardEvent('Escape');
      const result = await manager.executeChain('Escape', event);

      expect(result.executed).toBe(false);
      expect(result.handlersExecuted).toBe(0);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Chain Execution - Priority Ordering', () => {
    test('should execute handlers in priority order (highest first)', async () => {
      const executionOrder: string[] = [];
      
      const lowPriority = new MockProvider('Low', 100);
      const highPriority = new MockProvider('High', 1000);
      const mediumPriority = new MockProvider('Medium', 500);

      // Add handlers that track execution order
      lowPriority.addHotkey('Escape', (ctx) => {
        executionOrder.push('Low');
        ctx.next();
      });
      
      highPriority.addHotkey('Escape', (ctx) => {
        executionOrder.push('High');
        ctx.next();
      });
      
      mediumPriority.addHotkey('Escape', (ctx) => {
        executionOrder.push('Medium');
        ctx.break();
      });

      // Register in random order
      manager.registerProvider(lowPriority);
      manager.registerProvider(highPriority);
      manager.registerProvider(mediumPriority);

      const event = createKeyboardEvent('Escape');
      const result = await manager.executeChain('Escape', event);

      expect(executionOrder).toEqual(['High', 'Medium']); // Low shouldn't execute due to break
      expect(result.handlersExecuted).toBe(2);
      expect(result.finalAction).toBe('break');
    });

    test('should continue chain when handlers call next()', async () => {
      const executionOrder: string[] = [];
      
      const provider1 = new MockProvider('Provider1', 800);
      const provider2 = new MockProvider('Provider2', 600);
      const provider3 = new MockProvider('Provider3', 400);

      provider1.addHotkey('Escape', (ctx) => {
        executionOrder.push('Provider1');
        ctx.next(); // Continue to next
      });
      
      provider2.addHotkey('Escape', (ctx) => {
        executionOrder.push('Provider2');
        ctx.next(); // Continue to next
      });
      
      provider3.addHotkey('Escape', (ctx) => {
        executionOrder.push('Provider3');
        ctx.break(); // End chain
      });

      manager.registerProvider(provider1);
      manager.registerProvider(provider2);
      manager.registerProvider(provider3);

      const event = createKeyboardEvent('Escape');
      const result = await manager.executeChain('Escape', event);

      expect(executionOrder).toEqual(['Provider1', 'Provider2', 'Provider3']);
      expect(result.handlersExecuted).toBe(3);
      expect(result.finalAction).toBe('break');
    });

    test('should stop chain when handler calls break()', async () => {
      const executionOrder: string[] = [];
      
      const provider1 = new MockProvider('Provider1', 800);
      const provider2 = new MockProvider('Provider2', 600);
      const provider3 = new MockProvider('Provider3', 400);

      provider1.addHotkey('Escape', (ctx) => {
        executionOrder.push('Provider1');
        ctx.next();
      });
      
      provider2.addHotkey('Escape', (ctx) => {
        executionOrder.push('Provider2');
        ctx.break(); // Stop chain here
      });
      
      provider3.addHotkey('Escape', (ctx) => {
        executionOrder.push('Provider3'); // Should not execute
        ctx.break();
      });

      manager.registerProvider(provider1);
      manager.registerProvider(provider2);
      manager.registerProvider(provider3);

      const event = createKeyboardEvent('Escape');
      const result = await manager.executeChain('Escape', event);

      expect(executionOrder).toEqual(['Provider1', 'Provider2']);
      expect(result.handlersExecuted).toBe(2);
      expect(result.finalAction).toBe('break');
    });
  });

  describe('Execution Context', () => {
    test('should provide correct context information', async () => {
      let receivedContext: HotkeyExecutionContext | null = null;
      
      const provider = new MockProvider('TestProvider', 500);
      provider.addHotkey('Escape', (ctx) => {
        receivedContext = ctx;
        ctx.break();
      });

      manager.registerProvider(provider);

      const event = createKeyboardEvent('Escape');
      await manager.executeChain('Escape', event);

      expect(receivedContext).not.toBeNull();
      expect(receivedContext!.key).toBe('Escape');
      expect(receivedContext!.currentProvider).toBe('TestProvider');
      expect(receivedContext!.chainIndex).toBe(0);
      expect(receivedContext!.chainLength).toBe(1);
      expect(receivedContext!.event).toBe(event);
    });

    test('should provide correct chain information with multiple providers', async () => {
      const contexts: HotkeyExecutionContext[] = [];
      
      const provider1 = new MockProvider('Provider1', 800);
      const provider2 = new MockProvider('Provider2', 600);
      const provider3 = new MockProvider('Provider3', 400);

      provider1.addHotkey('Escape', (ctx) => {
        contexts.push(ctx);
        ctx.next();
      });
      
      provider2.addHotkey('Escape', (ctx) => {
        contexts.push(ctx);
        ctx.next();
      });
      
      provider3.addHotkey('Escape', (ctx) => {
        contexts.push(ctx);
        ctx.break();
      });

      manager.registerProvider(provider1);
      manager.registerProvider(provider2);
      manager.registerProvider(provider3);

      const event = createKeyboardEvent('Escape');
      await manager.executeChain('Escape', event);

      expect(contexts.length).toBe(3);
      
      // Check first handler context
      expect(contexts[0].currentProvider).toBe('Provider1');
      expect(contexts[0].chainIndex).toBe(0);
      expect(contexts[0].chainLength).toBe(3);
      expect(contexts[0].getProviderChain()).toEqual(['Provider1', 'Provider2', 'Provider3']);
      
      // Check second handler context
      expect(contexts[1].currentProvider).toBe('Provider2');
      expect(contexts[1].chainIndex).toBe(1);
      expect(contexts[1].chainLength).toBe(3);
      
      // Check third handler context
      expect(contexts[2].currentProvider).toBe('Provider3');
      expect(contexts[2].chainIndex).toBe(2);
      expect(contexts[2].chainLength).toBe(3);
    });

    test('should provide hasProvider() functionality', async () => {
      let testContext: HotkeyExecutionContext | null = null;
      
      const provider1 = new MockProvider('Provider1', 800);
      const provider2 = new MockProvider('Provider2', 600);
      const provider3 = new MockProvider('Provider3', 400);

      provider1.addHotkey('Escape', (ctx) => {
        testContext = ctx;
        ctx.break();
      });
      
      provider2.addHotkey('Escape', (ctx) => ctx.next());
      provider3.addHotkey('Escape', (ctx) => ctx.break());

      manager.registerProvider(provider1);
      manager.registerProvider(provider2);
      manager.registerProvider(provider3);

      const event = createKeyboardEvent('Escape');
      await manager.executeChain('Escape', event);

      expect(testContext).not.toBeNull();
      expect(testContext!.hasProvider('Provider1')).toBe(true);
      expect(testContext!.hasProvider('Provider2')).toBe(true);
      expect(testContext!.hasProvider('Provider3')).toBe(true);
      expect(testContext!.hasProvider('NonExistent')).toBe(false);
    });
  });

  describe('Event Handling', () => {
    test('should handle preventDefault correctly', async () => {
      const event = createKeyboardEvent('Escape');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      const provider = new MockProvider('TestProvider', 500);
      provider.addHotkey('Escape', (ctx) => {
        ctx.preventDefault();
        ctx.break();
      });

      manager.registerProvider(provider);
      const result = await manager.executeChain('Escape', event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(result.preventedDefault).toBe(true);
    });

    test('should handle stopPropagation correctly', async () => {
      const event = createKeyboardEvent('Escape');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
      
      const provider = new MockProvider('TestProvider', 500);
      provider.addHotkey('Escape', (ctx) => {
        ctx.stopPropagation();
        ctx.break();
      });

      manager.registerProvider(provider);
      const result = await manager.executeChain('Escape', event);

      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(result.stoppedPropagation).toBe(true);
    });

    test('should only call preventDefault once even if called multiple times', async () => {
      const event = createKeyboardEvent('Escape');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      const provider = new MockProvider('TestProvider', 500);
      provider.addHotkey('Escape', (ctx) => {
        ctx.preventDefault();
        ctx.preventDefault(); // Call twice
        ctx.break();
      });

      manager.registerProvider(provider);
      await manager.executeChain('Escape', event);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dynamic Enable/Disable', () => {
    test('should enable/disable individual hotkeys', async () => {
      const provider = new MockProvider('TestProvider', 500);
      const handler = jest.fn((ctx: HotkeyExecutionContext) => ctx.break());
      
      provider.addHotkey('Escape', handler, true); // Initially enabled
      manager.registerProvider(provider);

      // Test enabled state
      const event1 = createKeyboardEvent('Escape');
      const result1 = await manager.executeChain('Escape', event1);
      expect(result1.executed).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);

      // Disable hotkey
      const hotkeyHandler = provider.getHotkey('Escape')!;
      hotkeyHandler.disable();

      // Test disabled state
      const event2 = createKeyboardEvent('Escape');
      const result2 = await manager.executeChain('Escape', event2);
      expect(result2.executed).toBe(false);
      expect(handler).toHaveBeenCalledTimes(1); // No additional calls

      // Re-enable hotkey
      hotkeyHandler.enable();

      // Test re-enabled state
      const event3 = createKeyboardEvent('Escape');
      const result3 = await manager.executeChain('Escape', event3);
      expect(result3.executed).toBe(true);
      expect(handler).toHaveBeenCalledTimes(2); // One more call
    });

    test('should enable/disable all hotkeys for a provider', () => {
      const provider = new MockProvider('TestProvider', 500);
      provider.addHotkey('Escape', (ctx) => ctx.break(), true);
      provider.addHotkey('Enter', (ctx) => ctx.break(), true);
      
      manager.registerProvider(provider);

      // Initially enabled
      expect(provider.getHotkey('Escape')!.isEnabled()).toBe(true);
      expect(provider.getHotkey('Enter')!.isEnabled()).toBe(true);

      // Disable all
      manager.setProviderEnabled('TestProvider', false);
      expect(provider.getHotkey('Escape')!.isEnabled()).toBe(false);
      expect(provider.getHotkey('Enter')!.isEnabled()).toBe(false);

      // Re-enable all
      manager.setProviderEnabled('TestProvider', true);
      expect(provider.getHotkey('Escape')!.isEnabled()).toBe(true);
      expect(provider.getHotkey('Enter')!.isEnabled()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in handlers gracefully', async () => {
      const provider1 = new MockProvider('Provider1', 800);
      const provider2 = new MockProvider('Provider2', 600);

      let provider2Executed = false;

      provider1.addHotkey('Escape', (ctx) => {
        throw new Error('Test error');
      });
      
      provider2.addHotkey('Escape', (ctx) => {
        provider2Executed = true;
        ctx.break();
      });

      manager.registerProvider(provider1);
      manager.registerProvider(provider2);

      const event = createKeyboardEvent('Escape');
      const result = await manager.executeChain('Escape', event);

      // Chain should continue despite error
      expect(provider2Executed).toBe(true);
      expect(result.executed).toBe(true);
      expect(result.handlersExecuted).toBe(2); // Both handlers count as executed (one errored, one successful)
      expect(result.executionLog).toHaveLength(2);
      expect(result.executionLog[0].error).toBeDefined();
      expect(result.executionLog[1].error).toBeUndefined();
    });
  });

  describe('Key Normalization', () => {
    test('should normalize modifier keys correctly', async () => {
      const provider = new MockProvider('TestProvider', 500);
      const handler = jest.fn((ctx) => ctx.break());
      
      // Register handler for Ctrl+S
      provider.addHotkey('Ctrl+s', handler);
      manager.registerProvider(provider);

      // Test with Ctrl+S
      const event = createKeyboardEvent('s', { ctrl: true });
      const result = await manager.executeChain('Ctrl+s', event);

      expect(result.executed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    test('should handle multiple modifiers', async () => {
      const provider = new MockProvider('TestProvider', 500);
      const handler = jest.fn((ctx) => ctx.break());
      
      provider.addHotkey('Ctrl+Shift+Alt+s', handler);
      manager.registerProvider(provider);

      const event = createKeyboardEvent('s', { ctrl: true, shift: true, alt: true });
      const result = await manager.executeChain('Ctrl+Shift+Alt+s', event);

      expect(result.executed).toBe(true);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Debug Information', () => {
    test('should provide comprehensive debug information', () => {
      const provider1 = new MockProvider('Provider1', 800);
      const provider2 = new MockProvider('Provider2', 600);
      
      provider1.addHotkey('Escape', (ctx) => ctx.break(), true, 'Close modal');
      provider2.addHotkey('Escape', (ctx) => ctx.break(), false, 'Close menu');

      manager.registerProvider(provider1);
      manager.registerProvider(provider2);

      const debugInfo = manager.getChainDebugInfo('Escape');

      expect(debugInfo.providers).toEqual(['Provider1', 'Provider2']);
      expect(debugInfo.totalHandlers).toBe(2);
      expect(debugInfo.handlers).toHaveLength(2);
      
      expect(debugInfo.handlers[0]).toEqual({
        providerId: 'Provider1',
        key: 'Escape',
        enabled: true,
        priority: 800,
        description: 'Close modal'
      });
      
      expect(debugInfo.handlers[1]).toEqual({
        providerId: 'Provider2',
        key: 'Escape',
        enabled: false,
        priority: 600,
        description: 'Close menu'
      });
    });
  });
});