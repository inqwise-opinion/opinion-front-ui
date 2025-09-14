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

          <div class="test-info" style="background: #e7f3ff; padding: 15px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <h3 style="margin: 0 0 10px 0; color: #0066cc;">✅ Semantic HTML5 Layout</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li>&lt;nav class="app-sidebar"&gt; - Responsive sidebar navigation</li>
              <li>&lt;header class="app-header"&gt; - Page header with breadcrumbs</li>
              <li>&lt;main class="main-content"&gt; - Semantic main content area</li>
              <li>&lt;footer class="app-footer"&gt; - Site footer with links</li>
            </ul>
          </div>

          <div class="debug-content" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0; color: #333;">Debug Information</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0;">
              <div>
                <h4 style="margin: 0 0 10px 0; color: #555;">Viewport Info:</h4>
                <div id="viewport_info" style="font-family: monospace; background: #f1f3f4; padding: 10px; border-radius: 4px;">Loading...</div>
              </div>
              <div>
                <h4 style="margin: 0 0 10px 0; color: #555;">Layout Status:</h4>
                <div id="layout_status" style="font-family: monospace; background: #f1f3f4; padding: 10px; border-radius: 4px;">Checking...</div>
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
              <h3 style="color: #333; margin-bottom: 15px;">💬 Message Simulation</h3>
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
                <button id="test_user_loading" style="padding: 10px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">🔄 Test User Loading</button>
                <button id="test_viewport_info" style="padding: 10px 16px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">📐 Update Viewport Info</button>
                <button id="test_mobile_toggle" style="padding: 10px 16px; background: #6f42c1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">📱 Test Mobile Menu</button>
                <button id="clear_console" style="padding: 10px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">🧹 Clear Console</button>
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

    // Update viewport info initially using LayoutContext data

    this.updateViewportInfoFromContext(this.mainContent.getLayoutContext());
    this.updateLayoutStatus();

    // Setup responsive behavior
    this.setupResponsiveHandlers();
  }







  /**
   * Setup test control buttons
   */
  private setupTestControls(): void {
    // Test User Loading
    const testUserLoading = document.getElementById("test_user_loading");
    if (testUserLoading) {
      testUserLoading.addEventListener("click", () => {
        this.logToConsole("🔄 Testing user loading simulation...");
        // The global layout should handle this, not the page
        this.logToConsole(
          "Note: User loading is handled by global AppHeader component",
        );
        this.logToConsole("Check browser console for AppHeader logs");
      });
    }

    // Update Viewport Info
    const testViewportInfo = document.getElementById("test_viewport_info");
    if (testViewportInfo) {
      testViewportInfo.addEventListener("click", () => {
        this.updateViewportInfoFromContext(this.mainContent.getLayoutContext());
        this.updateLayoutStatus();
        this.logToConsole("📐 Viewport info updated");
      });
    }

    // Test Mobile Menu Toggle
    const testMobileToggle = document.getElementById("test_mobile_toggle");
    if (testMobileToggle) {
      testMobileToggle.addEventListener("click", () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          const hamburger = document.getElementById("mobile_menu_toggle");
          if (hamburger) {
            hamburger.click();
            this.logToConsole("📱 Mobile menu toggled");
          } else {
            this.logToConsole("❌ Mobile menu button not found");
          }
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
      const isCompact = sidebar?.isCompactMode() ?? false;

      // Color coding based on mobile state
      const modeColor = isMobile ? "#e74c3c" : "#e67e22";
      const compactStatus = isMobile 
        ? "N/A (uses overlay)" 
        : (isCompact ? "✅ Compact" : "❌ Expanded");

      viewportInfo.innerHTML = `
        <div style="color: ${modeColor}; font-weight: bold; margin-bottom: 8px;">📱 ${type.toUpperCase()} MODE</div>
        Width: ${viewport.width}px<br>
        Height: ${viewport.height}px<br>
        Ratio: ${(viewport.width / viewport.height).toFixed(2)}<br>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
        <div style="font-size: 11px; color: #666;">
          Sidebar Behavior:<br>
          Visible: ${sidebar?.isVisible() ? "✅" : "❌"}<br>
          Width: ${sidebarDimensions?.width}px<br>
          Compact: ${compactStatus}
        </div>
      `;
    }
  }

  /**
   * Update layout status information
   */
  private updateLayoutStatus(): void {
    const layoutStatus = document.getElementById("layout_status");
    if (layoutStatus) {
      const header = document.querySelector(".app-header");
      const sidebar = document.querySelector(".app-sidebar, #app_sidebar");
      const footer = document.querySelector(".app-footer");
      const userMenuTrigger = document.querySelector("#user_menu_trigger");
      const mobileMenuToggle = document.querySelector("#mobile_menu_toggle");

      layoutStatus.innerHTML = `
        Header: ${header ? "✅" : "❌"}<br>
        Sidebar: ${sidebar ? "✅" : "❌"}<br>
        Footer: ${footer ? "✅" : "❌"}<br>
        UserMenu: ${userMenuTrigger ? "✅" : "❌"}<br>
        MobileMenu: ${mobileMenuToggle ? "✅" : "❌"}
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
}

export default DebugPage;
