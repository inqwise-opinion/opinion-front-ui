/**
 * Test Setup for Chain Hotkey System Tests
 * 
 * Provides common mocks and utilities for testing the hotkey chain system
 */

// Mock DOM globals
Object.defineProperty(global, 'KeyboardEvent', {
  value: class MockKeyboardEvent extends Event {
    public readonly key: string;
    public readonly ctrlKey: boolean;
    public readonly altKey: boolean;
    public readonly shiftKey: boolean;
    public readonly metaKey: boolean;

    constructor(type: string, options: {
      key: string;
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
      metaKey?: boolean;
      bubbles?: boolean;
      cancelable?: boolean;
    }) {
      super(type, {
        bubbles: options.bubbles || false,
        cancelable: options.cancelable || false
      });
      
      this.key = options.key;
      this.ctrlKey = options.ctrlKey || false;
      this.altKey = options.altKey || false;
      this.shiftKey = options.shiftKey || false;
      this.metaKey = options.metaKey || false;
    }
  },
  configurable: true
});

// Mock console to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error // Keep errors visible
};

// Reset console mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Restore console after all tests
afterAll(() => {
  global.console = originalConsole;
});

// Global test utilities
(global as any).createTestKeyboardEvent = (
  key: string, 
  modifiers: {
    ctrl?: boolean;
    alt?: boolean; 
    shift?: boolean;
    meta?: boolean;
  } = {}
): KeyboardEvent => {
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

// Test helper: Create mock document
(global as any).createMockDocument = () => {
  const listeners = new Map<string, Function[]>();
  
  return {
    addEventListener: jest.fn((event: string, listener: Function) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(listener);
    }),
    removeEventListener: jest.fn((event: string, listener: Function) => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }),
    dispatchEvent: jest.fn((event: Event) => {
      const eventListeners = listeners.get(event.type);
      if (eventListeners) {
        eventListeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error(`Error in event listener for ${event.type}:`, error);
          }
        });
      }
      return true;
    }),
    _getListeners: () => listeners // Test utility to inspect listeners
  };
};

// Export types for tests
export {};

// Add type declarations for global test utilities
declare global {
  function createTestKeyboardEvent(
    key: string, 
    modifiers?: {
      ctrl?: boolean;
      alt?: boolean; 
      shift?: boolean;
      meta?: boolean;
    }
  ): KeyboardEvent;

  function createMockDocument(): {
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
    dispatchEvent: jest.Mock;
    _getListeners: () => Map<string, Function[]>;
  };
}