/**
 * Layout Navigation and User Menu Building Example
 * 
 * This example demonstrates how to use the Layout class to build
 * and manage navigation items and user menu items dynamically.
 */

import Layout, { LayoutConfig, UserMenuItem } from '../components/Layout';
import { NavigationItem } from '../components/Sidebar';

// =================================================================================
// Example 1: Creating a Layout with Initial Navigation and User Menu Configuration
// =================================================================================

function createLayoutWithConfiguration() {
  console.log('🏗️ Example 1: Creating Layout with initial configuration...');

  const customNavigationItems: NavigationItem[] = [
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
    },
    {
      id: 'reports',
      text: 'Reports',
      icon: 'assessment',
      href: '/reports',
      caption: 'View detailed reports',
      expandable: true,
      expanded: false,
      children: [
        {
          id: 'sales-report',
          text: 'Sales Report',
          icon: 'trending_up',
          href: '/reports/sales',
          caption: 'Sales performance data',
        },
        {
          id: 'user-report',
          text: 'User Report', 
          icon: 'people',
          href: '/reports/users',
          caption: 'User activity analytics',
        },
      ],
    },
    {
      id: 'settings',
      text: 'Settings',
      icon: 'settings',
      href: '/settings',
      caption: 'Application settings',
    },
  ];

  const customUserMenuItems: UserMenuItem[] = [
    {
      id: 'profile',
      text: 'My Profile',
      icon: 'account_circle',
      href: '/profile',
      type: 'link',
    },
    {
      id: 'preferences',
      text: 'Preferences',
      icon: 'tune',
      href: '/preferences',
      type: 'link',
    },
    {
      id: 'divider1',
      text: '',
      icon: '',
      type: 'divider',
    },
    {
      id: 'help',
      text: 'Help & Support',
      icon: 'help',
      href: '/help',
      type: 'link',
    },
    {
      id: 'feedback',
      text: 'Send Feedback',
      icon: 'feedback',
      action: 'feedback',
      type: 'action',
    },
    {
      id: 'divider2',
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
      style: 'color: #dc3545;',
    },
  ];

  const layoutConfig: LayoutConfig = {
    header: {
      enabled: true,
      brandTitle: 'My Application',
      brandHref: '/dashboard',
    },
    sidebar: {
      enabled: true,
    },
    footer: {
      enabled: true,
      showCopyright: true,
      copyrightText: '© 2024 My Company',
    },
    navigation: customNavigationItems,
    userMenu: customUserMenuItems,
  };

  const layout = new Layout(layoutConfig);
  console.log('✅ Layout created with custom navigation and user menu items');
  
  return layout;
}

// =================================================================================
// Example 2: Dynamic Navigation Management
// =================================================================================

function demonstrateNavigationManagement(layout: Layout) {
  console.log('🔄 Example 2: Dynamic navigation management...');

  // Get current navigation items
  const currentNav = layout.getNavigationItems();
  console.log('Current navigation items:', currentNav.length);

  // Add a new navigation item
  const newNavItem: NavigationItem = {
    id: 'notifications',
    text: 'Notifications',
    icon: 'notifications',
    href: '/notifications',
    caption: 'View your notifications',
    badge: '3',
  };

  layout.addNavigationItem(newNavItem, 1); // Insert at position 1
  console.log('✅ Added new navigation item');

  // Update an existing navigation item
  layout.updateNavigationItem('projects', {
    badge: '7', // Updated badge count
    caption: 'Manage your projects (7 active)',
  });
  console.log('✅ Updated existing navigation item');

  // Set active navigation item
  layout.setActiveNavigationItem('projects');
  console.log('✅ Set active navigation item');

  // Add a navigation item with children
  const advancedNavItem: NavigationItem = {
    id: 'analytics',
    text: 'Analytics',
    icon: 'analytics',
    href: '/analytics',
    caption: 'Advanced analytics tools',
    expandable: true,
    expanded: false,
    children: [
      {
        id: 'performance',
        text: 'Performance',
        icon: 'speed',
        href: '/analytics/performance',
        caption: 'System performance metrics',
      },
      {
        id: 'usage',
        text: 'Usage Statistics',
        icon: 'bar_chart',
        href: '/analytics/usage',
        caption: 'Usage patterns and trends',
      },
    ],
  };

  layout.addNavigationItem(advancedNavItem);
  console.log('✅ Added expandable navigation item with children');
}

// =================================================================================
// Example 3: Dynamic User Menu Management  
// =================================================================================

function demonstrateUserMenuManagement(layout: Layout) {
  console.log('👤 Example 3: Dynamic user menu management...');

  // Get current user menu items
  const currentUserMenu = layout.getUserMenuItems();
  console.log('Current user menu items:', currentUserMenu.length);

  // Add a new user menu item
  const newUserMenuItem: UserMenuItem = {
    id: 'billing',
    text: 'Billing & Usage',
    icon: 'payment',
    href: '/billing',
    type: 'link',
  };

  layout.addUserMenuItem(newUserMenuItem, 2); // Insert at position 2
  console.log('✅ Added new user menu item');

  // Update an existing user menu item
  layout.updateUserMenuItem('help', {
    text: 'Help Center',
    icon: 'help_center',
  });
  console.log('✅ Updated existing user menu item');

  // Add custom action user menu item
  const customActionItem: UserMenuItem = {
    id: 'export-data',
    text: 'Export Data',
    icon: 'download',
    action: 'export-data',
    type: 'action',
  };

  layout.addUserMenuItem(customActionItem, 3);
  console.log('✅ Added custom action user menu item');
}

// =================================================================================
// Example 4: Using Layout Methods for Page Components
// =================================================================================

function demonstratePageIntegration(layout: Layout) {
  console.log('📄 Example 4: Page component integration...');

  // Get navigation items for a sidebar component (what page components would do)
  const navForSidebar = layout.getNavigationForSidebar();
  console.log('Navigation items for sidebar:', navForSidebar.length);

  // Get user menu items for header component
  const userMenuForHeader = layout.getUserMenuForHeader();
  console.log('User menu items for header:', userMenuForHeader.length);

  // Simulate page navigation - setting active item
  layout.setActiveNavigationItem('analytics');
  console.log('✅ Set active navigation item for current page');

  // Remove a navigation item (e.g., user doesn't have permission)
  layout.removeNavigationItem('settings');
  console.log('✅ Removed settings navigation item');

  // Remove a user menu item
  layout.removeUserMenuItem('billing');
  console.log('✅ Removed billing user menu item');
}

// =================================================================================
// Example 5: Complete Layout Setup and Initialization
// =================================================================================

async function completeLayoutExample() {
  console.log('🚀 Example 5: Complete layout setup and initialization...');

  // Create layout with configuration
  const layout = createLayoutWithConfiguration();

  // Perform dynamic navigation management
  demonstrateNavigationManagement(layout);

  // Perform dynamic user menu management
  demonstrateUserMenuManagement(layout);

  // Initialize the layout
  try {
    await layout.init();
    console.log('✅ Layout initialized successfully');

    // Demonstrate page integration after initialization
    demonstratePageIntegration(layout);

    console.log('🎉 Complete layout example finished successfully!');
  } catch (error) {
    console.error('❌ Layout initialization failed:', error);
  }
}

// =================================================================================
// Export for use in other examples
// =================================================================================

export {
  createLayoutWithConfiguration,
  demonstrateNavigationManagement,
  demonstrateUserMenuManagement,
  demonstratePageIntegration,
  completeLayoutExample,
};

// Run the complete example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  (window as any).layoutNavigationExample = {
    createLayoutWithConfiguration,
    demonstrateNavigationManagement,
    demonstrateUserMenuManagement,
    demonstratePageIntegration,
    completeLayoutExample,
  };

  // Auto-run complete example
  completeLayoutExample();
}
