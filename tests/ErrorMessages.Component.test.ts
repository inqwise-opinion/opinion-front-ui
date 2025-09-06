/**
 * Unit tests for ErrorMessagesComponent
 * Tests error message display, management, and interaction functionality
 */

import { ErrorMessagesComponent } from '../src/components/ErrorMessages';
import type { ErrorMessage, ErrorAction } from '../src/components/ErrorMessages';

describe('ErrorMessagesComponent', () => {
  let errorMessages: ErrorMessagesComponent;

  beforeEach(() => {
    // Set up DOM environment with error messages container
    document.body.innerHTML = `
      <div id="app-error-messages" class="app-error-messages" role="alert" aria-live="polite" style="display: none;"></div>
    `;

    // Mock console methods to reduce noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create ErrorMessagesComponent instance
    errorMessages = new ErrorMessagesComponent();
  });

  afterEach(() => {
    if (errorMessages) {
      errorMessages.destroy();
    }
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with container element', () => {
      const container = document.getElementById('app-error-messages');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('role')).toBe('alert');
      expect(container?.getAttribute('aria-live')).toBe('polite');
    });

    test('should handle missing container element gracefully', () => {
      // Remove container
      const container = document.getElementById('app-error-messages');
      container?.remove();

      const consoleSpy = jest.spyOn(console, 'error');

      // Create new instance
      const newErrorMessages = new ErrorMessagesComponent();
      
      expect(consoleSpy).toHaveBeenCalledWith('ErrorMessages - Container #app-error-messages not found');
      newErrorMessages.destroy();
    });
  });

  describe('Basic Message Display', () => {
    test('should show error message with showError convenience method', () => {
      errorMessages.showError('Test Error', 'Error description');

      const container = document.getElementById('app-error-messages');
      const messageElement = container?.querySelector('.error-message.error');
      
      expect(messageElement).toBeTruthy();
      expect(messageElement?.querySelector('.error-title')?.textContent).toBe('Test Error');
      expect(messageElement?.querySelector('.error-description')?.textContent).toBe('Error description');
    });

    test('should show warning message with showWarning convenience method', () => {
      errorMessages.showWarning('Test Warning', 'Warning description');

      const container = document.getElementById('app-error-messages');
      const messageElement = container?.querySelector('.error-message.warning');
      
      expect(messageElement).toBeTruthy();
      expect(messageElement?.querySelector('.error-title')?.textContent).toBe('Test Warning');
    });

    test('should show info message with showInfo convenience method', () => {
      errorMessages.showInfo('Test Info', 'Info description');

      const container = document.getElementById('app-error-messages');
      const messageElement = container?.querySelector('.error-message.info');
      
      expect(messageElement).toBeTruthy();
      expect(messageElement?.querySelector('.error-title')?.textContent).toBe('Test Info');
    });

    test('should show success message with showSuccess convenience method', () => {
      errorMessages.showSuccess('Test Success', 'Success description');

      const container = document.getElementById('app-error-messages');
      const messageElement = container?.querySelector('.error-message.success');
      
      expect(messageElement).toBeTruthy();
      expect(messageElement?.querySelector('.error-title')?.textContent).toBe('Test Success');
    });
  });

  describe('Advanced Message Features', () => {
    test('should add message with addMessage method', () => {
      const message: ErrorMessage = {
        id: 'test-message',
        type: 'error',
        title: 'Test Message',
        description: 'Test description'
      };

      errorMessages.addMessage(message);

      const container = document.getElementById('app-error-messages');
      const messageElement = container?.querySelector('[data-message-id="test-message"]');
      
      expect(messageElement).toBeTruthy();
      expect(messageElement?.classList.contains('error-message')).toBe(true);
      expect(messageElement?.classList.contains('error')).toBe(true);
    });

    test('should create message with action buttons', () => {
      const action: ErrorAction = {
        id: 'test-action',
        text: 'Test Action',
        action: jest.fn(),
        style: 'primary'
      };

      const message: ErrorMessage = {
        id: 'message-with-action',
        type: 'error',
        title: 'Error with Action',
        actions: [action]
      };

      errorMessages.addMessage(message);

      const container = document.getElementById('app-error-messages');
      const actionButton = container?.querySelector('[data-action-id="test-action"]');
      
      expect(actionButton).toBeTruthy();
      expect(actionButton?.textContent).toBe('Test Action');
      
      // Test action button click
      (actionButton as HTMLElement)?.click();
      expect(action.action).toHaveBeenCalled();
    });

    test('should handle persistent messages', () => {
      const persistentMessage: ErrorMessage = {
        id: 'persistent-message',
        type: 'warning',
        title: 'Persistent Warning',
        persistent: true
      };

      errorMessages.addMessage(persistentMessage);

      // Clear non-persistent messages
      errorMessages.clearAll(false);

      // Persistent message should still exist
      const container = document.getElementById('app-error-messages');
      const messageElement = container?.querySelector('[data-message-id="persistent-message"]');
      expect(messageElement).toBeTruthy();

      // Clear including persistent
      errorMessages.clearAll(true);
      const removedElement = container?.querySelector('[data-message-id="persistent-message"]');
      expect(removedElement).toBeFalsy();
    });

    test('should handle auto-hide messages', (done) => {
      const autoHideMessage: ErrorMessage = {
        id: 'auto-hide-message',
        type: 'info',
        title: 'Auto-hide Info',
        autoHide: true,
        autoHideDelay: 100 // Short delay for testing
      };

      errorMessages.addMessage(autoHideMessage);

      const container = document.getElementById('app-error-messages');
      let messageElement = container?.querySelector('[data-message-id="auto-hide-message"]');
      expect(messageElement).toBeTruthy();

      // Wait for auto-hide
      setTimeout(() => {
        messageElement = container?.querySelector('[data-message-id="auto-hide-message"]');
        expect(messageElement).toBeFalsy();
        done();
      }, 150);
    });

    test('should handle dismissible messages', () => {
      const dismissibleMessage: ErrorMessage = {
        id: 'dismissible-message',
        type: 'error',
        title: 'Dismissible Error',
        dismissible: true
      };

      errorMessages.addMessage(dismissibleMessage);

      const container = document.getElementById('app-error-messages');
      const closeButton = container?.querySelector('.error-close');
      
      expect(closeButton).toBeTruthy();
      
      // Click close button
      (closeButton as HTMLElement)?.click();
      
      // Message should be removed
      setTimeout(() => {
        const messageElement = container?.querySelector('[data-message-id="dismissible-message"]');
        expect(messageElement).toBeFalsy();
      }, 50);
    });
  });

  describe('Message Management', () => {
    beforeEach(() => {
      // Add test messages
      errorMessages.addMessage({
        id: 'error-1',
        type: 'error',
        title: 'Error 1'
      });
      errorMessages.addMessage({
        id: 'warning-1',
        type: 'warning',
        title: 'Warning 1'
      });
      errorMessages.addMessage({
        id: 'info-1',
        type: 'info',
        title: 'Info 1'
      });
    });

    test('should remove individual messages', () => {
      errorMessages.removeMessage('error-1');

      const container = document.getElementById('app-error-messages');
      const removedElement = container?.querySelector('[data-message-id="error-1"]');
      const remainingError = container?.querySelector('[data-message-id="warning-1"]');
      
      expect(removedElement).toBeFalsy();
      expect(remainingError).toBeTruthy();
    });

    test('should clear messages by type', () => {
      errorMessages.clearByType('error');

      const container = document.getElementById('app-error-messages');
      const errorElement = container?.querySelector('[data-message-id="error-1"]');
      const warningElement = container?.querySelector('[data-message-id="warning-1"]');
      
      expect(errorElement).toBeFalsy();
      expect(warningElement).toBeTruthy();
    });

    test('should clear all messages', () => {
      errorMessages.clearAll();

      const container = document.getElementById('app-error-messages');
      const allMessages = container?.querySelectorAll('.error-message');
      
      expect(allMessages?.length).toBe(0);
    });

    test('should get current messages', () => {
      const messages = errorMessages.getMessages();
      
      expect(messages).toHaveLength(3);
      expect(messages.find(m => m.id === 'error-1')).toBeTruthy();
      expect(messages.find(m => m.id === 'warning-1')).toBeTruthy();
      expect(messages.find(m => m.id === 'info-1')).toBeTruthy();
    });

    test('should check if has messages', () => {
      expect(errorMessages.hasMessages()).toBe(true);
      expect(errorMessages.hasMessages('error')).toBe(true);
      expect(errorMessages.hasMessages('success')).toBe(false);

      errorMessages.clearAll();
      expect(errorMessages.hasMessages()).toBe(false);
    });
  });

  describe('Message Defaults and Options', () => {
    test('should apply correct defaults for error messages', () => {
      errorMessages.addMessage({
        id: 'error-defaults',
        type: 'error',
        title: 'Error Message'
      });

      const messages = errorMessages.getMessages();
      const errorMessage = messages.find(m => m.id === 'error-defaults');

      expect(errorMessage?.dismissible).toBe(true);
      expect(errorMessage?.autoHide).toBe(false); // Errors don't auto-hide by default
      expect(errorMessage?.persistent).toBe(false);
    });

    test('should apply correct defaults for success messages', () => {
      errorMessages.addMessage({
        id: 'success-defaults',
        type: 'success',
        title: 'Success Message'
      });

      const messages = errorMessages.getMessages();
      const successMessage = messages.find(m => m.id === 'success-defaults');

      expect(successMessage?.dismissible).toBe(true);
      expect(successMessage?.autoHide).toBe(true); // Success messages auto-hide by default
      expect(successMessage?.autoHideDelay).toBe(5000);
    });

    test('should override defaults with provided options', () => {
      errorMessages.addMessage({
        id: 'custom-options',
        type: 'error',
        title: 'Custom Error',
        dismissible: false,
        autoHide: true,
        autoHideDelay: 3000,
        persistent: true
      });

      const messages = errorMessages.getMessages();
      const customMessage = messages.find(m => m.id === 'custom-options');

      expect(customMessage?.dismissible).toBe(false);
      expect(customMessage?.autoHide).toBe(true);
      expect(customMessage?.autoHideDelay).toBe(3000);
      expect(customMessage?.persistent).toBe(true);
    });
  });

  describe('Message Replacement', () => {
    test('should replace message with same ID', () => {
      // Add initial message
      errorMessages.addMessage({
        id: 'replaceable-message',
        type: 'error',
        title: 'Original Message'
      });

      // Replace with new message
      errorMessages.addMessage({
        id: 'replaceable-message',
        type: 'success',
        title: 'Replaced Message'
      });

      const container = document.getElementById('app-error-messages');
      const messages = container?.querySelectorAll('.error-message');
      const messageElement = container?.querySelector('[data-message-id="replaceable-message"]');

      expect(messages?.length).toBe(1); // Only one message should exist
      expect(messageElement?.classList.contains('success')).toBe(true);
      expect(messageElement?.querySelector('.error-title')?.textContent).toBe('Replaced Message');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing container gracefully', () => {
      // Remove container
      const container = document.getElementById('app-error-messages');
      container?.remove();

      const consoleSpy = jest.spyOn(console, 'warn');

      // Try to add message
      errorMessages.addMessage({
        id: 'test-message',
        type: 'error',
        title: 'Test'
      });

      expect(consoleSpy).toHaveBeenCalledWith('ErrorMessages - Container not available, cannot add message');
    });

    test('should handle action button errors gracefully', () => {
      const faultyAction: ErrorAction = {
        id: 'faulty-action',
        text: 'Faulty Action',
        action: () => {
          throw new Error('Action failed');
        }
      };

      errorMessages.addMessage({
        id: 'message-with-faulty-action',
        type: 'error',
        title: 'Error with Faulty Action',
        actions: [faultyAction]
      });

      const container = document.getElementById('app-error-messages');
      const actionButton = container?.querySelector('[data-action-id="faulty-action"]');
      
      // Clicking faulty action should not crash the application
      expect(() => {
        (actionButton as HTMLElement)?.click();
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      errorMessages.addMessage({
        id: 'aria-message',
        type: 'error',
        title: 'Accessibility Test'
      });

      const container = document.getElementById('app-error-messages');
      const messageElement = container?.querySelector('.error-message');

      expect(messageElement?.getAttribute('role')).toBe('alert');
      expect(messageElement?.getAttribute('aria-live')).toBe('polite');
    });

    test('should be keyboard accessible for action buttons', () => {
      const action: ErrorAction = {
        id: 'keyboard-action',
        text: 'Keyboard Action',
        action: jest.fn()
      };

      errorMessages.addMessage({
        id: 'keyboard-message',
        type: 'error',
        title: 'Keyboard Test',
        actions: [action]
      });

      const container = document.getElementById('app-error-messages');
      const actionButton = container?.querySelector('[data-action-id="keyboard-action"]') as HTMLElement;
      
      expect(actionButton?.tagName).toBe('BUTTON'); // Should be a button for keyboard accessibility
      expect(actionButton?.getAttribute('type')).toBe('button');
    });

    test('should be keyboard accessible for close button', () => {
      errorMessages.addMessage({
        id: 'closable-message',
        type: 'error',
        title: 'Closable Message',
        dismissible: true
      });

      const container = document.getElementById('app-error-messages');
      const closeButton = container?.querySelector('.error-close') as HTMLElement;
      
      expect(closeButton?.tagName).toBe('BUTTON');
      expect(closeButton?.getAttribute('type')).toBe('button');
      expect(closeButton?.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
