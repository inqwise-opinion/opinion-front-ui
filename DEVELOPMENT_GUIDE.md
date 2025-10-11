# Development Guide - Opinion Front UI

## 🚀 Getting Started

### Quick Start
```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Build for production
npm run build
```

### Development Environment
- **Node.js**: ≥20.0.0 (required by package.json engines)
- **npm**: ≥10.0.0
- **Browser**: Modern browser with CSS Grid and ES2020 support
- **IDE**: VS Code recommended with TypeScript extensions

## 🏗️ Architecture Overview

The Opinion Front UI follows a **micro-kernel architecture** with **event-driven communication** and **reactive data binding**.

### Core Principles
1. **Micro-Kernel**: `LayoutContext` acts as the application kernel managing all resources
2. **Event-Driven**: Components communicate via EventBus (publish/subscribe/request patterns)
3. **Reactive**: Observable pattern with ComputedObservables, validators, and transformers
4. **Chain-Based Hotkeys**: Priority-based hotkey resolution with cooperative handling
5. **Service-Oriented**: Dependency injection with service registry and interfaces
6. **Hierarchical Breadcrumbs**: Page-scoped breadcrumb management with safe operations

### Key Components
- **LayoutContextImpl**: Application kernel (service registry, EventBus, hotkeys, layout)
- **PageComponent**: Abstract base class for all pages (lifecycle, events, breadcrumbs)
- **Layout**: Master layout coordinator (header, footer, sidebar, error messages)
- **MainContent**: Content container for page components

## 📝 Development Patterns

### 1. Creating New Pages

```typescript
import { PageComponent } from '@/components/PageComponent.js';

export class MyNewPage extends PageComponent {
  constructor() {
    super('MyNewPage'); // Page ID for breadcrumb scoping
  }
  
  protected async onInit(): Promise<void> {
    // Initialize page content
    this.mainContent.innerHTML = this.createPageHTML();
    
    // Set up page-specific breadcrumbs
    const pageContext = await this.getPageContext();
    const breadcrumbs = pageContext.breadcrumbs();
    breadcrumbs.set([
      { id: 'MyNewPage', text: 'My New Page' }
    ]);
    
    // Subscribe to events
    this.layoutContext.subscribe('some-event', this.handleEvent.bind(this));
    
    // Register page-specific hotkeys (if needed)
    // See hotkey system documentation
  }
  
  protected async onDestroy(): Promise<void> {
    // Cleanup will be handled automatically by PageComponent
    // Custom cleanup code can be added here if needed
  }
  
  private createPageHTML(): string {
    return `
      <div class="page-container">
        <h1>My New Page</h1>
        <div class="page-content">
          <!-- Page content here -->
        </div>
      </div>
    `;
  }
  
  private handleEvent(data: any): void {
    console.log('Event received:', data);
  }
}
```

### 2. Creating Services

```typescript
// Define service interface
interface DataService {
  loadData(): Promise<Data[]>;
  saveData(data: Data): Promise<void>;
}

// Implement service
export class DataServiceImpl implements DataService {
  constructor(private apiClient: ApiClient) {}
  
  async loadData(): Promise<Data[]> {
    return await this.apiClient.get('/data');
  }
  
  async saveData(data: Data): Promise<void> {
    await this.apiClient.post('/data', data);
  }
}

// Register service (in OpinionApp or service registration)
await layoutContext.registerService('DataService', new DataServiceImpl(apiClient));

// Consume service (in PageComponent)
export class DataPage extends PageComponent {
  protected async onInit(): Promise<void> {
    const dataService = await this.layoutContext.getService<DataService>('DataService');
    const data = await dataService.loadData();
    this.renderData(data);
  }
}
```

### 3. Using EventBus Communication

```typescript
export class PublisherComponent {
  private publishData(): void {
    // One-to-many communication
    this.layoutContext.publish('data-updated', { 
      timestamp: Date.now(),
      data: this.currentData 
    });
  }
  
  private async requestData(): Promise<Data> {
    // One-to-one request-response
    return await this.layoutContext.request('get-current-data', {});
  }
}

export class ConsumerComponent {
  protected async onInit(): Promise<void> {
    // Subscribe to events
    this.layoutContext.subscribe('data-updated', this.handleDataUpdate.bind(this));
    
    // Handle requests (register handler)
    this.layoutContext.handle('get-current-data', this.getCurrentData.bind(this));
  }
  
  private handleDataUpdate(eventData: { timestamp: number; data: Data }): void {
    console.log('Data updated at:', new Date(eventData.timestamp));
    this.updateDisplay(eventData.data);
  }
  
  private async getCurrentData(): Promise<Data> {
    return this.currentData;
  }
}
```

### 4. Creating Reactive Data Bindings

```typescript
import { ObservableImpl, ComputedObservable } from '@/observables/index.js';

export class DataComponent {
  private userName = new ObservableImpl<string>('');
  private userEmail = new ObservableImpl<string>('');
  
  // Computed observable with dependency tracking
  private userDisplayName = new ComputedObservable<string>(
    [this.userName, this.userEmail],
    (name, email) => `${name} <${email}>`
  );
  
  protected async onInit(): Promise<void> {
    // Subscribe to changes
    this.userDisplayName.subscribe((displayName) => {
      this.updateDisplayNameElement(displayName);
    });
    
    // Set up validation
    this.userEmail
      .withValidator((email) => email.includes('@'))
      .withTransformer((email) => email.toLowerCase().trim());
    
    // Listen for validation errors
    this.userEmail.onValidationError((error) => {
      this.showEmailError(error);
    });
  }
  
  private updateUserInfo(name: string, email: string): void {
    // These will automatically trigger computed observable updates
    this.userName.set(name);
    this.userEmail.set(email);
  }
}
```

### 5. Implementing Chain-Based Hotkeys

```typescript
import { ChainHotkeyProvider, ChainHotkeyHandler } from '@/hotkeys/index.js';

export class MyComponentProvider implements ChainHotkeyProvider {
  constructor(private component: MyComponent) {}
  
  getHotkeyProviderId(): string {
    return 'MyComponent';
  }
  
  getProviderPriority(): number {
    // Priority guidelines:
    // 1000+: Modal dialogs (highest priority, always break chain)
    // 800-900: Mobile/overlay components (high priority, context-aware)
    // 600-700: Menu systems (medium priority, cooperative)
    // 100-500: Page components (lower priority, default handlers)
    return 600;
  }
  
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    // Return null when component not active (state-based activation)
    if (!this.component.isActive()) {
      return null;
    }
    
    return new Map([
      ['Escape', {
        key: 'Escape',
        providerId: 'MyComponent',
        enabled: true,
        handler: (ctx) => {
          this.component.handleEscape();
          ctx.preventDefault();
          
          // Smart chain control
          if (ctx.hasProvider('HigherPriorityComponent')) {
            ctx.next(); // Let higher priority also handle
          } else {
            ctx.break(); // We're the final handler
          }
        },
        enable: () => this.enableEscapeKey(),
        disable: () => this.disableEscapeKey(),
        isEnabled: () => this.isEscapeEnabled()
      }]
    ]);
  }
}

// Register provider with LayoutContext
export class MyComponent {
  private hotkeyProvider: MyComponentProvider;
  
  async init(): Promise<void> {
    this.hotkeyProvider = new MyComponentProvider(this);
    this.layoutContext.registerChainProvider(this.hotkeyProvider);
  }
  
  async destroy(): Promise<void> {
    this.layoutContext.unregisterChainProvider(this.hotkeyProvider.getHotkeyProviderId());
  }
}
```

## 🧪 Testing Guidelines

### Test Structure
```
tests/
├── components/     # Component tests
├── events/         # EventBus tests
├── hotkeys/        # Hotkey system tests  
├── observables/    # Observable tests
├── services/       # Service tests
└── utils/          # Utility tests
```

### Component Testing Pattern
```typescript
import { LayoutContextImpl } from '@/contexts/LayoutContextImpl.js';
import { MyComponent } from '@/components/MyComponent.js';

describe('MyComponent', () => {
  let component: MyComponent;
  let layoutContext: LayoutContextImpl;
  let container: HTMLElement;
  
  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    // Create layout context
    layoutContext = LayoutContextImpl.getInstance();
    
    // Create component
    component = new MyComponent(layoutContext);
  });
  
  afterEach(async () => {
    // Cleanup component
    await component.destroy();
    
    // Cleanup DOM
    document.body.removeChild(container);
    
    // Reset layout context
    LayoutContextImpl.resetInstance();
  });
  
  test('should initialize correctly', async () => {
    await component.init();
    
    expect(component.isInitialized()).toBe(true);
    expect(container.querySelector('.my-component')).toBeTruthy();
  });
  
  test('should handle events correctly', async () => {
    await component.init();
    
    const eventData = { test: 'data' };
    layoutContext.publish('test-event', eventData);
    
    // Verify component handled event
    expect(component.getLastEventData()).toEqual(eventData);
  });
});
```

### Integration Testing Pattern
```typescript
describe('Component Integration', () => {
  test('should communicate via EventBus', async () => {
    const publisher = new PublisherComponent(layoutContext);
    const consumer = new ConsumerComponent(layoutContext);
    
    await publisher.init();
    await consumer.init();
    
    const testData = { value: 'test' };
    publisher.publishData(testData);
    
    // Wait for async event handling
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consumer.getReceivedData()).toEqual(testData);
  });
});
```

## 📚 Code Organization

### Directory Structure
```
src/
├── api/                    # API client and interfaces
├── components/             # UI components
│   ├── Layout.ts          # Master layout coordinator
│   ├── PageComponent.ts   # Abstract page base class
│   └── ...
├── contexts/              # Application contexts
│   └── LayoutContextImpl.ts # Micro-kernel implementation
├── events/                # EventBus system
├── hotkeys/               # Chain-based hotkey system
├── observables/           # Reactive data binding
├── pages/                 # Page components
├── services/              # Business logic services
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── assets/                # Static assets (styles, images)
    └── styles/            # SCSS stylesheets
```

### File Naming Conventions
- **Components**: PascalCase with descriptive names (`UserMenu.ts`, `SidebarComponent.ts`)
- **Services**: PascalCase with "Service" suffix (`MockApiService.ts`, `DataService.ts`)
- **Interfaces**: PascalCase, often matching implementation (`EventBus.ts`, `Observable.ts`)
- **Types**: PascalCase in `types/` directory (`User.ts`, `Survey.ts`)
- **Utils**: camelCase descriptive names (`domHelpers.ts`, `validation.ts`)

### Import Patterns
```typescript
// Use path mapping aliases
import { LayoutContextImpl } from '@/contexts/LayoutContextImpl.js';
import { PageComponent } from '@/components/PageComponent.js';
import { ObservableImpl } from '@/observables/index.js';

// Always use .js extension for ES modules
import type { User } from '@/types/User.js';
```

## 🎨 Styling Guidelines

### SCSS Structure
```
src/assets/styles/
├── base/                  # Base styles
│   ├── reset.scss        # CSS reset
│   ├── typography.scss   # Typography
│   └── variables.scss    # SCSS variables
├── components/           # Component-specific styles
│   ├── layout.scss       # Layout system
│   ├── sidebar.scss      # Sidebar component
│   └── ...
├── pages/                # Page-specific styles
├── utils/                # Utility classes
└── main.scss             # Main stylesheet
```

### CSS Custom Properties
```scss
// Layout system variables
:root {
  --sidebar-width: 280px;
  --sidebar-compact-width: 60px;
  --header-height: 60px;
  --footer-height: 50px;
  
  // Responsive breakpoints
  --mobile-max: 768px;
  --tablet-max: 1024px;
  --desktop-min: 1025px;
  
  // Theme colors
  --primary-color: #2196f3;
  --secondary-color: #757575;
  --error-color: #f44336;
  --success-color: #4caf50;
}
```

### Component Styling Pattern
```scss
.my-component {
  // Component root styles
  
  &__element {
    // BEM element styles
  }
  
  &--modifier {
    // BEM modifier styles
  }
  
  // Responsive behavior
  @media (max-width: var(--tablet-max)) {
    // Tablet styles
  }
  
  @media (max-width: var(--mobile-max)) {
    // Mobile styles
  }
}
```

## 🚀 Deployment & CI/CD

### Build Process
```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Check build output
ls -la dist/
```

### GitHub Actions
The project includes automated CI/CD:
- **CI Pipeline**: Runs tests, linting, and type checking
- **CodeQL**: Security scanning
- **Preview Deployments**: Automatic preview for pull requests
- **Release**: Automated releases with semantic versioning

### Preview Deployments
- Every PR gets a preview deployment at: `https://inqwise-opinion.github.io/opinion-front-ui/pr-{PR_NUMBER}/`
- Preview index: https://inqwise-opinion.github.io/opinion-front-ui/
- Automatic cleanup when PRs are closed/merged

## 📖 Additional Resources

### Documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Complete architectural documentation
- **[README.md](README.md)**: Project overview and setup
- **[STATUS_REPORT.md](STATUS_REPORT.md)**: Current project status
- **[docs/](docs/)**: Detailed subsystem documentation

### Key Documentation Files
- **[hotkey-chain-architecture.md](docs/hotkey-chain-architecture.md)**: Hotkey system design
- **[breadcrumbs-architecture.md](docs/breadcrumbs-architecture.md)**: Breadcrumb system
- **[event-system.md](docs/event-system.md)**: EventBus documentation
- **[service-architecture-progress.md](docs/service-architecture-progress.md)**: Service layer progress

### Debug Tools
- **DebugPage** (`/debug`): Comprehensive architecture testing and component inspection
- **Browser Console**: Emoji-prefixed logging (🚀 lifecycle, 🎯 routing, 🏗️ components)
- **Chain Debug**: `layoutContext.getChainDebugInfo('Escape')` for hotkey chain inspection

---

## 🤝 Contributing

1. **Follow TypeScript best practices** and maintain strict typing
2. **Write tests** for new features (aim for high coverage in critical modules)
3. **Update documentation** when making architectural changes
4. **Use semantic commit messages** and descriptive PR titles
5. **Test responsive behavior** across mobile, tablet, and desktop
6. **Check preview deployment** before requesting review
7. **Run `npm audit`** to check for security issues

Remember: The micro-kernel architecture means most functionality should integrate through `LayoutContext` rather than direct component coupling. When in doubt, publish an event or register a service!