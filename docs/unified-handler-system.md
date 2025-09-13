# Unified Layout Handler System

## Overview

The Layout Handler System has been **unified** into a single, powerful framework that supports both simple and advanced usage patterns. The old `onContextReady()` method now uses the new system internally, providing backward compatibility while enabling advanced lifecycle management.

## 🏗️ **System Architecture**

### **Single Handler System**
- **One registration system**: `setContextHandler()` for all scenarios
- **Backward compatibility**: `onContextReady()` internally uses new system
- **Advanced features**: Lifecycle hooks, priorities, timeouts, error recovery
- **Convenience methods**: `addHandler()` and `addServiceRegistration()` for common patterns

## 📋 **Usage Patterns**

### **1. Simple Pattern (Backward Compatible)**

The familiar `onContextReady()` method still works but now uses the unified system:

```typescript
// ✅ SIMPLE: Works exactly as before
await layout
  .onContextReady((ctx) => {
    ctx.getSidebar()?.updateNavigation([...]);
    ctx.getHeader()?.updateUser({...});
  })
  .init();
```

**Internal Implementation**: This creates a `ContextHandler` with default configuration:
- No logging output (quiet)
- Continues on error
- 5-second timeout

### **2. Advanced Pattern (Recommended for Complex Scenarios)**

Full lifecycle control with error handling and priority management:

```typescript
// ✅ ADVANCED: Complete lifecycle control
await layout
  .setContextHandler({
    id: 'app-initialization',
    priority: HandlerPriority.HIGH, // Execute before other handlers
    
    onPreInit: async () => {
      console.log('🚀 Preparing application...');
      // Early setup that doesn't need LayoutContext
    },
    
    onContextReady: (ctx) => {
      console.log('🎯 Configuring layout components...');
      ctx.getSidebar()?.updateNavigation([...]);
      ctx.getHeader()?.updateUser({...});
      ctx.publish('app-initialized', { version: '1.0.0' });
    },
    
    onPostInit: async (ctx) => {
      console.log('✅ Application fully initialized');
      // Final setup after context configuration
    },
    
    onError: async (error, ctx) => {
      console.error('❌ Initialization failed:', error);
      // Error recovery logic
    }
  }, {
    timeout: 10000,        // 10 second timeout
    continueOnError: false, // Stop on failure
    enableLogging: true     // Detailed logging
  })
  .init();
```

### **3. Service Registration Pattern**

Dedicated method for service registration with dependency management:

```typescript
// ✅ SERVICES: Dedicated service registration
await layout
  .addServiceRegistration([
    {
      name: 'userService',
      factory: (ctx) => new UserService(ctx.getEventBus()),
      dependencies: ['apiService']
    },
    {
      name: 'authService',
      factory: (ctx) => new AuthService(ctx)
    },
    {
      name: 'dataService',
      factory: (ctx) => new DataService(ctx.getService('apiService'))
    }
  ], 'core-services', HandlerPriority.HIGH)
  .init();
```

### **4. Multiple Handler Registration**

Register multiple handlers with different priorities:

```typescript
await layout
  // High priority: Service registration
  .setContextHandler({
    id: 'services',
    priority: HandlerPriority.HIGH,
    onContextReady: (ctx) => {
      // Register core services
    }
  })
  
  // Normal priority: App configuration  
  .setContextHandler({
    id: 'app-config',
    priority: HandlerPriority.NORMAL,
    onContextReady: (ctx) => {
      // Configure UI components
    }
  })
  
  // Low priority: Analytics and tracking
  .setContextHandler({
    id: 'analytics',
    priority: HandlerPriority.LOW,
    onContextReady: (ctx) => {
      // Initialize analytics
    }
  })
  .init();
```

## 🔧 **Handler Configuration Options**

### **HandlerConfig Interface**

```typescript
interface HandlerConfig {
  timeout?: number;         // Max execution time (default: 5000ms)
  continueOnError?: boolean; // Continue if handler fails (default: true)
  enableLogging?: boolean;   // Log execution details (default: depends on method)
}
```

### **Priority Levels**

```typescript
const HandlerPriority = {
  CRITICAL: 1000,     // System-critical handlers
  HIGH: 500,          // Important setup (services)
  NORMAL: 0,          // Regular configuration (default)
  LOW: -500,          // Optional enhancements
  CLEANUP: -1000,     // Final cleanup tasks
} as const;
```

## 🎯 **Migration Guide**

### **Existing Code (No Changes Needed)**

```typescript
// ✅ WORKS: Existing code continues to work
layout.onContextReady((ctx) => {
  // Your existing setup code
}).init();
```

### **Upgrading to Advanced Features**

```typescript
// BEFORE: Simple setup
layout.onContextReady((ctx) => {
  setupServices(ctx);
  configureUI(ctx);
}).init();

// AFTER: Advanced setup with error handling
layout.setContextHandler({
  id: 'app-initialization',
  onPreInit: () => console.log('Starting...'),
  onContextReady: (ctx) => {
    setupServices(ctx);
    configureUI(ctx);
  },
  onError: (error) => console.error('Failed:', error)
}, {
  timeout: 10000,
  continueOnError: false
}).init();
```

## 🔍 **Debugging and Monitoring**

### **Get Handler Information**

```typescript
// View registered handlers
const handlers = layout.getRegisteredHandlers();
console.log(handlers);
// Output:
// [
//   {
//     type: 'LifecycleHandler',
//     id: 'app-initialization', 
//     priority: 500,
//     registered: Date
//   }
// ]
```

### **Handler Execution Logging**

```typescript
// Enable detailed logging
layout.setContextHandler(handler, {
  enableLogging: true
});

// Console output:
// Layout - Registered LifecycleHandler (app-init)
// Layout - Executing LifecycleHandler: app-init
// Layout - Executing onPreInit for: app-init
// Layout - Executing onContextReady for: app-init  
// Layout - Executing onPostInit for: app-init
// Layout - Completed LifecycleHandler: app-init
```

## 🚀 **Advanced Examples**

### **Service Architecture Setup**

```typescript
class ApplicationBootstrap {
  static async initialize(layout: Layout): Promise<void> {
    await layout
      // Phase 1: Core services
      .setContextHandler({
        id: 'core-services',
        priority: HandlerPriority.CRITICAL,
        onContextReady: (ctx) => {
          ctx.registerService('logger', new LoggerService());
          ctx.registerService('config', new ConfigService());
          ctx.registerService('eventBus', ctx.getEventBus());
        }
      })
      
      // Phase 2: Business services  
      .setContextHandler({
        id: 'business-services',
        priority: HandlerPriority.HIGH,
        onContextReady: (ctx) => {
          const logger = ctx.getService('logger');
          ctx.registerService('userService', new UserService(logger));
          ctx.registerService('authService', new AuthService(logger));
        }
      })
      
      // Phase 3: UI Configuration
      .setContextHandler({
        id: 'ui-config',
        priority: HandlerPriority.NORMAL,
        onContextReady: (ctx) => {
          const userService = ctx.getService('userService');
          ctx.getHeader()?.bindUserService(userService);
          ctx.getSidebar()?.updateNavigation(getNavigation());
        }
      })
      .init();
  }
}

// Usage
await ApplicationBootstrap.initialize(layout);
```

### **Error Recovery Pattern**

```typescript
layout.setContextHandler({
  id: 'resilient-setup',
  onContextReady: async (ctx) => {
    // This might fail
    await riskyCo
  },
  onError: async (error, ctx) => {
    console.warn('Primary setup failed, using fallback:', error);
    await fallbackSetup(ctx);
  }
}, {
  continueOnError: true, // Continue even if this fails
  timeout: 15000
});
```

## ✨ **Benefits of Unified System**

1. **Backward Compatibility**: Existing code continues to work
2. **Progressive Enhancement**: Upgrade to advanced features when needed
3. **Better Error Handling**: Comprehensive error recovery options
4. **Performance Control**: Timeouts and priority management
5. **Better Debugging**: Detailed logging and handler inspection
6. **Service Architecture Ready**: Built-in patterns for service registration
7. **Type Safety**: Full TypeScript support for all patterns

The unified handler system provides a smooth migration path from simple setup patterns to sophisticated service-oriented architecture, all while maintaining backward compatibility and providing powerful new capabilities.