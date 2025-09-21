/**
 * Layout Integration Test
 * Validates that all components work together cleanly without complex interactions
 * Tests the bulletproof architecture and clean separation of concerns
 */

import { Sidebar } from '../components/Sidebar';
import { AppHeaderImpl } from '../components/AppHeaderImpl';
import { AppFooterImpl } from '../components/AppFooterImpl';
import { MainContent } from '../components/MainContent';
import { globalEventBus, AppEvents } from '../utils/EventBus';

export const skip = true; // Skip this file for Jest testing - it's an integration test utility

/**
 * Simple integration test to validate clean layout
 */
export async function testLayoutIntegration(): Promise<boolean> {
  console.log('🧪 Layout Integration Test - Starting...');

  try {
    // Test 1: Component initialization
    console.log('🔧 Testing component initialization...');
    
    const sidebar = new Sidebar();
    const header = new AppHeaderImpl();
    const footer = new AppFooterImpl();
    const mainContent = new MainContent();

    // Initialize components
    await sidebar.init();
    await header.init();
    footer.init();
    mainContent.init();

    console.log('✅ Components initialized successfully');

    // Test 2: Layout structure
    console.log('🏗️ Testing layout structure...');
    
    const appLayout = document.querySelector('.app-layout');
    const sidebarEl = document.querySelector('.app-sidebar');
    const headerEl = document.querySelector('.app-header');
    const footerEl = document.querySelector('.app-footer');
    const mainEl = document.querySelector('.main-content');

    if (!appLayout || !sidebarEl || !headerEl || !footerEl || !mainEl) {
      throw new Error('Layout structure validation failed');
    }

    console.log('✅ Layout structure valid');

    // Test 3: Event communication
    console.log('📡 Testing event communication...');
    
    let eventReceived = false;
    const subscription = globalEventBus.subscribe('sidebar:compact-mode-changed', () => {
      eventReceived = true;
    });

    AppEvents.sidebarCompactModeChanged(true);
    
    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (!eventReceived) {
      throw new Error('Event communication failed');
    }

    subscription.unsubscribe();
    console.log('✅ Event communication working');

    // Test 4: Clean destruction
    console.log('🧹 Testing clean destruction...');
    
    sidebar.destroy();
    header.destroy();
    footer.destroy();
    mainContent.destroy();

    // Verify components are removed
    const remainingSidebar = document.querySelector('.app-sidebar');
    const remainingHeader = document.querySelector('.app-header');
    const remainingFooter = document.querySelector('.app-footer');
    const remainingMain = document.querySelector('.main-content');

    if (remainingSidebar || remainingHeader || remainingFooter || remainingMain) {
      throw new Error('Components not properly destroyed');
    }

    globalEventBus.clearAll();
    console.log('✅ Clean destruction successful');

    console.log('🎉 All integration tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
}

/**
 * Demo function to showcase the clean layout
 */
export async function demoCleanLayout(): Promise<void> {
  console.log('🎭 Clean Layout Demo - Starting...');

  // Create app layout container if it doesn't exist
  let appLayout = document.querySelector('.app-layout');
  if (!appLayout) {
    appLayout = document.createElement('div');
    appLayout.className = 'app-layout';
    document.body.appendChild(appLayout);
  }

  // Initialize components
  const sidebar = new Sidebar();
  const header = new AppHeaderImpl();
  const footer = new AppFooterImpl();
  const mainContent = new MainContent();

  // Initialize in proper order
  await sidebar.init();
  await header.init();
  footer.init();
  mainContent.init();

  // Set some demo content
  header.updateUser({
    username: 'Demo User',
    email: 'demo@example.com'
  });

  header.updateBreadcrumbs('Dashboard', 'Overview');

  mainContent.setContent(`
    <div class="main-content-section">
      <h1>Clean Layout Demo</h1>
      <p>This is a demonstration of the clean, bulletproof layout architecture.</p>
      
      <div class="main-content-flex-row">
        <div class="main-content-card">
          <h3>CSS Grid Layout</h3>
          <p>Main app structure uses CSS Grid for reliable positioning.</p>
        </div>
        
        <div class="main-content-card">
          <h3>Flexbox Content</h3>
          <p>Main content area uses Flexbox for flexible content layout.</p>
        </div>
      </div>
      
      <div class="main-content-card">
        <h3>Event-Based Communication</h3>
        <p>Components communicate through clean event patterns.</p>
      </div>
    </div>
  `);

  // Publish some demo events
  AppEvents.appLayoutReady();
  AppEvents.appComponentsInitialized();
  AppEvents.mainContentLoaded('Clean Layout Demo');

  console.log('🎉 Clean Layout Demo - Ready!');
}

// Ensure Jest doesn't fail due to no tests in this helper module
// This creates a skipped placeholder test.
test.skip('layout-integration helper module', () => {});
