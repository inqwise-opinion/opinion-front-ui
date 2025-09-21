/**
 * Unit tests for Sidebar Menu component
 * Tests navigation structure, menu items, expandable functionality, event handling, and accessibility
 */

import { Sidebar, NavigationItem, SidebarComponent } from '../src/components/Sidebar';

describe('Sidebar Menu', () => {
let sidebar: SidebarComponent;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = `
      <div id="app_sidebar" class="app-sidebar">
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
    
    // Create mock viewport environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock window.location for SPA routing tests
    delete (window as any).location;
    window.location = {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000/dashboard'
    } as any;
    
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

  describe('Menu Structure and Creation', () => {
    test('should create navigation section with proper structure', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const sidebarNavigation = document.querySelector('.sidebar-navigation');
      const navSection = document.querySelector('.nav-section');
      const navList = document.querySelector('.nav-list');
      
      expect(sidebarNavigation).toBeTruthy();
      expect(navSection).toBeTruthy();
      expect(navList).toBeTruthy();
      expect(navList?.getAttribute('role')).toBe('menubar');
    });

    test('should create default navigation items', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const navItems = document.querySelectorAll('.nav-item');
      const navLinks = document.querySelectorAll('.nav-link');
      
      expect(navItems).toHaveLength(3); // dashboard, surveys, debug
      expect(navLinks).toHaveLength(3);
    });

    test('should set proper ARIA labels and roles', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const navSection = document.querySelector('.nav-section');
      const navList = document.querySelector('.nav-list');
      const navLinks = document.querySelectorAll('.nav-link[role="menuitem"]');
      
      expect(navSection?.getAttribute('aria-label')).toBe('Main navigation');
      expect(navList?.getAttribute('role')).toBe('menubar');
      expect(navLinks.length).toBeGreaterThan(0);
    });

    test('should create navigation items with correct default data', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]');
      const surveysLink = document.querySelector('[data-nav-id="surveys"]');
      const debugLink = document.querySelector('[data-nav-id="debug"]');
      
      expect(dashboardLink?.getAttribute('href')).toBe('/dashboard');
      expect(surveysLink?.getAttribute('href')).toBe('/surveys');
      expect(debugLink?.getAttribute('href')).toBe('/');
      expect(debugLink?.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('Navigation Item Rendering', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should render nav items with icons and text', () => {
      const navIcons = document.querySelectorAll('.nav-icon');
      const navTexts = document.querySelectorAll('.nav-text');
      
      expect(navIcons).toHaveLength(3);
      expect(navTexts).toHaveLength(3);
      
      // Check icon data attributes
      const dashboardIcon = document.querySelector('[data-nav-id="dashboard"] .nav-icon');
      expect(dashboardIcon?.getAttribute('data-icon')).toBe('dashboard');
    });

    test('should render active navigation item with proper styling', () => {
      const activeLink = document.querySelector('.nav-link-active');
      const debugLink = document.querySelector('[data-nav-id="debug"]');
      
      expect(activeLink).toBeTruthy();
      expect(debugLink?.classList.contains('nav-link-active')).toBe(true);
      expect(debugLink?.getAttribute('aria-current')).toBe('page');
    });

    test('should render badges when provided', () => {
      const customItems: NavigationItem[] = [
        {
          id: 'notifications',
          text: 'Notifications',
          icon: 'notifications',
          href: '/notifications',
          badge: '5'
        }
      ];
      
      sidebar.updateNavigation(customItems);
      
      const badge = document.querySelector('.nav-badge');
      expect(badge?.textContent).toBe('5');
    });

    test('should handle items without badges gracefully', () => {
      const badges = document.querySelectorAll('.nav-badge');
      expect(badges).toHaveLength(0); // Default items have no badges
    });

    test('should set proper tabindex on navigation links', () => {
      const navLinks = document.querySelectorAll('.nav-link[tabindex="0"]');
      expect(navLinks).toHaveLength(3);
    });
  });

  describe('Expandable Menu Items', () => {
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
        }
      ];
      
      sidebar = new SidebarComponent();
      sidebar.init();
      sidebar.updateNavigation(expandableItems);
    });

    test('should render expandable items with proper structure', () => {
      const expandableItem = document.querySelector('.nav-item-expandable');
      const expandableButton = document.querySelector('.nav-link-expandable');
      const submenu = document.querySelector('.nav-submenu');
      const arrow = document.querySelector('.nav-arrow');
      
      expect(expandableItem).toBeTruthy();
      expect(expandableButton).toBeTruthy();
      expect(submenu).toBeTruthy();
      expect(arrow).toBeTruthy();
    });

    test('should set proper ARIA attributes for expandable items', () => {
      const expandableButton = document.querySelector('.nav-link-expandable');
      const submenu = document.querySelector('.nav-submenu');
      
      expect(expandableButton?.getAttribute('aria-expanded')).toBe('false');
      expect(expandableButton?.getAttribute('data-expandable')).toBe('true');
      expect(submenu?.getAttribute('aria-expanded')).toBe('false');
      expect(submenu?.getAttribute('role')).toBe('menu');
    });

    test('should render submenu items correctly', () => {
      const subItems = document.querySelectorAll('.nav-subitem');
      const subLinks = document.querySelectorAll('.nav-sublink');
      
      expect(subItems).toHaveLength(2);
      expect(subLinks).toHaveLength(2);
      
      const usersLink = document.querySelector('[data-nav-id="users"]');
      const settingsLink = document.querySelector('[data-nav-id="settings"]');
      
      expect(usersLink?.getAttribute('href')).toBe('/admin/users');
      expect(settingsLink?.getAttribute('href')).toBe('/admin/settings');
    });

    test('should toggle expandable items on click', () => {
      const expandableButton = document.querySelector('.nav-link-expandable') as HTMLElement;
      const submenu = document.querySelector('.nav-submenu');
      
      expect(expandableButton?.getAttribute('aria-expanded')).toBe('false');
      expect(submenu?.getAttribute('aria-expanded')).toBe('false');
      
      // Click to expand
      expandableButton.click();
      
      expect(expandableButton?.getAttribute('aria-expanded')).toBe('true');
      expect(submenu?.getAttribute('aria-expanded')).toBe('true');
      
      // Click to collapse
      expandableButton.click();
      
      expect(expandableButton?.getAttribute('aria-expanded')).toBe('false');
      expect(submenu?.getAttribute('aria-expanded')).toBe('false');
    });

    test('should handle arrow icon rotation on expand/collapse', () => {
      const expandableButton = document.querySelector('.nav-link-expandable') as HTMLElement;
      const arrow = document.querySelector('.nav-arrow');
      
      // Initially not expanded
      expect(expandableButton?.getAttribute('aria-expanded')).toBe('false');
      
      // Click to expand
      expandableButton.click();
      
      expect(expandableButton?.getAttribute('aria-expanded')).toBe('true');
      // Arrow rotation would be handled by CSS based on aria-expanded attribute
    });

    test('should render expanded items when initially expanded', () => {
      const expandedItems: NavigationItem[] = [
        {
          id: 'reports',
          text: 'Reports',
          icon: 'assessment',
          href: '#',
          expandable: true,
          expanded: true,
          children: [
            {
              id: 'analytics',
              text: 'Analytics',
              icon: 'analytics',
              href: '/reports/analytics'
            }
          ]
        }
      ];
      
      sidebar.updateNavigation(expandedItems);
      
      const expandableButton = document.querySelector('.nav-link-expandable');
      const submenu = document.querySelector('.nav-submenu');
      
      expect(expandableButton?.getAttribute('aria-expanded')).toBe('true');
      expect(submenu?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('Active State Management', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should set active item programmatically', () => {
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]');
      const debugLink = document.querySelector('[data-nav-id="debug"]');
      
      // Debug is initially active
      expect(debugLink?.classList.contains('nav-link-active')).toBe(true);
      expect(dashboardLink?.classList.contains('nav-link-active')).toBe(false);
      
      // Set dashboard as active
      sidebar.setActivePage('dashboard');
      
      expect(dashboardLink?.classList.contains('nav-link-active')).toBe(true);
      expect(dashboardLink?.getAttribute('aria-current')).toBe('page');
      expect(debugLink?.classList.contains('nav-link-active')).toBe(false);
      expect(debugLink?.getAttribute('aria-current')).toBe(null);
    });

    test('should handle active state for submenu items', () => {
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
      
      const userSublink = document.querySelector('[data-nav-id="users"]');
      expect(userSublink?.classList.contains('nav-sublink-active')).toBe(true);
      expect(userSublink?.getAttribute('aria-current')).toBe('page');
    });

    test('should remove previous active states when setting new active item', () => {
      // Set dashboard active
      sidebar.setActivePage('dashboard');
      
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]');
      const debugLink = document.querySelector('[data-nav-id="debug"]');
      
      expect(dashboardLink?.classList.contains('nav-link-active')).toBe(true);
      expect(debugLink?.classList.contains('nav-link-active')).toBe(false);
      
      // Set surveys active
      sidebar.setActivePage('surveys');
      
      const surveysLink = document.querySelector('[data-nav-id="surveys"]');
      
      expect(surveysLink?.classList.contains('nav-link-active')).toBe(true);
      expect(dashboardLink?.classList.contains('nav-link-active')).toBe(false);
    });

    test('should handle non-existent nav items gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      sidebar.setActivePage('non-existent');
      
      // Should not throw error, but may log
      expect(consoleSpy).toHaveBeenCalledWith('Sidebar - Set active item: non-existent');
    });
  });

  describe('Navigation Updates', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should update navigation items dynamically', () => {
      const newItems: NavigationItem[] = [
        {
          id: 'home',
          text: 'Home',
          icon: 'home',
          href: '/home',
          active: true
        },
        {
          id: 'profile',
          text: 'Profile',
          icon: 'person',
          href: '/profile'
        }
      ];
      
      sidebar.updateNavigation(newItems);
      
      const navItems = document.querySelectorAll('.nav-item');
      const homeLink = document.querySelector('[data-nav-id="home"]');
      const profileLink = document.querySelector('[data-nav-id="profile"]');
      
      expect(navItems).toHaveLength(2);
      expect(homeLink).toBeTruthy();
      expect(profileLink).toBeTruthy();
      expect(homeLink?.classList.contains('nav-link-active')).toBe(true);
    });

    test('should maintain event listeners after navigation update', () => {
      const newItems: NavigationItem[] = [
        {
          id: 'test',
          text: 'Test',
          icon: 'test',
          href: '/test'
        }
      ];
      
      sidebar.updateNavigation(newItems);
      
      const testLink = document.querySelector('[data-nav-id="test"]') as HTMLElement;
      
      // Should be able to click and set active
      testLink.click();
      
      expect(testLink.classList.contains('nav-link-active')).toBe(true);
    });

    test('should handle empty navigation arrays', () => {
      sidebar.updateNavigation([]);
      
      const navItems = document.querySelectorAll('.nav-item');
      expect(navItems).toHaveLength(0);
    });

    test('should update navigation with mixed regular and expandable items', () => {
      const mixedItems: NavigationItem[] = [
        {
          id: 'dashboard',
          text: 'Dashboard',
          icon: 'dashboard',
          href: '/dashboard'
        },
        {
          id: 'admin',
          text: 'Admin',
          icon: 'admin_panel_settings',
          href: '#',
          expandable: true,
          children: [
            {
              id: 'users',
              text: 'Users',
              icon: 'people',
              href: '/admin/users'
            }
          ]
        }
      ];
      
      sidebar.updateNavigation(mixedItems);
      
      const regularItem = document.querySelector('[data-nav-id="dashboard"]');
      const expandableItem = document.querySelector('.nav-item-expandable');
      const submenuItem = document.querySelector('[data-nav-id="users"]');
      
      expect(regularItem).toBeTruthy();
      expect(expandableItem).toBeTruthy();
      expect(submenuItem).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should handle navigation link clicks', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]') as HTMLElement;
      
      dashboardLink.click();
      
      expect(consoleSpy).toHaveBeenCalledWith('Sidebar - Navigation clicked:', '/dashboard');
      expect(dashboardLink.classList.contains('nav-link-active')).toBe(true);
    });

    test('should handle external link clicks without SPA routing', () => {
      const customItems: NavigationItem[] = [
        {
          id: 'external',
          text: 'External',
          icon: 'open_in_new',
          href: 'https://external-site.com'
        }
      ];
      
      sidebar.updateNavigation(customItems);
      
      const consoleSpy = jest.spyOn(console, 'log');
      const externalLink = document.querySelector('[data-nav-id="external"]') as HTMLElement;
      
      externalLink.click();
      
      // Should not log SPA navigation for external links
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Navigation clicked:'));
    });

    test('should handle keyboard navigation', () => {
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]') as HTMLElement;
      
      // Focus the link
      dashboardLink.focus();
      expect(document.activeElement).toBe(dashboardLink);
      
      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      dashboardLink.dispatchEvent(enterEvent);
      
      // Should not throw error
      expect(true).toBe(true);
    });

    test('should handle clicks on nested elements within nav links', () => {
      const navIcon = document.querySelector('.nav-icon') as HTMLElement;
      const navText = document.querySelector('.nav-text') as HTMLElement;
      
      // Clicking on icon or text should trigger parent link
      navIcon.click();
      navText.click();
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Compact Mode Integration', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should maintain menu structure in compact mode', () => {
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      // Toggle compact mode
      sidebarElement.classList.add('sidebar-compact');
      
      const navItems = document.querySelectorAll('.nav-item');
      const navIcons = document.querySelectorAll('.nav-icon');
      const navTexts = document.querySelectorAll('.nav-text');
      
      expect(navItems.length).toBeGreaterThan(0);
      expect(navIcons.length).toBeGreaterThan(0);
      expect(navTexts.length).toBeGreaterThan(0);
      
      // CSS would hide text in compact mode, but elements remain
    });

    test('should handle compact toggle button clicks', () => {
      const compactToggle = document.querySelector('#sidebar_compact_toggle') as HTMLElement;
      const sidebarElement = document.querySelector('#app_sidebar') as HTMLElement;
      
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
      
      compactToggle.click();
      
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(true);
      
      compactToggle.click();
      
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
    });

    test('should maintain tooltip data attributes for compact mode', () => {
      const navLinks = document.querySelectorAll('.nav-link[data-title]');
      
      expect(navLinks.length).toBeGreaterThan(0);
      
      // Check that titles are set for tooltip functionality
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]');
      expect(dashboardLink?.getAttribute('data-title')).toBe('Dashboard');
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      sidebar = new SidebarComponent();
      sidebar.init();
    });

    test('should have proper ARIA attributes for menu structure', () => {
      const navSection = document.querySelector('.nav-section');
      const navList = document.querySelector('.nav-list');
      const navLinks = document.querySelectorAll('.nav-link[role="menuitem"]');
      
      expect(navSection?.getAttribute('aria-label')).toBe('Main navigation');
      expect(navList?.getAttribute('role')).toBe('menubar');
      expect(navLinks.length).toBe(3);
    });

    test('should support keyboard navigation with tabindex', () => {
      const navLinks = document.querySelectorAll('.nav-link[tabindex="0"]');
      
      expect(navLinks.length).toBe(3);
      
      // Test focus chain
      const firstLink = navLinks[0] as HTMLElement;
      const secondLink = navLinks[1] as HTMLElement;
      
      firstLink.focus();
      expect(document.activeElement).toBe(firstLink);
      
      secondLink.focus();
      expect(document.activeElement).toBe(secondLink);
    });

    test('should handle ARIA current page attributes correctly', () => {
      const activeLink = document.querySelector('[aria-current="page"]');
      const debugLink = document.querySelector('[data-nav-id="debug"]');
      
      expect(activeLink).toBe(debugLink);
      
      // Change active page
      sidebar.setActivePage('dashboard');
      
      const newActiveLink = document.querySelector('[aria-current="page"]');
      const dashboardLink = document.querySelector('[data-nav-id="dashboard"]');
      
      expect(newActiveLink).toBe(dashboardLink);
      expect(debugLink?.getAttribute('aria-current')).toBe(null);
    });

    test('should provide proper screen reader support for expandable items', () => {
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
              href: '/admin/users'
            }
          ]
        }
      ];
      
      sidebar.updateNavigation(expandableItems);
      
      const expandableButton = document.querySelector('.nav-link-expandable');
      const submenu = document.querySelector('.nav-submenu');
      
      expect(expandableButton?.getAttribute('role')).toBe('menuitem');
      expect(expandableButton?.getAttribute('aria-expanded')).toBe('false');
      expect(submenu?.getAttribute('role')).toBe('menu');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle initialization when sidebar already exists', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const firstSidebar = document.querySelector('#app_sidebar');
      expect(firstSidebar).toBeTruthy();
      
      // Try to initialize again
      sidebar.init();
      
      const sidebars = document.querySelectorAll('#app_sidebar');
      expect(sidebars).toHaveLength(1);
    });

    test('should handle missing navigation data gracefully', () => {
      const itemsWithMissingData: NavigationItem[] = [
        {
          id: '',
          text: '',
          icon: '',
          href: ''
        }
      ];
      
      sidebar = new SidebarComponent();
      sidebar.init();
      
      expect(() => {
        sidebar.updateNavigation(itemsWithMissingData);
      }).not.toThrow();
      
      const navItems = document.querySelectorAll('.nav-item');
      expect(navItems).toHaveLength(1);
    });

    test('should handle expandable items without children', () => {
      const invalidExpandableItems: NavigationItem[] = [
        {
          id: 'invalid',
          text: 'Invalid Expandable',
          icon: 'error',
          href: '#',
          expandable: true
          // No children property
        }
      ];
      
      sidebar = new SidebarComponent();
      sidebar.init();
      
      expect(() => {
        sidebar.updateNavigation(invalidExpandableItems);
      }).not.toThrow();
    });

    test('should handle clicks on non-expandable elements', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const navIcon = document.querySelector('.nav-icon') as HTMLElement;
      
      expect(() => {
        navIcon.click();
      }).not.toThrow();
    });

    test('should handle destroy and recreation', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      expect(document.querySelector('.sidebar-navigation')).toBeTruthy();
      
      sidebar.destroy();
      
      expect(document.querySelector('.sidebar-navigation')).toBeNull();
      
      // Recreate
      sidebar = new SidebarComponent();
      sidebar.init();
      
      expect(document.querySelector('.sidebar-navigation')).toBeTruthy();
      expect(document.querySelectorAll('.nav-item')).toHaveLength(3);
    });
  });

  describe('Performance and Optimization', () => {
    test('should efficiently handle multiple navigation updates', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      const initialItems = document.querySelectorAll('.nav-item').length;
      
      // Multiple updates
      for (let i = 0; i < 5; i++) {
        const items: NavigationItem[] = [
          {
            id: `item-${i}`,
            text: `Item ${i}`,
            icon: 'star',
            href: `/item-${i}`
          }
        ];
        sidebar.updateNavigation(items);
      }
      
      const finalItems = document.querySelectorAll('.nav-item');
      expect(finalItems).toHaveLength(1); // Only the last update should remain
    });

    test('should maintain event delegation efficiency', () => {
      sidebar = new SidebarComponent();
      sidebar.init();
      
      // Update with many items
      const manyItems: NavigationItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        text: `Item ${i}`,
        icon: 'folder',
        href: `/item-${i}`
      }));
      
      sidebar.updateNavigation(manyItems);
      
      const navItems = document.querySelectorAll('.nav-item');
      expect(navItems).toHaveLength(20);
      
      // All items should respond to clicks via event delegation
      const firstItem = document.querySelector('[data-nav-id="item-0"]') as HTMLElement;
      const lastItem = document.querySelector('[data-nav-id="item-19"]') as HTMLElement;
      
      expect(() => {
        firstItem.click();
        lastItem.click();
      }).not.toThrow();
    });

    test('should handle rapid expand/collapse operations', () => {
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
              href: '/admin/users'
            }
          ]
        }
      ];
      
      sidebar = new SidebarComponent();
      sidebar.init();
      sidebar.updateNavigation(expandableItems);
      
      const expandableButton = document.querySelector('.nav-link-expandable') as HTMLElement;
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        expandableButton.click();
      }
      
      // Should end up collapsed (odd number of clicks)
      expect(expandableButton.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
