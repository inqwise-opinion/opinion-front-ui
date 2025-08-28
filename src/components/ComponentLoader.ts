/**
 * Component Loading Orchestrator
 * Manages the proper loading sequence of layout components
 * Order: Sidebar Header > App Header > Sidebar Menu > Sidebar Footer > Page Content
 */

import { Sidebar } from './Sidebar';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

export interface LoadingCallbacks {
  onSidebarHeaderLoaded?: () => void;
  onAppHeaderLoaded?: () => void;
  onSidebarMenuLoaded?: () => void;
  onSidebarFooterLoaded?: () => void;
  onPageContentLoaded?: () => void;
  onAllComponentsLoaded?: () => void;
}

export interface ComponentLoaderConfig {
  enableSidebar?: boolean;
  enableHeader?: boolean;
  enableFooter?: boolean;
  callbacks?: LoadingCallbacks;
}

export class ComponentLoader {
  private config: ComponentLoaderConfig;
  private sidebar: Sidebar | null = null;
  private header: AppHeader | null = null;
  private footer: AppFooter | null = null;
  private loadingStages: string[] = [];
  private isLoading: boolean = false;

  constructor(config: ComponentLoaderConfig = {}) {
    this.config = {
      enableSidebar: true,
      enableHeader: true,
      enableFooter: true,
      ...config
    };

    console.log('🔄 ComponentLoader - Initialized with config:', this.config);
  }

  /**
   * Start the component loading sequence
   */
  async loadComponents(): Promise<void> {
    if (this.isLoading) {
      console.warn('⚠️ ComponentLoader - Loading already in progress');
      return;
    }

    this.isLoading = true;
    this.loadingStages = [];

    console.log('🚀 ComponentLoader - Starting component loading sequence...');

    try {
      // Stage 1: Sidebar Header
      await this.loadSidebarHeader();
      
      // Stage 2: App Header
      await this.loadAppHeader();
      
      // Stage 3: Sidebar Menu
      await this.loadSidebarMenu();
      
      // Stage 4: Sidebar Footer
      await this.loadSidebarFooter();
      
      // Stage 5: Page Content (handled by caller)
      await this.prepareForPageContent();

      // All components loaded
      this.onAllComponentsLoaded();

    } catch (error) {
      console.error('❌ ComponentLoader - Loading failed:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Stage 1: Load Sidebar Header
   */
  private async loadSidebarHeader(): Promise<void> {
    console.log('1️⃣ ComponentLoader - Loading Sidebar Header...');
    
    if (!this.config.enableSidebar) {
      console.log('⏭️  ComponentLoader - Sidebar disabled, skipping header');
      return;
    }

    try {
      // Create sidebar instance but only initialize the header part
      this.sidebar = new Sidebar();
      
      // Create temporary sidebar header element if it doesn't exist
      this.createSidebarHeaderIfNeeded();
      
      // Wait for element to be properly added to DOM
      await this.waitForElement('.sidebar-header');
      
      this.loadingStages.push('sidebar-header');
      console.log('✅ ComponentLoader - Sidebar Header loaded');
      
      // Call callback
      this.config.callbacks?.onSidebarHeaderLoaded?.();
      
      // Wait for next frame to ensure rendering is complete
      await this.nextFrame();
      
    } catch (error) {
      console.error('❌ ComponentLoader - Sidebar Header loading failed:', error);
      throw error;
    }
  }

  /**
   * Stage 2: Load App Header
   */
  private async loadAppHeader(): Promise<void> {
    console.log('2️⃣ ComponentLoader - Loading App Header...');
    
    if (!this.config.enableHeader) {
      console.log('⏭️  ComponentLoader - Header disabled, skipping');
      return;
    }

    try {
      this.header = new AppHeader();
      await this.header.init();
      
      this.loadingStages.push('app-header');
      console.log('✅ ComponentLoader - App Header loaded');
      
      // Call callback
      this.config.callbacks?.onAppHeaderLoaded?.();
      
      // Wait for next frame to ensure rendering is complete
      await this.nextFrame();
      
    } catch (error) {
      console.error('❌ ComponentLoader - App Header loading failed:', error);
      throw error;
    }
  }

  /**
   * Stage 3: Load Sidebar Menu
   */
  private async loadSidebarMenu(): Promise<void> {
    console.log('3️⃣ ComponentLoader - Loading Sidebar Menu...');
    
    if (!this.config.enableSidebar) {
      console.log('⏭️  ComponentLoader - Sidebar disabled, skipping menu');
      return;
    }

    try {
      // Initialize the full sidebar (including navigation)
      if (this.sidebar) {
        await this.sidebar.init();
      } else {
        this.sidebar = new Sidebar();
        await this.sidebar.init();
      }
      
      // Wait for navigation elements to be available
      await this.waitForElement('.sidebar-navigation');
      
      this.loadingStages.push('sidebar-menu');
      console.log('✅ ComponentLoader - Sidebar Menu loaded');
      
      // Call callback
      this.config.callbacks?.onSidebarMenuLoaded?.();
      
      // Wait for next frame to ensure rendering is complete
      await this.nextFrame();
      
    } catch (error) {
      console.error('❌ ComponentLoader - Sidebar Menu loading failed:', error);
      throw error;
    }
  }

  /**
   * Stage 4: Load Sidebar Footer
   */
  private async loadSidebarFooter(): Promise<void> {
    console.log('4️⃣ ComponentLoader - Loading Sidebar Footer...');
    
    if (!this.config.enableSidebar) {
      console.log('⏭️  ComponentLoader - Sidebar disabled, skipping footer');
      return;
    }

    try {
      // Sidebar footer is part of the sidebar structure
      // Just ensure it's properly styled and visible
      await this.ensureSidebarFooterReady();
      
      this.loadingStages.push('sidebar-footer');
      console.log('✅ ComponentLoader - Sidebar Footer loaded');
      
      // Call callback
      this.config.callbacks?.onSidebarFooterLoaded?.();
      
      // Wait for next frame to ensure rendering is complete
      await this.nextFrame();
      
    } catch (error) {
      console.error('❌ ComponentLoader - Sidebar Footer loading failed:', error);
      throw error;
    }
  }

  /**
   * Stage 5: Prepare for Page Content
   */
  private async prepareForPageContent(): Promise<void> {
    console.log('5️⃣ ComponentLoader - Preparing for Page Content...');
    
    try {
      // Ensure all layout components are ready for page content
      await this.setupLayoutForContent();
      
      this.loadingStages.push('page-content-ready');
      console.log('✅ ComponentLoader - Ready for Page Content');
      
      // Call callback
      this.config.callbacks?.onPageContentLoaded?.();
      
      // Wait for next frame to ensure rendering is complete
      await this.nextFrame();
      
    } catch (error) {
      console.error('❌ ComponentLoader - Page Content preparation failed:', error);
      throw error;
    }
  }

  /**
   * Create sidebar header if needed (temporary during loading)
   */
  private createSidebarHeaderIfNeeded(): void {
    const existingHeader = document.querySelector('.sidebar-header');
    if (existingHeader) {
      console.log('ComponentLoader - Sidebar header already exists');
      return;
    }

    // Create a minimal sidebar header for early loading
    const sidebarElement = document.getElementById('app_sidebar') || this.createMinimalSidebar();
    const headerElement = document.createElement('div');
    headerElement.className = 'sidebar-header';
    headerElement.innerHTML = `
      <div class="sidebar-brand">
        <a href="/dashboard" class="brand-title-link">
          <h1 class="brand-title">Opinion</h1>
        </a>
      </div>
      <div class="sidebar-controls">
        <button class="sidebar-compact-toggle" id="sidebar_compact_toggle" title="Toggle Compact View">
          <span class="compact-icon">⟨⟩</span>
        </button>
      </div>
    `;

    sidebarElement.appendChild(headerElement);
    console.log('ComponentLoader - Created sidebar header');
  }

  /**
   * Create minimal sidebar structure if needed
   */
  private createMinimalSidebar(): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.id = 'app_sidebar';
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = '<div class="sidebar-wrapper"></div>';
    document.body.appendChild(sidebar);
    return sidebar;
  }

  /**
   * Ensure sidebar footer is ready
   */
  private async ensureSidebarFooterReady(): Promise<void> {
    const sidebarFooter = await this.waitForElement('.sidebar-footer');
    if (sidebarFooter) {
      // Add loading complete class
      sidebarFooter.classList.add('footer-loaded');
      console.log('ComponentLoader - Sidebar footer ready');
    }
  }

  /**
   * Setup layout for content loading
   */
  private async setupLayoutForContent(): Promise<void> {
    // Add body class to indicate layout is ready
    document.body.classList.add('layout-ready');
    
    // Ensure main content area exists
    let mainContent = document.querySelector('.main-content');
    if (!mainContent) {
      mainContent = document.createElement('div');
      mainContent.className = 'main-content';
      document.body.appendChild(mainContent);
      
      // Wait for element to be properly added
      await this.waitForElement('.main-content');
    }
    
    mainContent.classList.add('content-ready');
    console.log('ComponentLoader - Layout prepared for content');
  }

  /**
   * All components loaded callback
   */
  private onAllComponentsLoaded(): void {
    console.log('🎉 ComponentLoader - All components loaded successfully!');
    console.log('📊 ComponentLoader - Loading stages completed:', this.loadingStages);
    
    // Add body class to indicate all components are loaded
    document.body.classList.add('all-components-loaded');
    
    // Call callback
    this.config.callbacks?.onAllComponentsLoaded?.();
  }

  /**
   * Get current loading stage
   */
  getLoadingStage(): string {
    return this.loadingStages[this.loadingStages.length - 1] || 'not-started';
  }

  /**
   * Check if loading is complete
   */
  isLoadingComplete(): boolean {
    return this.loadingStages.includes('page-content-ready') && !this.isLoading;
  }

  /**
   * Get loaded components
   */
  getLoadedComponents(): { sidebar: Sidebar | null; header: AppHeader | null; footer: AppFooter | null } {
    return {
      sidebar: this.sidebar,
      header: this.header,
      footer: this.footer
    };
  }

  /**
   * Force reload all components
   */
  async reloadComponents(): Promise<void> {
    console.log('🔄 ComponentLoader - Reloading all components...');
    
    // Clear existing components
    this.loadingStages = [];
    document.body.classList.remove('layout-ready', 'all-components-loaded');
    
    // Reload
    await this.loadComponents();
  }

  /**
   * Wait for DOM element to be available
   */
  private async waitForElement(selector: string, timeout: number = 3000): Promise<HTMLElement | null> {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      return element;
    }

    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Wait for next animation frame
   */
  private async nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  /**
   * Wait for multiple frames (for complex rendering)
   */
  private async waitFrames(count: number = 2): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.nextFrame();
    }
  }
}

export default ComponentLoader;
