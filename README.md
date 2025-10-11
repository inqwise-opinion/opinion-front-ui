# Opinion Front UI

[![CI Pipeline](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/ci.yml)
[![CodeQL](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/codeql.yml/badge.svg)](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/codeql.yml)
[![Release](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/release.yml/badge.svg)](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/v/release/inqwise-opinion/opinion-front-ui?include_prereleases&sort=semver)](https://github.com/inqwise-opinion/opinion-front-ui/releases)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.3-646CFF.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A modern TypeScript front-end application** for the Opinion survey management platform, featuring a sophisticated **micro-kernel architecture** with **event-driven communication**, **reactive data binding**, and comprehensive **chain-based hotkey system**. Successfully migrated from a servlet-based Java system to a cutting-edge single-page application.

## 📊 Project Status

[![Build Status](https://img.shields.io/github/actions/workflow/status/inqwise-opinion/opinion-front-ui/ci.yml?branch=main&label=build)](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/ci.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-43%25-yellow)](https://github.com/inqwise-opinion/opinion-front-ui)
[![Dependencies](https://img.shields.io/librariesio/github/inqwise-opinion/opinion-front-ui?label=dependencies)](https://libraries.io/github/inqwise-opinion/opinion-front-ui)
[![Package Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen)](https://shields.io/category/dependencies)
[![Security](https://img.shields.io/github/actions/workflow/status/inqwise-opinion/opinion-front-ui/codeql.yml?branch=main&label=security)](https://github.com/inqwise-opinion/opinion-front-ui/security)
[![Known Vulnerabilities](https://snyk.io/test/github/inqwise-opinion/opinion-front-ui/badge.svg)](https://snyk.io/test/github/inqwise-opinion/opinion-front-ui)
[![Issues](https://img.shields.io/github/issues/inqwise-opinion/opinion-front-ui)](https://github.com/inqwise-opinion/opinion-front-ui/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/inqwise-opinion/opinion-front-ui)](https://github.com/inqwise-opinion/opinion-front-ui/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/inqwise-opinion/opinion-front-ui)](https://github.com/inqwise-opinion/opinion-front-ui/commits/main)
[![Stars](https://img.shields.io/github/stars/inqwise-opinion/opinion-front-ui)](https://github.com/inqwise-opinion/opinion-front-ui/stargazers)

## Project Overview

This project represents a **complete architectural migration** from a traditional servlet-based Java application to a modern TypeScript SPA. The application features a **micro-kernel architecture** with component-based design, **event-driven communication**, **reactive data binding**, **chain-based hotkey system**, and advanced layout management with comprehensive test coverage.

## Architecture

### Core Technologies
- **TypeScript**: Modern JavaScript with strict typing and ES2020 target
- **Vite**: Lightning-fast development server and build tool
- **SCSS + CSS**: Hybrid styling with CSS Grid + Flexbox layout system
- **Jest**: Comprehensive testing framework with JSDOM environment

### Design Patterns
- **Micro-kernel Architecture**: Central `LayoutContext` kernel with pluggable components and services
- **Event-Driven Communication**: Global EventBus with publish/subscribe/request patterns
- **Reactive Data Binding**: Observable pattern with validators and transformers
- **Chain-Based Hotkey System**: Priority-based hotkey handling with conflict resolution
- **Component Lifecycle Management**: Abstract `PageComponent` base class with init/destroy patterns
- **Service-Oriented Architecture**: Dependency injection with service registry
- **Hierarchical Breadcrumbs**: Scoped breadcrumb management with page-level control

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0 (as specified in package.json engines)
- **npm** >= 10.0.0
- Modern browser with CSS Grid and ES2020 support
- **Material Icons** font (loaded via Google Fonts)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues

**Note**: Development server runs on port 3000 with `SASS_SILENCE_DEPRECATIONS=legacy-js-api` to suppress SASS warnings.

## Current Status

**Development Phase**: Active development with core architecture complete

### ✅ Completed Features
- **Micro-Kernel Architecture**: LayoutContext as application kernel with service registry
- **Event-Driven Communication**: Comprehensive EventBus with publish/subscribe/request patterns
- **Reactive Data Binding**: Observable pattern with ComputedObservables, validators, and transformers
- **Chain-Based Hotkey System**: Priority-based hotkey handling with conflict resolution (ESC key chains)
- **Component Architecture**: Abstract `PageComponent` with lifecycle management and event handling
- **Service Architecture**: Dependency injection, service registration, and interface contracts
- **Layout System**: CSS Grid + Flexbox responsive design with breakpoint management
- **Hierarchical Breadcrumbs**: Page-scoped breadcrumb management with safe operations
- **Comprehensive Test Coverage**: 564 tests with 43% overall coverage, 97% config coverage, 93% utilities coverage
- **Global Layout Components**: Header, Sidebar, Footer with responsive coordination
- **Navigation Synchronization**: Active page tracking with automatic menu highlighting
- **Error Handling**: Global error boundary with user-friendly messages and recovery
- **Development Dashboard**: Enhanced dashboard with mock API integration and statistics

### 🚧 In Progress
- **Real API Integration**: Replace MockApiService with actual backend APIs
- **Survey Builder**: Advanced survey creation and editing interface
- **Data Visualization**: Enhanced charts and analytics for dashboard
- **Mobile Optimization**: Touch interactions and mobile-specific UX improvements

## Test Coverage

The project maintains comprehensive test coverage across all system components:

### Overall Coverage: **43%** (564 tests)

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

### Key Testing Achievements
- **🔥 Hotkey System**: 86% coverage with comprehensive chain execution tests
- **📡 Event System**: 90% coverage with EventBus integration tests
- **📊 Observables**: 87% coverage with reactive data binding tests
- **⚙️ Configuration**: 100% coverage with environment config tests
- **🛠️ Utilities**: 93% coverage with helper function tests
- **🏗️ Context System**: 66% coverage with LayoutContext integration tests

### Test Categories
- **Unit Tests**: Component lifecycle, service logic, utility functions
- **Integration Tests**: EventBus communication, hotkey chains, breadcrumb scoping
- **DOM Tests**: Component rendering, event handling, responsive behavior
- **Architecture Tests**: Service registration, dependency injection, error handling

## 📚 Comprehensive Documentation

### Core Documentation
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Complete developer guide with code examples and patterns
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed system architecture and component design
- **[STATUS_REPORT.md](STATUS_REPORT.md)** - Current project status and achievements
- **[WARP.md](WARP.md)** - AI agent guidance with MCP integration and development workflows

### System Architecture Documentation

#### **🏗️ Layout & UI Systems**
- **[layout-architecture.md](docs/layout-architecture.md)** - CSS Grid + Flexbox layout system design
- **[layout-mode-system.md](docs/layout-mode-system.md)** - Responsive breakpoint management
- **[component-hierarchy.md](docs/component-hierarchy.md)** - UI component organization and relationships
- **[layout-context-access-patterns.md](docs/layout-context-access-patterns.md)** - LayoutContext usage patterns

#### **📡 Event & Communication Systems**
- **[event-system.md](docs/event-system.md)** - EventBus architecture with publish/subscribe/request patterns
- **[eventbus-integration.md](docs/eventbus-integration.md)** - EventBus integration guidelines and best practices
- **[active-page-eventbus-system.md](docs/active-page-eventbus-system.md)** - Page-level event coordination

#### **⌨️ Hotkey & Input Management**
- **[hotkey-chain-architecture.md](docs/hotkey-chain-architecture.md)** - Priority-based chain execution system
- **[hotkey-system-components.md](docs/hotkey-system-components.md)** - Hotkey provider implementation details
- **[hotkey-system-migration.md](docs/hotkey-system-migration.md)** - Migration from legacy to chain-based system
- **[src/hotkeys/README.md](src/hotkeys/README.md)** - Implementation code documentation

#### **🍞 Navigation & Breadcrumbs**
- **[breadcrumbs-architecture.md](docs/breadcrumbs-architecture.md)** - Hierarchical breadcrumb system with page scoping
- **[layout-navigation.md](docs/layout-navigation.md)** - Navigation patterns and routing integration

#### **🏢 Service Architecture**
- **[service-architecture-progress.md](docs/service-architecture-progress.md)** - Service implementation progress and roadmap
- **[service-interfaces.md](docs/service-interfaces.md)** - Service interface specifications and contracts
- **[unified-handler-system.md](docs/unified-handler-system.md)** - Handler pattern implementation

#### **🛠️ Implementation & Development**
- **[implementation-summary.md](docs/implementation-summary.md)** - Overall implementation overview
- **[initialization-flow.md](docs/initialization-flow.md)** - Application startup sequence and lifecycle

#### **🧪 Testing & Quality**
- **[error-message-tests.md](docs/error-message-tests.md)** - Error handling test patterns and examples
- **[error-messages.md](docs/error-messages.md)** - Global error message system documentation
- **[browser-warning-fixes.md](docs/browser-warning-fixes.md)** - Browser compatibility fixes and solutions

## 🤖 MCP Integration

### Model Context Protocol Support

This project integrates with MCP (Model Context Protocol) tools for enhanced development workflows:

#### **Available MCP Tools**

**🌐 Browser Automation & Testing:**
- `execute_browser_action` - Smart browser automation with chrome-devtools integration
- `take_screenshot` - Visual verification and regression testing
- `take_snapshot` - DOM state inspection and component analysis
- `navigate_page` - URL navigation and page state management
- `click`, `fill`, `hover` - Interactive element testing and automation
- `evaluate_script` - JavaScript execution in browser context
- `list_console_messages` - Console monitoring for errors and warnings
- `list_network_requests` - API request analysis and debugging

**🔍 Performance & Debug Analysis:**
- `performance_start_trace` - Performance profiling with Core Web Vitals
- `performance_analyze_insight` - Detailed bottleneck analysis and optimization
- `analyze_visual_diff` - Visual regression detection between UI states
- `fix_my_app` - Comprehensive error detection with fix recommendations
- `fix_my_jank` - Layout shift and performance issue identification
- `find_component_source` - Map DOM elements to source code locations

**📚 Documentation & Code Analysis:**
- `search_generic_code` - GitHub repository code pattern search
- `fetch_generic_documentation` - Complete repository documentation retrieval
- `get-library-docs` - Library-specific documentation with version support
- `resolve-library-id` - Library identification for documentation lookup

#### **MCP Development Workflows**

**Performance Testing Workflow:**
```typescript
// 1. Start performance trace for Core Web Vitals analysis
// 2. Navigate to http://localhost:3000 for page testing  
// 3. Take screenshots for visual verification
// 4. Stop trace and analyze performance bottlenecks
// 5. Use fix_my_jank for layout shift detection
```

**Component Debugging Workflow:**
```typescript
// 1. Take DOM snapshot to inspect component state
// 2. Use find_component_source to locate element source files
// 3. Execute browser actions for interaction testing
// 4. Monitor console messages for runtime errors
// 5. Analyze network requests for API integration issues
```

**Visual Testing Workflow:**
```typescript
// 1. Take before/after screenshots during development
// 2. Use analyze_visual_diff to detect layout changes
// 3. Verify responsive behavior across breakpoints
// 4. Test component interactions with browser automation
```

### MCP Integration Benefits
- **Enhanced Development**: Real-time performance monitoring and optimization
- **Visual Testing**: Automated screenshot comparison and regression detection
- **Debug Assistance**: Component source mapping and error analysis
- **Documentation**: Automated library documentation and code pattern discovery
- **Performance**: Core Web Vitals monitoring and layout shift detection

### 📋 Planned Features
- **Survey Management**: Create, edit, manage surveys
- **Data Visualization**: Charts and analytics dashboard
- **User Authentication**: Token-based authentication system
- **Real API Integration**: Replace mock service with actual backend

## Migration Context

This project represents a **complete architectural migration** from a servlet-based Java application:

### Migration Approach
1. **Preserved Structure**: Maintains familiar DOM structure from original application
2. **Modernized Patterns**: Replaced server-side rendering with SPA architecture
3. **Enhanced UX**: Added responsive design and modern UI patterns
4. **Type Safety**: Full TypeScript implementation with strict typing
5. **Component Lifecycle**: Systematic component initialization and cleanup

## Troubleshooting

### Development Issues

#### **FOUC (Flash of Unstyled Content)**
The application prevents FOUC through:
- Direct CSS preloading in index.html
- Smart script timing with CSS ready checks
- Material Icons with `font-display: swap`

#### **Browser Warnings**
- **H1 styling warnings**: Fixed with explicit `.brand-title` styling
- **Layout forced warnings**: Prevented with proper CSS loading sequence
- **InstallTrigger warnings** (Firefox dev only): Safe to ignore - from Vite dev server

#### **Layout Issues**
- **Content not scrolling**: Check `.app-content-scroll` has `overflow-y: auto`
- **Footer positioning**: Verify `min-height: 0` on scroll containers
- **Sidebar overlapping**: Confirm CSS Grid variables match sidebar width

#### **Console Debugging**
The application uses emoji-prefixed console logging:
- 🚀 Main application lifecycle
- 🎯 Routing and navigation
- 🏗️ Component initialization
- ✅ Success states / ❌ Error states

### Performance
- **CSS Grid + Flexbox**: Hardware-accelerated layout
- **Viewport constraints**: 100vh grid prevents body overflow
- **Component lifecycle**: Proper cleanup prevents memory leaks

## 🚀 Preview Deployments

**GitHub Pages Integration**: Every pull request automatically gets a preview deployment!

### How it works
- **Automatic**: When you create or update a PR, GitHub Actions builds and deploys a preview
- **Unique URLs**: Each PR gets its own subdirectory: `https://inqwise-opinion.github.io/opinion-front-ui/pr-123/`
- **PR Comments**: A bot comments on your PR with the preview link and deployment details
- **Auto Cleanup**: Previews are automatically removed when PRs are closed/merged

### Preview URLs
- **Preview Index**: [https://inqwise-opinion.github.io/opinion-front-ui/](https://inqwise-opinion.github.io/opinion-front-ui/) - Lists all active previews
- **PR Preview Example**: `https://inqwise-opinion.github.io/opinion-front-ui/pr-42/` - Individual PR preview

### For Reviewers
1. Check the PR comment for the preview link
2. Test the preview deployment before approving
3. Verify responsive behavior and functionality
4. Check browser console for any errors

### For Contributors
- Preview deployments happen automatically - no action needed
- Preview is updated every time you push to your PR branch
- Use the preview to validate your changes before requesting review

## 🔍 Dependencies & Security Monitoring

### Dependency Tracking
- **[Libraries.io](https://libraries.io/github/inqwise-opinion/opinion-front-ui)**: Comprehensive dependency monitoring and alerts
- **[Shields.io Dependencies](https://shields.io/category/dependencies)**: Real-time dependency status badges
- **[Snyk](https://snyk.io/test/github/inqwise-opinion/opinion-front-ui)**: Security vulnerability scanning

### Security Monitoring
- **CodeQL Analysis**: Automated security scanning via GitHub Security tab
- **Dependabot**: Automated dependency updates and security alerts
- **npm audit**: Regular security audits in CI pipeline

### Dependency Management
```bash
# Check for outdated dependencies
npm outdated

# Check for security vulnerabilities
npm audit

# Fix security issues automatically
npm audit fix

# Update dependencies (be careful with major version changes)
npm update
```

## Contributing

1. Follow TypeScript best practices
2. Maintain consistent code formatting with ESLint
3. Write tests for new features
4. Update documentation as needed
5. Use semantic commit messages
6. Test responsive behavior across breakpoints
7. **Check the preview deployment** before requesting review
8. **Run `npm audit`** before submitting PRs to check for security issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
