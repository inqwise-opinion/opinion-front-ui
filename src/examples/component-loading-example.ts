/**
 * Component Loading Example
 * Demonstrates how to use ComponentLoader with the proper loading sequence:
 * 1. Sidebar Header > 2. App Header > 3. Sidebar Menu > 4. Sidebar Footer > 5. Page Content
 */

import ComponentLoader, { LoadingCallbacks } from '../components/ComponentLoader';
import { PageComponent } from '../components';

/**
 * Initialize the application with proper component loading sequence
 */
export async function initializeApp(): Promise<void> {
  console.log('🚀 App - Starting initialization...');

  // Define loading callbacks to track progress
  const loadingCallbacks: LoadingCallbacks = {
    onSidebarHeaderLoaded: () => {
      console.log('✅ App - Sidebar Header loaded');
      // You can show loading progress here
      updateLoadingProgress('Sidebar header loaded...', 20);
    },
    
    onAppHeaderLoaded: () => {
      console.log('✅ App - App Header loaded');
      updateLoadingProgress('App header loaded...', 40);
    },
    
    onSidebarMenuLoaded: () => {
      console.log('✅ App - Sidebar Menu loaded');
      updateLoadingProgress('Navigation loaded...', 60);
    },
    
    onSidebarFooterLoaded: () => {
      console.log('✅ App - Sidebar Footer loaded');
      updateLoadingProgress('Sidebar complete...', 80);
    },
    
    onPageContentLoaded: () => {
      console.log('✅ App - Ready for Page Content');
      updateLoadingProgress('Layout ready...', 90);
    },
    
    onAllComponentsLoaded: () => {
      console.log('🎉 App - All components loaded, starting page content...');
      updateLoadingProgress('Loading complete!', 100);
      hideLoadingScreen();
    }
  };

  // Show loading screen
  showLoadingScreen();

  try {
    // Initialize ComponentLoader with callbacks
    const componentLoader = new ComponentLoader({
      enableSidebar: true,
      enableHeader: true,
      enableFooter: true,
      callbacks: loadingCallbacks
    });

    // Load components in proper sequence
    await componentLoader.loadComponents();

    // Now load the actual page content
    await loadPageContent();

    console.log('🎉 App - Initialization complete!');

  } catch (error) {
    console.error('❌ App - Initialization failed:', error);
    showErrorScreen(error);
    throw error;
  }
}

/**
 * Load page content after layout components are ready
 */
async function loadPageContent(): Promise<void> {
  console.log('📄 App - Loading page content...');

  try {
    // Initialize page component
    const pageComponent = new PageComponent({
      containerId: 'app_content',
      enableDebugMode: true
    });

    await pageComponent.init();
    console.log('✅ App - Page content loaded');

  } catch (error) {
    console.error('❌ App - Page content loading failed:', error);
    throw error;
  }
}

/**
 * Show loading screen with progress
 */
function showLoadingScreen(): void {
  const loadingScreen = document.createElement('div');
  loadingScreen.id = 'app_loading_screen';
  loadingScreen.className = 'loading-screen';
  loadingScreen.innerHTML = `
    <div class="loading-container">
      <div class="loading-logo">
        <h1>Opinion</h1>
      </div>
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="progress_fill"></div>
        </div>
        <div class="progress-text" id="progress_text">Initializing...</div>
      </div>
    </div>
  `;

  // Add loading screen styles
  const style = document.createElement('style');
  style.textContent = `
    .loading-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .loading-container {
      text-align: center;
      max-width: 400px;
      padding: 40px;
    }
    
    .loading-logo h1 {
      font-size: 32px;
      color: #007bff;
      margin: 0 0 40px 0;
      font-weight: 600;
    }
    
    .progress-bar {
      width: 300px;
      height: 4px;
      background: #e9ecef;
      border-radius: 2px;
      overflow: hidden;
      margin: 0 auto 16px auto;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #007bff, #0056b3);
      width: 0%;
      transition: width 0.3s ease;
    }
    
    .progress-text {
      font-size: 14px;
      color: #6c757d;
      margin-top: 16px;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(loadingScreen);
}

/**
 * Update loading progress
 */
function updateLoadingProgress(text: string, percentage: number): void {
  const progressFill = document.getElementById('progress_fill');
  const progressText = document.getElementById('progress_text');

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }

  if (progressText) {
    progressText.textContent = text;
  }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen(): void {
  const loadingScreen = document.getElementById('app_loading_screen');
  if (loadingScreen) {
    // Use animation frames for smooth transition
    requestAnimationFrame(() => {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      
      // Wait for transition to complete using transitionend event
      loadingScreen.addEventListener('transitionend', () => {
        loadingScreen.remove();
      }, { once: true });
      
      // Fallback in case transitionend doesn't fire
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.remove();
        }
      }, 600);
    });
  }
}

/**
 * Show error screen
 */
function showErrorScreen(error: any): void {
  const loadingScreen = document.getElementById('app_loading_screen');
  if (loadingScreen) {
    loadingScreen.innerHTML = `
      <div class="loading-container">
        <div class="error-icon">❌</div>
        <h2>Loading Failed</h2>
        <p>Something went wrong while loading the application.</p>
        <pre style="text-align: left; font-size: 12px; background: #f8f9fa; padding: 16px; border-radius: 4px; margin-top: 16px;">
${error.toString()}
        </pre>
        <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Retry
        </button>
      </div>
    `;
  }
}

/**
 * Alternative: Load components with custom configuration
 */
export async function initializeAppCustom(config: {
  enableSidebar?: boolean;
  enableHeader?: boolean;
  enableFooter?: boolean;
}): Promise<void> {
  console.log('🚀 App - Starting custom initialization...', config);

  const componentLoader = new ComponentLoader({
    ...config,
    callbacks: {
      onAllComponentsLoaded: () => {
        console.log('🎉 Custom App - Components loaded!');
        document.body.classList.add('app-ready');
      }
    }
  });

  await componentLoader.loadComponents();
  await loadPageContent();

  console.log('✅ Custom App - Ready!');
}

// Export for use in main application
export { ComponentLoader };
export default initializeApp;
