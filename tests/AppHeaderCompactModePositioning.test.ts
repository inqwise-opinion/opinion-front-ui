/**
 * Unit tests for AppHeader Compact Mode CSS Class Application
 * Tests that the header applies correct CSS classes instead of inline positioning
 * This aligns with the refactored CSS-based layout approach
 */

import { AppHeaderImpl } from '../src/components/AppHeaderImpl';
import { Sidebar } from '../src/components/Sidebar';

// Mock UserMenu to avoid dependencies in AppHeader tests
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

describe('AppHeader Compact Mode CSS Class Application', () => {
  let appHeader: AppHeaderImpl;
  let sidebar: Sidebar;
  let headerElement: HTMLElement;
  let sidebarElement: HTMLElement;

  beforeEach(async () => {
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create new semantic app layout structure
    const appLayout = document.createElement('div');
    appLayout.className = 'app-layout';
    document.body.appendChild(appLayout);
    
    // Set up desktop viewport environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock console methods to reduce noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Initialize AppHeader - this will create and initialize its own Sidebar
    appHeader = new AppHeaderImpl();
    await appHeader.init();
    
    // Get references
    sidebar = appHeader.getSidebar() as Sidebar;
    headerElement = document.querySelector('.app-header') as HTMLElement;
    sidebarElement = document.getElementById('app_sidebar') as HTMLElement;
  });

  afterEach(() => {
    // Clean up components
    if (appHeader) {
      appHeader.destroy();
    }
    
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('CSS Class Application for Layout States', () => {
    test('should remove all inline positioning styles and rely on CSS classes', () => {
      // Force update position to trigger layout
      appHeader.updatePosition();
      
      // After refactoring, no inline positioning should be set
      expect(headerElement.style.left).toBe('');
      expect(headerElement.style.width).toBe('');
      expect(headerElement.style.right).toBe('');
      
      // Should have appropriate CSS class for normal sidebar state
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(true);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
      expect(headerElement.classList.contains('header-mobile')).toBe(false);
    });

    test('should apply compact CSS class when sidebar is in compact mode', () => {
      // Toggle to compact mode
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      // Should have compact CSS class applied
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(false);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(true);
      expect(headerElement.classList.contains('header-mobile')).toBe(false);
      
      // Should still have no inline positioning
      expect(headerElement.style.left).toBe('');
      expect(headerElement.style.width).toBe('');
    });

    test('should apply mobile CSS class on mobile viewport', () => {
      // Switch to mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      // Force update position
      appHeader.updatePosition();
      
      // Should have mobile class and no sidebar classes
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(false);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
      expect(headerElement.classList.contains('header-mobile')).toBe(true);
      
      // Should still have no inline positioning
      expect(headerElement.style.left).toBe('');
      expect(headerElement.style.width).toBe('');
    });
  });

  describe('Sidebar Information API Still Works', () => {
    test('should return correct sidebar info with valid getBoundingClientRect', () => {
      // Mock getBoundingClientRect
      const mockRect = {
        left: 0,
        right: 290,
        width: 290,
        height: 800,
        top: 0,
        bottom: 800,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };
      
      jest.spyOn(sidebarElement, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
      
      const sidebarInfo = appHeader.getSidebarInfo();
      
      expect(sidebarInfo).toEqual({
        width: 280, // Calculated width
        rightBorder: 290, // Actual measured width
        isCompact: false,
        isMobile: false
      });
    });

    test('should return compact info correctly', () => {
      // Toggle to compact mode
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      // Mock compact sidebar dimensions
      const mockRect = {
        left: 0,
        right: 85,
        width: 85,
        height: 800,
        top: 0,
        bottom: 800,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };
      
      jest.spyOn(sidebarElement, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
      
      const sidebarInfo = appHeader.getSidebarInfo();
      
      expect(sidebarInfo).toEqual({
        width: 80, // Calculated compact width
        rightBorder: 85, // Actual measured width
        isCompact: true,
        isMobile: false
      });
    });
  });

  describe('Custom Event Dispatching', () => {
    test('should dispatch header-position-updated event with correct sidebar info', () => {
      const eventListener = jest.fn();
      document.addEventListener('header-position-updated', eventListener);
      
      // Toggle compact mode to trigger event
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      expect(eventListener).toHaveBeenCalled();
      
      const eventDetail = eventListener.mock.calls[0][0].detail;
      expect(eventDetail.isCompact).toBe(true);
      expect(eventDetail.isMobile).toBe(false);
      
      // Cleanup
      document.removeEventListener('header-position-updated', eventListener);
    });

    test('should dispatch mobile event correctly', () => {
      const eventListener = jest.fn();
      document.addEventListener('header-position-updated', eventListener);
      
      // Switch to mobile viewport and trigger update
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      appHeader.updatePosition();
      
      expect(eventListener).toHaveBeenCalled();
      
      const eventDetail = eventListener.mock.calls[0][0].detail;
      expect(eventDetail.isMobile).toBe(true);
      expect(eventDetail.isCompact).toBe(false); // Compact mode ignored on mobile
      
      // Cleanup
      document.removeEventListener('header-position-updated', eventListener);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null getBoundingClientRect gracefully', () => {
      // Mock getBoundingClientRect to return null (shouldn't happen in real browsers)
      jest.spyOn(sidebarElement, 'getBoundingClientRect').mockReturnValue(null as any);
      
      expect(() => {
        appHeader.updatePosition();
      }).not.toThrow();
      
      // Should still apply CSS classes correctly
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(true);
      expect(headerElement.style.left).toBe(''); // No inline styles
    });

    test('should handle getBoundingClientRect throwing an error', () => {
      // Mock getBoundingClientRect to throw an error
      jest.spyOn(sidebarElement, 'getBoundingClientRect').mockImplementation(() => {
        throw new Error('getBoundingClientRect failed');
      });
      
      expect(() => {
        appHeader.updatePosition();
      }).not.toThrow();
      
      // Should still apply CSS classes correctly
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(true);
      expect(headerElement.style.left).toBe(''); // No inline styles
    });

    test('should maintain CSS classes across rapid state changes', () => {
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      
      // Rapid toggles
      for (let i = 0; i < 5; i++) {
        compactButton.click();
        
        const expectedCompact = sidebar.isCompactMode();
        expect(headerElement.classList.contains('header-sidebar-compact')).toBe(expectedCompact);
        expect(headerElement.classList.contains('header-sidebar-normal')).toBe(!expectedCompact);
        
        // No inline styles should be applied
        expect(headerElement.style.left).toBe('');
        expect(headerElement.style.width).toBe('');
      }
    });
  });

  describe('Viewport Breakpoint Behavior', () => {
    const testViewports = [
      { width: 375, expected: { mobile: true, compact: false, normal: false } },
      { width: 767, expected: { mobile: true, compact: false, normal: false } },
      { width: 768, expected: { mobile: false, compact: false, normal: true } },
      { width: 1024, expected: { mobile: false, compact: false, normal: true } },
      { width: 1440, expected: { mobile: false, compact: false, normal: true } },
    ];

    testViewports.forEach(({ width, expected }) => {
      test(`should apply correct CSS classes at ${width}px viewport`, () => {
        // Set viewport width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        // Force update position
        appHeader.updatePosition();
        
        expect(headerElement.classList.contains('header-mobile')).toBe(expected.mobile);
        expect(headerElement.classList.contains('header-sidebar-compact')).toBe(expected.compact);
        expect(headerElement.classList.contains('header-sidebar-normal')).toBe(expected.normal);
        
        // No inline styles should be applied
        expect(headerElement.style.left).toBe('');
        expect(headerElement.style.width).toBe('');
      });
    });

    test('should handle compact mode correctly across different viewports', () => {
      // Toggle to compact mode
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      testViewports.forEach(({ width, expected }) => {
        // Set viewport width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        // Force update position
        appHeader.updatePosition();
        
        if (expected.mobile) {
          // Mobile should ignore compact mode
          expect(headerElement.classList.contains('header-mobile')).toBe(true);
          expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
          expect(headerElement.classList.contains('header-sidebar-normal')).toBe(false);
        } else {
          // Desktop should respect compact mode
          expect(headerElement.classList.contains('header-sidebar-compact')).toBe(true);
          expect(headerElement.classList.contains('header-sidebar-normal')).toBe(false);
          expect(headerElement.classList.contains('header-mobile')).toBe(false);
        }
        
        // No inline styles should be applied
        expect(headerElement.style.left).toBe('');
        expect(headerElement.style.width).toBe('');
      });
    });
  });

  describe('CSS-Based Layout Integration', () => {
    test('should have app-header class for CSS targeting', () => {
      expect(headerElement.classList.contains('app-header')).toBe(true);
    });

    test('should be inserted into app-layout container', () => {
      const appLayout = document.querySelector('.app-layout');
      expect(appLayout?.contains(headerElement)).toBe(true);
    });

    test('should maintain semantic structure with sidebar', () => {
      const appLayout = document.querySelector('.app-layout');
      const sidebar = appLayout?.querySelector('.app-sidebar');
      const header = appLayout?.querySelector('.app-header');
      
      expect(sidebar).toBeTruthy();
      expect(header).toBeTruthy();
      
      // Header should come after sidebar in DOM order
      const sidebarIndex = Array.from(appLayout?.children || []).indexOf(sidebar!);
      const headerIndex = Array.from(appLayout?.children || []).indexOf(header!);
      expect(headerIndex).toBeGreaterThan(sidebarIndex);
    });
  });
});
