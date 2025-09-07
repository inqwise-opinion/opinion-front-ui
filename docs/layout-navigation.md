# Layout Navigation and User Menu Building

This document describes the navigation items and user menu items building capabilities implemented in the Layout class.

## Overview

The Layout class now provides comprehensive functionality to build and manage:
- **Navigation Items** for the sidebar
- **User Menu Items** for the header user menu

These capabilities allow for dynamic, configurable UI elements that can be customized based on user permissions, application state, or other runtime conditions.

## Features

### Navigation Items Management
- ✅ Configure initial navigation items via LayoutConfig
- ✅ Add/remove navigation items dynamically
- ✅ Update existing navigation items
- ✅ Set active navigation item
- ✅ Support for expandable navigation with children
- ✅ Support for badges and captions
- ✅ Automatic sidebar updates when items change

### User Menu Items Management  
- ✅ Configure initial user menu items via LayoutConfig
- ✅ Add/remove user menu items dynamically
- ✅ Update existing user menu items
- ✅ Support for different item types (link, action, divider)
- ✅ Custom styling and CSS classes
- ✅ Automatic header/user menu updates when items change

## Basic Usage

### 1. Initial Configuration

```typescript
import Layout, { LayoutConfig, UserMenuItem } from './components/Layout';
import { NavigationItem } from './components/Sidebar';

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    text: 'Dashboard',
    icon: 'dashboard',
    href: '/dashboard',
    caption: 'Overview and analytics',
    active: true,
  },
  {
    id: 'projects',
    text: 'Projects',
    icon: 'folder',
    href: '/projects',
    caption: 'Manage your projects',
    badge: '5',
  }
];

const userMenuItems: UserMenuItem[] = [
  {
    id: 'profile',
    text: 'My Profile',
    icon: 'account_circle',
    href: '/profile',
    type: 'link',
  },
  {
    id: 'divider1',
    text: '',
    icon: '',
    type: 'divider',
  },
  {
    id: 'logout',
    text: 'Sign Out',
    icon: 'logout',
    href: '/logout',
    type: 'link',
    className: 'user-menu-signout',
  }
];

const config: LayoutConfig = {
  navigation: navigationItems,
  userMenu: userMenuItems,
  header: { enabled: true },
  sidebar: { enabled: true },
  footer: { enabled: true }
};

const layout = new Layout(config);
await layout.init();
```

### 2. Dynamic Navigation Management

```typescript
// Add a new navigation item
const newItem: NavigationItem = {
  id: 'notifications',
  text: 'Notifications',
  icon: 'notifications',
  href: '/notifications',
  badge: '3'
};
layout.addNavigationItem(newItem, 1); // Insert at position 1

// Update existing item
layout.updateNavigationItem('projects', {
  badge: '7',
  caption: 'Manage your projects (7 active)'
});

// Set active item
layout.setActiveNavigationItem('notifications');

// Remove item
layout.removeNavigationItem('old-feature');
```

### 3. Dynamic User Menu Management

```typescript
// Add a new user menu item
const billingItem: UserMenuItem = {
  id: 'billing',
  text: 'Billing & Usage',
  icon: 'payment',
  href: '/billing',
  type: 'link'
};
layout.addUserMenuItem(billingItem, 2);

// Update existing item
layout.updateUserMenuItem('profile', {
  text: 'My Account',
  icon: 'account_box'
});

// Add custom action
const exportItem: UserMenuItem = {
  id: 'export',
  text: 'Export Data',
  icon: 'download',
  action: 'export-data',
  type: 'action'
};
layout.addUserMenuItem(exportItem);

// Remove item
layout.removeUserMenuItem('old-menu-item');
```

## Interfaces

### NavigationItem Interface
```typescript
interface NavigationItem {
  id: string;
  text: string;
  icon: string;
  href: string;
  caption?: string;        // Optional description/tooltip
  badge?: string;          // Optional badge text
  active?: boolean;        // Whether item is currently active
  expandable?: boolean;    // Whether item can expand
  expanded?: boolean;      // Whether item is currently expanded
  children?: NavigationItem[]; // Child navigation items
}
```

### UserMenuItem Interface
```typescript
interface UserMenuItem {
  id: string;
  text: string;
  icon: string;
  href?: string;           // Link URL (for type: 'link')
  action?: string;         // Action identifier (for type: 'action')
  type?: 'link' | 'action' | 'divider'; // Default: 'link'
  className?: string;      // Additional CSS classes
  style?: string;          // Additional inline styles
}
```

### LayoutConfig Extension
```typescript
interface LayoutConfig {
  // ... existing properties
  navigation?: NavigationItem[];  // Initial navigation items
  userMenu?: UserMenuItem[];      // Initial user menu items
}
```

## Layout Class API

### Navigation Methods

| Method | Description |
|--------|-------------|
| `setNavigationItems(items: NavigationItem[])` | Replace all navigation items |
| `getNavigationItems(): NavigationItem[]` | Get current navigation items |
| `addNavigationItem(item: NavigationItem, position?: number)` | Add a navigation item |
| `updateNavigationItem(id: string, updates: Partial<NavigationItem>)` | Update a navigation item |
| `removeNavigationItem(id: string)` | Remove a navigation item |
| `setActiveNavigationItem(id: string)` | Set active navigation item |
| `getNavigationForSidebar(): NavigationItem[]` | Get navigation items for sidebar component |

### User Menu Methods

| Method | Description |
|--------|-------------|
| `setUserMenuItems(items: UserMenuItem[])` | Replace all user menu items |
| `getUserMenuItems(): UserMenuItem[]` | Get current user menu items |
| `addUserMenuItem(item: UserMenuItem, position?: number)` | Add a user menu item |
| `updateUserMenuItem(id: string, updates: Partial<UserMenuItem>)` | Update a user menu item |
| `removeUserMenuItem(id: string)` | Remove a user menu item |
| `getUserMenuForHeader(): UserMenuItem[]` | Get user menu items for header component |

## Default Items

If no navigation or user menu items are provided in the configuration, the Layout class uses sensible defaults:

### Default Navigation Items
- Dashboard (active)
- Surveys
- Debug

### Default User Menu Items
- Account Settings
- Send Feedback
- Divider
- Sign Out

## Integration with Components

The Layout class automatically updates the relevant components when navigation or user menu items change:

- **Sidebar Updates**: When navigation items change, the sidebar is automatically updated via `sidebar.updateNavigation()`
- **Header Updates**: When user menu items change, the header/user menu is automatically updated via `header.updateUserMenuItems()`

## Page Component Integration

Page components can retrieve the current navigation and user menu items from the Layout:

```typescript
// In a page component
const layout = getLayout(); // Your method to get layout instance

// Get navigation items for sidebar creation
const navigationItems = layout.getNavigationForSidebar();
const sidebar = new SidebarComponent({ /* config */ });
// sidebar will use the navigation items from layout

// Set current page as active
layout.setActiveNavigationItem('current-page-id');
```

## Examples

See `src/examples/layout-navigation-example.ts` for comprehensive examples of:
- Creating layouts with initial configuration
- Dynamic navigation management
- Dynamic user menu management
- Page component integration
- Complete layout setup and initialization

## Benefits

1. **Centralized Management**: All navigation and user menu configuration is managed through the Layout class
2. **Dynamic Updates**: Items can be added, removed, or updated at runtime
3. **Automatic Synchronization**: Components are automatically updated when items change
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Flexible Configuration**: Support for various item types, styles, and behaviors
6. **Easy Integration**: Simple API for page components to interact with navigation state
