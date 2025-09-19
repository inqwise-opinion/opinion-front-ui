/**
 * Integration test for Error Message functionality
 * Tests the complete flow from LayoutContext to ErrorMessages display
 */

import { LayoutContextImpl } from '../src/contexts/LayoutContextImpl';
import type { Messages } from '../src/components/Messages';
import MainContentImpl from '../src/components/MainContentImpl';

// Mock Messages component
const mockMessages: jest.Mocked<Messages> = {
  showError: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn(),
  showSuccess: jest.fn(),
  clearMessages: jest.fn(),
  clearMessagesByType: jest.fn(),
  hasMessages: jest.fn().mockReturnValue(false),
  addMessage: jest.fn(),
  removeMessage: jest.fn(),
  init: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn(),
};

describe('Error Message Integration', () => {
  let layoutContext: LayoutContextImpl;
  let mockMessages: jest.Mocked<Messages>;

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

    // Initialize the layout context
    const mainContent = new MainContentImpl();
    layoutContext = new LayoutContextImpl(mainContent);
    layoutContext.setMessages(mockMessages);
  });

  afterEach(() => {
    if (layoutContext) {
      layoutContext.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('LayoutContext Error Message Methods', () => {

    test('should delegate showError to Layout component', () => {
      layoutContext.showError('Test Error', 'Error description');

      expect(mockMessages.showError).toHaveBeenCalledWith('Test Error', 'Error description', undefined);
    });

    test('should delegate showWarning to Layout component', () => {
      layoutContext.showWarning('Test Warning', 'Warning description');

      expect(mockMessages.showWarning).toHaveBeenCalledWith('Test Warning', 'Warning description', undefined);
    });

    test('should delegate showInfo to Layout component', () => {
      layoutContext.showInfo('Test Info', 'Info description');

      expect(mockMessages.showInfo).toHaveBeenCalledWith('Test Info', 'Info description', undefined);
    });

    test('should delegate showSuccess to Layout component', () => {
      layoutContext.showSuccess('Test Success', 'Success description');

      expect(mockMessages.showSuccess).toHaveBeenCalledWith('Test Success', 'Success description', undefined);
    });

    test('should delegate clearMessages to Layout component', () => {
      layoutContext.clearMessages(false);

      expect(mockMessages.clearMessages).toHaveBeenCalledWith(false);
    });

    test('should delegate clearMessagesByType to Layout component', () => {
      layoutContext.clearMessagesByType('error');

      expect(mockMessages.clearMessagesByType).toHaveBeenCalledWith('error');
    });

    test('should delegate hasMessages to ErrorMessages component via Layout', () => {
      const result = layoutContext.hasMessages('error');

      expect(mockMessages.hasMessages).toHaveBeenCalledWith('error');
      expect(result).toBe(false); // Based on mock return value
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Layout gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showError('Test Error');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support error messages');
    });

    test('should handle missing Messages component gracefully', () => {
      layoutContext.setMessages(null);
      
      const consoleSpy = jest.spyOn(console, 'warn');

      layoutContext.showError('Test Error');

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Messages component not available');
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

    test('should handle complete message workflow', () => {
      // Show different message types
      layoutContext.showError('Connection Failed', 'Network error');
      layoutContext.showWarning('Session Expiring', 'Save your work');
      layoutContext.showInfo('Feature Available', 'New dashboard');
      layoutContext.showSuccess('Data Saved', 'Successfully saved');

      // Verify all calls were made
      expect(mockMessages.showError).toHaveBeenCalledWith('Connection Failed', 'Network error', undefined);
      expect(mockMessages.showWarning).toHaveBeenCalledWith('Session Expiring', 'Save your work', undefined);
      expect(mockMessages.showInfo).toHaveBeenCalledWith('Feature Available', 'New dashboard', undefined);
      expect(mockMessages.showSuccess).toHaveBeenCalledWith('Data Saved', 'Successfully saved', undefined);

      // Clear operations
      layoutContext.clearMessagesByType('error');
      layoutContext.clearMessages(false);
      layoutContext.clearMessages(true);

      expect(mockMessages.clearMessagesByType).toHaveBeenCalledWith('error');
      expect(mockMessages.clearMessages).toHaveBeenCalledWith(false);
      expect(mockMessages.clearMessages).toHaveBeenCalledWith(true);
    });

    test('should handle message checking workflow', () => {
      mockMessages.hasMessages
        .mockReturnValueOnce(true)   // has any messages
        .mockReturnValueOnce(false)  // no error messages
        .mockReturnValueOnce(true);  // has warning messages

      const hasAny = layoutContext.hasMessages();
      const hasErrors = layoutContext.hasMessages('error');
      const hasWarnings = layoutContext.hasMessages('warning');

      expect(hasAny).toBe(true);
      expect(hasErrors).toBe(false);
      expect(hasWarnings).toBe(true);

      expect(mockMessages.hasMessages).toHaveBeenCalledWith(undefined);
      expect(mockMessages.hasMessages).toHaveBeenCalledWith('error');
      expect(mockMessages.hasMessages).toHaveBeenCalledWith('warning');
    });
  });

  describe('Component Lifecycle', () => {
    test('should handle Messages component registration and removal', () => {
      // Initially no messages component
      layoutContext.setMessages(null);
      layoutContext.showError('Test Error');
      expect(mockMessages.showError).not.toHaveBeenCalled();

      // Register messages
      layoutContext.setMessages(mockMessages);
      layoutContext.showError('Test Error 2');
      expect(mockMessages.showError).toHaveBeenCalledWith('Test Error 2', undefined, undefined);

      // Remove messages component
      layoutContext.setMessages(null);
      layoutContext.showError('Test Error 3');
      
      // Should not call the old messages component
      expect(mockMessages.showError).toHaveBeenCalledTimes(1);
    });
  });
});
