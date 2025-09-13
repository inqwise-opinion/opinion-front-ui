# LayoutContext Access Patterns

## Overview

The LayoutContext uses a **hybrid access pattern** designed to enforce proper architectural boundaries while allowing legitimate operational access.

## 🎯 **Design Principles**

1. **App-level setup** must use the handler pattern (`onContextReady()`)
2. **Page-level operations** can access LayoutContext directly 
3. **Component coordination** happens through the LayoutContext
4. **No direct Layout.getLayoutContext()** - forces proper setup patterns

## 📋 **Access Patterns**

### 1. **App-Level Setup** ✅ **Required Pattern**

**Use Case:** Initial application configuration, component setup

```typescript
// ✅ CORRECT: App-level setup via handler
await layout
  .onContextReady((ctx) => {
    // Configure sidebar navigation
    ctx.getSidebar()?.updateNavigation([...]);
    
    // Setup user menu
    ctx.getHeader()?.updateUser({...});
    
    // Configure initial state
    ctx.publish('app-initialized', { version: '1.0.0' });
  })
  .init();

// ❌ INCORRECT: Direct access removed
// const ctx = layout.getLayoutContext(); // Method no longer exists
```

**Why?** App-level code runs before LayoutContext is fully initialized. The handler pattern ensures the context is ready before setup code executes.

### 2. **Page-Level Operations** ✅ **Direct Access**

**Use Case:** Normal page operations, event subscriptions, user interactions

```typescript
class MyPage extends PageComponent {
  protected async onInit() {
    // ✅ CORRECT: Direct access for page operations
    
    // Subscribe to layout events
    this.layoutContext.subscribe('sidebar-compact-mode-change', (event) => {
      this.handleSidebarChange(event.data);
    });
    
    // Display messages
    this.layoutContext.getMessages()?.showSuccess('Page loaded successfully');
    
    // Publish page events
    this.layoutContext.publish('page-loaded', { 
      pageId: this.getPageId(),
      timestamp: Date.now()
    });
  }
  
  private handleUserAction() {
    // EventBus communication
    this.layoutContext.send('update-user-preferences', {
      theme: 'dark',
      sidebar: 'compact'
    });
  }
}
```

**Why?** Pages need legitimate operational access to the LayoutContext for:
- Event subscriptions/publishing
- Message display
- Component coordination
- User interaction handling

### 3. **Component Access** ✅ **Dependency Injection**

**Use Case:** Components receiving LayoutContext from their parent

```typescript
class MyComponent {
  constructor(private layoutContext: LayoutContext) {}
  
  init() {
    // ✅ CORRECT: Context injected via constructor
    this.layoutContext.subscribe('theme-change', this.handleThemeChange);
  }
}

// Usage - LayoutContext passed from parent
const component = new MyComponent(pageInstance.layoutContext);
```

## 🚫 **Removed Access Points**

### Direct Layout Access (Removed)
```typescript
// ❌ REMOVED: Direct access bypasses handler pattern
// const ctx = layout.getLayoutContext();
```

**Rationale:** App-level code should use the `onContextReady()` pattern to ensure proper initialization timing.

## 🔄 **Migration Examples**

### Before (Direct Access)
```typescript
// OLD: Direct access in app setup
const layoutContext = this.layout.getLayoutContext();
layoutContext.getMessages()?.showError('Failed to load');
```

### After (Handler Pattern)
```typescript
// NEW: Handler pattern for app setup
this.layout.onContextReady((ctx) => {
  ctx.getMessages()?.showError('Failed to load');
});
```

### Pages (Unchanged)
```typescript
// UNCHANGED: Pages still use direct access
class DebugPage extends PageComponent {
  protected onInit() {
    // Still works - legitimate page operation
    this.layoutContext.getMessages()?.showInfo('Debug page loaded');
  }
}
```

## 🏗️ **Architecture Benefits**

### 1. **Enforced Initialization Order**
- App setup must wait for LayoutContext readiness
- Prevents race conditions and initialization errors
- Clear separation of setup vs operational phases

### 2. **Legitimate Operational Access**
- Pages can access LayoutContext for normal operations
- Components receive context via dependency injection
- No artificial restrictions on legitimate use cases

### 3. **Clear Architectural Boundaries**
- App-level: Use handler pattern (`onContextReady()`)
- Page-level: Direct access via `this.layoutContext`
- Component-level: Dependency injection

### 4. **Type Safety & Intellisense**
- Full TypeScript support for all patterns
- Clear method signatures and return types
- IDE autocomplete for available operations

## 📚 **Usage Guidelines**

### ✅ **Do**
- Use `onContextReady()` for app-level setup
- Access `this.layoutContext` directly in pages
- Inject LayoutContext into components via constructor
- Subscribe to events for component coordination

### ❌ **Don't**
- Try to access Layout.getLayoutContext() (method removed)
- Access LayoutContext before initialization
- Bypass the handler pattern for app setup
- Create global LayoutContext instances

## 🔍 **Access Summary**

| **Context** | **Access Method** | **Use Case** |
|-------------|------------------|--------------|
| **App Setup** | `layout.onContextReady()` | Initial configuration, component setup |
| **Page Operations** | `this.layoutContext` | Event handling, messages, subscriptions |
| **Component Usage** | Constructor injection | Coordinated component behavior |

This hybrid approach provides the **best of both worlds**: enforced proper initialization patterns for app setup, while allowing natural operational access for pages and components.