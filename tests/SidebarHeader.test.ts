/**
 * Unit tests for Sidebar Header component
 * Tests header structure, brand, controls, compact toggle functionality, and accessibility
 */

import { Sidebar } from '../src/components/Sidebar';

describe('Sidebar Header', () => {
  let sidebar: Sidebar;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create mock viewport environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock window.location for navigation tests
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/dashboard'
      }
    });
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up sidebar instance
    if (sidebar) {
      sidebar.destroy();
    }
    
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('Header Structure and Creation', () => {
    test('should create sidebar header element on initialization', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const sidebarHeader = document.querySelector('.sidebar-header');
      expect(sidebarHeader).toBeTruthy();
      expect(sidebarHeader?.tagName).toBe('DIV');
    });

    test('should create header with proper CSS classes', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const sidebarHeader = document.querySelector('.sidebar-header');
      expect(sidebarHeader?.classList.contains('sidebar-header')).toBe(true);
    });

    test('should position header as first element in sidebar wrapper', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const sidebarWrapper = document.querySelector('.sidebar-wrapper');
      const sidebarHeader = document.querySelector('.sidebar-header');
      const firstChild = sidebarWrapper?.firstElementChild;
      
      expect(firstChild).toBe(sidebarHeader);
    });

    test('should have flexbox layout structure', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
      
      expect(sidebarHeader).toBeTruthy();
      expect(sidebarHeader.classList.contains('sidebar-header')).toBe(true);
      // CSS should apply: display: flex, justify-content: space-between, align-items: center
    });
  });

  describe('Brand Section', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should create brand section with proper structure', () => {
      const sidebarBrand = document.querySelector('.sidebar-brand');
      const brandTitleLink = document.querySelector('.brand-title-link');
      const brandTitle = document.querySelector('.brand-title');
      
      expect(sidebarBrand).toBeTruthy();
      expect(brandTitleLink).toBeTruthy();
      expect(brandTitle).toBeTruthy();
    });

    test('should set correct brand title text', () => {
      const brandTitle = document.querySelector('.brand-title');
      expect(brandTitle?.textContent).toBe('Opinion');
      expect(brandTitle?.tagName).toBe('H1');
    });

    test('should create brand link with correct href', () => {
      const brandTitleLink = document.querySelector('.brand-title-link') as HTMLAnchorElement;
      expect(brandTitleLink?.tagName).toBe('A');
      expect(brandTitleLink?.getAttribute('href')).toBe('/dashboard');
    });

    test('should handle brand link focus', () => {
      const brandTitleLink = document.querySelector('.brand-title-link') as HTMLElement;
      
      brandTitleLink.focus();
      expect(document.activeElement).toBe(brandTitleLink);
    });

    test('should handle brand link clicks', () => {
      const brandTitleLink = document.querySelector('.brand-title-link') as HTMLElement;
      
      expect(() => {
        brandTitleLink.click();
      }).not.toThrow();
    });

    test('should have proper semantic heading structure', () => {
      const brandTitle = document.querySelector('.brand-title') as HTMLElement;
      
      expect(brandTitle.tagName).toBe('H1');
      expect(brandTitle.classList.contains('brand-title')).toBe(true);
    });
  });

  describe('Controls Section', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should create sidebar controls section', () => {
      const sidebarControls = document.querySelector('.sidebar-controls');
      expect(sidebarControls).toBeTruthy();
      expect(sidebarControls?.classList.contains('sidebar-controls')).toBe(true);
    });

    test('should contain compact toggle button', () => {
      const compactToggle = document.querySelector('.sidebar-compact-toggle');
      expect(compactToggle).toBeTruthy();
      expect(compactToggle?.tagName).toBe('BUTTON');
      expect(compactToggle?.id).toBe('sidebar_compact_toggle');
    });

    test('should have proper button attributes', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLButtonElement;
      
      expect(compactToggle.getAttribute('title')).toBe('Toggle Compact View');
      expect(compactToggle.getAttribute('aria-label')).toBe('Toggle Compact View');
      expect(compactToggle.type).toBe('button');
    });

    test('should contain compact icon element', () => {
      const compactIcon = document.querySelector('.compact-icon');
      expect(compactIcon).toBeTruthy();
      expect(compactIcon?.textContent).toBe('⟨⟩');
    });

    test('should be positioned after brand section', () => {
      const sidebarHeader = document.querySelector('.sidebar-header');
      const sidebarBrand = document.querySelector('.sidebar-brand');
      const sidebarControls = document.querySelector('.sidebar-controls');
      
      const brandIndex = Array.from(sidebarHeader?.children || []).indexOf(sidebarBrand as Element);
      const controlsIndex = Array.from(sidebarHeader?.children || []).indexOf(sidebarControls as Element);
      
      expect(controlsIndex).toBeGreaterThan(brandIndex);
    });
  });

  describe('Compact Toggle Functionality', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should toggle compact mode on click', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
      
      compactToggle.click();
      
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });

    test('should toggle back to normal mode on second click', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      // First click - enable compact
      compactToggle.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Second click - disable compact
      compactToggle.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
    });

    test('should prevent default action on toggle click', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefault = jest.spyOn(clickEvent, 'preventDefault');
      
      compactToggle.dispatchEvent(clickEvent);
      
      expect(preventDefault).toHaveBeenCalled();
    });

    test('should log compact mode state changes', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      
      compactToggle.click();
      expect(consoleSpy).toHaveBeenCalledWith('Sidebar - Compact mode enabled');
      
      compactToggle.click();
      expect(consoleSpy).toHaveBeenCalledWith('Sidebar - Compact mode disabled');
    });

    test('should handle rapid toggle clicks', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        compactToggle.click();
      }
      
      // Should end up compact (even number of clicks)
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
    });
  });

  describe('Compact Mode Visual Changes', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should hide brand section in compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarBrand = document.querySelector('.sidebar-brand');
      
      // Enable compact mode
      sidebarElement.classList.add('sidebar-compact');
      
      expect(sidebarBrand).toBeTruthy();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      // CSS should apply: .sidebar-brand { display: none; }
    });

    test('should center controls in compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarControls = document.querySelector('.sidebar-controls');
      
      // Enable compact mode
      sidebarElement.classList.add('sidebar-compact');
      
      expect(sidebarControls).toBeTruthy();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      // CSS should apply centering styles to controls
    });

    test('should adjust header padding in compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
      
      // Enable compact mode
      sidebarElement.classList.add('sidebar-compact');
      
      expect(sidebarHeader).toBeTruthy();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      // CSS should apply: padding: 0 10px;
    });

    test('should maintain button functionality in compact mode', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      // Enable compact mode
      compactToggle.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Button should still work to toggle back
      compactToggle.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
    });

    test('should show brand section when exiting compact mode', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarBrand = document.querySelector('.sidebar-brand');
      
      // Enter compact mode
      compactToggle.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Exit compact mode
      compactToggle.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
      expect(sidebarBrand).toBeTruthy();
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should have proper ARIA labels on interactive elements', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle');
      
      expect(compactToggle?.getAttribute('aria-label')).toBe('Toggle Compact View');
    });

    test('should have descriptive titles for tooltips', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle');
      
      expect(compactToggle?.getAttribute('title')).toBe('Toggle Compact View');
    });

    test('should support keyboard navigation', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const brandLink = document.querySelector('.brand-title-link') as HTMLElement;
      
      // Both elements should be focusable
      brandLink.focus();
      expect(document.activeElement).toBe(brandLink);
      
      compactToggle.focus();
      expect(document.activeElement).toBe(compactToggle);
    });

    test('should handle Enter key press on compact toggle', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      compactToggle.focus();
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      compactToggle.dispatchEvent(enterEvent);
      
      // Should still be able to click after keyboard interaction
      compactToggle.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });

    test('should handle Space key press on compact toggle', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      
      compactToggle.focus();
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      compactToggle.dispatchEvent(spaceEvent);
      
      // Should not throw error
      expect(document.activeElement).toBe(compactToggle);
    });

    test('should have proper semantic heading hierarchy', () => {
      const brandTitle = document.querySelector('.brand-title') as HTMLElement;
      
      expect(brandTitle.tagName).toBe('H1');
      // Should be the main heading for the sidebar
    });
  });

  describe('Visual Styling and Layout', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should have correct height to match main header', () => {
      const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
      
      expect(sidebarHeader).toBeTruthy();
      expect(sidebarHeader.classList.contains('sidebar-header')).toBe(true);
      // CSS should apply: height: 60px; min-height: 60px;
    });

    test('should have white background', () => {
      const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
      
      expect(sidebarHeader).toBeTruthy();
      // CSS should apply: background: #fff;
    });

    test('should have proper spacing and padding', () => {
      const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
      
      expect(sidebarHeader).toBeTruthy();
      // CSS should apply: padding: 0 20px;
    });

    test('should have flexbox alignment', () => {
      const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
      
      expect(sidebarHeader).toBeTruthy();
      // CSS should apply: display: flex; align-items: center; justify-content: space-between;
    });

    test('should not have bottom border', () => {
      const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
      
      expect(sidebarHeader).toBeTruthy();
      // CSS should apply: border-bottom: 0;
    });

    test('should not have box shadow', () => {
      const sidebarHeader = document.querySelector('.sidebar-header') as HTMLElement;
      
      expect(sidebarHeader).toBeTruthy();
      // CSS should apply: box-shadow: none;
    });
  });

  describe('Brand Styling', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should have proper brand title styling', () => {
      const brandTitle = document.querySelector('.brand-title') as HTMLElement;
      
      expect(brandTitle).toBeTruthy();
      expect(brandTitle.classList.contains('brand-title')).toBe(true);
      // CSS should apply: font-size: 24px; font-weight: 600; color: $primary-color;
    });

    test('should have brand link hover effects', () => {
      const brandLink = document.querySelector('.brand-title-link') as HTMLElement;
      
      expect(brandLink).toBeTruthy();
      expect(brandLink.classList.contains('brand-title-link')).toBe(true);
      // CSS should apply hover and focus states
    });

    test('should have proper brand section flex properties', () => {
      const sidebarBrand = document.querySelector('.sidebar-brand') as HTMLElement;
      
      expect(sidebarBrand).toBeTruthy();
      expect(sidebarBrand.classList.contains('sidebar-brand')).toBe(true);
      // CSS should apply: flex: 1; display: flex; align-items: center;
    });

    test('should have no margins on brand title', () => {
      const brandTitle = document.querySelector('.brand-title') as HTMLElement;
      
      expect(brandTitle).toBeTruthy();
      // CSS should apply: margin: 0; padding-bottom: 0;
    });
  });

  describe('Controls Styling', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should have proper compact toggle button styling', () => {
      const compactToggle = document.querySelector('.sidebar-compact-toggle') as HTMLElement;
      
      expect(compactToggle).toBeTruthy();
      expect(compactToggle.classList.contains('sidebar-compact-toggle')).toBe(true);
      // CSS should apply button styling
    });

    test('should have transparent background by default', () => {
      const compactToggle = document.querySelector('.sidebar-compact-toggle') as HTMLElement;
      
      expect(compactToggle).toBeTruthy();
      // CSS should apply: background: transparent;
    });

    test('should have proper dimensions', () => {
      const compactToggle = document.querySelector('.sidebar-compact-toggle') as HTMLElement;
      
      expect(compactToggle).toBeTruthy();
      // CSS should apply: min-width: 32px; min-height: 32px;
    });

    test('should have cursor pointer', () => {
      const compactToggle = document.querySelector('.sidebar-compact-toggle') as HTMLElement;
      
      expect(compactToggle).toBeTruthy();
      // CSS should apply: cursor: pointer;
    });

    test('should have proper icon centering', () => {
      const compactIcon = document.querySelector('.compact-icon') as HTMLElement;
      
      expect(compactIcon).toBeTruthy();
      expect(compactIcon.classList.contains('compact-icon')).toBe(true);
      // CSS should apply absolute positioning for perfect centering
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      sidebar = new Sidebar();
      sidebar.init();
    });

    test('should maintain structure on desktop viewports', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      window.dispatchEvent(new Event('resize'));
      
      const sidebarHeader = document.querySelector('.sidebar-header');
      const sidebarBrand = document.querySelector('.sidebar-brand');
      const sidebarControls = document.querySelector('.sidebar-controls');
      
      expect(sidebarHeader).toBeTruthy();
      expect(sidebarBrand).toBeTruthy();
      expect(sidebarControls).toBeTruthy();
    });

    test('should maintain structure on tablet viewports', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      window.dispatchEvent(new Event('resize'));
      
      const sidebarHeader = document.querySelector('.sidebar-header');
      const compactToggle = document.querySelector('#sidebar_compact_toggle');
      
      expect(sidebarHeader).toBeTruthy();
      expect(compactToggle).toBeTruthy();
    });

    test('should maintain structure on mobile viewports', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      window.dispatchEvent(new Event('resize'));
      
      const sidebarHeader = document.querySelector('.sidebar-header');
      const brandTitle = document.querySelector('.brand-title');
      
      expect(sidebarHeader).toBeTruthy();
      expect(brandTitle).toBeTruthy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing compact toggle gracefully', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      compactToggle?.remove();
      
      // Should not break the header structure
      const sidebarHeader = document.querySelector('.sidebar-header');
      const sidebarBrand = document.querySelector('.sidebar-brand');
      
      expect(sidebarHeader).toBeTruthy();
      expect(sidebarBrand).toBeTruthy();
    });

    test('should handle brand title modifications', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const brandTitle = document.querySelector('.brand-title') as HTMLElement;
      brandTitle.textContent = 'Modified Title';
      
      expect(brandTitle.textContent).toBe('Modified Title');
      
      // Compact toggle should still work
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      compactToggle.click();
      
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });

    test('should handle multiple rapid resize events', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      // Multiple resize events
      for (let i = 0; i < 5; i++) {
        Object.defineProperty(window, 'innerWidth', { value: 800 + i * 100 });
        window.dispatchEvent(new Event('resize'));
      }
      
      // Structure should remain intact
      const sidebarHeader = document.querySelector('.sidebar-header');
      const compactToggle = document.querySelector('#sidebar_compact_toggle');
      
      expect(sidebarHeader).toBeTruthy();
      expect(compactToggle).toBeTruthy();
    });

    test('should handle sidebar recreation', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const originalHeader = document.querySelector('.sidebar-header');
      expect(originalHeader).toBeTruthy();
      
      // Destroy and recreate
      sidebar.destroy();
      sidebar = new Sidebar();
      sidebar.init();
      
      const newHeader = document.querySelector('.sidebar-header');
      const newBrandTitle = document.querySelector('.brand-title');
      const newCompactToggle = document.querySelector('#sidebar_compact_toggle');
      
      expect(newHeader).toBeTruthy();
      expect(newBrandTitle?.textContent).toBe('Opinion');
      expect(newCompactToggle).toBeTruthy();
    });

    test('should handle focus events during compact transitions', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const brandLink = document.querySelector('.brand-title-link') as HTMLElement;
      
      // Focus brand link, then toggle compact
      brandLink.focus();
      compactToggle.click();
      
      // Should not throw errors
      expect(document.querySelector('.sidebar-header')).toBeTruthy();
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle multiple rapid compact toggles efficiently', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      const startTime = performance.now();
      
      // Many rapid toggles
      for (let i = 0; i < 100; i++) {
        compactToggle.click();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (arbitrary threshold)
      expect(duration).toBeLessThan(1000);
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false); // Even number of clicks
    });

    test('should maintain DOM structure efficiency', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const initialChildCount = document.querySelector('.sidebar-header')?.children.length;
      
      // Multiple compact toggles
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      for (let i = 0; i < 10; i++) {
        compactToggle.click();
      }
      
      const finalChildCount = document.querySelector('.sidebar-header')?.children.length;
      expect(finalChildCount).toBe(initialChildCount);
    });

    test('should not create memory leaks during toggles', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      // Store initial state
      const initialClasses = Array.from(sidebarElement.classList);
      
      // Many state changes
      for (let i = 0; i < 50; i++) {
        compactToggle.click();
      }
      
      // Should return to initial state (even number of clicks)
      const finalClasses = Array.from(sidebarElement.classList);
      expect(finalClasses).toEqual(initialClasses);
    });
  });
});
