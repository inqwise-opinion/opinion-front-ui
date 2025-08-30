/**
 * Sidebar Tooltips and Expand/Lock Demo
 * 
 * This example demonstrates:
 * - Native title tooltips on all menu items
 * - Custom CSS tooltips in compact mode
 * - Expanding sidebar and locking it in expanded mode
 * - Preventing sidebar from returning to compact mode
 */

import { Sidebar } from '../components/Sidebar.js';
import LayoutContext from '../contexts/LayoutContext.js';

/**
 * Demo: Sidebar tooltips and expand/lock functionality
 */
export function demonstrateSidebarTooltips() {
  console.log('=== Sidebar Tooltips & Expand/Lock Demo ===');
  
  const layoutContext = LayoutContext.getInstance();
  const sidebar = new Sidebar();
  
  // Initialize sidebar
  sidebar.init();
  
  console.log('✅ Sidebar initialized with tooltips');
  
  // Subscribe to layout mode changes
  const unsubscribe = layoutContext.subscribe('layout-mode-change', (event) => {
    const layoutMode = event.data;
    console.log(`🎯 Layout changed: ${layoutMode.type}, Compact: ${layoutMode.isCompact}, Locked: ${sidebar.isLocked()}`);
  });
  
  // Show tooltip features
  setTimeout(() => showTooltipFeatures(), 1000);
  
  // Demonstrate expand and lock functionality
  setTimeout(() => demonstrateExpandLock(sidebar), 3000);
  
  // Cleanup after demo
  setTimeout(() => {
    unsubscribe();
    console.log('Demo completed!');
  }, 15000);
}

/**
 * Show tooltip features and instructions
 */
function showTooltipFeatures() {
  console.log('🏷️ Tooltip Features:');
  console.log('   • Hover over menu items to see native tooltips (works in both modes)');
  console.log('   • In compact mode, hover shows enhanced tooltips with descriptions');
  console.log('   • Tooltips include both menu title and caption text');
  console.log('   • Custom positioning and styling for better UX');
  console.log('');
  console.log('📝 Try this:');
  console.log('   1. Hover over any menu item to see the tooltip');
  console.log('   2. Toggle to compact mode and hover again');
  console.log('   3. Notice the enhanced tooltips in compact mode');
}

/**
 * Demonstrate expand and lock functionality
 */
function demonstrateExpandLock(sidebar: Sidebar) {
  console.log('🔒 Expand & Lock Demonstration:');
  
  // Step 1: Show current state
  console.log(`1. Current state - Compact: ${sidebar.isCompactMode()}, Locked: ${sidebar.isLocked()}`);
  
  setTimeout(() => {
    // Step 2: Expand sidebar
    console.log('2. Expanding sidebar...');
    sidebar.expandSidebar();
  }, 2000);
  
  setTimeout(() => {
    // Step 3: Lock sidebar in expanded mode
    console.log('3. Locking sidebar in expanded mode...');
    sidebar.lockExpanded();
    console.log('   • Try clicking the toggle button - it should be disabled');
    console.log('   • Hover over toggle button to see "locked" message');
  }, 4000);
  
  setTimeout(() => {
    // Step 4: Try to compact (should fail)
    console.log('4. Attempting to compact locked sidebar...');
    sidebar.compactSidebar(); // This should not work when locked
  }, 6000);
  
  setTimeout(() => {
    // Step 5: Unlock and demonstrate normal behavior
    console.log('5. Unlocking sidebar...');
    sidebar.unlockSidebar();
    console.log('   • Toggle button is now functional again');
  }, 8000);
  
  setTimeout(() => {
    // Step 6: Show normal toggle works again
    console.log('6. Testing normal toggle behavior...');
    sidebar.toggleCompactMode();
  }, 10000);
}

/**
 * Create custom navigation with rich tooltips
 */
export function createRichNavigationDemo() {
  console.log('=== Rich Navigation Demo ===');
  
  const sidebar = new Sidebar();
  sidebar.init();
  
  // Add navigation with rich captions for better tooltips
  const richNavigation = [
    {
      id: 'dashboard',
      text: 'Dashboard',
      icon: 'dashboard',
      href: '/dashboard',
      caption: 'View analytics, reports, and key performance metrics',
      active: true
    },
    {
      id: 'surveys',
      text: 'Surveys',
      icon: 'poll',
      href: '/surveys',
      caption: 'Create, manage, and analyze survey questionnaires'
    },
    {
      id: 'analytics',
      text: 'Analytics',
      icon: 'analytics',
      href: '/analytics',
      caption: 'Deep insights and data visualization tools'
    },
    {
      id: 'users',
      text: 'User Management',
      icon: 'people',
      href: '/users',
      caption: 'Manage user accounts, permissions, and roles'
    },
    {
      id: 'settings',
      text: 'Settings',
      icon: 'settings',
      href: '/settings',
      caption: 'Application configuration and preferences'
    }
  ];
  
  sidebar.updateNavigation(richNavigation);
  
  console.log('✅ Rich navigation loaded with detailed captions');
  console.log('📝 Hover over menu items to see enhanced tooltips!');
  
  return sidebar;
}

/**
 * Test tooltip accessibility
 */
export function testTooltipAccessibility() {
  console.log('=== Tooltip Accessibility Test ===');
  
  console.log('🔍 Testing accessibility features...');
  
  // Check if tooltips are properly implemented
  const menuItems = document.querySelectorAll('.nav-link[title]');
  
  console.log(`✅ Found ${menuItems.length} menu items with title attributes`);
  
  menuItems.forEach((item, index) => {
    const title = item.getAttribute('title');
    const navId = item.getAttribute('data-nav-id');
    console.log(`   ${index + 1}. ${navId}: "${title}"`);
  });
  
  console.log('');
  console.log('♿ Accessibility Features:');
  console.log('   • Native title attributes work with screen readers');
  console.log('   • Tooltips appear on hover and keyboard focus');
  console.log('   • High contrast colors for better visibility');
  console.log('   • Proper z-index layering');
  console.log('   • Non-intrusive positioning');
  
  console.log('');
  console.log('⌨️  Keyboard Testing:');
  console.log('   • Tab through menu items to see focus tooltips');
  console.log('   • Focus management works with native tooltips');
  console.log('   • Screen readers announce tooltip content');
}

/**
 * Example: Programmatic sidebar control
 */
export class SidebarController {
  private sidebar: Sidebar;
  private isLocked: boolean = false;
  
  constructor() {
    this.sidebar = new Sidebar();
    this.sidebar.init();
  }
  
  /**
   * Expand and lock sidebar (e.g., when user needs to see full content)
   */
  enterDetailMode() {
    console.log('📋 Entering detail mode - expanding and locking sidebar');
    this.sidebar.lockExpanded();
    this.isLocked = true;
    
    // Notify user
    this.showNotification('Sidebar locked in expanded mode for better readability');
  }
  
  /**
   * Unlock sidebar (e.g., when leaving detail view)
   */
  exitDetailMode() {
    console.log('🔓 Exiting detail mode - unlocking sidebar');
    this.sidebar.unlockSidebar();
    this.isLocked = false;
    
    // Notify user
    this.showNotification('Sidebar unlocked - you can now toggle between modes');
  }
  
  /**
   * Smart toggle - expands if compact, locks if already expanded
   */
  smartToggle() {
    if (this.sidebar.isCompactMode()) {
      this.sidebar.expandSidebar();
      console.log('Smart toggle: Expanded sidebar');
    } else if (!this.isLocked) {
      this.sidebar.lockExpanded();
      this.isLocked = true;
      console.log('Smart toggle: Locked sidebar in expanded mode');
    } else {
      this.sidebar.unlockSidebar();
      this.isLocked = false;
      console.log('Smart toggle: Unlocked sidebar');
    }
  }
  
  /**
   * Get current sidebar state for UI updates
   */
  getState() {
    return {
      isCompact: this.sidebar.isCompactMode(),
      isLocked: this.sidebar.isLocked(),
      isExpanded: !this.sidebar.isCompactMode()
    };
  }
  
  private showNotification(message: string) {
    console.log(`🔔 ${message}`);
    // In real app, you'd show a toast or similar UI notification
  }
}

/**
 * Usage examples
 */
export function showUsageExamples() {
  console.log('=== Usage Examples ===');
  
  console.log('📝 Basic Usage:');
  console.log(`
    const sidebar = new Sidebar();
    sidebar.init();
    
    // Expand sidebar
    sidebar.expandSidebar();
    
    // Lock in expanded mode
    sidebar.lockExpanded();
    
    // Check state
    console.log(sidebar.isLocked()); // true
    console.log(sidebar.isCompactMode()); // false
  `);
  
  console.log('🎮 Advanced Control:');
  console.log(`
    const controller = new SidebarController();
    
    // Enter detail mode (expand + lock)
    controller.enterDetailMode();
    
    // Smart toggle behavior
    controller.smartToggle();
    
    // Get current state
    const state = controller.getState();
  `);
  
  console.log('🏷️ Rich Tooltips:');
  console.log(`
    const navigation = [
      {
        id: 'item1',
        text: 'Menu Item',
        icon: 'icon_name',
        href: '/path',
        caption: 'Detailed description for tooltip' // This enhances tooltips!
      }
    ];
    
    sidebar.updateNavigation(navigation);
  `);
}

export default {
  demonstrateSidebarTooltips,
  createRichNavigationDemo,
  testTooltipAccessibility,
  SidebarController,
  showUsageExamples
};
