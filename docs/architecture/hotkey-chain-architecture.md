# Chain-Based Hotkey System Architecture

## 🏗️ **System Overview**

The Chain-Based Hotkey System replaces the problematic "last registered wins" approach with a cooperative chain execution model where components can control the flow and work together.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAIN HOTKEY ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │   KeyDown Event │───▶│        ChainHotkeyManager        │   │
│  └─────────────────┘    │                                  │   │
│                         │  • Global keydown listener      │   │
│                         │  • Provider management          │   │
│                         │  • Chain execution              │   │
│                         │  • Error handling               │   │
│                         └──────────┬───────────────────────┘   │
│                                    │                           │
│                         ┌──────────▼───────────────────────┐   │
│                         │     EXECUTION CHAIN              │   │
│                         │                                  │   │
│  Priority: 1000 ────────▶ ModalDialog Provider             │   │
│            (Highest)     │ ├─ ESC → Close Modal → BREAK    │   │
│                         │                                  │   │
│  Priority: 800  ────────▶ MobileSidebar Provider           │   │
│                         │ ├─ ESC → Close Sidebar → NEXT/BREAK│   │
│                         │                                  │   │
│  Priority: 600  ────────▶ UserMenu Provider                │   │
│                         │ ├─ ESC → Close Menu → NEXT/BREAK │   │
│                         │                                  │   │
│  Priority: 100  ────────▶ Page Provider                    │   │
│            (Lowest)     │ ├─ ESC → Page Action → BREAK     │   │
│                         │                                  │   │
│                         └──────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 **File Structure**

```
src/
├── contexts/
│   ├── HotkeyChainSystem.ts          # 🎯 Core interfaces & types
│   └── ChainHotkeyManagerImpl.ts     # ⚙️  Implementation
│
├── tests/
│   ├── ChainHotkeySystem.test.ts           # 🧪 Core functionality tests
│   ├── EscKeyConflictResolution.test.ts    # 🎯 ESC conflict resolution
│   ├── setup.hotkeys.ts                    # 🔧 Test utilities
│   └── jest.config.hotkeys.js              # ⚙️  Jest config
│
├── scripts/
│   └── test-hotkeys.js               # 🏃‍♂️ Test runner
│
└── docs/
    └── hotkey-chain-architecture.md # 📚 This documentation
```

---

## 🔧 **Core Components**

### 1. **HotkeyChainSystem.ts** - Interface Layer

```typescript
// Core execution context passed to each handler
interface HotkeyExecutionContext {
  readonly event: KeyboardEvent;
  readonly key: string;
  readonly currentProvider: string;
  readonly chainIndex: number;
  readonly chainLength: number;
  
  next(): void;           // Continue to next handler
  break(): void;          // Stop chain execution
  preventDefault(): void; // Prevent default browser behavior
  stopPropagation(): void; // Stop event bubbling
  hasProvider(id: string): boolean; // Check if provider is in chain
  getProviderChain(): string[];     // Get all provider IDs
}

// Enhanced hotkey handler with chain control
interface ChainHotkeyHandler {
  key: string;
  handler: (ctx: HotkeyExecutionContext) => void;
  providerId: string;
  enabled: boolean;
  priority?: number;
  
  // Dynamic enable/disable methods
  enable(): void;
  disable(): void;  
  isEnabled(): boolean;
}

// Provider interface - components implement this
interface ChainHotkeyProvider {
  getHotkeyProviderId(): string;
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null;
  getProviderPriority(): number;
  getDefaultChainBehavior(): HotkeyChainAction;
  
  // Lifecycle hooks
  onChainRegistered?(): void;
  onChainUnregistered?(): void;
}
```

### 2. **ChainHotkeyManagerImpl.ts** - Core Engine

```typescript
class ChainHotkeyManagerImpl implements ChainHotkeyManager {
  private providers = new Map<string, ChainHotkeyProvider>();
  private globalKeydownListener: ((event: KeyboardEvent) => void) | null = null;

  // 🎯 Main execution method
  async executeChain(key: string, event: KeyboardEvent): Promise<ChainExecutionResult> {
    // 1. Find providers with handlers for this key
    // 2. Sort by priority (highest first)
    // 3. Execute in chain order
    // 4. Handle next()/break() control
    // 5. Return comprehensive result
  }

  // 📋 Provider management
  registerProvider(provider: ChainHotkeyProvider): () => void;
  unregisterProvider(providerId: string): void;
  
  // 🔧 Dynamic control
  setProviderEnabled(providerId: string, enabled: boolean): void;
  
  // 🐛 Debug support
  getChainDebugInfo(key: string): DebugInfo;
}
```

---

## 🔄 **Execution Flow**

### **Chain Execution Steps**:

```
1. ⌨️  Keydown Event Captured
   └── Global listener catches all keydown events
   
2. 🔍 Key Normalization
   └── Convert to standard format (e.g., "Ctrl+s", "Escape")
   
3. 🎯 Provider Discovery
   └── Find all providers that have handlers for this key
   
4. 📊 Priority Sorting
   └── Sort providers by priority (highest → lowest)
   
5. ✅ Enabled Filter
   └── Only include enabled handlers
   
6. 🔗 Chain Building
   └── Create execution context with provider chain info
   
7. 🏃‍♂️ Sequential Execution
   ├── Execute handler with context
   ├── Check return action (next/break)
   ├── Update preventDefault/stopPropagation state
   └── Continue or stop based on action
   
8. 📊 Result Collection
   └── Return comprehensive execution result
```

### **Example: ESC Key Chain Execution**

```
User presses ESC key:

┌─────────────────────────────────────────────────────────────┐
│ 1. Modal Dialog (Priority 1000)                           │
│    ├─ Check: isModalOpen = false                           │
│    └─ Result: No handler (skip)                            │
├─────────────────────────────────────────────────────────────┤
│ 2. Mobile Sidebar (Priority 800)                          │
│    ├─ Check: isMobile && isMenuVisible = true             │
│    ├─ Action: Close mobile menu                            │
│    ├─ Logic: if (ctx.hasProvider('UserMenu')) → next()    │
│    └─ Result: NEXT (continue chain)                        │
├─────────────────────────────────────────────────────────────┤
│ 3. User Menu (Priority 600)                               │
│    ├─ Check: isUserMenuOpen = true                        │
│    ├─ Action: Close user menu                              │
│    ├─ Logic: if (isLastHandler) → break() else → next()   │
│    └─ Result: BREAK (end chain)                            │
├─────────────────────────────────────────────────────────────┤
│ 4. Page Handler (Priority 100)                            │
│    └─ Skipped due to BREAK from UserMenu                   │
└─────────────────────────────────────────────────────────────┘

Final Result: Both mobile sidebar AND user menu closed! 🎉
```

---

## 🧩 **Provider Implementation Pattern**

### **Template for Component Providers**:

```typescript
export class MyComponentProvider implements ChainHotkeyProvider {
  private isActive = false;
  
  // 🏷️ Identity
  getHotkeyProviderId(): string { return 'MyComponent'; }
  getProviderPriority(): number { return 600; }
  getDefaultChainBehavior(): HotkeyChainAction { return 'next'; }
  
  // 🔧 Dynamic hotkey provision
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    if (!this.isActive) return null; // ✨ Conditional registration
    
    const hotkeys = new Map();
    
    hotkeys.set('Escape', {
      key: 'Escape',
      providerId: 'MyComponent',
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        // 💼 Business logic
        this.closeComponent();
        
        // 🎯 Smart chain control
        if (ctx.hasProvider('ImportantComponent')) {
          ctx.next(); // Let important component also handle
        } else {
          ctx.preventDefault();
          ctx.break(); // We handled it completely
        }
      },
      enable: () => { this.enabled = true; },
      disable: () => { this.enabled = false; },
      isEnabled: () => this.enabled
    });
    
    return hotkeys;
  }
}
```

---

## 🧪 **Test Architecture**

### **Test Structure Overview**:

```
📁 tests/
├── ChainHotkeySystem.test.ts          # Core functionality
│   ├── Provider Registration          # ✅ Register/unregister
│   ├── Chain Execution - Basic        # ✅ Single handlers  
│   ├── Chain Execution - Priority     # ✅ Order & control
│   ├── Execution Context              # ✅ Context info
│   ├── Event Handling                 # ✅ preventDefault/stop
│   ├── Dynamic Enable/Disable         # ✅ Runtime control
│   ├── Error Handling                 # ✅ Resilience
│   ├── Key Normalization             # ✅ Modifiers
│   └── Debug Information             # ✅ Introspection
│
├── EscKeyConflictResolution.test.ts   # THE MAIN PROBLEM SOLVER
│   ├── Single Component Scenarios     # ✅ Individual behavior
│   ├── Multiple Component Scenarios   # 🎯 CORE CONFLICT RESOLUTION
│   ├── State-Based Behavior          # ✅ Conditional activation
│   ├── Chain Execution Order         # ✅ Priority verification
│   ├── Debug Information             # ✅ Chain inspection
│   └── Performance & Error Resilience # ✅ Robust operation
│
├── setup.hotkeys.ts                   # Test utilities
│   ├── Mock KeyboardEvent            # 🔧 DOM simulation
│   ├── Mock Document                 # 🔧 Event system
│   ├── Console noise reduction       # 🔇 Clean test output
│   └── Global test helpers          # 🛠️ Utility functions
│
└── jest.config.hotkeys.js            # Jest configuration
    ├── TypeScript support            # 📝 SWC
    ├── JSDOM environment            # 🌐 DOM simulation
    ├── Coverage reporting           # 📊 Code coverage
    └── Test file patterns          # 🎯 Test discovery
```

### **Key Test Scenarios**:

```typescript
// 🎯 THE CORE TEST - Solves our ESC key conflict
test('should close both mobile sidebar AND user menu when both are open', async () => {
  // Both components active
  mobileProvider.setMobile(true);
  mobileProvider.setMobileMenuVisible(true);
  userMenuProvider.setUserMenuOpen(true);
  
  // Press ESC
  const result = await manager.executeChain('Escape', event);
  
  // BOTH should close cooperatively! 
  expect(mobileProvider.wasSidebarClosed()).toBe(true);
  expect(userMenuProvider.wasUserMenuClosed()).toBe(true);
});

// 🏆 Priority verification  
test('should execute handlers in priority order (highest first)', async () => {
  // Order: High (1000) → Medium (500) → Low (100)
  expect(executionOrder).toEqual(['High', 'Medium', 'Low']);
});

// 🔄 Dynamic control
test('should enable/disable individual hotkeys', async () => {
  hotkeyHandler.disable();
  const result = await manager.executeChain('Escape', event);
  expect(result.executed).toBe(false); // Disabled, no execution
});

// 💪 Error resilience
test('should handle errors in one handler without affecting others', async () => {
  // Provider1 throws error, Provider2 should still execute
  expect(provider2Executed).toBe(true);
  expect(result.executionLog[0].error).toBeDefined();
});
```

---

## 🎯 **Priority System**

### **Recommended Priority Levels**:

```typescript
// 🚨 Critical UI (Always breaks chain)
Modal Dialog:     1000
Error Dialog:      950
Confirmation:      900

// 📱 Mobile-Specific (Conditional cooperation)
Mobile Sidebar:    800  
Mobile Menu:       750

// 🌐 Global UI (Usually continues chain)
User Menu:         600
Search Bar:        550
Notifications:     500

// 📄 Page-Specific (Variable priority)
Form Validation:   400
Page Navigation:   300

// 🎯 Default/Fallback (Always last)
Page Default:      100
Global Fallback:    50
```

### **Priority Decision Matrix**:

```
┌─────────────────┬──────────────────┬─────────────────────┐
│   Component     │    Priority      │   Chain Behavior   │
├─────────────────┼──────────────────┼─────────────────────┤
│ Modal Dialog    │   1000 (High)    │   Always BREAK     │
│ Mobile Sidebar  │    800 (High)    │   NEXT if others   │
│ User Menu       │    600 (Med)     │   Usually NEXT     │
│ Page Handler    │    100 (Low)     │   Always BREAK     │
└─────────────────┴──────────────────┴─────────────────────┘
```

---

## 🔄 **Migration Strategy**

### **From Old System → Chain System**:

```typescript
// ❌ OLD PROBLEMATIC WAY
layoutContext.registerHotkey({
  key: "Escape",
  handler: () => { closeMenu(); return false; },
  component: "MyComponent"
});

// ✅ NEW CHAIN-BASED WAY  
class MyComponentProvider implements ChainHotkeyProvider {
  getChainHotkeys() {
    return new Map([
      ['Escape', {
        handler: (ctx) => {
          closeMenu();
          // Smart cooperation logic
          if (ctx.hasProvider('ImportantThing')) {
            ctx.next(); // Let others handle too
          } else {
            ctx.preventDefault();
            ctx.break(); // End chain
          }
        }
      }]
    ]);
  }
}

// Register with manager
chainManager.registerProvider(new MyComponentProvider());
```

---

## 🎉 **Benefits Summary**

### **Problems Solved**:

| **Problem** | **Old System** | **New Chain System** |
|-------------|-----------------|----------------------|
| **ESC Key Conflicts** | ❌ Last registered wins | ✅ Cooperative execution |
| **Component Coupling** | ❌ Tight dependencies | ✅ Loose coupling via chain |
| **Dynamic Control** | ❌ Static registration | ✅ Runtime enable/disable |
| **Error Isolation** | ❌ One error breaks all | ✅ Resilient chain execution |
| **Debugging** | ❌ Hard to trace | ✅ Comprehensive logging |
| **Predictability** | ❌ Race conditions | ✅ Priority-based order |

### **Real-World Impact**:

```
🎯 Before: User presses ESC
   → Only ONE component responds (random winner)
   → Other open menus stay open
   → User frustrated 😤

✅ After: User presses ESC  
   → ALL relevant components cooperate
   → Mobile sidebar closes
   → User menu closes
   → Modal takes priority when needed
   → User delighted 🎉
```

---

## 📚 **Usage Examples**

### **Running the Tests**:

```bash
# Run all hotkey tests
npm run test:hotkeys

# Or run individual test files
npm test src/tests/ChainHotkeySystem.test.ts
npm test src/tests/EscKeyConflictResolution.test.ts
```

### **Integration into LayoutContext**:

```typescript
// In LayoutContextImpl.ts
private chainHotkeyManager = new ChainHotkeyManagerImpl();

// Components register as providers
registerSidebarProvider(provider: ChainHotkeyProvider) {
  this.chainHotkeyManager.registerProvider(provider);
}

// Replace old keydown handler with chain execution
private handleGlobalKeydown(event: KeyboardEvent): void {
  const key = this.normalizeKey(event);
  this.chainHotkeyManager.executeChain(key, event);
}
```

This architecture completely eliminates the ESC key conflict and provides a robust, scalable foundation for all future hotkey needs! 🚀
