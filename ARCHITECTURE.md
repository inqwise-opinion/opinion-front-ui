# Opinion Front UI - Architecture Documentation

## 1. Component Hierarchy & Responsibility Scope

```
OpinionApp (src/app.ts) 🎯 MAIN CONTROLLER
├── LayoutContext (src/contexts/LayoutContext.ts) 🌐 GLOBAL STATE
├── MockApiService (src/services/MockApiService.ts) 📊 DATA LAYER
├── Layout (src/components/Layout.ts) 🏗️ LAYOUT COORDINATOR
│   ├── AppHeader (src/components/AppHeader.ts) 📋 TOP BAR
│   │   ├── UserMenu (src/components/UserMenu.ts) 👤 USER ACTIONS
│   │   └── Sidebar (src/components/Sidebar.ts) 🔗 NAVIGATION
│   └── AppFooter (src/components/AppFooter.ts) 📄 BOTTOM BAR
├── MainContent (src/components/MainContent.ts) 📱 CONTENT CONTAINER
└── PageComponents 📄 DYNAMIC PAGES
    └── DebugPage (src/pages/DebugPage.ts) 🛠️ DEBUG TOOLS
```

### Component Responsibilities

#### 🎯 **OpinionApp** (Main Controller)
- **Scope**: Application lifecycle management
- **Responsibilities**:
  - Initialize all core components
  - Handle routing and page transitions
  - Coordinate global application state
  - Manage error handling and recovery
- **Dependencies**: Layout, MainContent, LayoutContext, MockApiService

#### 🌐 **LayoutContext** (Global State Manager)
- **Scope**: Cross-component communication and state management
- **Responsibilities**:
  - Manage responsive breakpoints and modes
  - Track sidebar dimensions and states
  - Provide event system for component coordination
  - Maintain layout state consistency
- **Pattern**: Singleton with event emitter

#### 🏗️ **Layout** (Layout Coordinator)
- **Scope**: Master page component coordination
- **Responsibilities**:
  - Initialize and coordinate Header, Footer components
  - Manage responsive layout behavior
  - Handle global CSS class management
  - Coordinate component positioning
- **Dependencies**: AppHeader, AppFooter, LayoutContext

#### 📋 **AppHeader** (Top Navigation Bar)
- **Scope**: Top application bar with navigation and user controls
- **Responsibilities**:
  - Display breadcrumbs and page title
  - Manage mobile menu toggle
  - Host UserMenu component
  - Initialize and coordinate with Sidebar
- **Dependencies**: UserMenu, Sidebar, LayoutContext

#### 🔧 **Sidebar** (Navigation Panel)
- **Scope**: Left navigation panel with menu items
- **Responsibilities**:
  - Render navigation menu items
  - Handle compact/expanded modes
  - Manage mobile overlay behavior
  - Provide navigation event handling
- **Dependencies**: LayoutContext

#### 👤 **UserMenu** (User Account Controls)
- **Scope**: User profile and account actions
- **Responsibilities**:
  - Display user information
  - Handle user menu interactions
  - Manage responsive display behavior
  - Provide logout/profile functionality
- **Dependencies**: None (standalone component)

#### 📱 **MainContent** (Content Container)
- **Scope**: Main content area for page components
- **Responsibilities**:
  - Manage semantic main element
  - Handle content updates from page components
  - Respond to layout context changes
  - Provide flexbox layout for page content
- **Dependencies**: LayoutContext

#### 📄 **AppFooter** (Bottom Bar)
- **Scope**: Bottom application bar with links and copyright
- **Responsibilities**:
  - Display copyright and navigation links
  - Handle footer link interactions
  - Respond to layout changes
  - Manage visibility based on layout mode
- **Dependencies**: LayoutContext

#### 📄 **PageComponents** (Dynamic Content)
- **Scope**: Individual page/view implementations
- **Responsibilities**:
  - Render page-specific content
  - Handle page-specific interactions
  - Integrate with MainContent for display
  - Manage page lifecycle
- **Example**: DebugPage

---

## 2. Initialization Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Main as main.ts
    participant App as OpinionApp
    participant LC as LayoutContext
    participant Layout as Layout
    participant Header as AppHeader
    participant Sidebar as Sidebar
    participant UserMenu as UserMenu
    participant Footer as AppFooter
    participant MainContent as MainContent
    participant Page as PageComponent

    Browser->>Main: DOM Ready
    Main->>Main: waitForResourcesAndInit()
    Main->>App: new OpinionApp()
    App->>LC: getInstance()
    LC->>LC: Initialize responsive mode
    
    Main->>App: app.init()
    App->>App: setupEventListeners()
    App->>App: loadInitialData()
    
    App->>Layout: new Layout()
    App->>Layout: layout.init()
    
    Layout->>Header: new AppHeader()
    Layout->>Header: header.init()
    
    Header->>Header: createHeader() [async]
    Header->>Header: Find #app-header element
    Header->>Header: populateContent()
    
    Header->>UserMenu: new UserMenu()
    Header->>UserMenu: userMenu.init()
    UserMenu->>UserMenu: Setup responsive behavior
    
    Header->>Sidebar: new Sidebar()
    Header->>Sidebar: sidebar.init()
    
    Sidebar->>Sidebar: createSidebar() [with retry]
    Sidebar->>Sidebar: Find #app-sidebar element
    Sidebar->>Sidebar: populateContent()
    Sidebar->>LC: Subscribe to responsive-mode-change
    Sidebar->>LC: updateSidebarDimensions()
    
    Layout->>Footer: new AppFooter()
    Layout->>Footer: footer.init()
    Footer->>Footer: createFooter() [async]
    Footer->>Footer: Find #app-footer element
    Footer->>Footer: populateContent()
    
    Layout->>LC: Subscribe to layout events
    Layout->>LC: markReady()
    
    App->>MainContent: new MainContent()
    App->>MainContent: mainContent.init()
    MainContent->>MainContent: Find #app-main element
    MainContent->>LC: Subscribe to sidebar-dimensions-change
    
    App->>App: initializeRouting()
    App->>Page: Create page component
    App->>Page: page.init()
    Page->>MainContent: updateContent()
    
    App->>App: Ready! ✅
```

### Initialization Phases

#### **Phase 1: Bootstrap** (main.ts)
1. Wait for DOM ready state
2. Check for stylesheets loaded
3. Create OpinionApp instance
4. Initialize LayoutContext singleton

#### **Phase 2: Core Layout** (Layout.ts)
1. Initialize Layout coordinator
2. Create and initialize AppHeader (async)
3. Create and initialize AppFooter (async)
4. Setup responsive behavior subscriptions
5. Mark layout as ready

#### **Phase 3: Component Tree** (AppHeader.ts)
1. Create header with retry mechanism
2. Initialize UserMenu component
3. Initialize Sidebar component
4. Setup event listeners and coordination
5. Subscribe to LayoutContext events

#### **Phase 4: Content Management** (MainContent.ts)
1. Initialize MainContent container
2. Subscribe to layout context changes
3. Setup content management system
4. Ready for page component integration

#### **Phase 5: Page Routing** (OpinionApp.ts)
1. Initialize routing system
2. Create appropriate page component
3. Inject page content into MainContent
4. Setup page-specific behavior

---

## 3. Event System & Communication Map

```mermaid
graph TD
    LC[LayoutContext 🌐]
    
    %% Event Sources
    LC --> |responsive-mode-change| Sidebar
    LC --> |responsive-mode-change| Layout
    LC --> |responsive-mode-change| DebugPage
    
    LC --> |sidebar-dimensions-change| Layout
    LC --> |sidebar-dimensions-change| MainContent
    
    LC --> |layout-mode-change| Layout
    LC --> |layout-mode-change| DebugPage
    
    LC --> |layout-ready| Layout
    
    %% Event Emitters
    Sidebar --> |updateSidebarDimensions| LC
    Window --> |resize| LC
    
    %% DOM Events
    Sidebar --> |click: .compact-toggle-btn| Sidebar
    Sidebar --> |click: .mobile-close-btn| Sidebar
    Sidebar --> |click: nav-link| Sidebar
    
    Header --> |click: #mobile_menu_toggle| Header
    UserMenu --> |click: .user-menu-trigger| UserMenu
    
    %% Custom Events
    Header --> |header-layout-updated| Document
    Footer --> |footer-layout-updated| Document
    Layout --> |layout-mode-updated| Document
```

### Event Categories

#### 🌐 **LayoutContext Events** (Global State Changes)

| Event Name | Emitter | Listeners | Data | Purpose |
|------------|---------|-----------|------|---------|
| `responsive-mode-change` | LayoutContext | Sidebar, Layout, DebugPage | `{type, isMobile, isTablet, isDesktop, viewport, breakpoints}` | Notify components of viewport changes |
| `sidebar-dimensions-change` | LayoutContext | Layout, MainContent | `{width, rightBorder, isCompact, isMobile, isVisible}` | Update layout based on sidebar changes |
| `layout-mode-change` | LayoutContext | Layout, DebugPage | `{type, isCompact, isMobile, isTablet, isDesktop}` | Handle layout mode transitions |
| `layout-ready` | LayoutContext | Layout | `{sidebar, viewport}` | Signal complete initialization |

#### 🖱️ **DOM Events** (User Interactions)

| Event Target | Event Type | Handler | Purpose |
|--------------|------------|---------|---------|
| `.compact-toggle-btn` | `click` | Sidebar | Toggle sidebar compact mode |
| `.mobile-close-btn` | `click` | Sidebar | Close mobile sidebar overlay |
| `.nav-link` | `click` | Sidebar | Navigate to different pages |
| `#mobile_menu_toggle` | `click` | AppHeader | Open mobile sidebar |
| `.user-menu-trigger` | `click` | UserMenu | Toggle user menu dropdown |
| `window` | `resize` | LayoutContext | Update responsive mode |

#### 📡 **Custom Events** (Component Communication)

| Event Name | Emitter | Target | Data | Purpose |
|------------|---------|--------|------|---------|
| `header-layout-updated` | AppHeader | Document | `{dimensions, headerElement}` | Notify of header layout changes |
| `footer-layout-updated` | AppFooter | Document | `{dimensions, footerElement}` | Notify of footer layout changes |
| `layout-mode-updated` | Layout | Document | `{layoutMode, components}` | Broadcast layout mode changes |

### Communication Patterns

#### **1. Centralized State Management**
- LayoutContext acts as single source of truth
- Components subscribe to relevant state changes
- Unidirectional data flow from LayoutContext to components

#### **2. Event-Driven Architecture**
- Loose coupling between components
- Pub/Sub pattern for cross-component communication
- Components can react to changes without direct dependencies

#### **3. Hierarchical Command Flow**
- Parent components initialize and manage child components
- Commands flow down the hierarchy
- Events bubble up through the event system

#### **4. Responsive Coordination**
- LayoutContext monitors viewport changes
- Automatically updates all subscribed components
- Ensures consistent responsive behavior across the application

---

## Key Architectural Benefits

### 🔄 **Reactive Architecture**
- Components automatically update when dependencies change
- No manual coordination needed between layout components
- Responsive behavior happens automatically

### 🧩 **Modular Design**
- Each component has clear, focused responsibilities
- Components can be developed and tested independently
- Easy to extend with new components or pages

### 🎯 **Centralized State**
- Single source of truth for layout state
- Consistent behavior across all components
- Easy to debug and reason about

### 🔧 **Robust Initialization**
- Async initialization with retry mechanisms
- Graceful error handling and recovery
- Components can initialize independently

### 📱 **Mobile-First Responsive**
- Comprehensive responsive breakpoint system
- Mobile overlay patterns for navigation
- Automatic adaptation to different screen sizes

This architecture provides a solid foundation for a scalable, maintainable frontend application with clean separation of concerns and robust state management.
