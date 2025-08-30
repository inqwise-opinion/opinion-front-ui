/**
 * Sidebar Dimension Logging Demo
 * 
 * This example demonstrates comprehensive dimension change logging
 * when the sidebar switches between compact and expanded modes.
 */

import { Sidebar } from '../components/Sidebar.js';
import LayoutContext from '../contexts/LayoutContext.js';

/**
 * Demo: Comprehensive sidebar dimension logging
 */
export function demonstrateDimensionLogging() {
  console.log('=== Sidebar Dimension Logging Demo ===');
  console.log('This demo will show detailed logs every time the sidebar dimensions change.');
  console.log('');
  
  const layoutContext = LayoutContext.getInstance();
  const sidebar = new Sidebar();
  
  // Initialize sidebar (this will trigger initial dimension publishing)
  console.log('🚀 Initializing sidebar...');
  sidebar.init();
  
  // Subscribe to layout changes to show how other components would receive updates
  const unsubscribe = layoutContext.subscribe('layout-mode-change', (event) => {
    const layoutMode = event.data;
    console.log('🎯 Layout Context - Mode change event received:');
    console.log(`   Type: ${layoutMode.type}`);
    console.log(`   Compact: ${layoutMode.isCompact}`);
    console.log(`   Sidebar Width: ${layoutMode.sidebar.width}px`);
    console.log(`   Sidebar Right Border: ${layoutMode.sidebar.rightBorder}px`);
    console.log(`   Content Area Left: ${layoutMode.content.left}px`);
    console.log(`   Content Area Width: ${layoutMode.content.width}px`);
    console.log('');
  });
  
  // Demonstrate various dimension changes with detailed logging
  demonstrateDimensionChanges(sidebar);
  
  // Cleanup after demo
  setTimeout(() => {
    unsubscribe();
    console.log('✅ Dimension logging demo completed!');
  }, 25000);
}

/**
 * Demonstrate various dimension changes
 */
function demonstrateDimensionChanges(sidebar: Sidebar) {
  console.log('🎬 Starting dimension change demonstration...');
  console.log('');
  
  // Step 1: Toggle to compact mode
  setTimeout(() => {
    console.log('🔧 STEP 1: Toggling to compact mode');
    console.log('━'.repeat(50));
    sidebar.toggleCompactMode();
    console.log('');
  }, 2000);
  
  // Step 2: Toggle back to expanded mode
  setTimeout(() => {
    console.log('🔧 STEP 2: Toggling back to expanded mode');
    console.log('━'.repeat(50));
    sidebar.toggleCompactMode();
    console.log('');
  }, 5000);
  
  // Step 3: Force compact using compactSidebar()
  setTimeout(() => {
    console.log('🔧 STEP 3: Force compact using compactSidebar()');
    console.log('━'.repeat(50));
    sidebar.compactSidebar();
    console.log('');
  }, 8000);
  
  // Step 4: Force expand using expandSidebar()
  setTimeout(() => {
    console.log('🔧 STEP 4: Force expand using expandSidebar()');
    console.log('━'.repeat(50));
    sidebar.expandSidebar();
    console.log('');
  }, 11000);
  
  // Step 5: Lock in expanded mode
  setTimeout(() => {
    console.log('🔧 STEP 5: Lock in expanded mode (should not change dimensions)');
    console.log('━'.repeat(50));
    sidebar.lockExpanded();
    console.log('');
  }, 14000);
  
  // Step 6: Try to compact when locked (should fail)
  setTimeout(() => {
    console.log('🔧 STEP 6: Try to compact when locked (should not change dimensions)');
    console.log('━'.repeat(50));
    sidebar.compactSidebar();
    console.log('');
  }, 17000);
  
  // Step 7: Unlock and compact
  setTimeout(() => {
    console.log('🔧 STEP 7: Unlock and compact');
    console.log('━'.repeat(50));
    sidebar.unlockSidebar();
    setTimeout(() => {
      sidebar.compactSidebar();
    }, 500);
    console.log('');
  }, 20000);
  
  // Step 8: Multiple rapid toggles (test performance)
  setTimeout(() => {
    console.log('🔧 STEP 8: Rapid toggles (testing performance logging)');
    console.log('━'.repeat(50));
    
    setTimeout(() => sidebar.toggleCompactMode(), 100);
    setTimeout(() => sidebar.toggleCompactMode(), 200);
    setTimeout(() => sidebar.toggleCompactMode(), 300);
    console.log('');
  }, 23000);
}

/**
 * Monitor viewport changes and their impact on sidebar dimensions
 */
export function monitorViewportChanges() {
  console.log('=== Viewport Change Monitoring ===');
  
  const sidebar = new Sidebar();
  sidebar.init();
  
  let previousViewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  // Monitor viewport changes
  window.addEventListener('resize', () => {
    const currentViewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const widthChange = currentViewport.width - previousViewport.width;
    const heightChange = currentViewport.height - previousViewport.height;
    
    console.log('🖼️  Viewport Change Detected:');
    console.log(`   Previous: ${previousViewport.width}x${previousViewport.height}`);
    console.log(`   Current: ${currentViewport.width}x${currentViewport.height}`);
    console.log(`   Change: ${widthChange >= 0 ? '+' : ''}${widthChange}x${heightChange >= 0 ? '+' : ''}${heightChange}`);
    
    const isMobileNow = currentViewport.width <= 768;
    const wasMobile = previousViewport.width <= 768;
    
    if (isMobileNow !== wasMobile) {\n      console.log(`   📱 Breakpoint Change: ${wasMobile ? 'Mobile' : 'Desktop'} → ${isMobileNow ? 'Mobile' : 'Desktop'}`);
      console.log('   Sidebar dimensions will be updated...');
    }
    
    previousViewport = currentViewport;
    console.log('');
  });
  
  console.log('👀 Resize the window to see viewport change logging');
  console.log(`📏 Current viewport: ${previousViewport.width}x${previousViewport.height}`);
}

/**
 * Performance monitoring for dimension changes
 */
export class DimensionPerformanceMonitor {
  private sidebar: Sidebar;
  private changeCount: number = 0;
  private totalTime: number = 0;
  private measurements: Array<{
    timestamp: number;
    operation: string;
    duration: number;
    previousWidth: number;
    newWidth: number;
  }> = [];
  
  constructor() {\n    this.sidebar = new Sidebar();
    this.sidebar.init();
    this.setupMonitoring();
  }
  
  private setupMonitoring() {
    // Monitor compact mode changes
    this.sidebar.onCompactModeChange((isCompact) => {
      const timestamp = Date.now();
      const operation = isCompact ? 'expand→compact' : 'compact→expand';
      const dimensions = this.sidebar.getCurrentDimensions();
      
      // Estimate duration (in real app, you'd use Performance API)
      const estimatedDuration = Math.abs(dimensions?.width === 80 ? 200 : 280) * 0.1; // Mock calculation
      
      this.measurements.push({
        timestamp,
        operation,
        duration: estimatedDuration,
        previousWidth: isCompact ? 280 : 80,
        newWidth: dimensions?.width || 0
      });
      
      this.changeCount++;
      this.totalTime += estimatedDuration;
      
      console.log('⚡ Performance Metrics:');
      console.log(`   Operation: ${operation}`);
      console.log(`   Estimated Duration: ${estimatedDuration.toFixed(1)}ms`);
      console.log(`   Total Changes: ${this.changeCount}`);
      console.log(`   Average Duration: ${(this.totalTime / this.changeCount).toFixed(1)}ms`);
      console.log('');
    });
  }
  
  /**\n   * Generate performance report
   */\n  generateReport() {\n    console.log('📊 Dimension Change Performance Report:');\n    console.log(`   Total Changes: ${this.changeCount}`);\n    console.log(`   Total Time: ${this.totalTime.toFixed(1)}ms`);\n    console.log(`   Average Duration: ${this.changeCount > 0 ? (this.totalTime / this.changeCount).toFixed(1) : 0}ms`);\n    \n    if (this.measurements.length > 0) {\n      console.log('   Recent Operations:');\n      this.measurements.slice(-5).forEach((measurement, index) => {\n        console.log(`     ${index + 1}. ${measurement.operation}: ${measurement.duration.toFixed(1)}ms (${measurement.previousWidth}px → ${measurement.newWidth}px)`);\n      });\n    }\n  }\n  \n  /**\n   * Test performance with multiple changes\n   */\n  testPerformance() {\n    console.log('🏃 Running performance test...');\n    \n    const operations = [\n      () => this.sidebar.toggleCompactMode(),\n      () => this.sidebar.expandSidebar(),\n      () => this.sidebar.compactSidebar(),\n      () => this.sidebar.toggleCompactMode(),\n      () => this.sidebar.lockExpanded(),\n      () => this.sidebar.unlockSidebar(),\n      () => this.sidebar.compactSidebar()\n    ];\n    \n    operations.forEach((operation, index) => {\n      setTimeout(() => {\n        operation();\n        if (index === operations.length - 1) {\n          setTimeout(() => this.generateReport(), 500);\n        }\n      }, index * 800);\n    });\n  }\n}\n\n/**\n * Analyze dimension changes and their layout impact\n */\nexport function analyzeDimensionImpact() {\n  console.log('=== Dimension Impact Analysis ===');\n  \n  const sidebar = new Sidebar();\n  sidebar.init();\n  \n  // Track layout impact\n  const layoutContext = LayoutContext.getInstance();\n  \n  layoutContext.subscribe('layout-mode-change', (event) => {\n    const layoutMode = event.data;\n    \n    console.log('🔍 Layout Impact Analysis:');\n    \n    // Analyze sidebar impact\n    console.log(`   Sidebar Impact:`);\n    console.log(`     Width: ${layoutMode.sidebar.width}px`);\n    console.log(`     Screen Usage: ${((layoutMode.sidebar.width / window.innerWidth) * 100).toFixed(1)}%`);\n    \n    // Analyze content area impact\n    console.log(`   Content Area Impact:`);\n    console.log(`     Available Width: ${layoutMode.content.width}px`);\n    console.log(`     Screen Usage: ${((layoutMode.content.width / window.innerWidth) * 100).toFixed(1)}%`);\n    console.log(`     Left Offset: ${layoutMode.content.left}px`);\n    \n    // Mobile vs Desktop analysis\n    const isMobile = window.innerWidth <= 768;\n    console.log(`   Device Analysis:`);\n    console.log(`     Type: ${isMobile ? 'Mobile' : 'Desktop'}`);\n    console.log(`     Viewport: ${window.innerWidth}x${window.innerHeight}`);\n    console.log(`     Sidebar Visible: ${layoutMode.sidebar.isVisible}`);\n    \n    // Efficiency analysis\n    if (!isMobile) {\n      const efficiency = (layoutMode.content.width / window.innerWidth) * 100;\n      console.log(`   Space Efficiency: ${efficiency.toFixed(1)}% for content`);\n      \n      if (efficiency < 70) {\n        console.log('   ⚠️  Low content space efficiency - consider compact mode');\n      } else if (efficiency > 85) {\n        console.log('   ✅ Good content space efficiency');\n      }\n    }\n    \n    console.log('');\n  });\n  \n  // Test different scenarios\n  console.log('Testing different sidebar scenarios...');\n  \n  setTimeout(() => {\n    console.log('📱 Scenario: Compact Mode');\n    sidebar.compactSidebar();\n  }, 1000);\n  \n  setTimeout(() => {\n    console.log('🖥️  Scenario: Expanded Mode');\n    sidebar.expandSidebar();\n  }, 3000);\n}\n\n/**\n * Usage examples and best practices\n */\nexport function showDimensionLoggingExamples() {\n  console.log('=== Dimension Logging Examples ===');\n  \n  console.log('📝 The sidebar now logs comprehensive dimension data:');\n  console.log('');\n  \n  console.log('🔍 What gets logged:');\n  console.log('   • Mode transitions (compact ↔ expanded)');\n  console.log('   • Exact pixel changes (width, right border)');\n  console.log('   • Viewport information (size, mobile/desktop)');\n  console.log('   • Content area impact (space gained/lost)');\n  console.log('   • Performance metrics (transition details)');\n  console.log('   • Layout grid changes (CSS class updates)');\n  console.log('   • Component listener count');\n  console.log('');\n  \n  console.log('📊 Example log output:');\n  console.log('   🔄 Sidebar - Compact mode changing: expanded → compact');\n  console.log('   📐 Sidebar - Dimension Changes:');\n  console.log('      Mode: Expanded → Compact');\n  console.log('      Width: 280px → 80px (-200px)');\n  console.log('      Right Border: 280px → 80px (-200px)');\n  console.log('      Viewport: 1440x900 (Desktop)');\n  console.log('      📊 Content Area Impact: +200px more space');\n  console.log('      ⚡ Transition: 200px change with CSS animation');\n  console.log('      🎯 Layout Grid: Compact mode applied');\n  console.log('      🔄 Layout Context: Publishing dimensions to 3 listeners');\n  console.log('   ✅ Sidebar - Compact mode enabled');\n  console.log('');\n  \n  console.log('🎯 Use cases for this logging:');\n  console.log('   • Debug layout issues');\n  console.log('   • Monitor performance');\n  console.log('   • Track user interactions');\n  console.log('   • Validate responsive behavior');\n  console.log('   • Analyze space usage efficiency');\n}\n\nexport default {\n  demonstrateDimensionLogging,\n  monitorViewportChanges,\n  DimensionPerformanceMonitor,\n  analyzeDimensionImpact,\n  showDimensionLoggingExamples\n};
