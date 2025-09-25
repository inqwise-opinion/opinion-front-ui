# Router Architecture

## Overview
Router architecture for Opinion Frontend UI, providing hierarchical routing with entity-based organization and account-level context.

## Architectural Principles

1. **Native Wouter Usage**
   - Use Wouter's native capabilities whenever possible
   - Avoid React Router dependencies unless Wouter natively supports the pattern
   - Any non-native pattern requires discussion before implementation

2. **No Backward Compatibility**
   - New router implementation doesn't require backward compatibility
   - Changes to PageComponent or LayoutContext need discussion first
   - Focus on clean, forward-looking implementation

3. **Account-Centric Routing**

Default behavior:
- All routes require authentication by default
- Current account managed by SessionAuthService
- No need to specify account ID in routes

Public exceptions:
```typescript
const PUBLIC_ROUTES = [
  '/login',
  '/assets/*',     // Static assets
  '/favicon.ico',  // Browser resources
  // Add other public paths as needed
];
```

Route structure:
```
/login                    # Public authentication
/assets/*                 # Public resources
/account/settings         # Account-specific pages
/surveys/**              # Entity routes (authenticated)
/collectors/**           # Entity routes (authenticated)
```

Key points:
- Authentication handled automatically via SessionAuthService
- Public routes explicitly defined as exceptions
- New pages follow existing page architecture
- Account context available to all authenticated routes

## Architecture Components

### 1. Router Hierarchy Using Wouter

```typescript
// Router context manages shared routing state
interface RouterContext {
  getRootPath(): string;
  getFullPath(): string;
  getRouteParams(): Record<string, string>;
  // Additional routing state management
}

// Core navigation service
interface RouterService {
  navigate(path: string): void;
  getCurrentPath(): string;
}

// Base entity router implementation
abstract class EntityRouter implements RouterService {
  constructor(protected routerContext: RouterContext) {}

  abstract get(path: string, component: typeof PageComponent): void;
  
  // Optional lifecycle hooks can be implemented by specific routers
  protected registerRoutes(): void {}
}

// All entity routers are services registered in LayoutContext
class SurveysRouter extends EntityRouter implements Service {
  public static readonly SERVICE_ID = 'surveys.router';
  
  // Service registration handled by LayoutContext
  async init(): Promise<void> {
    this.registerRoutes();
  }
}

// Main application router using Wouter's Router component
interface MainRouter extends RouterService {
  get(path: string, component: typeof PageComponent): void;
}

// Example implementation using Wouter
class MainRouterImpl implements MainRouter {
  get(path: string, component: typeof PageComponent) {
    return (
      <Route path={path}>
        {(params) => (
          <component {...params} />
        )}
      </Route>
    );
  }
}

// Entity router with nested routes
class SurveysRouter {
  render() {
    return (
      <Route path="/surveys">
        {(params) => (
          <>
            <Route path="/surveys" component={SurveyListPage} />
            <Route path="/surveys/:survey_id">
              {(surveyParams) => (
                <>
                  <Route path="/surveys/:survey_id" component={SurveyDetailPage} />
                  <CollectorsRouter basePath={`/surveys/${surveyParams.survey_id}/collectors`} />
                </>
              )}
            </Route>
          </>
        )}
      </Route>
    );
  }
}
```

Key points:
- RouterContext centralizes all routing state management
- EntityRouters are proper services in LayoutContext
- Entity routers can optionally implement lifecycle hooks
- All path and parameter management handled by RouterContext
- Clean separation between routing logic and component rendering

Important Implementation Note:
- EntityRouter constructor dependency on RouterContext creates circular dependency with Service pattern
- This needs to be resolved using either:
  - Setter injection after service initialization
  - Service factory pattern
  - Or RouterContext as a service
- Specific solution to be decided during implementation phase
```

### 2. Entity Routers
```typescript
interface EntityRouter {
  mount(basePath: string): void;
  unmount(): void;
  getBasePath(): string;
}

// Reusable across different contexts
class ReportsRouter implements EntityRouter {
  // Can be mounted at:
  // - /account/:id/surveys/:survey_id/reports/*
  // - /account/:id/surveys/:survey_id/collectors/:collector_id/reports/*
}
```

### 3. Integration Points

#### LayoutContext Integration
```typescript
class RouterService {
  constructor(private layoutContext: LayoutContext) {}
  
  // Service registration handled by LayoutContext promise mechanism
  // No specific registration order required
}
```

## Route Structure

```
/account/:account_id/                 # Account root (all authenticated routes)
├── surveys/                        # SurveysRouter mount point
│   ├── :survey_id/
│   ├── collectors/                # Nested CollectorsRouter
│   │   ├── :collector_id/
│   │   └── reports/              # Nested ReportsRouter
│   └── reports/                   # Mounted ReportsRouter
└── settings/                      # Account settings
```

## Implementation Guidelines

### 1. Core Development Rules
- Validate each core functionality before proceeding
- Compile and test each implementation phase
- Discuss before adapting existing components

### 2. Pattern Usage
- Start with Wouter native patterns
- Validate any React Router pattern compatibility
- Document pattern decisions

### 3. Authentication Integration
```typescript
// Auth integration through LayoutContext
class RouterService {
  private async validateRoute(path: string): Promise<boolean> {
    const auth = await this.layoutContext.getService<AuthService>('auth');
    return auth.isAuthenticated();
  }
}
```

## Validation Strategy

### Phase 1: Core Validation
1. Account context integration
2. Basic route matching
3. Path parameter handling

### Phase 2: Entity Router Validation
1. Mount/unmount functionality
2. Nested route handling
3. Router reusability

### Phase 3: Integration Validation
1. LayoutContext integration
2. Auth flow verification
3. Integration completeness verification

## Important Notes

### Architectural Modifications
- Any modifications to PageComponent require discussion
- Any modifications to LayoutContext require discussion
- Focus on clean implementation over compatibility

### Integration Requirements
- Router must work with existing auth flow
- Entity routers must support nested mounting
- Data loading remains responsibility of entity services

### Type Safety
```typescript
// Enforce type safety at router level
interface RouterParams<T extends Record<string, string>> {
  getParams(): T;
  validatePath(path: string): boolean;
}

// Entity-specific type safety
interface SurveyRouteParams {
  survey_id: string;
  collector_id?: string;
  report_id?: string;
}
```

## Testing Requirements

### 1. Core Router Tests
- Route matching
- Parameter extraction
- Navigation functionality

### 2. Entity Router Tests
- Mount/unmount behavior
- Nested routing
- Path composition

### 3. Integration Tests
- Auth flow
- Data loading verification
- Integration completeness
