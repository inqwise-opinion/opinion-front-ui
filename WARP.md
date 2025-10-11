# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a TypeScript front-end application for the Opinion system, migrated from a traditional servlet-based Java application. It uses modern web development tools including Vite, TypeScript, and SCSS, with a component-based architecture.

**Migration Context**: This project is part of a migration from servlet-based Java applications. The original project structure and API calls (named DataPostMaster) are being adapted to TypeScript with modern client-side patterns.

## Development Commands

### Core Development Workflow
```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 🤖 AI Agent Development Process Guidelines

**IMPORTANT**: The `npm run dev` command starts a persistent development server that prevents the AI agent from continuing with other tasks. 

**Process Agreement**:
- **User Responsibility**: User will manually run `npm run dev` in a separate terminal instance on port 3000
- **Agent Responsibility**: Agent can assume the development server is available at `http://localhost:3000`
- **Communication**: If the agent needs to verify the server or encounters port issues, agent should inform the user to handle this manually
- **Testing**: Agent can reference `http://localhost:3000` for testing and verification purposes

This arrangement allows the agent to continue with development tasks while the user maintains control over the development server lifecycle.

### 📋 Current Development Status: Architecture Complete

**Status**: ✅ **ARCHITECTURE COMPLETE** - All core systems fully implemented and tested

**Achievements**: 
- **Micro-Kernel Architecture**: LayoutContext as application kernel ✅
- **Event-Driven Communication**: EventBus with publish/subscribe/request patterns ✅
- **Reactive Data Binding**: Observable pattern with ComputedObservables ✅
- **Chain-Based Hotkey System**: Priority-based conflict resolution ✅
- **Hierarchical Breadcrumbs**: Page-scoped breadcrumb management ✅
- **Service-Oriented Architecture**: Dependency injection with interfaces ✅
- **Comprehensive Testing**: 564 tests with 43% coverage (90% events, 86% hotkeys) ✅

**Next Phase**: Feature development and real API integration

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix
```

**Note**: The development server uses `SASS_SILENCE_DEPRECATIONS=legacy-js-api` to suppress SASS warnings.

### 🤖 MCP (Model Context Protocol) Integration

**Available MCP Tools for Development Enhancement:**

This project integrates with several MCP tools available in your development environment:

#### **🌐 Browser Automation & Testing**
- **`execute_browser_action`**: Smart browser automation with chrome-devtools delegation
- **`take_screenshot`**: Page and element screenshots for visual verification
- **`take_snapshot`**: Text-based DOM snapshots for component inspection
- **`navigate_page`**: URL navigation and page state management
- **`click`**, **`fill`**, **`hover`**: Interactive element testing
- **`evaluate_script`**: JavaScript execution in browser context
- **`list_console_messages`**: Console error/warning monitoring
- **`list_network_requests`**: Network request analysis and API testing

#### **🔍 Performance & Debug Analysis**
- **`performance_start_trace`**: Performance profiling and Core Web Vitals
- **`performance_stop_trace`**: Trace analysis with detailed metrics
- **`performance_analyze_insight`**: Detailed performance bottleneck analysis
- **`analyze_visual_diff`**: Visual regression detection between screenshots
- **`fix_my_app`**: Comprehensive error detection and fix recommendations
- **`fix_my_jank`**: Layout shift and performance issue detection
- **`find_component_source`**: Map DOM elements to source code files

#### **📚 Documentation & Code Analysis**
- **`search_generic_code`**: Search GitHub repositories for code patterns
- **`search_generic_documentation`**: Semantic documentation search
- **`fetch_generic_documentation`**: Fetch complete repository documentation
- **`get-library-docs`**: Library-specific documentation retrieval
- **`resolve-library-id`**: Library identification for documentation

**Usage Examples in Development:**
```typescript
// Performance testing with MCP
// 1. Start performance trace
// 2. Navigate to page: http://localhost:3000
// 3. Take screenshots for visual verification
// 4. Stop trace and analyze Core Web Vitals
// 5. Use fix_my_jank for layout shift analysis

// Component debugging workflow
// 1. Take DOM snapshot of current page state
// 2. Use find_component_source to locate element source
// 3. Use execute_browser_action for interaction testing
// 4. Monitor console messages for errors
// 5. Analyze network requests for API issues
```

## Architecture

### High-Level System Architecture

> **📚 Complete Architecture Documentation:** See [`ARCHITECTURE.md`](ARCHITECTURE.md) for comprehensive system design and [`docs/`](docs/) directory for detailed subsystem documentation.

The **Opinion Frontend** is a modern TypeScript SPA built with a **micro-kernel architecture** that emphasizes modularity, scalability, and maintainability. The system is organized around several key architectural principles:

**🎯 Core Design Principles:**
- **Micro-Kernel Pattern**: Central LayoutContext coordinates all subsystems
- **Service-Oriented Architecture**: Business logic encapsulated in services
- **Component-Based UI**: Modular, reusable UI components with lifecycle management
- **Event-Driven Communication**: Loose coupling via EventBus messaging
- **Hierarchical Scoping**: Safe, scoped operations prevent cross-system conflicts

**🏗️ System Layers:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │   Page Layer    │ │  Component UI   │ │ Layout System │  │
│  │ (PageComponent) │ │ (Interactive)   │ │  (Global)     │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Application Kernel Layer                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              LayoutContext (Micro-Kernel)               │ │
│  │ • Component Registry  • Service Registry • EventBus    │ │
│  │ • Lifecycle Manager  • Resource Coordinator            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │   Data Services │ │ Business Logic  │ │   Utilities   │  │
│  │  (MockApiSvc)   │ │   (Future)      │ │ (Validation)  │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │     Routing     │ │   Asset Mgmt    │ │  Build Tools  │  │
│  │ (OpinionApp)    │ │ (Vite/SCSS)     │ │ (TypeScript)  │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**🔗 Key Subsystems:**
- **[Layout System](docs/layout-architecture.md)**: CSS Grid + Flexbox responsive layout with global components
- **[Service Architecture](docs/service-architecture-progress.md)**: Service registration and dependency injection
- **[Event System](docs/event-system.md)**: EventBus-based inter-component communication
- **[Hotkey System](docs/hotkey-chain-architecture.md)**: Priority-based chain execution for keyboard shortcuts
- **[Breadcrumbs System](docs/breadcrumbs-architecture.md)**: Hierarchical navigation with scoped page management
- **[Component Hierarchy](docs/component-hierarchy.md)**: UI component organization and lifecycle

**🌐 Cross-System Integration:**
- **PageContext**: Page-level coordination and scoped resource management
- **LayoutContext**: Application-wide coordination and service discovery
- **EventBus**: Loose coupling between components and services
- **Component Registry**: Dynamic component registration and lifecycle management

### Application Structure

This is a **single-page application (SPA)** with a custom routing system built around a central `OpinionApp` class. The application uses a **micro-kernel design** with modular components and **service-oriented architecture**.

**Key Architectural Components**:

- **OpinionApp** (`src/app.ts`): Main application controller and composition root - handles routing, service registration, and application lifecycle
- **Layout** (`src/components/Layout.ts`): UI structure manager that owns and provides LayoutContext to OpinionApp via handler pattern
- **LayoutContext** (`src/contexts/LayoutContextImpl.ts`): **Application Kernel** - manages component registry, service registry, EventBus, and coordinates all application resources
- **PageComponent** (`src/components/PageComponent.ts`): Abstract base class providing common page functionality including lifecycle management, event handling, and keyboard shortcuts
- **Service Layer**: Business logic services that register with LayoutContext and communicate via EventBus
- **Global Layout System**: Header, Sidebar, and Footer components that persist across page navigation
- **MockApiService** (`src/services/MockApiService.ts`): Development API layer with realistic test data

### Component Patterns

The codebase follows a **component-based architecture** where:

- All page-level components extend `PageComponent` abstract class
- Components manage their own lifecycle (init/destroy)
- Event delegation pattern using `data-action` attributes
- Automatic cleanup of event listeners and timers
- **Layout Context System**: Centralized layout coordination with `LayoutContextImpl`
- **Error Message System**: Global error/warning/info/success message display
- **Responsive Layout Modes**: Automatic CSS class management for different viewport modes
- **Chain-Based Hotkey System**: Priority-based cooperative hotkey handling with chain execution control

### Service Architecture

> **📋 Service Documentation:** See [`docs/service-architecture-progress.md`](docs/service-architecture-progress.md) for implementation progress and [`docs/service-interfaces.md`](docs/service-interfaces.md) for interface specifications.

The application implements a **service-oriented architecture** with the following patterns:

#### **LayoutContext as Application Kernel**
- **Component Registry**: Manages all UI components (header, sidebar, footer)
- **Service Registry**: Manages all business logic services
- **EventBus Management**: Provides unified event system for service communication
- **Lifecycle Coordination**: Handles initialization and cleanup for all registered resources

#### **Handler Pattern for Service Registration**
```typescript
// OpinionApp sets handler before Layout initialization
layout.setContextHandler(async (context: LayoutContext) => {
  await this.registerServices(context);
});

// Layout provides configured context when ready
await layout.init(); // Calls handler when LayoutContext is configured
```

#### **Service Interface Contracts**
- Services work with **abstract interfaces**, not concrete components
- **UserDisplay** interface for components that display user information
- **DataLoader<T>** interface for data loading services
- Services register target components that implement required interfaces

#### **Data Binding Patterns**
- **Reactive Updates**: Services automatically update registered components when data changes
- **Event-Driven Communication**: Services communicate via LayoutContext's EventBus
- **Lifecycle Integration**: Services automatically cleaned up when LayoutContext destroys
- **Type Safety**: Full TypeScript interfaces throughout service layer

### TypeScript Configuration

The project uses modern TypeScript with strict settings and custom path mappings:

```typescript
"paths": {
  "@/*": ["src/*"],
  "@/components/*": ["src/components/*"],
  "@/utils/*": ["src/utils/*"],
  "@/types/*": ["src/types/*"],
  "@/api/*": ["src/api/*"],
  "@/assets/*": ["src/assets/*"]
}
```

### Routing System

Custom client-side routing implemented in `OpinionApp`:

- Routes handled by `handleRoute()` method
- Page instances created/destroyed on navigation
- Browser history integration with `popstate` events
- Current routes:
  - `/` → DebugPage (development/testing)
  - `/dashboard` → DashboardPage
  - Fallback → DebugPage

### Global Layout Architecture

> **📋 Layout Documentation:** See [`docs/layout-architecture.md`](docs/layout-architecture.md) for comprehensive layout system documentation and [`docs/layout-mode-system.md`](docs/layout-mode-system.md) for responsive behavior details.

The application uses a **CSS Grid + Flexbox hybrid layout system**:

```html
<div class="app-layout">                    <!-- CSS Grid Container -->
  <nav class="app-sidebar">                 <!-- Grid Area: sidebar -->
    <!-- Sidebar component -->
  </nav>
  <div class="app-content-area">            <!-- Grid Area: content -->
    <header class="app-header">             <!-- Fixed header -->
      <!-- Header component -->
    </header>
    <div class="app-content-scroll">        <!-- Scrollable container -->
      <div class="app-error-messages">      <!-- Error messages -->
        <!-- Global error/notification messages -->
      </div>
      <main class="app-main" id="app">      <!-- Dynamic content (no internal scroll) -->
        <!-- Page components render here -->
      </main>
      <footer class="app-footer">           <!-- Footer flows after content -->
        <!-- Footer component -->
      </footer>
    </div>
  </div>
</div>
```

**Layout Principles**:
- **CSS Grid** for overall structure (sidebar + content areas)
- **Flexbox** for content flow (header → scrollable container → footer inside scroll area)
- **Page-level scrolling** (`.app-content-scroll` handles scrolling, not `.app-main`)
- **Natural content height** (`.app-main` shows full content, footer flows after)
- **Layout Context coordination** (centralized responsive behavior and error messaging)
- **CSS Custom Properties** (`--sidebar-width`, `--sidebar-compact-width`) for dynamic theming
- **Responsive breakpoints** with automatic CSS class management

**Responsive Behavior**:
- **Desktop (≥1025px)**: Sidebar 280px fixed width, CSS Grid layout
- **Tablet (769px-1024px)**: Sidebar 280px, responsive grid adjustments
- **Mobile (≤768px)**: Single column, sidebar hidden/overlay mode

## Development Environment

### Build System
- **Vite**: Fast development server and build tool
- **Target**: ES2020
- **Port**: 3000 with auto-open browser
- **Source Maps**: Enabled for debugging

### Testing Setup
- **Framework**: Jest with ts-jest preset
- **Environment**: JSDOM for DOM testing
- **Coverage**: Configured for `src/**/*.{ts,tsx}` excluding type definitions
- **Setup**: Custom test setup in `tests/setup.ts` with console noise reduction

### 📊 Test Coverage Status

**Overall Coverage: 43% (564 tests)**

```
 File                              | % Stmts | % Branch | % Funcs | % Lines
-----------------------------------|---------|----------|---------|--------
 All files                         |   43.06 |    34.39 |   40.71 |   43.89
  src                              |   38.66 |    28.88 |   39.53 |   39.53
  src/api                          |      30 |        0 |   33.33 |      30
  src/components                   |   45.36 |    34.78 |   44.07 |   46.53
  src/contexts                     |   65.78 |    45.45 |   56.25 |   68.42
  src/events                       |   90.32 |       75 |   83.33 |   90.32
  src/hotkeys                      |   86.36 |    77.27 |   85.18 |   86.36
  src/observables                  |   87.50 |    75.00 |   80.00 |   87.50
  src/pages                        |   28.94 |    21.21 |   33.33 |   29.72
  src/services                     |   62.50 |       25 |   57.14 |   62.50
  src/utils                        |   93.33 |    83.33 |      100 |   93.33
  src/utils/config                 |      100 |      100 |      100 |      100
```

**🏆 High-Quality Coverage Areas:**
- **🔥 Hotkey System**: 86% - Comprehensive chain execution tests
- **📡 Event System**: 90% - EventBus integration and lifecycle tests
- **📊 Observables**: 87% - Reactive data binding with validators/transformers
- **⚙️ Configuration**: 100% - Environment and build configuration
- **🛠️ Utilities**: 93% - Helper functions and common operations
- **🏗️ Context System**: 66% - LayoutContext and application kernel

**Test Categories:**
- **Architecture Tests**: Service registration, dependency injection, micro-kernel coordination
- **Integration Tests**: EventBus communication, hotkey chains, breadcrumb scoping
- **Component Tests**: Lifecycle management, DOM integration, responsive behavior
- **Performance Tests**: Layout shift detection, memory leak prevention, cleanup verification

### Code Standards
- **ESLint**: TypeScript-aware configuration
- **Rules**: Strict TypeScript rules with unused variables as errors
- **Console**: Console statements allowed (common in this codebase for debugging)

## Key Implementation Details

### Chain-Based Hotkey Architecture

> **🔥 Hotkey Documentation:** See [`docs/hotkey-chain-architecture.md`](docs/hotkey-chain-architecture.md) for complete system design, [`docs/hotkey-system-components.md`](docs/hotkey-system-components.md) for component details, and [`docs/hotkey-system-migration.md`](docs/hotkey-system-migration.md) for migration guide. Also see [`src/hotkeys/README.md`](src/hotkeys/README.md) for implementation details.

The application uses a sophisticated **Chain-Based Hotkey System** that resolves hotkey conflicts through priority-based execution with cooperative chain control.

**Key Features:**
- **Priority-Based Execution**: Higher priority providers execute first (Modal: 1000, Sidebar: 800, UserMenu: 600)
- **Chain Control**: Handlers use `ctx.next()` to continue or `ctx.break()` to stop the chain
- **Dynamic Enable/Disable**: Individual hotkeys and entire providers can be enabled/disabled
- **State-Based Activation**: Providers only activate hotkeys when components are in relevant states
- **Error Resilience**: Errors in one handler don't affect others in the chain
- **Backward Compatibility**: Legacy `registerHotkey()` calls automatically converted via adapter

**Chain Execution Example (ESC Key)**:
```typescript
// Priority Order: Modal (1000) → MobileSidebar (800) → UserMenu (600) → Page (100)

// When all are active:
// 1. Modal executes first, calls ctx.break() → chain stops (modal has priority)
// 2. When only sidebar + menu active:
//    - Sidebar executes, calls ctx.next() → continues to user menu
//    - UserMenu executes, calls ctx.break() → both components handled cooperatively
```

**Implementation Pattern**:
```typescript
// New Chain-Based Provider (Recommended)
class MyComponentProvider implements ChainHotkeyProvider {
  getHotkeyProviderId(): string { return 'MyComponent'; }
  getProviderPriority(): number { return 600; }
  
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    if (!this.isComponentActive) return null; // State-based activation
    
    return new Map([['Escape', {
      key: 'Escape',
      providerId: 'MyComponent',
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.handleEscape();
        ctx.preventDefault();
        
        // Smart chain control
        if (ctx.hasProvider('HigherPriorityComponent')) {
          ctx.next(); // Let higher priority also handle
        } else {
          ctx.break(); // We're the final handler
        }
      },
      enable: () => this.enableEscapeKey(),
      disable: () => this.disableEscapeKey(),
      isEnabled: () => this.isEscapeEnabled()
    }]]);
  }
}

// Register with LayoutContext
layoutContext.registerChainProvider(new MyComponentProvider());
```

**Legacy Compatibility**:
```typescript
// Old system (still works via adapter)
layoutContext.registerHotkey({
  key: 'Escape',
  handler: (event) => { /* handler */ },
  component: 'MyComponent'
});
// → Automatically converted to chain provider with priority 500
```

### Service Layer Pattern
The `MockApiService` provides realistic development data with:
- Simulated network delays (500ms)
- User authentication simulation
- Survey/opinion data with completion tracking
- Chart data generation for dashboard features

### Layout Context System
The `LayoutContextImpl` provides centralized coordination with:
- Responsive breakpoint management (mobile/tablet/desktop/desktop-compact)
- Sidebar dimension tracking and CSS variable updates
- Global error message system integration
- Component-to-component event communication
- Automatic CSS class management for layout modes

### Component Lifecycle Management
All components extending `PageComponent` get:
- Automatic initialization with `onInit()` hook
- Event listener tracking and cleanup
- Keyboard shortcut handling (Escape key, etc.)
- Action delegation via `data-action` attributes
- Error boundary patterns

### Migration-Specific Considerations
This project maintains compatibility with servlet-based patterns:
- API endpoints being adapted from servlet structure
- Session management replaced with client-side state
- Server-side rendering replaced with SPA routing
- Original DOM structure and logic closely followed

### Hotkey System Migration Guide

> **🚀 MIGRATION PATH:** Gradual transition from legacy to chain-based hotkey system

**Current State**: The application supports **dual hotkey systems** during the migration period:
1. **Legacy System**: Old `registerHotkey()` calls work via backward compatibility adapter
2. **Chain System**: New `registerChainProvider()` for advanced hotkey management

**Migration Steps**:

1. **Phase 1 - Immediate (Current)**: All existing hotkeys continue working
   ```typescript
   // Existing code works unchanged
   layoutContext.registerHotkey({ key: 'Escape', handler: myHandler });
   ```

2. **Phase 2 - Gradual Migration**: Convert high-conflict components first
   ```typescript
   // Priority: Modal dialogs → Sidebar → Menus → Page components
   // Start with components that have ESC key conflicts
   ```

3. **Phase 3 - New Components**: Use chain system for all new components
   ```typescript
   // All new components should implement ChainHotkeyProvider
   class NewComponentProvider implements ChainHotkeyProvider { /* ... */ }
   ```

**Component Priority Guidelines**:
- **Modal Dialogs**: 1000+ (highest priority, always break chain)
- **Mobile/Overlay Components**: 800-900 (high priority, context-aware)
- **Menu Systems**: 600-700 (medium priority, cooperative)
- **Page Components**: 100-500 (lower priority, default handlers)
- **Legacy Components**: 500 (medium priority via adapter)

**Debugging Chain Execution**:
```typescript
// Get debug info for a specific key
const debugInfo = layoutContext.getChainDebugInfo('Escape');
console.log('ESC key chain:', debugInfo);

// Chain execution produces detailed logs:
// 🔗 ChainHotkeyManager - Executing chain for 'Escape' with 3 handlers
//   🔗 1/3: Executing ModalDialog
//   ✅ ModalDialog: break (prevented: true)
//   🛑 Chain broken by ModalDialog
```

**Testing Chain Behavior**:
```typescript
// Integration tests verify cooperative ESC handling
// See: src/hotkeys/tests/EscKeyConflictResolution.test.ts
test('should close both sidebar and user menu cooperatively', async () => {
  const result = await chainManager.executeChain('Escape', mockEvent);
  expect(result.handlersExecuted).toBe(2); // Both handled
  expect(result.finalAction).toBe('break'); // Chain completed
});
```

### Hierarchical Breadcrumbs Architecture

> **🍞 Breadcrumbs Documentation:** See [`docs/breadcrumbs-architecture.md`](docs/breadcrumbs-architecture.md) for complete design decisions, architecture patterns, and implementation details.

The application implements a **Hierarchical Breadcrumbs System** that provides safe, scoped breadcrumb management where each page can only modify breadcrumbs at or below its level in the hierarchy.

**Key Features:**
- **Page-Scoped Operations**: Each page can only modify breadcrumbs at or below its hierarchy level
- **Parent Protection**: Breadcrumbs above the current page's scope remain untouched
- **Case-Insensitive Search**: Finds page scope using exact match first, then case-insensitive fallback
- **Append-Only Fallback**: When page ID not found, scope limited to append-only after existing items
- **Silent Scope Enforcement**: Operations on out-of-scope items are silently ignored
- **Async Safety**: All operations handle component unavailability gracefully

**Architecture Components:**
- **HierarchicalBreadcrumbsManagerImpl**: Page-scoped breadcrumb manager with hierarchical enforcement
- **BreadcrumbsManagerImpl**: Original flat breadcrumb manager (legacy compatibility)
- **BreadcrumbsComponent**: UI component that renders breadcrumbs and handles interactions
- **PageContext Integration**: Automatic hierarchical manager instantiation for pages

**Scoping Behavior Example:**
```typescript
// Global breadcrumb state: Home > Dashboard > Reports > Chart
// Current page: ReportsPage (scope starts at "Reports")

const breadcrumbsManager = await pageContext.breadcrumbs();

// ✅ This works - modifies only the scoped portion
breadcrumbsManager.set([
  { id: 'ReportsPage', text: 'Reports' },     // Scope starts here
  { id: 'analytics', text: 'Analytics' },
  { id: 'dashboard', text: 'Dashboard View' }
]);
// Result: Home > Dashboard > Reports > Analytics > Dashboard View

// ✅ This works - adds to scoped portion
breadcrumbsManager.add({ id: 'details', text: 'Details' });
// Result: Home > Dashboard > Reports > Analytics > Dashboard View > Details

// ❌ This is ignored - trying to modify parent scope
breadcrumbsManager.remove('home'); // Silently ignored
// Result: Home > Dashboard > Reports > Analytics > Dashboard View > Details (unchanged)
```

**Fallback Behavior:**
```typescript
// When page ID not found in current breadcrumbs
// Current state: Home > Settings > User Profile
// DebugPage tries to set breadcrumbs but "DebugPage" not found

breadcrumbsManager.set([
  { id: 'DebugPage', text: 'Debug' },
  { id: 'tools', text: 'Tools' }
]);
// Result: Home > Settings > User Profile > Debug > Tools (appended)
// Warning logged: "Page ID 'DebugPage' not found, scope limited to append-only"
```

**PageContext Integration:**
```typescript
// Pages automatically get hierarchical breadcrumb management
class MyPage extends PageComponent {
  async someMethod() {
    const pageContext = await this.getPageContext();
    const breadcrumbs = pageContext.breadcrumbs(); // HierarchicalBreadcrumbsManagerImpl
    
    // Safe scoped operations
    breadcrumbs.set([{ id: 'MyPage', text: 'My Page' }]);
    breadcrumbs.add({ id: 'section', text: 'Section' });
    breadcrumbs.clear(); // Clears only scoped items
  }
}
```

**Direct Component Access (Unrestricted):**
```typescript
// For cases requiring full breadcrumb control (use carefully)
const layoutContext = this.mainContent.getLayoutContext();
const header = layoutContext.getHeader();
const breadcrumbsComponent = header.getBreadcrumbsComponent();

// ⚠️ Unrestricted access - can modify entire breadcrumb trail
breadcrumbsComponent.setBreadcrumbs([
  { id: 'root', text: 'Root' },
  { id: 'section', text: 'Section' },
  { id: 'page', text: 'Page' }
]); // Replaces entire trail
```

**Debug and Testing:**
The DebugPage includes comprehensive breadcrumb testing with both approaches:
- **📋 PageContext Tests**: Hierarchical/scoped breadcrumb management
- **🏗️ HeaderComponent Tests**: Direct/unrestricted component access
- **Component Status**: Detailed BreadcrumbsComponent state inspection
- **Scoping Visualization**: Compare behavior between scoped and direct access

**Migration Guide:**
1. **New Pages**: Use PageContext breadcrumbs (automatic hierarchical scoping)
2. **Legacy Pages**: Existing code continues working, gradually migrate to PageContext
3. **Router Integration**: Router should establish parent hierarchy, pages manage their scope
4. **Direct Access**: Reserve for special cases requiring full breadcrumb control

## Testing Guidelines

> **🧪 Testing Documentation:** See [`docs/error-message-tests.md`](docs/error-message-tests.md) for error handling tests and various test files in [`tests/`](tests/) directory for component-specific test patterns.

### Component Testing Approach
The test suite focuses on:
- **Component Lifecycle**: Init/destroy behavior verification
- **DOM Integration**: Proper element insertion and cleanup  
- **Event Handling**: User interaction and keyboard shortcuts
- **Responsive Behavior**: Layout changes across screen sizes
- **Error Handling**: Graceful failure scenarios

### Test File Organization
- Tests mirror source structure in `tests/` directory
- Component tests include DOM manipulation verification
- Setup file handles JSDOM polyfills and console noise reduction

## Development Notes

### Console Logging Pattern
The codebase uses extensive console logging with emoji prefixes for debugging:
- `🚀` - Main application lifecycle
- `🎯` - Routing and navigation  
- `🏗️` - Component initialization
- `✅` - Success states
- `❌` - Error states
- `⚠️` - Warnings

### Global Error Handling
The application includes comprehensive error handling:
- Global error listeners for uncaught exceptions
- Promise rejection handling
- User-friendly error display with reload option
- Detailed error logging with stack traces

### Reference Projects
When working on this codebase, refer to these related projects for context:
- **Admin UI Reference**: `../opinion opensource/opinion-admin-ui`  
- **Admin App Reference**: `../opinion opensource/opinion-app-admin`

These contain the original servlet-based implementation patterns being migrated to TypeScript.

## 📚 Documentation Index

### Core Architecture Documentation
- **[`ARCHITECTURE.md`](ARCHITECTURE.md)**: Comprehensive system architecture overview
- **[`README.md`](README.md)**: Project setup and basic information
- **[`STATUS_REPORT.md`](STATUS_REPORT.md)**: Current project status and progress

### System Design Documentation (`docs/`)

**🏗️ Layout & UI Systems:**
- **[`layout-architecture.md`](docs/layout-architecture.md)**: Complete layout system design and CSS Grid implementation
- **[`layout-mode-system.md`](docs/layout-mode-system.md)**: Responsive behavior and viewport management
- **[`layout-context-access-patterns.md`](docs/layout-context-access-patterns.md)**: LayoutContext usage patterns
- **[`layout-improvements-proposal.md`](docs/layout-improvements-proposal.md)**: Proposed enhancements
- **[`component-hierarchy.md`](docs/component-hierarchy.md)**: UI component organization

**🍞 Navigation & Breadcrumbs:**
- **[`breadcrumbs-architecture.md`](docs/breadcrumbs-architecture.md)**: Hierarchical breadcrumbs system design
- **[`layout-navigation.md`](docs/layout-navigation.md)**: Navigation patterns and routing

**⌨️ Hotkey & Input Systems:**
- **[`hotkey-chain-architecture.md`](docs/hotkey-chain-architecture.md)**: Priority-based hotkey system design
- **[`hotkey-system-components.md`](docs/hotkey-system-components.md)**: Hotkey component implementation details
- **[`hotkey-system-migration.md`](docs/hotkey-system-migration.md)**: Migration from legacy to chain-based system
- **[`src/hotkeys/README.md`](src/hotkeys/README.md)**: Hotkey implementation code documentation

**📡 Event & Communication Systems:**
- **[`event-system.md`](docs/event-system.md)**: EventBus architecture and patterns
- **[`eventbus-integration.md`](docs/eventbus-integration.md)**: EventBus integration guidelines
- **[`active-page-eventbus-system.md`](docs/active-page-eventbus-system.md)**: Page-level event coordination
- **[`src/docs/event-system-cleanup-summary.md`](src/docs/event-system-cleanup-summary.md)**: Event system refactoring summary
- **[`src/docs/sidebar-events-explained.md`](src/docs/sidebar-events-explained.md)**: Sidebar event patterns

**🏢 Service Architecture:**
- **[`service-architecture-progress.md`](docs/service-architecture-progress.md)**: Service implementation progress tracking
- **[`service-interfaces.md`](docs/service-interfaces.md)**: Service interface specifications
- **[`unified-handler-system.md`](docs/unified-handler-system.md)**: Handler pattern implementation

**🛠️ Implementation & Development:**
- **[`implementation-summary.md`](docs/implementation-summary.md)**: Overall implementation summary
- **[`initialization-flow.md`](docs/initialization-flow.md)**: Application startup sequence
- **[`phase3-task3.3-mission.md`](docs/phase3-task3.3-mission.md)**: Current development mission
- **[`phase3-task3.3-subtasks.md`](docs/phase3-task3.3-subtasks.md)**: Development subtask breakdown
- **[`timer-alternatives.md`](docs/timer-alternatives.md)**: Timer implementation alternatives

**🚀 Future Development Plans:**
- **Central Loading State System**: Implement comprehensive loading state management in MainContent component for consistent loading UX across all pages
- **Modal Error Dialog System**: Create centralized modal error handling system (complementing existing non-modal Messages system) for critical errors requiring user attention
- **Enhanced MainContent Features**: Expand MainContent capabilities with loading overlays, skeleton screens, and contextual error states

**🔍 Testing & Quality:**
- **[`error-message-tests.md`](docs/error-message-tests.md)**: Error handling test patterns
- **[`error-messages.md`](docs/error-messages.md)**: Error message system documentation
- **[`browser-warning-fixes.md`](docs/browser-warning-fixes.md)**: Browser compatibility fixes

**📈 Visual Documentation:**
- **[`docs/diagrams/README.md`](docs/diagrams/README.md)**: Architecture diagrams and visual documentation

### Quick Reference Links
- **Core Files**: [`src/app.ts`](src/app.ts) • [`src/contexts/LayoutContextImpl.ts`](src/contexts/LayoutContextImpl.ts) • [`src/components/Layout.ts`](src/components/Layout.ts)
- **Testing**: [`tests/`](tests/) directory for component tests
- **Styles**: [`src/assets/styles/`](src/assets/styles/) for SCSS stylesheets
- **Services**: [`src/services/`](src/services/) for business logic services

> **📋 Note**: This documentation index is maintained to provide quick access to all architectural and implementation documentation. When adding new documentation, update this index accordingly.
