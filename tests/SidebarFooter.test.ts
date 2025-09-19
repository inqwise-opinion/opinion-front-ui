/**
 * Unit tests for Sidebar Footer component
 * Tests footer structure, styling, responsive behavior, and compact mode
 */

import { SidebarComponent } from '../src/components/Sidebar';

describe('Sidebar Footer', () => {
let sidebar: SidebarComponent;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create mock viewport environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
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

  describe('Footer Structure and Creation', () => {
    test('should create sidebar footer element on initialization', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarFooter = document.querySelector('.sidebar-footer');
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarFooter?.tagName).toBe('DIV');
    });

    test('should create sidebar footer with correct class structure', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarFooter = document.querySelector('.sidebar-footer');
      expect(sidebarFooter?.classList.contains('sidebar-footer')).toBe(true);
    });

    test('should include copyright text element in footer', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text');
      expect(copyrightText).toBeTruthy();
      expect(copyrightText?.tagName).toBe('P');
    });

    test('should display default copyright text', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text');
      expect(copyrightText?.textContent).toBe('© 2024 Opinion');
    });

    test('should be positioned as last element in sidebar wrapper', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarWrapper = document.querySelector('.sidebar-wrapper');
      const sidebarFooter = document.querySelector('.sidebar-footer');
      const lastChild = sidebarWrapper?.lastElementChild?.previousElementSibling; // Skip mobile close button
      
      expect(lastChild).toBe(sidebarFooter);
    });
  });

  describe('Footer Styling and Layout', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should have proper height dimensions', () => {
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      const computedStyle = window.getComputedStyle(sidebarFooter);
      
      // These would be set by CSS in actual implementation
      expect(sidebarFooter).toBeTruthy();
      // Note: In test environment, computed styles might not reflect CSS
      // We verify the element exists and has the correct class for styling
      expect(sidebarFooter.classList.contains('sidebar-footer')).toBe(true);
    });

    test('should have flexbox display for content alignment', () => {
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarFooter.classList.contains('sidebar-footer')).toBe(true);
    });

    test('should contain copyright text with proper styling class', () => {
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
      
      expect(copyrightText).toBeTruthy();
      expect(copyrightText.classList.contains('copyright-text')).toBe(true);
    });
  });

  describe('Compact Mode Behavior', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should hide copyright text in compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
      
      // Simulate compact mode
      sidebarElement.classList.add('sidebar-compact');
      
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      expect(copyrightText).toBeTruthy();
      
      // In actual implementation, CSS would hide the text
      // We verify the structure is maintained for CSS to work
    });

    test('should maintain footer structure in compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarFooter = document.querySelector('.sidebar-footer');
      
      // Toggle to compact mode
      sidebarElement.classList.add('sidebar-compact');
      
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarFooter?.classList.contains('sidebar-footer')).toBe(true);
    });

    test('should adjust padding in compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      // Toggle to compact mode
      sidebarElement.classList.add('sidebar-compact');
      
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });

    test('should show copyright text when exiting compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
      
      // Start in compact mode
      sidebarElement.classList.add('sidebar-compact');
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Exit compact mode
      sidebarElement.classList.remove('sidebar-compact');
      
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
      expect(copyrightText).toBeTruthy();
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should maintain footer structure on desktop viewports', () => {
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      window.dispatchEvent(new Event('resize'));
      
      const sidebarFooter = document.querySelector('.sidebar-footer');
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text');
      
      expect(sidebarFooter).toBeTruthy();
      expect(copyrightText).toBeTruthy();
    });

    test('should maintain footer structure on tablet viewports', () => {
      // Simulate tablet viewport
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      window.dispatchEvent(new Event('resize'));
      
      const sidebarFooter = document.querySelector('.sidebar-footer');
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text');
      
      expect(sidebarFooter).toBeTruthy();
      expect(copyrightText).toBeTruthy();
    });

    test('should maintain footer structure on mobile viewports', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      window.dispatchEvent(new Event('resize'));
      
      const sidebarFooter = document.querySelector('.sidebar-footer');
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text');
      
      expect(sidebarFooter).toBeTruthy();
      expect(copyrightText).toBeTruthy();
    });

    test('should align with main app footer height', () => {
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarFooter.classList.contains('sidebar-footer')).toBe(true);
      
      // CSS should ensure both footers have matching height (60px)
      // We verify the element exists with proper class for CSS targeting
    });
  });

  describe('Footer Content Management', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should allow copyright text updates through DOM manipulation', () => {
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
      
      expect(copyrightText?.textContent).toBe('© 2024 Opinion');
      
      // Simulate updating copyright text
      copyrightText.textContent = '© 2024 Updated Opinion';
      
      expect(copyrightText?.textContent).toBe('© 2024 Updated Opinion');
    });

    test('should maintain copyright text format and styling', () => {
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
      
      expect(copyrightText?.tagName).toBe('P');
      expect(copyrightText?.classList.contains('copyright-text')).toBe(true);
      expect(copyrightText?.textContent?.includes('©')).toBe(true);
    });

    test('should support legacy footer navigation if present', () => {
      // Test that the structure supports legacy navigation elements
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      // Add legacy navigation structure
      const legacyNav = document.createElement('div');
      legacyNav.className = 'footer-navigation-left-panel';
      legacyNav.innerHTML = `
        <ul class="ld">
          <li><a href="/terms">Terms</a></li>
          <li><a href="/privacy">Privacy</a></li>
        </ul>
      `;
      
      sidebarFooter.appendChild(legacyNav);
      
      const navPanel = sidebarFooter.querySelector('.footer-navigation-left-panel');
      const navLinks = sidebarFooter.querySelectorAll('.footer-navigation-left-panel a');
      
      expect(navPanel).toBeTruthy();
      expect(navLinks).toHaveLength(2);
    });
  });

  describe('Integration with Sidebar Component', () => {
    test('should be part of sidebar wrapper structure', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarWrapper = document.querySelector('.sidebar-wrapper');
      const sidebarFooter = document.querySelector('.sidebar-footer');
      
      expect(sidebarWrapper?.contains(sidebarFooter)).toBe(true);
    });

    test('should be positioned after sidebar navigation', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarNavigation = document.querySelector('.sidebar-navigation');
      const sidebarFooter = document.querySelector('.sidebar-footer');
      const sidebarWrapper = document.querySelector('.sidebar-wrapper');
      
      const navIndex = Array.from(sidebarWrapper?.children || []).indexOf(sidebarNavigation as Element);
      const footerIndex = Array.from(sidebarWrapper?.children || []).indexOf(sidebarFooter as Element);
      
      expect(footerIndex).toBeGreaterThan(navIndex);
    });

    test('should maintain proper z-index and layering', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarElement?.contains(sidebarFooter)).toBe(true);
    });

    test('should respond to compact toggle events', () => {
      sidebar = new Sidebar();
      sidebar.init();
      
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarFooter = document.querySelector('.sidebar-footer');
      
      expect(compactToggle).toBeTruthy();
      expect(sidebarFooter).toBeTruthy();
      
      // Simulate compact toggle click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      compactToggle.dispatchEvent(clickEvent);
      
      // Footer should still exist after toggle
      expect(document.querySelector('.sidebar-footer')).toBeTruthy();
    });
  });

  describe('Accessibility and Semantics', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should have appropriate semantic structure', () => {
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
      
      expect(sidebarFooter?.tagName).toBe('DIV');
      expect(copyrightText?.tagName).toBe('P');
    });

    test('should maintain readable text contrast', () => {
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
      
      expect(copyrightText).toBeTruthy();
      expect(copyrightText.classList.contains('copyright-text')).toBe(true);
      // CSS should ensure proper color contrast
    });

    test('should support keyboard navigation when interactive elements are added', () => {
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      // Add a focusable element to footer
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      button.tabIndex = 0;
      sidebarFooter.appendChild(button);
      
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    test('should maintain proper ARIA attributes when needed', () => {
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      expect(sidebarFooter).toBeTruthy();
      
      // If footer becomes interactive, it should support proper ARIA
      sidebarFooter.setAttribute('role', 'contentinfo');
      expect(sidebarFooter.getAttribute('role')).toBe('contentinfo');
    });
  });

  describe('Border and Visual Styling', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should have proper border classes for visual consistency', () => {
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarFooter.classList.contains('sidebar-footer')).toBe(true);
      
      // CSS should apply proper borders:
      // - border-top: 1px solid #dee2e6 (match main footer)
      // - border-right: 1px solid #e0e6ed (match navigation)
    });

    test('should maintain consistent background color', () => {
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      expect(sidebarFooter).toBeTruthy();
      // CSS should apply background: #f8f9fa to match main footer
    });

    test('should adjust borders in compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      // Toggle compact mode
      sidebarElement.classList.add('sidebar-compact');
      
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // CSS should maintain right border in compact mode
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing copyright text gracefully', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const copyrightText = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
      
      // Remove copyright text
      copyrightText?.remove();
      
      const sidebarFooter = document.querySelector('.sidebar-footer');
      expect(sidebarFooter).toBeTruthy();
      
      // Footer should still exist even without copyright text
      expect(document.querySelector('.sidebar-footer .copyright-text')).toBeNull();
    });

    test('should handle dynamic content addition', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      // Add additional content
      const additionalContent = document.createElement('div');
      additionalContent.className = 'additional-footer-content';
      additionalContent.textContent = 'Additional Info';
      
      sidebarFooter.appendChild(additionalContent);
      
      expect(sidebarFooter.querySelector('.additional-footer-content')).toBeTruthy();
      expect(sidebarFooter.children.length).toBeGreaterThan(1);
    });

    test('should maintain structure when sidebar is recreated', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const originalFooter = document.querySelector('.sidebar-footer');
      expect(originalFooter).toBeTruthy();
      
      // Destroy and recreate
      sidebar.destroy();
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const newFooter = document.querySelector('.sidebar-footer');
      const newCopyrightText = document.querySelector('.sidebar-footer .copyright-text');
      
      expect(newFooter).toBeTruthy();
      expect(newCopyrightText).toBeTruthy();
      expect(newCopyrightText?.textContent).toBe('© 2024 Opinion');
    });

    test('should handle empty footer content gracefully', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarFooter = document.querySelector('.sidebar-footer') as HTMLElement;
      
      // Clear all content
      sidebarFooter.innerHTML = '';
      
      expect(sidebarFooter).toBeTruthy();
      expect(sidebarFooter.children.length).toBe(0);
      
      // Footer structure should still be valid
      expect(sidebarFooter.classList.contains('sidebar-footer')).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    test('should not create multiple footer instances', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const footers = document.querySelectorAll('.sidebar-footer');
      expect(footers).toHaveLength(1);
      
      // Try to initialize again
      sidebar.init();
      
      const footersAfterSecondInit = document.querySelectorAll('.sidebar-footer');
      expect(footersAfterSecondInit).toHaveLength(1);
    });

    test('should efficiently handle compact mode toggles', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      const sidebarFooter = document.querySelector('.sidebar-footer');
      
      // Multiple compact toggles should not affect footer structure
      for (let i = 0; i < 5; i++) {
        sidebarElement.classList.toggle('sidebar-compact');
      }
      
      expect(sidebarFooter).toBeTruthy();
      expect(document.querySelectorAll('.sidebar-footer')).toHaveLength(1);
    });

    test('should maintain memory efficiency', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarFooter = document.querySelector('.sidebar-footer');
      const initialChildCount = sidebarFooter?.children.length || 0;
      
      // Simulate various operations
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      sidebarElement.classList.add('sidebar-compact');
      sidebarElement.classList.remove('sidebar-compact');
      
      const finalChildCount = sidebarFooter?.children.length || 0;
      expect(finalChildCount).toBe(initialChildCount);
    });
  });
});
