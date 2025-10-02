# Navigation Menu Architecture

Goal: Provide a centralized, minimal navigation coordination layer that complements the existing SidebarComponent and preserves its current behavior and DOM-driven interactions.

Principles
- Backward-compatible with SidebarComponent and NavigationItem shape
- SidebarComponent remains the rendering and DOM interaction authority
- Navigation coordination is event-driven via LayoutContext and existing systems
- No router coupling; concerns limited to menu structure, active/expanded state, and visibility

Scope
- In: navigation item structure, active/expanded state management, sidebar compact/mobile visibility coordination, event signaling
- Out: routing, business logic, visual rendering, data fetching

Core Roles
- NavigationService (coordination)
  - Maintains a canonical in-memory model of the menu structure consistent with NavigationItem as used by SidebarComponent
  - Issues updates (full or partial) to SidebarComponent when structure or state changes
  - Tracks and updates active item id and expanded states without altering SidebarComponent’s internal DOM semantics
  - Publishes concise navigation events for other consumers without breaking current flows
- SidebarComponent (rendering and interaction)
  - Sole authority for DOM rendering, ARIA attributes, and click handling
  - Interprets structure/state delivered by NavigationService
  - Emits layout-related signals (compact mode, mobile menu) through LayoutContext
- LayoutContext (system backbone)
  - Transport for sidebar compact/mobile events already used by SidebarComponent
  - Distribution channel for navigation lifecycle signals

Data Model
- NavigationItem is the canonical item shape (unchanged)
- Optional logical “groups” may exist internally in NavigationService but are flattened to the exact list structure expected by SidebarComponent
- Active item is tracked by stable item id; expanded states tracked per expandable id

State Ownership and Sync
- Source of truth for menu structure and active/expanded state: NavigationService
- Source of truth for visual state (classes, aria, DOM): SidebarComponent
- Synchronization is push-based: NavigationService updates SidebarComponent with a new structure/state snapshot when changes occur
- SidebarComponent may locally reflect transient visual changes; NavigationService subsequently reconciles to maintain consistency

Event Model (via existing systems)
- Navigation lifecycle (proposed, non-breaking):
  - navigation:structure-updated (structure/state snapshot propagated)
  - navigation:item-activated (active id changed)
  - navigation:state-changed (aggregate notification for consumers)
- Sidebar/Layout events (existing, preserved):
  - sidebar-compact-mode-change
  - mobile-menu-mode-change
  - layout-mode-change

Interactions and Flows
- Initialization
  - NavigationService loads/derives initial structure and active item
  - NavigationService pushes initial snapshot to SidebarComponent
- User interaction (click, expand/collapse)
  - SidebarComponent handles the DOM event
  - NavigationService is informed of the resulting logical state change (active/expanded)
  - NavigationService reconciles and re-issues structure/state snapshot if needed
- Responsive behavior
  - SidebarComponent drives visibility (mobile overlay) and compact mode based on LayoutContext
  - NavigationService does not override visual state; it only coordinates logical menu state

Integration Boundaries
- With Router: optional, indirect (not required). If present, activation updates may be mirrored to selected path; otherwise, NavigationService operates independently
- With Authentication/Permissions: optional filter of items before snapshot; SidebarComponent receives already-filtered items

Non-Functional
- Minimal surface: limited API between NavigationService and SidebarComponent
- Deterministic updates: snapshots represent complete truth for the sidebar structure/state
- Testability: NavigationService can be tested in isolation from the DOM; SidebarComponent remains DOM-focused

Outcome
- The SidebarComponent continues to function unchanged in DOM responsibilities
- A small, centralized NavigationService coordinates structure and logical state, emits lightweight events, and integrates cleanly with existing LayoutContext-driven behavior
- No disruption to current mobile/compact mechanics or click handling semantics within SidebarComponent
