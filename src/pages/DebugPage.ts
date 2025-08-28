/**
 * Debug Page Component
 * Debug/test page that follows the regular app layout pattern
 * Provides testing controls and development utilities
 */

export class DebugPage {
  private isInitialized: boolean = false;

  constructor() {
    console.log('🏗️ DEBUGPAGE - Constructor START');
    console.log('✅ DEBUGPAGE - Constructor completed successfully');
    console.log('🏗️ DEBUGPAGE - Constructor END');
  }

  /**
   * Initialize the debug page
   */
  async init(): Promise<void> {
    console.log('🏗️ DEBUGPAGE - init() START');
    
    if (this.isInitialized) {
      console.warn('🏗️ DEBUGPAGE - Already initialized, skipping');
      return;
    }

    try {
      console.log('🏗️ DEBUGPAGE - Starting initialization process...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Load and inject HTML template into #app element
      await this.loadTemplate();
      
      // Setup page-level functionality
      this.setupPageHandlers();
      
      // Set browser tab title
      document.title = 'Debug - Opinion';
      
      this.isInitialized = true;
      console.log('✅ DEBUGPAGE - Initialization completed successfully!');

    } catch (error) {
      console.error('❌ DEBUGPAGE - Initialization failed:', error);
      throw error;
    }
    
    console.log('🏗️ DEBUGPAGE - init() END');
  }

  /**
   * Load HTML template into #app element
   */
  private async loadTemplate(): Promise<void> {
    console.log('DebugPage - Loading template...');
    
    // For now, always use the fallback template since debug.html doesn't exist
    // In the future, you could try to load an external template here
    this.createFallbackTemplate();
    
    console.log('DebugPage - Template loaded (using fallback)');
  }

  /**
   * Create fallback template if HTML file fails to load
   */
  private createFallbackTemplate(): void {
    console.log('DebugPage - Creating fallback template...');
    
    const appElement = document.getElementById('app');
    if (appElement) {
      console.log('DebugPage - Found #app element, replacing content...');
      console.log('DebugPage - Current #app content length:', appElement.innerHTML.length);
      appElement.innerHTML = `
        <div class="debug-page-content" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
          <div class="debug-header" style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <h1 style="margin: 0 0 10px 0; color: #333;">🛠️ Debug Page</h1>
            <p style="margin: 0; color: #666;">This page uses the regular app layout system with global header, sidebar, and footer components.</p>
          </div>
          
          <div class="test-info" style="background: #e7f3ff; padding: 15px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <h3 style="margin: 0 0 10px 0; color: #0066cc;">✅ Regular Layout Pattern</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li>Global AppHeader with responsive UserMenu</li>
              <li>Sidebar managed by SimpleMobileMenu</li>
              <li>Page content in #app element</li>
              <li>Global AppFooter (if configured)</li>
            </ul>
          </div>
          
          <div class="debug-content" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0; color: #333;">Debug Information</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0;">
              <div>
                <h4 style="margin: 0 0 10px 0; color: #555;">Viewport Info:</h4>
                <div id="viewport_info" style="font-family: monospace; background: #f1f3f4; padding: 10px; border-radius: 4px;">Loading...</div>
              </div>
              <div>
                <h4 style="margin: 0 0 10px 0; color: #555;">Layout Status:</h4>
                <div id="layout_status" style="font-family: monospace; background: #f1f3f4; padding: 10px; border-radius: 4px;">Checking...</div>
              </div>
            </div>
            
            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Test Console</h3>
              <div id="test_console" style="background: #1e1e1e; color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px; height: 200px; overflow-y: auto;"></div>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Quick Tests</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                <button id="test_user_loading" style="padding: 10px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">🔄 Test User Loading</button>
                <button id="test_viewport_info" style="padding: 10px 16px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">📐 Update Viewport Info</button>
                <button id="test_mobile_toggle" style="padding: 10px 16px; background: #6f42c1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">📱 Test Mobile Menu</button>
                <button id="clear_console" style="padding: 10px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">🧹 Clear Console</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Setup page-level event handlers
   */
  private setupPageHandlers(): void {
    // Setup test controls
    this.setupTestControls();
    
    // Update viewport info initially
    this.updateViewportInfo();
    this.updateLayoutStatus();
    
    // Setup responsive behavior
    this.setupResponsiveHandlers();
  }
  
  /**
   * Setup test control buttons
   */
  private setupTestControls(): void {
    // Test User Loading
    const testUserLoading = document.getElementById('test_user_loading');
    if (testUserLoading) {
      testUserLoading.addEventListener('click', () => {
        this.logToConsole('🔄 Testing user loading simulation...');
        // The global layout should handle this, not the page
        this.logToConsole('Note: User loading is handled by global AppHeader component');
        this.logToConsole('Check browser console for AppHeader logs');
      });
    }

    // Update Viewport Info
    const testViewportInfo = document.getElementById('test_viewport_info');
    if (testViewportInfo) {
      testViewportInfo.addEventListener('click', () => {
        this.updateViewportInfo();
        this.updateLayoutStatus();
        this.logToConsole('📐 Viewport info updated');
      });
    }

    // Test Mobile Menu Toggle
    const testMobileToggle = document.getElementById('test_mobile_toggle');
    if (testMobileToggle) {
      testMobileToggle.addEventListener('click', () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          const hamburger = document.getElementById('mobile_menu_toggle');
          if (hamburger) {
            hamburger.click();
            this.logToConsole('📱 Mobile menu toggled');
          } else {
            this.logToConsole('❌ Mobile menu button not found');
          }
        } else {
          this.logToConsole('ℹ️ Mobile menu only available on mobile viewports (<768px)');
        }
      });
    }

    // Clear Console
    const clearConsole = document.getElementById('clear_console');
    if (clearConsole) {
      clearConsole.addEventListener('click', () => {
        const console = document.getElementById('test_console');
        if (console) {
          console.innerHTML = '';
        }
      });
    }
  }
  
  /**
   * Setup responsive behavior handlers
   */
  private setupResponsiveHandlers(): void {
    // Handle window resize for responsive debug info
    let resizeTimeout: NodeJS.Timeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateViewportInfo();
        this.updateLayoutStatus();
        this.logToConsole(`📐 Viewport changed: ${window.innerWidth}x${window.innerHeight}`);
      }, 250);
    });
  }
  
  /**
   * Update viewport information display
   */
  private updateViewportInfo(): void {
    const viewportInfo = document.getElementById('viewport_info');
    if (viewportInfo) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      
      viewportInfo.innerHTML = `
        Width: ${width}px<br>
        Height: ${height}px<br>
        Device: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}<br>
        Ratio: ${(width / height).toFixed(2)}
      `;
    }
  }
  
  /**
   * Update layout status information
   */
  private updateLayoutStatus(): void {
    const layoutStatus = document.getElementById('layout_status');
    if (layoutStatus) {
      const header = document.querySelector('.app-header');
      const sidebar = document.querySelector('.app-sidebar, #app_sidebar');
      const footer = document.querySelector('.app-footer');
      const userMenuTrigger = document.querySelector('#user_menu_trigger');
      const mobileMenuToggle = document.querySelector('#mobile_menu_toggle');
      
      layoutStatus.innerHTML = `
        Header: ${header ? '✅' : '❌'}<br>
        Sidebar: ${sidebar ? '✅' : '❌'}<br>
        Footer: ${footer ? '✅' : '❌'}<br>
        UserMenu: ${userMenuTrigger ? '✅' : '❌'}<br>
        MobileMenu: ${mobileMenuToggle ? '✅' : '❌'}
      `;
    }
  }
  
  /**
   * Log message to test console
   */
  private logToConsole(message: string): void {
    const testConsole = document.getElementById('test_console');
    if (testConsole) {
      const timestamp = new Date().toLocaleTimeString();
      const logElement = document.createElement('div');
      logElement.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${message}`;
      testConsole.appendChild(logElement);
      testConsole.scrollTop = testConsole.scrollHeight;
    }
    console.log('DebugPage:', message);
  }

  /**
   * Clean up when page is destroyed
   */
  destroy(): void {
    console.log('DebugPage - Destroying...');
    this.isInitialized = false;
  }
}

export default DebugPage;
