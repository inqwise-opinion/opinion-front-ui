import { Layout } from '../../src/components/Layout';
import AppHeaderImpl from '../../src/components/AppHeaderImpl';
import AppFooterImpl from '../../src/components/AppFooterImpl';
import MainContentImpl from '../../src/components/MainContentImpl';
import SidebarComponent from '../../src/components/SidebarComponent';
import MessagesComponent from '../../src/components/MessagesComponent';
import type { LayoutContext } from '../../src/contexts/LayoutContext';
import { NavigationItem } from '../../src/components/Sidebar';
import { UserMenuItem } from '../../src/components/Layout';

// Mock all component implementations
jest.mock('../../src/components/AppHeaderImpl', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockImplementation(function() {
        mockLayoutContext.registerHeader(this);
        return Promise.resolve();
      }),
      destroy: jest.fn(),
      updateBrand: jest.fn(),
      updateUser: jest.fn(),
      updateUserMenuItems: jest.fn(),
      setVisible: jest.fn()
    }))
  };
});

jest.mock('../../src/components/AppFooterImpl', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockImplementation(function() {
        mockLayoutContext.registerFooter(this);
        return Promise.resolve();
      }),
      destroy: jest.fn(),
      setVisible: jest.fn()
    }))
  };
});

jest.mock('../../src/components/MainContentImpl', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockImplementation(function() {
        mockLayoutContext.registerMainContent(this);
        return Promise.resolve();
      }),
      destroy: jest.fn(),
      setContent: jest.fn(),
      clearContent: jest.fn()
    }))
  };
});

jest.mock('../../src/components/SidebarComponent', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
      updateNavigation: jest.fn(),
      setActivePage: jest.fn()
    }))
  };
});

jest.mock('../../src/components/MessagesComponent', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockImplementation(function() {
        mockLayoutContext.registerMessages?.(this);
        return Promise.resolve();
      }),
      destroy: jest.fn()
    }))
  };
});

// Mock LayoutContext implementation
const mockLayoutContext = {
  subscribe: jest.fn(() => () => {}),
  getModeType: jest.fn(() => 'desktop'),
  isLayoutMobile: jest.fn(() => false),
  isLayoutTablet: jest.fn(() => false),
  isLayoutDesktop: jest.fn(() => true),
  getSidebar: jest.fn(() => null),
  registerMainContent: jest.fn(),
  registerHeader: jest.fn(),
  registerFooter: jest.fn(),
  registerSidebar: jest.fn(),
  unregisterSidebar: jest.fn(),
  unregisterAllComponents: jest.fn(),
  getMessages: jest.fn(),
  markReady: jest.fn(),
  emit: jest.fn(),
  destroy: jest.fn(),
  isReady: jest.fn(() => true),
  getRouter: jest.fn(() => ({}))
} as any as LayoutContext;

jest.mock('../../src/contexts/LayoutContextImpl', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockLayoutContext)
  };
});

jest.mock('../../src/contexts/index', () => ({
  getLayoutContext: jest.fn(() => mockLayoutContext)
}));

describe('Layout', () => {
  let layout: Layout;
  beforeEach(() => {
    // Clear mocks and restore default behavior
    jest.clearAllMocks();
    mockLayoutContext.getModeType.mockReturnValue('desktop');
    mockLayoutContext.isLayoutMobile.mockReturnValue(false);
    mockLayoutContext.isLayoutTablet.mockReturnValue(false);
    mockLayoutContext.isLayoutDesktop.mockReturnValue(true);
    mockLayoutContext.getSidebar.mockReturnValue(null);
    mockLayoutContext.isReady.mockReturnValue(true);
    mockLayoutContext.subscribe.mockReturnValue(() => {});
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup DOM environment
    document.body.innerHTML = `
      <div class="app-layout">
        <header class="app-header"></header>
        <main class="app-main"></main>
        <footer class="app-footer"></footer>
      </div>
    `;

    // Create layout instance
    layout = new Layout();
  });

  afterEach(() => {
    layout.destroy();
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Construction and Configuration', () => {
    test('should create Layout instance with default config', () => {
      expect(layout).toBeInstanceOf(Layout);
      expect(AppHeaderImpl).toHaveBeenCalled();
      expect(AppFooterImpl).toHaveBeenCalled();
      expect(MainContentImpl).toHaveBeenCalled();
    });

    test('should create Layout instance with custom config', () => {
      const customConfig = {
        header: {
          enabled: true,
          brandTitle: 'Custom Brand',
          brandHref: '/custom'
        },
        sidebar: {
          enabled: true,
          defaultWidth: 300,
          compactWidth: 90
        },
        footer: {
          enabled: true,
          copyrightText: 'Custom Copyright'
        }
      };

      layout = new Layout(customConfig);
      
      expect(layout).toBeInstanceOf(Layout);
      expect(AppHeaderImpl).toHaveBeenCalledWith(
        expect.objectContaining(customConfig.header),
        expect.any(Object)
      );
    });

    test('should initialize components with proper configurations', () => {
      const config = {
        header: {
          brandTitle: 'Test Brand',
          showUserMenu: true
        },
        sidebar: {
          defaultWidth: 300
        },
        footer: {
          copyrightText: 'Test Copyright'
        }
      };
      
      layout = new Layout(config);

      expect(AppHeaderImpl).toHaveBeenCalledWith(
        expect.objectContaining(config.header),
        expect.any(Object)
      );
      expect(AppFooterImpl).toHaveBeenCalledWith(
        expect.objectContaining(config.footer),
        expect.any(Object)
      );
    });
  });

  describe('Initialization', () => {
    test('should initialize all enabled components', async () => {
      await layout.init();
      
      const header = (layout as any).header;
      const mainContent = (layout as any).mainContent;
      const messagesComponent = (layout as any).messagesComponent;
      const footer = (layout as any).footer;
      
      expect(header.init).toHaveBeenCalled();
      expect(mainContent.init).toHaveBeenCalled();
      expect(messagesComponent.init).toHaveBeenCalled();
      expect(footer.init).toHaveBeenCalled();
    });

    test('should skip disabled components', async () => {
      layout = new Layout({
        header: { enabled: false },
        footer: { enabled: false },
        sidebar: { enabled: false }
      });
      
      await layout.init();
      
      const header = (layout as any).header;
      const footer = (layout as any).footer;
      const sidebar = (layout as any).sidebar;
      
      expect(header.init).not.toHaveBeenCalled();
      expect(footer.init).not.toHaveBeenCalled();
      expect(sidebar?.init).toBeFalsy();
    });

    test('should mark layout as ready after initialization', async () => {
      await layout.init();
      expect(layout.isReady()).toBe(true);
    });

    test('should register components with layout context', async () => {
      await layout.init();
      
      const mockContext = (layout as any).layoutContext;
      expect(mockContext.registerHeader).toHaveBeenCalled();
      expect(mockContext.registerMainContent).toHaveBeenCalled();
      expect(mockContext.registerFooter).toHaveBeenCalled();
    });
  });

  describe('Navigation Management', () => {
    const testNavItems: NavigationItem[] = [
      { id: 'home', title: 'Home', href: '/' },
      { id: 'about', title: 'About', href: '/about' }
    ];

    beforeEach(async () => {
      await layout.init();
    });

    test('should set and get navigation items', () => {
      layout.setNavigationItems(testNavItems);
      expect(layout.getNavigationItems()).toEqual(testNavItems);
    });

    test('should update navigation item', () => {
      layout.setNavigationItems(testNavItems);
      layout.updateNavigationItem('home', { title: 'New Home' });
      
      const items = layout.getNavigationItems();
      expect(items.find(i => i.id === 'home')?.title).toBe('New Home');
    });

    test('should add navigation item', () => {
      layout.setNavigationItems(testNavItems);
      const newItem = { id: 'new', title: 'New', href: '/new' };
      
      layout.addNavigationItem(newItem);
      expect(layout.getNavigationItems()).toContainEqual(newItem);
    });

    test('should remove navigation item', () => {
      layout.setNavigationItems(testNavItems);
      layout.removeNavigationItem('home');
      
      const items = layout.getNavigationItems();
      expect(items.find(i => i.id === 'home')).toBeUndefined();
    });

    test('should set active navigation item', () => {
      layout.setNavigationItems(testNavItems);
      layout.setActiveNavigationItem('home');
      
      const items = layout.getNavigationItems();
      expect(items.find(i => i.id === 'home')?.active).toBe(true);
      expect(items.find(i => i.id === 'about')?.active).toBe(false);
    });
  });

  describe('User Menu Management', () => {
    const testMenuItems: UserMenuItem[] = [
      { id: 'profile', text: 'Profile', icon: 'user', href: '/profile' },
      { id: 'logout', text: 'Logout', icon: 'logout', action: 'logout' }
    ];

    beforeEach(async () => {
      await layout.init();
    });

    test('should set and get user menu items', () => {
      layout.setUserMenuItems(testMenuItems);
      expect(layout.getUserMenuItems()).toEqual(testMenuItems);
    });

    test('should update user menu item', () => {
      layout.setUserMenuItems(testMenuItems);
      layout.updateUserMenuItem('profile', { text: 'My Profile' });
      
      const items = layout.getUserMenuItems();
      expect(items.find(i => i.id === 'profile')?.text).toBe('My Profile');
    });

    test('should add user menu item', () => {
      layout.setUserMenuItems(testMenuItems);
      const newItem = { id: 'settings', text: 'Settings', icon: 'settings', href: '/settings' };
      
      layout.addUserMenuItem(newItem);
      expect(layout.getUserMenuItems()).toContainEqual(newItem);
    });

    test('should remove user menu item', () => {
      layout.setUserMenuItems(testMenuItems);
      layout.removeUserMenuItem('profile');
      
      const items = layout.getUserMenuItems();
      expect(items.find(i => i.id === 'profile')).toBeUndefined();
    });
  });

  describe('Layout Mode and Responsiveness', () => {
    beforeEach(async () => {
      await layout.init();
    });

    test('should handle layout mode changes', () => {
      mockLayoutContext.getModeType.mockReturnValue('mobile');
      mockLayoutContext.isLayoutMobile.mockReturnValue(true);
      
      // Call handleLayoutModeChange directly
      (layout as any).handleLayoutModeChange({
        type: 'layout-mode-change',
        data: 'mobile',
        timestamp: Date.now()
      });
      
      // Check if CSS classes were updated
      const layoutElement = document.querySelector('.app-layout');
      expect(layoutElement?.classList.contains('layout-mode-mobile')).toBe(true);
      expect(layoutElement?.classList.contains('layout-mobile')).toBe(true);
    });

    test('should update component CSS classes', () => {
      (layout as any).updateComponentCSSClasses((layout as any).layoutContext);
      
      const layoutElement = document.querySelector('.app-layout');
      expect(layoutElement?.classList.contains('layout-mode-desktop')).toBe(true);
    });

    test('should handle sidebar compact mode', () => {
      const mockContext = (layout as any).layoutContext;
      mockContext.getSidebar.mockReturnValue({
        isCompactMode: () => true
      });
      
      (layout as any).updateComponentCSSClasses(mockContext);
      
      expect(document.body.classList.contains('layout-compact')).toBe(true);
    });
  });

  describe('Context Handlers and Lifecycle', () => {
    beforeEach(async () => {
      await layout.init();
    });

    test('should execute context handlers', async () => {
      const handler = jest.fn();
      layout.onContextReady(handler);
      
      expect(handler).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should execute lifecycle handlers in order', async () => {
      // Create a fresh Layout instance without init()
      const testLayout = new Layout();
      const order: string[] = [];
      const handler = {
        id: 'test',
        priority: 1000,
        onPreInit: jest.fn().mockImplementation(() => { order.push('pre') }),
        onContextReady: jest.fn().mockImplementation(() => { order.push('ready') }),
        onPostInit: jest.fn().mockImplementation(() => { order.push('post') })
      };
      
      testLayout.setContextHandler(handler, {
        enableLogging: false,
        continueOnError: true,
        timeout: 5000
      });
      
      await (testLayout as any).executeRegisteredHandlers();
      expect(order).toEqual(['pre', 'ready', 'post']);
      expect(handler.onPreInit).toHaveBeenCalledTimes(1);
      expect(handler.onContextReady).toHaveBeenCalledTimes(1);
      expect(handler.onPostInit).toHaveBeenCalledTimes(1);
    });

    test('should handle errors in handlers', async () => {
      const errorHandler = jest.fn();
      
      layout.setContextHandler({
        id: 'error-test',
        onContextReady: () => { throw new Error('Test error') },
        onError: errorHandler
      });
      
      await (layout as any).executeRegisteredHandlers();
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(async () => {
      await layout.init();
    });

    test('should cleanup all components on destroy', () => {
      const header = (layout as any).header;
      const footer = (layout as any).footer;
      const messagesComponent = (layout as any).messagesComponent;
      
      layout.destroy();
      
      expect(header.destroy).toHaveBeenCalled();
      expect(footer.destroy).toHaveBeenCalled();
      expect(messagesComponent.destroy).toHaveBeenCalled();
    });

    test('should unregister all components from layout context', () => {
      layout.destroy();
      
      const mockContext = (layout as any).layoutContext;
      expect(mockContext.unregisterAllComponents).toHaveBeenCalled();
      expect(mockContext.destroy).toHaveBeenCalled();
    });

    test('should cleanup layout mode classes', () => {
      // Add some layout classes first
      document.body.classList.add('layout-mode-desktop', 'layout-compact');
      
      layout.destroy();
      
      expect(document.body.classList.contains('layout-mode-desktop')).toBe(false);
      expect(document.body.classList.contains('layout-compact')).toBe(false);
    });

    test('should cleanup CSS custom properties', () => {
      // Set some CSS properties first
      document.documentElement.style.setProperty('--layout-mode', 'desktop');
      document.documentElement.style.setProperty('--is-compact', '0');
      
      layout.destroy();
      
      expect(document.documentElement.style.getPropertyValue('--layout-mode')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--is-compact')).toBe('');
    });
  });
});