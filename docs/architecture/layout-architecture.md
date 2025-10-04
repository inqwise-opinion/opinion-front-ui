# Layout Architecture Documentation

## Overview

The Opinion Front UI uses a modern **CSS Grid + Flexbox hybrid layout system** designed for optimal desktop experience while maintaining mobile responsiveness. The architecture follows a **micro-kernel design** with persistent global components and dynamic page content.

## Core Layout Structure

### HTML Hierarchy
```html
<body>
  <div class="app-layout">                    <!-- CSS Grid Container -->
    <nav class="app-sidebar">                 <!-- Grid Area: sidebar -->
      <!-- Sidebar component content -->
    </nav>
    
    <div class="app-content-area">            <!-- Grid Area: content -->
      <header class="app-header">             <!-- Fixed header -->
        <!-- Header component content -->
      </header>
      
      <div class="app-content-scroll">        <!-- Scrollable container -->
        <div class="app-error-messages">      <!-- Error messages -->
          <!-- Global error/notification messages -->
        </div>
        
        <main class="app-main" id="app">      <!-- Dynamic content (no scroll) -->
          <!-- Page component content rendered here -->
        </main>
        
        <footer class="app-footer">           <!-- Footer flows after content -->
          <!-- Footer component content -->
        </footer>
      </div>
    </div>
  </div>
</body>
```

## CSS Grid Foundation

### Desktop Layout (≥1025px)
```css
.app-layout {
  display: grid;
  height: 100vh;
  width: 100vw;
  grid-template-areas: 
    "sidebar content";
  grid-template-columns: var(--sidebar-width, 280px) 1fr;
  grid-template-rows: 1fr;
  overflow: hidden;
}
```

### Mobile Layout (<768px)
```css
.app-layout {
  grid-template-areas: 
    "content";
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.app-sidebar {
  position: fixed;
  transform: translateX(-100%); /* Hidden by default */
  z-index: 20;
}
```

## Component Areas

### 1. Sidebar (`app-sidebar`)
- **Grid Area:** `sidebar`
- **Width:** 280px (CSS variable: `--sidebar-width`)
- **Compact Width:** 80px (CSS variable: `--sidebar-compact-width`)
- **Position:** Fixed left column on desktop, overlay on mobile
- **Content:** Navigation, brand title, compact mode toggle
- **Responsive:** 
  - Desktop (≥1025px): 280px fixed width
  - Tablet (769-1024px): 280px with responsive adjustments
  - Mobile (≤768px): Hidden/overlay with slide transition

#### Compact Mode
```css
.app-layout.sidebar-compact {
  grid-template-columns: 72px 1fr; /* Collapsed sidebar */
}
```

### 2. Content Area (`app-content-area`)
- **Grid Area:** `content`
- **Layout:** Flexbox column container
- **Purpose:** Contains header + scrollable content container
- **Behavior:** Takes remaining grid space after sidebar

### 3. Header (`app-header`)
- **Container:** Inside `.app-content-area`
- **Height:** 60px (consistent across all viewports)
- **Position:** Fixed at top of content area
- **Content:** Brand title, user menu, notifications
- **Behavior:** Always visible, spans content width

### 4. Scrollable Container (`app-content-scroll`)
- **Container:** Inside `.app-content-area`
- **Layout:** Flexbox column container
- **Overflow:** `overflow-y: auto` (page-level scrolling)
- **Purpose:** Contains error messages + main content + footer
- **Behavior:** Provides scrollbar when content exceeds viewport

**Key CSS Properties:**
```css
.app-content-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1; /* Take remaining space after header */
  display: flex;
  flex-direction: column;
  min-height: 0; /* Critical for proper flex sizing */
}
```

### 5. Main Content (`app-main`)
- **Container:** Inside `.app-content-scroll`
- **Layout:** Natural document flow (no internal scrolling)
- **Height:** Uses natural content height (full vertical content visible)
- **Purpose:** Dynamic page content rendering
- **Background:** Light gray (`#f8fafc`)
- **Scrolling:** None - shows full content, parent container scrolls

**Key CSS Properties:**
```css
.app-main {
  background-color: #f8fafc !important;
  padding: 16px;
  flex: 0 0 auto; /* Don't grow/shrink, use natural size */
  min-height: auto; /* Allow content to determine height */
  overflow: visible; /* No internal scrolling */
}
```

### 6. Footer (`app-footer`)
- **Container:** Inside `.app-content-scroll`  
- **Position:** Flows naturally after main content
- **Height:** 52px minimum, auto-sizing
- **Content:** Copyright, navigation links
- **Behavior:** Always appears exactly where content ends

**Key CSS Properties:**
```css
.app-footer {
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  min-height: 52px;
  flex-shrink: 0; /* Don't shrink footer */
  padding: 16px 32px;
}
```

## Layout Flow Principles

### 1. **CSS Grid for Structure**
- Defines the overall application shell
- Handles sidebar and header positioning
- Creates scrollable content area

### 2. **Flexbox for Content Flow**
- Inside the content area, uses flex column
- Header stays at top
- Main content grows naturally
- Footer flows after content (no forced positioning)

### 3. **Natural Content Height**
- No artificial minimum heights
- Content determines page length
- Footer appears exactly where content ends
- Scrolling only when content exceeds viewport

## Responsive Behavior

### Breakpoints
- **Large Desktop:** ≥1400px
- **Standard Desktop:** 1200-1399px  
- **Small Desktop:** 1025-1199px
- **Tablet:** 769-1024px
- **Mobile:** ≤768px

### Key Responsive Changes
1. **Sidebar Width:** Uses CSS variables for dynamic adjustments
2. **Grid Columns:** Single column on mobile with sidebar overlay
3. **Header Height:** Consistent 60px across all viewports
4. **Sidebar Behavior:** Fixed position on mobile with slide transitions

## Component Integration

### Global Layout Components
- **Layout Coordinator:** `src/components/Layout.ts`
- **Sidebar:** `src/components/SidebarComponent.ts`
- **Header:** `src/components/AppHeaderImpl.ts`
- **Main Content:** `src/components/MainContent.ts`
- **Footer:** `src/components/AppFooterImpl.ts`
- **Error Messages:** `src/components/ErrorMessages.ts`

### Page Components
- All pages extend `PageComponent` abstract class
- Rendered inside `#app` (`.app-main`)
- Handle their own lifecycle and content
- Examples: `DebugPage`, `DashboardPage`

### Layout Initialization Order
1. **OpinionApp** creates main application controller
2. **Layout** component initializes and coordinates all layout components
3. **AppHeader** initializes with sidebar management
4. **SidebarComponent** populates navigation and brand content
5. **MainContent** manages the `#app` element for page content
6. **ErrorMessages** component ready for global error display
7. **AppFooter** initializes with copyright and navigation
8. **Page Components** (DebugPage, DashboardPage) render inside `#app`

## Critical CSS Properties

### For Proper Footer Positioning:
```css
.app-content-scroll {
  min-height: 0 !important; /* Allows content-based sizing */
}

.app-main {
  min-height: auto; /* No forced minimum height */
}

.app-footer {
  position: static; /* Natural document flow */
  flex-shrink: 0; /* Don't shrink footer */
}
```

### For Grid Behavior:
```css
.app-layout {
  height: 100vh; /* Full viewport height */
  overflow: hidden; /* Prevent body scroll */
}
```

## Styling Architecture

### CSS Organization
- **Layout:** `src/assets/styles/app-layout.css`
- **Components:** `src/assets/styles/components/`
  - `header.css`
  - `sidebar.css`
  - `main-content.css`
  - `footer.css`

### CSS Loading Order
1. Base layout (`app-layout.css`)
2. Component styles (imported by components)
3. Page-specific styles (as needed)

## Common Patterns

### Adding New Page Components
1. Extend `PageComponent` abstract class
2. Implement `onInit()` method
3. Handle DOM insertion in `#app` element
4. Clean up resources in `destroy()`

### Layout State Management
- Sidebar compact mode handled by `Sidebar` component
- Responsive breakpoints use CSS media queries
- Layout updates via CSS class toggling

### Error Handling
- Layout survives component failures
- Global error boundary in `OpinionApp`
- Component-level error states in main content

## Performance Considerations

### CSS Grid Benefits
- Hardware-accelerated layout
- Efficient reflows and repaints
- Minimal layout recalculations

### Flexbox for Content
- Natural content sizing
- Efficient space distribution
- Smooth scrolling behavior

### Viewport Constraints
- Fixed 100vh grid prevents body overflow
- Scrolling contained to content area
- Better performance than whole-page scroll

## Migration Notes

This layout architecture was designed during migration from servlet-based Java application to TypeScript SPA:

- **Maintains familiar DOM structure** from original application
- **Preserves existing component patterns** while modernizing
- **Uses CSS Grid/Flexbox** instead of older float/positioning techniques
- **Responsive design** added for mobile devices
- **Component lifecycle management** replaces server-side rendering

## Browser Support

- **CSS Grid:** All modern browsers (IE11+ with -ms- prefix)
- **Flexbox:** Universal support
- **CSS Custom Properties:** Modern browsers only
- **Viewport Units:** Universal support

## Troubleshooting

### Footer Not Positioned Correctly
- Verify `min-height: 0` on `.app-content-scroll`
- Check that footer has `position: static`
- Ensure no conflicting flex properties on `.app-main`

### Sidebar Overlapping Content
- Confirm grid template columns are correct
- Check sidebar width matches grid column width
- Verify compact mode classes are applied correctly

### Content Area Not Scrolling
- Ensure `.app-content-scroll` has `overflow-y: auto`
- Check that grid height is `100vh`
- Verify no `overflow: hidden` on parent elements

## Future Enhancements

### Planned Improvements
- **Dark mode support** with CSS custom properties
- **Animation system** for layout transitions  
- **Advanced responsive patterns** for ultra-wide displays
- **Print stylesheet** optimization
- **Reduced motion** accessibility support

This layout architecture provides a solid foundation for modern web application development while maintaining compatibility with existing design patterns and content structure.
