/**
 * Unit tests for AppHeader Compact Mode Subscription functionality
 * Tests subscription to sidebar compact mode changes and dynamic positioning
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

describe('AppHeader Compact Mode Subscription', () => {
  let appHeader: AppHeaderImpl;
  let sidebar: Sidebar;
  let headerElement: HTMLElement;

  beforeEach(async () => {
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create wrapper structure for header
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper-constructed';
    const wrapperContent = document.createElement('div');
    wrapperContent.className = 'wrapper-content';
    wrapper.appendChild(wrapperContent);
    document.body.appendChild(wrapper);
    
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

  describe('Subscription Setup', () => {
    test('should subscribe to sidebar compact mode changes during initialization', () => {
      expect(sidebar).toBeTruthy();
      expect(headerElement).toBeTruthy();
      
      // Check if private unsubscribe function exists (indicates subscription)
      expect((appHeader as any).sidebarCompactModeUnsubscribe).toBeTruthy();
      expect(typeof (appHeader as any).sidebarCompactModeUnsubscribe).toBe('function');
    });

    test('should set initial header position based on sidebar state', () => {
      // Initial state should be normal (non-compact)
      expect(sidebar.isCompactMode()).toBe(false);
      
      // Header should be positioned for normal sidebar (280px from left)
      expect(headerElement.style.left).toBe('280px');
      expect(headerElement.style.width).toBe('calc(100vw - 280px)');
    });

    test('should handle subscription when sidebar is not available', async () => {
      // Create AppHeader without sidebar
      const headerWithoutSidebar = new AppHeaderImpl();
      
      // Directly set sidebar to null
      (headerWithoutSidebar as any).sidebar = null;
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // This should not throw and should warn
      (headerWithoutSidebar as any).subscribeToSidebarCompactMode();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'AppHeader - Cannot subscribe to sidebar compact mode: sidebar not available'
      );
      
      headerWithoutSidebar.destroy();
    });
  });

  describe('Compact Mode Position Updates', () => {
    test('should update header position when sidebar becomes compact', () => {
      // Toggle sidebar to compact mode
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      // Header should be positioned for compact sidebar (80px from left)
      expect(headerElement.style.left).toBe('80px');
      expect(headerElement.style.width).toBe('calc(100vw - 80px)');
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(true);
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(false);
    });

    test('should update header position when sidebar becomes normal', () => {
      // First make it compact
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      expect(headerElement.style.left).toBe('80px');
      
      // Then make it normal again
      compactButton.click();
      
      // Header should be positioned for normal sidebar (280px from left)
      expect(headerElement.style.left).toBe('280px');
      expect(headerElement.style.width).toBe('calc(100vw - 280px)');
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(true);
    });

    test('should handle multiple rapid compact mode toggles', () => {
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      
      // Rapid toggles
      for (let i = 0; i < 10; i++) {
        compactButton.click();
        
        const expectedLeft = sidebar.isCompactMode() ? '80px' : '280px';
        const expectedWidth = sidebar.isCompactMode() ? 'calc(100vw - 80px)' : 'calc(100vw - 280px)';
        
        expect(headerElement.style.left).toBe(expectedLeft);
        expect(headerElement.style.width).toBe(expectedWidth);
      }
    });

    test('should handle positioning when header container is not available', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Remove container reference
      (appHeader as any).container = null;
      
      // This should not throw and should warn
      (appHeader as any).handleSidebarCompactModeChange(true);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'AppHeader - Cannot update position: container not available'
      );
    });
  });

  describe('Mobile Responsive Behavior', () => {
    beforeEach(() => {
      // Switch to mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });
    });

    test('should position header full-width on mobile', () => {
      // Trigger resize to update for mobile
      appHeader.updatePosition();
      
      // Header should be full width on mobile
      expect(headerElement.style.left).toBe('0px');
      expect(headerElement.style.width).toBe('100vw');
      expect(headerElement.classList.contains('header-mobile')).toBe(true);
    });

    test('should ignore compact mode on mobile', () => {
      // Try to toggle compact mode on mobile
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      if (compactButton) {
        compactButton.click();
      }
      
      // Trigger position update for mobile
      appHeader.updatePosition();
      
      // Header should still be full width regardless of compact state
      expect(headerElement.style.left).toBe('0px');
      expect(headerElement.style.width).toBe('100vw');
      expect(headerElement.classList.contains('header-mobile')).toBe(true);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
    });

    test('should switch back to sidebar-aware positioning on desktop', async () => {
      // Start on mobile
      appHeader.updatePosition();
      expect(headerElement.style.left).toBe('0px');
      
      // Switch back to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      // Trigger resize
      window.dispatchEvent(new Event('resize'));
      
      // Wait for debounced resize handler
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Header should be positioned for normal sidebar
      expect(headerElement.style.left).toBe('280px');
      expect(headerElement.classList.contains('header-mobile')).toBe(false);
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(true);
    });
  });

  describe('Sidebar Dimension Calculations', () => {
    test('should calculate normal sidebar dimensions correctly', () => {
      const sidebarInfo = appHeader.getSidebarInfo();
      
      expect(sidebarInfo).toEqual({
        width: 280,
        rightBorder: 280,
        isCompact: false,
        isMobile: false
      });
    });

    test('should calculate compact sidebar dimensions correctly', () => {
      // Toggle to compact mode
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      const sidebarInfo = appHeader.getSidebarInfo();
      
      expect(sidebarInfo).toEqual({
        width: 80,
        rightBorder: 80,
        isCompact: true,
        isMobile: false
      });
    });

    test('should calculate mobile dimensions correctly', () => {
      // Switch to mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });
      
      const sidebarInfo = appHeader.getSidebarInfo();
      
      expect(sidebarInfo).toEqual({
        width: 0,
        rightBorder: 0,
        isCompact: false, // Compact mode doesn't apply on mobile
        isMobile: true
      });
    });

    test('should use actual sidebar element dimensions when available', () => {
      const sidebarElement = document.getElementById('app_sidebar');
      expect(sidebarElement).toBeTruthy();
      
      // Mock getBoundingClientRect
      const mockRect = {
        left: 0,
        right: 290, // Slightly different from expected 280
        width: 290,
        height: 800,
        top: 0,
        bottom: 800,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };
      
      jest.spyOn(sidebarElement!, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
      
      const sidebarInfo = appHeader.getSidebarInfo();
      
      // Should use actual width from element
      expect(sidebarInfo?.rightBorder).toBe(290);
    });
  });

  describe('Header Position Information', () => {
    test('should provide current header position information', () => {
      const position = appHeader.getHeaderPosition();
      
      expect(position).toBeTruthy();
      expect(typeof position?.left).toBe('number');
      expect(typeof position?.width).toBe('number');
      expect(typeof position?.right).toBe('number');
    });

    test('should return null when header container is not available', () => {
      // Remove container
      (appHeader as any).container = null;
      
      const position = appHeader.getHeaderPosition();
      
      expect(position).toBeNull();
    });

    test('should return null for sidebar info when sidebar is not available', () => {
      // Remove sidebar
      (appHeader as any).sidebar = null;
      
      const sidebarInfo = appHeader.getSidebarInfo();
      
      expect(sidebarInfo).toBeNull();
    });
  });

  describe('Custom Events', () => {
    test('should dispatch header-position-updated event on position changes', () => {
      const eventListener = jest.fn();
      document.addEventListener('header-position-updated', eventListener);
      
      // Toggle compact mode to trigger position update
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      expect(eventListener).toHaveBeenCalled();
      
      const eventDetail = eventListener.mock.calls[0][0].detail;
      expect(eventDetail.sidebarInfo).toBeTruthy();
      expect(eventDetail.headerLeft).toBe(80);
      expect(typeof eventDetail.headerWidth).toBe('number');
      
      // Cleanup
      document.removeEventListener('header-position-updated', eventListener);
    });

    test('should include correct information in custom events', () => {
      const eventListener = jest.fn();
      document.addEventListener('header-position-updated', eventListener);
      
      // Test normal to compact transition
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      const compactEventDetail = eventListener.mock.calls[0][0].detail;
      expect(compactEventDetail.sidebarInfo.isCompact).toBe(true);
      expect(compactEventDetail.headerLeft).toBe(80);
      
      // Test compact to normal transition
      compactButton.click();
      
      const normalEventDetail = eventListener.mock.calls[1][0].detail;
      expect(normalEventDetail.sidebarInfo.isCompact).toBe(false);
      expect(normalEventDetail.headerLeft).toBe(280);
      
      // Cleanup
      document.removeEventListener('header-position-updated', eventListener);
    });
  });

  describe('Public API Methods', () => {
    test('should force update position via updatePosition method', () => {
      // Manually change sidebar to compact mode without triggering subscription
      const sidebarElement = document.getElementById('app_sidebar') as HTMLElement;
      sidebarElement.classList.add('sidebar-compact');
      
      // Header position should still be normal (subscription didn't fire)
      expect(headerElement.style.left).toBe('280px');
      
      // Force update position
      appHeader.updatePosition();
      
      // Now header should reflect compact positioning
      expect(headerElement.style.left).toBe('80px');
    });

    test('should handle updatePosition when sidebar is not available', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Remove sidebar
      (appHeader as any).sidebar = null;
      
      // This should not throw and should warn
      appHeader.updatePosition();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'AppHeader - Cannot update position: sidebar not available'
      );
    });

    test('should provide accurate getSidebarInfo during state changes', () => {
      // Initial state
      let sidebarInfo = appHeader.getSidebarInfo();
      expect(sidebarInfo?.isCompact).toBe(false);
      expect(sidebarInfo?.rightBorder).toBe(280);
      
      // Toggle to compact
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      // Updated state
      sidebarInfo = appHeader.getSidebarInfo();
      expect(sidebarInfo?.isCompact).toBe(true);
      expect(sidebarInfo?.rightBorder).toBe(80);
    });
  });

  describe('Integration with Window Resize', () => {
    test('should update position on window resize', async () => {
      // Toggle to compact mode
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      expect(headerElement.style.left).toBe('80px');
      
      // Change viewport size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      // Wait for debounced resize handler
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Position should be recalculated (still compact on desktop)
      expect(headerElement.style.left).toBe('80px');
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(true);
    });

    test('should switch to mobile layout on resize to small screen', async () => {
      // Start with desktop compact mode
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      expect(headerElement.style.left).toBe('80px');
      
      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      // Wait for debounced resize handler
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should switch to mobile layout
      expect(headerElement.style.left).toBe('0px');
      expect(headerElement.style.width).toBe('100vw');
      expect(headerElement.classList.contains('header-mobile')).toBe(true);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
    });
  });

  describe('Subscription Cleanup', () => {
    test('should unsubscribe from compact mode changes on destroy', () => {
      // Verify subscription exists
      expect((appHeader as any).sidebarCompactModeUnsubscribe).toBeTruthy();
      
      // Destroy component
      appHeader.destroy();
      
      // Verify subscription is cleaned up
      expect((appHeader as any).sidebarCompactModeUnsubscribe).toBeNull();
    });

    test('should not throw when destroying without subscription', async () => {
      // Create header without successful sidebar initialization
      const headerWithoutSidebar = new AppHeaderImpl();
      (headerWithoutSidebar as any).sidebarCompactModeUnsubscribe = null;
      
      // Should not throw
      expect(() => {
        headerWithoutSidebar.destroy();
      }).not.toThrow();
    });

    test('should handle subscription cleanup gracefully', () => {
      // Mock unsubscribe function
      const mockUnsubscribe = jest.fn();
      (appHeader as any).sidebarCompactModeUnsubscribe = mockUnsubscribe;
      
      // Destroy should call unsubscribe
      appHeader.destroy();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect((appHeader as any).sidebarCompactModeUnsubscribe).toBeNull();
    });
  });

  describe('CSS Class Management', () => {
    test('should apply correct CSS classes for different states', () => {
      // Normal state
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(true);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
      expect(headerElement.classList.contains('header-mobile')).toBe(false);
      
      // Compact state
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(false);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(true);
      expect(headerElement.classList.contains('header-mobile')).toBe(false);
      
      // Mobile state
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      appHeader.updatePosition();
      
      expect(headerElement.classList.contains('header-sidebar-normal')).toBe(false);
      expect(headerElement.classList.contains('header-sidebar-compact')).toBe(false);
      expect(headerElement.classList.contains('header-mobile')).toBe(true);
    });

    test('should properly toggle CSS classes on state changes', () => {
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      
      // Toggle multiple times
      for (let i = 0; i < 5; i++) {
        compactButton.click();
        
        const isCompact = sidebar.isCompactMode();
        expect(headerElement.classList.contains('header-sidebar-compact')).toBe(isCompact);
        expect(headerElement.classList.contains('header-sidebar-normal')).toBe(!isCompact);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing sidebar element gracefully', () => {
      // Remove sidebar element from DOM
      const sidebarElement = document.getElementById('app_sidebar');
      if (sidebarElement) {
        sidebarElement.remove();
      }
      
      // Should still work with calculated dimensions
      expect(() => {
        appHeader.updatePosition();
      }).not.toThrow();
      
      const sidebarInfo = appHeader.getSidebarInfo();
      expect(sidebarInfo?.rightBorder).toBe(280); // Fallback to calculated value
    });

    test('should handle rapid viewport changes', () => {
      const viewports = [1024, 767, 1200, 600, 1440, 375, 1920];
      
      viewports.forEach(width => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        expect(() => {
          appHeader.updatePosition();
        }).not.toThrow();
        
        const sidebarInfo = appHeader.getSidebarInfo();
        expect(sidebarInfo).toBeTruthy();
      });
    });

    test('should maintain functionality after DOM manipulation', () => {
      // Simulate external DOM changes
      headerElement.style.cssText = 'position: relative; left: 50px;';
      
      // Compact mode change should still override external styles
      const compactButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      compactButton.click();
      
      expect(headerElement.style.left).toBe('80px');
      expect(headerElement.style.position).toBeTruthy(); // Should maintain position
    });
  });
});
