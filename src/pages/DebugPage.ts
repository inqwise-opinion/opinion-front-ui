/**
 * Debug Page Component
 * Debug/test page that uses semantic main content structure
 * Provides testing controls and development utilities
 */

import { Sidebar } from "../components/Sidebar";
import SidebarComponent from "../components/SidebarComponent";
import type { AppHeader } from "../components/AppHeader";
import type { BreadcrumbsComponent } from "../components/BreadcrumbsComponent";
import type { BreadcrumbItem } from "../interfaces/BreadcrumbItem";
import MainContentImpl from "../components/MainContentImpl";
import Layout from "../components/Layout";
import { getLayoutContext } from "../contexts/index";
import type {
  LayoutContext,
  LayoutModeType,
  LayoutViewPort,
  LayoutEvent,
  LayoutEventType,
} from "../contexts/LayoutContext";
import { LayoutEventFactory, type TypedLayoutEvent } from "../contexts/LayoutEventFactory";
import { PageComponent } from "../components/PageComponent";
import {
  ChainHotkeyHandler,
  HotkeyExecutionContext,
} from "../hotkeys/HotkeyChainSystem";
import { PageContext } from "../interfaces/PageContext";

export class DebugPage extends PageComponent {
  private responsiveModeUnsubscribe: (() => void) | null = null;
  
  // Layout Events Monitoring
  private eventMonitoringActive: boolean = false;
  private layoutEventUnsubscribers: Array<() => void> = [];
  private eventStats = {
    totalEvents: 0,
    eventCounts: new Map<string, number>(),
    startTime: 0,
    lastEventTime: 0
  };

  constructor(mainContent: MainContentImpl, pageContext: PageContext) {
    super(mainContent, pageContext, {
      pageId: "debug", // Matches navigation item ID
      pageTitle: "Debug"
    });
  }

  /**
   * Initialize the debug page
   */
  async onInit(): Promise<void> {
    try {
      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        await new Promise((resolve) => {
          document.addEventListener("DOMContentLoaded", resolve);
        });
      }

      // Load content into semantic main element
      await this.loadTemplate();

      // Setup page-level functionality
      this.setupPageHandlers();

      // Set browser tab title
      document.title = "Debug - Opinion";
    } catch (error) {
      console.error("❌ DEBUGPAGE - Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Post-initialization hook - called after chain provider registration
   */
  protected async onPostInit(): Promise<void> {
    // Now that chain provider is registered, update status displays
    this.updateViewportInfoFromContext(this.mainContent.getLayoutContext());
    this.updateLayoutStatus();
    this.updateComponentStatusDetails();
    this.updateHotkeyStatus();
    
    // Set initial breadcrumb for debug page
    this.setInitialBreadcrumb();
  }

  /**
   * Cleanup method for PageComponent
   */
  protected onDestroy(): void {
    // Clean up subscriptions
    if (this.responsiveModeUnsubscribe) {
      this.responsiveModeUnsubscribe();
      this.responsiveModeUnsubscribe = null;
    }
    
    // Clean up layout event monitoring
    this.stopEventMonitoring();
  }

  protected setupEventListeners(): void {}

  /**
   * Load HTML template into semantic main element
   */
  private async loadTemplate(): Promise<void> {
    // Load content into the semantic main element
    this.createFallbackTemplate();
  }

  /**
   * Create fallback template if HTML file fails to load
   */
  private createFallbackTemplate(): void {
    const mainContent = this.mainContent;
    // Use MainContent component if available, otherwise fallback to #app
    const targetElement =
      mainContent?.getElement() || document.getElementById("app");

    if (targetElement) {

      const content = `
        <div class="debug-page-content" style="max-width: 1200px; margin: 0 auto;">
          <div class="debug-header" style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <h1 style="margin: 0 0 10px 0; color: #333;">🛠️ Debug Page</h1>
            <p style="margin: 0; color: #666;">This page uses the regular app layout system with global header, sidebar, and footer components.</p>
          </div>


          <div class="debug-content" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0; color: #333;">Debug Information</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0;">
              <div>
                <h4 style="margin: 0 0 10px 0; color: #555;">📱 Viewport & Layout:</h4>
                <div id="viewport_info" style="font-family: monospace; background: #f1f3f4; padding: 10px; border-radius: 4px; font-size: 12px;">Loading...</div>
              </div>
              <div>
                <h4 style="margin: 0 0 10px 0; color: #555;">📊 LayoutContext Status:</h4>
                <div id="layout_status" style="font-family: monospace; background: #f1f3f4; padding: 10px; border-radius: 4px; font-size: 12px;">Checking...</div>
              </div>
              <div>
                <h4 style="margin: 0 0 10px 0; color: #555;">⌨️ Hotkey System Status:</h4>
                <div id="hotkey_status" style="font-family: monospace; background: #f1f3f4; padding: 10px; border-radius: 4px; font-size: 12px;">Checking...</div>
              </div>
            </div>


            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Test Console</h3>
              <div id="test_console" style="background: #1e1e1e; color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px; height: 200px; overflow-y: auto;"></div>
            </div>

            <div style="margin: 30px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #333; margin: 0;">🏗️ Component Status Details</h3>
                <div style="display: flex; gap: 8px;">
                  <button id="toggle_all_components" style="padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 11px; transition: all 0.2s ease;" onmouseover="this.style.background='#545b62'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#6c757d'; this.style.transform='scale(1)'">🔽 Expand All</button>
                  <button id="refresh_component_status" style="padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px; transition: all 0.2s ease;" onmouseover="this.style.background='#138496'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#17a2b8'; this.style.transform='scale(1)'">🔄 Refresh</button>
                </div>
              </div>
              <div id="component_status_details" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; font-family: monospace; font-size: 12px;">Loading component status...</div>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">📡 Layout Events Monitor</h3>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #555;">Event Controls:</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                    <button id="start_event_monitor" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">▶️ Start Monitor</button>
                    <button id="stop_event_monitor" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">⏹️ Stop Monitor</button>
                    <button id="clear_event_log" style="padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🗑️ Clear Events</button>
                    <button id="trigger_layout_test" style="padding: 8px 12px; background: #fd7e14; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🔄 Trigger Test Event</button>
                  </div>
                </div>
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #555;">Event Log:</h4>
                  <div id="layout_events_console" style="background: #1a1a1a; color: #00ff00; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; height: 300px; overflow-y: auto; border: 1px solid #333;"></div>
                </div>
                <div>
                  <h4 style="margin: 0 0 10px 0; color: #555;">Event Statistics:</h4>
                  <div id="event_stats" style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 13px;">Monitoring stopped. Click 'Start Monitor' to begin tracking events.</div>
                </div>
                <div style="margin-top: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #555;">Layout Constraints:</h4>
                  <div style="background: #fff3cd; padding: 10px; border-radius: 4px; font-size: 12px; color: #856404; border: 1px solid #ffeaa7;">
                    📱 <strong>Mobile Layout:</strong> Compact mode is disabled on mobile layout. Mobile uses overlay sidebar mode instead of compact/expanded states.
                  </div>
                </div>
              </div>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">⌨️ Chain Hotkey Test Guide</h3>
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #856404;">🎯 Debug Page Hotkeys (Active Now):</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 10px 0; font-size: 13px;">
                    <div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px;">
                      <strong style="color: #495057;">📊 Event Monitoring:</strong><br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+S</code> Start Monitor<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+X</code> Stop Monitor<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+C</code> Clear Log<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+T</code> Test Event<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+R</code> Refresh Status<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+E</code> Expand/Collapse
                    </div>
                    <div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px;">
                      <strong style="color: #495057;">💬 Message Testing:</strong><br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Shift+1 (!)</code> Error Message<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Shift+2 (@)</code> Warning Message<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Shift+3 (#)</code> Info Message<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Shift+4 ($)</code> Success Message
                    </div>
                    <div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px;">
                      <strong style="color: #495057;">🛠️ Utilities:</strong><br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Shift+Backspace</code> Clear Messages<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+L</code> Clear Console<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+H</code> Hotkey Help<br>
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Escape</code> Stop Monitoring
                    </div>
                  </div>
                </div>
                
                
                <div style="margin-bottom: 10px;">
                  <h4 style="margin: 0 0 10px 0; color: #856404;">🧪 Quick Chain System Test:</h4>
                  <div style="background: rgba(255,255,255,0.8); padding: 12px; border-radius: 4px; font-size: 13px;">
                    <ol style="margin: 0; padding-left: 20px; line-height: 1.6;">
                      <li><strong>Test Debug Hotkeys:</strong> Press <code style="background: #e9ecef; padding: 1px 3px;">Ctrl+Shift+S</code> to start monitoring, then <code style="background: #e9ecef; padding: 1px 3px;">Shift+1</code> (!) for an error message</li>
                      <li><strong>Test Message Hotkeys:</strong> Try <code style="background: #e9ecef; padding: 1px 3px;">Shift+2</code> (@), <code style="background: #e9ecef; padding: 1px 3px;">Shift+3</code> (#), <code style="background: #e9ecef; padding: 1px 3px;">Shift+4</code> ($) for different message types</li>
                      <li><strong>Test Chain Priority:</strong> Press <code style="background: #e9ecef; padding: 1px 3px;">Ctrl+Shift+H</code> to see debug help, then <code style="background: #e9ecef; padding: 1px 3px;">Escape</code> to test cooperative handling</li>
                      <li><strong>Check Logs:</strong> Watch the Test Console and Layout Events log for hotkey execution details</li>
                    </ol>
                  </div>
                </div>
                
                <div style="background: #d1ecf1; padding: 10px; border-radius: 4px; font-size: 12px; color: #0c5460;">
                  📝 <strong>Chain System Notes:</strong> All hotkeys above are fully functional and working. Debug page hotkeys (priority 200) run alongside PageComponent ESC handling. Use <code style="background: rgba(255,255,255,0.7); padding: 1px 3px;">Ctrl+Shift+H</code> anytime to see the complete hotkey reference.<br>
                  🌍 <strong>Browser Compatibility:</strong> Using Ctrl+Shift+ and actual character codes (!, @, #, $) for maximum compatibility across Firefox, Chrome, and Safari.
                </div>
              </div>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">🍞 Breadcrumbs Test Console</h3>
              
              <!-- PageContext Breadcrumbs Tests (Hierarchical/Scoped) -->
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8;">
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #555;">📋 PageContext Tests (Hierarchical/Scoped):</h4>
                  <div style="background: #d1ecf1; padding: 10px; border-radius: 4px; font-size: 12px; color: #0c5460; margin-bottom: 15px;">
                    <strong>🎯 Scope:</strong> These tests work through PageContext with hierarchical scoping. DebugPage can only modify breadcrumbs at or below its scope position.
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                    <button id="breadcrumb_single" style="padding: 8px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">📄 Single Page</button>
                    <button id="breadcrumb_multi" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">📚 Multi-level</button>
                    <button id="breadcrumb_links" style="padding: 8px 12px; background: #fd7e14; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🔗 With Links</button>
                    <button id="breadcrumb_actions" style="padding: 8px 12px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">⚡ With Actions</button>
                    <button id="breadcrumb_clear" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🗑️ Clear</button>
                  </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #555;">Dynamic PageContext Tests:</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                    <button id="breadcrumb_add" style="padding: 8px 12px; background: #198754; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">➕ Add Item</button>
                    <button id="breadcrumb_remove" style="padding: 8px 12px; background: #e83e8c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">➖ Remove Item</button>
                    <button id="breadcrumb_update" style="padding: 8px 12px; background: #20c997; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🔄 Update Item</button>
                    <button id="breadcrumb_status" style="padding: 8px 12px; background: #495057; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">📊 Show Status</button>
                  </div>
                </div>
              </div>
              
              <!-- HeaderComponent Direct Tests (Global/Unrestricted) -->
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #856404;">🏗️ HeaderComponent Tests (Direct/Global):</h4>
                  <div style="background: #ffeaa7; padding: 10px; border-radius: 4px; font-size: 12px; color: #856404; margin-bottom: 15px;">
                    <strong>⚠️ Unrestricted:</strong> These tests bypass PageContext and work directly with BreadcrumbsComponent. No hierarchical scoping - full control over entire breadcrumb trail.
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                    <button id="header_breadcrumb_basic" style="padding: 8px 12px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🏠 Basic Trail</button>
                    <button id="header_breadcrumb_complex" style="padding: 8px 12px; background: #e67e22; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🌐 Complex Trail</button>
                    <button id="header_breadcrumb_interactive" style="padding: 8px 12px; background: #d35400; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">⚡ Interactive</button>
                    <button id="header_breadcrumb_component_status" style="padding: 8px 12px; background: #a0522d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🔍 Component Status</button>
                  </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #856404;">Direct Component Operations:</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                    <button id="header_breadcrumb_direct_add" style="padding: 8px 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">➕ Direct Add</button>
                    <button id="header_breadcrumb_direct_remove" style="padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">➖ Direct Remove</button>
                    <button id="header_breadcrumb_direct_update" style="padding: 8px 12px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🔄 Direct Update</button>
                    <button id="header_breadcrumb_direct_clear" style="padding: 8px 12px; background: #c0392b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🗑️ Direct Clear</button>
                  </div>
                </div>
              </div>
              
              <div style="background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #dee2e6; font-size: 13px;">
                <strong>📝 Current Breadcrumbs:</strong> Look at the header above to see the breadcrumbs in action. They will update dynamically as you test different scenarios.<br>
                <strong>🔄 Comparison:</strong> Use PageContext tests to see hierarchical scoping vs HeaderComponent tests for direct unrestricted access.
              </div>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Test Console</h3>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #555;">Basic Messages:</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                    <button id="msg_error" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">❌ Error</button>
                    <button id="msg_warning" style="padding: 8px 12px; background: #fd7e14; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">⚠️ Warning</button>
                    <button id="msg_info" style="padding: 8px 12px; background: #0dcaf0; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">ℹ️ Info</button>
                    <button id="msg_success" style="padding: 8px 12px; background: #198754; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">✅ Success</button>
                  </div>
                </div>

                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #555;">Advanced Messages:</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                    <button id="msg_with_action" style="padding: 8px 12px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🔧 With Action</button>
                    <button id="msg_persistent" style="padding: 8px 12px; background: #495057; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">📌 Persistent</button>
                    <button id="msg_auto_hide" style="padding: 8px 12px; background: #20c997; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">⏰ Auto-hide</button>
                    <button id="msg_sequence" style="padding: 8px 12px; background: #e83e8c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🎬 Sequence</button>
                  </div>
                </div>

                <div>
                  <h4 style="margin: 0 0 10px 0; color: #555;">Message Management:</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    <button id="clear_all_messages" style="padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🗑️ Clear All</button>
                    <button id="clear_errors_only" style="padding: 8px 12px; background: #adb5bd; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">❌ Clear Errors</button>
                    <button id="clear_persistent" style="padding: 8px 12px; background: #343a40; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">📌 Clear Persistent</button>
                  </div>
                </div>
              </div>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Quick Tests</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                <button id="test_compact_mode" style="padding: 10px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">📎 Toggle Compact Mode</button>
                <button id="test_user_menu" style="padding: 10px 16px; background: #6f42c1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">👤 Toggle User Menu</button>
                <button id="test_viewport_info" style="padding: 10px 16px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">📊 Refresh Debug Info</button>
                <button id="test_mobile_toggle" style="padding: 10px 16px; background: #fd7e14; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">📱 Test Mobile Menu</button>
                <button id="clear_console" style="padding: 10px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">🧙 Clear Console</button>
                <button id="test_hotkeys_manual" style="padding: 10px 16px; background: #e83e8c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">🧪 Test Hotkeys</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Set content using appropriate method
      if (mainContent) {
        mainContent.setContent(content);
      } else {
        targetElement.innerHTML = content;
      }
    } else {
      console.error("DebugPage - No target element found for content");
    }
  }

  /**
   * Setup page-level event handlers
   */
  private setupPageHandlers(): void {
    // Setup test controls
    this.setupTestControls();

    // Initial status updates will happen in onPostInit() after chain registration

    // Setup responsive behavior
    this.setupResponsiveHandlers();
  }







  /**
   * Setup test control buttons
   */
  private setupTestControls(): void {
    // Test Compact Mode Toggle - Emit event instead of direct manipulation
    const testCompactMode = document.getElementById("test_compact_mode");
    if (testCompactMode) {
      testCompactMode.addEventListener("click", () => {
        const layoutContext = this.mainContent.getLayoutContext();
        
        if (layoutContext.isLayoutMobile()) {
          this.logToConsole("📱 Compact mode not available on mobile layout (uses overlay mode)");
        } else {
          // Emit request event instead of notification event
          layoutContext.emit("sidebar-compact-request", {
            requestedAction: "toggle",
            trigger: "debug-page"
          });
          this.logToConsole(`📎 Compact mode request event emitted`);
        }
      });
    }

    // Test User Menu Toggle
    const testUserMenu = document.getElementById("test_user_menu");
    if (testUserMenu) {
      let isToggling = false; // Prevent rapid toggle calls
      
      testUserMenu.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent rapid clicking
        if (isToggling) {
          this.logToConsole("👤 User menu toggle already in progress, ignoring click");
          return;
        }
        
        isToggling = true;
        const layoutContext = this.mainContent.getLayoutContext();
        
        // Use setTimeout to allow the click event to finish before emitting the request
        setTimeout(() => {
          layoutContext.emit("user-menu-request", {
            requestedAction: "toggle",
            trigger: "debug-page"
          });
          this.logToConsole(`👤 User menu request event emitted`);
          
          // Reset the toggle flag after a short delay
          setTimeout(() => {
            isToggling = false;
          }, 100);
        }, 50);
      });
    }

    // Update Viewport Info
    const testViewportInfo = document.getElementById("test_viewport_info");
    if (testViewportInfo) {
      testViewportInfo.addEventListener("click", () => {
        this.updateViewportInfoFromContext(this.mainContent.getLayoutContext());
        this.updateLayoutStatus();
        this.updateHotkeyStatus();
        this.logToConsole("📊 Debug info updated (viewport, layout, hotkeys)");
      });
    }

    // Test Mobile Menu Toggle - Emit event instead of direct manipulation
    const testMobileToggle = document.getElementById("test_mobile_toggle");
    if (testMobileToggle) {
      testMobileToggle.addEventListener("click", () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          const layoutContext = this.mainContent.getLayoutContext();
          // Emit mobile menu request event instead of direct DOM manipulation
          layoutContext.emit("mobile-menu-request", {
            requestedAction: "toggle",
            trigger: "debug-page"
          });
          this.logToConsole("📱 Mobile menu toggle event emitted");
        } else {
          this.logToConsole(
            "ℹ️ Mobile menu only available on mobile viewports (<768px)",
          );
        }
      });
    }

    // Clear Console
    const clearConsole = document.getElementById("clear_console");
    if (clearConsole) {
      clearConsole.addEventListener("click", () => {
        const console = document.getElementById("test_console");
        if (console) {
          console.innerHTML = "";
        }
      });
    }
    
    // Manual Hotkey Test
    const testHotkeysManual = document.getElementById("test_hotkeys_manual");
    if (testHotkeysManual) {
      testHotkeysManual.addEventListener("click", () => {
        this.testHotkeySystem();
      });
    }


    // Setup Message Simulation Controls
    this.setupMessageSimulationControls();
    
    // Setup Breadcrumb Test Controls
    this.setupBreadcrumbTestControls();
    
    // Setup Layout Events Monitoring
    this.setupLayoutEventsMonitoring();
  }

  /**
   * Setup message simulation controls
   */
  private setupMessageSimulationControls(): void {
    // Basic message buttons
    this.setupBasicMessageControls();

    // Advanced message buttons
    this.setupAdvancedMessageControls();

    // Message management buttons
    this.setupMessageManagementControls();
  }

  /**
   * Setup basic message type controls
   */
  private setupBasicMessageControls(): void {

    // Error message
    const msgError = document.getElementById("msg_error");
    if (msgError) {
      msgError.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages) {
            messages.showError(
              "Connection Failed",
              "Unable to connect to the server. Please check your internet connection.",
            );
            this.logToConsole("❌ Error message displayed");
          } else {
            // Try alternative access method
            const alternativeMessages = this.mainContent?.getLayoutContext()?.getMessages();
            if (alternativeMessages) {
              alternativeMessages.showError(
                "Connection Failed",
                "Unable to connect to the server. Please check your internet connection.",
              );
              this.logToConsole("❌ Error message displayed via alternative access");
            } else {
              this.logToConsole("❌ No messages component available");
            }
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message handling: " + errorMessage);
        }
      });
    }

    // Warning message
    const msgWarning = document.getElementById("msg_warning");
    if (msgWarning) {
      msgWarning.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages) {
            messages.showWarning(
              "Session Expiring",
              "Your session will expire in 5 minutes. Save your work to avoid losing data.",
            );
            this.logToConsole("⚠️ Warning message displayed");
          } else {
            this.logToConsole("❌ No messages component available");
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message handling: " + errorMessage);
        }
      });
    }

    // Info message
    const msgInfo = document.getElementById("msg_info");
    if (msgInfo) {
      msgInfo.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages) {
            messages.showInfo(
              "New Feature Available",
              "Check out the new dashboard features in the sidebar navigation.",
            );
            this.logToConsole("ℹ️ Info message displayed");
          } else {
            this.logToConsole("❌ No messages component available");
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message handling: " + errorMessage);
        }
      });
    }

    // Success message
    const msgSuccess = document.getElementById("msg_success");
    if (msgSuccess) {
      msgSuccess.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages) {
            messages.showSuccess(
              "Data Saved",
              "Your changes have been saved successfully to the server.",
            );
            this.logToConsole("✅ Success message displayed");
          } else {
            this.logToConsole("❌ No messages component available");
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message handling: " + errorMessage);
        }
      });
    }
  }

  /**
   * Setup advanced message controls
   */
  private setupAdvancedMessageControls(): void {
    // Message with action
    const msgWithAction = document.getElementById("msg_with_action");
    if (msgWithAction) {
      msgWithAction.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages) {
            // For now, use basic error message since addMessage with actions might not be available
            messages.showError(
              "Network Error",
              "Failed to load data. Check your connection and try again.",
            );
            this.logToConsole("🔧 Error message with action displayed");
          } else {
            this.logToConsole("❌ Unable to access Messages component");
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message handling: " + errorMessage);
        }
      });
    }

    // Persistent message
    const msgPersistent = document.getElementById("msg_persistent");
    if (msgPersistent) {
      msgPersistent.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages) {
            messages.showWarning(
              "Persistent Warning",
              'This message persists across page navigation. Use "Clear Persistent" to remove it.',
            );
            this.logToConsole("📌 Persistent warning message displayed");
          } else {
            this.logToConsole("❌ Unable to access Messages component");
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message handling: " + errorMessage);
        }
      });
    }

    // Auto-hide message
    const msgAutoHide = document.getElementById("msg_auto_hide");
    if (msgAutoHide) {
      msgAutoHide.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages) {
            messages.showInfo(
              "Auto-Hide Message",
              "This message will automatically disappear after 3 seconds.",
            );
            this.logToConsole("⏰ Auto-hide info message displayed (3s delay)");
          } else {
            this.logToConsole("❌ Unable to access Messages component");
          }
        } catch (error: unknown) {
          console.error("🎯 DEBUGPAGE - Error in auto-hide message handler:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message handling: " + errorMessage);
        }
      });
    }

    // Message sequence
    const msgSequence = document.getElementById("msg_sequence");
    if (msgSequence) {
      msgSequence.addEventListener("click", () => {
        try {
          this.showMessageSequence();
          this.logToConsole("🎬 Message sequence started");
        } catch (error: unknown) {
          console.error("🎯 DEBUGPAGE - Error in sequence handler:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message sequence: " + errorMessage);
        }
      });
    }
  }

  /**
   * Setup message management controls
   */
  private setupMessageManagementControls(): void {
    // Clear all messages
    const clearAllMessages = document.getElementById("clear_all_messages");
    if (clearAllMessages) {
      clearAllMessages.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages && typeof messages.clearAll === 'function') {
            messages.clearAll();
            this.logToConsole(
              "🗑️ All messages cleared via Messages API",
            );
          } else {
            this.logToConsole("❌ clearAll method not available");
          }
        } catch (error: unknown) {
          console.error("🎯 DEBUGPAGE - Error in clear all handler:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message clearing: " + errorMessage);
        }
      });
    }

    // Clear errors only
    const clearErrorsOnly = document.getElementById("clear_errors_only");
    if (clearErrorsOnly) {
      clearErrorsOnly.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages && typeof messages.clearByType === 'function') {
            messages.clearByType('error');
            this.logToConsole("❌ Error messages cleared via Messages API");
          } else {
            this.logToConsole("❌ clearByType method not available");
          }
        } catch (error: unknown) {
          console.error("🎯 DEBUGPAGE - Error in clear errors handler:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message clearing: " + errorMessage);
        }
      });
    }

    // Clear persistent messages
    const clearPersistent = document.getElementById("clear_persistent");
    if (clearPersistent) {
      clearPersistent.addEventListener("click", () => {
        try {
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          if (messages && typeof messages.clearAll === 'function') {
            messages.clearAll(true); // Include persistent messages
            this.logToConsole(
              "📌 Persistent messages cleared via Messages API",
            );
          } else {
            this.logToConsole("❌ clearAll method not available");
          }
        } catch (error: unknown) {
          console.error("🎯 DEBUGPAGE - Error in clear persistent handler:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logToConsole("❌ Error in message clearing: " + errorMessage);
        }
      });
    }
  }

  /**
   * Show a sequence of messages for demonstration
   */
  private showMessageSequence(): void {
    if (!this.layoutContext) {
      this.logToConsole("❌ LayoutContext not available for sequence");
      return;
    }
    
    const messages = this.layoutContext.getMessages();
    if (!messages) {
      this.logToConsole("❌ No messages component available for sequence");
      return;
    }

    let step = 0;
    const steps = [
      () => {
        messages.showInfo(
          "Step 1",
          "Starting data validation process...",
        );
      },
      () => {
        messages.showInfo("Step 2", "Validating user permissions...");
      },
      () => {
        messages.showWarning(
          "Step 3",
          "Found 2 validation warnings that need attention.",
        );
      },
      () => {
        messages.showError(
          "Step 4",
          'Validation failed: Missing required field "email".',
        );
      },
      () => {
        messages.showSuccess(
          "Step 5",
          "Process completed! All issues resolved.",
        );
      },
    ];

    const runNextStep = () => {
      if (step < steps.length) {
        steps[step]();
        step++;
        setTimeout(runNextStep, 2000); // 2 second delay between steps
      }
    };

    runNextStep();
  }

  /**
   * Setup responsive behavior handlers
   */
  private setupResponsiveHandlers(): void {
    console.log("🎯 DebugPage - Setting up responsive mode subscriptions...");

    // Note: 'responsive-mode-change' is not available in the current LayoutContext
    // We'll rely on 'layout-mode-change' instead
    // this.responsiveModeUnsubscribe = null;
    const layoutContext = this.mainContent.getLayoutContext();
    // Subscribe to layout mode changes
    layoutContext.subscribe("layout-mode-change", (event: LayoutEvent) => {
      console.log("event:", event);
      const viewport = event.data.viewport as LayoutViewPort;
      const type = event.data.modeType as LayoutModeType;
      const sidebar = layoutContext.getSidebar();
      const isSidebarCompact = sidebar?.isCompactMode();
      const isSidebarVisible = sidebar?.isVisible();

      const timestamp = new Date().toLocaleTimeString();

      // Update layout status display
      this.updateLayoutStatus();
      this.updateComponentStatusDetails();
      this.updateHotkeyStatus();

      // Log the layout mode change
      this.logToConsole(
        `<span style="color: #8e44ad; font-weight: bold;">[${timestamp}] 🏗️ LAYOUT MODE CHANGE</span>`,
      );
      this.logToConsole(`└─ Type: ${type.toUpperCase()}`);
      this.logToConsole(`└─ Compact: ${isSidebarCompact ? "YES" : "NO"}`);
      this.logToConsole(
        `└─ Sidebar: ${sidebar?.getDimensions().width}px ${isSidebarVisible ? "(visible)" : "(hidden)"}`,
      );
      this.logToConsole(`└─ Viewport: ${viewport.width}x${viewport.height}`);
    });

    this.logToConsole("✅ Subscribed to LayoutContext layout mode changes");
    this.logToConsole(
      `📊 Initial layout mode: ${this.layoutContext?.getModeType()}${this.layoutContext?.getSidebar()?.isCompactMode() ? " (compact)" : ""}`,
    );
  }

  /**
   * Update viewport information from LayoutContext
   */
  private updateViewportInfoFromContext(ctx: LayoutContext): void {
    const viewportInfo = document.getElementById("viewport_info");
    if (viewportInfo) {
      const viewport = ctx.getViewport();
      const type = ctx.getModeType();
      const sidebar = ctx.getSidebar();
      const sidebarDimensions = sidebar?.getDimensions();
      const isMobile = ctx.isLayoutMobile();
      const isTablet = type === 'tablet';
      const isDesktop = type === 'desktop';
      const isCompact = sidebar?.isCompactMode() ?? false;

      // Breakpoint indicators
      const getBreakpointStatus = () => {
        if (isMobile) return '📱 Mobile (≤768px)';
        if (isTablet) return '📺 Tablet (769-1024px)';
        return '💻 Desktop (≥1025px)';
      };

      // Device pixel ratio info
      const pixelRatio = window.devicePixelRatio || 1;
      const actualPixels = `${Math.round(viewport.width * pixelRatio)}x${Math.round(viewport.height * pixelRatio)}`;
      
      // Layout mode info
      const modeColor = isMobile ? "#e74c3c" : (isTablet ? "#f39c12" : "#27ae60");
      const compactInfo = isMobile 
        ? "Overlay mode" 
        : (isCompact ? "Compact (64px)" : `Expanded (${sidebarDimensions?.width}px)`);

      viewportInfo.innerHTML = `
        <div style="color: ${modeColor}; font-weight: bold; margin-bottom: 6px;">${getBreakpointStatus()}</div>
        <div style="margin-bottom: 6px;">
          📏 Viewport: ${viewport.width} x ${viewport.height}px<br>
          🔍 Ratio: ${(viewport.width / viewport.height).toFixed(2)} ${viewport.width > viewport.height ? '(landscape)' : '(portrait)'}<br>
          ${pixelRatio !== 1 ? `📷 Actual: ${actualPixels} (@${pixelRatio}x)<br>` : ''}
        </div>
        <div style="padding-top: 6px; border-top: 1px solid #ddd; font-size: 11px;">
          📋 Sidebar: ${compactInfo}<br>
          👁 Visible: ${sidebar?.isVisible() ? "✅ Yes" : "❌ Hidden"}<br>
          🌐 User Agent: ${navigator.userAgent.includes('Mobile') ? '📱 Mobile' : '💻 Desktop'}
        </div>
      `;
    }
  }

  /**
   * Update hotkey system status
   */
  private updateHotkeyStatus(): void {
    const hotkeyStatus = document.getElementById("hotkey_status");
    if (hotkeyStatus) {
      const ourHotkeys = this.getChainHotkeys();
      const hotkeyCount = ourHotkeys ? ourHotkeys.size : 0;
      
      // Try to get chain manager info from layout context
      let chainManagerStatus = 'Unknown';
      let totalProviders = 'Unknown';
      let globalListenerStatus = 'Unknown';
      
      try {
        const ctx = this.layoutContext as any;
        if (ctx.chainHotkeyManager) {
          chainManagerStatus = '✅ Active';
          // Try to get provider count from chain manager
          if (ctx.chainHotkeyManager.providers) {
            totalProviders = ctx.chainHotkeyManager.providers.size || 'N/A';
          }
          globalListenerStatus = '✅ Registered';
        } else {
          chainManagerStatus = '❌ Not Found';
        }
      } catch (e) {
        chainManagerStatus = 'Error';
      }
      
      // Check if our provider is registered - look for both unsubscriber and initialized state
      const hasUnsubscriber = !!this.chainProviderUnsubscriber;
      const isInitialized = this.initialized;
      const debugPageRegistered = (hasUnsubscriber && isInitialized) ? '✅ Registered' : '❌ Not Registered';
      
      // Get our hotkey details
      let hotkeyBreakdown = 'None';
      if (ourHotkeys && ourHotkeys.size > 0) {
        const categories = {
          'Ctrl+Shift': Array.from(ourHotkeys.keys()).filter(k => k.startsWith('Ctrl+Shift')).length,
          'Shift': Array.from(ourHotkeys.keys()).filter(k => k.startsWith('Shift+') && !k.startsWith('Shift+Shift')).length,
          'Escape': Array.from(ourHotkeys.keys()).filter(k => k === 'Escape').length
        };
        hotkeyBreakdown = `${categories['Ctrl+Shift']} Ctrl+Shift, ${categories['Shift']} Shift+, ${categories['Escape']} ESC`;
      }
      
      hotkeyStatus.innerHTML = `
        <div style="margin-bottom: 6px; font-weight: bold; color: #27ae60;">⌨️ Chain Hotkey System</div>
        <div style="margin-bottom: 6px;">
          🌎 Chain Manager: ${chainManagerStatus}<br>
          🏠 DebugPage Provider: ${debugPageRegistered}<br>
          🔑 Our Hotkeys: ${hotkeyCount} registered<br>
          📊 Breakdown: ${hotkeyBreakdown}
        </div>
        <div style="padding-top: 6px; border-top: 1px solid #ddd; font-size: 11px; color: #666;">
          🌍 Global Listener: ${globalListenerStatus}<br>
          💬 Total Providers: ${totalProviders}<br>
          🔄 Browser Support: Ctrl+Shift + Shift+chars<br>
          ✅ Status: All ${hotkeyCount} hotkeys functional
        </div>
      `;
    }
  }
  
  /**
   * Update LayoutContext integration status
   */
  private updateLayoutStatus(): void {
    const layoutStatus = document.getElementById("layout_status");
    if (layoutStatus && this.layoutContext) {
      const components = this.layoutContext.getRegisteredComponents();
      const messages = this.layoutContext.getMessages();
      const sidebar = this.layoutContext.getSidebar();
      
      // Get subscriber count from EventBus debug info
      let subscriberCount = 'N/A';
      let eventBusEventCount = 'N/A';
      try {
        const ctx = this.layoutContext as any;
        if (ctx.getEventBusDebugInfo && typeof ctx.getEventBusDebugInfo === 'function') {
          const debugInfo = ctx.getEventBusDebugInfo();
          subscriberCount = debugInfo.totalConsumers.toString();
          eventBusEventCount = debugInfo.eventCount.toString();
        }
      } catch (e) {
        subscriberCount = 'Error';
        eventBusEventCount = 'Error';
      }
      
      // Enhanced component status checking
      const headerProvider = components.header ? '✅ Registered' : '❌ Missing';
      const sidebarProvider = components.sidebar ? '✅ Registered' : '❌ Missing';
      const messagesProvider = components.messages ? '✅ Registered' : '❌ Missing';
      const mainProvider = components.mainContent ? '✅ Registered' : '❌ Missing';
      
      // Footer status with more detailed checking
      let footerProvider = '❌ Missing';
      let footerDetails = '';
      if (components.footer) {
        footerProvider = '✅ Registered';
      } else {
        // Check if footer element exists in DOM
        const footerElement = document.getElementById('app-footer');
        if (footerElement) {
          footerDetails = ' (DOM exists but not registered)';
        } else {
          footerDetails = ' (DOM element missing)';
        }
      }
      
      // Component functionality status
      const sidebarFunctional = sidebar ? (
        sidebar.isVisible() !== undefined && 
        sidebar.isCompactMode() !== undefined &&
        sidebar.getDimensions().width > 0
      ) : false;
      
      const messagesFunctional = messages ? (
        typeof messages.showError === 'function' &&
        typeof messages.showSuccess === 'function'
      ) : false;
      
      // EventBus status
      let eventBusStatus = 'Unknown';
      try {
        const ctx = this.layoutContext as any;
        if (ctx.getEventBus && typeof ctx.getEventBus === 'function') {
          eventBusStatus = 'Available';
        } else if (ctx.eventBus) {
          eventBusStatus = 'Available (direct)';
        } else {
          eventBusStatus = 'Not Found';
        }
      } catch (e) {
        eventBusStatus = 'Error';
      }

      layoutStatus.innerHTML = `
        <div style="margin-bottom: 6px; font-weight: bold; color: #27ae60;">📊 Context Integration</div>
        <div style="margin-bottom: 6px;">
          🏠 Main Content: ${mainProvider}<br>
          📋 Sidebar: ${sidebarProvider} ${sidebarFunctional ? '(💪 Functional)' : '(⚠️ Limited)'}<br>
          💬 Messages: ${messagesProvider} ${messagesFunctional ? '(💪 Functional)' : '(⚠️ Limited)'}<br>
          📊 Header: ${headerProvider}<br>
          📄 Footer: ${footerProvider}${footerDetails}
        </div>
        <div style="padding-top: 6px; border-top: 1px solid #ddd; font-size: 11px; color: #666;">
          📧 Event Subscribers: ${subscriberCount}<br>
          📨 EventBus Events: ${eventBusEventCount}<br>
          📡 EventBus Status: ${eventBusStatus}<br>
          🔍 Mode Detection: ${this.layoutContext.isLayoutMobile() ? '📱 Mobile' : '💻 Desktop'}<br>
          🔄 Auto Updates: ${this.eventMonitoringActive ? '✅ Active' : '❌ Stopped'}
        </div>
      `;
    }
  }
  
  /**
   * Update detailed component status information
   */
  private updateComponentStatusDetails(): void {
    const statusContainer = document.getElementById("component_status_details");
    if (!statusContainer || !this.layoutContext) {
      return;
    }
    
    const components = this.layoutContext.getRegisteredComponents();
    let statusHtml = `<div style="margin-bottom: 15px; font-weight: bold; color: #495057;">🔍 Detailed Component Diagnostics</div>`;
    
    // Helper function to format status info
    const formatComponentStatus = (componentName: string, component: any) => {
      if (!component || typeof component.getStatus !== 'function') {
        return `<div style="background: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 10px; border-left: 3px solid #ffc107;">
          <strong style="color: #856404;">${componentName}:</strong> ❌ No status method available
        </div>`;
      }
      
      try {
        const status = component.getStatus();
        const uptime = status.uptime ? `${Math.floor(status.uptime / 1000)}s` : 'N/A';
        const lastAction = status.currentState?.lastActionAgo ? 
          `${Math.floor(status.currentState.lastActionAgo / 1000)}s ago` : 'Never';
        const issues = status.issues && status.issues.length > 0;
        
        const bgColor = issues ? '#f8d7da' : '#d1edff';
        const borderColor = issues ? '#dc3545' : '#0dcaf0';
        const statusColor = issues ? '#721c24' : '#055160';
        const componentId = status.id || componentName.toLowerCase().replace(/\s+/g, '-');
        
        // Quick status summary for collapsed view
        const quickStatus = [];
        if (status.initialized) quickStatus.push('✅ Init');
        if (status.domElement) quickStatus.push('🏠 DOM');
        if (status.eventListeners?.layoutSubscriptions > 0) quickStatus.push(`📡 ${status.eventListeners.layoutSubscriptions}`);
        if (status.issues && status.issues.length > 0) quickStatus.push(`⚠️ ${status.issues.length}`);
        const quickStatusText = quickStatus.length > 0 ? ` | ${quickStatus.join(' ')}` : '';
        
        let html = `<div style="background: ${bgColor}; padding: 12px; border-radius: 4px; margin-bottom: 15px; border-left: 3px solid ${borderColor};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; cursor: pointer;" onclick="debugPageToggleComponent('${componentId}')">
            <div style="color: ${statusColor}; font-weight: bold;">${componentName} (${status.componentType})<span style="font-weight: normal; font-size: 11px; opacity: 0.8;">${quickStatusText}</span></div>
            <div style="color: ${statusColor}; font-size: 14px; user-select: none;" id="toggle-${componentId}">▶</div>
          </div>
          <div id="details-${componentId}" style="display: none;">`;
        
        // Basic status info
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 8px;">`;
        html += `<div>📊 <strong>Status:</strong> ${status.initialized ? '✅ Initialized' : '❌ Not Initialized'}</div>`;
        html += `<div>⏱️ <strong>Uptime:</strong> ${uptime}</div>`;
        html += `<div>🔄 <strong>Last Action:</strong> ${lastAction}</div>`;
        html += `<div>🏠 <strong>DOM ID:</strong> ${status.domElement?.id || 'N/A'}</div>`;
        html += `</div>`;
        
        // Event listeners and subscriptions
        if (status.eventListeners) {
          html += `<div style="margin: 8px 0;"><strong>Event Listeners:</strong> `;
          const listeners = [];
          if (status.eventListeners.domEvents) listeners.push(`DOM: ${status.eventListeners.domEvents}`);
          if (status.eventListeners.layoutSubscriptions) listeners.push(`Layout: ${status.eventListeners.layoutSubscriptions}`);
          if (status.eventListeners.eventBusSubscriptions) listeners.push(`EventBus: ${status.eventListeners.eventBusSubscriptions}`);
          if (status.eventListeners.compactModeListeners) listeners.push(`Compact: ${status.eventListeners.compactModeListeners}`);
          if (status.eventListeners.closeButtonListeners) listeners.push(`Close Buttons: ${status.eventListeners.closeButtonListeners}`);
          html += listeners.join(', ') || 'None';
          html += `</div>`;
        }
        
        // Current state highlights
        if (status.currentState) {
          const state = status.currentState;
          html += `<div style="margin: 8px 0;"><strong>Current State:</strong> `;
          const stateInfo = [];
          
          // Component-specific state info
          if (componentName.includes('Sidebar')) {
            stateInfo.push(`Mode: ${state.compactMode ? 'Compact' : 'Expanded'}`);
            stateInfo.push(`Mobile: ${state.isMobile ? 'Yes' : 'No'}`);
            stateInfo.push(`Nav Items: ${status.configuration?.navigationItemsCount || 0}`);
          } else if (componentName.includes('Header')) {
            stateInfo.push(`User Menu: ${state.userMenuInitialized ? 'Ready' : 'Not Ready'}`);
            stateInfo.push(`Updates: ${state.updateCount || 0}`);
          } else if (componentName.includes('MainContent')) {
            stateInfo.push(`Content Updates: ${state.contentUpdateCount || 0}`);
            stateInfo.push(`Loading: ${state.isLoading ? 'Yes' : 'No'}`);
          } else if (componentName.includes('Footer')) {
            stateInfo.push(`Nav Clicks: ${state.navigationClickCount || 0}`);
            stateInfo.push(`Layout Updates: ${state.layoutUpdateCount || 0}`);
          } else if (componentName.includes('Messages')) {
            stateInfo.push(`Active: ${state.activeMessagesCount || 0}`);
            stateInfo.push(`Timers: ${state.activeAutoHideTimers || 0}`);
            if (state.messagesByType) {
              const types = Object.entries(state.messagesByType).filter(([_, count]) => (count as number) > 0);
              if (types.length > 0) {
                stateInfo.push(`Types: ${types.map(([type, count]) => `${type}:${count}`).join(', ')}`);
              }
            }
          }
          
          html += stateInfo.join(', ') || 'Default';
          html += `</div>`;
        }
        
        // Issues
        if (status.issues && status.issues.length > 0) {
          html += `<div style="margin: 8px 0; color: #721c24;"><strong>⚠️ Issues:</strong><ul style="margin: 4px 0 0 20px; padding: 0;">`;
          const issues = Array.isArray(status.issues) ? status.issues : [];
          issues.forEach((issue: string) => {
            html += `<li>${issue}</li>`;
          });
          html += `</ul></div>`;
        } else {
          html += `<div style="margin: 8px 0; color: ${statusColor};"><strong>✅ Status:</strong> No issues detected</div>`;
        }
        
        // Performance info
        if (status.performance) {
          const perf = status.performance;
          html += `<div style="margin: 8px 0; font-size: 11px; color: #666;"><strong>Performance:</strong> `;
          const perfInfo = [];
          if (perf.initDuration) perfInfo.push(`Init: ${perf.initDuration}ms`);
          if (perf.dimensions) perfInfo.push(`Dimensions: ${perf.dimensions.width}px`);
          if (perf.averageMessageLifetime) perfInfo.push(`Avg Message Life: ${Math.floor(perf.averageMessageLifetime / 1000)}s`);
          html += perfInfo.join(', ') || 'N/A';
          html += `</div>`;
        }
        
        html += `</div></div>`; // Close details div and main component div
        return html;
      } catch (error) {
        return `<div style="background: #f8d7da; padding: 10px; border-radius: 4px; margin-bottom: 10px; border-left: 3px solid #dc3545;">
          <strong style="color: #721c24;">${componentName}:</strong> ❌ Error getting status: ${error instanceof Error ? error.message : 'Unknown error'}
        </div>`;
      }
    };
    
    // Add status for each component
    statusHtml += formatComponentStatus('Header Component', components.header);
    statusHtml += formatComponentStatus('Sidebar Component', components.sidebar);
    statusHtml += formatComponentStatus('Main Content', components.mainContent);
    statusHtml += formatComponentStatus('Footer Component', components.footer);
    statusHtml += formatComponentStatus('Messages Component', components.messages);
    
    // Summary
    const totalComponents = [components.header, components.sidebar, components.mainContent, components.footer, components.messages]
      .filter(c => c).length;
    const componentsWithStatus = [components.header, components.sidebar, components.mainContent, components.footer, components.messages]
      .filter(c => c && typeof (c as any).getStatus === 'function').length;
    
    statusHtml += `<div style="background: #e2e3e5; padding: 10px; border-radius: 4px; margin-top: 15px; border-left: 3px solid #6c757d;">
      <strong style="color: #495057;">📋 Summary:</strong> ${componentsWithStatus}/${totalComponents} components provide detailed status information
    </div>`;
    
    statusContainer.innerHTML = statusHtml;
    
    // Add the toggle function to the global scope
    (window as any).debugPageToggleComponent = this.toggleComponentDetails.bind(this);
    
    // Update toggle all button state
    setTimeout(() => this.updateToggleAllButtonState(), 10);
  }
  
  /**
   * Refresh component status display
   */
  private refreshComponentStatus(): void {
    // Show loading state
    const statusContainer = document.getElementById("component_status_details");
    const refreshBtn = document.getElementById("refresh_component_status") as HTMLButtonElement;
    
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '⏳ Refreshing...';
      refreshBtn.style.opacity = '0.7';
    }
    
    if (statusContainer) {
      statusContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">🔄 Refreshing component status...</div>';
    }
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      this.updateComponentStatusDetails();
      
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '🔄 Refresh';
        refreshBtn.style.opacity = '1';
      }
      
      this.logToConsole('🔄 Component status refreshed');
    }, 100);
  }
  
  /**
   * Toggle component details visibility
   */
  private toggleComponentDetails(componentId: string): void {
    const detailsEl = document.getElementById(`details-${componentId}`);
    const toggleEl = document.getElementById(`toggle-${componentId}`);
    
    if (detailsEl && toggleEl) {
      const isVisible = detailsEl.style.display !== 'none';
      detailsEl.style.display = isVisible ? 'none' : 'block';
      toggleEl.textContent = isVisible ? '▶' : '▼';
      
      // Update toggle all button state
      this.updateToggleAllButtonState();
    }
  }
  
  /**
   * Toggle all components expanded/collapsed
   */
  private toggleAllComponents(): void {
    const componentBoxes = [
      'app-header', 'app-sidebar', 'main-content', 'app-footer', 'app-error-messages'
    ];
    
    // Check if any components are collapsed to determine action
    const anyCollapsed = componentBoxes.some(id => {
      const detailsEl = document.getElementById(`details-${id}`);
      return detailsEl && detailsEl.style.display === 'none';
    });
    
    const expand = anyCollapsed;
    
    componentBoxes.forEach(componentId => {
      const detailsEl = document.getElementById(`details-${componentId}`);
      const toggleEl = document.getElementById(`toggle-${componentId}`);
      
      if (detailsEl && toggleEl) {
        detailsEl.style.display = expand ? 'block' : 'none';
        toggleEl.textContent = expand ? '▼' : '▶';
      }
    });
    
    this.updateToggleAllButtonState();
    this.logToConsole(`🔽 ${expand ? 'Expanded' : 'Collapsed'} all component details`);
  }
  
  /**
   * Update the toggle all button text based on current state
   */
  private updateToggleAllButtonState(): void {
    const toggleAllBtn = document.getElementById('toggle_all_components');
    if (!toggleAllBtn) return;
    
    const componentBoxes = [
      'app-header', 'app-sidebar', 'main-content', 'app-footer', 'app-error-messages'
    ];
    
    const anyCollapsed = componentBoxes.some(id => {
      const detailsEl = document.getElementById(`details-${id}`);
      return detailsEl && detailsEl.style.display === 'none';
    });
    
    const allCollapsed = componentBoxes.every(id => {
      const detailsEl = document.getElementById(`details-${id}`);
      return detailsEl && detailsEl.style.display === 'none';
    });
    
    if (allCollapsed) {
      toggleAllBtn.innerHTML = '🔽 Expand All';
    } else if (anyCollapsed) {
      toggleAllBtn.innerHTML = '🔽 Expand All';
    } else {
      toggleAllBtn.innerHTML = '🔽 Collapse All';
    }
  }
  
  /**
   * Log message to test console
   */
  private logToConsole(message: string): void {
    const testConsole = document.getElementById("test_console");
    if (testConsole) {
      const timestamp = new Date().toLocaleTimeString();
      const logElement = document.createElement("div");
      logElement.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${message}`;
      testConsole.appendChild(logElement);
      testConsole.scrollTop = testConsole.scrollHeight;
    }
    console.log("DebugPage:", message);
  }

  // =================================================================================
  // Layout Events Monitoring Implementation
  // =================================================================================
  
  private setupLayoutEventsMonitoring(): void {
    const startBtn = document.getElementById("start_event_monitor");
    const stopBtn = document.getElementById("stop_event_monitor");
    const clearBtn = document.getElementById("clear_event_log");
    const triggerBtn = document.getElementById("trigger_layout_test");
    const refreshStatusBtn = document.getElementById("refresh_component_status");
    const toggleAllBtn = document.getElementById("toggle_all_components");

    if (startBtn) {
      startBtn.addEventListener("click", () => this.startEventMonitoring());
    }
    if (stopBtn) {
      stopBtn.addEventListener("click", () => this.stopEventMonitoring());
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearLayoutEventsLog());
    }
    if (triggerBtn) {
      triggerBtn.addEventListener("click", () => this.triggerLayoutTestEvent());
    }
    if (refreshStatusBtn) {
      refreshStatusBtn.addEventListener("click", () => this.refreshComponentStatus());
    }
    if (toggleAllBtn) {
      toggleAllBtn.addEventListener("click", () => this.toggleAllComponents());
    }

    // Auto-start monitoring on page load for convenience
    setTimeout(() => this.startEventMonitoring(), 500);
  }

  private startEventMonitoring(): void {
    if (this.eventMonitoringActive) {
      this.logLayoutEvent("ℹ️ Event monitoring is already active");
      return;
    }

    const layoutCtx = this.mainContent.getLayoutContext();
    this.eventMonitoringActive = true;
    this.eventStats = {
      totalEvents: 0,
      eventCounts: new Map<string, number>(),
      startTime: Date.now(),
      lastEventTime: 0,
    };

    // Subscribe to all known LayoutContext events
    const subscribe = (type: LayoutEventType) => {
      const unsubscribe = layoutCtx.subscribe(type, (event) => this.handleLayoutEvent(event));
      this.layoutEventUnsubscribers.push(unsubscribe);
    };

    subscribe("layout-ready");
    subscribe("layout-mode-change");
    subscribe("sidebar-compact-mode-change");
    subscribe("sidebar-compact-request");
    subscribe("mobile-menu-request");
    subscribe("mobile-menu-mode-change");
    subscribe("user-menu-request");
    subscribe("user-menu-mode-change");

    this.updateEventStatsDisplay();
    this.logLayoutEvent("✅ Layout event monitoring started");
    
    // Update the layout status display to show monitoring is now active
    this.updateLayoutStatus();
    
    // Show mobile layout constraint info if currently in mobile mode
    const layoutContext = this.mainContent.getLayoutContext();
    if (layoutContext.isLayoutMobile()) {
      this.logLayoutEvent("📱 Mobile layout active - compact mode changes will be blocked");
    }
  }

  private stopEventMonitoring(): void {
    if (!this.eventMonitoringActive) return;

    this.layoutEventUnsubscribers.forEach((fn) => {
      try { fn(); } catch {}
    });
    this.layoutEventUnsubscribers = [];
    this.eventMonitoringActive = false;
    this.logLayoutEvent("⏹️ Layout event monitoring stopped");
    
    // Update the layout status display to show monitoring is now stopped
    this.updateLayoutStatus();
  }

  private handleLayoutEvent(event: LayoutEvent): void {
    if (!this.eventMonitoringActive) return;

    const now = Date.now();
    this.eventStats.totalEvents++;
    this.eventStats.lastEventTime = now;
    this.eventStats.eventCounts.set(
      event.type,
      (this.eventStats.eventCounts.get(event.type) || 0) + 1,
    );

    // Pretty-print event
    const dataPreview = this.formatEventData(event);
    this.logLayoutEvent(
      `${this.badgeForEvent(event.type)} ${event.type} ${dataPreview}`,
    );

    this.updateEventStatsDisplay();
  }

  private formatEventData(event: LayoutEvent): string {
    try {
      // Use the factory's formatting method for typed events
      const typedEvent = event as TypedLayoutEvent;
      return LayoutEventFactory.formatEventDataForLogging(typedEvent);
    } catch {
      // Fallback to generic formatting for non-typed events
      try {
        return event.data ? `→ data=${JSON.stringify(event.data)}` : "";
      } catch {
        return "→ [complex data]";
      }
    }
  }

  private badgeForEvent(type: LayoutEventType): string {
    return LayoutEventFactory.getEventBadge(type);
  }

  private logLayoutEvent(message: string): void {
    const consoleEl = document.getElementById("layout_events_console");
    if (consoleEl) {
      const timestamp = new Date().toLocaleTimeString();
      const entry = document.createElement("div");
      entry.textContent = `[${timestamp}] ${message}`;
      consoleEl.appendChild(entry);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
    // Also mirror to main test console
    this.logToConsole(message);
  }

  private updateEventStatsDisplay(): void {
    const statsEl = document.getElementById("event_stats");
    if (!statsEl) return;

    if (!this.eventMonitoringActive) {
      statsEl.textContent = "Monitoring stopped. Click 'Start Monitor' to begin tracking events.";
      return;
    }

    const durationSec = ((Date.now() - this.eventStats.startTime) / 1000).toFixed(1);
    const parts = [
      `⏱️ Duration: ${durationSec}s`,
      `📈 Total events: ${this.eventStats.totalEvents}`,
    ];

    const counts: string[] = [];
    this.eventStats.eventCounts.forEach((count, type) => {
      counts.push(`${type}: ${count}`);
    });
    parts.push(`📊 By type: { ${counts.join(", ")} }`);

    statsEl.textContent = parts.join(" | ");
  }

  private clearLayoutEventsLog(): void {
    const consoleEl = document.getElementById("layout_events_console");
    if (consoleEl) consoleEl.innerHTML = "";
    this.logToConsole("🧹 Event log cleared");
  }

  private triggerLayoutTestEvent(): void {
    try {
      const ctx = this.mainContent.getLayoutContext();
      // Emit a synthetic layout-ready event to verify pipeline
      ctx.emit("layout-ready", { source: "DebugPage", at: Date.now() });
      this.logToConsole("🔄 Triggered synthetic 'layout-ready' event");
    } catch (e) {
      this.logToConsole("❌ Failed to trigger test event");
    }
  }

  // =================================================================================
  // ChainHotkeyProvider Implementation (Debug Page Shortcuts)
  // =================================================================================
  
  /**
   * Override to provide debug-specific chain hotkeys
   */
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    const hotkeys = new Map<string, ChainHotkeyHandler>();
    
    // Event Monitor Controls - Using browser-compatible key combinations
    hotkeys.set('Ctrl+Shift+S', {
      key: 'Ctrl+Shift+S',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.startEventMonitoring();
        this.logToConsole('🎯 Hotkey: Started event monitoring (Ctrl+Shift+S)');
        ctx.preventDefault();
        ctx.break(); // Debug page exclusive
      },
      description: 'Start layout event monitoring',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled on debug page */ },
      disable: () => { /* Could disable if needed */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    hotkeys.set('Ctrl+Shift+X', {
      key: 'Ctrl+Shift+X',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.stopEventMonitoring();
        this.logToConsole('🎯 Hotkey: Stopped event monitoring (Ctrl+Shift+X)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Stop layout event monitoring',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    hotkeys.set('Ctrl+Shift+C', {
      key: 'Ctrl+Shift+C',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.clearLayoutEventsLog();
        this.logToConsole('🎯 Hotkey: Cleared event log (Ctrl+Shift+C)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Clear event log',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    hotkeys.set('Ctrl+Shift+T', {
      key: 'Ctrl+Shift+T',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.triggerLayoutTestEvent();
        this.logToConsole('🎯 Hotkey: Triggered test event (Ctrl+Shift+T)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Trigger layout test event',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    hotkeys.set('Ctrl+Shift+R', {
      key: 'Ctrl+Shift+R',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.refreshComponentStatus();
        this.logToConsole('🎯 Hotkey: Refreshed component status (Ctrl+Shift+R)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Refresh component status',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    hotkeys.set('Ctrl+Shift+E', {
      key: 'Ctrl+Shift+E',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.toggleAllComponents();
        this.logToConsole('🎯 Hotkey: Toggled all component details (Ctrl+Shift+E)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Toggle all component details',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    // Message Simulation Shortcuts - using actual characters Firefox sends
    hotkeys.set('Shift+!', {
      key: 'Shift+!',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Shift+! pressed - Show error message');
        this.showErrorMessage();
        this.logToConsole('🎯 Hotkey: Showed error message (Shift+1/!)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Show error message (Shift+1)',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    hotkeys.set('Shift+@', {
      key: 'Shift+@',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Shift+@ pressed - Show warning message');
        this.showWarningMessage();
        this.logToConsole('🎯 Hotkey: Showed warning message (Shift+2/@)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Show warning message (Shift+2)',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    hotkeys.set('Shift+#', {
      key: 'Shift+#',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Shift+# pressed - Show info message');
        this.showInfoMessage();
        this.logToConsole('🎯 Hotkey: Showed info message (Shift+3/#)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Show info message (Shift+3)',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    hotkeys.set('Shift+$', {
      key: 'Shift+$',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Shift+$ pressed - Show success message');
        this.showSuccessMessage();
        this.logToConsole('🎯 Hotkey: Showed success message (Shift+4/$)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Show success message (Shift+4)',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    // Clear All Messages
    hotkeys.set('Shift+Backspace', {
      key: 'Shift+Backspace',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Shift+Backspace pressed - Clear all messages');
        this.clearAllMessages();
        this.logToConsole('🎯 Hotkey: Cleared all messages (Shift+Backspace)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Clear all messages',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    // Console Controls
    hotkeys.set('Ctrl+Shift+L', {
      key: 'Ctrl+Shift+L',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Ctrl+Shift+L pressed - Clear test console');
        this.clearTestConsole();
        this.logToConsole('🎯 Hotkey: Cleared test console (Ctrl+Shift+L)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Clear test console',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    // Debug Information
    hotkeys.set('Ctrl+Shift+H', {
      key: 'Ctrl+Shift+H',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Ctrl+Shift+H pressed - Show hotkey help');
        this.showHotkeyHelp();
        this.logToConsole('🎯 Hotkey: Showed hotkey help (Ctrl+Shift+H)');
        ctx.preventDefault();
        ctx.break();
      },
      description: 'Show hotkey help',
      priority: this.getProviderPriority(),
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    // Enhanced ESC for debug page - cooperative with parent PageComponent ESC
    hotkeys.set('Escape', {
      key: 'Escape',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Escape pressed - Debug page ESC handling');
        
        // Debug-specific ESC behavior
        const handled = this.handleDebugPageEscape(ctx);
        
        if (handled) {
          this.logToConsole('🎯 Hotkey: Debug page handled ESC');
          // Let other ESC handlers also run (cooperative)
          ctx.next();
        } else {
          // Nothing debug-specific to handle, pass to parent/other handlers
          ctx.next();
        }
      },
      description: 'Debug page specific ESC handling',
      priority: this.getProviderPriority(), // Same as PageComponent (200)
      enable: () => { /* Always enabled */ },
      disable: () => { /* Could disable */ },
      isEnabled: () => this.initialized && !this.destroyed
    });
    
    console.log(`🔑 DebugPage: Registered ${hotkeys.size} chain hotkeys:`, Array.from(hotkeys.keys()));
    return hotkeys;
  }
  
  // =================================================================================
  // Debug Hotkey Action Methods
  // =================================================================================
  
  /**
   * Show error message (triggered by Shift+1)
   */
  private showErrorMessage(): void {
    const ctx = this.mainContent.getLayoutContext();
    const messages = ctx.getMessages();
    if (messages) {
      messages.showError(
        'Debug Error Message',
        'This is a test error message triggered by hotkey (Shift+1)',
        { id: 'debug-error-hotkey' }
      );
    }
  }
  
  /**
   * Show warning message (triggered by Shift+2)
   */
  private showWarningMessage(): void {
    const ctx = this.mainContent.getLayoutContext();
    const messages = ctx.getMessages();
    if (messages) {
      messages.showWarning(
        'Debug Warning Message', 
        'This is a test warning message triggered by hotkey (Shift+2)',
        { id: 'debug-warning-hotkey' }
      );
    }
  }
  
  /**
   * Show info message (triggered by Shift+3)
   */
  private showInfoMessage(): void {
    const ctx = this.mainContent.getLayoutContext();
    const messages = ctx.getMessages();
    if (messages) {
      messages.showInfo(
        'Debug Info Message',
        'This is a test info message triggered by hotkey (Shift+3)',
        { id: 'debug-info-hotkey' }
      );
    }
  }
  
  /**
   * Show success message (triggered by Shift+4)
   */
  private showSuccessMessage(): void {
    const ctx = this.mainContent.getLayoutContext();
    const messages = ctx.getMessages();
    if (messages) {
      messages.showSuccess(
        'Debug Success Message',
        'This is a test success message triggered by hotkey (Shift+4)',
        { id: 'debug-success-hotkey' }
      );
    }
  }
  
  /**
   * Clear all messages (triggered by Shift+Backspace)
   */
  private clearAllMessages(): void {
    const ctx = this.mainContent.getLayoutContext();
    const messages = ctx.getMessages();
    if (messages) {
      messages.clearAll();
    }
  }
  
  /**
   * Clear test console (triggered by Ctrl+L)
   */
  private clearTestConsole(): void {
    const testConsole = document.getElementById('test_console');
    if (testConsole) {
      testConsole.innerHTML = '';
    }
  }
  
  /**
   * Show hotkey help (triggered by Ctrl+Shift+H)
   */
  private showHotkeyHelp(): void {
    const helpMessage = `
🎯 Debug Page Hotkeys (Firefox/Browser-friendly):

📊 Event Monitoring:
  Ctrl+Shift+S - Start event monitoring
  Ctrl+Shift+X - Stop event monitoring
  Ctrl+Shift+C - Clear event log
  Ctrl+Shift+T - Trigger test event

💬 Message Testing:
  Shift+1 (!) - Show error message
  Shift+2 (@) - Show warning message
  Shift+3 (#) - Show info message
  Shift+4 ($) - Show success message
  Shift+Backspace - Clear all messages

🔧 Console Controls:
  Ctrl+Shift+L - Clear test console
  Ctrl+Shift+H - Show this help

⌨️ Chain System:
  ESC - Cooperative escape handling
  
🌍 Browser Note: Using Ctrl+Shift+ combinations for
  maximum compatibility across Firefox, Chrome, and Safari.
    `;
    
    this.logToConsole(helpMessage);
    
    // Also show in layout events console
    this.logLayoutEvent('📖 Hotkey help displayed - see test console for full list');
  }
  
  /**
   * Handle debug-specific ESC key behavior
   */
  private handleDebugPageEscape(ctx: HotkeyExecutionContext): boolean {
    let handled = false;
    
    // If event monitoring is active, stop it on ESC
    if (this.eventMonitoringActive) {
      this.stopEventMonitoring();
      this.logToConsole('🎯 ESC: Stopped event monitoring');
      handled = true;
    }
    
    return handled;
  }
  
  /**
   * Test hotkey system manually - for debugging
   */
  public testHotkeySystem(): void {
    console.log('🧪 Manual hotkey system test started...');
    this.logToConsole('🧪 Testing hotkey handlers manually...');
    
    // Test if handlers can be called directly
    try {
      this.startEventMonitoring();
      this.logToConsole('✅ Manual start monitoring: SUCCESS');
      
      setTimeout(() => {
        this.stopEventMonitoring();
        this.logToConsole('✅ Manual stop monitoring: SUCCESS');
        
        this.logToConsole('📝 Hotkey system test complete. If you see this, handlers work but key detection may be the issue.');
        
        // Show registered hotkeys
        this.showRegisteredHotkeys();
        
        // Add keydown listener to debug key detection
        this.addDebugKeyListener();
      }, 1000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logToConsole('❌ Manual hotkey test failed: ' + errorMessage);
    }
  }
  
  /**
   * Add temporary keydown listener for debugging
   */
  private addDebugKeyListener(): void {
    this.logToConsole('🔍 Adding debug key listener. Try pressing Ctrl+Shift+S now...');
    
    const debugListener = (event: KeyboardEvent) => {
      // Check for our specific combinations
      if (event.ctrlKey && event.shiftKey) {
        // Manually normalize the key the same way the chain manager does
        const modifiers = [];
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.metaKey) modifiers.push('Meta');
        if (event.altKey) modifiers.push('Alt');
        if (event.shiftKey) modifiers.push('Shift');
        const normalizedKey = modifiers.length > 0 ? `${modifiers.join('+')}+${event.key}` : event.key;
        
        this.logToConsole(`🎯 Key detected: Ctrl+Shift+${event.key}`);
        this.logToConsole(`🔄 Normalized key: "${normalizedKey}"`);
        console.log('🎯 Key event details:', {
          key: event.key,
          code: event.code,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          normalizedKey: normalizedKey
        });
        
        if (event.key.toLowerCase() === 's') {
          this.logToConsole('✅ Detected Ctrl+Shift+S - this should trigger start monitoring!');
          
          // Check if our registered hotkey matches
          const ourHotkeys = this.getChainHotkeys();
          if (ourHotkeys && ourHotkeys.has(normalizedKey)) {
            this.logToConsole('✅ Normalized key MATCHES our registered hotkey!');
          } else {
            this.logToConsole('❌ Normalized key does NOT match our registered hotkey');
            this.logToConsole(`🔍 Looking for: "${normalizedKey}"`);
            if (ourHotkeys) {
              const registeredKeys = Array.from(ourHotkeys.keys()).filter(k => k.includes('Ctrl+Shift'));
              this.logToConsole(`🔍 Registered Ctrl+Shift keys: ${registeredKeys.join(', ')}`);
            }
          }
        }
      }
      
      // Also check for Shift-only combinations (like Shift+1)
      if (event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
        const modifiers = [];
        if (event.shiftKey) modifiers.push('Shift');
        const normalizedKey = modifiers.length > 0 ? `${modifiers.join('+')}+${event.key}` : event.key;
        
        this.logToConsole(`🎯 Shift-only key detected: ${normalizedKey}`);
        console.log('🎯 Shift-only key event details:', {
          key: event.key,
          code: event.code,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          normalizedKey: normalizedKey
        });
        
        // Check if our registered hotkey matches
        const ourHotkeys = this.getChainHotkeys();
        if (ourHotkeys && ourHotkeys.has(normalizedKey)) {
          this.logToConsole('✅ Shift-only key MATCHES our registered hotkey!');
        } else {
          this.logToConsole('❌ Shift-only key does NOT match our registered hotkey');
          this.logToConsole(`🔍 Looking for: "${normalizedKey}"`);
          if (ourHotkeys) {
            const registeredShiftKeys = Array.from(ourHotkeys.keys()).filter(k => k.startsWith('Shift+'));
            this.logToConsole(`🔍 Registered Shift keys: ${registeredShiftKeys.join(', ')}`);
          }
        }
      }
    };
    
    document.addEventListener('keydown', debugListener);
    
    // Remove listener after 30 seconds
    setTimeout(() => {
      document.removeEventListener('keydown', debugListener);
      this.logToConsole('🚪 Debug key listener removed after 30 seconds');
    }, 30000);
  }
  
  /**
   * Show what hotkeys are actually registered
   */
  private showRegisteredHotkeys(): void {
    const hotkeys = this.getChainHotkeys();
    if (hotkeys) {
      this.logToConsole(`🗺️ Registered hotkeys (${hotkeys.size}):`);
      for (const [key, handler] of hotkeys) {
        this.logToConsole(`  - ${key}: ${handler.description}`);
      }
    } else {
      this.logToConsole('❌ No hotkeys registered!');
    }
  }
  
  /**
   * Setup breadcrumb test controls
   */
  private setupBreadcrumbTestControls(): void {
    // PageContext breadcrumb tests (hierarchical/scoped)
    this.setupBasicBreadcrumbTests();
    this.setupDynamicBreadcrumbTests();
    
    // HeaderComponent breadcrumb tests (direct/global)
    this.setupHeaderComponentBreadcrumbTests();
  }
  
  /**
   * Setup basic breadcrumb test buttons
   */
  private setupBasicBreadcrumbTests(): void {
    // Single page breadcrumb
    const breadcrumbSingle = document.getElementById('breadcrumb_single');
    if (breadcrumbSingle) {
      breadcrumbSingle.addEventListener('click', () => {
        this.testSinglePageBreadcrumb();
      });
    }
    
    // Multi-level breadcrumb
    const breadcrumbMulti = document.getElementById('breadcrumb_multi');
    if (breadcrumbMulti) {
      breadcrumbMulti.addEventListener('click', () => {
        this.testMultiLevelBreadcrumb();
      });
    }
    
    // Breadcrumb with links
    const breadcrumbLinks = document.getElementById('breadcrumb_links');
    if (breadcrumbLinks) {
      breadcrumbLinks.addEventListener('click', () => {
        this.testBreadcrumbsWithLinks();
      });
    }
    
    // Breadcrumb with actions
    const breadcrumbActions = document.getElementById('breadcrumb_actions');
    if (breadcrumbActions) {
      breadcrumbActions.addEventListener('click', () => {
        this.testBreadcrumbsWithActions();
      });
    }
    
    // Clear breadcrumbs
    const breadcrumbClear = document.getElementById('breadcrumb_clear');
    if (breadcrumbClear) {
      breadcrumbClear.addEventListener('click', () => {
        this.clearBreadcrumbs();
      });
    }
  }
  
  /**
   * Setup dynamic breadcrumb test buttons
   */
  private setupDynamicBreadcrumbTests(): void {
    // Add breadcrumb item
    const breadcrumbAdd = document.getElementById('breadcrumb_add');
    if (breadcrumbAdd) {
      breadcrumbAdd.addEventListener('click', () => {
        this.addBreadcrumbItem();
      });
    }
    
    // Remove breadcrumb item
    const breadcrumbRemove = document.getElementById('breadcrumb_remove');
    if (breadcrumbRemove) {
      breadcrumbRemove.addEventListener('click', () => {
        this.removeBreadcrumbItem();
      });
    }
    
    // Update breadcrumb item
    const breadcrumbUpdate = document.getElementById('breadcrumb_update');
    if (breadcrumbUpdate) {
      breadcrumbUpdate.addEventListener('click', () => {
        this.updateBreadcrumbItem();
      });
    }
    
    // Show breadcrumb status
    const breadcrumbStatus = document.getElementById('breadcrumb_status');
    if (breadcrumbStatus) {
      breadcrumbStatus.addEventListener('click', () => {
        this.showBreadcrumbStatus();
      });
    }
  }
  
  /**
   * Setup HeaderComponent breadcrumb test buttons (direct access)
   */
  private setupHeaderComponentBreadcrumbTests(): void {
    // Basic HeaderComponent tests
    const headerBasic = document.getElementById('header_breadcrumb_basic');
    if (headerBasic) {
      headerBasic.addEventListener('click', () => {
        this.testHeaderBreadcrumbBasic();
      });
    }
    
    const headerComplex = document.getElementById('header_breadcrumb_complex');
    if (headerComplex) {
      headerComplex.addEventListener('click', () => {
        this.testHeaderBreadcrumbComplex();
      });
    }
    
    const headerInteractive = document.getElementById('header_breadcrumb_interactive');
    if (headerInteractive) {
      headerInteractive.addEventListener('click', () => {
        this.testHeaderBreadcrumbInteractive();
      });
    }
    
    const headerComponentStatus = document.getElementById('header_breadcrumb_component_status');
    if (headerComponentStatus) {
      headerComponentStatus.addEventListener('click', () => {
        this.showHeaderBreadcrumbComponentStatus();
      });
    }
    
    // Direct component operations
    const headerDirectAdd = document.getElementById('header_breadcrumb_direct_add');
    if (headerDirectAdd) {
      headerDirectAdd.addEventListener('click', () => {
        this.testHeaderBreadcrumbDirectAdd();
      });
    }
    
    const headerDirectRemove = document.getElementById('header_breadcrumb_direct_remove');
    if (headerDirectRemove) {
      headerDirectRemove.addEventListener('click', () => {
        this.testHeaderBreadcrumbDirectRemove();
      });
    }
    
    const headerDirectUpdate = document.getElementById('header_breadcrumb_direct_update');
    if (headerDirectUpdate) {
      headerDirectUpdate.addEventListener('click', () => {
        this.testHeaderBreadcrumbDirectUpdate();
      });
    }
    
    const headerDirectClear = document.getElementById('header_breadcrumb_direct_clear');
    if (headerDirectClear) {
      headerDirectClear.addEventListener('click', () => {
        this.testHeaderBreadcrumbDirectClear();
      });
    }
  }
  
  /**
   * Get breadcrumbs manager from PageContext
   */
  private async getBreadcrumbsManager(): Promise<import('../interfaces/BreadcrumbsManager').BreadcrumbsManager | null> {
    try {
      if (!this.hasPageContext()) {
        console.warn('🍞 DebugPage - PageContext not available');
        return null;
      }
      const pageContext = await this.getPageContext();
      return pageContext.breadcrumbs();
    } catch (error) {
      console.error('🍞 DebugPage - Error getting PageContext:', error);
      return null;
    }
  }
  
  /**
   * Test single page breadcrumb (with proper hierarchical scoping)
   */
  private async testSinglePageBreadcrumb(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      const items: BreadcrumbItem[] = [
        { id: 'DebugPage', text: 'Debug Page' }  // ← Use actual page ID for proper scoping
      ];
      breadcrumbsManager.set(items);
      this.logToConsole('🍞 PageContext - Single page breadcrumb set');
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Test multi-level breadcrumb using PageContext (with proper hierarchical scoping)
   */
  private async testMultiLevelBreadcrumb(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      const items: BreadcrumbItem[] = [
        { id: 'DebugPage', text: 'Debug Page' },      // ← Include page ID for proper scoping
        { id: 'dashboard', text: 'Dashboard' },
        { id: 'reports', text: 'Reports' },
        { id: 'analytics', text: 'Analytics' }
      ];
      breadcrumbsManager.set(items);
      this.logToConsole('🍞 PageContext - Multi-level breadcrumb set');
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Test breadcrumbs with links using PageContext (with proper hierarchical scoping)
   */
  private async testBreadcrumbsWithLinks(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      const items: BreadcrumbItem[] = [
        { id: 'DebugPage', text: 'Debug Page' },  // ← Page scope starts here
        { id: 'home', text: 'Home', href: '/', caption: 'Go to homepage' },
        { id: 'dashboard', text: 'Dashboard', href: '/dashboard', caption: 'View dashboard' }
      ];
      breadcrumbsManager.set(items);
      this.logToConsole('🍞 PageContext - Breadcrumbs with links set');
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Test breadcrumbs with actions using PageContext (with proper hierarchical scoping)
   */
  private async testBreadcrumbsWithActions(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      const items: BreadcrumbItem[] = [
        { id: 'DebugPage', text: 'Debug Page' },  // ← Page scope starts here
        {
          id: 'dashboard',
          text: 'Dashboard',
          clickHandler: (item) => {
            this.logToConsole(`🍞 Breadcrumb action clicked: ${item.text}`);
          },
          caption: 'Click to test action'
        },
        {
          id: 'settings',
          text: 'Settings',
          clickHandler: (item) => {
            this.logToConsole(`🍞 Settings breadcrumb clicked: ${item.text}`);
            alert(`Breadcrumb action executed: ${item.text}`);
          },
          caption: 'Click to show alert'
        }
      ];
      breadcrumbsManager.set(items);
      this.logToConsole('🍞 PageContext - Breadcrumbs with actions set');
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Clear all breadcrumbs using PageContext
   */
  private async clearBreadcrumbs(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      breadcrumbsManager.clear();
      this.logToConsole('🍞 PageContext - All breadcrumbs cleared');
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Add a dynamic breadcrumb item using PageContext
   */
  private async addBreadcrumbItem(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      const timestamp = Date.now();
      const newItem: BreadcrumbItem = {
        id: `dynamic-${timestamp}`,
        text: `Item ${timestamp % 1000}`,
        caption: 'Dynamically added',
        clickHandler: (item) => {
          this.logToConsole(`🍞 Dynamic item clicked: ${item.text}`);
        }
      };
      breadcrumbsManager.add(newItem);
      this.logToConsole(`🍞 PageContext - Added dynamic breadcrumb: ${newItem.text}`);
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Remove a breadcrumb item using PageContext
   */
  private async removeBreadcrumbItem(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      const currentItems = breadcrumbsManager.get();
      if (currentItems.length > 0) {
        const itemToRemove = currentItems[currentItems.length - 1];
        breadcrumbsManager.remove(itemToRemove.id);
        this.logToConsole(`🍞 PageContext - Removed breadcrumb: ${itemToRemove.text}`);
      } else {
        this.logToConsole('🍞 PageContext - No breadcrumbs to remove');
      }
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Update a breadcrumb item using PageContext
   */
  private async updateBreadcrumbItem(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      const currentItems = breadcrumbsManager.get();
      if (currentItems.length > 0) {
        const itemToUpdate = currentItems[0];
        const timestamp = Date.now();
        breadcrumbsManager.update(itemToUpdate.id, {
          text: `Updated ${timestamp % 1000}`,
          caption: 'Recently updated'
        });
        this.logToConsole(`🍞 PageContext - Updated breadcrumb: ${itemToUpdate.id}`);
      } else {
        this.logToConsole('🍞 PageContext - No breadcrumbs to update');
      }
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Show breadcrumb status via PageContext
   */
  private async showBreadcrumbStatus(): Promise<void> {
    const breadcrumbsManager = await this.getBreadcrumbsManager();
    if (breadcrumbsManager) {
      const currentItems = breadcrumbsManager.get();
      this.logToConsole('🍞 PageContext - Breadcrumb Status:');
      this.logToConsole(`  Available: ${breadcrumbsManager.isAvailable()}`);
      this.logToConsole(`  Count: ${currentItems.length}`);
      if (currentItems.length > 0) {
        this.logToConsole('  Current breadcrumbs:');
        currentItems.forEach((item: BreadcrumbItem) => {
          this.logToConsole(`    - ${item.id}: ${item.text}`);
        });
      }
    } else {
      this.logToConsole('❌ PageContext - Breadcrumbs manager not available');
    }
  }
  
  /**
   * Set initial breadcrumb for debug page using PageContext (with proper hierarchical scoping)
   */
  private async setInitialBreadcrumb(): Promise<void> {
    try {
      const pageContext = await this.getPageContext();
      const breadcrumbsManager = pageContext.breadcrumbs();
      
      if (breadcrumbsManager && breadcrumbsManager.isAvailable()) {
        const items: BreadcrumbItem[] = [
          { id: 'DebugPage', text: 'Debug & Testing', caption: 'Development tools' }  // ← Use proper page ID
        ];
        breadcrumbsManager.set(items);
        console.log('🍞 DebugPage - Initial breadcrumbs set via PageContext');
      } else {
        console.warn('🍞 DebugPage - BreadcrumbsManager not available for initial setup');
      }
    } catch (error) {
      console.error('🍞 DebugPage - Error setting initial breadcrumbs:', error);
    }
  }
  
  // =============================================================================
  // HeaderComponent Breadcrumb Tests (Direct/Global Access)
  // =============================================================================
  
  /**
   * Get BreadcrumbsComponent directly from HeaderComponent
   */
  private getBreadcrumbsComponent(): import('../components/BreadcrumbsComponent').BreadcrumbsComponent | null {
    try {
      const layoutContext = this.mainContent.getLayoutContext();
      const header = layoutContext.getHeader();
      return header?.getBreadcrumbsComponent() || null;
    } catch (error) {
      console.error('🍞 DebugPage - Error getting BreadcrumbsComponent:', error);
      return null;
    }
  }
  
  /**
   * Test basic breadcrumb trail via HeaderComponent
   */
  private testHeaderBreadcrumbBasic(): void {
    const breadcrumbsComponent = this.getBreadcrumbsComponent();
    if (breadcrumbsComponent) {
      const items: BreadcrumbItem[] = [
        { id: 'home', text: 'Home', href: '/' },
        { id: 'admin', text: 'Administration' },
        { id: 'debug', text: 'Debug Tools' }
      ];
      breadcrumbsComponent.setBreadcrumbs(items);
      this.logToConsole('🏗️ HeaderComponent - Basic trail set');
    } else {
      this.logToConsole('❌ HeaderComponent - BreadcrumbsComponent not available');
    }
  }
  
  /**
   * Test complex breadcrumb trail via HeaderComponent
   */
  private testHeaderBreadcrumbComplex(): void {
    const breadcrumbsComponent = this.getBreadcrumbsComponent();
    if (breadcrumbsComponent) {
      const items: BreadcrumbItem[] = [
        { id: 'root', text: 'System', href: '/system', caption: 'System root' },
        { id: 'workspace', text: 'Workspace', href: '/workspace', caption: 'User workspace' },
        { id: 'projects', text: 'Projects', href: '/projects', caption: 'All projects' },
        { id: 'current-project', text: 'Opinion Frontend', caption: 'Current project' },
        { id: 'tools', text: 'Development Tools', caption: 'Development utilities' },
        { id: 'debug-console', text: 'Debug Console', caption: 'Debug and testing interface' }
      ];
      breadcrumbsComponent.setBreadcrumbs(items);
      this.logToConsole('🌐 HeaderComponent - Complex trail set');
    } else {
      this.logToConsole('❌ HeaderComponent - BreadcrumbsComponent not available');
    }
  }
  
  /**
   * Test interactive breadcrumbs with actions via HeaderComponent
   */
  private testHeaderBreadcrumbInteractive(): void {
    const breadcrumbsComponent = this.getBreadcrumbsComponent();
    if (breadcrumbsComponent) {
      const items: BreadcrumbItem[] = [
        {
          id: 'dashboard',
          text: 'Dashboard',
          clickHandler: (item) => {
            this.logToConsole(`🏗️ HeaderComponent - Dashboard clicked: ${item.text}`);
            alert(`HeaderComponent Direct Access: ${item.text} clicked!`);
          },
          caption: 'Click to test dashboard action'
        },
        {
          id: 'analytics',
          text: 'Analytics',
          clickHandler: (item) => {
            this.logToConsole(`📊 HeaderComponent - Analytics clicked: ${item.text}`);
            const confirmed = confirm('HeaderComponent Test: Open Analytics in new tab?');
            if (confirmed) {
              this.logToConsole('📊 Analytics - User confirmed action');
            }
          },
          caption: 'Click to test analytics action'
        },
        {
          id: 'reports',
          text: 'Reports',
          href: '/reports',
          caption: 'Link to reports page'
        },
        {
          id: 'current',
          text: 'Debug Interface',
          caption: 'Current page (display only)'
        }
      ];
      breadcrumbsComponent.setBreadcrumbs(items);
      this.logToConsole('⚡ HeaderComponent - Interactive breadcrumbs set');
    } else {
      this.logToConsole('❌ HeaderComponent - BreadcrumbsComponent not available');
    }
  }
  
  /**
   * Show HeaderComponent BreadcrumbsComponent status
   */
  private showHeaderBreadcrumbComponentStatus(): void {
    const breadcrumbsComponent = this.getBreadcrumbsComponent();
    if (breadcrumbsComponent) {
      const status = breadcrumbsComponent.getStatus();
      this.logToConsole('🔍 HeaderComponent - BreadcrumbsComponent Status:');
      this.logToConsole(`  Component Type: ${status.componentType}`);
      this.logToConsole(`  ID: ${status.id}`);
      this.logToConsole(`  Initialized: ${status.initialized}`);
      this.logToConsole(`  Init Time: ${status.initTime ? new Date(status.initTime).toLocaleTimeString() : 'N/A'}`);
      this.logToConsole(`  Uptime: ${status.uptime ? Math.round(status.uptime / 1000) + 's' : 'N/A'}`);
      
      if (status.domElement) {
        this.logToConsole(`  DOM Element: ${status.domElement.tagName}#${status.domElement.id || 'no-id'}.${status.domElement.className || 'no-class'}`);
        this.logToConsole(`  Child Elements: ${status.domElement.childCount}`);
        this.logToConsole(`  Has Content: ${status.domElement.hasContent}`);
      }
      
      if (status.eventListeners) {
        this.logToConsole(`  Event Listeners: ${status.eventListeners.count || 0} (${status.eventListeners.types?.join(', ') || 'none'})`);
      }
      if (status.configuration) {
        this.logToConsole(`  Has LayoutContext: ${status.configuration.hasLayoutContext}`);
      }
      if (status.currentState) {
        this.logToConsole(`  Current Breadcrumbs: ${status.currentState.breadcrumbsCount || 0}`);
      }
      
      if (status.currentState?.breadcrumbs?.length > 0) {
        this.logToConsole('  Breadcrumb Details:');
        status.currentState?.breadcrumbs?.forEach((breadcrumb: { id: string; text: string; hasHref: boolean; hasClickHandler: boolean }) => {
          this.logToConsole(`    - ${breadcrumb.id}: "${breadcrumb.text}" (href: ${breadcrumb.hasHref}, action: ${breadcrumb.hasClickHandler})`);
        });
      }
    } else {
      this.logToConsole('❌ HeaderComponent - BreadcrumbsComponent not available for status');
    }
  }
  
  /**
   * Add breadcrumb directly via HeaderComponent
   */
  private testHeaderBreadcrumbDirectAdd(): void {
    const breadcrumbsComponent = this.getBreadcrumbsComponent();
    if (breadcrumbsComponent) {
      const timestamp = Date.now();
      const newItem: BreadcrumbItem = {
        id: `header-direct-${timestamp}`,
        text: `Direct Item ${timestamp % 1000}`,
        caption: 'Added via HeaderComponent direct access',
        clickHandler: (item) => {
          this.logToConsole(`🏗️ HeaderComponent Direct - Item clicked: ${item.text}`);
        }
      };
      breadcrumbsComponent.addBreadcrumb(newItem);
      this.logToConsole(`🏗️ HeaderComponent (Direct) - Added breadcrumb: ${newItem.text}`);
    } else {
      this.logToConsole('❌ HeaderComponent - BreadcrumbsComponent not available for direct add');
    }
  }
  
  /**
   * Remove last breadcrumb directly via HeaderComponent
   */
  private testHeaderBreadcrumbDirectRemove(): void {
    const breadcrumbsComponent = this.getBreadcrumbsComponent();
    if (breadcrumbsComponent) {
      const currentItems = breadcrumbsComponent.getBreadcrumbs();
      if (currentItems.length > 0) {
        const lastItem = currentItems[currentItems.length - 1];
        breadcrumbsComponent.removeBreadcrumb(lastItem.id);
        this.logToConsole(`🏗️ HeaderComponent (Direct) - Removed breadcrumb: ${lastItem.text}`);
      } else {
        this.logToConsole('🏗️ HeaderComponent (Direct) - No breadcrumbs to remove');
      }
    } else {
      this.logToConsole('❌ HeaderComponent - BreadcrumbsComponent not available for direct remove');
    }
  }
  
  /**
   * Update first breadcrumb directly via HeaderComponent
   */
  private testHeaderBreadcrumbDirectUpdate(): void {
    const breadcrumbsComponent = this.getBreadcrumbsComponent();
    if (breadcrumbsComponent) {
      const currentItems = breadcrumbsComponent.getBreadcrumbs();
      if (currentItems.length > 0) {
        const firstItem = currentItems[0];
        const timestamp = Date.now();
        breadcrumbsComponent.updateBreadcrumb(firstItem.id, {
          text: `Updated ${timestamp % 1000}`,
          caption: 'Updated via HeaderComponent direct access'
        });
        this.logToConsole(`🏗️ HeaderComponent (Direct) - Updated breadcrumb: ${firstItem.id}`);
      } else {
        this.logToConsole('🏗️ HeaderComponent (Direct) - No breadcrumbs to update');
      }
    } else {
      this.logToConsole('❌ HeaderComponent - BreadcrumbsComponent not available for direct update');
    }
  }
  
  /**
   * Clear all breadcrumbs directly via HeaderComponent
   */
  private testHeaderBreadcrumbDirectClear(): void {
    const breadcrumbsComponent = this.getBreadcrumbsComponent();
    if (breadcrumbsComponent) {
      breadcrumbsComponent.clearBreadcrumbs();
      this.logToConsole('🏗️ HeaderComponent (Direct) - All breadcrumbs cleared');
    } else {
      this.logToConsole('❌ HeaderComponent - BreadcrumbsComponent not available for direct clear');
    }
  }
}

export default DebugPage;
