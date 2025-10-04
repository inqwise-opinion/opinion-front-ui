# Tests Directory

This directory contains all test files for the Opinion Front UI project, organized by feature and component type.

## 📁 Directory Structure

### 🧪 **Core Component Tests**
- **`components/`** - UI component tests
  - `app/` - Application-level components (App, AppHeader, AppFooter)
  - `Layout.test.ts` - Main layout component tests
  - `MainContent.test.ts` - Main content area tests

### ⌨️ **System Tests**  
- **`hotkeys/`** - Hotkey system tests
  - `ChainHotkeySystem.test.ts` - Core hotkey chain functionality
  - `DuplicateRegistration.test.ts` - Duplicate registration handling
  - `EscKeyConflictResolution.test.ts` - ESC key conflict resolution

### 📝 **Logging Tests**
- **`logging/`** - Logging system tests
  - `Logger.test.ts` - Core logger functionality
  - `Logger.integration.test.ts` - Logger integration tests
  - `LoggerFactory.asyncAppender.test.ts` - Async logging appenders
  - `ChannelFactory.*.test.ts` - Logging channel tests

### 🔧 **Service Tests**
- **`services/`** - Service layer tests
  - `BaseService.test.ts` - Base service functionality
  - `ServiceRegistry.test.ts` - Service registration system
  - `navigation/` - Navigation service tests

### 🌐 **Router Tests**
- **`router/`** - Routing system tests
  - `RouterService.debug.test.ts` - Router service debugging
  - `SurveysRouter.debug.test.ts` - Surveys router debugging

### 🔌 **Adapter Tests**
- **`adapters/`** - Adapter pattern tests
  - `MessagesLogAdapter.test.ts` - Message logging adapter

### 🚌 **Event System Tests**
- **`eventbus/`** - Event communication tests
  - `EventBusIntegration.test.ts` - EventBus integration
- **`lib/`** - Core library tests
  - `EventBus.test.ts` - EventBus core functionality
  - `globalEventBus.test.ts` - Global event bus

### 🏗️ **Context Tests**
- **`contexts/`** - Context system tests
  - `HierarchicalBreadcrumbsManager.AsyncSafety.test.ts` - Breadcrumbs context

### 🔗 **Integration Tests**
- **`integration/`** - Full system integration tests
  - `layout-integration.ts` - Layout system integration helpers
  - `hotkey-conflict-test.ts` - Hotkey conflict integration

### 🧩 **Component Reference Tests**
- `ComponentReference.test.ts` - Component reference system
- `ComponentReference.AppHeaderScenario.test.ts` - App header scenarios
- `PageComponent.test.ts` - Base page component functionality

## 🏃‍♂️ **Running Tests**

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm test:watch

# Run specific test file
npm test ComponentReference.test.ts

# Run tests by pattern
npm test -- --testPathPattern="hotkeys"

# Run tests with coverage
npm test -- --coverage
```

## 🎯 **Test Organization Principles**

1. **Feature-based grouping** - Tests are organized by the feature they test
2. **Consistent naming** - All test files end with `.test.ts`
3. **Import path consistency** - All imports use relative paths to `../../src/`
4. **Shared utilities** - Common test utilities in `setup.ts` and `test-utils.ts`

## 🔧 **Test Configuration**

- **Framework**: Jest with ts-jest preset
- **Environment**: JSDOM for DOM testing
- **Setup**: `setup.ts` configures global test environment
- **Coverage**: Collected from `src/**/*.ts` files
- **Module mapping**: `@/` alias maps to `src/` directory

## 📈 **Coverage Goals**

The test suite maintains high coverage across:
- 🎯 **Core functionality** - 95%+ coverage
- 🧩 **Component logic** - 90%+ coverage  
- 🔧 **Service layer** - 85%+ coverage
- 🌐 **Integration paths** - 80%+ coverage

## 🚀 **Adding New Tests**

When adding tests:

1. **Place in appropriate subdirectory** based on what you're testing
2. **Use descriptive filenames** ending in `.test.ts`
3. **Import from `../../src/`** using consistent relative paths
4. **Follow existing test patterns** for consistency
5. **Add to this README** if creating new test categories