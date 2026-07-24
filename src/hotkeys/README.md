# Chain-Based Hotkey System

A sophisticated hotkey management system that solves the ESC key conflict problem through cooperative chain execution.

## 📁 **Folder Structure**

```
src/hotkeys/
├── index.ts                          # 🎯 Main module exports
├── HotkeyChainSystem.ts              # 🔧 Core interfaces & types
├── ChainHotkeyManagerImpl.ts         # ⚙️ Implementation
├── README.md                         # 📚 This documentation
│
└── tests/
    ├── ChainHotkeySystem.test.ts     # 🧪 Core functionality tests
    ├── EscKeyConflictResolution.test.ts # 🎯 ESC conflict resolution
    ├── setup.ts                      # 🔧 Test utilities
    └── jest.config.js                # ⚙️ Jest configuration
```

## 🚀 **Quick Start**

```typescript
import { ChainHotkeyManagerImpl, ChainHotkeyProvider } from '@/hotkeys';

// Create manager
const chainManager = new ChainHotkeyManagerImpl();

// Create provider
class MyProvider implements ChainHotkeyProvider {
  getHotkeyProviderId(): string { return 'MyComponent'; }
  getProviderPriority(): number { return 600; }
  getDefaultChainBehavior(): HotkeyChainAction { return 'next'; }
  
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    const hotkeys = new Map();
    hotkeys.set('Escape', {
      key: 'Escape',
      providerId: 'MyComponent',
      enabled: true,
      handler: (ctx) => {
        this.closeComponent();
        
        // Smart cooperation
        if (ctx.hasProvider('ImportantComponent')) {
          ctx.next(); // Let others handle too
        } else {
          ctx.preventDefault();
          ctx.break(); // End chain
        }
      },
      enable: () => this.enabled = true,
      disable: () => this.enabled = false,
      isEnabled: () => this.enabled
    });
    return hotkeys;
  }
}

// Register and use
chainManager.registerProvider(new MyProvider());
```

## 🧪 **Testing**

```bash
# Run hotkey-specific tests
npm run test:hotkeys

# Run individual test suites
npm test src/hotkeys/tests/ChainHotkeySystem.test.ts
npm test src/hotkeys/tests/EscKeyConflictResolution.test.ts
```

## 🎯 **Key Features**

### ✅ **ESC Key Conflict Resolution**
- Before: Only one component handles ESC (last registered wins)
- After: Multiple components cooperate via chain execution

### ✅ **Smart Chain Control**
- `ctx.next()` - Continue to next handler in chain
- `ctx.break()` - Stop chain execution
- `ctx.hasProvider(id)` - Check if specific provider is in chain

### ✅ **Priority System**
- Modal dialogs: 1000 (highest)
- Mobile-specific: 800
- Global UI: 600
- Page-specific: 100 (lowest)

### ✅ **Dynamic Control**
- Enable/disable hotkeys at runtime
- Conditional hotkey registration based on component state
- Provider-level enable/disable

### ✅ **Error Resilience**
- One component error doesn't break the chain
- Comprehensive execution logging
- Graceful error handling

## 🎯 **The Core Problem Solved**

### ❌ **Before: ESC Key Conflict**
```
User presses ESC:
┌─ Sidebar registers ESC handler
├─ UserMenu registers ESC handler ← OVERWRITES!
└─ Result: Only UserMenu closes, Sidebar stays open 😤
```

### ✅ **After: Cooperative Execution**
```
User presses ESC:
┌─ Sidebar executes → closes → calls ctx.next()
├─ UserMenu executes → closes → calls ctx.break()
└─ Result: BOTH close cooperatively! 🎉
```

## 📚 **Architecture**

For detailed architecture documentation, see:
- `docs/hotkey-chain-architecture.md` - Complete system architecture
- `docs/hotkey-system-components.md` - Component relationships

## 🔄 **Migration from Old System**

### Old Way (Problematic)
```typescript
layoutContext.registerHotkey({
  key: "Escape",
  handler: () => { closeMenu(); return false; },
  component: "MyComponent"
});
```

### New Way (Chain-Based)
```typescript
class MyProvider implements ChainHotkeyProvider {
  // Implementation as shown in Quick Start
}
chainManager.registerProvider(new MyProvider());
```

This modular organization makes the hotkey system:
- ✅ Easy to find and maintain
- ✅ Self-contained with its own tests
- ✅ Clear separation from other concerns
- ✅ Ready for future enhancements
