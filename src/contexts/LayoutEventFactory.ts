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
 * Data payload for mobile-menu-mode-change events
 */
export interface MobileMenuModeChangeEventData {
  isVisible: boolean;
  previousVisibility: boolean;
  trigger: "close-button" | "backdrop" | "menu-button" | "programmatic";
}

/**
 * Data payload for user-menu-request events
 */
export interface UserMenuRequestEventData {
  requestedAction: "show" | "hide" | "toggle";
  trigger: "debug-page" | "keyboard" | "programmatic";
}

/**
 * Data payload for user-menu-mode-change events
 */
export interface UserMenuModeChangeEventData {
  isVisible: boolean;
  previousVisibility: boolean;
  trigger: "click" | "keyboard" | "programmatic";
}

/**
 * Data payload for sidebar-compact-request events
 */
export interface SidebarCompactRequestEventData {
  requestedAction: "show" | "hide" | "toggle";
  trigger: "debug-page" | "keyboard" | "programmatic";
}

/**
 * Union type for all layout event data types
 */
export type LayoutEventData = 
  | LayoutReadyEventData
  | LayoutModeChangeEventData
  | SidebarCompactModeChangeEventData
  | SidebarCompactRequestEventData
  | MobileMenuModeChangeEventData
  | MobileMenuRequestEventData
  | UserMenuRequestEventData
  | UserMenuModeChangeEventData;

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
   * Create a sidebar-compact-request event
   */
  static createSidebarCompactRequestEvent(
    requestedAction: "show" | "hide" | "toggle",
    trigger: "debug-page" | "keyboard" | "programmatic",
  ): TypedLayoutEvent<SidebarCompactRequestEventData> {
    return {
      type: "sidebar-compact-request",
      data: {
        requestedAction,
        trigger,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a mobile-menu-mode-change event
   */
  static createMobileMenuModeChangeEvent(
    isVisible: boolean,
    previousVisibility: boolean,
    trigger: "close-button" | "backdrop" | "menu-button" | "programmatic",
  ): TypedLayoutEvent<MobileMenuModeChangeEventData> {
    return {
      type: "mobile-menu-mode-change",
      data: {
        isVisible,
        previousVisibility,
        trigger,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a user-menu-request event
   */
  static createUserMenuRequestEvent(
    requestedAction: "show" | "hide" | "toggle",
    trigger: "debug-page" | "keyboard" | "programmatic",
  ): TypedLayoutEvent<UserMenuRequestEventData> {
    return {
      type: "user-menu-request",
      data: {
        requestedAction,
        trigger,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a user-menu-mode-change event
   */
  static createUserMenuModeChangeEvent(
    isVisible: boolean,
    previousVisibility: boolean,
    trigger: "click" | "keyboard" | "programmatic",
  ): TypedLayoutEvent<UserMenuModeChangeEventData> {
    // Only emit if state actually changed
    if (isVisible === previousVisibility) {
      console.warn(`UserMenu - No state change detected (${previousVisibility} → ${isVisible}), skipping event emission`);
      return null as any; // This will be handled by caller
    }
    
    return {
      type: "user-menu-mode-change",
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

      case "sidebar-compact-request":
        const sidebarRequestData = event.data as SidebarCompactRequestEventData;
        return (
          ["show", "hide", "toggle"].includes(sidebarRequestData.requestedAction) &&
          ["debug-page", "keyboard", "programmatic"].includes(sidebarRequestData.trigger)
        );

      case "mobile-menu-mode-change":
        const mobileMenuData = event.data as MobileMenuModeChangeEventData;
        return (
          typeof mobileMenuData.isVisible === "boolean" &&
          typeof mobileMenuData.previousVisibility === "boolean" &&
          ["close-button", "backdrop", "menu-button", "programmatic"].includes(mobileMenuData.trigger)
        );

      case "user-menu-request":
        const userMenuRequestData = event.data as UserMenuRequestEventData;
        return (
          ["show", "hide", "toggle"].includes(userMenuRequestData.requestedAction) &&
          ["debug-page", "keyboard", "programmatic"].includes(userMenuRequestData.trigger)
        );

      case "user-menu-mode-change":
        const userMenuData = event.data as UserMenuModeChangeEventData;
        return (
          typeof userMenuData.isVisible === "boolean" &&
          typeof userMenuData.previousVisibility === "boolean" &&
          ["click", "keyboard", "programmatic"].includes(userMenuData.trigger)
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

      case "sidebar-compact-request":
        const sidebarRequestData = event.data as SidebarCompactRequestEventData;
        const sidebarRequestIcon = sidebarRequestData.requestedAction === "show" ? "📢" : 
                                  sidebarRequestData.requestedAction === "hide" ? "🔄" : "⚙️";
        return `${sidebarRequestIcon} request ${sidebarRequestData.requestedAction} sidebar compact (via ${sidebarRequestData.trigger})`;

      case "mobile-menu-mode-change":
        const mobileMenuData = event.data as MobileMenuModeChangeEventData;
        const actionIcon = mobileMenuData.isVisible ? "📱" : "❌";
        const toggleTriggerNote = ` (via ${mobileMenuData.trigger})`;
        const stateChange = mobileMenuData.previousVisibility !== mobileMenuData.isVisible 
          ? ` ${mobileMenuData.previousVisibility} → ${mobileMenuData.isVisible}`
          : "";
        return `${actionIcon} mobile menu${stateChange}${toggleTriggerNote}`;

      case "user-menu-request":
        const userMenuRequestData = event.data as UserMenuRequestEventData;
        const userRequestIcon = userMenuRequestData.requestedAction === "show" ? "📢" : 
                               userMenuRequestData.requestedAction === "hide" ? "🔄" : "⚙️";
        return `${userRequestIcon} request ${userMenuRequestData.requestedAction} user menu (via ${userMenuRequestData.trigger})`;

      case "user-menu-mode-change":
        const userMenuData = event.data as UserMenuModeChangeEventData;
        const userActionIcon = userMenuData.isVisible ? "👤" : "❌";
        const userTriggerNote = ` (via ${userMenuData.trigger})`;
        const userStateChange = userMenuData.previousVisibility !== userMenuData.isVisible 
          ? ` ${userMenuData.previousVisibility} → ${userMenuData.isVisible}`
          : "";
        return `${userActionIcon} user menu${userStateChange}${userTriggerNote}`;

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
      case "sidebar-compact-request": return "📢";
      case "mobile-menu-request": return "📢";
      case "mobile-menu-mode-change": return "📱";
      case "user-menu-request": return "📢";
      case "user-menu-mode-change": return "👤";
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

export function isSidebarCompactRequestEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<SidebarCompactRequestEventData> {
  return event.type === "sidebar-compact-request";
}

export function isMobileMenuModeChangeEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<MobileMenuModeChangeEventData> {
  return event.type === "mobile-menu-mode-change";
}

export function isUserMenuRequestEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<UserMenuRequestEventData> {
  return event.type === "user-menu-request";
}

export function isUserMenuModeChangeEvent(
  event: TypedLayoutEvent,
): event is TypedLayoutEvent<UserMenuModeChangeEventData> {
  return event.type === "user-menu-mode-change";
}
