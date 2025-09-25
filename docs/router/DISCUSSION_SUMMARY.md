# Router Design Discussion Summary

## Project Context
- **Project**: Opinion Frontend UI
- **Base Architecture**: Micro-kernel with LayoutContext as core
- **Architectural Pattern**: Service-oriented with event-driven communication
- **Root Context**: Account-level is the effective root after authentication

## Design Evolution

### 1. Initial Requirements Gathering
- Need for nested/hierarchical routing
- Integration with LayoutContext and EventBus
- No backward compatibility required with servlet system
- Selected Wouter (v3.7.0) as routing library

### 2. Key Architecture Decisions

#### Router Service Approach
```typescript
interface RouterService {
  navigate(path: string): void;
  getCurrentPath(): string;
  getRouteParams(): Record<string, string>;
  registerRoute(path: string, component: typeof PageComponent): void;
}
```

#### Entity-Based Router Pattern
- Each entity (Surveys, Collectors, Reports) has dedicated router
- Routers can be mounted at different paths
- Example structure:
  ```
  /account/:account_id/
    └── surveys/
        ├── :survey_id/
        ├── collectors/
        │   ├── :collector_id/
        │   └── reports/
        └── reports/
  ```

#### Data Loading Strategy
- Data loading handled by specialized services, not router
- Each service maintains its own DataLoader with caching
- Router coordinates navigation timing
- Pre-loading data during route resolution

### 3. Implementation Strategy

#### Phase 1: Core Router Validation
1. **Basic Wouter Setup** [Validation Point 1]
   - Account context integration
   - Route matching verification
   - Parameter handling

2. **RouterService Foundation** [Validation Point 2]
   - Service initialization
   - Event system integration
   - Route registration

3. **Single Entity Router** [Validation Point 3]
   - Proof of concept with SurveysRouter
   - Nested routing verification
   - Parameter handling

#### Phase 2: Extended Features
(To be detailed after Phase 1 validation)
- Auth Integration
- Additional Entity Routers
- Loading States

### 4. Technical Specifications

#### Account Context
```typescript
interface AccountContextType {
  accountId: string;
}

// Base routing context
const AccountRouter: FC<{ accountId: string }> = ({ accountId, children }) => {
  const base = `/account/${accountId}`;
  return (
    <Router base={base}>
      {children}
    </Router>
  );
};
```

#### Entity Router Pattern
```typescript
interface EntityRouter {
  mount(basePath: string): void;
  unmount(): void;
  getBasePath(): string;
}

class SurveysRouter implements EntityRouter {
  mount(basePath: string) {
    this.basePath = basePath;
    this.registerRoutes();
  }
}
```

#### Event System Integration
```typescript
type RouterEvents = {
  'router:navigationStart': { from: string; to: string; }
  'router:navigationEnd': { path: string; }
  'router:error': { error: Error; }
}
```

## Implementation Tasks

### Phase 1.1: Basic Setup
1. Install Wouter
2. Create router service structure
3. Implement account context
4. Write initial tests

### Phase 1.2: Core Service
1. Implement RouterService
2. Add event system integration
3. Setup route registration
4. Validate with tests

### Phase 1.3: Entity Router
1. Implement SurveysRouter
2. Add nested route support
3. Test routing hierarchy
4. Validate pattern

## Testing Strategy

### Unit Tests
- Router service methods
- Path matching
- Parameter extraction
- Event emission

### Integration Tests
- Route mounting
- Navigation flows
- Error handling
- Account context

### Validation Points
1. Account routing functionality
2. Service integration with LayoutContext
3. Entity router pattern effectiveness

## Implementation Notes

### Wouter Usage
- Using v3.7.0 (2.1KB size)
- Custom matcher support for account paths
- Type-safe parameter handling
- Base path configuration for account context

### Important Considerations
1. **Account Context**
   - All authenticated routes under `/account/:account_id`
   - Account context available to all child routes

2. **Router Service**
   - First-class service in architecture
   - Clean integration with EventBus
   - Type-safe route registration

3. **Entity Routers**
   - Self-contained and reusable
   - Consistent interface
   - Flexible mounting points

## Next Steps

1. Begin Phase 1.1 implementation
2. Validate core assumptions
3. Review and adjust based on findings
4. Plan Phase 2 details

## Open Questions
1. Specific error handling requirements
2. Loading state management preferences
3. Auth guard implementation details

## References
1. [Wouter GitHub Repository](https://github.com/molefrog/wouter)
2. [Wouter API Documentation](https://github.com/molefrog/wouter#api-reference)
