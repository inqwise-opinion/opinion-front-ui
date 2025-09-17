/**
 * Integration tests for PageContext Breadcrumbs functionality
 * Tests the complete breadcrumbs system from PageContext API to header display
 */

import { BreadcrumbsComponent } from '../src/components/BreadcrumbsComponent';
import { BreadcrumbsManagerImpl } from '../src/contexts/BreadcrumbsManagerImpl';
import { PageContextImpl } from '../src/contexts/PageContextImpl';
import type { BreadcrumbItem } from '../src/interfaces/BreadcrumbItem';
import type { PageContext } from '../src/interfaces/PageContext';
import type { BreadcrumbsManager } from '../src/interfaces/BreadcrumbsManager';

describe('PageContext - Breadcrumbs Integration', () => {
  let breadcrumbsComponent: BreadcrumbsComponent;
  let breadcrumbsManager: BreadcrumbsManager;
  let pageContext: PageContext;

  beforeEach(async () => {
    // Set up minimal DOM environment for breadcrumbs
    document.body.innerHTML = `
      <div class="header-breadcrumbs">
        <!-- Breadcrumbs will be rendered here -->
      </div>
    `;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create BreadcrumbsComponent with container
    const breadcrumbsContainer = document.querySelector('.header-breadcrumbs') as HTMLElement;
    breadcrumbsComponent = new BreadcrumbsComponent(breadcrumbsContainer);
    await breadcrumbsComponent.init();

    // Create a mock ActivePage
    const mockActivePage = {
      getPageId: () => 'test-page'
    } as any;

    // Create a mock LayoutContext
    const mockHeader = {
      getBreadcrumbsComponent: () => breadcrumbsComponent
    };
    
    const mockLayoutContext = {
      getBreadcrumbsComponent: () => breadcrumbsComponent,
      getHeader: () => mockHeader
    } as any;

    // Create PageContext
    pageContext = new PageContextImpl(mockActivePage, mockLayoutContext, {
      enableDebugLogging: false
    });

    // Get breadcrumbsManager from the context
    breadcrumbsManager = pageContext.breadcrumbs();
  });

  afterEach(() => {
    if (breadcrumbsComponent) {
      breadcrumbsComponent.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('PageContext Creation and Access', () => {
    test('should create PageContext', async () => {
      expect(pageContext).toBeTruthy();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(pageContext.isReady()).toBe(true);
      expect(typeof pageContext.getCreatedAt()).toBe('number');
    });

    test('should provide BreadcrumbsManager through PageContext', () => {
      const breadcrumbsManager = pageContext.breadcrumbs();
      
      expect(breadcrumbsManager).toBeTruthy();
      expect(breadcrumbsManager.isAvailable()).toBe(true);
    });
  });

  describe('BreadcrumbsManager API', () => {

    test('should set breadcrumbs via BreadcrumbsManager', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home', href: '/' },
        { id: 'current', text: 'Test Page' }
      ];

      breadcrumbsManager.set(items);
      
      const currentItems = breadcrumbsManager.get();
      expect(currentItems).toEqual(items);
    });

    test('should add breadcrumb items', () => {
      // Set initial breadcrumbs
      const initialItems: BreadcrumbItem[] = [
        { id: 'home', text: 'Home' }
      ];
      breadcrumbsManager.set(initialItems);

      // Add new item
      const newItem: BreadcrumbItem = { id: 'page', text: 'Page' };
      breadcrumbsManager.add(newItem);

      const currentItems = breadcrumbsManager.get();
      expect(currentItems).toHaveLength(2);
      expect(currentItems[1]).toEqual(newItem);
    });

    test('should remove breadcrumb items by id', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home' },
        { id: 'page', text: 'Page' },
        { id: 'current', text: 'Current' }
      ];
      breadcrumbsManager.set(items);

      breadcrumbsManager.remove('page');

      const currentItems = breadcrumbsManager.get();
      expect(currentItems).toHaveLength(2);
      expect(currentItems.find(item => item.id === 'page')).toBeUndefined();
    });

    test('should update breadcrumb items', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home' },
        { id: 'current', text: 'Current' }
      ];
      breadcrumbsManager.set(items);

      breadcrumbsManager.update('current', { text: 'Updated Current', caption: 'New caption' });

      const currentItems = breadcrumbsManager.get();
      const updatedItem = currentItems.find(item => item.id === 'current');
      expect(updatedItem?.text).toBe('Updated Current');
      expect(updatedItem?.caption).toBe('New caption');
    });

    test('should clear all breadcrumbs', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home' },
        { id: 'current', text: 'Current' }
      ];
      breadcrumbsManager.set(items);

      breadcrumbsManager.clear();

      const currentItems = breadcrumbsManager.get();
      expect(currentItems).toHaveLength(0);
    });

    test('should check availability', () => {
      expect(breadcrumbsManager.isAvailable()).toBe(true);
    });
  });

  describe('DOM Integration and Rendering', () => {

    test('should render breadcrumbs in header area', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home', href: '/' },
        { id: 'current', text: 'Test Page' }
      ];

      breadcrumbsManager.set(items);

      // Check that breadcrumbs are rendered in the DOM
      const breadcrumbsList = document.querySelector('.breadcrumbs-list');
      expect(breadcrumbsList).toBeTruthy();

      const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
      expect(breadcrumbItems).toHaveLength(2);
    });

    test('should render breadcrumb links correctly', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home', href: '/', caption: 'Go home' },
        { id: 'current', text: 'Test Page' }
      ];

      breadcrumbsManager.set(items);

      const homeLink = document.querySelector('a[href="/"]');
      expect(homeLink).toBeTruthy();
      expect(homeLink?.textContent?.trim()).toBe('Home');

      // Current page should not be a link
      const currentItem = document.querySelector('.breadcrumb-item:last-child');
      expect(currentItem?.querySelector('a')).toBeNull();
    });

    test('should render separators between breadcrumbs', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home' },
        { id: 'page', text: 'Page' },
        { id: 'current', text: 'Current' }
      ];

      breadcrumbsManager.set(items);

      const separators = document.querySelectorAll('.breadcrumb-separator');
      expect(separators).toHaveLength(2); // One less than number of items
    });

    test('should update DOM when breadcrumbs change', () => {
      const initialItems: BreadcrumbItem[] = [
        { id: 'home', text: 'Home' }
      ];

      breadcrumbsManager.set(initialItems);
      
      let breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
      expect(breadcrumbItems).toHaveLength(1);

      // Add another breadcrumb
      breadcrumbsManager.add({ id: 'page', text: 'Page' });

      breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
      expect(breadcrumbItems).toHaveLength(2);
    });

    test('should clear DOM when breadcrumbs are cleared', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home' },
        { id: 'current', text: 'Current' }
      ];

      breadcrumbsManager.set(items);
      
      let breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
      expect(breadcrumbItems.length).toBeGreaterThan(1);

      breadcrumbsManager.clear();

      // After clearing, component shows empty state placeholder
      breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
      expect(breadcrumbItems).toHaveLength(1);
      expect(breadcrumbItems[0].classList.contains('breadcrumb-empty')).toBe(true);
    });
  });

  describe('Advanced Features', () => {
    test('should handle breadcrumbs with click handlers', () => {
      let clickedItem: BreadcrumbItem | null = null;
      
      const items: BreadcrumbItem[] = [
        { 
          id: 'home', 
          text: 'Home', 
          clickHandler: (item) => { clickedItem = item; }
        },
        { id: 'current', text: 'Test Page' }
      ];

      breadcrumbsManager.set(items);
      
      // Simulate click
      const homeItem = breadcrumbsManager.get()[0];
      if (homeItem.clickHandler) {
        homeItem.clickHandler(homeItem);
      }
      
      expect(clickedItem).toEqual(homeItem);
    });

    test('should handle breadcrumbs with href links', () => {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home', href: '/' },
        { id: 'dashboard', text: 'Dashboard', href: '/dashboard' },
        { id: 'current', text: 'Current Page' }
      ];

      breadcrumbsManager.set(items);
      const currentItems = breadcrumbsManager.get();
      
      expect(currentItems[0].href).toBe('/');
      expect(currentItems[1].href).toBe('/dashboard');
      expect(currentItems[2].href).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid breadcrumb operations gracefully', () => {
      // Remove non-existent item should not throw
      expect(() => {
        breadcrumbsManager.remove('non-existent');
      }).not.toThrow();

      // Update non-existent item should not throw
      expect(() => {
        breadcrumbsManager.update('non-existent', { text: 'Updated' });
      }).not.toThrow();
    });

    test('should handle rapid updates without issues', () => {
      // Rapid fire updates
      for (let i = 0; i < 10; i++) {
        breadcrumbsManager.set([
          { id: `item${i}`, text: `Item ${i}` }
        ]);
      }

      // Should end up with last update
      const finalItems = breadcrumbsManager.get();
      expect(finalItems).toHaveLength(1);
      expect(finalItems[0].text).toBe('Item 9');
    });
  });
});
