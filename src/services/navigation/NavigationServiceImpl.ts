import { BaseService } from "../BaseService";
import { ServiceReference, ServiceReferenceConfig } from "../ServiceReference";
import { SelfIdentifyingService } from "../../core/ServiceIdentity";
import { DEFAULT_NAVIGATION_ITEMS } from "../../config/navigation";
import { LayoutContext } from "../../contexts/LayoutContext";
import {
  NavigationItem,
  Sidebar,
  SidebarComponent,
  SidebarRef,
} from "../../components/Sidebar";
import {
  SERVICE_ID,
  NavigationService,
  NavigationServiceConfig,
} from "./NavigationService";
import { ComponentReference } from "@/components/ComponentReference";

/**
 * Navigation service implementation
 */
export class NavigationServiceImpl
  extends BaseService
  implements NavigationService, SelfIdentifyingService
{
  public static getRegisteredReference(
    context: LayoutContext,
    config?: ServiceReferenceConfig,
  ): ServiceReference<NavigationService> {
    return new ServiceReference<NavigationService>(
      context,
      NavigationServiceImpl.SERVICE_ID,
      config,
    );
  }
  public static readonly SERVICE_ID = "navigation.service" as const;

  private items: NavigationItem[] = [];
  private activeId: string | null = null;
  private expandedIds: Set<string> = new Set();

  constructor(context: LayoutContext, config?: NavigationServiceConfig) {
    super(context, config);
  }

  public static register(
    context: LayoutContext,
    config?: NavigationServiceConfig,
  ): NavigationService {
    const service = new NavigationServiceImpl(context, config);
    context.registerService(NavigationServiceImpl.SERVICE_ID, service);
    return service;
  }

  getServiceId(): string {
    return NavigationServiceImpl.SERVICE_ID;
  }

  protected async onInit(): Promise<void> {
    const config = this.getConfig() as NavigationServiceConfig;

    // Initialize with config items or defaults
    const initialItems = config.initialItems || DEFAULT_NAVIGATION_ITEMS;

    // Initialize items first
    this.items = [...initialItems];

    // Set active ID after items to ensure it exists in the list
    if (config.activeId && this.findItemById(config.activeId)) {
      this.activeId = config.activeId;
    }

    // Ensure valid state by running sync
    this.syncState();

    // Register with EventBus for navigation events
    const eventBus = this.getEventBus();

    try {
      // Get the sidebar reference (single attempt - no retries)
      const sidebarRef = SidebarRef.getRegisteredReference(this.getContext(), {
        maxRetries: 1,
        retryInterval: 0,
        timeout: 0,
      });
      const sidebar = await sidebarRef.get();
      if (sidebar) {
        sidebar.updateNavigation(this.getSidebarStructure());
        this.log("✅", "Synchronized with sidebar");
      }
    } catch (error) {
      this.log("⚠️", "Failed to sync with sidebar:", error);
    }

    this.log("✅", "NavigationService initialized");
  }

  protected async onDestroy(): Promise<void> {
    this.log("👋", "Destroying NavigationService");
  }

  // Core state management
  getItems(): NavigationItem[] {
    return [...this.items];
  }

  setItems(items: NavigationItem[]): void {
    this.items = [...items];
    // After setting items, ensure active and expanded states are preserved
    this.syncState();
  }

  // Active state management
  setActiveItem(id: string): void {
    const validItem = this.findItemById(id);
    if (!validItem) {
      throw new Error(`NavigationService.setActiveItem: Item with id '${id}' not found in navigation items. Available items: ${this.items.map(i => i.id).join(', ')}`);
    }
    
    this.log("🎯", `Setting active item: ${id}`);
    this.activeId = id;
    this.syncState();
    // Immediately sync with sidebar when active item changes
    this.syncWithSidebarAsync();
  }

  getActiveItem(): string | null {
    return this.activeId;
  }

  isActive(id: string): boolean {
    return this.activeId === id;
  }

  // Expanded state management
  toggleExpanded(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
    this.syncState();
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  // SidebarComponent integration
  getSidebarStructure(): NavigationItem[] {
    return this.items.map((item) => ({
      ...item,
      active: item.id === this.activeId,
      expanded: this.expandedIds.has(item.id),
      children: item.children?.map((child) => ({
        ...child,
        active: child.id === this.activeId,
      })),
    }));
  }

  public syncWithSidebar(sidebar: Sidebar): void {
    if (!this.isReady()) {
      throw new Error("NavigationService.syncWithSidebar: Service is not ready. Call init() first.");
    }
    
    if (!sidebar) {
      throw new Error("NavigationService.syncWithSidebar: Sidebar parameter is null or undefined");
    }

    this.log("🔄", "Syncing with sidebar...", { 
      activeId: this.activeId, 
      itemsCount: this.items.length,
      expandedCount: this.expandedIds.size 
    });

    // Update navigation structure based on sidebar state
    const structure = this.getSidebarStructure();
    sidebar.updateNavigation(structure);
    
    // Also explicitly set the active page on the sidebar
    if (this.activeId) {
      sidebar.setActivePage(this.activeId);
      this.log("📍", `Set active page on sidebar: ${this.activeId}`);
    } else {
      this.log("⚠️", "No active ID to set on sidebar");
    }

    this.log("✅", "Synchronized state with sidebar", { activeId: this.activeId });
  }
  
  private async syncWithSidebarAsync(): Promise<void> {
    try {
      const sidebarRef = SidebarRef.getRegisteredReference(this.getContext(), {
        maxRetries: 1,
        retryInterval: 0,
        timeout: 0,
      });
      const sidebar = await sidebarRef.get();
      if (sidebar) {
        this.syncWithSidebar(sidebar);
      }
    } catch (error) {
      this.log("⚠️", "Failed to sync with sidebar async:", error);
    }
  }

  // Private helpers
  private findItemById(id: string): NavigationItem | null {
    // Search in root items
    const rootItem = this.items.find((item) => item.id === id);
    if (rootItem) return rootItem;

    // Search in child items
    for (const item of this.items) {
      if (item.children) {
        const childItem = item.children.find((child) => child.id === id);
        if (childItem) return childItem;
      }
    }

    return null;
  }
  private syncState(): void {
    // Ensure active ID exists somewhere in the tree (root or children)
    if (this.activeId && !this.findItemById(this.activeId)) {
      this.activeId = null;
    }

    // Clean up expanded IDs for non-existent items
    const validIds = new Set(this.items.map((item) => item.id));
    for (const id of this.expandedIds) {
      if (!validIds.has(id)) {
        this.expandedIds.delete(id);
      }
    }
  }
}
