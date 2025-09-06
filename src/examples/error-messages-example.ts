/**
 * Error Messages Example
 * 
 * This example demonstrates how to use the ErrorMessagesComponent
 * and the Layout class error message methods.
 */

import Layout from '../components/Layout';
import ErrorMessagesComponent, { ErrorMessage, ErrorAction } from '../components/ErrorMessages';

// =================================================================================
// Example 1: Basic Error Messages Usage
// =================================================================================

function demonstrateBasicErrorMessages(layout: Layout) {
  console.log('🚨 Example 1: Basic error messages...');

  // Show different types of messages
  layout.showError(
    'Connection Failed',
    'Unable to connect to the server. Please check your internet connection and try again.'
  );

  layout.showWarning(
    'Session Expiring Soon',
    'Your session will expire in 5 minutes. Save your work to avoid losing progress.'
  );

  layout.showInfo(
    'New Feature Available',
    'Check out our new dashboard analytics feature in the main menu.'
  );

  layout.showSuccess(
    'Data Saved Successfully',
    'Your changes have been saved and will be synced to all devices.'
  );

  console.log('✅ Basic error messages displayed');
}

// =================================================================================
// Example 2: Advanced Error Messages with Actions
// =================================================================================

function demonstrateAdvancedErrorMessages(layout: Layout) {
  console.log('⚙️ Example 2: Advanced error messages with actions...');

  // Error message with actions
  const retryAction: ErrorAction = {
    id: 'retry',
    text: 'Retry',
    action: () => {
      console.log('🔄 User clicked retry');
      layout.showInfo('Retrying...', 'Attempting to reconnect to the server.');
      
      // Simulate retry
      setTimeout(() => {
        layout.clearMessagesByType('error');
        layout.showSuccess('Connected', 'Successfully reconnected to the server.');
      }, 2000);
    },
  };

  const helpAction: ErrorAction = {
    id: 'help',
    text: 'Get Help',
    action: () => {
      console.log('❓ User clicked get help');
      window.open('/help/connectivity', '_blank');
    },
  };

  layout.getErrorMessages().addMessage({
    id: 'connection-error-with-actions',
    type: 'error',
    title: 'Connection Error',
    description: 'Failed to load data from the server. This might be a temporary issue.',
    actions: [retryAction, helpAction],
    dismissible: true,
    autoHide: false,
  });

  console.log('✅ Advanced error message with actions displayed');
}

// =================================================================================
// Example 3: Persistent and Auto-Hide Messages
// =================================================================================

function demonstratePersistentAndAutoHideMessages(layout: Layout) {
  console.log('⏱️ Example 3: Persistent and auto-hide messages...');

  // Auto-hide success message
  layout.showSuccess(
    'File Uploaded',
    'Your file has been uploaded successfully.',
    { autoHide: true, autoHideDelay: 3000 }
  );

  // Persistent error message that survives page navigation
  layout.getErrorMessages().addMessage({
    id: 'critical-error',
    type: 'error',
    title: 'Critical System Error',
    description: 'A critical error occurred that requires immediate attention.',
    persistent: true,
    dismissible: false,
    autoHide: false,
  });

  // Info message that auto-hides after 2 seconds
  setTimeout(() => {
    layout.showInfo(
      'Background Process',
      'Data sync is running in the background.',
      { autoHide: true, autoHideDelay: 2000 }
    );
  }, 1000);

  console.log('✅ Persistent and auto-hide messages configured');
}

// =================================================================================
// Example 4: Message Management
// =================================================================================

function demonstrateMessageManagement(layout: Layout) {
  console.log('📋 Example 4: Message management...');

  // Add multiple messages
  layout.showError('Error 1', 'First error message');
  layout.showError('Error 2', 'Second error message');
  layout.showWarning('Warning 1', 'First warning message');
  layout.showInfo('Info 1', 'First info message');

  // Check if has messages
  const errorMessages = layout.getErrorMessages();
  console.log('Has error messages:', errorMessages.hasMessages('error'));
  console.log('Has any messages:', errorMessages.hasMessages());
  console.log('Total messages:', errorMessages.getMessages().length);

  // Clear specific type after 3 seconds
  setTimeout(() => {
    console.log('Clearing all error messages...');
    layout.clearMessagesByType('error');
  }, 3000);

  // Clear all messages after 6 seconds
  setTimeout(() => {
    console.log('Clearing all messages...');
    layout.clearMessages();
  }, 6000);

  console.log('✅ Message management demonstrated');
}

// =================================================================================
// Example 5: Error Messages in Response to Application Events
// =================================================================================

function demonstrateApplicationEventMessages(layout: Layout) {
  console.log('🎯 Example 5: Application event messages...');

  // Simulate various application events
  const events = [
    {
      delay: 1000,
      action: () => layout.showInfo('Loading Data', 'Fetching user preferences...'),
    },
    {
      delay: 2500,
      action: () => layout.showSuccess('Data Loaded', 'User preferences loaded successfully.'),
    },
    {
      delay: 4000,
      action: () => layout.showWarning('Storage Quota', 'You are using 85% of your storage quota.'),
    },
    {
      delay: 5500,
      action: () => {
        const upgradeAction: ErrorAction = {
          id: 'upgrade',
          text: 'Upgrade Plan',
          action: () => {
            console.log('🚀 User clicked upgrade');
            layout.showInfo('Redirecting', 'Taking you to the upgrade page...');
          },
        };

        layout.getErrorMessages().addMessage({
          id: 'storage-warning',
          type: 'warning',
          title: 'Storage Almost Full',
          description: 'Upgrade your plan to get more storage space.',
          actions: [upgradeAction],
          persistent: false,
          dismissible: true,
        });
      },
    },
    {
      delay: 8000,
      action: () => layout.showError('Sync Failed', 'Unable to sync data. Check your connection.'),
    },
  ];

  events.forEach(event => {
    setTimeout(event.action, event.delay);
  });

  console.log('✅ Application event messages scheduled');
}

// =================================================================================
// Example 6: Direct ErrorMessagesComponent Usage
// =================================================================================

function demonstrateDirectComponentUsage() {
  console.log('🔧 Example 6: Direct component usage...');

  // Create standalone ErrorMessages component
  const errorMessages = new ErrorMessagesComponent();

  // Add a complex message with custom configuration
  const customMessage: ErrorMessage = {
    id: 'custom-validation-error',
    type: 'error',
    title: 'Validation Error',
    description: 'Please fix the following issues before continuing:',
    actions: [
      {
        id: 'fix-issues',
        text: 'Fix Issues',
        action: () => {
          console.log('🔧 User clicked fix issues');
          errorMessages.removeMessage('custom-validation-error');
          errorMessages.showSuccess('Issues Fixed', 'All validation issues have been resolved.');
        },
      },
    ],
    dismissible: true,
    autoHide: false,
    persistent: false,
  };

  errorMessages.addMessage(customMessage);

  console.log('✅ Direct component usage demonstrated');
}

// =================================================================================
// Complete Example Function
// =================================================================================

async function completeErrorMessagesExample() {
  console.log('🚀 Complete Error Messages Example Starting...');

  // Create and initialize layout
  const layout = new Layout({
    header: { enabled: true, brandTitle: 'Error Messages Demo' },
    sidebar: { enabled: true },
    footer: { enabled: true },
  });

  try {
    await layout.init();
    console.log('✅ Layout initialized successfully');

    // Run all examples with delays
    setTimeout(() => demonstrateBasicErrorMessages(layout), 1000);
    setTimeout(() => demonstrateAdvancedErrorMessages(layout), 3000);
    setTimeout(() => demonstratePersistentAndAutoHideMessages(layout), 5000);
    setTimeout(() => demonstrateMessageManagement(layout), 8000);
    setTimeout(() => demonstrateApplicationEventMessages(layout), 12000);
    setTimeout(() => demonstrateDirectComponentUsage(), 15000);

    console.log('🎉 All error message examples scheduled');
  } catch (error) {
    console.error('❌ Layout initialization failed:', error);
  }
}

// =================================================================================
// Utility Functions for Testing
// =================================================================================

function createTestMessages(layout: Layout) {
  return {
    showRandomError: () => {
      const errors = [
        { title: 'Network Error', desc: 'Failed to connect to the server' },
        { title: 'Validation Error', desc: 'Please check your input fields' },
        { title: 'Permission Error', desc: 'You do not have permission to perform this action' },
        { title: 'Timeout Error', desc: 'The request timed out. Please try again' },
      ];
      const error = errors[Math.floor(Math.random() * errors.length)];
      layout.showError(error.title, error.desc);
    },
    
    showRandomSuccess: () => {
      const successes = [
        { title: 'Saved', desc: 'Your changes have been saved successfully' },
        { title: 'Uploaded', desc: 'File uploaded successfully' },
        { title: 'Updated', desc: 'Profile updated successfully' },
        { title: 'Completed', desc: 'Task completed successfully' },
      ];
      const success = successes[Math.floor(Math.random() * successes.length)];
      layout.showSuccess(success.title, success.desc);
    },
    
    clearAll: () => layout.clearMessages(),
    
    showTestSuite: () => {
      layout.showError('Test Error', 'This is a test error message');
      layout.showWarning('Test Warning', 'This is a test warning message');
      layout.showInfo('Test Info', 'This is a test info message');
      layout.showSuccess('Test Success', 'This is a test success message');
    },
  };
}

// =================================================================================
// Export for use in other examples
// =================================================================================

export {
  demonstrateBasicErrorMessages,
  demonstrateAdvancedErrorMessages,
  demonstratePersistentAndAutoHideMessages,
  demonstrateMessageManagement,
  demonstrateApplicationEventMessages,
  demonstrateDirectComponentUsage,
  completeErrorMessagesExample,
  createTestMessages,
};

// Run the complete example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  (window as any).errorMessagesExample = {
    demonstrateBasicErrorMessages,
    demonstrateAdvancedErrorMessages,
    demonstratePersistentAndAutoHideMessages,
    demonstrateMessageManagement,
    demonstrateApplicationEventMessages,
    demonstrateDirectComponentUsage,
    completeErrorMessagesExample,
    createTestMessages,
  };

  // Auto-run complete example
  completeErrorMessagesExample();
}
