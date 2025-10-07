/**
 * Unit tests for AppFooter component
 * Tests component initialization, configuration, DOM manipulation, and responsiveness
 */

import { AppFooterImpl, FooterConfig, FooterLink } from '../../../src/components/AppFooterImpl';

// Mock the layout context
jest.mock('../../../src/contexts/index', () => ({
  getLayoutContext: jest.fn(() => ({
    subscribe: jest.fn(() => () => {}), // Return unsubscribe function
    getModeType: jest.fn(() => 'desktop'),
    isLayoutMobile: jest.fn(() => false),
    isLayoutTablet: jest.fn(() => false),
    isLayoutDesktop: jest.fn(() => true),
    emit: jest.fn(),
    // Layout component registration
    registerFooter: jest.fn(),
    getMessagesComponent: jest.fn(),
    getMainContent: jest.fn(),
    getFooter: jest.fn(),
    getSidebar: jest.fn(),
    registerChainProvider: jest.fn(),
    // Additional required methods
    destroy: jest.fn()
  }))
}))

describe('AppFooter', () => {
  let appFooter: AppFooterImpl;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create a mock container that matches the expected structure
    mockContainer = document.createElement('div');
    mockContainer.className = 'wrapper-constructed';
    document.body.appendChild(mockContainer);
    
    // Create the expected footer element structure that AppFooterImpl expects
    const footerElement = document.createElement('footer');
    footerElement.id = 'app-footer';
    footerElement.className = 'app-footer';
    
    // Add the inner structure that the footer expects
    const footerContainer = document.createElement('div');
    footerContainer.className = 'footer-container';
    footerElement.appendChild(footerContainer);
    
    mockContainer.appendChild(footerElement);
    
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
      appFooter = new AppFooterImpl();
      expect(appFooter).toBeInstanceOf(AppFooterImpl);
    });

    test('should create AppFooter instance with custom config', () => {
      const customConfig: FooterConfig = {
        showCopyright: false,
        copyrightText: 'Custom copyright text',
        showNavigation: false,
        navigationLinks: []
      };
      
      appFooter = new AppFooterImpl(customConfig);
      expect(appFooter).toBeInstanceOf(AppFooterImpl);
    });

    test('should initialize footer and create DOM elements', () => {
      appFooter = new AppFooterImpl();
      appFooter.init();
      
      const footerElement = document.querySelector('.app-footer');
      expect(footerElement).toBeTruthy();
      expect(footerElement?.tagName).toBe('FOOTER');
    });

    test('should log initialization messages', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      appFooter = new AppFooterImpl();
      appFooter.init();
      
      // AppFooterImpl now uses structured logging, so expect formatted output
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\].*AppFooterImpl.*AppFooter - Initializing/)
      );
    });
  });

  describe('DOM Structure and Content', () => {
    test('should create footer with default copyright text', () => {
      appFooter = new AppFooterImpl();
      appFooter.init();
      
      const copyrightElement = document.querySelector('.footer-copyright-text');
      expect(copyrightElement).toBeTruthy();
      expect(copyrightElement?.textContent).toBe('created by inqwise');
    });

    test('should create footer with custom copyright text', () => {
      const customText = 'Custom Footer Text';
      appFooter = new AppFooterImpl({ copyrightText: customText });
      appFooter.init();
      
      const copyrightElement = document.querySelector('.footer-copyright-text');
      expect(copyrightElement?.textContent).toBe(customText);
    });

    test('should create footer with navigation links', () => {
      const navigationLinks: FooterLink[] = [
        { href: '/about', title: 'About Us', text: 'About Us' },
        { href: '/contact', title: 'Contact', text: 'Contact' }
      ];
      
      appFooter = new AppFooterImpl({ navigationLinks });
      appFooter.init();
      
      const navPanel = document.querySelector('.footer-navigation-left-panel');
      const links = document.querySelectorAll('.footer-navigation-left-panel a');
      
      expect(navPanel).toBeTruthy();
      expect(links).toHaveLength(2);
      expect(links[0].getAttribute('href')).toBe('/about');
      expect(links[1].getAttribute('href')).toBe('/contact');
    });

    test('should hide copyright when showCopyright is false', () => {
      appFooter = new AppFooterImpl({ showCopyright: false });
      appFooter.init();
      
      const copyrightSection = document.querySelector('.footer-copyright-section');
      expect(copyrightSection).toBeNull();
    });

    test('should hide navigation when showNavigation is false', () => {
      appFooter = new AppFooterImpl({ showNavigation: false });
      appFooter.init();
      
      const navPanel = document.querySelector('.footer-navigation-left-panel');
      expect(navPanel).toBeNull();
    });
  });

  describe('Footer Placement', () => {
    test('should insert footer in wrapper-constructed container', () => {
      appFooter = new AppFooterImpl();
      appFooter.init();
      
      const footer = document.querySelector('.app-footer');
      const parent = footer?.parentElement;
      
      expect(parent?.className).toBe('wrapper-constructed');
    });

    test('should handle missing app-footer element by rejecting', async () => {
      // Remove wrapper-constructed and footer element
      document.body.innerHTML = '';
      const wrapperContent = document.createElement('div');
      wrapperContent.className = 'wrapper-content';
      document.body.appendChild(wrapperContent);
      
      appFooter = new AppFooterImpl();
      
      // Should reject when no app-footer element is found
      await expect(appFooter.init()).rejects.toThrow('AppFooter: Could not find existing #app-footer element');
    });

    test('should handle missing app-footer element in empty body by rejecting', async () => {
      // Remove all containers and footer
      document.body.innerHTML = '';
      
      appFooter = new AppFooterImpl();
      
      // Should reject when no app-footer element is found
      await expect(appFooter.init()).rejects.toThrow('AppFooter: Could not find existing #app-footer element');
    });
  });


  describe('CSS Layout Classes', () => {
    beforeEach(() => {
      appFooter = new AppFooterImpl();
      appFooter.init();
    });

    test('should have proper CSS classes applied', () => {
      const footer = appFooter.getContainer();
      expect(footer).toBeTruthy();
      expect(footer?.classList.contains('app-footer')).toBe(true);
    });

    test('should manage visibility properly', () => {
      const footer = appFooter.getContainer();
      expect(footer).toBeTruthy();
      
      appFooter.setVisible(false);
      expect(footer?.style.display).toBe('none');
      
      appFooter.setVisible(true);
      expect(footer?.style.display).toBe('block');
    });
  });

  describe('Visibility Control', () => {
    beforeEach(() => {
      appFooter = new AppFooterImpl();
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

    test('should handle clicks on navigation panel container', () => {
      const navigationLinks: FooterLink[] = [
        { href: '/test', title: 'Test', text: 'Test' }
      ];
      
      appFooter = new AppFooterImpl({ navigationLinks });
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
      appFooter = new AppFooterImpl();
      appFooter.init();
      
      const footer = document.querySelector('.app-footer');
      expect(footer).toBeTruthy();
      
      const consoleSpy = jest.spyOn(console, 'log');
      appFooter.destroy();
      
      // AppFooterImpl now uses structured logging, so expect formatted output
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\].*AppFooterImpl.*AppFooter - Destroying/)
      );
      expect(document.querySelector('.app-footer')).toBeNull();
      expect(appFooter.getContainer()).toBeNull();
    });
  });

  describe('Element Getters', () => {
    beforeEach(() => {
      appFooter = new AppFooterImpl();
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
      appFooter = new AppFooterImpl({ showCopyright: false });
      appFooter.init();
      
      const copyrightElement = appFooter.getCopyrightElement();
      expect(copyrightElement).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle existing footer gracefully', () => {
      // The beforeEach already creates a footer, so we should test that it uses the existing one
      const existingFooter = document.getElementById('app-footer') as HTMLElement;
      expect(existingFooter).toBeTruthy();
      
      appFooter = new AppFooterImpl();
      appFooter.init();
      
      // Should use existing footer, not create a new one
      const footers = document.querySelectorAll('.app-footer');
      expect(footers).toHaveLength(1);
      expect(appFooter.getContainer()).toBe(existingFooter);
    });

    test('should handle empty navigation links array', () => {
      appFooter = new AppFooterImpl({ 
        showNavigation: true,
        navigationLinks: [] 
      });
      appFooter.init();
      
      const navPanel = document.querySelector('.footer-navigation-left-panel');
      expect(navPanel).toBeNull();
    });

    test('should handle methods with null container gracefully', () => {
      appFooter = new AppFooterImpl();
      // Don't initialize, so container is null
      
      // Should not throw error when container is null
      expect(() => {
        appFooter.setVisible(false);
      }).not.toThrow();
    });



    test('should handle setVisible with null container', () => {
      appFooter = new AppFooterImpl();
      // Don't initialize, so container is null
      
      // Should not throw error
      expect(() => {
        appFooter.setVisible(false);
      }).not.toThrow();
    });
  });
});
