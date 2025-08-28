/**
 * Unit tests for AppFooter component
 * Tests component initialization, configuration, DOM manipulation, and responsiveness
 */

import { AppFooter, FooterConfig, FooterLink } from '../src/components/AppFooter';

describe('AppFooter', () => {
  let appFooter: AppFooter;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create a mock container that matches the expected structure
    mockContainer = document.createElement('div');
    mockContainer.className = 'wrapper-constructed';
    document.body.appendChild(mockContainer);
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Clean up footer instance
    if (appFooter) {
      appFooter.destroy();
    }
    
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create AppFooter instance with default config', () => {
      appFooter = new AppFooter();
      expect(appFooter).toBeInstanceOf(AppFooter);
    });

    test('should create AppFooter instance with custom config', () => {
      const customConfig: FooterConfig = {
        showCopyright: false,
        copyrightText: 'Custom copyright text',
        showNavigation: false,
        navigationLinks: []
      };
      
      appFooter = new AppFooter(customConfig);
      expect(appFooter).toBeInstanceOf(AppFooter);
    });

    test('should initialize footer and create DOM elements', () => {
      appFooter = new AppFooter();
      appFooter.init();
      
      const footerElement = document.querySelector('.app-footer');
      expect(footerElement).toBeTruthy();
      expect(footerElement?.tagName).toBe('FOOTER');
    });

    test('should log initialization messages', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      appFooter = new AppFooter();
      appFooter.init();
      
      expect(consoleSpy).toHaveBeenCalledWith('AppFooter - Initializing...');
      expect(consoleSpy).toHaveBeenCalledWith('AppFooter - Ready');
    });
  });

  describe('DOM Structure and Content', () => {
    test('should create footer with default copyright text', () => {
      appFooter = new AppFooter();
      appFooter.init();
      
      const copyrightElement = document.querySelector('.footer-copyright-text');
      expect(copyrightElement).toBeTruthy();
      expect(copyrightElement?.textContent).toBe('created by inqwise');
    });

    test('should create footer with custom copyright text', () => {
      const customText = 'Custom Footer Text';
      appFooter = new AppFooter({ copyrightText: customText });
      appFooter.init();
      
      const copyrightElement = document.querySelector('.footer-copyright-text');
      expect(copyrightElement?.textContent).toBe(customText);
    });

    test('should create footer with navigation links', () => {
      const navigationLinks: FooterLink[] = [
        { href: '/about', title: 'About Us', text: 'About Us' },
        { href: '/contact', title: 'Contact', text: 'Contact' }
      ];
      
      appFooter = new AppFooter({ navigationLinks });
      appFooter.init();
      
      const navPanel = document.querySelector('.footer-navigation-left-panel');
      const links = document.querySelectorAll('.footer-navigation-left-panel a');
      
      expect(navPanel).toBeTruthy();
      expect(links).toHaveLength(2);
      expect(links[0].getAttribute('href')).toBe('/about');
      expect(links[1].getAttribute('href')).toBe('/contact');
    });

    test('should hide copyright when showCopyright is false', () => {
      appFooter = new AppFooter({ showCopyright: false });
      appFooter.init();
      
      const copyrightSection = document.querySelector('.footer-copyright-section');
      expect(copyrightSection).toBeNull();
    });

    test('should hide navigation when showNavigation is false', () => {
      appFooter = new AppFooter({ showNavigation: false });
      appFooter.init();
      
      const navPanel = document.querySelector('.footer-navigation-left-panel');
      expect(navPanel).toBeNull();
    });
  });

  describe('Footer Placement', () => {
    test('should insert footer in wrapper-constructed container', () => {
      appFooter = new AppFooter();
      appFooter.init();
      
      const footer = document.querySelector('.app-footer');
      const parent = footer?.parentElement;
      
      expect(parent?.className).toBe('wrapper-constructed');
    });

    test('should fallback to wrapper-content if wrapper-constructed not found', () => {
      // Remove wrapper-constructed and add wrapper-content
      document.body.innerHTML = '';
      const wrapperContent = document.createElement('div');
      wrapperContent.className = 'wrapper-content';
      document.body.appendChild(wrapperContent);
      
      appFooter = new AppFooter();
      appFooter.init();
      
      const footer = document.querySelector('.app-footer');
      const parent = footer?.parentElement;
      
      expect(parent?.className).toBe('wrapper-content');
    });

    test('should fallback to body if no wrapper containers found', () => {
      // Remove all wrapper containers
      document.body.innerHTML = '';
      
      appFooter = new AppFooter();
      appFooter.init();
      
      const footer = document.querySelector('.app-footer');
      const parent = footer?.parentElement;
      
      expect(parent).toBe(document.body);
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(() => {
      appFooter = new AppFooter();
      appFooter.init();
    });

    test('should update configuration and recreate footer', () => {
      const newConfig: Partial<FooterConfig> = {
        copyrightText: 'Updated copyright text'
      };
      
      appFooter.updateConfig(newConfig);
      
      const copyrightElement = document.querySelector('.footer-copyright-text');
      expect(copyrightElement?.textContent).toBe('Updated copyright text');
    });

    test('should show/hide copyright text', () => {
      const copyrightElement = appFooter.getCopyrightElement();
      expect(copyrightElement).toBeTruthy();
      
      appFooter.showCopyright(false);
      expect(copyrightElement?.style.display).toBe('none');
      
      appFooter.showCopyright(true);
      expect(copyrightElement?.style.display).toBe('block');
    });

    test('should update copyright text directly', () => {
      const newText = 'Directly updated text';
      appFooter.updateCopyrightText(newText);
      
      const copyrightElement = document.querySelector('.footer-copyright-text');
      expect(copyrightElement?.textContent).toBe(newText);
    });
  });

  describe('Navigation Management', () => {
    beforeEach(() => {
      const initialLinks: FooterLink[] = [
        { href: '/initial', title: 'Initial', text: 'Initial' }
      ];
      appFooter = new AppFooter({ navigationLinks: initialLinks });
      appFooter.init();
    });

    test('should add navigation link', () => {
      const newLink: FooterLink = {
        href: '/new-link',
        title: 'New Link',
        text: 'New Link'
      };
      
      appFooter.addNavigationLink(newLink);
      
      const links = document.querySelectorAll('.footer-navigation-left-panel a');
      expect(links).toHaveLength(2);
      expect(links[1].getAttribute('href')).toBe('/new-link');
      expect(links[1].textContent).toBe('New Link');
    });

    test('should remove navigation link', () => {
      appFooter.removeNavigationLink('/initial');
      
      const links = document.querySelectorAll('.footer-navigation-left-panel a');
      expect(links).toHaveLength(0);
    });
  });

  describe('Layout Management', () => {
    beforeEach(() => {
      appFooter = new AppFooter();
      appFooter.init();
    });

    test('should update layout for compact sidebar', () => {
      const sidebarState = {
        compact: true,
        collapsed: false,
        mobile: false
      };
      
      appFooter.updateLayout(sidebarState);
      
      const footer = appFooter.getContainer();
      expect(footer?.classList.contains('footer-sidebar-compact')).toBe(true);
      expect(footer?.classList.contains('footer-sidebar-collapsed')).toBe(false);
      expect(footer?.classList.contains('footer-mobile')).toBe(false);
    });

    test('should update layout for collapsed sidebar', () => {
      const sidebarState = {
        compact: false,
        collapsed: true,
        mobile: false
      };
      
      appFooter.updateLayout(sidebarState);
      
      const footer = appFooter.getContainer();
      expect(footer?.classList.contains('footer-sidebar-compact')).toBe(false);
      expect(footer?.classList.contains('footer-sidebar-collapsed')).toBe(true);
      expect(footer?.classList.contains('footer-mobile')).toBe(false);
    });

    test('should update layout for mobile', () => {
      const sidebarState = {
        compact: false,
        collapsed: false,
        mobile: true
      };
      
      appFooter.updateLayout(sidebarState);
      
      const footer = appFooter.getContainer();
      expect(footer?.classList.contains('footer-sidebar-compact')).toBe(false);
      expect(footer?.classList.contains('footer-sidebar-collapsed')).toBe(false);
      expect(footer?.classList.contains('footer-mobile')).toBe(true);
    });

    test('should always show copyright text after layout update', () => {
      const sidebarState = {
        compact: true,
        collapsed: false,
        mobile: false
      };
      
      // Hide copyright first
      appFooter.showCopyright(false);
      const copyrightElement = appFooter.getCopyrightElement();
      expect(copyrightElement?.style.display).toBe('none');
      
      // Update layout should show it again
      appFooter.updateLayout(sidebarState);
      expect(copyrightElement?.style.display).toBe('block');
    });
  });

  describe('Visibility Control', () => {
    beforeEach(() => {
      appFooter = new AppFooter();
      appFooter.init();
    });

    test('should show/hide footer', () => {
      const footer = appFooter.getContainer();
      expect(footer).toBeTruthy();
      
      appFooter.setVisible(false);
      expect(footer?.style.display).toBe('none');
      
      appFooter.setVisible(true);
      expect(footer?.style.display).toBe('block');
    });
  });

  describe('Event Handling', () => {
    test('should handle navigation link clicks', () => {
      const navigationLinks: FooterLink[] = [
        { href: '/create-bug-report', title: 'Report a Bug', text: 'Report a Bug' }
      ];
      
      appFooter = new AppFooter({ navigationLinks });
      appFooter.init();
      
      const consoleSpy = jest.spyOn(console, 'log');
      const link = document.querySelector('.footer-navigation-left-panel a') as HTMLAnchorElement;
      
      // Create and dispatch click event
      const clickEvent = new MouseEvent('click', { bubbles: true });
      link.click();
      
      expect(consoleSpy).toHaveBeenCalledWith('Footer navigation: Report a Bug clicked');
    });

    test('should handle clicks on navigation panel container', () => {
      const navigationLinks: FooterLink[] = [
        { href: '/test', title: 'Test', text: 'Test' }
      ];
      
      appFooter = new AppFooter({ navigationLinks });
      appFooter.init();
      
      const navPanel = document.querySelector('.footer-navigation-left-panel') as HTMLElement;
      const link = document.querySelector('.footer-navigation-left-panel a') as HTMLAnchorElement;
      
      // Mock the event handling
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: link });
      
      // Dispatch event on container
      navPanel.dispatchEvent(clickEvent);
      
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Cleanup and Destruction', () => {
    test('should destroy footer and clean up resources', () => {
      appFooter = new AppFooter();
      appFooter.init();
      
      const footer = document.querySelector('.app-footer');
      expect(footer).toBeTruthy();
      
      const consoleSpy = jest.spyOn(console, 'log');
      appFooter.destroy();
      
      expect(consoleSpy).toHaveBeenCalledWith('AppFooter - Destroying...');
      expect(document.querySelector('.app-footer')).toBeNull();
      expect(appFooter.getContainer()).toBeNull();
    });
  });

  describe('Element Getters', () => {
    beforeEach(() => {
      appFooter = new AppFooter();
      appFooter.init();
    });

    test('should return footer container', () => {
      const container = appFooter.getContainer();
      expect(container).toBeTruthy();
      expect(container?.classList.contains('app-footer')).toBe(true);
    });

    test('should return copyright element', () => {
      const copyrightElement = appFooter.getCopyrightElement();
      expect(copyrightElement).toBeTruthy();
      expect(copyrightElement?.classList.contains('footer-copyright-text')).toBe(true);
    });

    test('should return null for copyright element when copyright is disabled', () => {
      // Destroy current instance and create new one without copyright
      appFooter.destroy();
      appFooter = new AppFooter({ showCopyright: false });
      appFooter.init();
      
      const copyrightElement = appFooter.getCopyrightElement();
      expect(copyrightElement).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle existing footer gracefully', () => {
      // Create footer manually
      const existingFooter = document.createElement('footer');
      existingFooter.className = 'app-footer';
      mockContainer.appendChild(existingFooter);
      
      appFooter = new AppFooter();
      appFooter.init();
      
      // Should use existing footer, not create a new one
      const footers = document.querySelectorAll('.app-footer');
      expect(footers).toHaveLength(1);
      expect(appFooter.getContainer()).toBe(existingFooter);
    });

    test('should handle empty navigation links array', () => {
      appFooter = new AppFooter({ 
        showNavigation: true,
        navigationLinks: [] 
      });
      appFooter.init();
      
      const navPanel = document.querySelector('.footer-navigation-left-panel');
      expect(navPanel).toBeNull();
    });

    test('should handle updateLayout with null container', () => {
      appFooter = new AppFooter();
      // Don't initialize, so container is null
      
      const sidebarState = {
        compact: true,
        collapsed: false,
        mobile: false
      };
      
      // Should not throw error
      expect(() => {
        appFooter.updateLayout(sidebarState);
      }).not.toThrow();
    });

    test('should handle showCopyright with missing copyright element', () => {
      appFooter = new AppFooter({ showCopyright: false });
      appFooter.init();
      
      // Should not throw error when copyright element doesn't exist
      expect(() => {
        appFooter.showCopyright(true);
      }).not.toThrow();
    });

    test('should handle updateCopyrightText with missing copyright element', () => {
      appFooter = new AppFooter({ showCopyright: false });
      appFooter.init();
      
      // Should not throw error when copyright element doesn't exist
      expect(() => {
        appFooter.updateCopyrightText('New text');
      }).not.toThrow();
    });

    test('should handle setVisible with null container', () => {
      appFooter = new AppFooter();
      // Don't initialize, so container is null
      
      // Should not throw error
      expect(() => {
        appFooter.setVisible(false);
      }).not.toThrow();
    });
  });
});
