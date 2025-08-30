# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a TypeScript front-end application for the Opinion system, migrated from a traditional servlet-based Java application. It uses modern web development tools including Vite, TypeScript, and SCSS, with a component-based architecture.

**Migration Context**: This project is part of a migration from servlet-based Java applications. The original project structure and API calls (named DataPostMaster) are being adapted to TypeScript with modern client-side patterns.

## Development Commands

### Core Development Workflow
```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix
```

**Note**: The development server uses `SASS_SILENCE_DEPRECATIONS=legacy-js-api` to suppress SASS warnings.

## Architecture

### Application Structure

This is a **single-page application (SPA)** with a custom routing system built around a central `OpinionApp` class. The application uses a **micro-kernel design** with modular components.

**Key Architectural Components**:

- **OpinionApp** (`src/app.ts`): Main application controller handling routing, global layout, and lifecycle
- **PageComponent** (`src/components/PageComponent.ts`): Abstract base class providing common page functionality including lifecycle management, event handling, and keyboard shortcuts
- **Global Layout System**: Header, Sidebar, and Footer components that persist across page navigation
- **MockApiService** (`src/services/MockApiService.ts`): Development API layer with realistic test data

### Component Patterns

The codebase follows a **component-based architecture** where:

- All page-level components extend `PageComponent` abstract class
- Components manage their own lifecycle (init/destroy)
- Event delegation pattern using `data-action` attributes
- Automatic cleanup of event listeners and timers
- Global error handling with detailed logging

### TypeScript Configuration

The project uses modern TypeScript with strict settings and custom path mappings:

```typescript
"paths": {
  "@/*": ["src/*"],
  "@/components/*": ["src/components/*"],
  "@/utils/*": ["src/utils/*"],
  "@/types/*": ["src/types/*"],
  "@/api/*": ["src/api/*"],
  "@/assets/*": ["src/assets/*"]
}
```

### Routing System

Custom client-side routing implemented in `OpinionApp`:

- Routes handled by `handleRoute()` method
- Page instances created/destroyed on navigation
- Browser history integration with `popstate` events
- Current routes:
  - `/` → DebugPage (development/testing)
  - `/dashboard` → DashboardPage
  - Fallback → DebugPage

### Global Layout Architecture

> **📋 Detailed Documentation:** See [`docs/LAYOUT_ARCHITECTURE.md`](docs/LAYOUT_ARCHITECTURE.md) for comprehensive layout system documentation.

The application uses a **CSS Grid + Flexbox hybrid layout system**:

```html
<div class="app-layout">                    <!-- CSS Grid Container -->
  <div class="app-sidebar">                 <!-- Grid Area: sidebar -->
    <!-- Sidebar component -->
  </div>
  <div class="app-content-scroll">          <!-- Grid Area: content -->
    <header class="app-header">             <!-- Fixed header -->
      <!-- Header component -->
    </header>
    <main class="app-main" id="app">        <!-- Dynamic content -->
      <!-- Page components render here -->
    </main>
    <footer class="app-footer">             <!-- Footer flows after content -->
      <!-- Footer component -->
    </footer>
  </div>
</div>
```

**Layout Principles**:
- **CSS Grid** for overall structure (sidebar + content areas)
- **Flexbox** for content flow (header → main → footer)
- **Natural content height** (footer flows after content, no forced positioning)
- **Responsive breakpoints** with sidebar width adjustments

**Responsive Behavior**:
- **Desktop (≥768px)**: Sidebar fixed width, CSS Grid layout
- **Mobile (<768px)**: Single column, sidebar hidden/overlay mode

## Development Environment

### Build System
- **Vite**: Fast development server and build tool
- **Target**: ES2020
- **Port**: 3000 with auto-open browser
- **Source Maps**: Enabled for debugging

### Testing Setup
- **Framework**: Jest with ts-jest preset
- **Environment**: JSDOM for DOM testing
- **Coverage**: Configured for `src/**/*.{ts,tsx}` excluding type definitions
- **Setup**: Custom test setup in `tests/setup.ts` with console noise reduction

### Code Standards
- **ESLint**: TypeScript-aware configuration
- **Rules**: Strict TypeScript rules with unused variables as errors
- **Console**: Console statements allowed (common in this codebase for debugging)

## Key Implementation Details

### Service Layer Pattern
The `MockApiService` provides realistic development data with:
- Simulated network delays (500ms)
- User authentication simulation
- Survey/opinion data with completion tracking
- Chart data generation for dashboard features

### Component Lifecycle Management
All components extending `PageComponent` get:
- Automatic initialization with `onInit()` hook
- Event listener tracking and cleanup
- Keyboard shortcut handling (Escape key, etc.)
- Action delegation via `data-action` attributes
- Error boundary patterns

### Migration-Specific Considerations
This project maintains compatibility with servlet-based patterns:
- API endpoints being adapted from servlet structure
- Session management replaced with client-side state
- Server-side rendering replaced with SPA routing
- Original DOM structure and logic closely followed

## Testing Guidelines

### Component Testing Approach
The test suite focuses on:
- **Component Lifecycle**: Init/destroy behavior verification
- **DOM Integration**: Proper element insertion and cleanup  
- **Event Handling**: User interaction and keyboard shortcuts
- **Responsive Behavior**: Layout changes across screen sizes
- **Error Handling**: Graceful failure scenarios

### Test File Organization
- Tests mirror source structure in `tests/` directory
- Component tests include DOM manipulation verification
- Setup file handles JSDOM polyfills and console noise reduction

## Development Notes

### Console Logging Pattern
The codebase uses extensive console logging with emoji prefixes for debugging:
- `🚀` - Main application lifecycle
- `🎯` - Routing and navigation  
- `🏗️` - Component initialization
- `✅` - Success states
- `❌` - Error states
- `⚠️` - Warnings

### Global Error Handling
The application includes comprehensive error handling:
- Global error listeners for uncaught exceptions
- Promise rejection handling
- User-friendly error display with reload option
- Detailed error logging with stack traces

### Reference Projects
When working on this codebase, refer to these related projects for context:
- **Admin UI Reference**: `/Users/glassfox/git/inqwise/opinion opensource/opinion-admin-ui`  
- **Admin App Reference**: `/Users/glassfox/git/inqwise/opinion opensource/opinion-app-admin`

These contain the original servlet-based implementation patterns being migrated to TypeScript.
