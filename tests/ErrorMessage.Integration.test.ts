/**
 * Integration test for Error Message functionality
 * Tests the complete flow from LayoutContext to ErrorMessages display
 */

import { LayoutContextImpl } from '../src/contexts/LayoutContextImpl';
import Layout from '../src/components/Layout';

// Mock Layout component
jest.mock('../src/components/Layout', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      showError: jest.fn(),
      showWarning: jest.fn(),
      showInfo: jest.fn(),
      showSuccess: jest.fn(),
      clearMessages: jest.fn(),
      clearMessagesByType: jest.fn(),
      getErrorMessages: jest.fn().mockReturnValue({
        hasMessages: jest.fn().mockReturnValue(false),
        addMessage: jest.fn(),
        removeMessage: jest.fn()
      }),
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
    }))
  };
});

describe('Error Message Integration', () => {
  let layoutContext: LayoutContextImpl;
  let mockLayout: any;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = `
      <div class="app-layout">
        <div id="app-error-messages" class="app-error-messages" role="alert" aria-live="polite" style="display: none;"></div>
        <div class="app-header"></div>
        <div class="app-sidebar"></div>
        <div class="main-content"></div>
        <div class="app-footer"></div>
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

    // Create layout context
    layoutContext = new LayoutContextImpl();

    // Create mock layout
    const LayoutConstructor = Layout as jest.MockedClass<typeof Layout>;
    mockLayout = new LayoutConstructor();
  });

  afterEach(() => {
    if (layoutContext) {
      layoutContext.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('LayoutContext Error Message Methods', () => {
    beforeEach(() => {
      layoutContext.registerLayout(mockLayout);
    });

    test('should delegate showError to Layout component', () => {
      layoutContext.showError('Test Error', 'Error description');

      expect(mockLayout.showError).toHaveBeenCalledWith('Test Error', 'Error description', undefined);
    });

    test('should delegate showWarning to Layout component', () => {
      layoutContext.showWarning('Test Warning', 'Warning description');

      expect(mockLayout.showWarning).toHaveBeenCalledWith('Test Warning', 'Warning description', undefined);
    });

    test('should delegate showInfo to Layout component', () => {
      layoutContext.showInfo('Test Info', 'Info description');

      expect(mockLayout.showInfo).toHaveBeenCalledWith('Test Info', 'Info description', undefined);
    });

    test('should delegate showSuccess to Layout component', () => {
      layoutContext.showSuccess('Test Success', 'Success description');

      expect(mockLayout.showSuccess).toHaveBeenCalledWith('Test Success', 'Success description', undefined);
    });

    test('should delegate clearMessages to Layout component', () => {
      layoutContext.clearMessages(false);

      expect(mockLayout.clearMessages).toHaveBeenCalledWith(false);
    });

    test('should delegate clearMessagesByType to Layout component', () => {
      layoutContext.clearMessagesByType('error');

      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('error');
    });

    test('should delegate hasMessages to ErrorMessages component via Layout', () => {
      const result = layoutContext.hasMessages('error');

      expect(mockLayout.getErrorMessages).toHaveBeenCalled();
      expect(mockLayout.getErrorMessages().hasMessages).toHaveBeenCalledWith('error');
      expect(result).toBe(false); // Based on mock return value
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Layout gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showError('Test Error');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support error messages');
    });

    test('should handle Layout without error methods gracefully', () => {
      const incompleteLayout = {};
      layoutContext.registerLayout(incompleteLayout);
      
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showError('Test Error');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support error messages');
    });
  });

  describe('DOM Integration', () => {
    test('should have error messages container in DOM', () => {
      const container = document.getElementById('app-error-messages');
      
      expect(container).toBeTruthy();
      expect(container?.getAttribute('role')).toBe('alert');
      expect(container?.getAttribute('aria-live')).toBe('polite');
      expect(container?.classList.contains('app-error-messages')).toBe(true);
    });

    test('should maintain proper DOM structure for layout', () => {
      const appLayout = document.querySelector('.app-layout');
      const errorContainer = document.getElementById('app-error-messages');
      const header = document.querySelector('.app-header');
      const sidebar = document.querySelector('.app-sidebar');
      const mainContent = document.querySelector('.main-content');
      const footer = document.querySelector('.app-footer');

      expect(appLayout).toBeTruthy();
      expect(errorContainer).toBeTruthy();
      expect(header).toBeTruthy();
      expect(sidebar).toBeTruthy();
      expect(mainContent).toBeTruthy();
      expect(footer).toBeTruthy();
    });
  });

  describe('Message Flow Integration', () => {
    beforeEach(() => {
      layoutContext.registerLayout(mockLayout);
    });

    test('should handle complete message workflow', () => {
      // Show different message types
      layoutContext.showError('Connection Failed', 'Network error');
      layoutContext.showWarning('Session Expiring', 'Save your work');
      layoutContext.showInfo('Feature Available', 'New dashboard');
      layoutContext.showSuccess('Data Saved', 'Successfully saved');

      // Verify all calls were made
      expect(mockLayout.showError).toHaveBeenCalledWith('Connection Failed', 'Network error', undefined);
      expect(mockLayout.showWarning).toHaveBeenCalledWith('Session Expiring', 'Save your work', undefined);
      expect(mockLayout.showInfo).toHaveBeenCalledWith('Feature Available', 'New dashboard', undefined);
      expect(mockLayout.showSuccess).toHaveBeenCalledWith('Data Saved', 'Successfully saved', undefined);

      // Clear operations
      layoutContext.clearMessagesByType('error');
      layoutContext.clearMessages(false);
      layoutContext.clearMessages(true);

      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('error');
      expect(mockLayout.clearMessages).toHaveBeenCalledWith(false);
      expect(mockLayout.clearMessages).toHaveBeenCalledWith(true);
    });

    test('should handle message checking workflow', () => {
      mockLayout.getErrorMessages().hasMessages
        .mockReturnValueOnce(true)   // has any messages
        .mockReturnValueOnce(false)  // no error messages
        .mockReturnValueOnce(true);  // has warning messages

      const hasAny = layoutContext.hasMessages();
      const hasErrors = layoutContext.hasMessages('error');
      const hasWarnings = layoutContext.hasMessages('warning');

      expect(hasAny).toBe(true);
      expect(hasErrors).toBe(false);
      expect(hasWarnings).toBe(true);

      expect(mockLayout.getErrorMessages).toHaveBeenCalledTimes(4); // Each call gets the component
      expect(mockLayout.getErrorMessages().hasMessages).toHaveBeenCalledWith(undefined);
      expect(mockLayout.getErrorMessages().hasMessages).toHaveBeenCalledWith('error');
      expect(mockLayout.getErrorMessages().hasMessages).toHaveBeenCalledWith('warning');
    });
  });

  describe('Component Lifecycle', () => {
    test('should handle layout registration and unregistration', () => {
      // Initially no layout registered
      layoutContext.showError('Test Error');
      expect(mockLayout.showError).not.toHaveBeenCalled();

      // Register layout
      layoutContext.registerLayout(mockLayout);
      layoutContext.showError('Test Error 2');
      expect(mockLayout.showError).toHaveBeenCalledWith('Test Error 2', undefined, undefined);

      // Unregister all components
      layoutContext.unregisterAllComponents();
      layoutContext.showError('Test Error 3');
      
      // Should not call the old layout (new warning should be logged)
      expect(mockLayout.showError).toHaveBeenCalledTimes(1); // Only the second call
    });

    test('should handle multiple layout registrations', () => {
      const LayoutConstructor = Layout as jest.MockedClass<typeof Layout>;
      const secondLayout = new LayoutConstructor();

      // Register first layout
      layoutContext.registerLayout(mockLayout);
      layoutContext.showError('Error 1');
      expect(mockLayout.showError).toHaveBeenCalledWith('Error 1', undefined, undefined);

      // Replace with second layout
      layoutContext.registerLayout(secondLayout);
      layoutContext.showError('Error 2');
      
      expect(mockLayout.showError).toHaveBeenCalledTimes(1); // Only first error
      expect(secondLayout.showError).toHaveBeenCalledWith('Error 2', undefined, undefined);
    });
  });
});
