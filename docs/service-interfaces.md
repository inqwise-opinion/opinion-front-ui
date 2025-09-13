# Service Interface Contracts

This document describes the service interfaces and contracts used in the Opinion Front UI service architecture.

## Overview

The service architecture is built around standardized interfaces that define contracts for different types of services. All services integrate with the LayoutContext for lifecycle management and EventBus for communication.

## Base Service Interface

### Service (`src/interfaces/Service.ts`)

The fundamental interface that all services must implement:

```typescript
export interface Service {
  /**
   * Unique identifier for this service type
   */
  getServiceId(): string;

  /**
   * Initialize the service (optional)
   * Called automatically when LayoutContext initializes services
   */
  init?(): Promise<void> | void;

  /**
   * Destroy/cleanup the service (optional)  
   * Called automatically when LayoutContext is destroyed
   */
  destroy?(): Promise<void> | void;

  /**
   * Check if service is ready (optional)
   */
  isReady?(): boolean;
}
```

**Key Features:**
- ✅ Simple, minimal interface
- ✅ Optional lifecycle methods (init/destroy)
- ✅ Service identification via `getServiceId()`
- ✅ Works with existing LayoutContext service registry

### ServiceRegistry

Defines how services are managed by LayoutContext:

```typescript
export interface ServiceRegistry {
  registerService<T extends Service>(name: string, service: T): void;
  getService<T extends Service>(name: string): T | null;
  hasService(name: string): boolean;
  unregisterService(name: string): Promise<boolean>;
  getRegisteredServices(): Map<string, Service>;
  getServiceNames(): string[];
  initializeServices(): Promise<void>;
  destroyServices(): Promise<void>;
}
```

**Implementation:** LayoutContextImpl provides this interface.

## Data Loading Interface

### DataLoaderService (`src/interfaces/DataLoader.ts`)

Wraps Facebook's DataLoader for batching and caching:

```typescript
export interface DataLoaderService<K, V> {
  getLoader(): DataLoader<K, V>;
  load(key: K): Promise<V>;
  loadMany(keys: readonly K[]): Promise<Array<V | Error>>;
  clear(key: K): this;
  clearAll(): this;
  prime(key: K, value: V): this;
}
```

**Key Features:**
- ✅ Built on Facebook's DataLoader library
- ✅ Automatic batching and caching
- ✅ Type-safe key-value operations
- ✅ Service architecture integration

**Usage Example:**
```typescript
// Create a DataLoader service for users
const userLoaderService = new DataLoaderServiceImpl({
  batchLoadFn: async (userIds) => {
    // Batch load users by IDs
    return await apiService.getUsersByIds(userIds);
  },
  maxBatchSize: 100,
  cache: true
});

// Register with LayoutContext
layoutContext.registerService('userLoader', userLoaderService);
```

### DataLoaderFactory

Factory for creating DataLoader services:

```typescript
export interface DataLoaderFactory {
  createLoader<K, V>(config: DataLoaderConfig): DataLoaderService<K, V>;
}
```

## Service Lifecycle

### Registration Flow

1. **OpinionApp** creates service instances
2. **OpinionApp** registers services with LayoutContext via `registerService()`
3. **LayoutContext** calls `init()` on services (if method exists)
4. **Services** can access LayoutContext and EventBus

### Destruction Flow

1. **LayoutContext.destroy()** calls `destroyServices()`
2. **Services** `destroy()` method called (if exists)
3. **Service registry** cleared

### Access Pattern

Components access services via LayoutContext:

```typescript
class MyComponent extends PageComponent {
  private userLoader?: DataLoaderService<number, User>;

  async onInit(): Promise<void> {
    // Get service from LayoutContext
    this.userLoader = this.layoutContext.getService<DataLoaderService<number, User>>('userLoader');
    
    if (this.userLoader) {
      const user = await this.userLoader.load(123);
      this.displayUser(user);
    }
  }
}
```

## Error Handling

### ServiceError Class

```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public serviceName: string,
    public operation: 'register' | 'get' | 'init' | 'destroy' | 'unregister'
  );
}
```

### Error Patterns

- **Registration errors**: Thrown when service registration fails
- **Initialization errors**: Caught and logged, don't break other services
- **Runtime errors**: Services should handle gracefully and emit events

## Integration with Architecture

### LayoutContext Integration

- Services registered in LayoutContext service registry
- Automatic lifecycle management
- EventBus access via `layoutContext.getEventBus()`
- Component coordination through shared context

### EventBus Communication

Services use EventBus for reactive communication:

```typescript
class MyService implements Service {
  private eventBus: EventBus;

  init(context: LayoutContext): void {
    this.eventBus = context.getEventBus();
    
    // Listen for events
    this.eventBus.on('user:updated', this.handleUserUpdate.bind(this));
    
    // Emit events
    this.eventBus.emit('service:ready', { service: this.getServiceId() });
  }
}
```

### Handler Pattern Integration

Services are typically registered in OpinionApp handler:

```typescript
await this.layout
  .onContextReady((ctx) => {
    // Register services
    const userLoader = new UserLoaderService(/* config */);
    ctx.registerService('userLoader', userLoader);
    
    // Configure components
    ctx.getHeader()?.updateUser(userData);
  })
  .init();
```

## Best Practices

### Service Design

1. **Single Responsibility**: One service, one purpose
2. **Stateless**: Prefer stateless operations where possible
3. **Error Handling**: Always handle errors gracefully
4. **Resource Cleanup**: Implement `destroy()` for cleanup
5. **Type Safety**: Use TypeScript generics for type safety

### DataLoader Usage

1. **Batch Operations**: Design batch functions efficiently
2. **Cache Strategy**: Configure cache appropriately for use case
3. **Error Handling**: Handle individual item errors in batch
4. **Key Design**: Use simple, serializable keys
5. **Performance**: Monitor batch sizes and cache hit rates

### Integration Patterns

1. **Lazy Registration**: Register services when needed, not eagerly
2. **Service Discovery**: Use LayoutContext as service locator
3. **Event Communication**: Use EventBus for service-to-service communication
4. **Component Integration**: Components consume services, don't create them
5. **Testing**: Create mock implementations for testing

---

## Base Service Implementation

### BaseService (`src/services/BaseService.ts`)

Abstract base class that implements the Service interface:

```typescript
export abstract class BaseService implements Service {
  protected readonly _context: LayoutContext;
  
  constructor(context: LayoutContext, config: ServiceConfig = {}) {
    this._context = context;
    // Template method pattern for initialization
  }
  
  // Must be implemented by subclasses
  abstract getServiceId(): string;
  
  // Template methods
  protected abstract onInit(): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
  
  // Helper methods
  protected getEventBus(): EventBus { return this._context.getEventBus(); }
  protected getService<T>(name: string): T | null { ... }
  protected emitEvent(event: string, data: any): void { ... }
  protected onEvent(event: string, handler: Function): () => void { ... }
}
```

**Key Features:**
- ✅ **Single Dependency**: Only requires LayoutContext (EventBus via getter)
- ✅ **Template Method Pattern**: Standardized lifecycle with customizable hooks
- ✅ **Service Discovery**: Built-in methods to find other services
- ✅ **Event Integration**: Easy EventBus access and event handling
- ✅ **Error Handling**: Consistent ServiceError creation and logging

**Usage Example:**
```typescript
class MyConcreteService extends BaseService {
  constructor(context: LayoutContext) {
    super(context, { autoInit: true });
  }
  
  getServiceId(): string {
    return 'myService';
  }
  
  protected async onInit(): Promise<void> {
    // Service-specific initialization
    const otherService = this.getService<OtherService>('otherService');
    this.onEvent('data:updated', this.handleDataUpdate.bind(this));
    this.emitEvent('service:ready', { service: this.getServiceId() });
  }
  
  protected async onDestroy(): Promise<void> {
    // Service-specific cleanup
  }
}
```

### ServiceHelper

Static utility class for service registration:

```typescript
export class ServiceHelper {
  static registerService(context: LayoutContext, name: string, service: Service): void;
  static createAndRegister<T>(context, name, factory, config?): T;
}
```

## Implementation Status

- ✅ **Base Service Interface**: Complete and functional
- ✅ **BaseService Implementation**: Abstract base class with template pattern
- ✅ **DataLoader Integration**: Facebook DataLoader integrated
- ✅ **Service Registry**: Implemented in LayoutContext
- ✅ **Service Helper**: Registration utilities available
- ✅ **Error Handling**: ServiceError class available
- ✅ **Documentation**: This document provides comprehensive guidance

## Next Steps

**Phase 3 Progress:**
- ✅ **Task 3.1**: Service Interface Contracts
- ✅ **Task 3.2**: Service Base Classes
- ⏳ **Task 3.3**: Component Interface Updates (pending)

Ready to proceed to concrete service implementations and component integration.
