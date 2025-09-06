# Error Messages Container

This document describes the error messages container functionality added under the app header.

## Overview

The error messages container provides a centralized location for displaying global error messages, warnings, information, and success notifications to users. It appears directly under the app header and is managed by the `ErrorMessagesComponent`.

## Features

### ✅ **Multiple Message Types**
- **Error** (Red): For critical errors and failures
- **Warning** (Amber): For warnings and cautions
- **Info** (Blue): For informational messages
- **Success** (Green): For success confirmations

### ✅ **Advanced Functionality**
- **Auto-hide**: Messages can automatically disappear after a specified delay
- **Persistent**: Messages can survive page navigation
- **Dismissible**: Users can manually close messages
- **Actions**: Messages can include action buttons
- **Animations**: Smooth slide-in and slide-out animations
- **Accessibility**: Full ARIA support for screen readers

### ✅ **Management Features**
- Add/remove individual messages
- Clear all messages or by type
- Check for existence of messages
- Queue management with unique IDs

## HTML Structure

The error messages container is added to `index.html`:

```html
<!-- Error Messages Container: For global error messages and notifications -->
<div class="app-error-messages" id="app-error-messages" role="alert" aria-live="polite" style="display: none;">
  <!-- Error messages will be populated dynamically -->
</div>
```

**Position**: Directly under the app header, before the main content area.

## CSS Styling

The container includes comprehensive CSS styling in `src/assets/styles/components/error-messages.css`:

- **Responsive design** with mobile-optimized layouts
- **Dark mode support** via CSS media queries
- **Smooth animations** for message appearance/disappearance
- **Color-coded styling** for different message types
- **Print styles** (hidden in print mode)

## Usage

### Basic Usage via Layout Class

```typescript
import Layout from './components/Layout';

const layout = new Layout();
await layout.init();

// Show different types of messages
layout.showError('Connection Failed', 'Unable to connect to the server');
layout.showWarning('Session Expiring', 'Save your work soon');
layout.showInfo('New Feature Available', 'Check out the new dashboard');
layout.showSuccess('Data Saved', 'Your changes have been saved');

// Clear messages
layout.clearMessages(); // Clear all
layout.clearMessagesByType('error'); // Clear only errors
```

### Advanced Usage with Actions

```typescript
import { ErrorAction } from './components/ErrorMessages';

const retryAction: ErrorAction = {
  id: 'retry',
  text: 'Retry',
  action: () => {
    // Handle retry logic
    console.log('User clicked retry');
  },
};

layout.getErrorMessages().addMessage({
  id: 'network-error',
  type: 'error',
  title: 'Network Error',
  description: 'Failed to load data. Check your connection.',
  actions: [retryAction],
  dismissible: true,
  autoHide: false,
});
```

### Direct Component Usage

```typescript
import ErrorMessagesComponent from './components/ErrorMessages';

const errorMessages = new ErrorMessagesComponent();

errorMessages.showError('Validation Error', 'Please fix the form errors');
errorMessages.showSuccess('Upload Complete', 'File uploaded successfully', {
  autoHide: true,
  autoHideDelay: 3000,
});
```

## API Reference

### Layout Class Methods

| Method | Description |
|--------|-------------|
| `showError(title, description?, options?)` | Display an error message |
| `showWarning(title, description?, options?)` | Display a warning message |
| `showInfo(title, description?, options?)` | Display an info message |
| `showSuccess(title, description?, options?)` | Display a success message |
| `clearMessages(includesPersistent?)` | Clear all messages |
| `clearMessagesByType(type)` | Clear messages by type |
| `getErrorMessages()` | Get ErrorMessagesComponent instance |

### ErrorMessagesComponent Methods

| Method | Description |
|--------|-------------|
| `addMessage(message: ErrorMessage)` | Add a new message |
| `removeMessage(id: string)` | Remove a message by ID |
| `clearAll(includesPersistent?)` | Clear all messages |
| `clearByType(type)` | Clear messages by type |
| `getMessages()` | Get current messages array |
| `hasMessages(type?)` | Check if has messages |

### Interfaces

#### ErrorMessage
```typescript
interface ErrorMessage {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description?: string;
  actions?: ErrorAction[];
  dismissible?: boolean; // Default: true
  autoHide?: boolean; // Default: false for errors/warnings, true for info/success
  autoHideDelay?: number; // Default: 5000ms
  persistent?: boolean; // Default: false
}
```

#### ErrorAction
```typescript
interface ErrorAction {
  id: string;
  text: string;
  action: () => void;
  style?: 'primary' | 'secondary'; // Default: 'secondary'
}
```

## Visual Examples

### Error Message
- **Color**: Red border and background tint
- **Icon**: Error icon (material-icons: 'error')
- **Behavior**: Does not auto-hide by default

### Warning Message  
- **Color**: Amber border and background tint
- **Icon**: Warning icon (material-icons: 'warning')
- **Behavior**: Does not auto-hide by default

### Info Message
- **Color**: Blue border and background tint
- **Icon**: Info icon (material-icons: 'info')
- **Behavior**: Auto-hides after 5 seconds by default

### Success Message
- **Color**: Green border and background tint
- **Icon**: Check circle icon (material-icons: 'check_circle')
- **Behavior**: Auto-hides after 5 seconds by default

## Integration

### Layout Integration
The ErrorMessagesComponent is automatically initialized when the Layout class is created and destroyed when the Layout is destroyed.

### Page Component Integration
Page components can access error messages through the Layout instance:

```typescript
// In a page component
const layout = getLayout(); // Your method to get layout instance

// Show messages based on page events
try {
  await saveData();
  layout.showSuccess('Saved', 'Data saved successfully');
} catch (error) {
  layout.showError('Save Failed', 'Unable to save data. Please try again.');
}

// Clear messages when navigating away (optional)
layout.clearMessages(); // Keep persistent messages
layout.clearMessages(true); // Clear all messages including persistent ones
```

## Accessibility

The error messages container includes full accessibility support:

- **ARIA roles**: `role="alert"` and `aria-live="polite"`
- **Screen reader support**: Messages are announced when added
- **Keyboard navigation**: Close buttons and action buttons are keyboard accessible
- **Focus management**: Proper tab order and focus indicators

## Examples

See `src/examples/error-messages-example.ts` for comprehensive examples including:
- Basic message display
- Advanced messages with actions
- Persistent and auto-hide configurations
- Message management operations
- Application event integration
- Direct component usage

## CSS Classes

### Container Classes
- `.app-error-messages` - Main container
- `.app-error-messages:empty` - Hidden when empty
- `.app-error-messages:not(:empty)` - Visible when contains messages

### Message Classes
- `.error-message` - Individual message container
- `.error-message.error` - Error styling
- `.error-message.warning` - Warning styling
- `.error-message.info` - Info styling
- `.error-message.success` - Success styling
- `.error-message.removing` - Applied during removal animation

### Content Classes
- `.error-icon` - Message type icon
- `.error-content` - Main content area
- `.error-title` - Message title
- `.error-description` - Message description
- `.error-actions` - Action buttons container
- `.error-action-button` - Individual action button
- `.error-close` - Close/dismiss button

## Best Practices

1. **Use appropriate message types**: Errors for failures, warnings for cautions, info for neutral information, success for confirmations

2. **Provide clear, actionable messages**: Include what went wrong and what the user can do about it

3. **Use actions for recoverable errors**: Provide "Retry", "Help", or "Fix" buttons when appropriate

4. **Manage message lifetime**: Use auto-hide for success/info, keep errors/warnings visible until addressed

5. **Avoid message spam**: Clear previous messages of the same type when showing new ones

6. **Test accessibility**: Ensure messages work well with screen readers and keyboard navigation

7. **Handle persistent messages carefully**: Use sparingly for truly critical system-wide issues

The error messages system provides a robust, accessible, and user-friendly way to communicate with users about application state and events.
