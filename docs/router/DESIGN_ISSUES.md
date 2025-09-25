# Router Design and Implementation Issues Summary

## Design Pattern Corrections

### 1. React Router Pattern Overuse
**Issue**: Initial implementations drifted towards React Router patterns instead of using Wouter's native approaches.
```typescript
// React Router-style patterns (INCORRECT)
const AuthGuard: React.FC<AuthGuardProps> = ({ permission, children }) => {
  // React Router specific guards and redirects
};

// Should focus on Wouter's simpler patterns instead
```
**Impact**: Could lead to unnecessary complexity and overhead
**Resolution**: Keep Wouter's native patterns while validating any React Router patterns we want to adopt

### 2. Account Context Oversight
**Issue**: Initially missed that account-level is the effective root after authentication
```typescript
// Initial incorrect routing structure
/surveys/:survey_id/*
/collectors/*

// Corrected structure
/account/:account_id/surveys/:survey_id/*
/account/:account_id/collectors/*
```
**Impact**: Would have led to incorrect route hierarchy and auth handling
**Resolution**: All authenticated routes now properly nested under account context

### 3. Router Implementation Approach
**Issue**: Original approach mixed routing and data loading concerns
```typescript
// Initial incorrect mixing of concerns
class RouterService {
  async loadData(route: string): Promise<any> {
    // Mixing routing and data loading
  }
}

// Corrected separation of concerns
class RouterService {
  navigate(path: string): void {
    // Pure routing concerns
  }
}
```
**Impact**: Would have violated single responsibility principle
**Resolution**: Separated data loading to dedicated entity services

## Implementation Mistakes

### 1. Granular Router Pattern
**Issue**: First implementation of entity routers was too coupled
```typescript
// Initial incorrect implementation
class SurveysRouter {
  private reportsRouter: ReportsRouter;
  // Tightly coupled to specific routes
}

// Corrected modular approach
interface EntityRouter {
  mount(basePath: string): void;
  unmount(): void;
}
```
**Impact**: Would have made reuse of routers in different contexts difficult
**Resolution**: Created modular entity router pattern that can be mounted at different paths

### 2. Route Definition
**Issue**: Initial route definition didn't account for nested entity routing
```typescript
// Initial incorrect approach
registerRoute('/surveys/:id/collectors', CollectorsComponent);

// Corrected modular approach
collectorsRouter.mount(`/surveys/${surveyId}/collectors`);
reportsRouter.mount(`/surveys/${surveyId}/collectors/${collectorId}/reports`);
```
**Impact**: Would have made it difficult to reuse route components
**Resolution**: Implemented mountable entity routers

## Key Learnings

1. **Pattern Usage**:
   - Don't automatically avoid React Router patterns
   - Validate patterns work with Wouter before implementation
   - Test core functionality early

2. **Implementation Approach**:
   - Start with core router validation
   - Test each component in isolation
   - Verify assumptions before building on them

3. **Route Structure**:
   - Account context is fundamental
   - Entity routers must be truly modular
   - Keep routing separate from data loading

## Risk Areas for Implementation

1. **Type Safety**:
   - Ensure proper type inference for route parameters
   - Validate type safety across nested routes
   - Monitor TypeScript integration with Wouter

2. **Integration Points**:
   - LayoutContext integration needs careful testing
   - Event system coordination must be verified
   - Service registration pattern must be validated

3. **Performance**:
   - Monitor route matching performance
   - Watch for unnecessary re-renders
   - Validate caching strategy effectiveness

## Validation Requirements

For each implementation phase:
1. Compile and test before proceeding
2. Verify core functionality works as expected
3. Be prepared to refactor if base assumptions prove incorrect
4. Get approval before moving to next phase

## Next Steps

1. Create detailed test plan for Phase 1.1
2. Set up proper test environment
3. Implement basic router structure
4. Validate core assumptions