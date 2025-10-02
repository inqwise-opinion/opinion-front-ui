import { Service, ServiceConfig } from "../../interfaces/Service";
import { NavigationItem } from "../../components/Sidebar";

export const SERVICE_ID = "navigation.service";

export interface NavigationServiceConfig extends ServiceConfig {
  initialItems?: NavigationItem[];
  activeId?: string;
}

/**
 * Navigation service interface
 */
export interface NavigationService extends Service {
  // Core state management
  getItems(): NavigationItem[];
  setItems(items: NavigationItem[]): void;

  // Active state management
  setActiveItem(id: string): void;
  getActiveItem(): string | null;
  isActive(id: string): boolean;

  // Expanded state management
  toggleExpanded(id: string): void;
  isExpanded(id: string): boolean;

  // SidebarComponent integration
  getSidebarStructure(): NavigationItem[];

  // State synchronization
  syncWithSidebar(sidebar: import("../../components/Sidebar").Sidebar): void;
}
