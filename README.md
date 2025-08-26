# Opinion Front UI

A TypeScript front-end application migrated from a servlet-based Opinion system.

## Project Overview

This project represents the front-end user interface for the Opinion system, migrated from a traditional servlet-based Java application to a modern TypeScript implementation.

### Reference Projects

- **Admin UI Reference**: `/Users/glassfox/git/inqwise/opinion opensource/opinion-admin-ui`
- **Admin App Reference**: `/Users/glassfox/git/inqwise/opinion opensource/opinion-app-admin`

## Architecture

- **TypeScript**: Modern JavaScript with static typing
- **Vite**: Fast build tool and development server
- **SCSS**: Enhanced CSS with variables and mixins
- **Modular Structure**: Component-based architecture

## Directory Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── api/            # API communication layer
├── services/       # Business logic services
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── assets/         # Static assets (images, styles)
├── hooks/          # Custom hooks (if using a framework)
└── constants/      # Application constants

public/             # Static public files
tests/              # Test files
docs/               # Documentation
```

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

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

## Migration Notes

This project is a migration from a servlet-based Java application. Key considerations:

1. **API Integration**: Original servlet endpoints need to be adapted
2. **State Management**: Client-side state management replaces server-side session management
3. **Routing**: Client-side routing implementation needed
4. **Authentication**: Token-based authentication system

## Contributing

1. Follow TypeScript best practices
2. Maintain consistent code formatting with ESLint
3. Write tests for new features
4. Update documentation as needed

## License

ISC
