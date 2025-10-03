/**
 * Main entry point for Opinion Front UI
 * TypeScript migration from servlet-based application
 */

import './assets/styles/app-layout.css';
import './assets/styles/main.scss';
import './assets/styles/dashboard.scss';
import { OpinionApp } from './app';
import { LoggerFactory } from './logging/LoggerFactory';

// Initialize logger for main module
const logger = LoggerFactory.getInstance().getLogger('Main');

// Add temporary global error handlers (will be replaced after app init)
const globalErrorHandler = (event: ErrorEvent) => {
  logger.error('Global JavaScript error (before app init)', event.error);
};

const globalRejectionHandler = (event: PromiseRejectionEvent) => {
  logger.error('Unhandled promise rejection (before app init)', event.reason);
};

window.addEventListener('error', globalErrorHandler);
window.addEventListener('unhandledrejection', globalRejectionHandler);

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
  
  // Update global error handlers to use OpinionApp's error handler
  const appErrorHandler = app.getErrorHandler();
  
  window.removeEventListener('error', globalErrorHandler);
  window.removeEventListener('unhandledrejection', globalRejectionHandler);
  
  window.addEventListener('error', (event) => {
    appErrorHandler(event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    appErrorHandler(event.reason);
  });
}

export { OpinionApp };
