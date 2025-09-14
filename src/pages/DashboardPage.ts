/**
 * Dashboard Page Integration
 * Integrates dashboard with semantic main content structure
 */

import Dashboard from './Dashboard';
import { MockApiService } from '../services/MockApiService';
import { MainContentImpl } from '../components/MainContentImpl';
import '../assets/styles/dashboard.scss';

export class DashboardPage {
  private dashboard: Dashboard;
  private apiService: MockApiService;
  private mainContent: MainContentImpl | null = null;

  constructor(apiService: MockApiService, mainContent: MainContentImpl | null = null) {
    this.apiService = apiService;
    this.mainContent = mainContent;
    this.dashboard = new Dashboard(this.apiService);
  }

  /**
   * Initialize and render the dashboard page
   */
  async init(): Promise<void> {
    try {
      console.log('DashboardPage - Initializing...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.render());
      } else {
        await this.render();
      }
      
      console.log('DashboardPage - Ready');
    } catch (error) {
      console.error('DashboardPage initialization failed:', error);
      throw error;
    }
  }

  /**
   * Render the dashboard page
   */
  private async render(): Promise<void> {
    try {
      // Load and inject HTML template
      await this.loadTemplate();
      
      // Initialize dashboard functionality
      await this.dashboard.init();
      
      // Setup page-level event handlers
      this.setupPageHandlers();
      
    } catch (error) {
      console.error('Dashboard render failed:', error);
      throw error;
    }
  }

  /**
   * Load HTML template into semantic main element
   */
  private async loadTemplate(): Promise<void> {
    try {
      // Load the dashboard HTML template
      const response = await fetch('/dashboard.html');
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }
      
      const templateHtml = await response.text();
      
      // Extract the body content from the template
      const parser = new DOMParser();
      const doc = parser.parseFromString(templateHtml, 'text/html');
      const bodyContent = doc.body.innerHTML;

      // Use MainContent component if available, otherwise fallback to #app
      if (this.mainContent) {
        this.mainContent.setContent(bodyContent);
        console.log('Dashboard template loaded into semantic <main> element');
      } else {
        const appEl = document.getElementById('app');
        if (!appEl) throw new Error('No #app element found for dashboard content');
        appEl.innerHTML = bodyContent;
        console.log('Dashboard template loaded into fallback #app element');
      }
      
      console.log('Dashboard template loaded');
    } catch (error) {
      console.error('Failed to load dashboard template:', error);
      throw error;
    }
  }

  /**
   * Setup page-level event handlers
   */
  private setupPageHandlers(): void {
    // Handle navigation
    this.setupNavigationHandlers();
    
    // Handle responsive behavior
    this.setupResponsiveHandlers();
  }

  /**
   * Setup navigation event handlers
   */
  private setupNavigationHandlers(): void {
    const navLinks = document.querySelectorAll('.header-navigation-tabs a');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = (e.target as HTMLAnchorElement).getAttribute('href');
        
        // Handle SPA navigation if needed
        if (href && !href.startsWith('http')) {
          e.preventDefault();
          this.navigateTo(href);
        }
      });
    });
  }

  /**
   * Setup responsive behavior handlers
   */
  private setupResponsiveHandlers(): void {
    // Responsive behavior is now handled by LayoutContext centrally
    // Page components should rely on CSS-based responsive design
    console.log('DashboardPage - Responsive behavior delegated to LayoutContext');
  }

  /**
   * Handle navigation to different routes
   */
  private navigateTo(path: string): void {
    console.log(`Navigating to: ${path}`);
    
    // In a full SPA, this would handle routing
    // For now, use standard navigation
    window.location.href = path;
  }

  /**
   * Handle window resize events
   */
  private handleResize(): void {
    const width = window.innerWidth;
    
    // Adjust layout based on screen size
    if (width < 768) {
      document.body.classList.add('mobile-layout');
    } else {
      document.body.classList.remove('mobile-layout');
    }
  }

  /**
   * Cleanup when page is destroyed
   */
  destroy(): void {
    console.log('DashboardPage - Destroying...');
    
    // Clean up event listeners and resources
    // Remove any global event listeners
    // Stop any running timers or intervals
  }
}

export default DashboardPage;
