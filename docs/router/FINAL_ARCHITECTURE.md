# Router Final Architecture Decisions

## Core Architecture Shifts

### 1. Entity Router Pattern Evolution
**Initial Design**: Simple wrapper around Wouter routes
**Final Design**: Reusable entity routers that can be mounted at different paths
```typescript
interface EntityRouter {
  mount(basePath: string): void;
  unmount(): void;
  getBasePath(): string;
}
```

### 2. Route Hierarchy Refinement
**Initial Structure**:
```
/surveys/:survey_id/*
/collectors/*
```

**Final Structure**:
```
/account/:account_id/               # Root context
├── surveys/
│   ├── :survey_id/
│   ├── collectors/                # Mounted CollectorsRouter
│   │   ├── :collector_id/
│   │   └── reports/              # Mounted ReportsRouter
│   └── reports/                   # Mounted ReportsRouter
└── settings/
```

### 3. Data Loading Pattern
**Initial Approach**: Mixed with router service
**Final Approach**: Separated to entity services
```typescript
interface DataLoader<T> {
  load(id: string): Promise<T>;
  reload(): Promise<void>;
  getCached(): T | null;
}
```

## Key Architectural Decisions

### 1. Router Service Design
```typescript
interface RouterService {
  // Core Navigation
  navigate(path: string): void;
  getCurrentPath(): string;
  getRouteParams(): Record<string, string>;
  
  // Route Registration
  registerRoute(path: string, component: typeof PageComponent): void;
  getRegisteredRoutes(): Array<RouteDefinition>;
}
```

### 2. Entity Router Pattern
- Each entity (Surveys, Collectors, Reports) has its own router
- Routers can be mounted at different paths
- Same router instance can be reused in different contexts
- Type-safe parameter handling

### 3. Integration Points
1. **LayoutContext**:
   - Router registered as a core service
   - Provides access to navigation and routing state
   - Manages router lifecycle

2. **EventBus**:
```typescript
type RouterEvents = {
  'router:navigationStart': { from: string; to: string; }
  'router:navigationEnd': { path: string; }
  'router:error': { error: Error; }
}
```

3. **Account Context**:
   - All routes under account context
   - Account ID available to all child routes
   - Type-safe account context access

## Implementation Strategy

### Phase 1: Core Router Validation
1. Basic Wouter setup with account context
2. RouterService foundation
3. Single entity router proof of concept

### Phase 2: Extended Features
1. Auth integration
2. Additional entity routers
3. Loading states

## Design Changes During Discussion

1. **Account Context**:
   - Added as root context for all authenticated routes
   - All entity routers mounted under account path
   - Provides account-level type safety

2. **Entity Router Pattern**:
   - Evolved to be more modular and reusable
   - Support for mounting at different paths
   - Clean unmounting support added

3. **Data Loading**:
   - Moved from router to specialized services
   - Added caching mechanism
   - Parallel loading support

4. **Route Registration**:
   - Changed from static to dynamic mounting
   - Added support for route unregistration
   - Type-safe route registration

## Testing Requirements

### 1. Core Functionality
- Route matching and parameter extraction
- Account context propagation
- Navigation with type safety

### 2. Entity Routers
- Mount/unmount behavior
- Nested route handling
- Path composition

### 3. Integration
- LayoutContext integration
- Event system coordination
- Error handling

## Risk Areas

1. **Type Safety**
   - Parameter inference across nested routes
   - Context type propagation
   - Route definition type checking

2. **Performance**
   - Route matching efficiency
   - Mount/unmount overhead
   - Event handling impact

3. **Integration**
   - Service registration timing
   - Event coordination
   - Error boundary integration