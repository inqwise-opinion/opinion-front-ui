/**
 * Jest test setup file
 * Configure testing environment for Opinion Front UI
 */

// Setup JSDOM environment
import { TextEncoder, TextDecoder } from 'util';

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

afterAll(() => {
  console.error = originalConsoleError;
});
