# Router Architecture

## Overview
Wouter-based router implementation for Opinion Frontend UI, focusing on account-scoped routing with entity-based subrouters.

## Core Components

### 1. RouterService
Central service managing navigation and route handling.
```typescript
interface RouterService {
  navigate(path: string): void;
  getCurrentPath(): string;
  matchPath(pattern: string, path: string): boolean;
  // Additional methods...
}
```

### 2. Entity Routers
Specialized routers for different entities, mountable at various paths.

#### SurveysRouter
- Base path: `/surveys`
- Routes:
  - `/` → Survey List
  - `/:survey_id` → Survey Detail
  - `/:survey_id/collectors/*` → Nested CollectorsRouter
  - `/:survey_id/reports/*` → Nested ReportsRouter

#### CollectorsRouter
- Mountable at:
  - `/collectors`
  - `/surveys/:survey_id/collectors`
- Routes:
  - `/` → Collector List
  - `/:collector_id` → Collector Detail
  - `/:collector_id/reports/*` → Nested ReportsRouter

#### ReportsRouter
- Mountable at multiple paths:
  - `/reports`
  - `/surveys/:survey_id/reports`
  - `/collectors/:collector_id/reports`
- Routes:
  - `/` → Report List
  - `/:report_id` → Report Detail

### 3. Account Context
Base routing context for authenticated sections:
- Base path: `/account/:account_id`
- All authenticated routes are nested under this path
- Provides account context to child routes

## Integration Points

### 1. LayoutContext Integration
```typescript
// Router registration
layoutContext.registerService('router', routerService);

// Event system integration
interface RouterEvents {
  'router:navigationStart': { from: string; to: string; }
  'router:navigationEnd': { path: string; }
  'router:error': { error: Error; }
}
```

### 2. Data Loading
- Entity services handle data loading
- Router coordinates navigation timing
- Services use DataLoader pattern for caching

## Route Structure

```
/account/:account_id/                    # Account root (effective app root)
├── surveys/                            # SurveysRouter base
│   ├── :survey_id/                     # Survey detail
│   ├── :survey_id/collectors/         # Nested CollectorsRouter
│   │   ├── :collector_id/            
│   │   └── :collector_id/reports/    # Nested ReportsRouter
│   └── :survey_id/reports/           # Nested ReportsRouter
├── collectors/                        # Root CollectorsRouter
└── reports/                          # Root ReportsRouter
```

## Design Decisions

### 1. Wouter Over React Router
- Lightweight (2.1KB vs 18.7KB)
- Simple API surface
- Direct control over routing behavior
- Better integration with micro-kernel architecture

### 2. Entity Router Pattern
- Reusable route configurations
- Consistent URL structure
- Type-safe parameter handling
- Flexible mounting points

### 3. Service-Based Approach
- Follows existing micro-kernel pattern
- Centralized navigation control
- Clean integration with EventBus
- Easy to extend and modify

## Performance Considerations

### 1. Route Matching
- Linear matching time O(n)
- Cached matcher instances
- Minimal regex usage

### 2. Data Loading
- Entity-based data loaders
- Route-level data prefetching
- Cache invalidation on navigation

## Error Handling

### 1. Navigation Errors
- Event-based error reporting
- Fallback routes
- Error boundary integration

### 2. Data Loading Errors
- Service-level error handling
- Loading state management
- Retry mechanisms

## Testing Strategy

### 1. Unit Tests
- Router service methods
- Path matching
- Parameter extraction
- Guard behavior

### 2. Integration Tests
- Navigation flows
- Data loading
- Error scenarios
- Event emission

### 3. Component Tests
- Route mounting
- Navigation handling
- Loading states