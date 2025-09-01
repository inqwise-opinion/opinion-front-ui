/**
 * Layout Mode Change System - Example and Documentation
 * 
 * This example demonstrates the new layout-mode-change event system
 * that automatically manages CSS classes for all layout components.
 */

import LayoutContextImpl, { LayoutEvent, LayoutMode, LayoutModeType } from '../contexts/LayoutContextImpl.js';
import { Layout } from '../components/Layout.js';
import { Sidebar } from '../components/Sidebar.js';

/**
 * Demonstrates the layout mode change system
 */
export function demonstrateLayoutModeChanges() {
  console.log('=== Layout Mode Change System Demo ===');
  
  const layoutContext = LayoutContextImpl.getInstance();
  
  // Subscribe to layout mode changes to observe the system
  const unsubscribe = layoutContext.subscribe('layout-mode-change', (event: LayoutEvent) => {
    const layoutMode = event.data as LayoutMode;
    console.log('🎯 Layout Mode Changed:', {
      type: layoutMode.type,
      isCompact: layoutMode.isCompact,
      viewport: `${layoutMode.viewport.width}x${layoutMode.viewport.height}`,
      sidebarWidth: layoutMode.sidebar.width
    });
    
    // Show what CSS classes would be applied
    showAppliedCSSClasses(layoutMode);
  });
  
  console.log('✅ Subscribed to layout mode changes');
  
  // Test different scenarios
  setTimeout(() => testDesktopModes(), 1000);
  setTimeout(() => testTabletMode(), 3000);
  setTimeout(() => testMobileMode(), 5000);
  setTimeout(() => testBackToDesktop(), 7000);
  setTimeout(() => {
    unsubscribe();
    console.log('🏁 Demo completed');
  }, 9000);
}

/**
 * Test desktop layout modes (normal and compact)
 */
function testDesktopModes() {
  console.log('🖥️  Testing Desktop Modes...');
  
  const layoutContext = LayoutContextImpl.getInstance();
  
  // Test desktop normal mode
  layoutContext.updateSidebarDimensions({
    width: 280,
    rightBorder: 280,
    isCompact: false,
    isMobile: false,
    isVisible: true
  });
  
  setTimeout(() => {
    // Test desktop compact mode
    console.log('🔄 Switching to compact mode...');
    layoutContext.updateSidebarDimensions({
      width: 80,
      rightBorder: 80,
      isCompact: true,
      isMobile: false,
      isVisible: true
    });
  }, 1000);
}

/**
 * Test tablet mode
 */
function testTabletMode() {
  console.log('📱 Testing Tablet Mode...');
  
  // Simulate tablet viewport
  simulateViewportChange(900, 600);
}

/**
 * Test mobile mode
 */
function testMobileMode() {
  console.log('📱 Testing Mobile Mode...');
  
  // Simulate mobile viewport
  simulateViewportChange(375, 667);
}

/**
 * Test back to desktop
 */
function testBackToDesktop() {
  console.log('🖥️  Testing Back to Desktop...');
  
  // Simulate desktop viewport
  simulateViewportChange(1200, 800);
}

/**
 * Simulate viewport change for testing
 */
function simulateViewportChange(width: number, height: number) {
  // Temporarily override window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
}

/**
 * Show what CSS classes are applied for a given layout mode
 */
function showAppliedCSSClasses(layoutMode: LayoutMode) {
  const { type, isCompact, isMobile, isTablet, isDesktop } = layoutMode;
  
  const modeClasses = {
    mobile: 'layout-mode-mobile',
    tablet: 'layout-mode-tablet',
    desktop: 'layout-mode-desktop',
    'desktop-compact': 'layout-mode-desktop-compact'
  };
  
  const stateClasses = {
    compact: 'layout-compact',
    mobile: 'layout-mobile',
    tablet: 'layout-tablet',
    desktop: 'layout-desktop'
  };
  
  const appliedClasses = [
    modeClasses[type],
    ...(isCompact ? [stateClasses.compact] : []),
    ...(isMobile ? [stateClasses.mobile] : []),
    ...(isTablet ? [stateClasses.tablet] : []),
    ...(isDesktop ? [stateClasses.desktop] : [])
  ];
  
  console.log('📐 CSS Classes Applied:', {
    components: ['body', '.app-layout', '.app-sidebar', '.app-header', '.app-main', '.app-footer'],
    classes: appliedClasses,
    cssVariables: {
      '--layout-mode': type,
      '--is-compact': isCompact ? '1' : '0',
      '--is-mobile': isMobile ? '1' : '0',
      '--is-tablet': isTablet ? '1' : '0',
      '--is-desktop': isDesktop ? '1' : '0'
    }
  });
}

/**
 * Example of a custom component that responds to layout mode changes
 */
export class ResponsiveComponent {
  private element: HTMLElement;
  private layoutContext: LayoutContextImpl;
  private unsubscribe: (() => void) | null = null;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.layoutContext = LayoutContextImpl.getInstance();
  }
  
  init() {
    console.log('ResponsiveComponent - Initializing...');
    
    // Subscribe to layout mode changes
    this.unsubscribe = this.layoutContext.subscribe(
      'layout-mode-change',
      this.handleLayoutModeChange.bind(this)
    );
    
    // Set initial layout
    const currentMode = this.layoutContext.getLayoutMode();
    this.updateLayout(currentMode);
    
    console.log('ResponsiveComponent - Ready');
  }
  
  private handleLayoutModeChange(event: LayoutEvent) {
    const layoutMode = event.data as LayoutMode;
    console.log('ResponsiveComponent - Layout mode changed:', layoutMode.type);
    this.updateLayout(layoutMode);
  }
  
  private updateLayout(layoutMode: LayoutMode) {
    const { type, isCompact, isMobile, isTablet, isDesktop } = layoutMode;
    
    // Remove all layout mode classes
    const modeClasses = ['layout-mode-mobile', 'layout-mode-tablet', 'layout-mode-desktop', 'layout-mode-desktop-compact'];
    const stateClasses = ['layout-compact', 'layout-mobile', 'layout-tablet', 'layout-desktop'];
    
    [...modeClasses, ...stateClasses].forEach(className => {
      this.element.classList.remove(className);
    });
    
    // Add current classes
    this.element.classList.add(`layout-mode-${type}`);
    if (isCompact) this.element.classList.add('layout-compact');
    if (isMobile) this.element.classList.add('layout-mobile');
    if (isTablet) this.element.classList.add('layout-tablet');
    if (isDesktop) this.element.classList.add('layout-desktop');
    
    // Custom layout logic based on mode
    switch (type) {
      case 'mobile':
        this.element.style.padding = '16px';
        this.element.style.fontSize = '14px';
        break;
      case 'tablet':
        this.element.style.padding = '20px';
        this.element.style.fontSize = '16px';
        break;
      case 'desktop':
        this.element.style.padding = '24px';
        this.element.style.fontSize = '18px';
        break;
      case 'desktop-compact':
        this.element.style.padding = '24px';
        this.element.style.fontSize = '18px';
        this.element.style.marginLeft = '80px'; // Account for compact sidebar
        break;
    }
    
    console.log(`ResponsiveComponent - Updated for ${type} mode`);
  }
  
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

/**
 * Demonstrates the complete integration with Layout component
 */
export async function demonstrateCompleteIntegration() {
  console.log('=== Complete Layout Mode Integration Demo ===');
  
  // Initialize the layout system
  const layout = new Layout();
  await layout.init();
  
  console.log('✅ Layout system initialized with mode management');
  
  // Create a test component
  const testElement = document.createElement('div');
  testElement.className = 'test-responsive-component';
  testElement.textContent = 'I am a responsive component';
  testElement.style.cssText = `
    background: #f0f9ff;
    border: 2px solid #0ea5e9;
    border-radius: 8px;
    padding: 16px;
    margin: 16px;
    transition: all 0.3s ease;
  `;
  document.body.appendChild(testElement);
  
  const responsiveComponent = new ResponsiveComponent(testElement);
  responsiveComponent.init();
  
  // Test layout modes
  const sidebar = new Sidebar();
  await sidebar.init();
  
  console.log('🔄 Testing layout mode changes...');
  
  // Test compact mode
  setTimeout(() => {
    console.log('Testing compact mode...');
    sidebar.setCompactMode(true);
  }, 2000);
  
  // Test mobile simulation
  setTimeout(() => {
    console.log('Testing mobile mode...');
    simulateViewportChange(375, 667);
  }, 4000);
  
  // Test back to desktop
  setTimeout(() => {
    console.log('Testing back to desktop...');
    simulateViewportChange(1200, 800);
    sidebar.setCompactMode(false);
  }, 6000);
  
  // Cleanup
  setTimeout(() => {
    responsiveComponent.destroy();
    testElement.remove();
    console.log('🏁 Complete integration demo finished');
  }, 8000);
}

/**
 * Event Flow Documentation
 */
export function documentEventFlow() {
  console.log('=== Layout Mode Change Event Flow ===');
  console.log(`
1. User Action (e.g., sidebar toggle, window resize)
   ↓
2. Sidebar.setCompactMode() OR viewport change detected
   ↓  
3. LayoutContext.updateSidebarDimensions() OR handleViewportChange()
   ↓
4. LayoutContext.calculateLayoutMode() determines new mode:
   - 'mobile' (viewport ≤ 768px)
   - 'tablet' (768px < viewport ≤ 1024px)  
   - 'desktop' (viewport > 1024px, sidebar normal)
   - 'desktop-compact' (viewport > 1024px, sidebar compact)
   ↓
5. LayoutContext.emitLayoutModeChange() fires event
   ↓
6. Layout.handleLayoutModeChange() receives event
   ↓
7. Layout.updateComponentCSSClasses() applies classes:
   
   Components Updated:
   - .app-layout
   - .app-sidebar  
   - .app-header
   - .app-main/.app-content-scroll
   - .app-footer
   - document.body
   
   CSS Classes Applied:
   - Mode classes: .layout-mode-{mobile|tablet|desktop|desktop-compact}
   - State classes: .layout-{compact|mobile|tablet|desktop}
   
   CSS Variables Set:
   - --layout-mode
   - --is-compact
   - --is-mobile
   - --is-tablet  
   - --is-desktop
   ↓
8. Custom 'layout-mode-updated' event dispatched
   ↓
9. All components automatically styled via CSS!

✨ Result: Automatic, coordinated layout adaptation across all components
  `);
}

export default {
  demonstrateLayoutModeChanges,
  ResponsiveComponent,
  demonstrateCompleteIntegration,
  documentEventFlow
};
