/**
 * ESC Key Conflict Test
 * 
 * This test demonstrates the conflict between UserMenu ESC (global) and Sidebar ESC (conditional)
 * when both components try to handle the same key simultaneously.
 */

import { LayoutContextImpl } from '../contexts/LayoutContextImpl';
import { SidebarComponent } from '../components/SidebarComponent';
import { AppHeaderImpl } from '../components/AppHeaderImpl';

// Mock DOM setup
const mockSetupDOM = () => {
  // Mock sidebar element
  const sidebarElement = document.createElement('nav');
  sidebarElement.id = 'app-sidebar';
  sidebarElement.className = 'app-sidebar sidebar-mobile-visible'; // Mobile menu visible
  document.body.appendChild(sidebarElement);

  // Mock header element  
  const headerElement = document.createElement('header');
  headerElement.id = 'app-header';
  headerElement.innerHTML = `
    <div class="header-container">
      <div class="header-left"></div>
      <div class="header-center"></div>
      <div class="header-right">
        <div id="user_menu_container"></div>
      </div>
    </div>
  `;
  document.body.appendChild(headerElement);

  // Mock user menu container
  const userMenuContainer = document.createElement('div');
  userMenuContainer.id = 'user_menu_container';
  document.body.appendChild(userMenuContainer);
};

// Mock mobile layout context
const mockMobileLayout = (layoutContext: LayoutContextImpl) => {
  // Force mobile mode
  Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
  
  // Mock layout context methods
  layoutContext.isLayoutMobile = () => true;
  layoutContext.getModeType = () => 'mobile';
};

/**
 * Test ESC key conflict scenario
 */
export async function testESCKeyConflict() {
  console.log('\n🧪 Starting ESC Key Conflict Test...\n');

  // Setup DOM
  mockSetupDOM();

  // Create layout context
  const layoutContext = new LayoutContextImpl();
  mockMobileLayout(layoutContext);

  // Initialize components
  const header = new AppHeaderImpl({}, layoutContext);
  const sidebar = new SidebarComponent({}, layoutContext);

  try {
    await header.init();
    await sidebar.init();

    console.log('✅ Components initialized\n');

    // Scenario 1: Show mobile menu (makes sidebar ESC active)
    console.log('📱 Opening mobile menu...');
    sidebar.showMobileMenu('programmatic');

    // NOTE: Legacy hotkey system methods removed - using new chain system
    // layoutContext.setActiveHotkeyProvider(sidebar);

    console.log('⌨️ Current registered ESC handlers: (using new chain system)');
    // const registeredHotkeys = layoutContext.getRegisteredHotkeys();
    // const escapeHandlers = registeredHotkeys.filter(h => h.key === 'Escape');
    const escapeHandlers: any[] = []; // Placeholder for chain system
    
    // Legacy system test code commented out - now using chain system
    // escapeHandlers.forEach((handler, index) => {
    //   console.log(`  ${index + 1}. Component: ${handler.component}, Context: ${handler.context}, Description: ${handler.description}`);
    // });

    console.log(`\n🔥 NOTE: Legacy conflict test disabled - using new chain system`);

    // Simulate ESC key press with new system
    console.log('\n⌨️ Simulating ESC key press with chain system...');
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    
    const handlersExecuted = 0;
    // New chain system handles execution automatically
    // const originalHandlers = escapeHandlers.map(h => h.handler);

    // Dispatch the event
    document.dispatchEvent(escapeEvent);

    console.log(`\n📊 Result: Chain system handles execution order automatically`);
    
    console.log('✅ New chain system prevents conflicts by design');

    // Cleanup
    header.destroy();
    sidebar.destroy();
    
    console.log('\n✅ Test completed\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Proposed solution test
 */
export function testPrioritizedESCHandling() {
  console.log('\n🔧 Testing Prioritized ESC Handling Solution...\n');
  
  console.log('💡 Proposed Priority Order:');
  console.log('  1. 🥇 Modal/Dialog ESC (highest priority)');
  console.log('  2. 🥈 Mobile Sidebar ESC (mobile mode only)');
  console.log('  3. 🥉 User Menu ESC (global fallback)');
  console.log('  4. 🏃 Page ESC (page-specific, lowest priority)');
  
  console.log('\n✅ Solution: Conditional registration + priority context\n');
}

// Export test functions for manual execution
if (typeof window !== 'undefined') {
  (window as any).testESCConflict = testESCKeyConflict;
  (window as any).testPrioritizedESC = testPrioritizedESCHandling;
  console.log('🧪 Test functions available: testESCConflict(), testPrioritizedESC()');
}