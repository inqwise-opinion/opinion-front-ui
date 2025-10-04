/**
 * Dashboard Page Integration
 * Integrates dashboard with semantic main content structure
 */

import Dashboard from './Dashboard';
import { MockApiService } from '../services/MockApiService';
import MainContentImpl from '../components/MainContentImpl';
import { PageComponent } from '../components/PageComponent';
import type { PageContext } from '../interfaces/PageContext';
import '../assets/styles/dashboard.scss';

export class DashboardPage extends PageComponent {
  private dashboard: Dashboard;
  private apiService: MockApiService;

  constructor(mainContent: MainContentImpl, pageContext: PageContext) {
    super(mainContent, pageContext, {
      pageTitle: 'Dashboard - Opinion',
      pageId: 'dashboard',
      autoInit: false
    });
    
    this.apiService = new MockApiService();
    this.dashboard = new Dashboard(this.apiService);
  }

  /**
   * Initialize and render the dashboard page
   */
  protected async onInit(): Promise<void> {
    try {
      this.logger.debug('Initializing...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      await this.render();
      
      this.logger.info('Ready');
    } catch (error) {
      this.logger.error('Initialization failed', error);
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
      this.logger.error('Render failed', error);
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

      // Always use MainContent component as it's required
      this.mainContent.setContent(bodyContent);
      this.logger.debug('Template loaded into semantic <main> element');
      
      this.logger.info('Template loaded');
    } catch (error) {
      this.logger.error('Failed to load template', error);
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
    this.logger.debug('Responsive behavior delegated to LayoutContext');
  }

  /**
   * Handle navigation to different routes
   */
  private navigateTo(path: string): void {
    this.logger.debug(`Navigating to: ${path}`);
    
    // In a full SPA, this would handle routing
    // For now, use standard navigation
    window.location.href = path;
  }


  /**
   * Cleanup when page is destroyed
   */
  protected onDestroy(): void {
    this.logger.debug('Destroying...');
    
    // Clean up event listeners and resources
    // Remove any global event listeners
    // Stop any running timers or intervals
  }
  
  /**
   * Setup event listeners for the dashboard page
   */
  protected setupEventListeners(): void {
    // Set up event delegation for dashboard actions
    this.setupEventDelegation();
    
    // Additional dashboard-specific event listeners can be added here
  }
}

export default DashboardPage;
