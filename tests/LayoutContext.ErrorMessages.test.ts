/**
 * Unit tests for LayoutContext Error Messages functionality
 * Tests error message integration between LayoutContext and Layout components
 */

import { LayoutContextImpl } from '../src/contexts/LayoutContextImpl';
import Layout from '../src/components/Layout';
import { ErrorMessagesComponent } from '../src/components/ErrorMessages';

// Mock Layout and ErrorMessages components
jest.mock('../src/components/Layout');
jest.mock('../src/components/ErrorMessages');

describe('LayoutContext - Error Messages', () => {
  let layoutContext: LayoutContextImpl;
  let mockLayout: jest.Mocked<Layout>;
  let mockErrorMessages: jest.Mocked<ErrorMessagesComponent>;

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

    // Create mocks
    mockErrorMessages = {
      showError: jest.fn(),
      showWarning: jest.fn(),
      showInfo: jest.fn(),
      showSuccess: jest.fn(),
      clearAll: jest.fn(),
      clearByType: jest.fn(),
      hasMessages: jest.fn(),
      addMessage: jest.fn(),
      removeMessage: jest.fn(),
      getMessages: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockLayout = {
      showError: jest.fn(),
      showWarning: jest.fn(),
      showInfo: jest.fn(),
      showSuccess: jest.fn(),
      clearMessages: jest.fn(),
      clearMessagesByType: jest.fn(),
      getErrorMessages: jest.fn().mockReturnValue(mockErrorMessages),
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
    } as any;

    // Mock console methods to reduce noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create LayoutContext instance
    layoutContext = new LayoutContextImpl();
  });

  afterEach(() => {
    if (layoutContext) {
      layoutContext.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Basic Error Message Methods', () => {
    beforeEach(() => {
      // Register mock layout with context
      layoutContext.registerLayout(mockLayout);
    });

    test('should show error message via Layout component', () => {
      const title = 'Connection Failed';
      const description = 'Unable to connect to server';
      const options = { autoHide: false };

      layoutContext.showError(title, description, options);

      expect(mockLayout.showError).toHaveBeenCalledWith(title, description, options);
      expect(mockLayout.showError).toHaveBeenCalledTimes(1);
    });

    test('should show warning message via Layout component', () => {
      const title = 'Session Expiring';
      const description = 'Save your work soon';

      layoutContext.showWarning(title, description);

      expect(mockLayout.showWarning).toHaveBeenCalledWith(title, description, undefined);
      expect(mockLayout.showWarning).toHaveBeenCalledTimes(1);
    });

    test('should show info message via Layout component', () => {
      const title = 'New Feature Available';
      const description = 'Check out the dashboard';

      layoutContext.showInfo(title, description);

      expect(mockLayout.showInfo).toHaveBeenCalledWith(title, description, undefined);
      expect(mockLayout.showInfo).toHaveBeenCalledTimes(1);
    });

    test('should show success message via Layout component', () => {
      const title = 'Data Saved';
      const description = 'Changes saved successfully';

      layoutContext.showSuccess(title, description);

      expect(mockLayout.showSuccess).toHaveBeenCalledWith(title, description, undefined);
      expect(mockLayout.showSuccess).toHaveBeenCalledTimes(1);
    });

    test('should handle missing description parameter', () => {
      layoutContext.showError('Simple Error');
      layoutContext.showWarning('Simple Warning');
      layoutContext.showInfo('Simple Info');
      layoutContext.showSuccess('Simple Success');

      expect(mockLayout.showError).toHaveBeenCalledWith('Simple Error', undefined, undefined);
      expect(mockLayout.showWarning).toHaveBeenCalledWith('Simple Warning', undefined, undefined);
      expect(mockLayout.showInfo).toHaveBeenCalledWith('Simple Info', undefined, undefined);
      expect(mockLayout.showSuccess).toHaveBeenCalledWith('Simple Success', undefined, undefined);
    });
  });

  describe('Message Management Methods', () => {
    beforeEach(() => {
      layoutContext.registerLayout(mockLayout);
    });

    test('should clear all messages via Layout component', () => {
      layoutContext.clearMessages();

      expect(mockLayout.clearMessages).toHaveBeenCalledWith(false);
      expect(mockLayout.clearMessages).toHaveBeenCalledTimes(1);
    });

    test('should clear all messages including persistent', () => {
      layoutContext.clearMessages(true);

      expect(mockLayout.clearMessages).toHaveBeenCalledWith(true);
      expect(mockLayout.clearMessages).toHaveBeenCalledTimes(1);
    });

    test('should clear messages by type', () => {
      layoutContext.clearMessagesByType('error');
      layoutContext.clearMessagesByType('warning');
      layoutContext.clearMessagesByType('info');
      layoutContext.clearMessagesByType('success');

      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('error');
      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('warning');
      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('info');
      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('success');
      expect(mockLayout.clearMessagesByType).toHaveBeenCalledTimes(4);
    });

    test('should check for messages via ErrorMessages component', () => {
      mockErrorMessages.hasMessages.mockReturnValue(true);

      const result = layoutContext.hasMessages();

      expect(mockLayout.getErrorMessages).toHaveBeenCalled();
      expect(mockErrorMessages.hasMessages).toHaveBeenCalledWith(undefined);
      expect(result).toBe(true);
    });

    test('should check for messages by type', () => {
      mockErrorMessages.hasMessages.mockReturnValue(false);

      const result = layoutContext.hasMessages('error');

      expect(mockErrorMessages.hasMessages).toHaveBeenCalledWith('error');
      expect(result).toBe(false);
    });
  });

  describe('Error Handling - Layout Not Available', () => {
    test('should log warning when Layout not registered for showError', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showError('Test Error');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support error messages');
    });

    test('should log warning when Layout not registered for showWarning', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showWarning('Test Warning');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support warning messages');
    });

    test('should log warning when Layout not registered for showInfo', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showInfo('Test Info');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support info messages');
    });

    test('should log warning when Layout not registered for showSuccess', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showSuccess('Test Success');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support success messages');
    });

    test('should log warning when Layout not registered for clearMessages', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.clearMessages();

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support clearing messages');
    });

    test('should log warning when Layout not registered for clearMessagesByType', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.clearMessagesByType('error');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support clearing messages by type');
    });

    test('should return false and log warning when Layout not available for hasMessages', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      const result = layoutContext.hasMessages();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support checking messages');
    });
  });

  describe('Error Handling - Layout Methods Missing', () => {
    beforeEach(() => {
      // Register layout without error message methods
      const incompleteLayout = {} as any;
      layoutContext.registerLayout(incompleteLayout);
    });

    test('should handle missing showError method', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showError('Test Error');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support error messages');
    });

    test('should handle missing getErrorMessages method for hasMessages', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      const result = layoutContext.hasMessages();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support checking messages');
    });
  });

  describe('Integration with Multiple Message Types', () => {
    beforeEach(() => {
      layoutContext.registerLayout(mockLayout);
    });

    test('should handle sequence of different message types', () => {
      layoutContext.showInfo('Step 1', 'Starting process...');
      layoutContext.showWarning('Step 2', 'Warning detected...');
      layoutContext.showError('Step 3', 'Error occurred...');
      layoutContext.showSuccess('Step 4', 'Process completed!');

      expect(mockLayout.showInfo).toHaveBeenCalledWith('Step 1', 'Starting process...', undefined);
      expect(mockLayout.showWarning).toHaveBeenCalledWith('Step 2', 'Warning detected...', undefined);
      expect(mockLayout.showError).toHaveBeenCalledWith('Step 3', 'Error occurred...', undefined);
      expect(mockLayout.showSuccess).toHaveBeenCalledWith('Step 4', 'Process completed!', undefined);
      
      expect(mockLayout.showInfo).toHaveBeenCalledTimes(1);
      expect(mockLayout.showWarning).toHaveBeenCalledTimes(1);
      expect(mockLayout.showError).toHaveBeenCalledTimes(1);
      expect(mockLayout.showSuccess).toHaveBeenCalledTimes(1);
    });

    test('should handle clearing different message types', () => {
      layoutContext.clearMessagesByType('error');
      layoutContext.clearMessagesByType('warning');
      layoutContext.clearMessages(false);
      layoutContext.clearMessages(true);

      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('error');
      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('warning');
      expect(mockLayout.clearMessages).toHaveBeenCalledWith(false);
      expect(mockLayout.clearMessages).toHaveBeenCalledWith(true);
    });

    test('should check for different message types', () => {
      mockErrorMessages.hasMessages
        .mockReturnValueOnce(true)  // has error messages
        .mockReturnValueOnce(false) // no warning messages
        .mockReturnValueOnce(true); // has any messages

      const hasErrors = layoutContext.hasMessages('error');
      const hasWarnings = layoutContext.hasMessages('warning');
      const hasAny = layoutContext.hasMessages();

      expect(hasErrors).toBe(true);
      expect(hasWarnings).toBe(false);
      expect(hasAny).toBe(true);

      expect(mockErrorMessages.hasMessages).toHaveBeenCalledWith('error');
      expect(mockErrorMessages.hasMessages).toHaveBeenCalledWith('warning');
      expect(mockErrorMessages.hasMessages).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Component Lifecycle', () => {
    test('should work after layout registration', () => {
      // Initially no layout registered
      layoutContext.showError('Test Error');
      expect(mockLayout.showError).not.toHaveBeenCalled();

      // Register layout
      layoutContext.registerLayout(mockLayout);
      layoutContext.showError('Test Error 2');
      expect(mockLayout.showError).toHaveBeenCalledWith('Test Error 2', undefined, undefined);
    });

    test('should handle layout replacement', () => {
      // Register first layout
      layoutContext.registerLayout(mockLayout);
      layoutContext.showError('Error 1');
      expect(mockLayout.showError).toHaveBeenCalledWith('Error 1', undefined, undefined);

      // Register new layout
      const newMockLayout = {
        showError: jest.fn(),
        getErrorMessages: jest.fn().mockReturnValue(mockErrorMessages),
      } as any;

      layoutContext.registerLayout(newMockLayout);
      layoutContext.showError('Error 2');
      
      expect(mockLayout.showError).toHaveBeenCalledTimes(1); // Only called once
      expect(newMockLayout.showError).toHaveBeenCalledWith('Error 2', undefined, undefined);
    });
  });
});
