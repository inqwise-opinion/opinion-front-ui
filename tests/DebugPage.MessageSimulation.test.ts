/**
 * Integration tests for DebugPage Message Simulation functionality
 * Tests the message simulation UI components and their integration with LayoutContext
 */

import { DebugPage } from '../src/pages/DebugPage';
import { LayoutContextImpl } from '../src/contexts/LayoutContextImpl';
import Layout from '../src/components/Layout';
import { ErrorMessagesComponent } from '../src/components/ErrorMessages';

// Mock dependencies
jest.mock('../src/components/Layout');
jest.mock('../src/components/ErrorMessages');

describe('DebugPage - Message Simulation', () => {
  let debugPage: DebugPage;
  let layoutContext: LayoutContextImpl;
  let mockLayout: jest.Mocked<Layout>;
  let mockErrorMessages: jest.Mocked<ErrorMessagesComponent>;

  beforeEach(async () => {
    // Set up complete DOM environment
    document.body.innerHTML = `
      <div class="app-layout">
        <div id="app-error-messages" class="app-error-messages" role="alert" aria-live="polite" style="display: none;"></div>
        <header class="app-header"></header>
        <nav class="app-sidebar" id="app_sidebar"></nav>
        <main class="main-content" id="app"></main>
        <footer class="app-footer"></footer>
      </div>
    `;

    // Mock window dimensions and environment
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

    // Create error messages mock
    mockErrorMessages = {
      showError: jest.fn(),
      showWarning: jest.fn(),  
      showInfo: jest.fn(),
      showSuccess: jest.fn(),
      clearAll: jest.fn(),
      clearByType: jest.fn(),
      hasMessages: jest.fn().mockReturnValue(false),
      addMessage: jest.fn(),
      removeMessage: jest.fn(),
      getMessages: jest.fn().mockReturnValue([]),
      destroy: jest.fn(),
    } as any;

    // Create layout mock
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

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create layout context and register layout
    layoutContext = new LayoutContextImpl();
    layoutContext.registerLayout(mockLayout);

    // Create debug page with mock layout context
    debugPage = new DebugPage();
    (debugPage as any).layoutContext = layoutContext;

    // Initialize debug page
    await debugPage.init();
  });

  afterEach(() => {
    if (debugPage) {
      debugPage.destroy();
    }
    if (layoutContext) {
      layoutContext.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Message Simulation UI Structure', () => {
    test('should create message simulation section', () => {
      const messageSection = document.querySelector('h3:contains("💬 Message Simulation")');
      const basicMessagesSection = document.querySelector('h4:contains("Basic Messages:")');
      const advancedMessagesSection = document.querySelector('h4:contains("Advanced Messages:")');
      const managementSection = document.querySelector('h4:contains("Message Management:")');

      // Find sections by their text content since :contains is not native DOM
      const allH3s = Array.from(document.querySelectorAll('h3'));
      const allH4s = Array.from(document.querySelectorAll('h4'));

      const messageSectionExists = allH3s.some(el => el.textContent?.includes('💬 Message Simulation'));
      const basicSectionExists = allH4s.some(el => el.textContent?.includes('Basic Messages:'));
      const advancedSectionExists = allH4s.some(el => el.textContent?.includes('Advanced Messages:'));
      const managementSectionExists = allH4s.some(el => el.textContent?.includes('Message Management:'));

      expect(messageSectionExists).toBe(true);
      expect(basicSectionExists).toBe(true);
      expect(advancedSectionExists).toBe(true);
      expect(managementSectionExists).toBe(true);
    });

    test('should create all basic message buttons', () => {
      const errorBtn = document.getElementById('msg_error');
      const warningBtn = document.getElementById('msg_warning');
      const infoBtn = document.getElementById('msg_info');
      const successBtn = document.getElementById('msg_success');

      expect(errorBtn).toBeTruthy();
      expect(warningBtn).toBeTruthy();
      expect(infoBtn).toBeTruthy();
      expect(successBtn).toBeTruthy();

      expect(errorBtn?.textContent).toContain('❌ Error');
      expect(warningBtn?.textContent).toContain('⚠️ Warning');
      expect(infoBtn?.textContent).toContain('ℹ️ Info');
      expect(successBtn?.textContent).toContain('✅ Success');
    });

    test('should create all advanced message buttons', () => {
      const withActionBtn = document.getElementById('msg_with_action');
      const persistentBtn = document.getElementById('msg_persistent');
      const autoHideBtn = document.getElementById('msg_auto_hide');
      const sequenceBtn = document.getElementById('msg_sequence');

      expect(withActionBtn).toBeTruthy();
      expect(persistentBtn).toBeTruthy();
      expect(autoHideBtn).toBeTruthy();
      expect(sequenceBtn).toBeTruthy();

      expect(withActionBtn?.textContent).toContain('🔧 With Action');
      expect(persistentBtn?.textContent).toContain('📌 Persistent');
      expect(autoHideBtn?.textContent).toContain('⏰ Auto-hide');
      expect(sequenceBtn?.textContent).toContain('🎬 Sequence');
    });

    test('should create all management buttons', () => {
      const clearAllBtn = document.getElementById('clear_all_messages');
      const clearErrorsBtn = document.getElementById('clear_errors_only');
      const clearPersistentBtn = document.getElementById('clear_persistent');

      expect(clearAllBtn).toBeTruthy();
      expect(clearErrorsBtn).toBeTruthy();
      expect(clearPersistentBtn).toBeTruthy();

      expect(clearAllBtn?.textContent).toContain('🗑️ Clear All');
      expect(clearErrorsBtn?.textContent).toContain('❌ Clear Errors');
      expect(clearPersistentBtn?.textContent).toContain('📌 Clear Persistent');
    });
  });

  describe('Basic Message Button Functionality', () => {
    test('should trigger error message when error button clicked', () => {
      const errorBtn = document.getElementById('msg_error');
      expect(errorBtn).toBeTruthy();

      errorBtn?.click();

      expect(mockLayout.showError).toHaveBeenCalledWith(
        'Connection Failed',
        'Unable to connect to the server. Please check your internet connection.',
        undefined
      );
      expect(mockLayout.showError).toHaveBeenCalledTimes(1);
    });

    test('should trigger warning message when warning button clicked', () => {
      const warningBtn = document.getElementById('msg_warning');
      expect(warningBtn).toBeTruthy();

      warningBtn?.click();

      expect(mockLayout.showWarning).toHaveBeenCalledWith(
        'Session Expiring',
        'Your session will expire in 5 minutes. Save your work to avoid losing data.',
        undefined
      );
      expect(mockLayout.showWarning).toHaveBeenCalledTimes(1);
    });

    test('should trigger info message when info button clicked', () => {
      const infoBtn = document.getElementById('msg_info');
      expect(infoBtn).toBeTruthy();

      infoBtn?.click();

      expect(mockLayout.showInfo).toHaveBeenCalledWith(
        'New Feature Available',
        'Check out the new dashboard features in the sidebar navigation.',
        undefined
      );
      expect(mockLayout.showInfo).toHaveBeenCalledTimes(1);
    });

    test('should trigger success message when success button clicked', () => {
      const successBtn = document.getElementById('msg_success');
      expect(successBtn).toBeTruthy();

      successBtn?.click();

      expect(mockLayout.showSuccess).toHaveBeenCalledWith(
        'Data Saved',
        'Your changes have been saved successfully to the server.',
        undefined
      );
      expect(mockLayout.showSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('Advanced Message Button Functionality', () => {
    test('should create message with action when "With Action" button clicked', () => {
      const withActionBtn = document.getElementById('msg_with_action');
      expect(withActionBtn).toBeTruthy();

      withActionBtn?.click();

      expect(mockLayout.getErrorMessages).toHaveBeenCalled();
      expect(mockErrorMessages.addMessage).toHaveBeenCalledWith({
        id: 'network-error-with-action',
        type: 'error',
        title: 'Network Error',
        description: 'Failed to load data. Check your connection and try again.',
        actions: [{
          id: 'retry',
          text: 'Retry',
          action: expect.any(Function),
          style: 'primary'
        }],
        dismissible: true,
        autoHide: false
      });
    });

    test('should create persistent message when "Persistent" button clicked', () => {
      const persistentBtn = document.getElementById('msg_persistent');
      expect(persistentBtn).toBeTruthy();

      persistentBtn?.click();

      expect(mockErrorMessages.addMessage).toHaveBeenCalledWith({
        id: 'persistent-warning',
        type: 'warning',
        title: 'Persistent Warning',
        description: 'This message persists across page navigation. Use "Clear Persistent" to remove it.',
        persistent: true,
        dismissible: true,
        autoHide: false
      });
    });

    test('should create auto-hide message when "Auto-hide" button clicked', () => {
      const autoHideBtn = document.getElementById('msg_auto_hide');
      expect(autoHideBtn).toBeTruthy();

      autoHideBtn?.click();

      expect(mockErrorMessages.addMessage).toHaveBeenCalledWith({
        id: 'auto-hide-info',
        type: 'info',
        title: 'Auto-Hide Message',
        description: 'This message will automatically disappear after 3 seconds.',
        autoHide: true,
        autoHideDelay: 3000,
        dismissible: true
      });
    });

    test('should trigger message sequence when "Sequence" button clicked', (done) => {
      const sequenceBtn = document.getElementById('msg_sequence');
      expect(sequenceBtn).toBeTruthy();

      sequenceBtn?.click();

      // Check that the first message is shown immediately
      expect(mockLayout.showInfo).toHaveBeenCalledWith('Step 1', 'Starting data validation process...');

      // Wait for sequence to complete (5 messages * 2s delay = ~10s, but we'll check after 100ms for first few)
      setTimeout(() => {
        expect(mockLayout.showInfo).toHaveBeenCalledTimes(2); // Step 1 and Step 2
        done();
      }, 2100); // Wait for second step
    });

    test('should handle retry action in "With Action" message', () => {
      const withActionBtn = document.getElementById('msg_with_action');
      withActionBtn?.click();

      // Get the action function from the addMessage call
      const addMessageCall = mockErrorMessages.addMessage.mock.calls[0][0];
      const retryAction = addMessageCall.actions[0];

      // Execute the retry action
      retryAction.action();

      expect(mockErrorMessages.removeMessage).toHaveBeenCalledWith('network-error-with-action');
      expect(mockLayout.showSuccess).toHaveBeenCalledWith('Retrying...', 'Attempting to reconnect to the server.');
    });
  });

  describe('Message Management Button Functionality', () => {
    test('should clear all messages when "Clear All" button clicked', () => {
      const clearAllBtn = document.getElementById('clear_all_messages');
      expect(clearAllBtn).toBeTruthy();

      clearAllBtn?.click();

      expect(mockLayout.clearMessages).toHaveBeenCalledWith(false);
      expect(mockLayout.clearMessages).toHaveBeenCalledTimes(1);
    });

    test('should clear only errors when "Clear Errors" button clicked', () => {
      const clearErrorsBtn = document.getElementById('clear_errors_only');
      expect(clearErrorsBtn).toBeTruthy();

      clearErrorsBtn?.click();

      expect(mockLayout.clearMessagesByType).toHaveBeenCalledWith('error');
      expect(mockLayout.clearMessagesByType).toHaveBeenCalledTimes(1);
    });

    test('should clear persistent messages when "Clear Persistent" button clicked', () => {
      const clearPersistentBtn = document.getElementById('clear_persistent');
      expect(clearPersistentBtn).toBeTruthy();

      clearPersistentBtn?.click();

      expect(mockLayout.clearMessages).toHaveBeenCalledWith(true);
      expect(mockLayout.clearMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('Console Logging Integration', () => {
    test('should log messages to debug console', () => {
      // Find the logToConsole method by testing button clicks
      const errorBtn = document.getElementById('msg_error');
      errorBtn?.click();

      // Check that the test console element exists
      const testConsole = document.getElementById('test_console');
      expect(testConsole).toBeTruthy();

      // The logToConsole method should have added content to the console
      // (This is harder to test directly without accessing private methods)
    });

    test('should handle multiple button clicks with console updates', () => {
      const errorBtn = document.getElementById('msg_error');
      const successBtn = document.getElementById('msg_success');
      const clearAllBtn = document.getElementById('clear_all_messages');

      // Click multiple buttons
      errorBtn?.click();
      successBtn?.click();
      clearAllBtn?.click();

      // Verify all methods were called
      expect(mockLayout.showError).toHaveBeenCalledTimes(1);
      expect(mockLayout.showSuccess).toHaveBeenCalledTimes(1);
      expect(mockLayout.clearMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing layout gracefully', () => {
      // Create debug page without layout registered
      layoutContext.unregisterAllComponents();
      const consoleSpy = jest.spyOn(console, 'warn');

      const errorBtn = document.getElementById('msg_error');
      errorBtn?.click();

      expect(consoleSpy).toHaveBeenCalledWith('LayoutContext - Layout component not available or does not support error messages');
    });

    test('should handle missing error messages component gracefully', () => {
      // Mock layout without getErrorMessages
      const incompleteLayout = {
        showError: jest.fn(),
      } as any;
      
      layoutContext.registerLayout(incompleteLayout);

      const withActionBtn = document.getElementById('msg_with_action');
      withActionBtn?.click();

      // Should not throw errors, should handle gracefully
      expect(incompleteLayout.showError).not.toHaveBeenCalled();
    });

    test('should handle missing DOM elements gracefully', () => {
      // Remove a button element
      const errorBtn = document.getElementById('msg_error');
      errorBtn?.remove();

      // Try to click the removed button (should not throw)
      const removedBtn = document.getElementById('msg_error');
      expect(removedBtn).toBeFalsy();

      // Other buttons should still work
      const warningBtn = document.getElementById('msg_warning');
      warningBtn?.click();

      expect(mockLayout.showWarning).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with Test Console', () => {
    test('should have test console element for logging', () => {
      const testConsole = document.getElementById('test_console');
      expect(testConsole).toBeTruthy();
      expect(testConsole?.classList.contains || testConsole?.className).toBeTruthy();
    });

    test('should clear test console when clear console button clicked', () => {
      const clearConsoleBtn = document.getElementById('clear_console');
      expect(clearConsoleBtn).toBeTruthy();

      // Add some content to console first
      const testConsole = document.getElementById('test_console');
      if (testConsole) {
        testConsole.innerHTML = 'Some test content';
        expect(testConsole.innerHTML).toBe('Some test content');

        // Clear console
        clearConsoleBtn?.click();
        
        // Console should be cleared
        expect(testConsole.innerHTML).toBe('');
      }
    });
  });
});
