# Test Reorganization Plan

## Current Issues
- Tests are scattered across multiple directories
- Some test files mix multiple concerns
- Naming conventions are inconsistent
- Integration tests mixed with unit tests
- Some core functionality lacks test coverage

## New Structure

### Core Components (/tests/components/app)
- [Move] app.test.ts → App.test.ts
- [Move] AppHeader.LayoutContext.test.ts → AppHeader.test.ts
- [Move] AppFooter.test.ts → AppFooter.test.ts
- [New] AppNavigation.test.ts (navigation-specific tests)

### Sidebar (/tests/components/sidebar)
- [Merge] SidebarMenu.test.ts + SidebarCompactMode.test.ts → SidebarComponent.test.ts
- [New] SidebarNavigation.test.ts (split navigation tests)
- [New] SidebarMobile.test.ts (split mobile behavior tests)

### Breadcrumbs (/tests/components/breadcrumbs)
- [Move] PageContext.Breadcrumbs.test.ts → BreadcrumbsComponent.test.ts
- [Move] HierarchicalBreadcrumbsManager.AsyncSafety.test.ts → BreadcrumbsManager.test.ts
- [Move] DebugPage.Breadcrumbs.test.ts → BreadcrumbsIntegration.test.ts

### Page Components (/tests/components/page)
- [Move] PageComponent.test.ts → PageComponent.test.ts
- [Split] Create PageContext.test.ts from PageComponent.test.ts
- [Move] Relevant parts of DebugPage.Breadcrumbs.test.ts → DebugPage.test.ts

### Event System (/tests/lib/events)
- [Move] lib/EventBus.test.ts → EventBus.test.ts
- [Move] lib/globalEventBus.test.ts → EventBusGlobal.test.ts
- [Move] eventbus/EventBusIntegration.test.ts → EventBusIntegration.test.ts

### Core System (/tests/core)
- [Move] ComponentReference.test.ts → ComponentReference.test.ts
- [Move] ComponentReference.AppHeaderScenario.test.ts → ComponentIntegration.test.ts
- [New] ComponentLifecycle.test.ts

### Services (/tests/services)
- [Keep] BaseService.test.ts
- [Keep] ServiceRegistry.test.ts
- [New] ServiceIntegration.test.ts

### Hotkeys System (/src/hotkeys/tests)
- [Keep] ChainHotkeySystem.test.ts
- [Keep] EscKeyConflictResolution.test.ts
- [New] HotkeyManager.test.ts
- [New] HotkeyProviders.test.ts

## Implementation Steps

1. Create new directory structure
2. Move existing files to new locations
3. Split large test files into focused units
4. Create new test files for missing coverage
5. Update imports in all affected files
6. Update test configuration if needed
7. Run tests after each move to ensure nothing breaks
8. Clean up old directories

## Test Coverage Goals

Each test file should:
- Have clear describe blocks for each major feature
- Separate unit tests from integration tests
- Use consistent naming conventions
- Have proper setup and teardown
- Mock external dependencies appropriately
- Test error cases and edge conditions
- Include performance tests where relevant

## Next Steps

1. Review plan with team
2. Create script to automate file moves
3. Implement changes incrementally
4. Update CI/CD configuration if needed
5. Document new test organization