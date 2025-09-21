/**
 * @deprecated These tests are no longer relevant as the breadcrumb functionality
 * has been moved to LayoutContext and integrated with the new component system.
 * The UI functionality is now tested as part of the Layout integration tests.
 */

import { DebugPage } from '../src/pages/DebugPage';
import { LayoutContextImpl } from '../src/contexts/LayoutContextImpl';
import { BreadcrumbsComponent } from '../src/components/BreadcrumbsComponent';
import { AppHeaderImpl } from '../src/components/AppHeaderImpl';
import Layout from '../src/components/Layout';
import type { BreadcrumbItem } from '../src/interfaces/BreadcrumbItem';

// Mock dependencies
jest.mock('../src/components/Layout');

describe.skip('DebugPage - Breadcrumbs Integration', () => {
  let debugPage: DebugPage;
  let layoutContext: LayoutContextImpl;
  let breadcrumbsComponent: BreadcrumbsComponent;
  let appHeader: AppHeaderImpl;
  let mockLayout: jest.Mocked<Layout>;

  beforeEach(async () => {
    // Set up complete DOM environment for DebugPage
    document.body.innerHTML = `
      <div class="app-layout">
        <header class="app-header" id="app-header">
          <div class="header-container">
            <div class="header-center">
              <div class="header-breadcrumbs">
                <!-- Breadcrumbs will be populated here -->
              </div>
            </div>
          </div>
        </header>
        <nav class="app-sidebar" id="app_sidebar"></nav>
        <main class="main-content" id="app">
          <!-- DebugPage content will be rendered here -->
        </main>
        <footer class="app-footer"></footer>
      </div>
    `;

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 720,
    });

    // Mock document ready state
    Object.defineProperty(document, 'readyState', {
      writable: true,
      configurable: true,
      value: 'complete',
    });

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create layout context first
    layoutContext = new LayoutContextImpl();

    // Create BreadcrumbsComponent with proper container
    const breadcrumbsContainer = document.querySelector('.header-breadcrumbs') as HTMLElement;
    breadcrumbsComponent = new BreadcrumbsComponent(breadcrumbsContainer, layoutContext);
    await breadcrumbsComponent.init();

    // Create and initialize AppHeader with layout context
    appHeader = new AppHeaderImpl({}, layoutContext);
    await appHeader.init();

    // Create layout mock
    mockLayout = {
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
      getBreadcrumbsComponent: jest.fn().mockReturnValue(breadcrumbsComponent),
      getMainContent: jest.fn().mockReturnValue({
        setContent: jest.fn(),
        getLayoutContext: jest.fn()
      } as any)
    } as any;

    // Create layout context and register components
    layoutContext = new LayoutContextImpl();
    
    // Register all components with layout context
    const mockHeader = {
      getBreadcrumbsComponent: () => breadcrumbsComponent
    };
    
    // Set up the layout context with proper mocks
    (layoutContext as any).layout = mockLayout;
    (layoutContext as any).breadcrumbsComponent = breadcrumbsComponent;
    (layoutContext as any).header = mockHeader;

    // Create debug page with injected layout context
    const mainContent = mockLayout.getMainContent();
    (mainContent as any)._layoutContext = layoutContext; // Inject through MainContent
    debugPage = new DebugPage(mainContent);

    // Initialize debug page
    await debugPage.init();

    // Wait for async initialization to complete
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  afterEach(() => {
    if (debugPage) {
      debugPage.destroy();
    }
    if (layoutContext) {
      layoutContext.destroy();
    }
    if (breadcrumbsComponent) {
      breadcrumbsComponent.destroy();
    }
    if (appHeader) {
      appHeader.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('DebugPage Breadcrumb Test UI Structure', () => {
    test('should create breadcrumb test section', () => {
      const allH3s = Array.from(document.querySelectorAll('h3'));
      const breadcrumbSectionExists = allH3s.some(el => 
        el.textContent?.includes('🍞 Breadcrumb Testing')
      );
      expect(breadcrumbSectionExists).toBe(true);
    });

    test('should create all breadcrumb test buttons', () => {
      // Basic breadcrumb tests
      const singleBtn = document.getElementById('breadcrumb_single');
      const multiBtn = document.getElementById('breadcrumb_multi');
      const linksBtn = document.getElementById('breadcrumb_links');
      const actionsBtn = document.getElementById('breadcrumb_actions');
      const clearBtn = document.getElementById('breadcrumb_clear');

      expect(singleBtn).toBeTruthy();
      expect(multiBtn).toBeTruthy();
      expect(linksBtn).toBeTruthy();
      expect(actionsBtn).toBeTruthy();
      expect(clearBtn).toBeTruthy();

      // Dynamic breadcrumb tests
      const addBtn = document.getElementById('breadcrumb_add');
      const removeBtn = document.getElementById('breadcrumb_remove');
      const updateBtn = document.getElementById('breadcrumb_update');
      const statusBtn = document.getElementById('breadcrumb_status');

      expect(addBtn).toBeTruthy();
      expect(removeBtn).toBeTruthy();
      expect(updateBtn).toBeTruthy();
      expect(statusBtn).toBeTruthy();
    });
  });

  describe('Initial Breadcrumb Setup', () => {
    test('should set initial breadcrumbs on page load', async () => {
      // Wait for page initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      const currentItems = breadcrumbsManager.get();

      expect(currentItems).toHaveLength(2);
      expect(currentItems[0].text).toBe('Home');
      expect(currentItems[0].href).toBe('/');
      expect(currentItems[1].text).toBe('Debug & Testing');
      expect(currentItems[1].caption).toBe('Development tools');
    });

    test('should verify PageContext is available', () => {
      expect(debugPage.hasPageContext()).toBe(true);
    });
  });

  describe('Basic Breadcrumb Test Buttons', () => {
    test('should execute single page breadcrumb test', async () => {
      const singleBtn = document.getElementById('breadcrumb_single');
      expect(singleBtn).toBeTruthy();

      // Click the button
      singleBtn?.click();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));

      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      const currentItems = breadcrumbsManager.get();

      expect(currentItems).toHaveLength(1);
      expect(currentItems[0].text).toBe('Debug Page');
      expect(currentItems[0].id).toBe('debug');
    });

    test('should execute multi-level breadcrumb test', async () => {
      const multiBtn = document.getElementById('breadcrumb_multi');
      expect(multiBtn).toBeTruthy();

      multiBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      const currentItems = breadcrumbsManager.get();

      expect(currentItems).toHaveLength(4);
      expect(currentItems[0].text).toBe('Dashboard');
      expect(currentItems[1].text).toBe('Reports');
      expect(currentItems[2].text).toBe('Analytics');
      expect(currentItems[3].text).toBe('Debug Page');
    });

    test('should execute breadcrumbs with links test', async () => {
      const linksBtn = document.getElementById('breadcrumb_links');
      expect(linksBtn).toBeTruthy();

      linksBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      const currentItems = breadcrumbsManager.get();

      expect(currentItems).toHaveLength(3);
      expect(currentItems[0].href).toBe('/');
      expect(currentItems[1].href).toBe('/dashboard');
      expect(currentItems[2].href).toBeUndefined(); // Current page has no href
      
      // Verify DOM rendering
      const homeLink = document.querySelector('a[href="/"]');
      expect(homeLink).toBeTruthy();
      expect(homeLink?.textContent?.trim()).toBe('Home');
    });

    test('should execute breadcrumbs with actions test', async () => {
      const actionsBtn = document.getElementById('breadcrumb_actions');
      expect(actionsBtn).toBeTruthy();

      actionsBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      const currentItems = breadcrumbsManager.get();

      expect(currentItems).toHaveLength(3);
      expect(currentItems[0].clickHandler).toBeInstanceOf(Function);
      expect(currentItems[1].clickHandler).toBeInstanceOf(Function);
      expect(currentItems[2].clickHandler).toBeUndefined(); // Current page has no handler
    });

    test('should execute clear breadcrumbs test', async () => {
      // First set some breadcrumbs
      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      breadcrumbsManager.set([
        { id: 'test1', text: 'Test 1' },
        { id: 'test2', text: 'Test 2' }
      ]);

      const clearBtn = document.getElementById('breadcrumb_clear');
      expect(clearBtn).toBeTruthy();

      clearBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const currentItems = breadcrumbsManager.get();
      expect(currentItems).toHaveLength(0);

      // Should show empty state in DOM
      const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
      expect(breadcrumbItems).toHaveLength(1); // Empty state placeholder
      expect(breadcrumbItems[0].classList.contains('breadcrumb-empty')).toBe(true);
    });
  });

  describe('Dynamic Breadcrumb Test Buttons', () => {
    test('should execute add breadcrumb test', async () => {
      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      const initialCount = breadcrumbsManager.get().length;

      const addBtn = document.getElementById('breadcrumb_add');
      expect(addBtn).toBeTruthy();

      addBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const currentItems = breadcrumbsManager.get();
      expect(currentItems.length).toBe(initialCount + 1);
      
      // Check that the new item has dynamic properties
      const newItem = currentItems[currentItems.length - 1];
      expect(newItem.id).toMatch(/^dynamic-\d+$/);
      expect(newItem.text).toMatch(/^Item \d+$/);
      expect(newItem.caption).toBe('Dynamically added');
      expect(newItem.clickHandler).toBeInstanceOf(Function);
    });

    test('should execute remove breadcrumb test', async () => {
      // Set up breadcrumbs first
      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      breadcrumbsManager.set([
        { id: 'home', text: 'Home' },
        { id: 'test', text: 'Test' },
        { id: 'current', text: 'Current' }
      ]);

      const removeBtn = document.getElementById('breadcrumb_remove');
      expect(removeBtn).toBeTruthy();

      removeBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const currentItems = breadcrumbsManager.get();
      expect(currentItems).toHaveLength(2);
      // Should remove the last item
      expect(currentItems.find(item => item.id === 'current')).toBeUndefined();
    });

    test('should execute update breadcrumb test', async () => {
      // Set up breadcrumbs first  
      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      breadcrumbsManager.set([
        { id: 'home', text: 'Home' },
        { id: 'test', text: 'Test' }
      ]);

      const updateBtn = document.getElementById('breadcrumb_update');
      expect(updateBtn).toBeTruthy();

      updateBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const currentItems = breadcrumbsManager.get();
      const updatedItem = currentItems[0]; // Should update first item
      expect(updatedItem.text).toMatch(/^Updated \d+$/);
      expect(updatedItem.caption).toBe('Recently updated');
    });

    test('should execute show status test', async () => {
      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      
      // Set some test breadcrumbs
      breadcrumbsManager.set([
        { id: 'home', text: 'Home' },
        { id: 'test', text: 'Test' }
      ]);

      const statusBtn = document.getElementById('breadcrumb_status');
      expect(statusBtn).toBeTruthy();

      statusBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw and should complete successfully
      expect(breadcrumbsManager.isAvailable()).toBe(true);
      expect(breadcrumbsManager.get()).toHaveLength(2);
    });
  });

  describe('Breadcrumb Click Handlers', () => {
    test('should execute breadcrumb click handlers', async () => {
      // Set up breadcrumbs with click handlers
      const actionsBtn = document.getElementById('breadcrumb_actions');
      actionsBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      const breadcrumbsWithActions = breadcrumbsManager.get();

      // Test the first breadcrumb click handler
      const dashboardItem = breadcrumbsWithActions[0];
      expect(dashboardItem.clickHandler).toBeTruthy();
      
      // Mock console.log to capture handler execution
      const logSpy = jest.spyOn(console, 'log');
      
      if (dashboardItem.clickHandler) {
        dashboardItem.clickHandler(dashboardItem);
      }

      // Verify that the click handler was executed
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('🍞 Breadcrumb action clicked: Dashboard')
      );
    });

    test('should handle breadcrumb DOM clicks', async () => {
      // Set up breadcrumbs with actions
      const actionsBtn = document.getElementById('breadcrumb_actions');
      actionsBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Find a clickable breadcrumb in the DOM
      const clickableBreadcrumb = document.querySelector('[data-breadcrumb-id="settings"]');
      expect(clickableBreadcrumb).toBeTruthy();

      // Mock window.alert for the settings breadcrumb click
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Simulate click on the settings breadcrumb
      clickableBreadcrumb?.dispatchEvent(new Event('click', { bubbles: true }));

      // Wait for event handling
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(alertSpy).toHaveBeenCalledWith('Breadcrumb action executed: Settings');
      
      alertSpy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle PageContext unavailable gracefully', async () => {
      // Create an isolated debug page without proper context
      const isolatedDebugPage = new DebugPage();
      
      expect(isolatedDebugPage.hasPageContext()).toBe(false);
      await expect(isolatedDebugPage.getPageContext()).rejects.toThrow();
    });

    test('should handle missing DOM elements gracefully', () => {
      // Remove a button element
      const testBtn = document.getElementById('breadcrumb_single');
      testBtn?.remove();

      // Should not throw when trying to click non-existent button
      expect(() => {
        const removedBtn = document.getElementById('breadcrumb_single');
        removedBtn?.click();
      }).not.toThrow();
    });

    test('should handle rapid button clicks', async () => {
      const singleBtn = document.getElementById('breadcrumb_single');
      const multiBtn = document.getElementById('breadcrumb_multi');
      
      // Rapid fire clicks
      singleBtn?.click();
      multiBtn?.click();
      singleBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 150));

      // Should end up with the last clicked test result
      const pageContext = await debugPage.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      const currentItems = breadcrumbsManager.get();

      expect(currentItems).toHaveLength(1);
      expect(currentItems[0].text).toBe('Debug Page');
    });
  });

  describe('Console Logging Integration', () => {
    test('should log breadcrumb operations to test console', async () => {
      // Set up spy on console.log to capture DebugPage logging
      const logSpy = jest.spyOn(console, 'log');

      const singleBtn = document.getElementById('breadcrumb_single');
      singleBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should log PageContext breadcrumb operations
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('🍞 PageContext - Single page breadcrumb set: Debug Page')
      );
    });

    test('should verify test console element exists', () => {
      const testConsole = document.getElementById('test_console');
      expect(testConsole).toBeTruthy();
    });
  });
});