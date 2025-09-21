/**
 * Tests for OpinionApp class
 */

import { OpinionApp } from '../../../src/app';


describe('OpinionApp', () => {
  let app: OpinionApp;

  beforeEach(() => {
    // Set up DOM structure with all required layout elements
    document.body.innerHTML = `
      <div id="app-layout">
        <div id="app-header">
          <div class="header-brand">
            <a href="/" class="brand-link">
              <span class="brand-text">Opinion</span>
            </a>
          </div>
          <div class="breadcrumbs-container" id="breadcrumbs_container"></div>
          <div class="header-toolbar"></div>
        </div>
        <div id="app-sidebar">
          <div class="sidebar-wrapper">
            <nav class="sidebar-navigation" role="navigation">
              <div class="nav-section" aria-label="Main navigation">
                <ul class="nav-list" role="menubar">
                  <li class="nav-item" role="none">
                    <a href="/dashboard" role="menuitem">
                      <i class="material-icons">dashboard</i>
                      <span>Dashboard</span>
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
            <div class="sidebar-footer">
              <p class="copyright-text">© 2024 Opinion</p>
            </div>
            <button id="sidebar_mobile_close" class="sidebar-mobile-close" aria-label="Close Menu">
              <i class="material-icons">close</i>
            </button>
            <button id="sidebar_compact_toggle" class="sidebar-compact-toggle" title="Toggle Compact Mode" aria-label="Toggle Sidebar Compact Mode">
              <i class="material-icons">chevron_left</i>
            </button>
          </div>
        </div>
        <div id="main-content">
          <div class="main-content-wrapper"></div>
        </div>
        <div id="app-footer">
          <div class="footer-content">
            <p class="copyright-text">© 2024 Opinion</p>
          </div>
        </div>
      </div>
      <div id="app-error-messages"></div>
    `;
    app = new OpinionApp();
  });

  afterEach(() => {
    // Clean up any DOM changes or global state
    document.body.innerHTML = '';
  });

  test('should create app instance', () => {
    expect(app).toBeInstanceOf(OpinionApp);
  });

  test('should initialize app correctly', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    app.init();
    
    // These messages should appear in order
    expect(consoleSpy).toHaveBeenCalledWith('🎯 APP.TS - init()');
    expect(consoleSpy).toHaveBeenCalledWith('🎯 APP.TS - Initializing global layout...');
    expect(consoleSpy).toHaveBeenCalledWith('🏢 APP.TS - Initializing Layout coordinator...');
    
    consoleSpy.mockRestore();
  });

  test('should not initialize twice', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Create a fresh app instance since the beforeEach one might have been initialized
    app = new OpinionApp();
    
    // First initialization
    await app.init();
    expect(warnSpy).not.toHaveBeenCalledWith('🎯 APP.TS - Application already initialized');
    
    // Reset spies for second initialization
    warnSpy.mockClear();
    errorSpy.mockClear();
    logSpy.mockClear();
    
    // Second initialization attempt
    await app.init();
    expect(warnSpy).toHaveBeenCalledWith('🎯 APP.TS - Application already initialized');
    
    // Cleanup
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});
