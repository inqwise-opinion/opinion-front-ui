/**
 * Debug Page Component
 * Debug/test page that uses semantic main content structure
 * Provides testing controls and development utilities
 */

import { Sidebar } from "../components/Sidebar";
import SidebarComponent from "../components/SidebarComponent";
import type { AppHeader } from "../components/AppHeader";
import MainContent from "../components/MainContent";
import Layout from "../components/Layout";
import { getLayoutContext } from "../contexts/index";
import type {
  LayoutContext,
  LayoutModeType,
  LayoutViewPort,
} from "../contexts/LayoutContext";
import type { LayoutEvent } from "../contexts/LayoutContext";
import { PageComponent } from "@/components";

export class DebugPage extends PageComponent {
  private sidebarDebugUnsubscribe: (() => void) | null = null;
  private headerDebugUnsubscribe: (() => void) | null = null;
  private responsiveModeUnsubscribe: (() => void) | null = null;

  constructor(mainContent: MainContent) {
    super(mainContent);
    console.log("🛠️ DEBUGPAGE - Constructor");
  }

  /**
   * Initialize the debug page
   */
  async onInit(): Promise<void> {
    console.log("🏗️ DEBUGPAGE - init() START");

    if (this.isInitialized) {
      console.warn("🏗️ DEBUGPAGE - Already initialized, skipping");
      return;
    }

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

      // Setup sidebar compact mode debugging
      await this.setupSidebarDebug();

      // Set browser tab title
      document.title = "Debug - Opinion";
    } catch (error) {
      console.error("❌ DEBUGPAGE - Initialization failed:", error);
      throw error;
    }

    console.log("🏗️ DEBUGPAGE - init() END");
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
              <h3 style="color: #333; margin-bottom: 15px;">🎯 Sidebar Compact Mode Events</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <h4 style="margin: 0 0 10px 0; color: #555;">Sidebar Events:</h4>
                  <div id="sidebar_events" style="background: #1e3a8a; color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; height: 120px; overflow-y: auto;"></div>
                </div>
                <div>
                  <h4 style="margin: 0 0 10px 0; color: #555;">AppHeader Responses:</h4>
                  <div id="header_events" style="background: #166534; color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; height: 120px; overflow-y: auto;"></div>
                </div>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                <button id="toggle_compact" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🔄 Toggle Compact Mode</button>
                <button id="clear_event_logs" style="padding: 8px 12px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">🧹 Clear Event Logs</button>
              </div>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Test Console</h3>
              <div id="test_console" style="background: #1e1e1e; color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px; height: 200px; overflow-y: auto;"></div>
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
   * Setup sidebar compact mode event debugging
   */
  private async setupSidebarDebug(): Promise<void> {
    console.log(
      "🎯 DebugPage - Setting up sidebar compact mode event debugging...",
    );

    // Wait a bit for components to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Try to get sidebar element from DOM
    const sidebarElement = document.getElementById("app_sidebar");
    if (!sidebarElement) {
      this.logToEventConsole("sidebar_events", "❌ Sidebar element not found");
      return;
    }

    this.logToEventConsole("sidebar_events", "✅ Sidebar element found in DOM");

    // Method 1: Hook into the sidebar compact toggle button clicks
    this.setupSidebarToggleHook();

    // Method 2: Monitor sidebar CSS classes for compact mode changes
    this.setupSidebarClassObserver();

    // Method 3: Listen for custom header position events (AppHeader responses)
    this.setupHeaderEventListener();

    // Method 4: Subscribe to layout mode changes for compact mode detection
    this.setupLayoutModeSubscription();

    this.logToEventConsole(
      "sidebar_events",
      "ℹ️ Debug hooks established - waiting for events...",
    );
  }

  /**
   * Hook into sidebar toggle button to detect compact mode changes
   */
  private setupSidebarToggleHook(): void {
    const compactToggle = document.getElementById("sidebar_compact_toggle");
    if (compactToggle) {
      compactToggle.addEventListener("click", () => {
        // Check current state before the click takes effect
        const sidebar = document.getElementById("app_sidebar");
        const wasCompact =
          sidebar?.classList.contains("sidebar-compact") || false;
        const willBeCompact = !wasCompact;

        const timestamp = new Date().toLocaleTimeString();
        const status = willBeCompact ? "COMPACT" : "NORMAL";
        const statusColor = willBeCompact ? "#fbbf24" : "#3b82f6";

        this.logToEventConsole(
          "sidebar_events",
          `<span style="color: ${statusColor}; font-weight: bold;">[${timestamp}] 🔄 ${status}</span>`,
        );
        this.logToEventConsole(
          "sidebar_events",
          `└─ Compact toggle clicked: ${wasCompact} → ${willBeCompact}`,
        );
      });

      this.logToEventConsole(
        "sidebar_events",
        "✅ Hooked into sidebar compact toggle button",
      );
    } else {
      this.logToEventConsole(
        "sidebar_events",
        "⚠️ Sidebar compact toggle button not found",
      );
    }
  }

  /**
   * Monitor sidebar element for CSS class changes
   */
  private setupSidebarClassObserver(): void {
    const sidebar = document.getElementById("app_sidebar");
    if (!sidebar) return;

    // Create a MutationObserver to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const isCompact = sidebar.classList.contains("sidebar-compact");
          const timestamp = new Date().toLocaleTimeString();
          const status = isCompact ? "COMPACT" : "NORMAL";
          const statusColor = isCompact ? "#fbbf24" : "#3b82f6";

          this.logToEventConsole(
            "sidebar_events",
            `<span style="color: ${statusColor}; font-weight: bold;">[${timestamp}] 📡 ${status}</span>`,
          );
          this.logToEventConsole(
            "sidebar_events",
            `└─ CSS class changed: sidebar-compact = ${isCompact}`,
          );
        }
      });
    });

    // Start observing
    observer.observe(sidebar, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Log initial state
    const initialCompact = sidebar.classList.contains("sidebar-compact");
    this.logToEventConsole(
      "sidebar_events",
      `ℹ️ Initial compact state: ${initialCompact ? "COMPACT" : "NORMAL"}`,
    );
    this.logToEventConsole(
      "sidebar_events",
      "✅ Monitoring sidebar CSS classes",
    );
  }

  /**
   * Setup header position event listener
   */
  private setupHeaderEventListener(): void {
    // Listen for custom header position events
    document.addEventListener("header-position-updated", (event: Event) => {
      const customEvent = event as CustomEvent;
      const timestamp = new Date().toLocaleTimeString();
      const detail = customEvent.detail;

      this.logToEventConsole(
        "header_events",
        `<span style="color: #10b981; font-weight: bold;">[${timestamp}] 🎯 POSITION UPDATE</span>`,
      );
      this.logToEventConsole(
        "header_events",
        `└─ Left: ${detail.headerLeft}px, Width: ${detail.headerWidth}px`,
      );
      this.logToEventConsole(
        "header_events",
        `└─ Sidebar: ${detail.sidebarInfo.isCompact ? "compact" : "normal"} (${detail.sidebarInfo.width}px)`,
      );
    });

    this.logToEventConsole(
      "header_events",
      "✅ Subscribed to header position update events",
    );
  }

  /**
   * Setup layout mode subscription for sidebar compact mode detection
   */
  private setupLayoutModeSubscription(): void {
    // Subscribe to layout mode changes to detect compact mode changes
    this.sidebarDebugUnsubscribe = this.layoutContext.subscribe(
      "layout-mode-change",
      (event: LayoutEvent) => {
        const layoutMode = event.data as LayoutMode;
        const timestamp = new Date().toLocaleTimeString();
        const isCompact = layoutMode.isCompact;
        const status = isCompact ? "COMPACT" : "NORMAL";
        const statusColor = isCompact ? "#fbbf24" : "#3b82f6";

        // Log to sidebar events console
        this.logToEventConsole(
          "sidebar_events",
          `<span style="color: ${statusColor}; font-weight: bold;">[${timestamp}] 🎯 LAYOUT EVENT</span>`,
        );
        this.logToEventConsole(
          "sidebar_events",
          `└─ Layout mode compact state: ${isCompact}`,
        );
        this.logToEventConsole(
          "sidebar_events",
          `└─ Sidebar width: ${layoutMode.sidebar.width}px`,
        );
        this.logToEventConsole(
          "sidebar_events",
          `└─ Layout type: ${layoutMode.type}`,
        );
      },
    );

    // Log initial compact state
    const sidebar = this.layoutContext?.getSidebar();
    const initialCompact = sidebar?.isCompactMode();
    this.logToEventConsole(
      "sidebar_events",
      `✅ Subscribed to LayoutContext compact mode changes`,
    );
    this.logToEventConsole(
      "sidebar_events",
      `ℹ️ Initial compact state from layout: ${initialCompact ? "COMPACT" : "NORMAL"}`,
    );

    // Check for global app instance for additional debugging
    let appHeader = this.layoutContext?.getHeader();

    if (appHeader) {
      this.logToEventConsole("header_events", "✅ AppHeader instance found");
    } else {
      this.logToEventConsole(
        "header_events",
        "ℹ️ AppHeader instance not accessible",
      );
    }
  }

  /**
   * Setup AppHeader debugging if instance is available
   */
  private setupAppHeaderDebug(): void {
    this.logToEventConsole(
      "header_events",
      "✅ AppHeader instance found - monitoring responses",
    );
    this.logToEventConsole(
      "header_events",
      "ℹ️ Watch for position updates in response to sidebar events",
    );

    // Additional debugging could be added here if needed
    // For now, we rely on the custom events and console logs
  }

  /**
   * Log message to event console (sidebar or header)
   */
  private logToEventConsole(consoleId: string, message: string): void {
    const eventConsole = document.getElementById(consoleId);
    if (eventConsole) {
      const logElement = document.createElement("div");
      logElement.innerHTML = message;
      eventConsole.appendChild(logElement);
      eventConsole.scrollTop = eventConsole.scrollHeight;
    }
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

    // Toggle Compact Mode
    const toggleCompact = document.getElementById("toggle_compact");
    if (toggleCompact) {
      toggleCompact.addEventListener("click", () => {
        // Try to find and click the sidebar compact toggle button
        const compactToggle = document.getElementById("sidebar_compact_toggle");
        if (compactToggle) {
          compactToggle.click();
          this.logToConsole("🔄 Triggered sidebar compact mode toggle");
        } else {
          this.logToConsole("❌ Sidebar compact toggle button not found");
        }
      });
    }

    // Clear Event Logs
    const clearEventLogs = document.getElementById("clear_event_logs");
    if (clearEventLogs) {
      clearEventLogs.addEventListener("click", () => {
        const sidebarEvents = document.getElementById("sidebar_events");
        const headerEvents = document.getElementById("header_events");

        if (sidebarEvents) sidebarEvents.innerHTML = "";
        if (headerEvents) headerEvents.innerHTML = "";

        this.logToConsole("🧹 Event logs cleared");
      });
    }

    // Setup Message Simulation Controls
    this.setupMessageSimulationControls();
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

    // Error message
    const msgError = document.getElementById("msg_error");
    console.log(
      "🎯 DEBUGPAGE - Error button element:",
      msgError ? "FOUND" : "NOT FOUND",
    );
    if (msgError) {
      msgError.addEventListener("click", () => {
        console.log("🎯 DEBUGPAGE - Error button clicked!");
        this.layoutContext.showError(
          "Connection Failed",
          "Unable to connect to the server. Please check your internet connection.",
        );
        this.logToConsole("❌ Error message displayed via LayoutContext");
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
        this.layoutContext.showWarning(
          "Session Expiring",
          "Your session will expire in 5 minutes. Save your work to avoid losing data.",
        );
        this.logToConsole("⚠️ Warning message displayed via LayoutContext");
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
        this.layoutContext.showInfo(
          "New Feature Available",
          "Check out the new dashboard features in the sidebar navigation.",
        );
        this.logToConsole("ℹ️ Info message displayed via LayoutContext");
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
        this.layoutContext.showSuccess(
          "Data Saved",
          "Your changes have been saved successfully to the server.",
        );
        this.logToConsole("✅ Success message displayed via LayoutContext");
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
        // Get Layout instance directly for advanced message features
        const layout = this.layoutContext.getLayout();
        if (layout && layout.getErrorMessages) {
          const errorMessages = layout.getErrorMessages();
          errorMessages.addMessage({
            id: "network-error-with-action",
            type: "error",
            title: "Network Error",
            description:
              "Failed to load data. Check your connection and try again.",
            actions: [
              {
                id: "retry",
                text: "Retry",
                action: () => {
                  this.logToConsole("🔄 Retry button clicked!");
                  errorMessages.removeMessage("network-error-with-action");
                  this.layoutContext.showSuccess(
                    "Retrying...",
                    "Attempting to reconnect to the server.",
                  );
                },
                style: "primary",
              },
            ],
            dismissible: true,
            autoHide: false,
          });
          this.logToConsole("🔧 Error message with action displayed");
        } else {
          this.logToConsole("❌ Unable to access ErrorMessages component");
        }
      });
    }

    // Persistent message
    const msgPersistent = document.getElementById("msg_persistent");
    if (msgPersistent) {
      msgPersistent.addEventListener("click", () => {
        const layout = this.layoutContext.getLayout();
        if (layout && layout.getErrorMessages) {
          const errorMessages = layout.getErrorMessages();
          errorMessages.addMessage({
            id: "persistent-warning",
            type: "warning",
            title: "Persistent Warning",
            description:
              'This message persists across page navigation. Use "Clear Persistent" to remove it.',
            persistent: true,
            dismissible: true,
            autoHide: false,
          });
          this.logToConsole("📌 Persistent warning message displayed");
        }
      });
    }

    // Auto-hide message
    const msgAutoHide = document.getElementById("msg_auto_hide");
    if (msgAutoHide) {
      msgAutoHide.addEventListener("click", () => {
        const layout = this.layoutContext.getLayout();
        if (layout && layout.getErrorMessages) {
          const errorMessages = layout.getErrorMessages();
          errorMessages.addMessage({
            id: "auto-hide-info",
            type: "info",
            title: "Auto-Hide Message",
            description:
              "This message will automatically disappear after 3 seconds.",
            autoHide: true,
            autoHideDelay: 3000,
            dismissible: true,
          });
          this.logToConsole("⏰ Auto-hide info message displayed (3s delay)");
        }
      });
    }

    // Message sequence
    const msgSequence = document.getElementById("msg_sequence");
    if (msgSequence) {
      msgSequence.addEventListener("click", () => {
        this.showMessageSequence();
        this.logToConsole("🎬 Message sequence started");
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
        this.layoutContext.clearMessages(false); // Don't clear persistent
        this.logToConsole(
          "🗑️ All non-persistent messages cleared via LayoutContext",
        );
      });
    }

    // Clear errors only
    const clearErrorsOnly = document.getElementById("clear_errors_only");
    if (clearErrorsOnly) {
      clearErrorsOnly.addEventListener("click", () => {
        this.layoutContext.clearMessagesByType("error");
        this.logToConsole("❌ Error messages cleared via LayoutContext");
      });
    }

    // Clear persistent messages
    const clearPersistent = document.getElementById("clear_persistent");
    if (clearPersistent) {
      clearPersistent.addEventListener("click", () => {
        this.layoutContext.clearMessages(true); // Include persistent
        this.logToConsole(
          "📌 All messages including persistent cleared via LayoutContext",
        );
      });
    }
  }

  /**
   * Show a sequence of messages for demonstration
   */
  private showMessageSequence(): void {
    let step = 0;
    const steps = [
      () => {
        this.layoutContext.showInfo(
          "Step 1",
          "Starting data validation process...",
        );
      },
      () => {
        this.layoutContext.showInfo("Step 2", "Validating user permissions...");
      },
      () => {
        this.layoutContext.showWarning(
          "Step 3",
          "Found 2 validation warnings that need attention.",
        );
      },
      () => {
        this.layoutContext.showError(
          "Step 4",
          'Validation failed: Missing required field "email".',
        );
      },
      () => {
        this.layoutContext.showSuccess(
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

      viewportInfo.innerHTML = `
        <div style="color: #e67e22; font-weight: bold; margin-bottom: 8px;">📱 ${type.toUpperCase()} MODE</div>
        Width: ${viewport.width}px<br>
        Height: ${viewport.height}px<br>
        Ratio: ${(viewport.width / viewport.height).toFixed(2)}<br>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
        <div style="font-size: 11px; color: #666;">
          Sidebar Behavior:<br>
          Visible: ${sidebar?.isVisible() ? "✅" : "❌"}<br>
          Width: ${sidebarDimensions?.width}px
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

  /**
   * Clean up when page is destroyed
   */
  protected onDestroy(): void {
    console.log("DebugPage - Destroying...");

    // Unsubscribe from LayoutContext events
    if (this.responsiveModeUnsubscribe) {
      this.responsiveModeUnsubscribe();
      this.responsiveModeUnsubscribe = null;
      console.log("DebugPage - Unsubscribed from responsive mode changes");
    }

    // Unsubscribe from sidebar events
    if (this.sidebarDebugUnsubscribe) {
      this.sidebarDebugUnsubscribe();
      this.sidebarDebugUnsubscribe = null;
      console.log("DebugPage - Unsubscribed from sidebar debug events");
    }

    // Unsubscribe from header events
    if (this.headerDebugUnsubscribe) {
      this.headerDebugUnsubscribe();
      this.headerDebugUnsubscribe = null;
      console.log("DebugPage - Unsubscribed from header debug events");
    }
  }
}

export default DebugPage;
