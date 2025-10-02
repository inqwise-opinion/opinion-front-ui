import { MainContentImpl } from '../../src/components/MainContentImpl';
import type { LayoutContext } from '../../src/contexts/LayoutContext';

// Mock the layout context
jest.mock('../../src/contexts', () => ({
  getLayoutContext: jest.fn(() => ({
    subscribe: jest.fn(() => () => {}),
    getModeType: jest.fn(() => 'desktop'),
    isLayoutMobile: jest.fn(() => false),
    getSidebar: jest.fn(() => ({
      isCompactMode: jest.fn(() => false)
    })),
    registerMainContent: jest.fn(),
    emit: jest.fn()
  }))
}));

describe('MainContent', () => {
  let mainContent: MainContentImpl;
  let mockLayoutContext: LayoutContext;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '';
    
    // Create mock layout structure
    const appLayout = document.createElement('div');
    appLayout.className = 'app-layout';
    
    const header = document.createElement('header');
    header.className = 'app-header';
    appLayout.appendChild(header);
    
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    appLayout.appendChild(footer);
    
    document.body.appendChild(appLayout);
    
    // Mock console methods to avoid noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Create mock layout context
    mockLayoutContext = {
      subscribe: jest.fn(() => () => {}),
      getModeType: jest.fn(() => 'desktop'),
      isLayoutMobile: jest.fn(() => false),
      getSidebar: jest.fn(() => ({
        isCompactMode: jest.fn(() => false)
      })),
      registerMainContent: jest.fn(),
      emit: jest.fn()
    } as any;

    // Create MainContent instance with mock context
    mainContent = new MainContentImpl({}, mockLayoutContext);
  });

  afterEach(() => {
    // Clean up
    if (mainContent) {
      mainContent.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create MainContent instance with default config', () => {
      mainContent = new MainContentImpl();
      expect(mainContent).toBeInstanceOf(MainContentImpl);
    });

    test('should create MainContent instance with custom config', () => {
      const customConfig = {
        className: 'custom-main',
        id: 'custom-app',
        role: 'main',
        ariaLabel: 'Custom main content'
      };
      
      mainContent = new MainContentImpl(customConfig);
      expect(mainContent).toBeInstanceOf(MainContentImpl);
    });

    test('should initialize and create DOM elements', async () => {
      await mainContent.init();
      
      const mainElement = document.querySelector('.app-main');
      expect(mainElement).toBeTruthy();
      expect(mainElement?.tagName.toLowerCase()).toBe('main');
    });

    test('should use existing main element if available', async () => {
      // Create existing main element
      const existingMain = document.createElement('main');
      existingMain.className = 'app-main';
      existingMain.innerHTML = '<div>Existing content</div>';
      document.querySelector('.app-layout')?.appendChild(existingMain);
      
      await mainContent.init();
      
      const mainElements = document.querySelectorAll('.app-main');
      expect(mainElements).toHaveLength(1);
      expect(mainElements[0].innerHTML).toBe('');
    });
  });

  describe('DOM Structure and Content', () => {
    beforeEach(async () => {
      await mainContent.init();
    });

    test('should set content as string', () => {
      const content = '<div>Test content</div>';
      mainContent.setContent(content);
      
      const element = mainContent.getElement();
      expect(element?.innerHTML).toBe(content);
    });

    test('should set content as HTMLElement', () => {
      const content = document.createElement('div');
      content.textContent = 'Test content';
      mainContent.setContent(content);
      
      const element = mainContent.getElement();
      expect(element?.firstChild).toBe(content);
    });

    test('should clear content', () => {
      mainContent.setContent('<div>Test content</div>');
      mainContent.clearContent();
      
      const element = mainContent.getElement();
      expect(element?.innerHTML).toBe('');
    });
  });

  describe('Layout Integration', () => {
    beforeEach(async () => {
      await mainContent.init();
    });

    test('should register with layout context', () => {
      expect(mockLayoutContext.registerMainContent).toHaveBeenCalledWith(mainContent);
    });

    test('should subscribe to layout events', () => {
      expect(mockLayoutContext.subscribe).toHaveBeenCalledWith(
        'sidebar-compact-mode-change',
        expect.any(Function)
      );
    });

    test('should update layout classes for compact mode', () => {
      // Mock sidebar compact mode
      (mockLayoutContext.getSidebar as jest.Mock).mockReturnValue({
        isCompactMode: () => true
      });
      
      // Trigger layout update by calling private method
      (mainContent as any).updateContentLayout();
      
      const element = mainContent.getElement();
      expect(element?.classList.contains('content-sidebar-compact')).toBe(true);
      expect(element?.classList.contains('content-sidebar-normal')).toBe(false);
    });

    test('should update layout classes for mobile mode', () => {
      // Mock mobile mode
      (mockLayoutContext.isLayoutMobile as jest.Mock).mockReturnValue(true);
      
      // Trigger layout update
      (mainContent as any).updateContentLayout();
      
      const element = mainContent.getElement();
      expect(element?.classList.contains('content-mobile')).toBe(true);
    });
  });

  describe('Loading and Error States', () => {
    beforeEach(async () => {
      await mainContent.init();
    });

    test('should set loading state', () => {
      mainContent.setLoading(true);
      
      const element = mainContent.getElement();
      expect(element?.classList.contains('loading')).toBe(true);
      expect(element?.getAttribute('aria-busy')).toBe('true');
      expect(element?.querySelector('.loading-indicator')).toBeTruthy();
    });

    test('should remove loading state', () => {
      mainContent.setLoading(true);
      mainContent.setLoading(false);
      
      const element = mainContent.getElement();
      expect(element?.classList.contains('loading')).toBe(false);
      expect(element?.getAttribute('aria-busy')).toBe(null);
      expect(element?.querySelector('.loading-indicator')).toBeFalsy();
    });

    test('should set error state', () => {
      const errorMessage = 'Test error';
      mainContent.setError(errorMessage);
      
      const element = mainContent.getElement();
      expect(element?.classList.contains('error')).toBe(true);
      
      const errorElement = element?.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain(errorMessage);
    });

    test('should remove error state', () => {
      mainContent.setError('Test error');
      mainContent.setError(null);
      
      const element = mainContent.getElement();
      expect(element?.classList.contains('error')).toBe(false);
      expect(element?.querySelector('.error-message')).toBeFalsy();
    });
  });

  describe('Visibility Control', () => {
    beforeEach(async () => {
      await mainContent.init();
    });

    test('should show/hide content', () => {
      mainContent.hide();
      expect(mainContent.getElement()?.style.display).toBe('none');
      expect(mainContent.getElement()?.getAttribute('aria-hidden')).toBe('true');
      
      mainContent.show();
      expect(mainContent.getElement()?.style.display).toBe('');
      expect(mainContent.getElement()?.getAttribute('aria-hidden')).toBe(null);
    });
  });

  describe('Status and Diagnostics', () => {
    beforeEach(async () => {
      await mainContent.init();
    });

    test('should report correct initialization status', () => {
      expect(mainContent.isReady()).toBe(true);
    });

    test('should provide detailed status information', () => {
      const status = mainContent.getStatus();
      
      expect(status.componentType).toBe('MainContent');
      expect(status.initialized).toBe(true);
      expect(status.domElement).toBeTruthy();
      expect(status.eventListeners.layoutSubscriptions).toBeGreaterThan(0);
    });

    test('should track content updates', () => {
      mainContent.setContent('Test 1');
      mainContent.setContent('Test 2');
      
      const status = mainContent.getStatus();
      expect(status.currentState.contentUpdateCount).toBe(2);
      expect(status.currentState.lastContentUpdate).toBeTruthy();
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(async () => {
      await mainContent.init();
    });

    test('should clean up resources on destroy', async () => {
      const element = mainContent.getElement();
      expect(element).toBeTruthy();
      
      await mainContent.destroy();
      
      expect(() => mainContent.getElement()).toThrow();
      expect(document.querySelector('.app-main')).toBeFalsy();
    });

    test('should unsubscribe from layout events on destroy', async () => {
      const unsubscribeMock = jest.fn();
      mockLayoutContext.subscribe.mockReturnValue(unsubscribeMock);
      mainContent = new MainContentImpl({}, mockLayoutContext);
      await mainContent.init();
      
      await mainContent.destroy();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});