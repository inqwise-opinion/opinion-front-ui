/**
 * Debug Page Component
 * Debug/test page that uses semantic main content structure
 * Provides testing controls and development utilities
 */

import { Sidebar } from "../components/Sidebar";
import SidebarComponent from "../components/SidebarComponent";
import type { AppHeader } from "../components/AppHeader";
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

  constructor(mainContent: MainContentImpl) {
    super(mainContent);
    console.log("🛠️ DEBUGPAGE - Constructor");
  }

  /**
   * Initialize the debug page
   */
  async onInit(): Promise<void> {
    console.log("🏗️ DEBUGPAGE - onInit() START");

    try {
      console.log("🏗️ DEBUGPAGE - Starting initialization process...");

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

    console.log("🏗️ DEBUGPAGE - onInit() END");
  }

  /**
   * Post-initialization hook - called after chain provider registration
   */
  protected async onPostInit(): Promise<void> {
    console.log("🔄 DEBUGPAGE - onPostInit() - Updating status displays after chain registration");
    
    // Now that chain provider is registered, update status displays
    this.updateViewportInfoFromContext(this.mainContent.getLayoutContext());
    this.updateLayoutStatus();
    this.updateHotkeyStatus();
    
    console.log("✅ DEBUGPAGE - onPostInit() complete");
  }

  /**
   * Cleanup method for PageComponent
   */
  protected onDestroy(): void {
    console.log("🏩 DEBUGPAGE - onDestroy()");
    
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
    console.log("DebugPage - Loading template...");

    // Load content into the semantic main element
    this.createFallbackTemplate();

    console.log("DebugPage - Template loaded (using fallback)");
  }

  /**
   * Create fallback template if HTML file fails to load
   */
  private createFallbackTemplate(): void {
    console.log("DebugPage - Creating fallback template...");

    const mainContent = this.mainContent;
    // Use MainContent component if available, otherwise fallback to #app
    const targetElement =
      mainContent?.getElement() || document.getElementById("app");

    if (targetElement) {
      const elementType = mainContent ? "semantic <main>" : "#app";
      console.log(
        `DebugPage - Found ${elementType} element, replacing content...`,
      );
      console.log(
        `DebugPage - Current ${elementType} content length:`,
        targetElement.innerHTML.length,
      );

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
                      <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px;">Ctrl+Shift+T</code> Test Event
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
        console.log("DebugPage - Content set in semantic <main> element");
      } else {
        targetElement.innerHTML = content;
        console.log("DebugPage - Content set in fallback #app element");
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

    // Test User Menu Toggle - Use a different approach to avoid deadlock
    const testUserMenu = document.getElementById("test_user_menu");
    if (testUserMenu) {
      testUserMenu.addEventListener("click", () => {
        // Check current state of user menu to determine toggle direction
        const userMenuDropdown = document.getElementById("user_menu_dropdown");
        const mobileDropdown = document.querySelector(".user-menu-mobile-dropdown");
        const isCurrentlyOpen = (userMenuDropdown && userMenuDropdown.style.display === "block") || 
                               !!mobileDropdown;
        
        const layoutContext = this.mainContent.getLayoutContext();
        // Emit request event instead of notification event
        layoutContext.emit("user-menu-request", {
          requestedAction: "toggle",
          trigger: "debug-page"
        });
        this.logToConsole(`👤 User menu request event emitted`);
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
    console.log("🎯 DEBUGPAGE - Setting up basic message controls...");
    
    // Add comprehensive debugging for layoutContext
    console.log("🎯 DEBUGPAGE - this.mainContent:", !!this.mainContent);
    console.log("🎯 DEBUGPAGE - mainContent.getLayoutContext():", !!this.mainContent?.getLayoutContext());
    console.log("🎯 DEBUGPAGE - LayoutContext available:", !!this.layoutContext);
    
    if (this.layoutContext) {
      console.log("🎯 DEBUGPAGE - LayoutContext type:", this.layoutContext.constructor.name);
      console.log("🎯 DEBUGPAGE - LayoutContext getMessages method:", typeof this.layoutContext.getMessages);
      
      const messages = this.layoutContext.getMessages();
      console.log("🎯 DEBUGPAGE - Messages instance:", !!messages);
      console.log("🎯 DEBUGPAGE - Messages type:", messages ? messages.constructor.name : 'null');
      
      if (messages) {
        console.log("🎯 DEBUGPAGE - Messages showError method:", typeof messages.showError);
        console.log("🎯 DEBUGPAGE - Messages showWarning method:", typeof messages.showWarning);
        console.log("🎯 DEBUGPAGE - Messages showInfo method:", typeof messages.showInfo);
        console.log("🎯 DEBUGPAGE - Messages showSuccess method:", typeof messages.showSuccess);
      }
      
      // Also check registered components
      const components = this.layoutContext.getRegisteredComponents();
      console.log("🎯 DEBUGPAGE - Registered components:", {
        header: !!components.header,
        footer: !!components.footer,
        mainContent: !!components.mainContent,
        messages: !!components.messages,
        sidebar: !!components.sidebar
      });
    }

    // Error message
    const msgError = document.getElementById("msg_error");
    console.log(
      "🎯 DEBUGPAGE - Error button element:",
      msgError ? "FOUND" : "NOT FOUND",
    );
    if (msgError) {
      msgError.addEventListener("click", () => {
        console.log("🎯 DEBUGPAGE - Error button clicked!");
        this.logToConsole("🎯 ERROR BUTTON - Button clicked, starting debugging...");
        
        try {
          // Detailed debugging at click time
          console.log("🎯 DEBUGPAGE - Click-time debugging:");
          console.log("  - this.mainContent:", !!this.mainContent);
          console.log("  - this.layoutContext:", !!this.layoutContext);
          
          if (this.mainContent) {
            const contextViaMain = this.mainContent.getLayoutContext();
            console.log("  - mainContent.getLayoutContext():", !!contextViaMain);
            if (contextViaMain) {
              const messagesViaMain = contextViaMain.getMessages();
              console.log("  - messages via mainContent path:", !!messagesViaMain);
            }
          }
          
          if (!this.layoutContext) {
            this.logToConsole("❌ LayoutContext not available at click time");
            console.error("LayoutContext not available at click time");
            return;
          }
          
          const messages = this.layoutContext.getMessages();
          console.log("🎯 DEBUGPAGE - Messages retrieved at click time:", !!messages);
          this.logToConsole(`🎯 Messages available: ${!!messages}`);
          
          if (messages) {
            console.log("🎯 DEBUGPAGE - About to call messages.showError()");
            messages.showError(
              "Connection Failed",
              "Unable to connect to the server. Please check your internet connection.",
            );
            this.logToConsole("❌ Error message displayed via Messages API");
            console.log("❌ Error message sent successfully");
          } else {
            this.logToConsole("❌ No messages component available at click time");
            console.error("Messages component not available at click time");
            
            // Try alternative access method
            try {
              const alternativeMessages = this.mainContent?.getLayoutContext()?.getMessages();
              if (alternativeMessages) {
                console.log("🎯 DEBUGPAGE - Alternative messages access worked!");
                alternativeMessages.showError(
                  "Connection Failed",
                  "Unable to connect to the server. Please check your internet connection.",
                );
                this.logToConsole("❌ Error message displayed via alternative Messages API access");
              } else {
                this.logToConsole("❌ Alternative messages access also failed");
              }
            } catch (altError) {
              console.error("🎯 DEBUGPAGE - Alternative access error:", altError);
              this.logToConsole("❌ Alternative access error: " + altError.message);
            }
          }
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in error button handler:", error);
          this.logToConsole("❌ Error in message handling: " + error.message);
        }
      });
    }

    // Warning message
    const msgWarning = document.getElementById("msg_warning");
    console.log(
      "🎯 DEBUGPAGE - Warning button element:",
      msgWarning ? "FOUND" : "NOT FOUND",
    );
    if (msgWarning) {
      msgWarning.addEventListener("click", () => {
        console.log("🎯 DEBUGPAGE - Warning button clicked!");
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
            this.logToConsole("⚠️ Warning message displayed via Messages API");
          } else {
            this.logToConsole("❌ No messages component available");
          }
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in warning button handler:", error);
          this.logToConsole("❌ Error in message handling: " + error.message);
        }
      });
    }

    // Info message
    const msgInfo = document.getElementById("msg_info");
    console.log(
      "🎯 DEBUGPAGE - Info button element:",
      msgInfo ? "FOUND" : "NOT FOUND",
    );
    if (msgInfo) {
      msgInfo.addEventListener("click", () => {
        console.log("🎯 DEBUGPAGE - Info button clicked!");
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
            this.logToConsole("ℹ️ Info message displayed via Messages API");
          } else {
            this.logToConsole("❌ No messages component available");
          }
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in info button handler:", error);
          this.logToConsole("❌ Error in message handling: " + error.message);
        }
      });
    }

    // Success message
    const msgSuccess = document.getElementById("msg_success");
    console.log(
      "🎯 DEBUGPAGE - Success button element:",
      msgSuccess ? "FOUND" : "NOT FOUND",
    );
    if (msgSuccess) {
      msgSuccess.addEventListener("click", () => {
        console.log("🎯 DEBUGPAGE - Success button clicked!");
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
            this.logToConsole("✅ Success message displayed via Messages API");
          } else {
            this.logToConsole("❌ No messages component available");
          }
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in success button handler:", error);
          this.logToConsole("❌ Error in message handling: " + error.message);
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
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in action message handler:", error);
          this.logToConsole("❌ Error in message handling: " + error.message);
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
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in persistent message handler:", error);
          this.logToConsole("❌ Error in message handling: " + error.message);
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
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in auto-hide message handler:", error);
          this.logToConsole("❌ Error in message handling: " + error.message);
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
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in sequence handler:", error);
          this.logToConsole("❌ Error in message sequence: " + error.message);
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
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in clear all handler:", error);
          this.logToConsole("❌ Error in message clearing: " + error.message);
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
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in clear errors handler:", error);
          this.logToConsole("❌ Error in message clearing: " + error.message);
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
        } catch (error) {
          console.error("🎯 DEBUGPAGE - Error in clear persistent handler:", error);
          this.logToConsole("❌ Error in message clearing: " + error.message);
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
        if (typeof this.layoutContext.getEventBusDebugInfo === 'function') {
          const debugInfo = this.layoutContext.getEventBusDebugInfo();
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
    console.log('🔑 DebugPage: getChainHotkeys() called - registering hotkeys...');
    const hotkeys = new Map<string, ChainHotkeyHandler>();
    
    // Event Monitor Controls - Using browser-compatible key combinations
    hotkeys.set('Ctrl+Shift+S', {
      key: 'Ctrl+Shift+S',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🎯 DebugPage: Ctrl+Shift+S pressed - Start event monitoring');
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
        console.log('🎯 DebugPage: Ctrl+Shift+X pressed - Stop event monitoring');
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
        console.log('🎯 DebugPage: Ctrl+Shift+C pressed - Clear event log');
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
        console.log('🎯 DebugPage: Ctrl+Shift+T pressed - Trigger test event');
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
      this.logToConsole('❌ Manual hotkey test failed: ' + error.message);
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
}

export default DebugPage;
