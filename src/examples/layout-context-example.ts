/**
 * Layout Context System - Usage Example and Documentation
 * 
 * This example demonstrates how to use the new layout context system for 
 * coordinating sidebar dimensions across all layout components.
 */

import LayoutContext, { LayoutEvent, SidebarDimensions } from '../contexts/LayoutContext.js';
import { Sidebar } from '../components/Sidebar.js';
import { AppHeader } from '../components/AppHeader.js';
import { AppFooter } from '../components/AppFooter.js';
import { MainContent } from '../components/MainContent.js';

/**
 * Example: Basic Layout Context Usage
 */
export function basicLayoutContextUsage() {
  console.log('=== Layout Context Basic Usage Example ===');
  
  // Get the singleton layout context instance
  const layoutContext = LayoutContext.getInstance();
  
  // Subscribe to sidebar dimension changes
  const unsubscribe = layoutContext.subscribe(
    'sidebar-dimensions-change',
    (event: LayoutEvent) => {
      const dimensions = event.data as SidebarDimensions;
      console.log('Received sidebar dimensions change:', dimensions);
      
      // Your component can respond to the change here
      updateYourComponentLayout(dimensions);
    }
  );
  
  // Simulate sidebar dimension change (normally done by Sidebar component)
  layoutContext.updateSidebarDimensions({
    width: 280,
    rightBorder: 280,
    isCompact: false,
    isMobile: false,
    isVisible: true
  });
  
  // Clean up when done
  // unsubscribe();
}

/**
 * Example: How Sidebar publishes dimension changes
 */
export function sidebarPublishingExample() {
  console.log('=== Sidebar Publishing Example ===');
  
  const sidebar = new Sidebar();
  
  // Initialize sidebar - this automatically publishes initial dimensions
  sidebar.init();
  
  // Toggle compact mode - this triggers dimension change event
  sidebar.toggleCompactMode();
  
  // The sidebar automatically publishes its current dimensions to the layout context:
  // - When initialized
  // - When compact mode changes
  // - When viewport changes (responsive behavior)
}

/**
 * Example: How components subscribe to layout events
 */
export function componentSubscriptionExample() {
  console.log('=== Component Subscription Example ===');
  
  // All layout components now automatically subscribe to layout context events
  const header = new AppHeader();
  const footer = new AppFooter();
  const mainContent = new MainContent();
  
  // When initialized, each component:
  // 1. Gets layout context instance
  // 2. Subscribes to relevant events
  // 3. Updates its layout when events are received
  // 4. Cleans up subscriptions when destroyed
  
  Promise.all([
    header.init(),
    footer.init(),
    mainContent.init()
  ]).then(() => {
    console.log('All components initialized and subscribed to layout context');
    
    // Now when sidebar changes dimensions, all components automatically update
    // No manual coordination needed!
  });
}

/**
 * Example: Complete layout initialization
 */
export function completeLayoutInitialization() {
  console.log('=== Complete Layout Initialization Example ===');
  
  // This is how the system works in practice:
  
  // 1. Layout context is created (singleton)
  const layoutContext = LayoutContext.getInstance();
  
  // 2. Components are initialized in order
  const sidebar = new Sidebar();
  const header = new AppHeader(); 
  const footer = new AppFooter();
  const mainContent = new MainContent();
  
  // 3. Each component subscribes to layout context during init
  Promise.all([
    sidebar.init(),     // Publishes initial dimensions
    header.init(),      // Subscribes to dimension changes
    footer.init(),      // Subscribes to dimension changes  
    mainContent.init()  // Subscribes to dimension changes
  ]).then(() => {
    // 4. Layout context marks layout as ready
    layoutContext.markReady();
    
    console.log('Complete layout system initialized!');
    
    // Now any sidebar changes automatically coordinate all components
    setTimeout(() => {
      console.log('Testing compact mode toggle...');
      sidebar.setCompactMode(true);
      // All components automatically update their layout!
    }, 2000);
    
    setTimeout(() => {
      console.log('Testing back to normal mode...');
      sidebar.setCompactMode(false);
      // All components automatically update again!
    }, 4000);
  });
}

/**
 * Example: Custom component subscribing to layout context
 */
export class CustomLayoutComponent {
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];
  
  constructor() {
    this.layoutContext = LayoutContext.getInstance();
  }
  
  init() {
    console.log('CustomLayoutComponent - Initializing...');
    
    // Subscribe to layout events
    this.subscribeToLayoutContext();
    
    console.log('CustomLayoutComponent - Ready');
  }
  
  private subscribeToLayoutContext() {
    // Subscribe to sidebar dimension changes
    const sidebarUnsubscribe = this.layoutContext.subscribe(
      'sidebar-dimensions-change',
      this.handleSidebarDimensionsChange.bind(this)
    );
    this.layoutUnsubscribers.push(sidebarUnsubscribe);
    
    // Subscribe to viewport changes
    const viewportUnsubscribe = this.layoutContext.subscribe(
      'viewport-change', 
      this.handleViewportChange.bind(this)
    );
    this.layoutUnsubscribers.push(viewportUnsubscribe);
    
    // Get current state for initial layout
    const currentState = this.layoutContext.getState();
    this.updateLayout(currentState.sidebar);
  }
  
  private handleSidebarDimensionsChange(event: LayoutEvent) {
    const dimensions = event.data as SidebarDimensions;
    console.log('CustomLayoutComponent - Sidebar dimensions changed:', dimensions);
    this.updateLayout(dimensions);
  }
  
  private handleViewportChange(event: LayoutEvent) {
    const viewport = event.data;
    console.log('CustomLayoutComponent - Viewport changed:', viewport);
    // Handle responsive changes
  }
  
  private updateLayout(dimensions: SidebarDimensions) {
    // Update your component's layout based on sidebar dimensions
    console.log(`CustomLayoutComponent - Updating layout: sidebar is ${
      dimensions.isCompact ? 'compact' : 'normal'
    } (${dimensions.width}px wide)`);
    
    // Example: Update component positioning
    const element = document.getElementById('my-custom-component');
    if (element) {
      if (dimensions.isMobile) {
        // Mobile: full width
        element.style.marginLeft = '0';
        element.style.width = '100%';
      } else {
        // Desktop: account for sidebar
        element.style.marginLeft = `${dimensions.rightBorder}px`;
        element.style.width = `calc(100% - ${dimensions.rightBorder}px)`;
      }
    }
  }
  
  destroy() {
    console.log('CustomLayoutComponent - Destroying...');
    
    // Clean up subscriptions
    this.layoutUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.layoutUnsubscribers = [];
  }
}

/**
 * Example: Using layout context to calculate responsive dimensions
 */
export function responsiveLayoutExample() {
  console.log('=== Responsive Layout Example ===');
  
  const layoutContext = LayoutContext.getInstance();
  
  // Get current viewport info
  const viewport = layoutContext.getViewport();
  console.log('Current viewport:', viewport);
  
  // Get current sidebar dimensions
  const sidebar = layoutContext.getSidebarDimensions();
  console.log('Current sidebar:', sidebar);
  
  // Calculate content area dimensions
  const contentArea = layoutContext.calculateContentArea();
  console.log('Available content area:', contentArea);
  
  // Subscribe to changes
  layoutContext.subscribe('viewport-change', (event) => {
    const newViewport = event.data;
    console.log('Viewport changed to:', newViewport);
    
    // Recalculate layout
    const newContentArea = layoutContext.calculateContentArea();
    console.log('New content area:', newContentArea);
  });
}

/**
 * Helper function for component layout updates
 */
function updateYourComponentLayout(dimensions: SidebarDimensions) {
  console.log('Updating component layout:', {
    sidebarWidth: dimensions.width,
    contentLeftMargin: dimensions.rightBorder,
    isCompactMode: dimensions.isCompact,
    isMobile: dimensions.isMobile,
    sidebarVisible: dimensions.isVisible
  });
  
  // Your layout update logic here
  const element = document.querySelector('.your-component');
  if (element && !dimensions.isMobile) {
    (element as HTMLElement).style.marginLeft = `${dimensions.rightBorder}px`;
  }
}

/**
 * Event flow diagram:
 * 
 * 1. Sidebar.setCompactMode(true)
 *    ↓
 * 2. Sidebar.publishCurrentDimensions()
 *    ↓
 * 3. LayoutContext.updateSidebarDimensions()
 *    ↓
 * 4. LayoutContext.emit('sidebar-dimensions-change')
 *    ↓
 * 5. All subscribed components receive the event:
 *    - AppHeader.handleSidebarDimensionsChange()
 *    - AppFooter.handleSidebarDimensionsChange()
 *    - MainContent.handleSidebarDimensionsChange()
 *    - Layout.handleSidebarDimensionsChange()
 *    - Any custom components...
 *    ↓
 * 6. Each component updates its own layout
 *    - Header adjusts position classes
 *    - Footer adjusts position classes
 *    - Content adjusts margin/width classes
 *    - Custom components run their update logic
 * 
 * Result: All components are automatically coordinated!
 */

export default {
  basicLayoutContextUsage,
  sidebarPublishingExample,
  componentSubscriptionExample,
  completeLayoutInitialization,
  CustomLayoutComponent,
  responsiveLayoutExample
};
