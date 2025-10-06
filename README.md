# Opinion Front UI

[![CI Pipeline](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/ci.yml)
[![CodeQL](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/codeql.yml/badge.svg)](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/codeql.yml)
[![Release](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/release.yml/badge.svg)](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/v/release/inqwise-opinion/opinion-front-ui?include_prereleases&sort=semver)](https://github.com/inqwise-opinion/opinion-front-ui/releases)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.3-646CFF.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A modern TypeScript front-end application** for the Opinion survey management platform, migrated from a servlet-based Java system to a sophisticated single-page application (SPA).

## 📊 Project Status

[![Build Status](https://img.shields.io/github/actions/workflow/status/inqwise-opinion/opinion-front-ui/ci.yml?branch=main&label=build)](https://github.com/inqwise-opinion/opinion-front-ui/actions/workflows/ci.yml)
[![Test Coverage](https://img.shields.io/codecov/c/github/inqwise-opinion/opinion-front-ui?label=coverage)](https://codecov.io/gh/inqwise-opinion/opinion-front-ui)
[![Dependencies](https://img.shields.io/librariesio/github/inqwise-opinion/opinion-front-ui?label=dependencies)](https://libraries.io/github/inqwise-opinion/opinion-front-ui)
[![Package Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen)](https://shields.io/category/dependencies)
[![Security](https://img.shields.io/github/actions/workflow/status/inqwise-opinion/opinion-front-ui/codeql.yml?branch=main&label=security)](https://github.com/inqwise-opinion/opinion-front-ui/security)
[![Known Vulnerabilities](https://snyk.io/test/github/inqwise-opinion/opinion-front-ui/badge.svg)](https://snyk.io/test/github/inqwise-opinion/opinion-front-ui)
[![Issues](https://img.shields.io/github/issues/inqwise-opinion/opinion-front-ui)](https://github.com/inqwise-opinion/opinion-front-ui/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/inqwise-opinion/opinion-front-ui)](https://github.com/inqwise-opinion/opinion-front-ui/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/inqwise-opinion/opinion-front-ui)](https://github.com/inqwise-opinion/opinion-front-ui/commits/main)
[![Stars](https://img.shields.io/github/stars/inqwise-opinion/opinion-front-ui)](https://github.com/inqwise-opinion/opinion-front-ui/stargazers)

## Project Overview

This project represents a **complete architectural migration** from a traditional servlet-based Java application to a modern TypeScript SPA. The application features a **micro-kernel architecture** with component-based design, custom routing, and advanced layout management.

## Architecture

### Core Technologies
- **TypeScript**: Modern JavaScript with strict typing and ES2020 target
- **Vite**: Lightning-fast development server and build tool
- **SCSS + CSS**: Hybrid styling with CSS Grid + Flexbox layout system
- **Jest**: Comprehensive testing framework with JSDOM environment

### Design Patterns
- **Micro-kernel Architecture**: Central `OpinionApp` controller with pluggable components
- **Component Lifecycle Management**: Abstract `PageComponent` base class with init/destroy patterns
- **Layout Context System**: Centralized layout coordination and error messaging
- **Event Delegation**: `data-action` attribute-based event handling
- **Custom Routing**: Client-side routing with browser history integration

## Getting Started

### Prerequisites

- **Node.js** >= 16.0.0 (recommended: 18.x or 20.x)
- **npm** >= 8.0.0
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
- **Layout System**: CSS Grid + Flexbox hybrid layout with responsive design
- **Component Architecture**: Abstract `PageComponent` base class with lifecycle management
- **Routing System**: Custom client-side routing with browser history
- **Global Layout**: Header, Sidebar, Footer components with coordination
- **Navigation Synchronization**: Active page tracking with navigation menu highlighting
- **Surveys Management**: Basic surveys page structure and routing
- **Error Handling**: Global error boundary and user-friendly error messages
- **Testing Setup**: Jest + JSDOM configuration with component tests
- **Styling System**: SCSS + CSS with component-scoped styles
- **Development Tools**: Vite dev server, TypeScript, ESLint configuration

### 🚧 In Progress
- **API Integration**: MockApiService provides development data
- **Dashboard Page**: Basic dashboard implementation
- **Debug Tools**: Comprehensive debug page for development
- **Surveys Implementation**: Survey creation, editing, and management features

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
