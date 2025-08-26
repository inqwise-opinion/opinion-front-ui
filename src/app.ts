/**
 * Main application class for Opinion Front UI
 * Handles routing and page management
 */

import { MockApiService } from './services/MockApiService';
import DashboardPage from './pages/DashboardPage';

export class OpinionApp {
  private initialized: boolean = false;
  private currentPage: any = null;
  private apiService: MockApiService;

  constructor() {
    console.log('Opinion Front UI - Initializing...');
    this.apiService = new MockApiService();
  }

  public async init(): Promise<void> {
    if (this.initialized) {
      console.warn('Application already initialized');
      return;
    }

    this.setupEventListeners();
    await this.loadInitialData();
    await this.initializeRouting();
    this.initialized = true;
    
    console.log('Opinion Front UI - Ready');
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
    // Clean up current page if exists
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy();
    }

    try {
      // Route to appropriate page based on path
      if (path === '/' || path === '/dashboard') {
        this.currentPage = new DashboardPage(this.apiService);
        await this.currentPage.init();
      }
      // Add more routes here as needed
      // else if (path === '/surveys') {
      //   this.currentPage = new SurveysPage();
      //   await this.currentPage.init();
      // }
      else {
        console.warn(`Unknown route: ${path}`);
        // Fallback to dashboard
        this.currentPage = new DashboardPage(this.apiService);
        await this.currentPage.init();
      }
    } catch (error) {
      console.error(`Failed to load page for route ${path}:`, error);
      // Show error page or fallback
    }
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
