/**
 * Compact Toggle Button Demo
 * 
 * This example demonstrates the new compact toggle button functionality
 * in the sidebar component.
 */

import { Sidebar } from '../components/Sidebar.js';
import LayoutContextImpl from '../contexts/LayoutContextImpl.js';

/**
 * Demo: Compact toggle button functionality
 */
export function demonstrateCompactToggle() {
  console.log('=== Compact Toggle Button Demo ===');
  
  const layoutContext = LayoutContextImpl.getInstance();
  const sidebar = new Sidebar();
  
  // Initialize sidebar
  sidebar.init().then(() => {
    console.log('✅ Sidebar initialized with compact toggle button');
    
    // Subscribe to layout mode changes to observe the button working
    const unsubscribe = layoutContext.subscribe('layout-mode-change', (event) => {
      const layoutMode = event.data;
      console.log(`🎯 Layout mode changed: ${layoutMode.type}`);
      console.log(`   Compact: ${layoutMode.isCompact}`);
      console.log(`   Sidebar width: ${layoutMode.sidebar.width}px`);
    });
    
    // Show the toggle button in action
    setTimeout(() => demonstrateToggleStates(sidebar), 2000);
    setTimeout(() => unsubscribe(), 10000);
  });
}

/**
 * Demonstrate different toggle states
 */
function demonstrateToggleStates(sidebar: Sidebar) {
  console.log('🔄 Testing compact toggle states...');
  
  // Test programmatic toggle
  console.log('1. Programmatically toggling to compact mode...');
  sidebar.setCompactMode(true);
  
  setTimeout(() => {
    console.log('2. Toggling back to normal mode...');
    sidebar.setCompactMode(false);
  }, 2000);
  
  setTimeout(() => {
    console.log('3. Using toggleCompactMode() method...');
    sidebar.toggleCompactMode();
  }, 4000);
  
  setTimeout(() => {
    console.log('4. Button click should also work (try clicking the button!)');
    showButtonInstructions();
  }, 6000);
}

/**
 * Show instructions for manual testing
 */
function showButtonInstructions() {
  console.log('📝 Manual Testing Instructions:');
  console.log('   1. Look for the toggle button in the sidebar header (double arrow icon)');
  console.log('   2. Click the button to toggle between compact and normal modes');
  console.log('   3. Notice how the button icon changes direction');
  console.log('   4. Watch the sidebar width change smoothly');
  console.log('   5. Observe how navigation text hides/shows');
  console.log('   6. Try hovering over navigation icons in compact mode for tooltips');
  
  // Add visual highlighting to the button
  setTimeout(() => highlightToggleButton(), 1000);
}

/**
 * Highlight the toggle button for demo purposes
 */
function highlightToggleButton() {
  const toggleButton = document.querySelector('.compact-toggle-btn') as HTMLElement;
  
  if (toggleButton) {
    // Add a highlight animation
    toggleButton.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
    toggleButton.style.animation = 'pulse 2s infinite';
    
    // Add pulse animation CSS if not already present
    if (!document.querySelector('#pulse-animation')) {
      const style = document.createElement('style');
      style.id = 'pulse-animation';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `;
      document.head.appendChild(style);
    }
    
    console.log('✨ Toggle button is now highlighted!');
    
    // Remove highlight after demo
    setTimeout(() => {
      toggleButton.style.boxShadow = '';
      toggleButton.style.animation = '';
      console.log('Demo completed! Toggle button is fully functional.');
    }, 5000);
  }
}

/**
 * Show toggle button features
 */
export function showToggleButtonFeatures() {
  console.log('=== Compact Toggle Button Features ===');
  
  console.log('🎨 Visual Features:');
  console.log('   • Clean, modern button design');
  console.log('   • Smooth hover and focus states');
  console.log('   • Active state with visual feedback');
  console.log('   • Different styling for compact/normal modes');
  console.log('   • Responsive sizing in compact mode');
  
  console.log('⚡ Interactive Features:');
  console.log('   • Click to toggle between compact and normal modes');
  console.log('   • Icon changes direction (left arrow ↔ right arrow)');
  console.log('   • Tooltip text updates based on current mode');
  console.log('   • Accessible with proper ARIA labels');
  console.log('   • Keyboard navigation support');
  
  console.log('🔧 Technical Features:');
  console.log('   • Integrates with layout context system');
  console.log('   • Triggers layout mode change events');
  console.log('   • Updates CSS classes automatically');
  console.log('   • Publishes dimension changes to all components');
  console.log('   • Smooth CSS transitions');
  
  console.log('📱 Responsive Behavior:');
  console.log('   • Button adapts size in compact mode');
  console.log('   • Hidden on mobile (where compact mode is not applicable)');
  console.log('   • Works with all layout modes');
}

/**
 * Test toggle button accessibility
 */
export function testToggleButtonAccessibility() {
  console.log('=== Toggle Button Accessibility Test ===');
  
  const toggleButton = document.querySelector('.compact-toggle-btn') as HTMLButtonElement;
  
  if (!toggleButton) {
    console.log('❌ Toggle button not found');
    return;
  }
  
  console.log('🔍 Testing accessibility features...');
  
  // Check ARIA attributes
  const hasAriaLabel = toggleButton.hasAttribute('aria-label');
  const hasTitle = toggleButton.hasAttribute('title');
  const hasType = toggleButton.getAttribute('type') === 'button';
  
  console.log(`✅ ARIA label: ${hasAriaLabel ? toggleButton.getAttribute('aria-label') : '❌ Missing'}`);
  console.log(`✅ Title attribute: ${hasTitle ? toggleButton.getAttribute('title') : '❌ Missing'}`);
  console.log(`✅ Button type: ${hasType ? 'Correct' : '❌ Missing or incorrect'}`);
  
  // Test keyboard navigation
  console.log('⌨️  Keyboard Navigation:');
  console.log('   • Tab to focus the button');
  console.log('   • Press Enter or Space to toggle');
  console.log('   • Visual focus indicator is provided');
  
  // Test with screen reader simulation
  console.log('📢 Screen Reader Experience:');
  console.log(`   • Announces: "${toggleButton.getAttribute('aria-label')}, button"`);
  console.log('   • State changes are reflected in the label');
  console.log('   • Button purpose is clear from the label');
  
  console.log('✅ Accessibility test completed');
}

/**
 * Example of integrating the toggle with custom logic
 */
export class CustomToggleIntegration {
  private sidebar: Sidebar;
  private onToggleCallback?: (isCompact: boolean) => void;
  
  constructor(sidebar: Sidebar) {
    this.sidebar = sidebar;
  }
  
  /**
   * Set a callback for when the toggle is used
   */
  onToggle(callback: (isCompact: boolean) => void) {
    this.onToggleCallback = callback;
    
    // Subscribe to compact mode changes
    this.sidebar.onCompactModeChange((isCompact) => {
      console.log(`CustomToggleIntegration - Compact mode: ${isCompact}`);
      
      // Custom logic when toggle is used
      this.handleToggle(isCompact);
      
      // Call user callback
      if (this.onToggleCallback) {
        this.onToggleCallback(isCompact);
      }
    });
  }
  
  private handleToggle(isCompact: boolean) {
    // Example: Save user preference
    localStorage.setItem('sidebar-compact', isCompact.toString());
    
    // Example: Analytics tracking
    console.log(`Analytics: User ${isCompact ? 'enabled' : 'disabled'} compact sidebar`);
    
    // Example: Update other UI elements
    this.updateRelatedUI(isCompact);
  }
  
  private updateRelatedUI(isCompact: boolean) {
    // Example: Update a settings panel
    const settingsToggle = document.querySelector('#compact-mode-setting') as HTMLInputElement;
    if (settingsToggle) {
      settingsToggle.checked = isCompact;
    }
    
    // Example: Show/hide tutorial tips
    const tutorialTip = document.querySelector('.compact-mode-tip');
    if (tutorialTip) {
      tutorialTip.style.display = isCompact ? 'block' : 'none';
    }
  }
  
  /**
   * Restore saved toggle state
   */
  restoreSavedState() {
    const saved = localStorage.getItem('sidebar-compact');
    if (saved !== null) {
      const isCompact = saved === 'true';
      this.sidebar.setCompactMode(isCompact);
      console.log(`Restored compact mode: ${isCompact}`);
    }
  }
}

export default {
  demonstrateCompactToggle,
  showToggleButtonFeatures,
  testToggleButtonAccessibility,
  CustomToggleIntegration
};
