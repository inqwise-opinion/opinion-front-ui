# EventBus Integration Documentation

## Overview

The EventBus system provides a powerful, flexible communication mechanism for cross-component communication in the Opinion TypeScript Frontend application. It is fully integrated into the `LayoutContext` and supports three distinct communication patterns:

- **PUBLISH** - Broadcast messages to ALL consumers (1:N)
- **SEND** - Deliver messages to the FIRST consumer only (1:1)  
- **REQUEST** - Send message and await response from the FIRST consumer (1:1 with response)

## Architecture

### Core Components

1. **`EventBus` Interface** (`src/lib/EventBus.ts`) - Defines the contract for event communication
2. **`EventBusImpl` Class** (`src/lib/EventBusImpl.ts`) - Concrete implementation with advanced features
3. **`LayoutContext` Integration** - EventBus is automatically initialized and accessible through LayoutContext
4. **`Consumer` Management** - Automatic tracking and cleanup by component ID

### Integration with LayoutContext

The EventBus is seamlessly integrated into `LayoutContext` and initialized automatically:

```typescript
// EventBus is automatically available through LayoutContext
const layoutContext = new LayoutContextImpl();

// Access EventBus directly
const eventBus = layoutContext.getEventBus();

// Use convenience methods on LayoutContext
layoutContext.publish('my-event', data);
layoutContext.send('my-event', data);
const response = await layoutContext.request('my-event', data);
const consumer = layoutContext.consume('my-event', handler, 'my-component-id');
```

## Communication Patterns

### 1. PUBLISH - Broadcast to All Consumers

Use PUBLISH when you need to notify multiple components about an event.

**Examples:**
- User login/logout events
- Data refresh notifications
- Global state changes
- System-wide alerts

```typescript
// Publisher (any component/service)
layoutContext.publish('user:login', {
  userId: '12345',
  username: 'john_doe',
  timestamp: Date.now()
});

// Consumers (multiple components can listen)
// Component A - Update user display
const userConsumer = layoutContext.consume(
  'user:login', 
  (data) => {
    this.updateUserDisplay(data.username);
  },
  'header-component'
);

// Component B - Log analytics
const analyticsConsumer = layoutContext.consume(
  'user:login',
  (data) => {
    analytics.track('user_login', data);
  },
  'analytics-service'
);
```

### 2. SEND - Deliver to First Consumer Only

Use SEND when you need to delegate a task to any available handler.

**Examples:**
- Task delegation
- Load balancing
- First-available processing

```typescript
// Send task to first available worker
layoutContext.send('task:process', {
  taskId: 'task-123',
  data: { /* task data */ }
});

// Multiple workers can register, but only first gets the task
layoutContext.consume('task:process', (task) => {
  return this.processTask(task);
}, 'worker-service-1');

layoutContext.consume('task:process', (task) => {
  return this.processTask(task);
}, 'worker-service-2');
```

### 3. REQUEST - Send and Await Response

Use REQUEST when you need a response from a service.

**Examples:**
- Data fetching
- Validation requests
- Service calls
- Configuration queries

```typescript
// Request data from a service
try {
  const response = await layoutContext.request('data:fetch', {
    resource: 'users',
    filters: { active: true }
  });
  
  console.log('Fetched users:', response.data);
} catch (error) {
  console.error('Failed to fetch users:', error);
}

// Service providing the data
layoutContext.consume('data:fetch', async (request) => {
  const { resource, filters } = request;
  
  try {
    const data = await this.fetchData(resource, filters);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}, 'data-service');
```

## Service Integration Patterns

### Basic Service with EventBus

```typescript
import type { Service } from '../interfaces/Service';
import type { Consumer } from '../lib/EventBus';
import type { LayoutContext } from '../contexts/LayoutContext';

export class MyService implements Service {
  private serviceId: string;
  private layoutContext: LayoutContext | null = null;
  private consumers: Consumer[] = [];

  constructor() {
    this.serviceId = `MyService-${Date.now()}`;
  }

  public getServiceId(): string {
    return this.serviceId;
  }

  public async init(layoutContext?: LayoutContext): Promise<void> {
    if (layoutContext) {
      this.layoutContext = layoutContext;
      this.setupEventBusConsumers();
    }
  }

  private setupEventBusConsumers(): void {
    if (!this.layoutContext) return;

    // Listen for events
    const consumer = this.layoutContext.consume(
      'my-service:command',
      (data) => this.handleCommand(data),
      this.serviceId // Component ID for cleanup
    );
    this.consumers.push(consumer);
  }

  public async destroy(): Promise<void> {
    // Cleanup consumers
    this.consumers.forEach(consumer => {
      if (consumer.isActive()) {
        consumer.unregister();
      }
    });
    this.consumers = [];
    this.layoutContext = null;
  }

  private handleCommand(data: any): any {
    // Handle command and optionally return response
    return { result: 'processed' };
  }

  // Publish events from this service
  public notifyStatusChange(status: string): void {
    if (this.layoutContext) {
      this.layoutContext.publish('my-service:status', {
        service: this.serviceId,
        status,
        timestamp: Date.now()
      });
    }
  }
}
```

### Component with EventBus Integration

```typescript
import type { Consumer } from '../lib/EventBus';

export class MyComponent extends PageComponent {
  private eventConsumers: Consumer[] = [];

  public async onInit(): Promise<void> {
    await super.onInit();
    this.setupEventBusListeners();
  }

  private setupEventBusListeners(): void {
    const layoutContext = this.getLayoutContext();
    
    // Listen for user events
    const userConsumer = layoutContext.consume(
      'user:profile-updated',
      (data) => this.refreshUserDisplay(data),
      this.getComponentId()
    );
    this.eventConsumers.push(userConsumer);

    // Listen for system notifications
    const notificationConsumer = layoutContext.consume(
      'system:notification',
      (notification) => this.showNotification(notification),
      this.getComponentId()
    );
    this.eventConsumers.push(notificationConsumer);
  }

  private async refreshUserDisplay(userData: any): Promise<void> {
    // Update component UI
    this.updateUserInfo(userData);
  }

  private showNotification(notification: any): void {
    // Display notification in component
    this.displayMessage(notification.message, notification.type);
  }

  // Send events from this component
  private async saveUserProfile(profileData: any): Promise<void> {
    try {
      const response = await this.getLayoutContext().request('user:save-profile', profileData);
      
      if (response.success) {
        // Notify other components of the update
        this.getLayoutContext().publish('user:profile-updated', profileData);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  public async destroy(): Promise<void> {
    // Cleanup event consumers
    this.eventConsumers.forEach(consumer => {
      if (consumer.isActive()) {
        consumer.unregister();
      }
    });
    this.eventConsumers = [];
    
    await super.destroy();
  }
}
```

## Best Practices

### 1. Event Naming Conventions

Use hierarchical, descriptive event names:

```typescript
// Good - Hierarchical and descriptive
'user:login'
'user:logout'
'user:profile-updated'
'data:users-loaded'
'data:users-error'
'ui:sidebar-toggled'
'system:error'
'service:status-changed'

// Avoid - Vague or non-hierarchical
'update'
'changed'
'event'
'notification'
```

### 2. Data Structure Consistency

Use consistent data structures for events:

```typescript
// Standard event data structure
interface EventData {
  source?: string;        // Component/service that sent the event
  timestamp?: number;     // When the event occurred
  data?: any;            // Event-specific payload
}

// Example usage
layoutContext.publish('user:login', {
  source: 'auth-service',
  timestamp: Date.now(),
  data: {
    userId: '12345',
    username: 'john_doe',
    email: 'john@example.com'
  }
});
```

### 3. Component ID Management

Always provide component IDs for proper cleanup:

```typescript
// Good - Component ID provided
const consumer = layoutContext.consume(
  'my-event',
  handler,
  this.getComponentId() // or this.serviceId for services
);

// Avoid - No component ID (makes cleanup difficult)
const consumer = layoutContext.consume('my-event', handler);
```

### 4. Error Handling

Handle errors gracefully in event handlers:

```typescript
layoutContext.consume('risky-operation', (data) => {
  try {
    return this.performRiskyOperation(data);
  } catch (error) {
    console.error('Error in risky operation:', error);
    
    // Notify about the error
    layoutContext.publish('system:error', {
      source: 'my-service',
      error: error.message,
      timestamp: Date.now()
    });
    
    return { success: false, error: error.message };
  }
}, 'my-service');
```

### 5. Async Operations

Use async/await for REQUEST patterns:

```typescript
// Good - Proper async handling
const response = await layoutContext.request('data:fetch', params);

// Consumer with async processing
layoutContext.consume('data:fetch', async (params) => {
  const data = await this.fetchDataFromAPI(params);
  return { success: true, data };
}, 'data-service');
```

## Common Event Types

### User Events
```typescript
// Authentication
'user:login' / 'user:logout' / 'user:session-expired'
'user:profile-updated' / 'user:preferences-changed'

// Authorization
'user:permissions-changed' / 'user:role-updated'
```

### Data Events  
```typescript
// CRUD operations
'data:loaded' / 'data:saved' / 'data:deleted'
'data:loading' / 'data:error'

// Specific resources
'data:users-loaded' / 'data:surveys-updated'
```

### UI Events
```typescript
// Layout changes
'ui:sidebar-toggled' / 'ui:modal-opened' / 'ui:modal-closed'
'ui:theme-changed' / 'ui:layout-mode-changed'

// Navigation
'ui:page-changed' / 'ui:breadcrumb-updated'
```

### System Events
```typescript
// Application lifecycle
'system:ready' / 'system:shutdown'
'system:error' / 'system:warning' / 'system:info'

// Service status
'service:started' / 'service:stopped' / 'service:error'
```

## Debugging and Monitoring

### EventBus Debug Information

```typescript
// Get debug information
const debugInfo = layoutContext.getEventBusDebugInfo();
console.log('EventBus Debug Info:', debugInfo);

// Output example:
// {
//   eventCount: 5,
//   totalConsumers: 12,
//   events: [
//     { name: 'user:login', consumers: 3 },
//     { name: 'data:loaded', consumers: 2 }
//   ],
//   componentConsumers: [
//     { component: 'header-component', consumers: 4 },
//     { component: 'data-service', consumers: 2 }
//   ]
// }
```

### Enable Debug Logging

EventBus supports debug logging for development:

```typescript
// Enable in EventBusImpl setup (LayoutContextImpl.ts)
this.eventBus = new EventBusImpl({
  debug: true,  // Enable debug logging
  defaultTimeout: 5000,
  maxConsumersPerEvent: 0
});
```

## Performance Considerations

### 1. Event Frequency
Be mindful of high-frequency events that could impact performance:

```typescript
// Throttle high-frequency events
const throttledPublish = throttle((data) => {
  layoutContext.publish('ui:scroll-position', data);
}, 100); // Throttle to 10fps

window.addEventListener('scroll', () => {
  throttledPublish({ scrollY: window.scrollY });
});
```

### 2. Consumer Cleanup
Always clean up consumers to prevent memory leaks:

```typescript
// Component cleanup
public async destroy(): Promise<void> {
  // Method 1: Individual consumer cleanup
  this.consumers.forEach(consumer => consumer.unregister());
  
  // Method 2: Bulk cleanup by component ID
  layoutContext.unregisterEventBusConsumers(this.getComponentId());
  
  await super.destroy();
}
```

### 3. Request Timeouts
Set appropriate timeouts for REQUEST operations:

```typescript
// Short timeout for fast operations
const response = await layoutContext.request('cache:get', data, 1000);

// Longer timeout for network operations
const response = await layoutContext.request('api:fetch-data', data, 10000);
```

## Migration from Legacy Event Systems

If migrating from other event systems, here's a comparison:

### From Traditional EventEmitter
```typescript
// Old EventEmitter pattern
eventEmitter.emit('event', data);
eventEmitter.on('event', handler);

// New EventBus pattern  
layoutContext.publish('event', data);     // Broadcast
layoutContext.consume('event', handler);   // Subscribe
```

### From Direct Method Calls
```typescript
// Old direct coupling
this.dataService.fetchUsers().then(users => {
  this.displayUsers(users);
});

// New EventBus decoupling
layoutContext.request('data:fetch-users').then(response => {
  if (response.success) {
    this.displayUsers(response.data);
  }
});
```

## Testing EventBus Integration

### Unit Testing with EventBus

```typescript
describe('MyService EventBus Integration', () => {
  let service: MyService;
  let layoutContext: LayoutContext;

  beforeEach(() => {
    layoutContext = new LayoutContextImpl();
    service = new MyService();
  });

  afterEach(() => {
    layoutContext.destroy();
  });

  it('should handle commands via EventBus', async () => {
    await service.init(layoutContext);
    
    // Test REQUEST pattern
    const response = await layoutContext.request('my-service:command', {
      action: 'test'
    });
    
    expect(response.result).toBe('processed');
  });

  it('should publish status changes', async () => {
    await service.init(layoutContext);
    
    const statusEvents: any[] = [];
    layoutContext.consume('my-service:status', (data) => {
      statusEvents.push(data);
    });
    
    service.notifyStatusChange('active');
    
    // Allow async processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(statusEvents).toHaveLength(1);
    expect(statusEvents[0].status).toBe('active');
  });
});
```

This EventBus integration provides a robust, scalable foundation for cross-component communication in your TypeScript frontend application. It promotes loose coupling, enables better testing, and provides powerful debugging capabilities.