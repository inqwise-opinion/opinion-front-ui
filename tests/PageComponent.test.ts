/**
 * Unit tests for Page Components
 * Tests PageComponent base class, DashboardPage, DashboardPageComponent, and DebugPage
 * Covers initialization, lifecycle, event handling, responsive behavior, and cleanup
 */

import { PageComponent, PageComponentConfig } from '../src/components/PageComponent';
import { DashboardPageComponent, DashboardPageConfig } from '../src/pages/DashboardPageComponent';
import DashboardPage from '../src/pages/DashboardPage';
import DebugPage from '../src/pages/DebugPage';
import Layout from '../src/components/Layout';
import { MockApiService } from '../src/services/MockApiService';

// Mock Layout class
jest.mock('../src/components/Layout');
jest.mock('../src/services/MockApiService');

// Concrete implementation of PageComponent for testing
class TestPageComponent extends PageComponent {
  public initCalled = false;
  public destroyCalled = false;
  public eventListenersCalled = false;

  protected async onInit(): Promise<void> {
    this.initCalled = true;
  }

  protected onDestroy(): void {
    this.destroyCalled = true;
  }

  protected setupEventListeners(): void {
    this.eventListenersCalled = true;
  }

  // Expose protected methods for testing
  public testHandleAction(action: string, element: Element, event: Event): void {
    return this.handleAction(action, element, event);
  }

  public testHandleKeydown(event: KeyboardEvent): void {
    return this.handleKeydown(event);
  }

  public testAddEventListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    return this.addEventListener(element, event, handler, options);
  }

  public testUpdatePageTitle(title: string): void {
    return this.updatePageTitle(title);
  }

  public testShowLoading(message?: string): void {
    return this.showLoading(message);
  }

  public testHideLoading(): void {
    return this.hideLoading();
  }

  public testShowError(message: string, error?: Error): void {
    return this.showError(message, error);
  }

  public testGetElement(selector: string, required?: boolean): Element | null {
    return this.getElement(selector, required);
  }

  // Test action handlers
  public handleTestAction(element: Element, event: Event): void {
    element.setAttribute('data-action-called', 'true');
  }
}

describe('Page Components', () => {
  let mockLayout: jest.Mocked<Layout>;
  let mockApiService: jest.Mocked<MockApiService>;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    // Create basic DOM structure
    const appElement = document.createElement('div');
    appElement.id = 'app';
    document.body.appendChild(appElement);

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Set up window.location using jsdom
    delete (window as any).location;
    window.location = new URL('http://localhost:3000/dashboard') as any;

    // Mock document ready state
    Object.defineProperty(document, 'readyState', {
      writable: true,
      configurable: true,
      value: 'complete'
    });

    // Mock fetch
    global.fetch = jest.fn();

    // Create mock instances
    mockLayout = new Layout() as jest.Mocked<Layout>;
    mockApiService = new MockApiService() as jest.Mocked<MockApiService>;

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    // Restore console methods
    jest.restoreAllMocks();

    // Clear all timers
    jest.clearAllTimers();
  });

  describe('PageComponent Base Class', () => {
    let pageComponent: TestPageComponent;

    describe('Constructor and Configuration', () => {
      test('should create instance with default config', () => {
        pageComponent = new TestPageComponent({ autoInit: false });
        
        expect(pageComponent).toBeInstanceOf(PageComponent);
        expect(pageComponent.isInitialized).toBe(false);
        expect(pageComponent.isDestroyed).toBe(false);
        expect(pageComponent.getPageTitle).toBe('Page');
      });

      test('should create instance with custom config', () => {
        const config: PageComponentConfig = {
          pageTitle: 'Custom Page',
          autoInit: false
        };
        
        pageComponent = new TestPageComponent(config);
        
        expect(pageComponent.getPageTitle).toBe('Custom Page');
      });

      test('should auto-initialize when autoInit is true', async () => {
        jest.useFakeTimers();
        
        pageComponent = new TestPageComponent({ pageTitle: 'Auto Init Page' });
        
        // Wait for setTimeout to execute
        jest.runOnlyPendingTimers();
        await Promise.resolve(); // Wait for async init

        expect(pageComponent.initCalled).toBe(true);
        expect(pageComponent.isInitialized).toBe(true);

        jest.useRealTimers();
      });
    });

    describe('Initialization and Lifecycle', () => {
      beforeEach(() => {
        pageComponent = new TestPageComponent({ autoInit: false });
      });

      afterEach(() => {
        if (pageComponent && !pageComponent.isDestroyed) {
          pageComponent.destroy();
        }
      });

      test('should initialize successfully', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        
        await pageComponent.init();
        
        expect(pageComponent.isInitialized).toBe(true);
        expect(pageComponent.initCalled).toBe(true);
        expect(pageComponent.eventListenersCalled).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('TestPageComponent: Initializing...');
        expect(consoleSpy).toHaveBeenCalledWith('TestPageComponent: Initialized successfully');
      });

      test('should wait for DOM ready if document is loading', async () => {
        Object.defineProperty(document, 'readyState', { value: 'loading' });
        
        const domLoadedPromise = pageComponent.init();
        
        // Simulate DOMContentLoaded event
        document.dispatchEvent(new Event('DOMContentLoaded'));
        
        await domLoadedPromise;
        
        expect(pageComponent.isInitialized).toBe(true);
      });

      test('should prevent double initialization', async () => {
        const consoleSpy = jest.spyOn(console, 'warn');
        
        await pageComponent.init();
        await pageComponent.init(); // Second init attempt
        
        expect(consoleSpy).toHaveBeenCalledWith('TestPageComponent: Cannot initialize - already initialized or destroyed');
      });

      test('should handle initialization errors', async () => {
        const error = new Error('Init failed');
        pageComponent.onInit = jest.fn().mockRejectedValue(error);
        
        await expect(pageComponent.init()).rejects.toThrow('Init failed');
        expect(pageComponent.isInitialized).toBe(false);
      });

      test('should destroy successfully', () => {
        pageComponent.destroy();
        
        expect(pageComponent.isDestroyed).toBe(true);
        expect(pageComponent.isInitialized).toBe(false);
        expect(pageComponent.destroyCalled).toBe(true);
      });

      test('should prevent double destruction', () => {
        const consoleSpy = jest.spyOn(console, 'warn');
        
        pageComponent.destroy();
        pageComponent.destroy(); // Second destroy attempt
        
        expect(consoleSpy).toHaveBeenCalledWith('TestPageComponent: Already destroyed');
      });

      test('should handle destruction errors', () => {
        pageComponent.onDestroy = jest.fn().mockImplementation(() => {
          throw new Error('Destroy failed');
        });
        
        expect(() => pageComponent.destroy()).not.toThrow();
        expect(pageComponent.isDestroyed).toBe(true);
      });
    });

    describe('Event Handling', () => {
      beforeEach(async () => {
        pageComponent = new TestPageComponent({ autoInit: false });
        await pageComponent.init();
      });

      afterEach(() => {
        pageComponent.destroy();
      });

      test('should add and track event listeners', () => {
        const element = document.createElement('button');
        const handler = jest.fn();
        
        pageComponent.testAddEventListener(element, 'click', handler);
        
        // Trigger event
        element.click();
        
        expect(handler).toHaveBeenCalled();
      });

      test('should remove all event listeners on destroy', () => {
        const element = document.createElement('button');
        const handler = jest.fn();
        
        pageComponent.testAddEventListener(element, 'click', handler);
        pageComponent.destroy();
        
        // Event should not fire after destroy
        element.click();
        
        expect(handler).toHaveBeenCalledTimes(0);
      });

      test('should handle data-action clicks', () => {
        const button = document.createElement('button');
        button.setAttribute('data-action', 'testAction');
        document.body.appendChild(button);
        
        const event = new MouseEvent('click', { bubbles: true });
        button.dispatchEvent(event);
        
        expect(button.getAttribute('data-action-called')).toBe('true');
      });

      test('should handle unknown actions gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn');
        const button = document.createElement('button');
        button.setAttribute('data-action', 'unknownAction');
        
        pageComponent.testHandleAction('unknownAction', button, new Event('click'));
        
        expect(consoleSpy).toHaveBeenCalledWith(
          'TestPageComponent: No handler found for action \'unknownAction\' (handleUnknownAction)'
        );
      });

      test('should handle keyboard shortcuts', () => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        
        // Create dropdown to test escape handling
        const dropdown = document.createElement('div');
        dropdown.setAttribute('aria-expanded', 'true');
        document.body.appendChild(dropdown);
        
        pageComponent.testHandleKeydown(event);
        
        expect(dropdown.getAttribute('aria-expanded')).toBe('false');
      });
    });

    describe('Utility Methods', () => {
      beforeEach(async () => {
        pageComponent = new TestPageComponent({ autoInit: false });
        await pageComponent.init();
      });

      afterEach(() => {
        pageComponent.destroy();
      });

      test('should update page title', () => {
        const titleElement = document.createElement('div');
        titleElement.id = 'current_page_title';
        document.body.appendChild(titleElement);
        
        pageComponent.testUpdatePageTitle('New Title');
        
        expect(document.title).toBe('New Title');
        expect(titleElement.textContent).toBe('New Title');
      });

      test('should show/hide loading state', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        
        pageComponent.testShowLoading('Custom loading...');
        expect(consoleSpy).toHaveBeenCalledWith('TestPageComponent: Custom loading...');
        
        pageComponent.testHideLoading();
        expect(consoleSpy).toHaveBeenCalledWith('TestPageComponent: Loading complete');
      });

      test('should show error messages', () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const error = new Error('Test error');
        
        pageComponent.testShowError('Something went wrong', error);
        
        expect(consoleSpy).toHaveBeenCalledWith('TestPageComponent: Something went wrong', error);
      });

      test('should get elements with error handling', () => {
        const element = document.createElement('div');
        element.className = 'test-element';
        document.body.appendChild(element);
        
        const found = pageComponent.testGetElement('.test-element');
        const notFound = pageComponent.testGetElement('.nonexistent', false);
        
        expect(found).toBe(element);
        expect(notFound).toBeNull();
      });

      test('should log error for required missing elements', () => {
        const consoleSpy = jest.spyOn(console, 'error');
        
        pageComponent.testGetElement('.nonexistent', true);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          'TestPageComponent: Required element not found: .nonexistent'
        );
      });
    });
  });

  describe('DashboardPage', () => {
    let dashboardPage: DashboardPage;

    beforeEach(() => {
      dashboardPage = new DashboardPage(mockApiService);
      
      // Mock fetch for template loading
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>Mock dashboard template</div>')
      });
    });

    afterEach(() => {
      if (dashboardPage) {
        dashboardPage.destroy();
      }
    });

    test('should initialize successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await dashboardPage.init();
      
      expect(consoleSpy).toHaveBeenCalledWith('DashboardPage - Initializing...');
      expect(consoleSpy).toHaveBeenCalledWith('DashboardPage - Ready');
    });

    test('should load template into app element', async () => {
      const appElement = document.getElementById('app');
      
      await dashboardPage.init();
      
      expect(global.fetch).toHaveBeenCalledWith('/dashboard.html');
      expect(appElement?.innerHTML).toContain('Mock dashboard template');
    });

    test('should handle template loading failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });
      
      await expect(dashboardPage.init()).rejects.toThrow('Failed to load template: 404');
    });

    test('should setup navigation handlers', async () => {
      // Create mock navigation elements
      const navContainer = document.createElement('div');
      navContainer.className = 'header-navigation-tabs';
      const navLink = document.createElement('a');
      navLink.href = '/test';
      navContainer.appendChild(navLink);
      document.body.appendChild(navContainer);
      
      await dashboardPage.init();
      
      // Test navigation click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      navLink.dispatchEvent(clickEvent);
      
      // Should prevent default and handle navigation
      expect(clickEvent.defaultPrevented).toBe(true);
    });

    test('should handle responsive behavior', async () => {
      await dashboardPage.init();
      
      // Test mobile layout
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      window.dispatchEvent(new Event('resize'));
      
      // Wait for debounced resize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(document.body.classList.contains('mobile-layout')).toBe(true);
    });

    test('should clean up on destroy', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      dashboardPage.destroy();
      
      expect(consoleSpy).toHaveBeenCalledWith('DashboardPage - Destroying...');
    });
  });

  describe('DashboardPageComponent', () => {
    let dashboardPageComponent: DashboardPageComponent;

    beforeEach(() => {
      // Create necessary DOM elements for dashboard
      const sidebar = document.createElement('div');
      sidebar.id = 'app_sidebar';
      sidebar.className = 'app-sidebar';
      document.body.appendChild(sidebar);

      const sidebarToggle = document.createElement('button');
      sidebarToggle.id = 'sidebar_toggle';
      document.body.appendChild(sidebarToggle);

      const compactToggle = document.createElement('button');
      compactToggle.id = 'sidebar_compact_toggle';
      document.body.appendChild(compactToggle);

      const userMenuTrigger = document.createElement('button');
      userMenuTrigger.id = 'user_menu_trigger';
      document.body.appendChild(userMenuTrigger);

      const userMenuDropdown = document.createElement('div');
      userMenuDropdown.id = 'user_menu_dropdown';
      userMenuDropdown.style.display = 'none';
      document.body.appendChild(userMenuDropdown);

      const overlay = document.createElement('div');
      overlay.id = 'sidebar_overlay';
      document.body.appendChild(overlay);

      dashboardPageComponent = new DashboardPageComponent({
        layout: mockLayout,
        autoInit: false
      });
    });

    afterEach(() => {
      if (dashboardPageComponent && !dashboardPageComponent.isDestroyed) {
        dashboardPageComponent.destroy();
      }
    });

    test('should initialize with layout', async () => {
      mockLayout.init.mockResolvedValue();
      
      await dashboardPageComponent.init();
      
      expect(mockLayout.init).toHaveBeenCalled();
      expect(dashboardPageComponent.isInitialized).toBe(true);
    });

    test('should toggle sidebar on desktop', async () => {
      await dashboardPageComponent.init();
      
      const sidebarToggle = document.getElementById('sidebar_toggle') as HTMLElement;
      const sidebar = document.getElementById('app_sidebar') as HTMLElement;
      
      // Initial state - not collapsed
      expect(sidebar.classList.contains('sidebar-collapsed')).toBe(false);
      
      // Click to collapse
      sidebarToggle.click();
      
      expect(sidebar.classList.contains('sidebar-collapsed')).toBe(true);
      expect(document.body.classList.contains('sidebar-closed')).toBe(true);
    });

    test('should toggle compact mode', async () => {
      await dashboardPageComponent.init();
      
      const compactToggle = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      const sidebar = document.getElementById('app_sidebar') as HTMLElement;
      
      // Initial state - not compact
      expect(sidebar.classList.contains('sidebar-compact')).toBe(false);
      
      // Click to enable compact
      compactToggle.click();
      
      expect(sidebar.classList.contains('sidebar-compact')).toBe(true);
      expect(document.body.getAttribute('data-sidebar-state')).toBe('compact');
    });

    test('should toggle user menu', async () => {
      await dashboardPageComponent.init();
      
      const userMenuTrigger = document.getElementById('user_menu_trigger') as HTMLElement;
      const userMenuDropdown = document.getElementById('user_menu_dropdown') as HTMLElement;
      
      // Initial state - closed
      expect(userMenuDropdown.style.display).toBe('none');
      
      // Click to open
      userMenuTrigger.click();
      
      expect(userMenuDropdown.style.display).toBe('block');
      expect(userMenuDropdown.classList.contains('show')).toBe(true);
      expect(userMenuTrigger.classList.contains('active')).toBe(true);
    });

    test('should close user menu when clicking outside', async () => {
      await dashboardPageComponent.init();
      
      const userMenuTrigger = document.getElementById('user_menu_trigger') as HTMLElement;
      const userMenuDropdown = document.getElementById('user_menu_dropdown') as HTMLElement;
      
      // Open menu first
      userMenuTrigger.click();
      expect(userMenuDropdown.style.display).toBe('block');
      
      // Click outside
      document.body.click();
      
      expect(userMenuDropdown.style.display).toBe('none');
    });

    test('should handle keyboard shortcuts', async () => {
      await dashboardPageComponent.init();
      
      const sidebar = document.getElementById('app_sidebar') as HTMLElement;
      
      // Test Ctrl+S for sidebar toggle
      const ctrlSEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });
      
      document.dispatchEvent(ctrlSEvent);
      
      expect(ctrlSEvent.defaultPrevented).toBe(true);
      expect(sidebar.classList.contains('sidebar-collapsed')).toBe(true);
    });

    test('should handle responsive state changes', async () => {
      await dashboardPageComponent.init();
      
      const sidebar = document.getElementById('app_sidebar') as HTMLElement;
      
      // Simulate mobile view
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      window.dispatchEvent(new Event('resize'));
      
      // Wait for debounced resize
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(dashboardPageComponent.sidebarState.mobile).toBe(true);
      expect(sidebar.classList.contains('sidebar-collapsed')).toBe(true);
    });

    test('should handle mobile sidebar toggle', async () => {
      // Set mobile view
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      
      await dashboardPageComponent.init();
      
      const sidebarToggle = document.getElementById('sidebar_toggle') as HTMLElement;
      const overlay = document.getElementById('sidebar_overlay') as HTMLElement;
      
      // Click to open mobile sidebar
      sidebarToggle.click();
      
      expect(document.body.classList.contains('sidebar-open')).toBe(true);
      expect(overlay.classList.contains('active')).toBe(true);
    });

    test('should load mock user data', async () => {
      const usernameElement = document.createElement('div');
      usernameElement.id = 'label_username';
      document.body.appendChild(usernameElement);
      
      await dashboardPageComponent.init();
      
      expect(usernameElement.textContent).toBe('Demo User');
    });

    test('should expose sidebar state', async () => {
      await dashboardPageComponent.init();
      
      const initialState = dashboardPageComponent.sidebarState;
      
      expect(initialState.compact).toBe(false);
      expect(initialState.collapsed).toBe(false);
      expect(initialState.mobile).toBe(false);
    });

    test('should handle feedback action', async () => {
      await dashboardPageComponent.init();
      
      // Mock confirm dialog
      window.confirm = jest.fn().mockReturnValue(true);
      
      const button = document.createElement('button');
      button.setAttribute('data-action', 'feedback');
      document.body.appendChild(button);
      
      const event = new MouseEvent('click', { bubbles: true });
      button.dispatchEvent(event);
      
      expect(window.confirm).toHaveBeenCalled();
    });

    test('should clean up on destroy', async () => {
      await dashboardPageComponent.init();
      
      const consoleSpy = jest.spyOn(console, 'log');
      
      dashboardPageComponent.destroy();
      
      expect(mockLayout.destroy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('DashboardPageComponent: Destroyed');
      expect(document.body.classList.contains('sidebar-open')).toBe(false);
    });
  });

  describe('DebugPage', () => {
    let debugPage: DebugPage;

    beforeEach(() => {
      debugPage = new DebugPage();
    });

    afterEach(() => {
      if (debugPage) {
        debugPage.destroy();
      }
    });

    test('should initialize successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await debugPage.init();
      
      expect(consoleSpy).toHaveBeenCalledWith('🏗️ DEBUGPAGE - init() START');
      expect(consoleSpy).toHaveBeenCalledWith('✅ DEBUGPAGE - Initialization completed successfully!');
    });

    test('should create fallback template', async () => {
      const appElement = document.getElementById('app');
      
      await debugPage.init();
      
      expect(appElement?.innerHTML).toContain('🛠️ Debug Page');
      expect(appElement?.innerHTML).toContain('debug-page-content');
    });

    test('should setup test controls', async () => {
      await debugPage.init();
      
      const testUserLoading = document.getElementById('test_user_loading');
      const testViewportInfo = document.getElementById('test_viewport_info');
      const clearConsole = document.getElementById('clear_console');
      
      expect(testUserLoading).toBeTruthy();
      expect(testViewportInfo).toBeTruthy();
      expect(clearConsole).toBeTruthy();
    });

    test('should handle test button clicks', async () => {
      await debugPage.init();
      
      const testViewportInfo = document.getElementById('test_viewport_info') as HTMLElement;
      const viewportInfo = document.getElementById('viewport_info') as HTMLElement;
      
      testViewportInfo.click();
      
      expect(viewportInfo.innerHTML).toContain('Width: 1024px');
      expect(viewportInfo.innerHTML).toContain('Height: 768px');
    });

    test('should clear test console', async () => {
      await debugPage.init();
      
      const testConsole = document.getElementById('test_console') as HTMLElement;
      const clearConsole = document.getElementById('clear_console') as HTMLElement;
      
      // Add some content
      testConsole.innerHTML = 'Test content';
      
      clearConsole.click();
      
      expect(testConsole.innerHTML).toBe('');
    });

    test('should handle responsive behavior', async () => {
      await debugPage.init();
      
      const layoutStatus = document.getElementById('layout_status');
      
      // Trigger viewport update
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      window.dispatchEvent(new Event('resize'));
      
      // Wait for debounced resize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(layoutStatus?.innerHTML).toContain('Device: Mobile');
    });

    test('should update layout status', async () => {
      // Create mock layout elements
      const header = document.createElement('div');
      header.className = 'app-header';
      document.body.appendChild(header);
      
      await debugPage.init();
      
      const layoutStatus = document.getElementById('layout_status');
      
      expect(layoutStatus?.innerHTML).toContain('Header: ✅');
    });

    test('should set page title', async () => {
      await debugPage.init();
      
      expect(document.title).toBe('Debug - Opinion');
    });

    test('should clean up on destroy', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      debugPage.destroy();
      
      expect(consoleSpy).toHaveBeenCalledWith('DebugPage - Destroying...');
    });

    test('should handle DOM not ready state', async () => {
      Object.defineProperty(document, 'readyState', { value: 'loading' });
      
      const initPromise = debugPage.init();
      
      // Simulate DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      await initPromise;
      
      expect(document.getElementById('debug-page-content')).toBeTruthy();
    });

    test('should prevent double initialization', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      
      await debugPage.init();
      await debugPage.init(); // Second init attempt
      
      expect(consoleSpy).toHaveBeenCalledWith('🏗️ DEBUGPAGE - Already initialized, skipping');
    });
  });

  describe('Integration Tests', () => {
    test('should handle page transitions', async () => {
      // Test transition between different page types
      const debugPage = new DebugPage();
      await debugPage.init();
      
      expect(document.title).toBe('Debug - Opinion');
      
      debugPage.destroy();
      
      // Switch to dashboard page
      const dashboardPageComponent = new DashboardPageComponent({
        autoInit: false,
        layout: mockLayout
      });
      
      await dashboardPageComponent.init();
      
      expect(dashboardPageComponent.isInitialized).toBe(true);
      
      dashboardPageComponent.destroy();
    });

    test('should handle memory management across pages', async () => {
      const pages: any[] = [];
      
      // Create multiple page instances
      for (let i = 0; i < 3; i++) {
        const page = new TestPageComponent({ autoInit: false });
        await page.init();
        pages.push(page);
      }
      
      expect(pages).toHaveLength(3);
      expect(pages.every(p => p.isInitialized)).toBe(true);
      
      // Destroy all pages
      pages.forEach(page => page.destroy());
      
      expect(pages.every(p => p.isDestroyed)).toBe(true);
    });

    test('should handle error propagation between components', async () => {
      const pageComponent = new TestPageComponent({ autoInit: false });
      
      // Mock layout error
      mockLayout.init.mockRejectedValue(new Error('Layout failed'));
      
      const dashboardPageComponent = new DashboardPageComponent({
        autoInit: false,
        layout: mockLayout
      });
      
      await expect(dashboardPageComponent.init()).rejects.toThrow('Layout failed');
    });
  });
});
