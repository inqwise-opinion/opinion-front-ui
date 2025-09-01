// Simple test to validate UserMenu mobile functionality
// Run this in browser console

console.log('🧪 Starting UserMenu mobile test...');

// Check if UserMenu elements exist
const userMenuTrigger = document.getElementById('user_menu_trigger');
const userMenuDropdown = document.getElementById('user_menu_dropdown');

console.log('UserMenu elements found:', {
  trigger: !!userMenuTrigger,
  dropdown: !!userMenuDropdown
});

if (userMenuTrigger) {
  console.log('📱 Testing mobile view detection...');
  
  // Force mobile width simulation
  const originalInnerWidth = window.innerWidth;
  
  // Override window.innerWidth for testing
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375 // Mobile width
  });
  
  console.log('📱 Simulated mobile width:', window.innerWidth);
  
  // Trigger the user menu
  console.log('📱 Clicking user menu trigger...');
  userMenuTrigger.click();
  
  // Check if mobile dropdown was created
  setTimeout(() => {
    const mobileDropdown = document.querySelector('.user-menu-mobile-dropdown');
    console.log('📱 Mobile dropdown created:', !!mobileDropdown);
    
    if (mobileDropdown) {
      const computedStyles = window.getComputedStyle(mobileDropdown);
      console.log('📱 Mobile dropdown styles:', {
        position: computedStyles.position,
        top: computedStyles.top,
        left: computedStyles.left,
        transform: computedStyles.transform,
        zIndex: computedStyles.zIndex,
        display: computedStyles.display,
        visibility: computedStyles.visibility,
        opacity: computedStyles.opacity
      });
    }
    
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
  }, 100);
} else {
  console.warn('❌ UserMenu trigger not found - component may not be initialized');
}
