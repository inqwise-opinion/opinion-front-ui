# Breadcrumbs Architecture - Design Decisions

## Executive Summary

This document outlines the architectural decisions for implementing multi-level, clickable breadcrumbs in the Opinion Front UI application. The design follows existing project patterns and maintains consistency with the event-driven, component-based architecture.

## 1. Naming Conventions ✅ APPROVED

- **`BreadcrumbItem`** (singular) - Individual item in breadcrumb trail
- **`BreadcrumbsComponent`** (plural) - Component managing the collection
- **`breadcrumbs-mode-change`** - Event name for breadcrumb updates
- **`PageContext`** - Page-level functionality provider (future)

## 2. Data Structure ✅ APPROVED

```typescript
interface BreadcrumbItem {
  id: string;                                    // Unique identifier
  text: string;                                  // Display text
  caption?: string;                             // Optional subtitle/description
  href?: string;                                // Optional URL link
  clickHandler?: (item: BreadcrumbItem) => void; // Optional click handler
}
```

**Key Properties:**
- Simple, minimal data structure
- Support for both navigation (href) and actions (clickHandler)
- Optional fields for flexibility

## 3. Component Architecture ✅ APPROVED

### **Pattern: AppHeader Container + Component Content**
Following the existing UserMenu pattern:

1. **AppHeader provides container** (`.header-breadcrumbs` area)
2. **BreadcrumbsComponent manages content** (creates HTML, handles events, updates DOM)
3. **BreadcrumbsComponent renders in existing header breadcrumb area** (space-efficient)

### **Responsibilities:**
- **AppHeader**: Provides DOM container and initial setup
- **BreadcrumbsComponent**: Self-contained rendering, state management, event handling
- **PageComponents**: Provide breadcrumb data when requested

## 4. Integration Architecture ✅ APPROVED

### **Phase 1: Direct BreadcrumbsComponent (CURRENT PRIORITY)**
```typescript
// Direct method calls for immediate functionality
breadcrumbsComponent.setBreadcrumbs(items);
breadcrumbsComponent.clearBreadcrumbs();
breadcrumbsComponent.addBreadcrumb(item);
```

### **Phase 2: PageContext Integration (FUTURE)**
```typescript
// Promise-based context access (solves async timing issues)
protected pageContextPromise: Promise<PageContext>;

// Usage in pages:
const pageContext = await this.pageContextPromise;
pageContext.breadcrumbs().set(items);  // Grouped API (to be decided)
```

**Selected Solution: Option B - Promise-based**
- Handles async initialization timing issues
- Clean, predictable API
- No complex subscription management needed

## 5. Dynamic Breadcrumb Management ✅ APPROVED

### **Scenarios Supported:**
1. **Page-level breadcrumbs** - Basic navigation trail
2. **Sub-page navigation** - Dashboard → Reports → Chart Details → Edit Mode
3. **Modal/Dialog context** - Additional breadcrumb for modal states

### **Management Methods:**
```typescript
// Direct manipulation methods
setBreadcrumbs(items: BreadcrumbItem[]): void;     // Replace all
addBreadcrumb(item: BreadcrumbItem): void;         // Add to end
removeBreadcrumb(id: string): void;                // Remove by ID
updateBreadcrumb(id: string, updates: Partial<BreadcrumbItem>): void; // Update specific item
clearBreadcrumbs(): void;                          // Clear all
```

## 6. Implementation Priority ✅ APPROVED

### **Phase 1: Foundation (IMMEDIATE)**
1. ✅ Define `BreadcrumbItem` interface
2. ✅ Create `BreadcrumbsComponent` (following UserMenu pattern)
3. ✅ Integrate with AppHeader breadcrumb area (`.header-breadcrumbs`)
4. ✅ Test with direct method calls

### **Phase 2: Integration (FUTURE)**
1. Design PageContext interface after BreadcrumbsComponent is proven
2. Implement Promise-based PageContext access
3. Decide on grouped API (`ctx.breadcrumbs().*`) vs direct API
4. Add layout event support if needed

## 7. Technical Details

### **Rendering Location:**
- **Container**: Existing `.header-breadcrumbs` in AppHeader
- **Replaces**: Static title display with dynamic breadcrumb trail
- **Responsive**: Inherits AppHeader responsive behavior

### **Event Integration:**
- **Phase 1**: Direct method calls, no events needed
- **Phase 2**: Potential `breadcrumbs-mode-change` events if cross-component coordination needed

### **Lifecycle Management:**
- Component creation/destruction tied to AppHeader lifecycle
- Automatic cleanup of event listeners and DOM modifications
- Integration with existing component registration system

## 8. Benefits of This Architecture

1. **Consistency**: Follows existing UserMenu pattern exactly
2. **Separation of Concerns**: Clean component boundaries
3. **Extensibility**: Easy to add PageContext layer later
4. **Space Efficiency**: Reuses existing header area
5. **Flexibility**: Supports both static and dynamic breadcrumbs
6. **Maintainability**: Self-contained component with clear interface

## 9. Implementation Status

- ✅ **Architecture Design**: Complete
- ✅ **Technical Decisions**: Approved
- 🚧 **Implementation**: Ready to begin
- ⏳ **PageContext Integration**: Future phase

## 10. Next Steps

1. **IMMEDIATE**: Implement `BreadcrumbItem` interface
2. **IMMEDIATE**: Create `BreadcrumbsComponent` class
3. **IMMEDIATE**: Integrate with AppHeader container
4. **IMMEDIATE**: Test with sample breadcrumb data
5. **FUTURE**: Design and implement PageContext layer

---

**Status**: Architecture finalized, ready for implementation
**Last Updated**: 2025-01-16
**Next Review**: After BreadcrumbsComponent completion