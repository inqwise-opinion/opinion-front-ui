# Layout Mode Change System

## Overview

I've successfully implemented a comprehensive layout mode change event system that automatically manages CSS classes for all layout components based on the current layout state. This system combines viewport information with sidebar state to provide intelligent layout mode detection and automatic CSS class management.

## Layout Modes

The system recognizes four distinct layout modes:

### 1. **Mobile Mode** (`mobile`)
- **Trigger**: Viewport width ≤ 768px
- **Characteristics**: 
  - Sidebar is hidden/overlay
  - Single column layout
  - Touch-optimized spacing
  - Simplified navigation

### 2. **Tablet Mode** (`tablet`)
- **Trigger**: Viewport width 769px - 1024px
- **Characteristics**:
  - Reduced sidebar width (240px)
  - Optimized for touch and mouse
  - Medium-density layout
  - Adaptive navigation

### 3. **Desktop Mode** (`desktop`)
- **Trigger**: Viewport width > 1024px + sidebar in normal mode
- **Characteristics**:
  - Full sidebar width (280px)
  - Mouse-optimized interactions
  - Generous spacing
  - Full feature set

### 4. **Desktop Compact Mode** (`desktop-compact`)
- **Trigger**: Viewport width > 1024px + sidebar in compact mode
- **Characteristics**:
  - Compact sidebar width (80px)
  - Icon-only navigation
  - Maximized content area
  - Hover tooltips for navigation

## Architecture

### Event Flow

```
User Action (sidebar toggle, window resize)
    ↓
Sidebar.setCompactMode() OR viewport change detected
    ↓
LayoutContext.updateSidebarDimensions() OR handleViewportChange()
    ↓
LayoutContext.calculateLayoutMode() determines new mode
    ↓
LayoutContext.emitLayoutModeChange() fires 'layout-mode-change' event
    ↓
Layout.handleLayoutModeChange() receives event
    ↓
Layout.updateComponentCSSClasses() applies classes to all components
    ↓
CSS automatically styles components based on applied classes
```

### Components Affected

The layout mode system automatically applies CSS classes to:

- **`.app-layout`** - Main layout container
- **`.app-sidebar`** - Navigation sidebar
- **`.app-header`** - Application header
- **`.app-main`** / **`.app-content-scroll`** - Main content area
- **`.app-footer`** - Application footer
- **`document.body`** - Global styling scope

## CSS Classes Applied

### Mode-Specific Classes
```css
.layout-mode-mobile          /* Mobile layout mode */
.layout-mode-tablet          /* Tablet layout mode */
.layout-mode-desktop         /* Desktop layout mode */
.layout-mode-desktop-compact /* Desktop compact layout mode */
```

### State-Based Classes
```css
.layout-compact    /* Compact sidebar state */
.layout-mobile     /* Mobile viewport state */
.layout-tablet     /* Tablet viewport state */
.layout-desktop    /* Desktop viewport state */
```

### CSS Custom Properties
```css
--layout-mode      /* Current mode: mobile|tablet|desktop|desktop-compact */
--is-compact       /* 1 if compact, 0 if not */
--is-mobile        /* 1 if mobile, 0 if not */
--is-tablet        /* 1 if tablet, 0 if not */
--is-desktop       /* 1 if desktop, 0 if not */
```

## Usage Examples

### CSS Styling Based on Layout Mode

```css
/* Mobile-specific styling */
.layout-mode-mobile .app-header {
  padding: 8px 16px;
  font-size: 14px;
}

/* Desktop compact mode */
.layout-mode-desktop-compact .app-sidebar .nav-text {
  display: none; /* Hide text in compact mode */
}

/* State-based styling */
.layout-compact .nav-item {
  justify-content: center;
}

/* Using CSS custom properties */
.responsive-component {
  padding: calc(var(--is-mobile, 0) * 16px + var(--is-desktop, 0) * 24px);
}
```

### JavaScript Integration

```typescript
// Subscribe to layout mode changes
const layoutContext = LayoutContext.getInstance();
const unsubscribe = layoutContext.subscribe('layout-mode-change', (event) => {
  const layoutMode = event.data;
  console.log('Layout mode changed to:', layoutMode.type);
  
  // Custom component logic
  updateComponentForMode(layoutMode);
});

// Get current layout mode
const currentMode = layoutContext.getLayoutMode();
```

## Implementation Details

### 1. Layout Context Updates

**File**: `/src/contexts/LayoutContext.ts`

- Added `LayoutModeType` and `LayoutMode` interfaces
- Added `'layout-mode-change'` event type
- Implemented `calculateLayoutMode()` method
- Added `emitLayoutModeChange()` method
- Added `getLayoutMode()` public method

### 2. Layout Component Integration

**File**: `/src/components/Layout.ts`

- Added subscription to `'layout-mode-change'` events
- Implemented `updateComponentCSSClasses()` method
- Automatic CSS class management for all components
- CSS custom property management
- Custom event dispatching for external integration

### 3. Mode Calculation Logic

```typescript
private calculateLayoutMode(): LayoutMode {
  const { sidebar, viewport } = this.state;
  
  let type: LayoutModeType;
  if (viewport.isMobile) {
    type = 'mobile';
  } else if (viewport.isTablet) {
    type = 'tablet';
  } else if (viewport.isDesktop && sidebar.isCompact) {
    type = 'desktop-compact';
  } else {
    type = 'desktop';
  }
  
  return { type, isCompact, isMobile, isTablet, isDesktop, viewport, sidebar };
}
```

## Benefits

### 1. **Automatic CSS Management**
- No manual CSS class coordination needed
- Consistent styling across all components
- Eliminates CSS class synchronization bugs

### 2. **Intelligent Mode Detection**
- Combines viewport and sidebar state information
- Accurate mode classification for all scenarios
- Responsive breakpoint management

### 3. **Developer Experience**
- Simple CSS selectors for mode-specific styling
- CSS custom properties for dynamic values
- Clear separation of concerns

### 4. **Performance**
- Event-driven architecture prevents unnecessary updates
- CSS-based styling is performant
- Single source of truth for layout state

### 5. **Extensibility**
- Easy to add new layout modes
- Simple subscription model for custom components
- Comprehensive event data for complex use cases

## Utility Classes

The system enables powerful utility classes:

```css
/* Show/hide based on mode */
.show-mobile-only { display: none; }
.layout-mobile .show-mobile-only { display: block; }

.hide-compact { display: block; }
.layout-compact .hide-compact { display: none; }

/* Responsive grid columns */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(
    calc(var(--is-mobile, 0) * 1 + var(--is-tablet, 0) * 2 + var(--is-desktop, 0) * 3), 
    1fr
  );
}
```

## Integration with Existing System

The layout mode system integrates seamlessly with the existing layout context:

1. **Sidebar dimension changes** automatically trigger mode recalculation
2. **Viewport changes** update both dimensions and mode
3. **CSS Grid variables** work alongside mode classes
4. **Component subscriptions** can listen to specific events they need
5. **Backward compatibility** is maintained with existing event types

## Testing and Debugging

### Debug Utilities

```css
/* Visual mode indicator */
.debug-layout-mode::before {
  content: "Mode: " var(--layout-mode);
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 9999;
}

/* Color-coded borders for different modes */
.debug-layout-borders .layout-mode-mobile { border: 2px solid #ef4444; }
.debug-layout-borders .layout-mode-tablet { border: 2px solid #f59e0b; }
.debug-layout-borders .layout-mode-desktop { border: 2px solid #10b981; }
.debug-layout-borders .layout-mode-desktop-compact { border: 2px solid #8b5cf6; }
```

### Console Logging

The system provides comprehensive console logging for debugging:

```
LayoutContext - Layout mode changed: {type: 'desktop-compact', isCompact: true, ...}
Layout - Updating component CSS classes for mode: desktop-compact
Layout - CSS classes updated: {mode: 'desktop-compact', addedClasses: [...], components: [...]}
```

## Files Created/Modified

### New Files
- `/src/assets/styles/layout-modes.css` - Example CSS usage patterns
- `/src/examples/layout-mode-example.ts` - Demo and integration examples

### Modified Files
- `/src/contexts/LayoutContext.ts` - Added layout mode calculation and events
- `/src/components/Layout.ts` - Added CSS class management system

## Conclusion

The layout mode change system provides a comprehensive, automated solution for managing layout-specific styling across all components. It eliminates the complexity of manual CSS class coordination while providing powerful tools for responsive design and layout adaptation.

The system's event-driven architecture ensures components stay synchronized, while CSS-based styling provides excellent performance. The intelligent mode detection combines multiple factors to provide accurate layout classification for all scenarios.

This implementation serves as the foundation for sophisticated responsive layouts and provides a clean, maintainable approach to layout management in complex applications.
