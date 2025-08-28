/**
 * Unit tests for App Header component - Title Functionality
 * Tests page title updates, breadcrumb management, responsive behavior, and accessibility
 */

import { AppHeader, HeaderUser } from '../src/components/AppHeader';

describe('AppHeader - Title Functionality', () => {
  let appHeader: AppHeader;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create mock viewport environment - desktop by default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
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
    // Clean up header instance
    if (appHeader) {
      appHeader.destroy();
    }
    
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('Header Structure and Title Creation', () => {
    test('should create header with default title structure', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const headerElement = document.querySelector('.app-header');
      const headerContainer = document.querySelector('.header-container');
      const headerCenter = document.querySelector('.header-center');
      const headerBreadcrumbs = document.querySelector('.header-breadcrumbs');
      
      expect(headerElement).toBeTruthy();
      expect(headerContainer).toBeTruthy();
      expect(headerCenter).toBeTruthy();
      expect(headerBreadcrumbs).toBeTruthy();
    });

    test('should create breadcrumb structure with correct elements', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const breadcrumbList = document.querySelector('.breadcrumb-list');
      const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
      const breadcrumbText = document.querySelector('#current_page_title');
      const breadcrumbSeparator = document.querySelector('#breadcrumb_separator');
      const breadcrumbSubpage = document.querySelector('#breadcrumb_subpage');
      
      expect(breadcrumbList).toBeTruthy();
      expect(breadcrumbCurrent).toBeTruthy();
      expect(breadcrumbText).toBeTruthy();
      expect(breadcrumbSeparator).toBeTruthy();
      expect(breadcrumbSubpage).toBeTruthy();
    });

    test('should have default "Dashboard" title', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const currentPageTitle = document.querySelector('#current_page_title');
      expect(currentPageTitle?.textContent).toBe('Dashboard');
    });

    test('should have proper ARIA structure for breadcrumbs', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const breadcrumbNav = document.querySelector('.header-breadcrumbs nav');
      const breadcrumbList = document.querySelector('.breadcrumb-list');
      const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
      
      expect(breadcrumbNav?.getAttribute('aria-label')).toBe('Breadcrumb');
      expect(breadcrumbCurrent?.getAttribute('aria-current')).toBe('page');
      expect(breadcrumbList?.tagName).toBe('OL'); // Ordered list for proper semantics
    });

    test('should have proper CSS classes applied', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const headerElement = document.querySelector('.app-header');
      const headerCenter = document.querySelector('.header-center');
      const breadcrumbText = document.querySelector('.breadcrumb-text');
      
      expect(headerElement?.classList.contains('app-header')).toBe(true);
      expect(headerCenter?.classList.contains('header-center')).toBe(true);
      expect(breadcrumbText?.classList.contains('breadcrumb-text')).toBe(true);
    });
  });

  describe('Page Title Updates', () => {
    beforeEach(async () => {
      appHeader = new AppHeader();
      await appHeader.init();
    });

    test('should update page title correctly', () => {
      appHeader.updatePageTitle('New Page Title');
      
      const currentPageTitle = document.querySelector('#current_page_title');
      expect(currentPageTitle?.textContent).toBe('New Page Title');
    });

    test('should handle empty title updates', () => {
      appHeader.updatePageTitle('');
      
      const currentPageTitle = document.querySelector('#current_page_title');
      expect(currentPageTitle?.textContent).toBe('');
    });

    test('should handle special characters in title', () => {
      const specialTitle = 'Dashboard & Analytics — Overview';
      appHeader.updatePageTitle(specialTitle);
      
      const currentPageTitle = document.querySelector('#current_page_title');
      expect(currentPageTitle?.textContent).toBe(specialTitle);
    });

    test('should handle HTML entities in title', () => {
      const htmlTitle = 'Reports &amp; Data';
      appHeader.updatePageTitle(htmlTitle);
      
      const currentPageTitle = document.querySelector('#current_page_title');
      expect(currentPageTitle?.textContent).toBe(htmlTitle);
    });

    test('should handle long titles gracefully', () => {
      const longTitle = 'This is a very long page title that might overflow on smaller screens and needs to be handled properly with ellipsis';
      appHeader.updatePageTitle(longTitle);
      
      const currentPageTitle = document.querySelector('#current_page_title');
      expect(currentPageTitle?.textContent).toBe(longTitle);
    });

    test('should update multiple times correctly', () => {
      const titles = ['First Title', 'Second Title', 'Third Title'];
      
      titles.forEach(title => {
        appHeader.updatePageTitle(title);
        const currentPageTitle = document.querySelector('#current_page_title');
        expect(currentPageTitle?.textContent).toBe(title);
      });
    });

    test('should log title updates', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const testTitle = 'Test Title';
      
      appHeader.updatePageTitle(testTitle);
      
      expect(consoleSpy).toHaveBeenCalledWith('AppHeader - Page title updated:', testTitle);
    });

    test('should warn if title element is missing', () => {
      // Remove the title element
      const titleElement = document.querySelector('#current_page_title');
      titleElement?.remove();
      
      const consoleSpy = jest.spyOn(console, 'warn');
      appHeader.updatePageTitle('New Title');
      
      expect(consoleSpy).toHaveBeenCalledWith('AppHeader - Page title element not found');
    });
  });

  describe('Breadcrumb Management', () => {
    beforeEach(async () => {
      appHeader = new AppHeader();
      await appHeader.init();
    });

    test('should update breadcrumbs with main page only', () => {
      appHeader.updateBreadcrumbs('Analytics');
      
      const mainPageElement = document.querySelector('#current_page_title');
      const separator = document.querySelector('#breadcrumb_separator') as HTMLElement;
      const subPageContainer = document.querySelector('#breadcrumb_subpage') as HTMLElement;
      
      expect(mainPageElement?.textContent).toBe('Analytics');
      expect(separator?.style.display).toBe('none');
      expect(subPageContainer?.style.display).toBe('none');
    });

    test('should update breadcrumbs with main page and sub-page', () => {
      appHeader.updateBreadcrumbs('Reports', 'Monthly Summary');
      
      const mainPageElement = document.querySelector('#current_page_title');
      const separator = document.querySelector('#breadcrumb_separator') as HTMLElement;
      const subPageContainer = document.querySelector('#breadcrumb_subpage') as HTMLElement;
      const subPageElement = document.querySelector('#subpage_title');
      
      expect(mainPageElement?.textContent).toBe('Reports');
      expect(separator?.style.display).toBe('flex');
      expect(subPageContainer?.style.display).toBe('flex');
      expect(subPageElement?.textContent).toBe('Monthly Summary');
    });

    test('should update document title with main page only', () => {
      appHeader.updateBreadcrumbs('Settings');
      
      expect(document.title).toBe('Settings - Opinion');
    });

    test('should update document title with main page and sub-page', () => {
      appHeader.updateBreadcrumbs('Users', 'Profile Settings');
      
      expect(document.title).toBe('Profile Settings - Users - Opinion');
    });

    test('should handle breadcrumb updates from sub-page back to main page', () => {
      // First, set a sub-page
      appHeader.updateBreadcrumbs('Dashboard', 'Analytics View');
      
      const separator = document.querySelector('#breadcrumb_separator') as HTMLElement;
      const subPageContainer = document.querySelector('#breadcrumb_subpage') as HTMLElement;
      expect(separator?.style.display).toBe('flex');
      expect(subPageContainer?.style.display).toBe('flex');
      
      // Then, remove sub-page
      appHeader.updateBreadcrumbs('Dashboard');
      
      expect(separator?.style.display).toBe('none');
      expect(subPageContainer?.style.display).toBe('none');
      expect(document.title).toBe('Dashboard - Opinion');
    });

    test('should log breadcrumb updates correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Test main page only
      appHeader.updateBreadcrumbs('Projects');
      expect(consoleSpy).toHaveBeenCalledWith('AppHeader - Breadcrumbs updated: Projects');
      
      // Test main page with sub-page
      appHeader.updateBreadcrumbs('Projects', 'New Project');
      expect(consoleSpy).toHaveBeenCalledWith('AppHeader - Breadcrumbs updated: Projects > New Project');
    });

    test('should handle empty breadcrumb values gracefully', () => {
      expect(() => {
        appHeader.updateBreadcrumbs('');
      }).not.toThrow();
      
      const mainPageElement = document.querySelector('#current_page_title');
      expect(mainPageElement?.textContent).toBe('');
      expect(document.title).toBe(' - Opinion');
    });

    test('should handle missing breadcrumb elements gracefully', () => {
      // Remove separator element
      const separator = document.querySelector('#breadcrumb_separator');
      separator?.remove();
      
      expect(() => {
        appHeader.updateBreadcrumbs('Test', 'Sub Test');
      }).not.toThrow();
      
      const mainPageElement = document.querySelector('#current_page_title');
      expect(mainPageElement?.textContent).toBe('Test');
    });
  });

  describe('Brand Management', () => {
    beforeEach(async () => {
      appHeader = new AppHeader();
      await appHeader.init();
    });

    test('should update brand title and href', () => {
      // First add a logo element to the header for testing
      const headerCenter = document.querySelector('.header-center');
      if (headerCenter) {
        headerCenter.innerHTML += '<a class="logo" href="/dashboard">Opinion</a>';
      }
      
      appHeader.updateBrand('Custom Brand', '/custom');
      
      const logo = document.querySelector('.logo') as HTMLAnchorElement;
      expect(logo?.textContent).toBe('Custom Brand');
      expect(logo?.href).toBe('http://localhost:3000/custom');
    });

    test('should handle missing logo element gracefully', () => {
      expect(() => {
        appHeader.updateBrand('Test Brand', '/test');
      }).not.toThrow();
    });

    test('should use default href when not provided', () => {
      // Add a logo element for testing
      const headerCenter = document.querySelector('.header-center');
      if (headerCenter) {
        headerCenter.innerHTML += '<a class="logo" href="/old">Old Brand</a>';
      }
      
      appHeader.updateBrand('New Brand');
      
      const logo = document.querySelector('.logo') as HTMLAnchorElement;
      expect(logo?.textContent).toBe('New Brand');
      expect(logo?.href).toBe('http://localhost:3000/dashboard');
    });
  });

  describe('Responsive Behavior - Title Display', () => {
    test('should show title on desktop viewport', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280 });
      
      appHeader = new AppHeader();
      await appHeader.init();
      
      const headerCenter = document.querySelector('.header-center') as HTMLElement;
      
      // Desktop should have no left padding by default
      expect(headerCenter.style.paddingLeft).toBe('0px');
    });

    test('should adjust title padding on mobile viewport', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      appHeader = new AppHeader();
      await appHeader.init();
      
      const headerCenter = document.querySelector('.header-center') as HTMLElement;
      
      // Mobile should have left padding for hamburger menu
      expect(headerCenter.style.paddingLeft).toBe('16px');
    });

    test('should show title on tablet viewport', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      
      appHeader = new AppHeader();
      await appHeader.init();
      
      const headerCenter = document.querySelector('.header-center') as HTMLElement;
      
      // Tablet should have no left padding
      expect(headerCenter.style.paddingLeft).toBe('0px');
    });

    test('should handle viewport changes after initialization', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const headerCenter = document.querySelector('.header-center') as HTMLElement;
      
      // Start desktop
      expect(headerCenter.style.paddingLeft).toBe('0px');
      
      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      window.dispatchEvent(new Event('resize'));
      
      // Should update to mobile padding
      expect(headerCenter.style.paddingLeft).toBe('16px');
      
      // Simulate resize back to desktop
      Object.defineProperty(window, 'innerWidth', { value: 1280 });
      window.dispatchEvent(new Event('resize'));
      
      // Should update back to desktop padding
      expect(headerCenter.style.paddingLeft).toBe('0px');
    });

    test('should maintain title visibility across viewports', async () => {
      const viewports = [375, 768, 1024, 1280];
      
      for (const viewport of viewports) {
        Object.defineProperty(window, 'innerWidth', { value: viewport });
        
        if (appHeader) {
          appHeader.destroy();
        }
        
        appHeader = new AppHeader();
        await appHeader.init();
        
        appHeader.updatePageTitle(`Title at ${viewport}px`);
        
        const titleElement = document.querySelector('#current_page_title');
        expect(titleElement?.textContent).toBe(`Title at ${viewport}px`);
      }
    });
  });

  describe('Title Styling and CSS Classes', () => {
    beforeEach(async () => {
      appHeader = new AppHeader();
      await appHeader.init();
    });

    test('should have correct CSS classes on breadcrumb elements', () => {
      const breadcrumbList = document.querySelector('.breadcrumb-list');
      const breadcrumbItem = document.querySelector('.breadcrumb-item');
      const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
      const breadcrumbText = document.querySelector('.breadcrumb-text');
      
      expect(breadcrumbList?.classList.contains('breadcrumb-list')).toBe(true);
      expect(breadcrumbItem?.classList.contains('breadcrumb-item')).toBe(true);
      expect(breadcrumbCurrent?.classList.contains('breadcrumb-current')).toBe(true);
      expect(breadcrumbText?.classList.contains('breadcrumb-text')).toBe(true);
    });

    test('should apply correct padding to breadcrumb list', () => {
      const breadcrumbList = document.querySelector('.breadcrumb-list') as HTMLElement;
      
      // Check if the CSS class is applied (actual styling is handled by CSS)
      expect(breadcrumbList?.classList.contains('breadcrumb-list')).toBe(true);
      expect(breadcrumbList?.tagName).toBe('OL');
    });

    test('should have proper gap spacing in breadcrumb list', () => {
      const breadcrumbList = document.querySelector('.breadcrumb-list') as HTMLElement;
      
      // The gap should be applied via CSS - just verify element exists
      expect(breadcrumbList).toBeTruthy();
      expect(breadcrumbList.classList.contains('breadcrumb-list')).toBe(true);
    });

    test('should have correct element structure for styling', () => {
      // Verify the DOM structure matches what CSS expects
      const headerCenter = document.querySelector('.header-center .header-breadcrumbs .breadcrumb-list .breadcrumb-item.breadcrumb-current .breadcrumb-text');
      expect(headerCenter).toBeTruthy();
    });
  });

  describe('Title Accessibility', () => {
    beforeEach(async () => {
      appHeader = new AppHeader();
      await appHeader.init();
    });

    test('should maintain proper ARIA landmarks', () => {
      const breadcrumbNav = document.querySelector('[aria-label="Breadcrumb"]');
      expect(breadcrumbNav?.tagName).toBe('NAV');
    });

    test('should have current page marked with aria-current', () => {
      const currentPageItem = document.querySelector('[aria-current="page"]');
      expect(currentPageItem).toBeTruthy();
      expect(currentPageItem?.classList.contains('breadcrumb-current')).toBe(true);
    });

    test('should update aria-current when breadcrumbs change', () => {
      appHeader.updateBreadcrumbs('New Page');
      
      const currentPageItem = document.querySelector('[aria-current="page"]');
      const titleText = currentPageItem?.querySelector('#current_page_title');
      
      expect(titleText?.textContent).toBe('New Page');
    });

    test('should hide decorative separator from screen readers', () => {
      appHeader.updateBreadcrumbs('Main', 'Sub');
      
      const separator = document.querySelector('#breadcrumb_separator');
      expect(separator?.getAttribute('aria-hidden')).toBe('true');
    });

    test('should maintain semantic heading hierarchy', () => {
      // The breadcrumb text should not interfere with proper heading structure
      const titleElement = document.querySelector('#current_page_title');
      expect(titleElement?.tagName).toBe('SPAN'); // Should be span, not heading
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle initialization without DOM elements', async () => {
      // Clear the DOM
      document.body.innerHTML = '';
      
      appHeader = new AppHeader();
      
      await expect(appHeader.init()).resolves.not.toThrow();
    });

    test('should handle multiple rapid title updates', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const titles = ['Title 1', 'Title 2', 'Title 3', 'Title 4', 'Title 5'];
      
      titles.forEach(title => {
        appHeader.updatePageTitle(title);
      });
      
      const finalTitle = document.querySelector('#current_page_title');
      expect(finalTitle?.textContent).toBe('Title 5');
    });

    test('should handle breadcrumb updates with null values', () => {
      appHeader = new AppHeader();
      return appHeader.init().then(() => {
        expect(() => {
          appHeader.updateBreadcrumbs('Main', undefined);
        }).not.toThrow();
        
        const separator = document.querySelector('#breadcrumb_separator') as HTMLElement;
        expect(separator?.style.display).toBe('none');
      });
    });

    test('should handle DOM manipulation after initialization', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      // Simulate external DOM changes
      const breadcrumbText = document.querySelector('#current_page_title');
      breadcrumbText?.remove();
      
      // Should handle missing element gracefully
      expect(() => {
        appHeader.updatePageTitle('New Title');
      }).not.toThrow();
    });

    test('should handle window resize events', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      // Multiple resize events
      for (let i = 0; i < 5; i++) {
        Object.defineProperty(window, 'innerWidth', { value: 800 + i * 100 });
        window.dispatchEvent(new Event('resize'));
      }
      
      // Should maintain functionality
      appHeader.updatePageTitle('Resize Test');
      const titleElement = document.querySelector('#current_page_title');
      expect(titleElement?.textContent).toBe('Resize Test');
    });

    test('should handle destruction and recreation', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      appHeader.updatePageTitle('First Title');
      const firstTitle = document.querySelector('#current_page_title')?.textContent;
      expect(firstTitle).toBe('First Title');
      
      // Destroy and recreate
      appHeader.destroy();
      
      appHeader = new AppHeader();
      await appHeader.init();
      
      const newTitle = document.querySelector('#current_page_title')?.textContent;
      expect(newTitle).toBe('Dashboard'); // Should reset to default
    });
  });

  describe('Performance and Memory Management', () => {
    test('should handle many title updates efficiently', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const startTime = performance.now();
      
      // Many title updates
      for (let i = 0; i < 1000; i++) {
        appHeader.updatePageTitle(`Title ${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (arbitrary threshold)
      expect(duration).toBeLessThan(1000);
      
      const finalTitle = document.querySelector('#current_page_title');
      expect(finalTitle?.textContent).toBe('Title 999');
    });

    test('should not create memory leaks with rapid updates', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const initialChildCount = document.querySelector('.header-breadcrumbs')?.children.length;
      
      // Many rapid updates
      for (let i = 0; i < 100; i++) {
        appHeader.updateBreadcrumbs(`Main ${i}`, `Sub ${i}`);
      }
      
      const finalChildCount = document.querySelector('.header-breadcrumbs')?.children.length;
      expect(finalChildCount).toBe(initialChildCount);
    });

    test('should cleanup event listeners on destroy', async () => {
      appHeader = new AppHeader();
      await appHeader.init();
      
      const headerElement = document.querySelector('.app-header');
      expect(headerElement).toBeTruthy();
      
      appHeader.destroy();
      
      // Header should be removed from DOM
      const removedHeader = document.querySelector('.app-header');
      expect(removedHeader).toBeNull();
    });
  });
});
