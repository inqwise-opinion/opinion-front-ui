# Timer Alternatives - Best Practices

## ❌ Avoid Timer-Based Solutions

**DO NOT USE** timer-based solutions like `setTimeout`, `setInterval`, or `requestAnimationFrame` for:
- Layout synchronization
- Component state coordination
- DOM measurement timing
- Event handling delays

## Why Timers Are Problematic

### 1. **Race Conditions**
- Unpredictable execution order
- Browser performance variations
- Different device capabilities

### 2. **Unreliable Timing**
- CSS transition durations can vary
- Browser frame rates differ
- Background tabs behave differently

### 3. **Memory Leaks**
- Forgotten clearTimeout/clearInterval calls
- Components destroyed before timer completion
- Accumulating timer references

### 4. **Testing Difficulties**
- Hard to test deterministically
- Flaky tests
- Time-dependent assertions

## ✅ Preferred Alternatives

### 1. **Event-Driven Architecture**
Instead of waiting for arbitrary time delays, use event listeners:

```typescript
// ❌ BAD: Using timers
setTimeout(() => {
    this.publishCurrentDimensions();
}, 16);

// ✅ GOOD: Using events
element.addEventListener('transitionend', () => {
    this.publishCurrentDimensions();
});
```

### 2. **CSS Transition Events**
Listen to actual CSS transition completion:

```typescript
// Listen for transition completion
sidebar.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'width') {
        this.handleSidebarTransitionComplete();
    }
});
```

### 3. **MutationObserver**
For DOM changes and attribute modifications:

```typescript
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            this.handleClassChange();
        }
    });
});

observer.observe(element, { 
    attributes: true, 
    attributeFilter: ['class'] 
});
```

### 4. **ResizeObserver**
For element size changes:

```typescript
const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
        this.handleElementResize(entry.contentRect);
    });
});

resizeObserver.observe(sidebarElement);
```

### 5. **Intersection Observer**
For visibility and viewport changes:

```typescript
const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        this.handleVisibilityChange(entry.isIntersecting);
    });
});

intersectionObserver.observe(element);
```

### 6. **Promise-Based Coordination**
For sequential operations:

```typescript
// ❌ BAD: Timer-based sequencing
setTimeout(() => {
    this.step1();
    setTimeout(() => {
        this.step2();
    }, 100);
}, 50);

// ✅ GOOD: Promise-based sequencing
async function executeSequence() {
    await this.step1();
    await this.step2();
}
```

### 7. **Debounced Event Handling**
For high-frequency events like resize:

```typescript
class EventDebouncer {
    private timeoutId: number | null = null;
    
    debounce(fn: Function, delay: number) {
        return (...args: any[]) => {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            this.timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }
}

// Use with proper cleanup
const debouncedResize = this.debouncer.debounce(this.handleResize, 100);
window.addEventListener('resize', debouncedResize);
```

## Specific Use Cases

### Layout Dimension Changes
```typescript
// ❌ BAD: Timer delay for DOM settling
setTimeout(() => {
    this.measureAndPublish();
}, 16);

// ✅ GOOD: Listen to transition end
this.sidebar.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'width') {
        this.measureAndPublish();
    }
});
```

### Component Initialization
```typescript
// ❌ BAD: Arbitrary delay
setTimeout(() => {
    this.initializeComponent();
}, 100);

// ✅ GOOD: Check readiness state
private waitForReady(): Promise<void> {
    return new Promise((resolve) => {
        if (this.isReady) {
            resolve();
        } else {
            this.once('ready', resolve);
        }
    });
}
```

### Animation Coordination
```typescript
// ❌ BAD: Guessing animation duration
setTimeout(() => {
    this.onAnimationComplete();
}, 300);

// ✅ GOOD: Listen to animation events
element.addEventListener('animationend', () => {
    this.onAnimationComplete();
});
```

## Exception Cases

The **ONLY** acceptable timer usage is for:

### 1. **Debouncing High-Frequency Events**
```typescript
// Acceptable for performance optimization
const debouncedHandler = debounce(handler, 100);
window.addEventListener('resize', debouncedHandler);
```

### 2. **User Experience Delays**
```typescript
// Acceptable for intentional UX delays
setTimeout(() => {
    this.showTooltip();
}, 500); // Intentional hover delay
```

### 3. **Polling External Resources**
```typescript
// Acceptable for external API polling
setInterval(() => {
    this.checkExternalStatus();
}, 30000); // 30-second health check
```

## Migration Examples

### Before: Timer-Based Sidebar
```typescript
// ❌ OLD: Timer-based approach
setCompactMode(compact: boolean): void {
    this.compactMode = compact;
    this.updateClasses();
    
    // Timer delay for DOM settling
    setTimeout(() => {
        this.publishCurrentDimensions();
    }, 16);
}
```

### After: Event-Based Sidebar
```typescript
// ✅ NEW: Event-based approach
setCompactMode(compact: boolean): void {
    this.compactMode = compact;
    this.updateClasses();
    
    // Listen for transition completion
    this.sidebar.addEventListener('transitionend', this.handleTransitionEnd, { once: true });
}

private handleTransitionEnd = (event: TransitionEvent) => {
    if (event.propertyName === 'width') {
        this.publishCurrentDimensions();
    }
};
```

## Implementation Checklist

When refactoring timer-based code:

- [ ] Identify what event you're actually waiting for
- [ ] Replace setTimeout/setInterval with appropriate event listeners
- [ ] Add proper cleanup for event listeners
- [ ] Test edge cases (fast clicking, slow devices, etc.)
- [ ] Ensure proper error handling
- [ ] Document the event-based approach
- [ ] Update tests to be deterministic

## Testing Timer-Free Code

```typescript
// ✅ Deterministic tests
test('sidebar dimensions update on transition end', async () => {
    sidebar.setCompactMode(true);
    
    // Trigger the actual event instead of waiting
    sidebar.dispatchEvent(new TransitionEvent('transitionend', {
        propertyName: 'width'
    }));
    
    expect(layoutContext.getSidebarWidth()).toBe(80);
});
```

Remember: **If you need a timer, you're probably waiting for the wrong thing. Find the actual event you should be listening to instead.**
