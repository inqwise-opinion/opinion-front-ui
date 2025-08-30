/**
 * Example: Sidebar Compact Mode Subscription
 * 
 * This example demonstrates how to subscribe to compact mode changes
 * in the Sidebar component and react to state changes.
 */

import { Sidebar, CompactModeChangeHandler } from '../components/Sidebar';

// Example 1: Basic subscription
export function basicCompactModeSubscription() {
  const sidebar = new Sidebar();
  sidebar.init();

  // Subscribe to compact mode changes
  const unsubscribe = sidebar.onCompactModeChange((isCompact: boolean) => {
    console.log(`Sidebar is now ${isCompact ? 'compact' : 'normal'}`);
    
    // Update other UI elements based on compact state
    if (isCompact) {
      document.body.classList.add('sidebar-is-compact');
    } else {
      document.body.classList.remove('sidebar-is-compact');
    }
  });

  // Later, when you want to stop listening:
  // unsubscribe();

  return { sidebar, unsubscribe };
}

// Example 2: Layout Manager that responds to compact mode
export class LayoutManager {
  private sidebar: Sidebar;
  private unsubscribeFromCompactMode?: () => void;
  private header: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private footer: HTMLElement | null = null;

  constructor() {
    this.sidebar = new Sidebar();
    this.sidebar.init();
    this.setupEventListeners();
    this.findLayoutElements();
  }

  private findLayoutElements(): void {
    this.header = document.querySelector('.app-header');
    this.content = document.querySelector('.wrapper-content');
    this.footer = document.querySelector('.app-footer');
  }

  private setupEventListeners(): void {
    // Subscribe to compact mode changes
    this.unsubscribeFromCompactMode = this.sidebar.onCompactModeChange((isCompact: boolean) => {
      this.adjustLayout(isCompact);
    });
  }

  private adjustLayout(isCompact: boolean): void {
    const sidebarWidth = isCompact ? '80px' : '280px';
    const contentMargin = isCompact ? '80px' : '280px';

    // Adjust header
    if (this.header) {
      this.header.style.left = sidebarWidth;
      this.header.style.width = `calc(100vw - ${sidebarWidth})`;
    }

    // Adjust main content
    if (this.content) {
      this.content.style.marginLeft = contentMargin;
    }

    // Adjust footer
    if (this.footer) {
      this.footer.style.marginLeft = contentMargin;
      this.footer.style.width = `calc(100% - ${sidebarWidth})`;
    }

    console.log(`Layout adjusted for ${isCompact ? 'compact' : 'normal'} sidebar`);
  }

  public destroy(): void {
    // Clean up subscription
    if (this.unsubscribeFromCompactMode) {
      this.unsubscribeFromCompactMode();
    }
    
    // Clean up sidebar
    this.sidebar.destroy();
  }

  public getSidebar(): Sidebar {
    return this.sidebar;
  }
}

// Example 3: User Preferences Manager
export class UserPreferencesManager {
  private sidebar: Sidebar;
  private unsubscribeFromCompactMode?: () => void;
  private preferences: { [key: string]: any } = {};

  constructor() {
    this.sidebar = new Sidebar();
    this.sidebar.init();
    this.loadPreferences();
    this.setupEventListeners();
    this.applyInitialPreferences();
  }

  private loadPreferences(): void {
    // Load from localStorage or server
    const saved = localStorage.getItem('user-preferences');
    if (saved) {
      try {
        this.preferences = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('user-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  private setupEventListeners(): void {
    // Subscribe to compact mode changes and save preference
    this.unsubscribeFromCompactMode = this.sidebar.onCompactModeChange((isCompact: boolean) => {
      this.preferences.sidebarCompactMode = isCompact;
      this.savePreferences();
      console.log(`Saved compact mode preference: ${isCompact}`);
    });
  }

  private applyInitialPreferences(): void {
    // Apply saved compact mode preference
    const savedCompactMode = this.preferences.sidebarCompactMode;
    if (typeof savedCompactMode === 'boolean') {
      const currentCompactMode = this.sidebar.isCompactMode();
      
      // Only toggle if current state doesn't match preference
      if (currentCompactMode !== savedCompactMode) {
        const toggleButton = document.getElementById('sidebar_compact_toggle');
        if (toggleButton) {
          (toggleButton as HTMLElement).click();
        }
      }
    }
  }

  public getPreference(key: string): any {
    return this.preferences[key];
  }

  public setPreference(key: string, value: any): void {
    this.preferences[key] = value;
    this.savePreferences();
  }

  public destroy(): void {
    if (this.unsubscribeFromCompactMode) {
      this.unsubscribeFromCompactMode();
    }
    this.sidebar.destroy();
  }
}

// Example 4: Analytics Tracker
export class SidebarAnalytics {
  private sidebar: Sidebar;
  private unsubscribeFromCompactMode?: () => void;
  private events: Array<{ event: string; data: any; timestamp: Date }> = [];

  constructor() {
    this.sidebar = new Sidebar();
    this.sidebar.init();
    this.setupTracking();
  }

  private setupTracking(): void {
    // Track compact mode changes
    this.unsubscribeFromCompactMode = this.sidebar.onCompactModeChange((isCompact: boolean) => {
      this.trackEvent('sidebar_compact_mode_changed', {
        isCompact,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      });
    });
  }

  private trackEvent(event: string, data: any): void {
    const eventData = {
      event,
      data,
      timestamp: new Date()
    };
    
    this.events.push(eventData);
    console.log('Analytics Event:', eventData);
    
    // In a real application, you would send this to your analytics service
    // this.sendToAnalyticsService(eventData);
  }

  public getEvents(): Array<{ event: string; data: any; timestamp: Date }> {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
  }

  public destroy(): void {
    if (this.unsubscribeFromCompactMode) {
      this.unsubscribeFromCompactMode();
    }
    this.sidebar.destroy();
  }
}

// Example 5: Multiple Components Working Together
export function multiComponentExample() {
  const sidebar = new Sidebar();
  sidebar.init();

  // Component 1: Header adjustor
  const headerUnsubscribe = sidebar.onCompactModeChange((isCompact: boolean) => {
    const header = document.querySelector('.app-header') as HTMLElement;
    if (header) {
      header.style.left = isCompact ? '80px' : '280px';
      header.style.width = `calc(100vw - ${isCompact ? '80px' : '280px'})`;
    }
  });

  // Component 2: Content adjustor
  const contentUnsubscribe = sidebar.onCompactModeChange((isCompact: boolean) => {
    const content = document.querySelector('.wrapper-content') as HTMLElement;
    if (content) {
      content.style.marginLeft = isCompact ? '80px' : '280px';
    }
  });

  // Component 3: Footer adjustor
  const footerUnsubscribe = sidebar.onCompactModeChange((isCompact: boolean) => {
    const footer = document.querySelector('.app-footer') as HTMLElement;
    if (footer) {
      footer.style.marginLeft = isCompact ? '80px' : '280px';
      footer.style.width = `calc(100% - ${isCompact ? '80px' : '280px'})`;
    }
  });

  // Component 4: Tooltip manager
  const tooltipUnsubscribe = sidebar.onCompactModeChange((isCompact: boolean) => {
    document.body.classList.toggle('sidebar-compact-tooltips-enabled', isCompact);
  });

  // Cleanup function
  return function cleanup() {
    headerUnsubscribe();
    contentUnsubscribe();
    footerUnsubscribe();
    tooltipUnsubscribe();
    sidebar.destroy();
  };
}

// Example usage in a real application:
export function initializeSidebarWithSubscriptions() {
  // Initialize layout manager
  const layoutManager = new LayoutManager();
  
  // Initialize preferences manager
  const preferencesManager = new UserPreferencesManager();
  
  // Initialize analytics
  const analytics = new SidebarAnalytics();

  // Return cleanup function
  return function cleanup() {
    layoutManager.destroy();
    preferencesManager.destroy();
    analytics.destroy();
  };
}

// Export types for external use
export type { CompactModeChangeHandler };
