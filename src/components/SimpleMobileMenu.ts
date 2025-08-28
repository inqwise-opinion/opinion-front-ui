/**
 * Simple Mobile Menu
 * Clean implementation that only shows hamburger button on mobile (< 768px)
 * No buttons visible on desktop/tablet modes
 */

import Sidebar from './Sidebar';

export class SimpleMobileMenu {
  private sidebar: HTMLElement | null = null;
  private sidebarComponent: Sidebar | null = null;
  private overlay: HTMLElement | null = null;
  private toggleButton: HTMLElement | null = null;
  private closeButton: HTMLElement | null = null;
  
  private isOpen = false;
  private isMobileViewport = false;

  constructor() {
    console.log('SimpleMobileMenu - Creating...');
  }

  init(): void {
    console.log('SimpleMobileMenu - Initializing...');
    
    // Check viewport first to set isMobileViewport correctly
    this.checkViewport();
    
    // Find elements
    this.sidebar = document.getElementById('app_sidebar');
    this.toggleButton = document.getElementById('mobile_menu_toggle');
    this.closeButton = document.getElementById('sidebar_mobile_close');
    
    if (!this.sidebar) {
      console.warn('SimpleMobileMenu - No sidebar found, creating proper sidebar for mobile menu functionality');
      this.createProperSidebar();
    }
    
    
    // Create overlay
    this.createOverlay();
    
    // Apply CSS
    this.injectCSS();
    
    // Setup events
    this.setupEvents();
    
    console.log('SimpleMobileMenu - Ready ✅');
  }

  /**
   * Create a proper sidebar using the Sidebar component
   */
  private createProperSidebar(): void {
    console.log('SimpleMobileMenu - Creating proper sidebar with navigation...');
    
    // Create and initialize the sidebar component
    this.sidebarComponent = new Sidebar();
    this.sidebarComponent.init();
    
    // Get the sidebar element reference
    this.sidebar = this.sidebarComponent.getElement();
    
    // Update references to the close button
    this.closeButton = document.getElementById('sidebar_mobile_close');
    
    console.log('SimpleMobileMenu - Created proper sidebar with navigation ✅');
  }

  private createOverlay(): void {
    // Remove existing
    const existing = document.getElementById('simple_mobile_overlay');
    if (existing) existing.remove();
    
    // Create new
    this.overlay = document.createElement('div');
    this.overlay.id = 'simple_mobile_overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.5);
      z-index: 999;
      display: none;
    `;
    
    document.body.appendChild(this.overlay);
  }


  private injectCSS(): void {
    const style = document.createElement('style');
    style.id = 'simple-mobile-menu-css';
    style.textContent = `
      /* Default: Hide all mobile menu elements */
      #mobile_menu_toggle,
      #sidebar_mobile_close {
        display: none !important;
      }
      
      /* Mobile only (< 768px) */
      @media (max-width: 767px) {
        /* Show hamburger button - enhanced styling */
        #mobile_menu_toggle {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%) !important;
          border: 1px solid #e3e6ea !important;
          padding: 9px !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          box-shadow: 
            0 2px 4px rgba(0,0,0,0.08),
            0 4px 12px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.8) !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          width: 42px !important;
          height: 42px !important;
          flex-shrink: 0 !important;
          position: relative !important;
          z-index: 1050 !important;
          margin-right: 0 !important;
          backdrop-filter: blur(10px) !important;
        }
        
        /* Enhanced hamburger icon styling */
        #mobile_menu_toggle .menu-icon span {
          background: linear-gradient(135deg, #495057 0%, #6c757d 100%) !important;
          border-radius: 1px !important;
          box-shadow: 0 0.5px 1px rgba(0,0,0,0.1) !important;
        }
        
        /* Target the actual header structure - premium styling */
        .app-header, #app_header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0 16px !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          height: 58px !important;
          z-index: 1000 !important;
          background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%) !important;
          border-bottom: 1px solid rgba(0,0,0,0.08) !important;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.06),
            0 2px 8px rgba(0,0,0,0.04),
            0 4px 16px rgba(0,0,0,0.02) !important;
          box-sizing: border-box !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
        }
        
        /* Add subtle top highlight */
        .app-header::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 1px !important;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 20%, rgba(255,255,255,0.8) 80%, transparent 100%) !important;
          z-index: 1 !important;
        }
        
        /* Style the actual h1 title - premium typography */
        .app-header h1 {
          position: absolute !important;
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
          margin: 0 !important;
          font-size: 19px !important;
          font-weight: 700 !important;
          background: linear-gradient(135deg, #212529 0%, #495057 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          z-index: 1001 !important;
          white-space: nowrap !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
          letter-spacing: -0.02em !important;
          line-height: 1.2 !important;
        }
        
        /* Ensure hamburger button is positioned correctly */
        .mobile-menu-toggle {
          position: relative !important;
          z-index: 1050 !important;
          order: -1 !important; /* Place at the beginning of flex */
        }
        
        /* Add space for potential user menu */
        .app-header > *:last-child:not(.mobile-menu-toggle):not(h1) {
          margin-left: auto !important;
          z-index: 1049 !important;
        }
        
        /* Title styling */
        .header-breadcrumbs {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .breadcrumb-list {
          margin: 0 !important;
          padding: 0 !important;
          list-style: none !important;
        }
        
        .breadcrumb-item {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .breadcrumb-text {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #333 !important;
          margin: 0 !important;
          padding: 0 !important;
          pointer-events: auto !important;
        }
        
        /* Add top margin to main content to account for fixed header */
        .main-content {
          margin-top: 56px !important;
        }
        
        /* Also adjust body padding if needed */
        body {
          padding-top: 0 !important;
        }
        
        /* Enhanced hover and active states for hamburger button */
        #mobile_menu_toggle:hover {
          background: linear-gradient(145deg, #f8f9ff 0%, #e3f2fd 100%) !important;
          border-color: #007bff !important;
          transform: translateY(-1px) !important;
          box-shadow: 
            0 3px 6px rgba(0,123,255,0.15),
            0 6px 16px rgba(0,123,255,0.1),
            inset 0 1px 0 rgba(255,255,255,0.9) !important;
        }
        
        #mobile_menu_toggle:active {
          transform: translateY(0) !important;
          box-shadow: 
            0 1px 3px rgba(0,123,255,0.2),
            0 2px 6px rgba(0,123,255,0.1),
            inset 0 1px 0 rgba(255,255,255,0.7) !important;
        }
        
        
        /* Hide toggle button when menu is open */
        body.mobile-menu-open #mobile_menu_toggle {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Style sidebar for mobile overlay - override SCSS styles */
        #app_sidebar.app-sidebar {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 320px !important;
          max-width: 85vw !important;
          height: 100vh !important;
          z-index: 1020 !important;
          background: white !important;
          transform: translateX(-100%) !important;
          transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
          box-shadow: 2px 0 20px rgba(0,0,0,0.15) !important;
          border-radius: 0 12px 12px 0 !important;
        }
        
        /* Show sidebar when open */
        #app_sidebar.mobile-open {
          transform: translateX(0) !important;
        }
        
        /* Style close button - better positioning and appearance */
        #sidebar_mobile_close {
          display: none !important; /* Hidden by default */
        }
        
        /* Show and style close button when sidebar is open */
        #app_sidebar.mobile-open #sidebar_mobile_close {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          position: absolute !important;
          top: 15px !important;
          right: 15px !important;
          width: 36px !important;
          height: 36px !important;
          background: rgba(0,0,0,0.1) !important;
          color: #333 !important;
          border: none !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          font-size: 20px !important;
          font-weight: bold !important;
          line-height: 1 !important;
          z-index: 1025 !important;
          transition: all 0.2s ease !important;
          backdrop-filter: blur(10px) !important;
        }
        
        #app_sidebar.mobile-open #sidebar_mobile_close:hover {
          background: rgba(0,0,0,0.2) !important;
          transform: scale(1.1) !important;
        }
        
        #app_sidebar.mobile-open #sidebar_mobile_close:active {
          transform: scale(0.95) !important;
        }
        
        /* Footer on mobile - full width */
        .app-footer {
          width: 100% !important;
          margin-left: 0 !important;
        }
        
        .app-footer .footer-container {
          margin-left: 0 !important;
          padding: 0 20px !important;
        }
        
        .footer-content {
          flex-direction: column !important;
          text-align: center !important;
          gap: 15px !important;
        }
      }
      
      /* Desktop/Tablet (>= 768px): Show sidebar and hide mobile overlay */
      @media (min-width: 768px) {
        #simple_mobile_overlay {
          display: none !important;
        }
        
        /* Show sidebar on desktop */
        #app_sidebar {
          transform: translateX(0) !important;
          z-index: 100 !important;
          border-radius: 0 !important;
          box-shadow: 1px 0 3px rgba(0,0,0,0.1) !important;
        }
        
        /* Fix app header positioning and width for tablet/desktop */
        .app-header, #app_header {
          position: fixed !important;
          top: 0 !important;
          left: 280px !important;
          width: calc(100vw - 280px) !important;
          height: 60px !important;
          z-index: 1000 !important;
          background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%) !important;
          border-bottom: 1px solid rgba(0,0,0,0.08) !important;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.06),
            0 2px 8px rgba(0,0,0,0.04),
            0 4px 16px rgba(0,0,0,0.02) !important;
          box-sizing: border-box !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          transition: all 0.3s ease !important;
        }
        
        /* Adjust header for compact sidebar mode */
        .app-sidebar.sidebar-compact ~ * .app-header,
        .app-sidebar.sidebar-compact ~ * #app_header,
        body:has(.app-sidebar.sidebar-compact) .app-header,
        body:has(.app-sidebar.sidebar-compact) #app_header {
          left: 80px !important;
          width: calc(100vw - 80px) !important;
        }
        
        /* Ensure sidebar header is visible */
        #app_sidebar .sidebar-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0 20px !important;
          background: #fff !important;
          height: 60px !important;
          min-height: 60px !important;
          flex-shrink: 0 !important;
          border-bottom: 1px solid #e0e6ed !important;
        }
        
        /* Sidebar brand visibility */
        #app_sidebar .sidebar-brand {
          display: flex !important;
          align-items: center !important;
        }
        
        #app_sidebar .brand-title {
          display: block !important;
          font-size: 20px !important;
          font-weight: 600 !important;
          color: #007bff !important;
          margin: 0 !important;
        }
        
        /* Sidebar controls */
        #app_sidebar .sidebar-controls {
          display: flex !important;
          align-items: center !important;
        }
        
        /* Enhanced compact toggle button styling */
        #app_sidebar .sidebar-compact-toggle {
          background: transparent !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          cursor: pointer !important;
          padding: 10px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #6c757d !important;
          min-width: 40px !important;
          min-height: 40px !important;
          font-size: 18px !important;
          opacity: 0.8 !important;
          position: relative !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.04),
            0 1px 2px rgba(0,0,0,0.06) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
        }
        
        #app_sidebar .sidebar-compact-toggle:hover {
          opacity: 1 !important;
          background: rgba(0, 123, 255, 0.06) !important;
          border-color: rgba(0, 123, 255, 0.2) !important;
          color: #007bff !important;
          transform: translateY(-1px) !important;
          box-shadow: 
            0 2px 6px rgba(0, 123, 255, 0.1),
            0 4px 12px rgba(0, 123, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
        }
        
        #app_sidebar .sidebar-compact-toggle:active {
          transform: translateY(0) !important;
          background: rgba(0, 123, 255, 0.1) !important;
          box-shadow: 
            0 1px 3px rgba(0, 123, 255, 0.2),
            inset 0 1px 2px rgba(0, 123, 255, 0.1) !important;
        }
        
        #app_sidebar .sidebar-compact-toggle:focus {
          outline: 2px solid rgba(0, 123, 255, 0.3) !important;
          outline-offset: 2px !important;
          border-radius: 8px !important;
        }
        
        /* Compact toggle icon styling */
        #app_sidebar .sidebar-compact-toggle .compact-icon {
          font-weight: 600 !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 100% !important;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        
        /* Compact mode specific adjustments - keep button size consistent */
        .app-sidebar.sidebar-compact .sidebar-compact-toggle {
          min-width: 40px !important;
          min-height: 40px !important;
          padding: 10px !important;
          font-size: 18px !important;
          border-radius: 8px !important;
        }
        
        .app-sidebar.sidebar-compact .sidebar-controls {
          justify-content: center !important;
          width: 100% !important;
        }
        
        /* Hide brand elements in compact mode */
        .app-sidebar.sidebar-compact .sidebar-brand {
          display: none !important;
        }
        
        .app-sidebar.sidebar-compact .brand-title {
          display: none !important;
        }
        
        .app-sidebar.sidebar-compact .brand-title-link {
          display: none !important;
        }
        
        /* Adjust sidebar header for compact mode */
        .app-sidebar.sidebar-compact .sidebar-header {
          justify-content: center !important;
          padding: 0 10px !important;
        }
        
        /* Add subtle animation for the toggle icon */
        #app_sidebar .sidebar-compact-toggle .compact-icon {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        #app_sidebar .sidebar-compact-toggle:hover .compact-icon {
          transform: scale(1.1) !important;
        }
        
        #app_sidebar .sidebar-compact-toggle:active .compact-icon {
          transform: scale(0.95) !important;
        }
        
        /* Fix Material Icons to prevent duplicate text */
        #app_sidebar .material-icons {
          font-family: 'Material Icons' !important;
          font-weight: normal !important;
          font-style: normal !important;
          font-size: 20px !important;
          line-height: 1 !important;
          letter-spacing: normal !important;
          text-transform: none !important;
          display: inline-block !important;
          white-space: nowrap !important;
          word-wrap: normal !important;
          direction: ltr !important;
          -webkit-font-feature-settings: 'liga' !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
          -moz-osx-font-smoothing: grayscale !important;
          font-feature-settings: 'liga' !important;
          color: inherit !important; /* Allow color inheritance */
        }
        
        /* Ensure nav icons are visible and properly styled */
        #app_sidebar .nav-icon {
          font-family: 'Material Icons' !important;
          font-weight: normal !important;
          font-style: normal !important;
          font-size: 20px !important;
          line-height: 1 !important;
          letter-spacing: normal !important;
          text-transform: none !important;
          display: inline-block !important;
          white-space: nowrap !important;
          word-wrap: normal !important;
          direction: ltr !important;
          -webkit-font-feature-settings: 'liga' !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
          -moz-osx-font-smoothing: grayscale !important;
          font-feature-settings: 'liga' !important;
          width: 20px !important;
          height: 20px !important;
          text-align: center !important;
          color: inherit !important;
          margin-right: 12px !important;
        }
        
        /* Navigation item tooltips - always visible on desktop */
        #app_sidebar .nav-link {
          position: relative !important;
        }
        
        #app_sidebar .nav-link::after {
          content: attr(data-title) !important;
          position: absolute !important;
          left: calc(100% + 15px) !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          background: rgba(0, 0, 0, 0.9) !important;
          color: white !important;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          white-space: nowrap !important;
          opacity: 0 !important;
          visibility: hidden !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          pointer-events: none !important;
          z-index: 1050 !important;
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.15),
            0 2px 6px rgba(0, 0, 0, 0.1) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
          letter-spacing: 0.01em !important;
        }
        
        /* Tooltip arrow */
        #app_sidebar .nav-link::before {
          content: '' !important;
          position: absolute !important;
          left: calc(100% + 9px) !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 0 !important;
          height: 0 !important;
          border: 6px solid transparent !important;
          border-right-color: rgba(0, 0, 0, 0.9) !important;
          opacity: 0 !important;
          visibility: hidden !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          pointer-events: none !important;
          z-index: 1049 !important;
        }
        
        /* Show tooltip on hover */
        #app_sidebar .nav-link:hover::after,
        #app_sidebar .nav-link:hover::before {
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        /* Enhanced tooltip animation on hover */
        #app_sidebar .nav-link:hover::after {
          transform: translateY(-50%) translateX(5px) !important;
        }
        
        #app_sidebar .nav-link:hover::before {
          transform: translateY(-50%) translateX(5px) !important;
        }
        
        /* Hide tooltips in normal mode when text is visible */
        #app_sidebar:not(.sidebar-compact) .nav-link::after,
        #app_sidebar:not(.sidebar-compact) .nav-link::before {
          display: none !important;
        }
        
        /* Show tooltips only in compact mode */
        #app_sidebar.sidebar-compact .nav-link::after,
        #app_sidebar.sidebar-compact .nav-link::before {
          display: block !important;
        }
        
        /* Remove any pseudo-elements that might be creating duplicates */
        #app_sidebar .nav-icon::before,
        #app_sidebar .nav-icon::after {
          display: none !important;
          content: none !important;
        }
        
        /* Add margin to main content on desktop */
        .wrapper-content {
          margin-left: 280px !important;
          transition: margin-left 0.3s ease !important;
        }
        
        /* Adjust content wrapper for compact sidebar mode */
        .app-sidebar.sidebar-compact ~ * .wrapper-content,
        body:has(.app-sidebar.sidebar-compact) .wrapper-content,
        body[data-sidebar-state="compact"] .wrapper-content {
          margin-left: 80px !important;
        }
        
        #app {
          padding-top: 60px !important; /* Account for header height */
        }
        
        /* Footer positioning for desktop with sidebar */
        .app-footer {
          position: relative !important;
          width: calc(100vw - 280px) !important;
          margin-left: 280px !important;
          background: #f8f9fa !important;
          border-top: 1px solid #dee2e6 !important;
          margin-top: auto !important;
          box-sizing: border-box !important;
          transition: all 0.3s ease !important;
        }
        
        /* Adjust footer for compact sidebar mode */
        .app-sidebar.sidebar-compact ~ * .app-footer,
        body:has(.app-sidebar.sidebar-compact) .app-footer,
        body[data-sidebar-state="compact"] .app-footer {
          width: calc(100vw - 80px) !important;
          margin-left: 80px !important;
        }
        
        .app-footer .footer-container {
          margin-left: 0 !important;
          margin-right: 0 !important;
          padding: 0 20px !important;
          width: 100% !important;
          max-width: none !important;
          box-sizing: border-box !important;
        }
      }
    `;
    
    // Remove existing style
    const existing = document.getElementById('simple-mobile-menu-css');
    if (existing) existing.remove();
    
    document.head.appendChild(style);
    console.log('SimpleMobileMenu - CSS injected');
  }

  private setupEvents(): void {
    // Toggle button
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('SimpleMobileMenu - Toggle clicked');
        this.toggle();
      });
    }
    
    // Close button
    if (this.closeButton) {
      this.closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('SimpleMobileMenu - Close clicked');
        this.close();
      });
    }
    
    // Overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', () => {
        console.log('SimpleMobileMenu - Overlay clicked');
        this.close();
      });
    }
    
    // Window resize
    window.addEventListener('resize', () => {
      this.checkViewport();
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  private checkViewport(): void {
    const wasMobile = this.isMobileViewport;
    this.isMobileViewport = window.innerWidth < 768;
    
    console.log(`SimpleMobileMenu - Viewport: ${window.innerWidth}px, mobile: ${this.isMobileViewport}`);
    
    // Close if switching from mobile to desktop
    if (wasMobile && !this.isMobileViewport && this.isOpen) {
      this.close();
    }
    
    // Clean up mobile classes when switching to desktop
    if (wasMobile && !this.isMobileViewport && this.sidebar) {
      this.sidebar.classList.remove('mobile-open');
      console.log('SimpleMobileMenu - Cleaned up mobile classes for desktop');
    }
  }

  toggle(): void {
    if (!this.isMobileViewport) {
      console.log('SimpleMobileMenu - Not mobile, ignoring toggle');
      return;
    }
    
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (!this.isMobileViewport) {
      console.log('SimpleMobileMenu - Not mobile, ignoring open');
      return;
    }
    
    console.log('SimpleMobileMenu - Opening...');
    
    this.isOpen = true;
    
    // Show sidebar
    if (this.sidebar) {
      this.sidebar.classList.add('mobile-open');
    }
    
    // Show overlay
    if (this.overlay) {
      this.overlay.style.display = 'block';
    }
    
    // Add body class to hide toggle button
    document.body.classList.add('mobile-menu-open');
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    console.log('SimpleMobileMenu - Opened ✅');
  }

  close(): void {
    console.log('SimpleMobileMenu - Closing...');
    
    this.isOpen = false;
    
    // Hide sidebar
    if (this.sidebar) {
      this.sidebar.classList.remove('mobile-open');
    }
    
    // Hide overlay
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    
    // Remove body class to show toggle button again
    document.body.classList.remove('mobile-menu-open');
    
    // Unlock body scroll
    document.body.style.overflow = '';
    
    console.log('SimpleMobileMenu - Closed ✅');
  }

  getState() {
    return {
      isOpen: this.isOpen,
      isMobile: this.isMobileViewport
    };
  }
  

  destroy(): void {
    this.close();
    
    // Clean up overlay
    if (this.overlay) {
      this.overlay.remove();
    }
    
    // Clean up CSS
    const style = document.getElementById('simple-mobile-menu-css');
    if (style) {
      style.remove();
    }
    
    console.log('SimpleMobileMenu - Destroyed');
  }
}

export default SimpleMobileMenu;
