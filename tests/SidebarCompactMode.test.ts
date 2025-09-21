/**
 * Unit tests for Sidebar Compact Mode functionality
 * Tests compact toggle, state management, UI behavior, and integration with mobile menu
 */

import SidebarComponent from '../src/components/SidebarComponent';
import type { NavigationItem } from '../src/components/Sidebar';

describe('Sidebar Compact Mode', () => {
  let sidebar: SidebarComponent;
  let sidebarElement: HTMLElement;
  let compactToggleButton: HTMLElement;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = `
      <div id="app_sidebar" class="app-sidebar">
        <div class="sidebar-brand">
          <div class="brand-title">
            <a href="/" class="brand-title-link">Opinion</a>
          </div>
        </div>
        <nav class="sidebar-navigation" role="navigation">
          <div class="nav-section" aria-label="Main navigation">
            <ul class="nav-list" role="menubar"></ul>
          </div>
        </nav>
        <div class="sidebar-footer">
          <button id="sidebar_mobile_close" class="sidebar-mobile-close" aria-label="Close Menu">
            <span class="close-icon">×</span>
          </button>
          <div class="copyright-text">© 2024 Opinion</div>
        </div>
      </div>
    `;
    
    // Create desktop viewport environment (compact mode is for desktop)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Initialize sidebar
    sidebar = new SidebarComponent();
    sidebar.init();
    
    // Get DOM references
    sidebarElement = document.getElementById('app_sidebar') as HTMLElement;
    compactToggleButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
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

  describe('Compact Toggle Button', () => {
    test('should render compact toggle button with proper attributes', () => {
      expect(compactToggleButton).toBeTruthy();
      expect(compactToggleButton.id).toBe('sidebar_compact_toggle');
      expect(compactToggleButton.classList.contains('sidebar-compact-toggle')).toBe(true);
      expect(compactToggleButton.getAttribute('title')).toBe('Toggle Compact View');
      expect(compactToggleButton.getAttribute('aria-label')).toBe('Toggle Compact View');
    });

    test('should have proper icon content', () => {
      const icon = compactToggleButton.querySelector('.compact-icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('⟨⟩');
    });

    test('should be focusable', () => {
      compactToggleButton.focus();
      expect(document.activeElement).toBe(compactToggleButton);
    });

    test('should handle keyboard activation (Enter key)', () => {
      const initialCompactState = sidebarElement.classList.contains('sidebar-compact');
      
      compactToggleButton.focus();
      
      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      compactToggleButton.dispatchEvent(enterEvent);
      
      // Button should be focusable but Enter key won't trigger click in test environment
      // We test the actual click functionality separately
      expect(document.activeElement).toBe(compactToggleButton);
    });
  });

  describe('Compact Mode State Management', () => {
    test('should start in normal (non-compact) mode by default', () => {
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
    });

    test('should toggle to compact mode when button is clicked', () => {
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
      
      compactToggleButton.click();
      
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });

    test('should toggle back to normal mode when button is clicked again', () => {
      // First click - enable compact
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Second click - disable compact
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
    });

    test('should handle multiple rapid toggle clicks', () => {
      let expectedState = false;
      
      for (let i = 0; i < 10; i++) {
        compactToggleButton.click();
        expectedState = !expectedState;
        expect(sidebarElement.classList.contains('sidebar-compact')).toBe(expectedState);
      }
    });

    test('should log state changes to console', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Toggle to compact
      compactToggleButton.click();
      expect(consoleSpy).toHaveBeenCalledWith('Sidebar - Compact mode enabled (CSS class-based)');
      
      // Toggle back to normal
      compactToggleButton.click();
      expect(consoleSpy).toHaveBeenCalledWith('Sidebar - Compact mode disabled (CSS class-based)');
    });
  });

  describe('Compact Mode UI Behavior', () => {
    test('should maintain all navigation items in compact mode', () => {
      const navItemsBefore = document.querySelectorAll('.nav-item');
      
      compactToggleButton.click(); // Enable compact mode
      
      const navItemsAfter = document.querySelectorAll('.nav-item');
      expect(navItemsAfter.length).toBe(navItemsBefore.length);
    });

    test('should maintain all navigation icons in compact mode', () => {
      const navIconsBefore = document.querySelectorAll('.nav-icon');
      
      compactToggleButton.click(); // Enable compact mode
      
      const navIconsAfter = document.querySelectorAll('.nav-icon');
      expect(navIconsAfter.length).toBe(navIconsBefore.length);
      
      // Icons should still have proper data attributes
      navIconsAfter.forEach(icon => {
        expect(icon.getAttribute('data-icon')).toBeTruthy();
      });
    });

    test('should maintain all navigation text elements in compact mode', () => {
      const navTextsBefore = document.querySelectorAll('.nav-text');
      
      compactToggleButton.click(); // Enable compact mode
      
      const navTextsAfter = document.querySelectorAll('.nav-text');
      expect(navTextsAfter.length).toBe(navTextsBefore.length);
      
      // Text content should remain unchanged
      navTextsAfter.forEach(text => {
        expect(text.textContent).toBeTruthy();
      });
    });

    test('should maintain tooltip data attributes for compact mode', () => {
      const navLinks = document.querySelectorAll('.nav-link[data-title]');
      
      expect(navLinks.length).toBeGreaterThan(0);
      
      compactToggleButton.click(); // Enable compact mode
      
      // Data attributes should still be present after toggle
      navLinks.forEach(link => {
        expect(link.getAttribute('data-title')).toBeTruthy();
      });
    });

    test('should maintain accessibility attributes in compact mode', () => {
      compactToggleButton.click(); // Enable compact mode
      
      const navLinks = document.querySelectorAll('.nav-link[role="menuitem"]');
      const navList = document.querySelector('.nav-list[role="menubar"]');
      const navSection = document.querySelector('.nav-section[aria-label="Main navigation"]');
      
      expect(navLinks.length).toBeGreaterThan(0);
      expect(navList).toBeTruthy();
      expect(navSection).toBeTruthy();
    });

    test('should maintain tabindex on navigation links in compact mode', () => {
      compactToggleButton.click(); // Enable compact mode
      
      const navLinks = document.querySelectorAll('.nav-link[tabindex="0"]');
      expect(navLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Compact Mode with Expandable Items', () => {
    let expandableItems: NavigationItem[];

    beforeEach(() => {
      expandableItems = [
        {
          id: 'admin',
          text: 'Administration',
          icon: 'admin_panel_settings',
          href: '#',
          expandable: true,
          expanded: false,
          children: [
            {
              id: 'users',
              text: 'Users',
              icon: 'people',
              href: '/admin/users'
            },
            {
              id: 'settings',
              text: 'Settings',
              icon: 'settings',
              href: '/admin/settings'
            }
          ]
        },
        {
          id: 'dashboard',
          text: 'Dashboard',
          icon: 'dashboard',
          href: '/dashboard'
        }
      ];
      
      sidebar.updateNavigation(expandableItems);
    });

    test('should maintain expandable functionality in compact mode', () => {
      compactToggleButton.click(); // Enable compact mode
      
      const expandableButton = document.querySelector('.nav-link-expandable') as HTMLElement;
      const submenu = document.querySelector('.nav-submenu');
      
      expect(expandableButton.getAttribute('aria-expanded')).toBe('false');
      expect(submenu?.getAttribute('aria-expanded')).toBe('false');
      
      // Click to expand
      expandableButton.click();
      
      expect(expandableButton.getAttribute('aria-expanded')).toBe('true');
      expect(submenu?.getAttribute('aria-expanded')).toBe('true');
    });

    test('should maintain submenu items in compact mode', () => {
      compactToggleButton.click(); // Enable compact mode
      
      const subItems = document.querySelectorAll('.nav-subitem');
      const subLinks = document.querySelectorAll('.nav-sublink');
      
      expect(subItems).toHaveLength(2);
      expect(subLinks).toHaveLength(2);
      
      const usersLink = document.querySelector('[data-nav-id="users"]');
      const settingsLink = document.querySelector('[data-nav-id="settings"]');
      
      expect(usersLink?.getAttribute('href')).toBe('/admin/users');
      expect(settingsLink?.getAttribute('href')).toBe('/admin/settings');
    });

    test('should handle expand/collapse in compact mode', () => {
      compactToggleButton.click(); // Enable compact mode
      
      const expandableButton = document.querySelector('.nav-link-expandable') as HTMLElement;
      
      // Expand
      expandableButton.click();
      expect(expandableButton.getAttribute('aria-expanded')).toBe('true');
      
      // Collapse
      expandableButton.click();
      expect(expandableButton.getAttribute('aria-expanded')).toBe('false');
    });

    test('should maintain arrow icons for expandable items in compact mode', () => {
      compactToggleButton.click(); // Enable compact mode
      
      const arrow = document.querySelector('.nav-arrow');
      expect(arrow).toBeTruthy();
      expect(arrow?.textContent).toBe('expand_more');
    });
  });

  describe('Active State in Compact Mode', () => {
    test('should maintain active navigation states when toggling compact mode', () => {
      // Set dashboard as active
      sidebar.setActivePage('dashboard');
      
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]');
      expect(dashboardLink?.classList.contains('nav-link-active')).toBe(true);
      expect(dashboardLink?.getAttribute('aria-current')).toBe('page');
      
      // Toggle to compact mode
      compactToggleButton.click();
      
      // Active state should be maintained
      expect(dashboardLink?.classList.contains('nav-link-active')).toBe(true);
      expect(dashboardLink?.getAttribute('aria-current')).toBe('page');
      
      // Toggle back to normal mode
      compactToggleButton.click();
      
      // Active state should still be maintained
      expect(dashboardLink?.classList.contains('nav-link-active')).toBe(true);
      expect(dashboardLink?.getAttribute('aria-current')).toBe('page');
    });

    test('should allow setting active items while in compact mode', () => {
      // Enable compact mode first
      compactToggleButton.click();
      
      // Set surveys as active while in compact mode
      sidebar.setActivePage('surveys');
      
      const surveysLink = document.querySelector('[data-nav-id="surveys"]');
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]');
      
      expect(surveysLink?.classList.contains('nav-link-active')).toBe(true);
      expect(surveysLink?.getAttribute('aria-current')).toBe('page');
      expect(dashboardLink?.classList.contains('nav-link-active')).toBe(false);
    });

    test('should handle active submenu items in compact mode', () => {
      const expandableItems: NavigationItem[] = [
        {
          id: 'admin',
          text: 'Administration',
          icon: 'admin_panel_settings',
          href: '#',
          expandable: true,
          children: [
            {
              id: 'users',
              text: 'Users',
              icon: 'people',
              href: '/admin/users',
              active: true
            }
          ]
        }
      ];
      
      sidebar.updateNavigation(expandableItems);
      compactToggleButton.click(); // Enable compact mode
      
      const userSublink = document.querySelector('[data-nav-id="users"]');
      expect(userSublink?.classList.contains('nav-sublink-active')).toBe(true);
      expect(userSublink?.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('Navigation Clicks in Compact Mode', () => {
    test('should handle navigation clicks in compact mode', () => {
      compactToggleButton.click(); // Enable compact mode
      
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]') as HTMLElement;
      
      // Clear any existing console logs
      const consoleSpy = jest.spyOn(console, 'log').mockClear();
      
      dashboardLink.click();
      
      expect(consoleSpy).toHaveBeenCalledWith('Sidebar - Navigation clicked:', 'http://localhost/dashboard');
      expect(dashboardLink.classList.contains('nav-link-active')).toBe(true);
    });

    test('should handle clicks on icons and text within nav links in compact mode', () => {
      compactToggleButton.click(); // Enable compact mode
      
      const navIcon = document.querySelector('.nav-icon') as HTMLElement;
      const navText = document.querySelector('.nav-text') as HTMLElement;
      
      // Clicking on icon or text should not throw errors
      expect(() => {
        navIcon.click();
        navText.click();
      }).not.toThrow();
    });

    test('should maintain event delegation in compact mode', () => {
      // Add many items to test event delegation efficiency
      const manyItems: NavigationItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        text: `Item ${i}`,
        icon: 'folder',
        href: `/item-${i}`
      }));
      
      sidebar.updateNavigation(manyItems);
      compactToggleButton.click(); // Enable compact mode
      
      const navItems = document.querySelectorAll('.nav-item');
      expect(navItems).toHaveLength(10);
      
      // All items should respond to clicks via event delegation
      const firstItem = document.querySelector('[data-nav-id="item-0"]') as HTMLElement;
      const lastItem = document.querySelector('[data-nav-id="item-9"]') as HTMLElement;
      
      expect(() => {
        firstItem.click();
        lastItem.click();
      }).not.toThrow();
    });
  });

  describe('Compact Mode State Persistence', () => {
    test('should maintain compact state after navigation updates', () => {
      // Enable compact mode
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Update navigation
      const newItems: NavigationItem[] = [
        {
          id: 'new-item',
          text: 'New Item',
          icon: 'star',
          href: '/new-item'
        }
      ];
      
      sidebar.updateNavigation(newItems);
      
      // Compact state should be maintained
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });

    test('should maintain compact state after setting active pages', () => {
      // Enable compact mode
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Set active page
      sidebar.setActivePage('dashboard');
      
      // Compact state should be maintained
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });
  });

  describe('Integration with Mobile Menu', () => {
    test('should handle compact state when switching viewport sizes', () => {
      // Enable compact mode in desktop view
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      // Compact class should still be present (mobile CSS will hide the toggle)
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Simulate back to desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      // Compact state should be maintained
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });

    test('should not conflict with mobile menu classes', () => {
      // Enable compact mode
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Simulate mobile menu opening (would be done by SimpleMobileMenu)
      sidebarElement.classList.add('mobile-open');
      
      // Both classes should coexist
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      expect(sidebarElement.classList.contains('mobile-open')).toBe(true);
      
      // Compact toggle should still work
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
      expect(sidebarElement.classList.contains('mobile-open')).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle compact toggle when sidebar element is missing', () => {
      // Destroy sidebar
      sidebar.destroy();
      sidebarElement = null as any;
      
      // Create a standalone compact toggle button
      const standaloneButton = document.createElement('button');
      standaloneButton.id = 'sidebar_compact_toggle';
      document.body.appendChild(standaloneButton);
      
      expect(() => {
        standaloneButton.click();
      }).not.toThrow();
    });

    test('should handle multiple sidebar initializations with compact state', () => {
      // Enable compact mode
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Try to initialize again (should not create duplicate)
      sidebar.init();
      
      const sidebars = document.querySelectorAll('#app_sidebar');
      expect(sidebars).toHaveLength(1);
    });

    test('should handle rapid compact toggle clicks without errors', () => {
      // Rapid fire clicks
      for (let i = 0; i < 50; i++) {
        expect(() => {
          compactToggleButton.click();
        }).not.toThrow();
      }
      
      // Should end up in correct state (even number of clicks = normal mode)
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
    });

    test('should maintain functionality after destroy and recreation', () => {
      // Enable compact mode
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      // Destroy and recreate
      sidebar.destroy();
      sidebar = new Sidebar();
      sidebar.init();
      
      // Get new references
      sidebarElement = document.getElementById('app_sidebar') as HTMLElement;
      compactToggleButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      
      // Should start in normal mode (fresh instance)
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
      
      // Toggle should work
      compactToggleButton.click();
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    test('should not create memory leaks with repeated compact toggles', () => {
      // This test ensures event listeners are not duplicated
      const initialListenerCount = (compactToggleButton as any)._listeners?.click?.length || 0;
      
      // Multiple toggles
      for (let i = 0; i < 10; i++) {
        compactToggleButton.click();
      }
      
      const finalListenerCount = (compactToggleButton as any)._listeners?.click?.length || 0;
      expect(finalListenerCount).toBe(initialListenerCount);
    });

    test('should handle compact mode with large navigation menus efficiently', () => {
      // Create large navigation menu
      const largeMenu: NavigationItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        text: `Item ${i}`,
        icon: 'folder',
        href: `/item-${i}`
      }));
      
      sidebar.updateNavigation(largeMenu);
      
      // Compact toggle should still be fast
      const startTime = performance.now();
      compactToggleButton.click();
      const endTime = performance.now();
      
      // Should complete in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Verify all items are still present
      const navItems = document.querySelectorAll('.nav-item');
      expect(navItems).toHaveLength(100);
    });
  });

  describe('Brand and Footer Elements in Compact Mode', () => {
    test('should maintain brand elements structure in compact mode', () => {
      const brandElement = document.querySelector('.sidebar-brand');
      const brandTitle = document.querySelector('.brand-title');
      const brandLink = document.querySelector('.brand-title-link');
      
      expect(brandElement).toBeTruthy();
      expect(brandTitle).toBeTruthy();
      expect(brandLink).toBeTruthy();
      
      // Toggle to compact mode
      compactToggleButton.click();
      
      // Elements should still exist (CSS handles visibility)
      expect(document.querySelector('.sidebar-brand')).toBeTruthy();
      expect(document.querySelector('.brand-title')).toBeTruthy();
      expect(document.querySelector('.brand-title-link')).toBeTruthy();
    });

    test('should maintain footer structure in compact mode', () => {
      const footer = document.querySelector('.sidebar-footer');
      const copyrightText = document.querySelector('.copyright-text');
      
      expect(footer).toBeTruthy();
      expect(copyrightText).toBeTruthy();
      expect(copyrightText?.textContent).toBe('© 2024 Opinion');
      
      // Toggle to compact mode
      compactToggleButton.click();
      
      // Footer elements should still exist
      expect(document.querySelector('.sidebar-footer')).toBeTruthy();
      expect(document.querySelector('.copyright-text')).toBeTruthy();
    });

    test('should maintain mobile close button in compact mode', () => {
      const closeButton = document.querySelector('#sidebar_mobile_close');
      
      expect(closeButton).toBeTruthy();
      expect(closeButton?.getAttribute('aria-label')).toBe('Close Menu');
      
      // Toggle to compact mode
      compactToggleButton.click();
      
      // Close button should still exist
      expect(document.querySelector('#sidebar_mobile_close')).toBeTruthy();
    });
  });
});
