import '@testing-library/jest-dom';
import type { BreadcrumbItem } from '../src/interfaces/BreadcrumbItem';
import type { LayoutContext } from '../src/contexts/LayoutContext';
import type { ActivePage, PageInfo } from '../src/interfaces/ActivePage';

/**
 * Test environment configuration and helper functions
 */

// Keep references to original window properties
const originalWindow = {
  location: window.location,
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  requestAnimationFrame: window.requestAnimationFrame,
  cancelAnimationFrame: window.cancelAnimationFrame,
  ResizeObserver: window.ResizeObserver
};

/**
 * Initialize test DOM environment with consistent mocks
 */
export function setupTestEnvironment() {
  // Create mock URL instance
  const mockURL = new URL('http://localhost:3000/dashboard');
  Object.defineProperty(mockURL, 'pathname', {
    writable: true,
    value: '/dashboard'
  });

  beforeEach(() => {
    // Reset the DOM
    document.body.innerHTML = '';

    // Create base DOM structure many components expect
    const container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    // Mock window.location
    delete (window as any).location;
    window.location = mockURL;

    // Mock window dimensions
    Object.defineProperties(window, {
      innerWidth: {
        configurable: true,
        writable: true,
        value: 1024
      },
      innerHeight: {
        configurable: true,
        writable: true,
        value: 768
      }
    });

    // Mock ResizeObserver
    window.ResizeObserver = class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    // Mock requestAnimationFrame and cancelAnimationFrame
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      return setTimeout(callback, 0);
    };
    window.cancelAnimationFrame = (handle: number): void => {
      clearTimeout(handle);
    };

    // Mock console methods to reduce noise (but keep errors)
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Don't mock console.error to help debug test failures
  });

  afterEach(() => {
    // Restore all window properties
    window.location = originalWindow.location;
    window.innerWidth = originalWindow.innerWidth;
    window.innerHeight = originalWindow.innerHeight;
    window.requestAnimationFrame = originalWindow.requestAnimationFrame;
    window.cancelAnimationFrame = originalWindow.cancelAnimationFrame;
    window.ResizeObserver = originalWindow.ResizeObserver;

    // Clean up DOM
    document.body.innerHTML = '';

    // Restore console
    jest.restoreAllMocks();
  });
}

/**
 * Create a mock DOM element with specified attributes
 */
export function createMockElement(tagName: string = 'div', attributes: Record<string, string> = {}) {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition: () => boolean, timeout: number = 1000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Create a mock event bus instance 
 */
export function createMockEventBus() {
  const listeners = new Map<string, Array<(data: any) => void>>();
  
  return {
    on: (event: string, handler: (data: any) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(handler);
      
      // Return cleanup function
      return () => {
        const handlers = listeners.get(event);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      };
    },
    emit: (event: string, data: any) => {
      const handlers = listeners.get(event);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    },
    hasListeners: (event: string) => {
      return listeners.has(event) && listeners.get(event)!.length > 0;
    },
    removeAllListeners: () => {
      listeners.clear();
    }
  };
}

/**
 * Mock service utilities for testing BaseService implementation
 */
/**
 * Mock BreadcrumbsComponent for testing
 */
export class MockBreadcrumbsComponent {
  private items: BreadcrumbItem[] = [];

  setBreadcrumbs(items: BreadcrumbItem[]) {
    this.items = [...items];
  }

  getBreadcrumbs(): BreadcrumbItem[] {
    return [...this.items];
  }

  addBreadcrumb(item: BreadcrumbItem) {
    this.items.push(item);
  }

  removeBreadcrumb(id: string) {
    this.items = this.items.filter(item => item.id !== id);
  }

  clearBreadcrumbs() {
    this.items = [];
  }
}

/**
 * Mock Layout Context for testing
 */
export class MockLayoutContext implements LayoutContext {
  private header: any;
  private breadcrumbsComponent: MockBreadcrumbsComponent;

  constructor() {
    this.breadcrumbsComponent = new MockBreadcrumbsComponent();
    this.header = {
      getBreadcrumbsComponent: () => this.breadcrumbsComponent
    };
  }

  getHeader() {
    return this.header;
  }

  getBreadcrumbsComponent() {
    return this.breadcrumbsComponent;
  }
}

/**
 * Mock ActivePage for testing
 */
export class MockActivePage implements ActivePage {
  constructor(private readonly id: string) {}

  getPageId(): string {
    return this.id;
  }

  getPageInfo(): PageInfo {
    return {
      id: this.id,
      name: `Test Page ${this.id}`,
      path: `/test/${this.id}`
    };
  }
}

export class MockBaseService {
  private events: Array<{type: string, serviceId: string, status: string}> = [];
  
  constructor(private readonly serviceId: string) {}

  onInit(): Promise<void> {
    this.events.push({
      type: 'init',
      serviceId: this.serviceId,
      status: 'success'
    });
    return Promise.resolve();
  }

  onDestroy(): Promise<void> {
    this.events.push({
      type: 'destroy',
      serviceId: this.serviceId,
      status: 'success' 
    });
    return Promise.resolve();
  }

  getEvents() {
    return this.events;
  }
}