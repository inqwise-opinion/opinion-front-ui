/**
 * Main entry point for Opinion Front UI
 * TypeScript migration from servlet-based application
 */

import './assets/styles/main.scss';
import './assets/styles/dashboard.scss';
import { OpinionApp } from './app';

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

async function initApp() {
  try {
    const app = new OpinionApp();
    await app.init();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Show error message to user
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>Application Error</h2>
        <p>Failed to load the application. Please refresh the page or try again later.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">Reload Page</button>
      </div>
    `;
  }
}

export { OpinionApp };
