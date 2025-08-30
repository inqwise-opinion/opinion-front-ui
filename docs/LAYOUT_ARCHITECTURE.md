# Layout Architecture Documentation

## Overview

The Opinion Front UI uses a modern **CSS Grid + Flexbox hybrid layout system** designed for optimal desktop experience while maintaining mobile responsiveness. The architecture follows a **micro-kernel design** with persistent global components and dynamic page content.

## Core Layout Structure

### HTML Hierarchy
```html
<body>
  <div class="app-layout">                    <!-- CSS Grid Container -->
    <div class="app-sidebar">                 <!-- Grid Area: sidebar -->
      <!-- Sidebar component content -->
    </div>
    
    <div class="app-content-scroll">          <!-- Grid Area: content -->
      <header class="app-header">             <!-- Fixed header -->
        <!-- Header component content -->
      </header>
      
      <main class="app-main" id="app">        <!-- Dynamic content area -->
        <!-- Page component content rendered here -->
      </main>
      
      <footer class="app-footer">             <!-- Footer flows after content -->
        <!-- Footer component content -->
      </footer>
    </div>
  </div>
</body>
```

## CSS Grid Foundation

### Desktop Layout (≥768px)
```css
.app-layout {
  display: grid;
  height: 100vh;
  width: 100vw;
  grid-template-areas: 
    "sidebar header"
    "sidebar content";
  grid-template-columns: 280px 1fr;
  grid-template-rows: 64px 1fr;
  overflow: hidden;
}
```

### Mobile Layout (<768px)
```css
.app-layout {
  grid-template-areas: 
    "header"
    "main"
    "footer";
  grid-template-columns: 1fr;
  grid-template-rows: 60px 1fr 60px;
}
```

## Component Areas

### 1. Sidebar (`app-sidebar`)
- **Grid Area:** `sidebar`
- **Width:** 280px (desktop), hidden on mobile
- **Position:** Fixed left column
- **Content:** Navigation, user menu, compact mode toggle
- **Responsive:** 
  - Large Desktop (≥1400px): 320px
  - Desktop (1200-1399px): 280px
  - Small Desktop (1025-1199px): 260px
  - Tablet (769-1024px): 240px
  - Mobile (≤768px): Hidden/overlay

#### Compact Mode
```css
.app-layout.sidebar-compact {
  grid-template-columns: 72px 1fr; /* Collapsed sidebar */
}
```

### 2. Header (`app-header`)
- **Grid Area:** `header`  
- **Height:** 64px (desktop), 60px (mobile)
- **Position:** Fixed top-right area
- **Content:** App title, user menu, notifications
- **Behavior:** Always visible, spans content width

### 3. Content Area (`app-content-scroll`)
- **Grid Area:** `content`
- **Layout:** Flexbox column container
- **Overflow:** `overflow-y: auto` (scrollable)
- **Purpose:** Contains header + main + footer in scrollable area

**Key CSS Properties:**
```css
.app-content-scroll {
  grid-area: content;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Critical for proper content sizing */
}
```

### 4. Main Content (`app-main`)
- **Container:** Inside `.app-content-scroll`
- **Layout:** Natural document flow
- **Height:** Determined by content (no forced minimums)
- **Purpose:** Dynamic page content rendering
- **Background:** Light gray (`#f8fafc`)

**Key CSS Properties:**
```css
.app-main {
  background-color: #f8fafc;
  position: relative;
  min-height: auto; /* Allow natural content height */
}
```

### 5. Footer (`app-footer`)
- **Container:** Inside `.app-content-scroll`  
- **Position:** Flows naturally after main content
- **Height:** 52px minimum, auto-sizing
- **Content:** Copyright, navigation links
- **Behavior:** Always appears right after content ends

**Key CSS Properties:**
```css
.app-footer {
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  min-height: 52px;
  position: static; /* Natural document flow */
  flex-shrink: 0;
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
1. **Sidebar Width:** Adjusts at each breakpoint
2. **Grid Columns:** Single column on mobile
3. **Header Height:** Reduced on mobile (60px vs 64px)
4. **Content Padding:** Scales down on smaller screens

## Component Integration

### Global Layout Components
- **Sidebar:** `src/components/Sidebar.ts`
- **Header:** `src/components/AppHeader.ts`
- **Main Content:** `src/components/MainContent.ts`
- **Footer:** `src/components/AppFooter.ts`

### Page Components
- All pages extend `PageComponent` abstract class
- Rendered inside `#app` (`.app-main`)
- Handle their own lifecycle and content
- Examples: `DebugPage`, `DashboardPage`

### Layout Initialization Order
1. **OpinionApp** creates layout structure
2. **Sidebar** inserts as first child of `.app-layout`
3. **AppHeader** inserts into `.app-content-scroll`
4. **MainContent** manages `#app` element
5. **AppFooter** inserts as last child of `.app-content-scroll`
6. **Page Components** render content inside `#app`

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
