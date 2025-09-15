/**
 * Mobile Menu Toggle Event Demo
 * Demonstrates the new mobile menu toggle events and functionality
 */

import { getLayoutContext } from '../contexts';
import { LayoutEventFactory, isMobileMenuToggleEvent } from '../contexts/LayoutEventFactory';
import type { LayoutEvent } from '../contexts/LayoutContext';

/**
 * Demo: Mobile Menu Toggle Events
 * Shows how to listen for and handle mobile menu toggle events
 */
export function demonstrateMobileMenuToggleEvents() {
  console.log('🚀 Mobile Menu Toggle Event Demo Starting...');
  
  const layoutContext = getLayoutContext();
  
  // Subscribe to mobile menu toggle events
  const unsubscribe = layoutContext.subscribe('mobile-menu-toggle', (event: LayoutEvent) => {
    if (isMobileMenuToggleEvent(event)) {
      const data = event.data;
      
      console.log('📱 Mobile Menu Toggle Event Received:');
      console.log(`  Action: ${data.action}`);
      console.log(`  Trigger: ${data.trigger}`);
      console.log(`  Visibility: ${data.previousVisibility} → ${data.isVisible}`);
      
      // Demonstrate using the factory for formatting
      const formattedEvent = LayoutEventFactory.formatEventDataForLogging(event);
      console.log(`  Formatted: ${formattedEvent}`);
      
      // Get badge for event type
      const badge = LayoutEventFactory.getEventBadge('mobile-menu-toggle');
      console.log(`  Badge: ${badge}`);
      
      // Handle different trigger types
      switch (data.trigger) {
        case 'menu-button':
          console.log('  → Triggered by header hamburger menu button');
          break;
        case 'close-button':
          console.log('  → Triggered by sidebar close button (X)');
          break;
        case 'backdrop':
          console.log('  → Triggered by clicking on backdrop overlay');
          break;
        case 'programmatic':
          console.log('  → Triggered programmatically via API');
          break;
      }
    }
  });
  
  // Get the sidebar instance for testing
  const sidebar = layoutContext.getSidebar();
  if (!sidebar) {
    console.warn('❌ No sidebar registered in LayoutContext');
    return;
  }
  
  // Demo different ways to trigger mobile menu events
  console.log('\n🎯 Testing different mobile menu triggers...');
  
  // Only test on mobile layout
  if (layoutContext.isLayoutMobile()) {
    console.log('📱 Mobile layout detected - testing mobile menu functionality');
    
    setTimeout(() => {
      console.log('\n1️⃣ Testing showMobileMenu with menu-button trigger');
      sidebar.showMobileMenu('menu-button');
    }, 1000);
    
    setTimeout(() => {
      console.log('\n2️⃣ Testing hideMobileMenu with close-button trigger');
      sidebar.hideMobileMenu('close-button');
    }, 3000);
    
    setTimeout(() => {
      console.log('\n3️⃣ Testing toggleMobileVisibility with programmatic trigger');
      sidebar.toggleMobileVisibility('programmatic');
    }, 5000);
    
    setTimeout(() => {
      console.log('\n4️⃣ Testing hideMobileMenu with backdrop trigger');
      sidebar.hideMobileMenu('backdrop');
    }, 7000);
    
  } else {
    console.log('📱 Not in mobile layout - mobile menu functionality is disabled');
    console.log('💡 Resize your browser to mobile width (≤768px) to test mobile menu events');
    
    // Test that mobile menu methods are blocked on non-mobile layouts
    console.log('\n🚫 Testing mobile menu blocking on non-mobile layout:');
    sidebar.showMobileMenu('programmatic'); // Should be blocked
  }
  
  // Stop demo after 10 seconds
  setTimeout(() => {
    unsubscribe();
    console.log('✅ Mobile Menu Toggle Event Demo Completed');
  }, 10000);
}

/**
 * Demo: Event Validation
 * Shows how to validate mobile menu toggle events
 */
export function demonstrateEventValidation() {
  console.log('\n🔍 Mobile Menu Event Validation Demo');
  
  // Create a valid mobile menu toggle event
  const validEvent = LayoutEventFactory.createMobileMenuToggleEvent(
    true,
    false,
    'show',
    'menu-button'
  );
  
  console.log('✅ Valid event created:', validEvent);
  console.log('✅ Validation result:', LayoutEventFactory.validateEventData(validEvent));
  
  // Create an invalid event (missing required properties)
  const invalidEvent = {
    type: 'mobile-menu-toggle' as const,
    data: {
      isVisible: true,
      // Missing required properties
    },
    timestamp: Date.now(),
  };
  
  console.log('❌ Invalid event:', invalidEvent);
  console.log('❌ Validation result:', LayoutEventFactory.validateEventData(invalidEvent as any));
}

/**
 * Demo: Event Formatting
 * Shows different formatting options for mobile menu events
 */
export function demonstrateEventFormatting() {
  console.log('\n🎨 Mobile Menu Event Formatting Demo');
  
  const scenarios = [
    { isVisible: true, previousVisibility: false, action: 'show' as const, trigger: 'menu-button' as const },
    { isVisible: false, previousVisibility: true, action: 'hide' as const, trigger: 'close-button' as const },
    { isVisible: true, previousVisibility: false, action: 'toggle' as const, trigger: 'backdrop' as const },
    { isVisible: false, previousVisibility: true, action: 'hide' as const, trigger: 'programmatic' as const },
  ];
  
  scenarios.forEach((scenario, index) => {
    const event = LayoutEventFactory.createMobileMenuToggleEvent(
      scenario.isVisible,
      scenario.previousVisibility,
      scenario.action,
      scenario.trigger
    );
    
    const formatted = LayoutEventFactory.formatEventDataForLogging(event);
    const badge = LayoutEventFactory.getEventBadge('mobile-menu-toggle');
    
    console.log(`${index + 1}. ${badge} mobile-menu-toggle ${formatted}`);
  });
}

/**
 * Run all mobile menu toggle demos
 */
export function runMobileMenuToggleDemo() {
  console.log('🎪 Starting Mobile Menu Toggle Demo Suite...\n');
  
  demonstrateEventValidation();
  demonstrateEventFormatting();
  demonstrateMobileMenuToggleEvents();
}

// Export individual functions for selective testing
export {
  demonstrateMobileMenuToggleEvents,
  demonstrateEventValidation,
  demonstrateEventFormatting,
};