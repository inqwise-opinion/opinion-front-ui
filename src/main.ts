/**
 * Main entry point for Opinion Front UI
 * TypeScript migration from servlet-based application
 */

import './assets/styles/app-layout.css';
import './assets/styles/main.scss';
import './assets/styles/dashboard.scss';
import { OpinionApp } from './app';

// Add global error handlers
window.addEventListener('error', (event) => {
  console.error('🚨 GLOBAL ERROR - Uncaught JavaScript error:', event.error);
  console.error('🚨 GLOBAL ERROR - Error message:', event.message);
  console.error('🚨 GLOBAL ERROR - Error source:', event.filename + ':' + event.lineno + ':' + event.colno);
  console.error('🚨 GLOBAL ERROR - Stack trace:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 GLOBAL ERROR - Unhandled promise rejection:', event.reason);
  console.error('🚨 GLOBAL ERROR - Promise:', event.promise);
});

// Initialize the application when DOM and resources are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForResourcesAndInit);
} else if (document.readyState === 'interactive') {
  waitForResourcesAndInit();
} else {
  // Document is already complete
  initApp();
}

// Wait for critical resources to load before initializing
function waitForResourcesAndInit() {
  // Wait a bit for stylesheets to load and apply
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      // Give an additional moment for layout to stabilize
      setTimeout(initApp, 50);
    });
  } else {
    // Already loaded, but give a moment for layout to stabilize
    setTimeout(initApp, 10);
  }
}

async function initApp() {
  console.log('🚀 MAIN.TS - initApp() START');
  
  console.log('🚀 MAIN.TS - Creating OpinionApp instance...');
  const app = new OpinionApp();
  
  console.log('🚀 MAIN.TS - Calling app.init()...');
  await app.init(); // OpinionApp handles all error cases internally
  
  // Expose app instance globally for DebugPage access to Layout
  (window as any).app = app;
  console.log('🎯 MAIN.TS - App instance exposed globally');
  
  console.log('✅ MAIN.TS - Application initialization completed successfully!');
  console.log('🚀 MAIN.TS - initApp() END');
}

export { OpinionApp };
