# Active Page Tracking and EventBus System

This document describes the active page tracking system and EventBus implementation that provides centralized page state management and inter-component communication.

## Overview

The system consists of several key components:

1. **EventBus** - Non-blocking event communication system
2. **ActivePage Interfaces** - Define contracts for page tracking
3. **LayoutContext** - Central coordinator with ActivePageProvider
4. **PageComponent** - Enhanced to implement ActivePage interface
5. **ActivePageStatusComponent** - Example consumer and EventBus bridge
6. **PageTracker** - Development utility for testing and debugging

## EventBus Communication System

### Features

- **PUBLISH**: Broadcast to ALL consumers (non-blocking)
- **SEND**: Deliver to FIRST consumer only (non-blocking)  
- **REQUEST**: Send to FIRST consumer, expect response (non-blocking Promise)
- **CONSUME**: Subscribe to events with cleanup management

### Basic Usage

```typescript
import { globalEventBus } from '@/lib';

// Subscribe to events
const consumer = globalEventBus.consume('my:event', (data) => {
  console.log('Received:', data);
});

// Publish to all subscribers
globalEventBus.publish('my:event', { message: 'Hello World!' });

// Send to first subscriber only
globalEventBus.send('my:event', { message: 'Direct message' });

// Request with response
const response = await globalEventBus.request('my:request', { query: 'data' });

// Cleanup
consumer.unregister();
```

## Active Page Tracking

### Core Interfaces

#### `ActivePage`
Implemented by page components to provide page identification:

```typescript
interface ActivePage {
  getPageInfo(): PageInfo;
  getPageId(): string;
}
```

#### `ActivePageProvider`
Implemented by LayoutContext for centralized page management:

```typescript
interface ActivePageProvider {
  setActivePage(page: ActivePage): void;
  deactivatePage(page: ActivePage): boolean;
  getActivePage(): ActivePage | null;
  registerActivePageConsumer(consumer: ActivePageConsumer): () => void;
}
```

#### `ActivePageConsumer`
Implemented by components that need to react to page changes:

```typescript
interface ActivePageConsumer {
  onActivePageChanged(activePage: ActivePage | null, previousPage: ActivePage | null): void;
}
```

### Page Lifecycle Integration

The system automatically integrates with the existing PageComponent lifecycle:

```typescript
// PageComponent automatically handles:
class MyPage extends PageComponent {
  async init() {
    // ... page initialization
    // Automatically calls: this.layoutContext.setActivePage(this)
  }
  
  destroy() {
    // ... page cleanup
    // Automatically calls: this.layoutContext.deactivatePage(this)
  }
}
```

## Event-Driven Architecture

### Page Change Events

The system publishes several events via EventBus when pages change:

- `page:activated` - First page becomes active
- `page:deactivated` - Last page becomes inactive  
- `page:changed` - Page switches to another page
- `page:status-updated` - General status update (always fired)

### Event Data Structure

```typescript
// Page activation
globalEventBus.consume('page:activated', (data: { page: ActivePage }) => {
  console.log('Page activated:', data.page.getPageId());
});

// Page change
globalEventBus.consume('page:changed', (data: { 
  currentPage: ActivePage | null; 
  previousPage: ActivePage | null 
}) => {
  console.log(`Page changed from ${data.previousPage?.getPageId()} to ${data.currentPage?.getPageId()}`);
});

// Status updates
globalEventBus.consume('page:status-updated', (status: ActivePageStatus) => {
  console.log('Page status:', status);
});
```

## Request/Response Patterns

### Page Information Queries

Components can query page information via EventBus:

```typescript
// Get current page status
const status = await globalEventBus.request('page:get-status', {});

// Get current page info
const pageInfo = await globalEventBus.request('page:get-current-info', {});

// Check if specific page is active
const isActive = await globalEventBus.request('page:is-active', { pageId: 'DebugPage' });
```

## Components

### ActivePageStatusComponent

Bridges active page changes to EventBus events:

```typescript
import ActivePageStatusComponent from '@/components/ActivePageStatusComponent';

// Create and initialize
const statusComponent = new ActivePageStatusComponent(layoutContext);
statusComponent.init();

// Component automatically:
// - Tracks active page changes
// - Publishes EventBus events  
// - Responds to status queries
// - Manages cleanup
```

### PageTracker Utility

Development utility available in browser console:

```javascript
// Available globally as window.pageTracker

// Get current status
await pageTracker.printStatus();

// Get page information  
const info = await pageTracker.getInfo();
const pageInfo = await pageTracker.getCurrentPageInfo();

// Check if page is active
const isActive = await pageTracker.isPageActive('DebugPage');

// View event history
pageTracker.getEventHistory();

// Test EventBus
pageTracker.testEventBus('Test message');

// Get EventBus debug info
pageTracker.getEventBusDebugInfo();
```

## Integration with Existing Systems

### Hotkey Management Integration

The active page system provides hooks for future hotkey context management:

```typescript
// In LayoutContextImpl
private updateHotkeysForActivePage(activePage: ActivePage | null, previousPage: ActivePage | null): void {
  // Future: Enable/disable hotkeys based on activePage context
  // This would require extending the hotkey system to be aware of ActivePage instances
}
```

### Layout Coordination

The system integrates with the existing LayoutContext architecture:

- **LayoutContext** extends ActivePageProvider
- **PageComponent** implements both HotkeyProvider and ActivePage
- **Component lifecycle** automatically manages active page registration

## Development and Debugging

### Console Access

The PageTracker utility is available globally for debugging:

```javascript
// Print current status
await pageTracker.printStatus();

// View recent events
pageTracker.getEventHistory();

// Test the EventBus
pageTracker.testEventBus();
```

### Event Monitoring

Subscribe to all page events for debugging:

```typescript
// Monitor all page events
globalEventBus.consume('page:activated', data => console.log('Page activated:', data));
globalEventBus.consume('page:deactivated', data => console.log('Page deactivated:', data));
globalEventBus.consume('page:changed', data => console.log('Page changed:', data));
globalEventBus.consume('page:status-updated', data => console.log('Status updated:', data));
```

### EventBus Debugging

```typescript
// Get EventBus state
const debugInfo = globalEventBus.getDebugInfo();
console.log('EventBus state:', debugInfo);

// Check for consumers
const hasConsumers = globalEventBus.hasConsumers('page:get-status');
console.log('Has status consumers:', hasConsumers);
```

## Future Enhancements

1. **Context-Aware Hotkeys**: Integrate active page tracking with hotkey management
2. **Navigation State**: Track navigation history and support back/forward
3. **Page Metadata**: Support rich page metadata and state persistence  
4. **Route Integration**: Deeper integration with routing system
5. **Performance Monitoring**: Track page initialization and switching performance

## Architecture Benefits

### Loose Coupling
Components communicate via EventBus without direct dependencies.

### Centralized State
Active page state is managed centrally by LayoutContext.

### Event-Driven
Changes propagate automatically via events, making the system reactive.

### Type Safety
Strong TypeScript interfaces ensure type safety throughout the system.

### Testability
EventBus and active page system can be easily tested in isolation.

### Extensibility
New consumers and event patterns can be added without modifying existing code.
