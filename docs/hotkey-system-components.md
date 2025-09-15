# Chain Hotkey System - Component Relationships

## 🗺️ **System Map**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CHAIN HOTKEY SYSTEM OVERVIEW                           │
└─────────────────────────────────────────────────────────────────────────────────┘

    📁 FILE STRUCTURE                          🔄 EXECUTION FLOW
    
┌── src/contexts/                          ┌── 1. KeyDown Event
│   ├── HotkeyChainSystem.ts              │      ⌨️  User presses key
│   │   ├── 🎯 ChainHotkeyProvider        │      │
│   │   ├── 🔧 ChainHotkeyHandler         │      ▼
│   │   ├── 📋 HotkeyExecutionContext     ├── 2. ChainHotkeyManager
│   │   └── 📊 ChainExecutionResult       │      🏗️  Global listener catches event
│   │                                     │      │
│   └── ChainHotkeyManagerImpl.ts         │      ▼
│       ├── ⚙️  Provider registration     ├── 3. Provider Discovery  
│       ├── 🔗 Chain execution            │      🔍 Find handlers for key
│       ├── 📊 Priority sorting           │      │
│       └── 🐛 Debug support              │      ▼
│                                         ├── 4. Priority Sorting
├── tests/                                │      📊 Highest → Lowest
│   ├── ChainHotkeySystem.test.ts         │      │
│   │   ├── 🧪 Core functionality         │      ▼
│   │   ├── 📋 Provider management        ├── 5. Chain Execution
│   │   ├── 🔄 Dynamic enable/disable     │      🏃‍♂️ Sequential handler calls
│   │   └── 💪 Error handling             │      ├── Provider 1 → next()/break()
│   │                                     │      ├── Provider 2 → next()/break()
│   ├── EscKeyConflictResolution.test.ts  │      └── Provider N → break()
│   │   ├── 🎯 ESC key conflict tests     │      │
│   │   ├── 🤝 Component cooperation      │      ▼
│   │   └── 📊 Chain coordination         ├── 6. Result Collection
│   │                                     │      📈 Comprehensive execution log
│   ├── setup.hotkeys.ts                  │      ├── Handlers executed: X/Y
│   │   ├── 🔧 Test utilities             │      ├── preventDefault called: true/false
│   │   ├── 🌐 DOM mocking                │      └── Final action: next/break
│   │   └── 🎭 Event simulation           │
│   │                                     │
│   └── jest.config.hotkeys.js            │
│       └── ⚙️  Jest configuration        │
│                                         │
├── scripts/                              │
│   └── test-hotkeys.js                   │
│       └── 🏃‍♂️ Test runner script           │
│                                         │
└── docs/                                 │
    ├── hotkey-chain-architecture.md     │
    └── hotkey-system-components.md      │
        └── 📚 This documentation         │

```

## 🏗️ **Component Interaction Flow**

```
                            PROVIDER REGISTRATION FLOW
    
    ┌─────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
    │   Component     │────▶ │  ChainHotkeyManager │────▶ │   Provider Map   │
    │   (Sidebar,     │      │                     │      │                  │
    │   UserMenu,     │      │  registerProvider() │      │  providerId →    │
    │   Modal, etc.)  │      │                     │      │  ChainProvider   │
    └─────────────────┘      └─────────────────────┘      └──────────────────┘
                                     │
                                     ▼
                            ┌─────────────────────┐
                            │  Global KeyDown     │
                            │  Listener Setup     │
                            │                     │
                            │  document.addEventListener
                            │  ('keydown', handler)
                            └─────────────────────┘

```

```
                              CHAIN EXECUTION FLOW
                              
    ┌─────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
    │  KeyDown Event  │────▶ │   executeChain()    │────▶ │  Provider Query  │
    │                 │      │                     │      │                  │
    │  key: "Escape"  │      │  • Key normalization      │  • Find providers │
    │  event: Event   │      │  • Provider discovery      │  • Check enabled │
    └─────────────────┘      │  • Chain execution  │      │  • Sort by priority
                             └─────────────────────┘      └──────────────────┘
                                     │                             │
                                     ▼                             ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                PRIORITY-ORDERED CHAIN                      │
                    ├─────────────────────────────────────────────────────────────┤
                    │                                                             │
                    │  ┌───────────────┐    ┌───────────────────────────────────┐ │
                    │  │ Modal (1000)  │───▶│ Handler Execution Context         │ │
                    │  │               │    │ • chainIndex: 0                   │ │
                    │  │ If modal open │    │ • chainLength: 4                  │ │
                    │  │ → break()     │    │ • hasProvider('UserMenu'): true  │ │
                    │  └───────────────┘    │ • next() / break()                │ │
                    │         │             └───────────────────────────────────┘ │
                    │         ▼ (continue)                                        │
                    │  ┌───────────────┐    ┌───────────────────────────────────┐ │
                    │  │ Sidebar (800) │───▶│ Handler Execution Context         │ │
                    │  │               │    │ • chainIndex: 1                   │ │
                    │  │ Close sidebar │    │ • currentProvider: 'MobileSidebar'│ │
                    │  │ → next()      │    │ • Smart cooperation logic         │ │
                    │  └───────────────┘    └───────────────────────────────────┘ │
                    │         │                                                   │
                    │         ▼ (continue)                                        │
                    │  ┌───────────────┐    ┌───────────────────────────────────┐ │
                    │  │ UserMenu(600) │───▶│ Handler Execution Context         │ │
                    │  │               │    │ • chainIndex: 2                   │ │
                    │  │ Close menu    │    │ • Check if last handler           │ │
                    │  │ → break()     │    │ • preventDefault() + break()      │ │
                    │  └───────────────┘    └───────────────────────────────────┘ │
                    │         │                                                   │
                    │         ▼ (STOP - chain broken)                            │
                    │  ┌───────────────┐                                         │
                    │  │ Page (100)    │    ❌ SKIPPED DUE TO BREAK              │
                    │  │ (not reached) │                                         │
                    │  └───────────────┘                                         │
                    │                                                             │
                    └─────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                 EXECUTION RESULT                           │
                    ├─────────────────────────────────────────────────────────────┤
                    │ • executed: true                                            │
                    │ • handlersExecuted: 2 (Sidebar + UserMenu)                │
                    │ • finalAction: 'break'                                      │
                    │ • preventedDefault: true                                    │
                    │ • executionLog: [Sidebar✅, UserMenu✅, Modal❌, Page❌]    │
                    │                                                             │
                    │ 🎉 RESULT: Both sidebar AND user menu closed!              │
                    └─────────────────────────────────────────────────────────────┘
```

## 🧩 **Interface Relationships**

```
                              INTERFACE HIERARCHY
                              
    ┌─────────────────────────────────────────────────────────────────┐
    │                      ChainHotkeyProvider                        │
    │  (Implemented by components like Sidebar, UserMenu, Modal)     │
    ├─────────────────────────────────────────────────────────────────┤
    │  • getHotkeyProviderId(): string                               │
    │  • getProviderPriority(): number                               │
    │  • getDefaultChainBehavior(): HotkeyChainAction                │
    │  • getChainHotkeys(): Map<string, ChainHotkeyHandler> | null   │
    │  • onChainRegistered?(): void                                  │
    │  • onChainUnregistered?(): void                                │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼ returns
    ┌─────────────────────────────────────────────────────────────────┐
    │                    ChainHotkeyHandler                           │
    │         (Individual hotkey configuration)                      │
    ├─────────────────────────────────────────────────────────────────┤
    │  • key: string                                                 │
    │  • providerId: string                                          │
    │  • enabled: boolean                                            │
    │  • priority?: number                                           │
    │  • handler: (ctx: HotkeyExecutionContext) => void             │
    │  • enable(): void                                              │
    │  • disable(): void                                             │
    │  • isEnabled(): boolean                                        │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼ receives
    ┌─────────────────────────────────────────────────────────────────┐
    │                 HotkeyExecutionContext                          │
    │             (Runtime execution state)                          │
    ├─────────────────────────────────────────────────────────────────┤
    │  readonly event: KeyboardEvent                                 │
    │  readonly key: string                                          │
    │  readonly currentProvider: string                              │
    │  readonly chainIndex: number                                   │
    │  readonly chainLength: number                                  │
    │                                                                │
    │  next(): void                                                  │
    │  break(): void                                                 │
    │  preventDefault(): void                                        │
    │  stopPropagation(): void                                       │
    │  hasProvider(providerId: string): boolean                      │
    │  getProviderChain(): string[]                                  │
    └─────────────────────────────────────────────────────────────────┘
```

## 🧪 **Test Structure Map**

```
                               TEST ARCHITECTURE
                               
    ┌─────────────────────────────────────────────────────────────────┐
    │                    ChainHotkeySystem.test.ts                   │
    │                      (Core Functionality)                      │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                │
    │  Provider Registration        📋                               │
    │  ├─ register provider successfully                             │
    │  ├─ unregister provider successfully                           │
    │  └─ replace provider with same ID                              │
    │                                                                │
    │  Chain Execution - Basic      🔗                               │
    │  ├─ execute single handler chain                               │
    │  ├─ not execute disabled handlers                              │
    │  └─ not execute when provider returns null                     │
    │                                                                │
    │  Chain Execution - Priority   📊                               │
    │  ├─ execute handlers in priority order                         │
    │  ├─ continue chain when handlers call next()                  │
    │  └─ stop chain when handler calls break()                     │
    │                                                                │
    │  Execution Context           🎯                                │
    │  ├─ provide correct context information                        │
    │  ├─ provide correct chain information                          │
    │  └─ provide hasProvider() functionality                        │
    │                                                                │
    │  Event Handling              ⌨️                                │
    │  ├─ handle preventDefault correctly                            │
    │  ├─ handle stopPropagation correctly                           │
    │  └─ only call preventDefault once                              │
    │                                                                │
    │  Dynamic Enable/Disable      🔄                                │
    │  ├─ enable/disable individual hotkeys                          │
    │  └─ enable/disable all hotkeys for provider                    │
    │                                                                │
    │  Error Handling              💪                                │
    │  ├─ handle errors in handlers gracefully                       │
    │  └─ continue chain despite errors                              │
    │                                                                │
    │  Key Normalization           🔤                                │
    │  ├─ normalize modifier keys correctly                          │
    │  └─ handle multiple modifiers                                  │
    │                                                                │
    │  Debug Information           🐛                                │
    │  └─ provide comprehensive debug information                     │
    │                                                                │
    └─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ imports + extends
                                    ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                EscKeyConflictResolution.test.ts                 │
    │                    (THE PROBLEM SOLVER)                        │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                │
    │  Single Component Scenarios  🎯                                │
    │  ├─ close only mobile sidebar when only sidebar open           │
    │  ├─ close only user menu when only user menu open             │
    │  └─ close only modal when only modal open                      │
    │                                                                │
    │  Multiple Component Scenarios 🤝 ⭐ CORE CONFLICT RESOLUTION   │
    │  ├─ close both sidebar AND user menu when both open ✨        │
    │  └─ close modal ONLY when modal + others open                  │
    │                                                                │
    │  State-Based Behavior        🔄                                │
    │  ├─ not execute when components in wrong state                 │
    │  └─ handle dynamic state changes                               │
    │                                                                │
    │  Chain Execution Order       📊                                │
    │  └─ execute handlers in correct priority order                 │
    │                                                                │
    │  Debug Information           🐛                                │
    │  └─ provide accurate debug information for ESC key             │
    │                                                                │
    │  Performance & Error Resilience 💪                             │
    │  └─ handle errors in one handler without affecting others      │
    │                                                                │
    └─────────────────────────────────────────────────────────────────┘
```

## 🎯 **The Core Problem & Solution**

### **❌ OLD SYSTEM - The Problem**:
```
Components fight for the same ESC key:

   SidebarComponent.registerHotkey("Escape") 
                    ⬇
   UserMenuComponent.registerHotkey("Escape") ← OVERWRITES!
                    ⬇
   Result: Only UserMenu responds to ESC
           Sidebar stays open → User frustrated 😤
```

### **✅ NEW SYSTEM - The Solution**:
```
Components cooperate via chain:

   1. Sidebar.getChainHotkeys() → "Escape" handler
   2. UserMenu.getChainHotkeys() → "Escape" handler  
   3. ChainManager sorts by priority: Sidebar(800) → UserMenu(600)
   4. ESC pressed:
      ├─ Sidebar executes → closes → calls ctx.next()
      └─ UserMenu executes → closes → calls ctx.break()
   5. Result: BOTH close! → User delighted 🎉
```

This architecture completely solves the ESC key conflict through **cooperative chain execution** instead of **winner-take-all competition**! 🚀