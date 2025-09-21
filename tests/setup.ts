/**
 * Jest test setup file
 * Configure testing environment for Opinion Front UI
 */

// Setup JSDOM environment
import { TextEncoder, TextDecoder } from 'util';

// Global beforeEach setup to ensure sidebar element exists
beforeEach(() => {
  // Create container for app-sidebar if it doesn't exist
  if (!document.getElementById('app-sidebar')) {
    const sidebarEl = document.createElement('div');
    sidebarEl.id = 'app-sidebar';
    sidebarEl.classList.add('app-sidebar');
    document.body.appendChild(sidebarEl);
  }
});

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    // Suppress JSDOM navigation errors in tests
    if (args[0] && args[0].message && args[0].message.includes('Not implemented: navigation')) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

// Provide a default mock LayoutContext for components that rely on it
jest.mock('../src/contexts/index', () => {
  const mockLayoutContext = {
    registerFooter: jest.fn(),
    registerChainProvider: jest.fn(() => () => {}),
    unregisterAllHotkeys: jest.fn(),
    registerLayout: jest.fn(),
    subscribe: jest.fn(() => () => {}),
    getModeType: jest.fn(() => 'desktop'),
    isLayoutMobile: jest.fn(() => false),
    getMessages: jest.fn(() => ({ 
      showError: jest.fn(),
      showWarning: jest.fn(),
      showInfo: jest.fn(),
      showSuccess: jest.fn()
    })),
    getSidebar: jest.fn(() => ({ isCompactMode: () => false })),
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
  };
  return {
    getLayoutContext: jest.fn(() => mockLayoutContext),
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
