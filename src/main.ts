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
  console.error('Global JavaScript error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
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
  const app = new OpinionApp();
  await app.init();
  
  // Expose app instance globally for DebugPage access to Layout
  (window as any).app = app;
}

export { OpinionApp };
