/**
 * Debug Page Component
 * Debug/test page that uses semantic main content structure
 * Provides testing controls and development utilities
 */

import { Sidebar, CompactModeChangeHandler } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import MainContent from '../components/MainContent';

export class DebugPage {
  private isInitialized: boolean = false;
  private sidebarDebugUnsubscribe: (() => void) | null = null;
  private headerDebugUnsubscribe: (() => void) | null = null;
  private mainContent: MainContent | null = null;

  constructor(mainContent: MainContent | null = null) {
    console.log('🏗️ DEBUGPAGE - Constructor START');
    this.mainContent = mainContent;
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
      
      // Load content into semantic main element
      await this.loadTemplate();
      
      // Setup page-level functionality
      this.setupPageHandlers();
      
      // Setup sidebar compact mode debugging
      await this.setupSidebarDebug();
      
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
   * Load HTML template into semantic main element
   */
  private async loadTemplate(): Promise<void> {
    console.log('DebugPage - Loading template...');
    
    // Load content into the semantic main element
    this.createFallbackTemplate();
    
    console.log('DebugPage - Template loaded (using fallback)');
  }

  /**
   * Create fallback template if HTML file fails to load
   */
  private createFallbackTemplate(): void {
    console.log('DebugPage - Creating fallback template...');
    
    // Use MainContent component if available, otherwise fallback to #app
    const targetElement = this.mainContent?.getElement() || document.getElementById('app');
    
    if (targetElement) {
      const elementType = this.mainContent ? 'semantic <main>' : '#app';
      console.log(`DebugPage - Found ${elementType} element, replacing content...`);
      console.log(`DebugPage - Current ${elementType} content length:`, targetElement.innerHTML.length);
      
      const content = `
        <div class="debug-page-content" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
          <div class="debug-header" style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <h1 style="margin: 0 0 10px 0; color: #333;">🛠️ Debug Page</h1>
            <p style="margin: 0; color: #666;">This page uses the regular app layout system with global header, sidebar, and footer components.</p>
          </div>
          
          <div class="test-info" style="background: #e7f3ff; padding: 15px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <h3 style="margin: 0 0 10px 0; color: #0066cc;">✅ Semantic HTML5 Layout</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li>&lt;nav class="app-sidebar"&gt; - Responsive sidebar navigation</li>
              <li>&lt;header class="app-header"&gt; - Page header with breadcrumbs</li>
              <li>&lt;main class="main-content"&gt; - Semantic main content area</li>
              <li>&lt;footer class="app-footer"&gt; - Site footer with links</li>
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
              <h3 style="color: #333; margin-bottom: 15px;">🎯 Sidebar Compact Mode Events</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <h4 style="margin: 0 0 10px 0; color: #555;">Sidebar Events:</h4>
                  <div id="sidebar_events" style="background: #1e3a8a; color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; height: 120px; overflow-y: auto;"></div>
                </div>
                <div>
                  <h4 style="margin: 0 0 10px 0; color: #555;">AppHeader Responses:</h4>
                  <div id="header_events" style="background: #166534; color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; height: 120px; overflow-y: auto;"></div>
                </div>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                <button id="toggle_compact" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🔄 Toggle Compact Mode</button>
                <button id="clear_event_logs" style="padding: 8px 12px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🧹 Clear Event Logs</button>
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
      
      // Set content using appropriate method
      if (this.mainContent) {
        this.mainContent.setContent(content);
        console.log('DebugPage - Content set in semantic <main> element');
      } else {
        targetElement.innerHTML = content;
        console.log('DebugPage - Content set in fallback #app element');
      }
    } else {
      console.error('DebugPage - No target element found for content');
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
   * Setup sidebar compact mode event debugging
   */
  private async setupSidebarDebug(): Promise<void> {
    console.log('🎯 DebugPage - Setting up sidebar compact mode event debugging...');
    
    // Wait a bit for components to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to get sidebar element from DOM
    const sidebarElement = document.getElementById('app_sidebar');
    if (!sidebarElement) {
      this.logToEventConsole('sidebar_events', '❌ Sidebar element not found');
      return;
    }
    
    this.logToEventConsole('sidebar_events', '✅ Sidebar element found in DOM');
    
    // Method 1: Hook into the sidebar compact toggle button clicks
    this.setupSidebarToggleHook();
    
    // Method 2: Monitor sidebar CSS classes for compact mode changes
    this.setupSidebarClassObserver();
    
    // Method 3: Listen for custom header position events (AppHeader responses)
    this.setupHeaderEventListener();
    
    // Method 4: Try to access sidebar instance if available
    this.tryDirectSidebarAccess();
    
    this.logToEventConsole('sidebar_events', 'ℹ️ Debug hooks established - waiting for events...');
  }
  
  /**
   * Hook into sidebar toggle button to detect compact mode changes
   */
  private setupSidebarToggleHook(): void {
    const compactToggle = document.getElementById('sidebar_compact_toggle');
    if (compactToggle) {
      compactToggle.addEventListener('click', () => {
        // Check current state before the click takes effect
        const sidebar = document.getElementById('app_sidebar');
        const wasCompact = sidebar?.classList.contains('sidebar-compact') || false;
        const willBeCompact = !wasCompact;
        
        const timestamp = new Date().toLocaleTimeString();
        const status = willBeCompact ? 'COMPACT' : 'NORMAL';
        const statusColor = willBeCompact ? '#fbbf24' : '#3b82f6';
        
        this.logToEventConsole('sidebar_events', `<span style="color: ${statusColor}; font-weight: bold;">[${timestamp}] 🔄 ${status}</span>`);
        this.logToEventConsole('sidebar_events', `└─ Compact toggle clicked: ${wasCompact} → ${willBeCompact}`);
      });
      
      this.logToEventConsole('sidebar_events', '✅ Hooked into sidebar compact toggle button');
    } else {
      this.logToEventConsole('sidebar_events', '⚠️ Sidebar compact toggle button not found');
    }
  }
  
  /**
   * Monitor sidebar element for CSS class changes
   */
  private setupSidebarClassObserver(): void {
    const sidebar = document.getElementById('app_sidebar');
    if (!sidebar) return;
    
    // Create a MutationObserver to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isCompact = sidebar.classList.contains('sidebar-compact');
          const timestamp = new Date().toLocaleTimeString();
          const status = isCompact ? 'COMPACT' : 'NORMAL';
          const statusColor = isCompact ? '#fbbf24' : '#3b82f6';
          
          this.logToEventConsole('sidebar_events', `<span style="color: ${statusColor}; font-weight: bold;">[${timestamp}] 📡 ${status}</span>`);
          this.logToEventConsole('sidebar_events', `└─ CSS class changed: sidebar-compact = ${isCompact}`);
        }
      });
    });
    
    // Start observing
    observer.observe(sidebar, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Log initial state
    const initialCompact = sidebar.classList.contains('sidebar-compact');
    this.logToEventConsole('sidebar_events', `ℹ️ Initial compact state: ${initialCompact ? 'COMPACT' : 'NORMAL'}`);
    this.logToEventConsole('sidebar_events', '✅ Monitoring sidebar CSS classes');
  }
  
  /**
   * Setup header position event listener
   */
  private setupHeaderEventListener(): void {
    // Listen for custom header position events
    document.addEventListener('header-position-updated', (event: CustomEvent) => {
      const timestamp = new Date().toLocaleTimeString();
      const detail = event.detail;
      
      this.logToEventConsole('header_events', `<span style="color: #10b981; font-weight: bold;">[${timestamp}] 🎯 POSITION UPDATE</span>`);
      this.logToEventConsole('header_events', `└─ Left: ${detail.headerLeft}px, Width: ${detail.headerWidth}px`);
      this.logToEventConsole('header_events', `└─ Sidebar: ${detail.sidebarInfo.isCompact ? 'compact' : 'normal'} (${detail.sidebarInfo.width}px)`);
    });
    
    this.logToEventConsole('header_events', '✅ Subscribed to header position update events');
  }
  
  /**
   * Try to access sidebar instance directly (fallback)
   */
  private tryDirectSidebarAccess(): void {
    // Look for global app instance
    let sidebar: Sidebar | null = null;
    let appHeader: AppHeader | null = null;
    
    // Try various ways to get the instances
    if ((window as any).app?.sidebar) {
      sidebar = (window as any).app.sidebar;
    } else if ((window as any).app?.header?.getSidebar) {
      sidebar = (window as any).app.header.getSidebar();
    }
    
    if ((window as any).app?.header) {
      appHeader = (window as any).app.header;
    }
    
    if (sidebar) {
      try {
        // Subscribe to sidebar compact mode changes
        const sidebarHandler: CompactModeChangeHandler = (isCompact: boolean) => {
          const timestamp = new Date().toLocaleTimeString();
          const status = isCompact ? 'COMPACT' : 'NORMAL';
          const statusColor = isCompact ? '#fbbf24' : '#3b82f6';
          
          this.logToEventConsole('sidebar_events', `<span style="color: ${statusColor}; font-weight: bold;">[${timestamp}] 🎯 DIRECT EVENT</span>`);
          this.logToEventConsole('sidebar_events', `└─ Sidebar instance fired event: ${isCompact}`);
        };
        
        this.sidebarDebugUnsubscribe = sidebar.onCompactModeChange(sidebarHandler);
        this.logToEventConsole('sidebar_events', '✅ Successfully subscribed to sidebar instance events');
        
      } catch (error) {
        this.logToEventConsole('sidebar_events', '❌ Failed to subscribe to sidebar instance: ' + (error as Error).message);
      }
    } else {
      this.logToEventConsole('sidebar_events', 'ℹ️ Sidebar instance not accessible via global references');
    }
    
    if (appHeader) {
      this.logToEventConsole('header_events', '✅ AppHeader instance found via global reference');
    } else {
      this.logToEventConsole('header_events', 'ℹ️ AppHeader instance not accessible via global references');
    }
  }
  
  /**
   * Setup AppHeader debugging if instance is available
   */
  private setupAppHeaderDebug(): void {
    this.logToEventConsole('header_events', '✅ AppHeader instance found - monitoring responses');
    this.logToEventConsole('header_events', 'ℹ️ Watch for position updates in response to sidebar events');
    
    // Additional debugging could be added here if needed
    // For now, we rely on the custom events and console logs
  }
  
  /**
   * Log message to event console (sidebar or header)
   */
  private logToEventConsole(consoleId: string, message: string): void {
    const eventConsole = document.getElementById(consoleId);
    if (eventConsole) {
      const logElement = document.createElement('div');
      logElement.innerHTML = message;
      eventConsole.appendChild(logElement);
      eventConsole.scrollTop = eventConsole.scrollHeight;
    }
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
    
    // Toggle Compact Mode
    const toggleCompact = document.getElementById('toggle_compact');
    if (toggleCompact) {
      toggleCompact.addEventListener('click', () => {
        // Try to find and click the sidebar compact toggle button
        const compactToggle = document.getElementById('sidebar_compact_toggle');
        if (compactToggle) {
          compactToggle.click();
          this.logToConsole('🔄 Triggered sidebar compact mode toggle');
        } else {
          this.logToConsole('❌ Sidebar compact toggle button not found');
        }
      });
    }
    
    // Clear Event Logs
    const clearEventLogs = document.getElementById('clear_event_logs');
    if (clearEventLogs) {
      clearEventLogs.addEventListener('click', () => {
        const sidebarEvents = document.getElementById('sidebar_events');
        const headerEvents = document.getElementById('header_events');
        
        if (sidebarEvents) sidebarEvents.innerHTML = '';
        if (headerEvents) headerEvents.innerHTML = '';
        
        this.logToConsole('🧹 Event logs cleared');
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
    
    // Unsubscribe from sidebar events
    if (this.sidebarDebugUnsubscribe) {
      this.sidebarDebugUnsubscribe();
      this.sidebarDebugUnsubscribe = null;
    }
    
    // Unsubscribe from header events
    if (this.headerDebugUnsubscribe) {
      this.headerDebugUnsubscribe();
      this.headerDebugUnsubscribe = null;
    }
    
    this.isInitialized = false;
  }
}

export default DebugPage;
