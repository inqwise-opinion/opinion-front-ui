/**
 * Layout Event Factory
 * Provides strongly typed layout events with specific data structures
 */

import type { LayoutContext, LayoutViewPort, LayoutModeType } from "./LayoutContext";

// =================================================================================
// Event Data Type Definitions
// =================================================================================

/**
 * Data payload for layout-ready events
 */
export interface LayoutReadyEventData {
  context: LayoutContext;
  timestamp: number;
}

/**
 * Data payload for layout-mode-change events
 */
export interface LayoutModeChangeEventData {
  context: LayoutContext;
  viewport: LayoutViewPort;
  modeType: LayoutModeType;
  previousModeType?: LayoutModeType;
}

/**
 * Data payload for sidebar-compact-mode-change events
 */
export interface SidebarCompactModeChangeEventData {
  compactMode: boolean;
  previousCompactMode: boolean;
  blockedReason?: "mobile-layout" | "sidebar-locked";
}

/**
 * Data payload for mobile-menu-request events
 */
export interface MobileMenuRequestEventData {
  requestedAction: "show" | "hide" | "toggle";
  trigger: "menu-button" | "programmatic";
}

/**
 * Data payload for mobile-menu-toggle events
 */
export interface MobileMenuToggleEventData {
  isVisible: boolean;
  previousVisibility: boolean;
  trigger: "close-button" | "backdrop" | "menu-button" | "programmatic";
}

/**
 * Union type for all layout event data types
 */
export type LayoutEventData = 
  | LayoutReadyEventData
  | LayoutModeChangeEventData
  | SidebarCompactModeChangeEventData
  | MobileMenuToggleEventData
  | MobileMenuRequestEventData;

/**
 * Strongly typed layout event structure
 */
export interface TypedLayoutEvent<T extends LayoutEventData = LayoutEventData> {
  type: LayoutEventType;
  data: T;
  timestamp: number;
}

// Import the event type from LayoutContext
import type { LayoutEventType } from "./LayoutContext";

// =================================================================================
// Layout Event Factory
// =================================================================================

export class LayoutEventFactory {
  /**
   * Create a layout-ready event
   */
  static createLayoutReadyEvent(context: LayoutContext): TypedLayoutEvent<LayoutReadyEventData> {
    return {
      type: "layout-ready",
      data: {
        context,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a layout-mode-change event
   */
  static createLayoutModeChangeEvent(
    context: LayoutContext,
    viewport: LayoutViewPort,
    modeType: LayoutModeType,
    previousModeType?: LayoutModeType,
  ): TypedLayoutEvent<LayoutModeChangeEventData> {
    return {
      type: "layout-mode-change",
      data: {
        context,
        viewport,
        modeType,
        previousModeType,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a sidebar-compact-mode-change event
   */
  static createSidebarCompactModeChangeEvent(
    compactMode: boolean,
    previousCompactMode: boolean,
    blockedReason?: "mobile-layout" | "sidebar-locked",
  ): TypedLayoutEvent<SidebarCompactModeChangeEventData> {
    return {
      type: "sidebar-compact-mode-change",
      data: {
        compactMode,
        previousCompactMode,
        blockedReason,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a mobile-menu-request event
   */
  static createMobileMenuRequestEvent(
    requestedAction: "show" | "hide" | "toggle",
    trigger: "menu-button" | "programmatic",
  ): TypedLayoutEvent<MobileMenuRequestEventData> {
    return {
      type: "mobile-menu-request",
      data: {
        requestedAction,
        trigger,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a mobile-menu-toggle event
   */
  static createMobileMenuToggleEvent(
    isVisible: boolean,
    previousVisibility: boolean,
    trigger: "close-button" | "backdrop" | "menu-button" | "programmatic",
  ): TypedLayoutEvent<MobileMenuToggleEventData> {
    return {
      type: "mobile-menu-toggle",
      data: {
        isVisible,
        previousVisibility,
        trigger,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a generic layout event (for backward compatibility)
   */
  static createGenericEvent(
    type: LayoutEventType,
    data: any,
  ): TypedLayoutEvent {
    return {
      type,
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate event data structure
   */
  static validateEventData<T extends LayoutEventData>(
    event: TypedLayoutEvent<T>,
  ): boolean {
    if (!event.type || !event.data || typeof event.timestamp !== "number") {
      return false;
    }

    // Type-specific validation
    switch (event.type) {
      case "layout-ready":
        const readyData = event.data as LayoutReadyEventData;
        return !!(readyData.context && typeof readyData.timestamp === "number");

      case "layout-mode-change":
        const modeData = event.data as LayoutModeChangeEventData;
        return !!(
          modeData.context &&
          modeData.viewport &&
          modeData.modeType &&
          typeof modeData.viewport.width === "number" &&
          typeof modeData.viewport.height === "number"
        );

      case "sidebar-compact-mode-change":
        const sidebarData = event.data as SidebarCompactModeChangeEventData;
        return (
          typeof sidebarData.compactMode === "boolean" &&
          typeof sidebarData.previousCompactMode === "boolean"
        );

      case "mobile-menu-request":
        const mobileMenuRequestData = event.data as MobileMenuRequestEventData;
        return (
          ["show", "hide", "toggle"].includes(mobileMenuRequestData.requestedAction) &&
          ["menu-button", "programmatic"].includes(mobileMenuRequestData.trigger)
        );

      case "mobile-menu-toggle":
        const mobileMenuData = event.data as MobileMenuToggleEventData;
        return (
          typeof mobileMenuData.isVisible === "boolean" &&
          typeof mobileMenuData.previousVisibility === "boolean" &&
          ["close-button", "backdrop", "menu-button", "programmatic"].includes(mobileMenuData.trigger)
        );

      default:
        return true; // Generic events are always valid
    }
  }

  /**
   * Format event data for debugging/logging
   */
  static formatEventDataForLogging(event: TypedLayoutEvent): string {
    switch (event.type) {
      case "layout-ready":
        return "→ Layout initialization complete";

      case "layout-mode-change":
        const modeData = event.data as LayoutModeChangeEventData;
        const mobileNote = modeData.modeType === "mobile" ? " (compact mode disabled)" : "";
        const previousNote = modeData.previousModeType 
          ? ` (from ${modeData.previousModeType})`
          : "";
        return `→ modeType=${modeData.modeType}${mobileNote}, viewport=${modeData.viewport?.width}x${modeData.viewport?.height}${previousNote}`;

      case "sidebar-compact-mode-change":
        const sidebarData = event.data as SidebarCompactModeChangeEventData;
        const blockedNote = sidebarData.blockedReason 
          ? ` (blocked: ${sidebarData.blockedReason})` 
          : "";
        const changeNote = sidebarData.previousCompactMode !== undefined
          ? ` (was ${sidebarData.previousCompactMode})`
          : "";
        return `→ compactMode=${sidebarData.compactMode}${blockedNote}${changeNote}`;

      case "mobile-menu-request":
        const mobileMenuRequestData = event.data as MobileMenuRequestEventData;
        const requestIcon = mobileMenuRequestData.requestedAction === "show" ? "📢" : 
                           mobileMenuRequestData.requestedAction === "hide" ? "🔄" : "⚙️";
        const requestTriggerNote = ` (via ${mobileMenuRequestData.trigger})`;
        return `${requestIcon} request ${mobileMenuRequestData.requestedAction} mobile menu${requestTriggerNote}`;

      case "mobile-menu-toggle":
        const mobileMenuData = event.data as MobileMenuToggleEventData;
        const actionIcon = mobileMenuData.isVisible ? "📱" : "❌";
        const toggleTriggerNote = ` (via ${mobileMenuData.trigger})`;
        const stateChange = mobileMenuData.previousVisibility !== mobileMenuData.isVisible 
          ? ` ${mobileMenuData.previousVisibility} → ${mobileMenuData.isVisible}`
          : "";
        return `${actionIcon} mobile menu${stateChange}${toggleTriggerNote}`;

      default:
        try {
          return event.data ? `→ data=${JSON.stringify(event.data)}` : "";
        } catch {
          return "→ [complex data]";
        }
    }
  }

  /**
   * Get color-coded badge for event type
   */
  static getEventBadge(eventType: LayoutEventType): string {
    switch (eventType) {
      case "layout-ready": return "🟩";
      case "layout-mode-change": return "🟦";
      case "sidebar-compact-mode-change": return "🟨";
      case "mobile-menu-request": return "📢";
      case "mobile-menu-toggle": return "📱";
      default: return "⬜";
    }
  }
}

// =================================================================================
// Type Guards
// =================================================================================

export function isLayoutReadyEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<LayoutReadyEventData> {
  return event.type === "layout-ready";
}

export function isLayoutModeChangeEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<LayoutModeChangeEventData> {
  return event.type === "layout-mode-change";
}

export function isSidebarCompactModeChangeEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<SidebarCompactModeChangeEventData> {
  return event.type === "sidebar-compact-mode-change";
}

export function isMobileMenuRequestEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<MobileMenuRequestEventData> {
  return event.type === "mobile-menu-request";
}

export function isMobileMenuToggleEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<MobileMenuToggleEventData> {
  return event.type === "mobile-menu-toggle";
}
