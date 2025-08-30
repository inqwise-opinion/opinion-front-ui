/**
 * Main application class for Opinion Front UI
 * Handles routing and page management with global layout
 */

import { MockApiService } from './services/MockApiService';
import DashboardPage from './pages/DashboardPage';
import DebugPage from './pages/DebugPage';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import MainContent from './components/MainContent';

export class OpinionApp {
  private initialized: boolean = false;
  private currentPage: any = null;
  private apiService: MockApiService;
  
  // Global layout components
  private appHeader: AppHeader | null = null;
  private appFooter: AppFooter | null = null;
  private mainContent: MainContent | null = null;

  constructor() {
    console.log('🎯 APP.TS - Constructor START');
    try {
      console.log('🎯 APP.TS - Creating MockApiService...');
      this.apiService = new MockApiService();
      console.log('✅ APP.TS - Constructor completed successfully');
    } catch (error) {
      console.error('❌ APP.TS - Constructor failed:', error);
      throw error;
    }
    console.log('🎯 APP.TS - Constructor END');
  }

  public async init(): Promise<void> {
    console.log('🎯 APP.TS - init() START');
    try {
      if (this.initialized) {
        console.warn('🎯 APP.TS - Application already initialized');
        return;
      }

      console.log('🎯 APP.TS - Setting up event listeners...');
      this.setupEventListeners();
      console.log('✅ APP.TS - Event listeners setup complete');
      
      console.log('🎯 APP.TS - Loading initial data...');
      await this.loadInitialData();
      console.log('✅ APP.TS - Initial data loaded');
      
      console.log('🎯 APP.TS - Initializing global layout...');
      await this.initializeGlobalLayout();
      console.log('✅ APP.TS - Global layout initialized');
      
      console.log('🎯 APP.TS - Initializing routing...');
      await this.initializeRouting();
      console.log('✅ APP.TS - Routing initialized');
      
      this.initialized = true;
      console.log('✅ APP.TS - Opinion Front UI - Ready');
    } catch (error) {
      console.error('❌ APP.TS - init() failed:', error);
      console.error('❌ APP.TS - Error stack:', error.stack);
      throw error;
    }
    console.log('🎯 APP.TS - init() END');
  }

  private setupEventListeners(): void {
    // Setup global event listeners
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM Content Loaded');
    });

    // Handle browser navigation
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });
  }

  private async loadInitialData(): Promise<void> {
    // Load initial application data
    try {
      // Load global configuration, user preferences, etc.
      console.log('Loading initial application data...');
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }
  
  /**
   * Initialize global layout components in semantic order (header, main, footer)
   * Note: Sidebar is self-contained and initialized by AppHeader
   */
  private async initializeGlobalLayout(): Promise<void> {
    try {
      // 1. Initialize AppHeader first (includes Sidebar)
      console.log('🏗️ APP.TS - Initializing global AppHeader...');
      this.appHeader = new AppHeader();
      await this.appHeader.init();
      
      // Set a test user
      this.appHeader.updateUser({
        username: 'Demo User',
        email: 'demo@opinion.app'
      });
      
      console.log('✅ APP.TS - Global AppHeader initialized');
      
      // 2. Initialize MainContent area (now just manages existing element)
      console.log('🏗️ APP.TS - Initializing MainContent...');
      this.mainContent = new MainContent({
        className: 'main-content',
        id: 'app', // Keep existing ID for compatibility
        ariaLabel: 'Main application content'
      });
      this.mainContent.init();
      console.log('✅ APP.TS - MainContent initialized');
      
      // 3. Initialize AppFooter last
      console.log('🏗️ APP.TS - Initializing global AppFooter...');
      this.appFooter = new AppFooter({ 
        showCopyright: true, 
        showNavigation: true,
        copyrightText: '&copy; 2024 Opinion - created by <a href="https://www.inqwise.com" target="_blank" rel="noopener noreferrer">inqwise</a>'
      });
      this.appFooter.init();
      console.log('✅ APP.TS - Global AppFooter initialized');
      
      // Semantic structure is now complete:
      // <nav class="app-sidebar"> (created by AppHeader)
      // <header class="app-header">
      // <main class="main-content">
      // <footer class="app-footer">
      
    } catch (error) {
      console.error('❌ APP.TS - Failed to initialize global layout:', error);
      throw error;
    }
  }

  /**
   * Initialize routing and load appropriate page
   */
  private async initializeRouting(): Promise<void> {
    const currentPath = window.location.pathname;
    await this.handleRoute(currentPath);
  }

  /**
   * Handle route changes
   */
  private async handleRouteChange(): Promise<void> {
    const currentPath = window.location.pathname;
    await this.handleRoute(currentPath);
  }

  /**
   * Handle specific route and load appropriate page
   */
  private async handleRoute(path: string): Promise<void> {
    console.log(`🎯 APP.TS - handleRoute('${path}') START`);
    try {
      // Clean up current page if exists
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        console.log('🎯 APP.TS - Destroying current page...');
        this.currentPage.destroy();
        console.log('✅ APP.TS - Current page destroyed');
      }

      // Route to appropriate page based on path
      // Pages will now render their content inside the semantic <main> element
      if (path === '/') {
        console.log('🎯 APP.TS - Creating DebugPage for root path...');
        this.currentPage = new DebugPage(this.mainContent);
        console.log('🎯 APP.TS - Initializing DebugPage...');
        await this.currentPage.init();
        console.log('✅ APP.TS - DebugPage initialized successfully');
      } else if (path === '/dashboard') {
        console.log('🎯 APP.TS - Creating DashboardPage...');
        this.currentPage = new DashboardPage(this.apiService, this.mainContent);
        console.log('🎯 APP.TS - Initializing DashboardPage...');
        await this.currentPage.init();
        console.log('✅ APP.TS - DashboardPage initialized successfully');
      }
      // Add more routes here as needed
      // else if (path === '/surveys') {
      //   this.currentPage = new SurveysPage();
      //   await this.currentPage.init();
      // }
      else {
        console.warn(`⚠️ APP.TS - Unknown route: ${path}`);
        console.log('🎯 APP.TS - Fallback: Creating DebugPage...');
        this.currentPage = new DebugPage(this.mainContent);
        console.log('🎯 APP.TS - Initializing fallback DebugPage...');
        await this.currentPage.init();
        console.log('✅ APP.TS - Fallback DebugPage initialized successfully');
      }
    } catch (error) {
      console.error(`❌ APP.TS - Failed to load page for route ${path}:`, error);
      console.error(`❌ APP.TS - Route error stack:`, error.stack);
      // Show error page or fallback
      throw error;
    }
    console.log(`🎯 APP.TS - handleRoute('${path}') END`);
  }

  /**
   * Navigate to a specific route
   */
  public navigateTo(path: string): void {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path);
      this.handleRouteChange();
    }
  }

  /**
   * Get current page instance
   */
  public getCurrentPage(): any {
    return this.currentPage;
  }
}
