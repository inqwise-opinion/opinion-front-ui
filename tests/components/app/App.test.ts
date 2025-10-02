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

  test('should initialize app correctly', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await app.init();
    
    // App initialization is successful if no errors are thrown
    expect(errorSpy).not.toHaveBeenCalled();
    expect(app['initialized']).toBe(true); // Access private property for testing
    
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('should not initialize twice', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a fresh app instance since the beforeEach one might have been initialized
    app = new OpinionApp();
    
    // First initialization
    await app.init();
    expect(app['initialized']).toBe(true);
    
    // Second initialization attempt - should return immediately
    const initPromise = app.init();
    await initPromise;
    
    // No errors should be thrown or logged for double initialization
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('already initialized'));
    
    // Cleanup
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
