/**
 * Debug test to investigate AppHeader resize behavior
 * This test aims to identify why visual resize doesn't work while unit tests pass
 */

import AppHeader from '../src/components/AppHeader';
import { Sidebar } from '../src/components/Sidebar';

// Mock UserMenu to avoid dependencies
jest.mock('../src/components/UserMenu', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      init: jest.fn().mockResolvedValue(undefined),
      updateUser: jest.fn(),
      close: jest.fn(),
      destroy: jest.fn()
    }))
  };
});

describe('AppHeader Resize Behavior Debug', () => {
  let appHeader: AppHeader;
  let sidebar: Sidebar;
  let headerElement: HTMLElement;
  let originalAddEventListener: typeof window.addEventListener;
  let resizeListeners: ((event: Event) => void)[] = [];

  beforeEach(async () => {
    // Clear any previous listeners
    resizeListeners = [];
    
    // Mock addEventListener to capture resize listeners
    originalAddEventListener = window.addEventListener;
    window.addEventListener = jest.fn((event: string, listener: any) => {
      if (event === 'resize') {
        resizeListeners.push(listener);
      }
      return originalAddEventListener.call(window, event, listener);
    });
    
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create wrapper structure
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper-constructed';
    const wrapperContent = document.createElement('div');
    wrapperContent.className = 'wrapper-content';
    wrapper.appendChild(wrapperContent);
    document.body.appendChild(wrapper);
    
    // Set up desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Initialize AppHeader
    appHeader = new AppHeader();
    await appHeader.init();
    
    // Get references
    sidebar = appHeader.getSidebar() as Sidebar;
    headerElement = appHeader.getContainer() as HTMLElement;
  });

  afterEach(() => {
    // Restore original addEventListener
    window.addEventListener = originalAddEventListener;
    
    // Clean up
    if (appHeader) {
      appHeader.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Resize Listener Registration', () => {
    test('should register resize event listener during initialization', () => {
      // Check if resize listener was registered
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(resizeListeners.length).toBeGreaterThan(0);
    });

    test('should have working resize listener that calls handleResize', async () => {
      // Spy on handleResize method
      const handleResizeSpy = jest.spyOn(appHeader as any, 'handleResize');
      
      // Trigger resize event manually
      const resizeEvent = new Event('resize');
      resizeListeners.forEach(listener => listener(resizeEvent));
      
      // Wait for debounced handler
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(handleResizeSpy).toHaveBeenCalled();
    });
  });

  describe('Resize Handler Behavior', () => {
    test('should call updatePosition during handleResize', () => {
      // Spy on updatePosition method
      const updatePositionSpy = jest.spyOn(appHeader, 'updatePosition');
      
      // Call handleResize directly
      (appHeader as any).handleResize();
      
      expect(updatePositionSpy).toHaveBeenCalled();
    });

    test('should update header-center padding during handleResize', () => {
      const headerCenter = headerElement.querySelector('.header-center') as HTMLElement;
      
      // Start with desktop viewport
      expect(headerCenter.style.paddingLeft).toBe('0px');
      
      // Change to mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      // Call handleResize directly
      (appHeader as any).handleResize();
      
      // Should update padding for mobile
      expect(headerCenter.style.paddingLeft).toBe('16px');
    });

    test('should log resize actions', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Change viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
      
      // Call handleResize
      (appHeader as any).handleResize();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('AppHeader - Updated header-center styling for 800px viewport')
      );
    });
  });

  describe('Real-world Resize Simulation', () => {
    test('should handle resize event dispatch like real browser', async () => {
      // Initial state
      expect(headerElement.style.left).toBe('280px');
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(true);
      
      // Toggle to compact mode
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      expect(headerElement.style.left).toBe('80px');
      
      // Change viewport size (like browser resize)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      // Simulate browser dispatching resize event
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
      
      // Wait for debounced resize handler (100ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should maintain compact positioning
      expect(headerElement.style.left).toBe('80px');
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(true);
    });

    test('should handle mobile transition during resize', async () => {
      // Start in compact mode on desktop
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      expect(headerElement.style.left).toBe('80px');
      
      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      
      // Dispatch resize event
      window.dispatchEvent(new Event('resize'));
      // Wait for debounced resize handler
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should switch to mobile layout
      expect(headerElement.style.left).toBe('0px');
      expect(headerElement.style.width).toBe('100vw');
      expect(headerElement.classList.contains('header-mobile')).toBe(true);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
    });

    test('should handle multiple rapid resize events', async () => {
      const updatePositionSpy = jest.spyOn(appHeader, 'updatePosition');
      
      // Simulate multiple rapid resizes
      const viewports = [1024, 800, 1200, 600, 1440];
      
      for (const width of viewports) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        window.dispatchEvent(new Event('resize'));
        // Wait for each debounced resize to complete
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // updatePosition should have been called for each resize
      expect(updatePositionSpy).toHaveBeenCalledTimes(viewports.length);
    });
  });

  describe('Potential Issues Investigation', () => {
    test('should check if window.innerWidth is readable during resize', () => {
      // Change viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      // Call handleResize and check if it can read the new width
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      (appHeader as any).handleResize();
      
      // Should log the correct width
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('768px viewport')
      );
    });

    test('should check if sidebar instance is available during resize', () => {
      // Verify sidebar is available
      expect(appHeader.getSidebar()).toBeTruthy();
      
      // Call handleResize and ensure no warnings about missing sidebar
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (appHeader as any).handleResize();
      
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot update position: sidebar not available')
      );
    });

    test('should check if DOM elements exist during resize', () => {
      // Verify header elements exist
      expect(headerElement).toBeTruthy();
      expect(headerElement.querySelector('.header-center')).toBeTruthy();
      
      // Call handleResize and ensure it works with existing DOM
      expect(() => {
        (appHeader as any).handleResize();
      }).not.toThrow();
    });

    test('should verify CSS property setting during resize', () => {
      const headerCenter = headerElement.querySelector('.header-center') as HTMLElement;
      
      // Mock style property to capture assignments
      const mockStyle = {
        cssText: '',
        paddingLeft: '0px'
      };
      
      Object.defineProperty(headerCenter, 'style', {
        writable: true,
        value: mockStyle
      });
      
      // Change to mobile and resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      (appHeader as any).handleResize();
      
      // Check if cssText was set
      expect(mockStyle.cssText).toBe('padding-left: 16px;');
    });

    test('should check timing of resize vs compact mode events', async () => {
      const eventOrder: string[] = [];
      
      // Track when updatePosition is called
      const originalUpdatePosition = appHeader.updatePosition.bind(appHeader);
      appHeader.updatePosition = () => {
        eventOrder.push('updatePosition');
        return originalUpdatePosition();
      };
      
      // Track when compact mode changes
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.addEventListener('click', () => {
        eventOrder.push('compactToggle');
      });
      
      // Perform actions
      compactButton.click(); // Should trigger compact mode change
      
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
      });
      window.dispatchEvent(new Event('resize')); // Should trigger resize
      
      // Wait for debounced resize handler
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Check event order
      expect(eventOrder).toContain('compactToggle');
      expect(eventOrder).toContain('updatePosition');
      
      // The updatePosition from resize should come after compact toggle
      const lastUpdateIndex = eventOrder.lastIndexOf('updatePosition');
      expect(lastUpdateIndex).toBeGreaterThan(0);
    });
  });
});
