# Z-Index Management Service Refactor

## Overview

This document describes the refactoring of the z-index management system for the GNS3 Web UI project. The new system uses a **fixed layer-based approach** instead of an incremental counter, providing predictable z-index values and automatic restoration of element layers.

## Problem Statement

### Original Issues

1. **Incremental Counter Growth**
   - Old system used a global counter that kept incrementing
   - Z-index values could grow indefinitely (1000 → 1001 → 1002 → ...)
   - No upper bound, potential for overflow

2. **No Layer Restoration**
   - When clicking a window, it moved to top but previous window wasn't restored
   - Multiple windows could end up at the same high z-index
   - Unpredictable layering behavior

3. **Session Menu and Confirm Dialog Obscured**
   - Session menu z-index: 1000
   - AI Chat window when clicked: 1001+
   - Menu would be hidden behind active windows
   - Confirm dialogs also affected

4. **Inconsistent Management**
   - Some z-index values hardcoded in CSS
   - Some set via JavaScript
   - No centralized configuration

## Solution Design

### Fixed Layer System

The new system uses **fixed z-index layers** defined in constants:

```typescript
export const Z_INDEX_LAYERS = {
  BASE: 1000,           // Default/base layer
  AI_CHAT: 1001,        // AI Chat window (default)
  WEB_CONSOLE: 1002,    // Web Console window (default)
  TEMP_TOP: 1200,       // Active window (when clicked)
  SESSION_MENU: 1300,   // Session action menu
  CONFIRM_DIALOG: 1400, // Confirmation dialog
} as const;
```

### Layer Hierarchy

```
1400 ──────────────────────────────────────────────
│     Confirm Dialog (CONFIRM_DIALOG)              │  Highest
1300 ──────────────────────────────────────────────
│     Session Menu (SESSION_MENU)                  │
1200 ──────────────────────────────────────────────
│     Active Window (TEMP_TOP)                     │  Dynamic
1002 ──────────────────────────────────────────────
│     Web Console (WEB_CONSOLE)                    │
1001 ──────────────────────────────────────────────
│     AI Chat (AI_CHAT)                            │
1000 ──────────────────────────────────────────────
│     Base Content (BASE)                          │  Lowest
     ─────────────────────────────────────────────
```

### Auto-Restore Mechanism

When a window is clicked:
1. Its original z-index is stored
2. It's set to TEMP_TOP (1200)
3. Previous windows at TEMP_TOP are restored to their original values
4. Only one window is "on top" at a time

## API Documentation

### ZIndexService

#### `getLayerZIndex(layer: ZIndexLayer): number`

Get the fixed z-index value for a specific layer.

```typescript
const zIndex = this.zIndexService.getLayerZIndex('AI_CHAT');
// Returns: 1001
```

#### `bringToFront(element: HTMLElement): void`

Bring an element to the TEMP_TOP layer (1200). Automatically restores other elements.

```typescript
@HostListener('click')
bringToFront(): void {
  this.zIndexService.bringToFront(this.elementRef.nativeElement);
}
```

#### `applyLayerZIndex(layer: ZIndexLayer, element: HTMLElement): void`

Apply a fixed layer z-index to an element.

```typescript
this.zIndexService.applyLayerZIndex('SESSION_MENU', overlayPane);
// Sets element.style.zIndex = "1300"
```

#### `getZIndexChanged(): Observable<number>`

Get an observable that emits when z-index changes occur.

```typescript
this.zIndexService.getZIndexChanged().pipe(
  takeUntil(this.destroy$)
).subscribe((newZIndex) => {
  // React to z-index changes
});
```

#### `restoreZIndex(element: HTMLElement): void`

Restore an element to its original z-index.

```typescript
this.zIndexService.restoreZIndex(this.elementRef.nativeElement);
```

## Implementation Details

### Files Modified

#### 1. `src/app/services/z-index.service.ts`

**Changes**:
- Added `Z_INDEX_LAYERS` constant
- Removed incremental counter
- Added `originalZIndexes` Map to track element layers
- Added `elementsAtTop` Set to track elements at TEMP_TOP
- Implemented auto-restore mechanism

**Key Methods**:
```typescript
class ZIndexService {
  private originalZIndexes = new Map<HTMLElement, number>();
  private elementsAtTop = new Set<HTMLElement>();

  bringToFront(element: HTMLElement): void {
    // Store original z-index
    if (!this.originalZIndexes.has(element)) {
      const currentZIndex = parseInt(window.getComputedStyle(element).zIndex) || Z_INDEX_LAYERS.BASE;
      this.originalZIndexes.set(element, currentZIndex);
    }

    // Restore other elements
    this.elementsAtTop.forEach((topElement) => {
      if (topElement !== element && this.originalZIndexes.has(topElement)) {
        const originalZIndex = this.originalZIndexes.get(topElement)!;
        topElement.style.zIndex = String(originalZIndex);
        this.elementsAtTop.delete(topElement);
      }
    });

    // Set current element to TEMP_TOP
    element.style.zIndex = String(Z_INDEX_LAYERS.TEMP_TOP);
    this.elementsAtTop.add(element);
  }
}
```

#### 2. `src/app/components/project-map/ai-chat/ai-chat.component.ts`

**Changes**:
- Added `elementRef: ElementRef` to constructor
- Added `ngOnInit()` to initialize DOM z-index immediately
- Added `subscribeToZIndexChanges()` method
- Modified `bringToFront()` to use ZIndexService

**Before**:
```typescript
export class AiChatComponent {
  currentZIndex: number = 1000;

  constructor(private zIndexService: ZIndexService) {}

  @HostListener('click')
  bringToFront(): void {
    this.currentZIndex = this.zIndexService.getNextZIndex();
  }
}
```

**After**:
```typescript
export class AiChatComponent {
  currentZIndex: number;
  private destroy$ = new Subject<void>();

  constructor(
    private zIndexService: ZIndexService,
    private elementRef: ElementRef
  ) {
    this.currentZIndex = Z_INDEX_LAYERS.AI_CHAT;
  }

  ngOnInit() {
    // Apply initial z-index to DOM immediately
    this.elementRef.nativeElement.style.zIndex = String(Z_INDEX_LAYERS.AI_CHAT);
    this.subscribeToZIndexChanges();
  }

  @HostListener('click')
  bringToFront(): void {
    this.zIndexService.bringToFront(this.elementRef.nativeElement);
    this.currentZIndex = Z_INDEX_LAYERS.TEMP_TOP;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

#### 3. `src/app/components/project-map/console-wrapper/console-wrapper.component.ts`

**Changes**:
- Added `OnDestroy` interface
- Added `destroy$` Subject for cleanup
- Added `ngOnInit()` with DOM initialization
- Added `subscribeToZIndexChanges()` method
- Modified `bringToFront()` to use TEMP_TOP

**Before**:
```typescript
export class ConsoleWrapperComponent {
  currentZIndex: number = 1000;

  constructor(private zIndexService: ZIndexService) {}
}
```

**After**:
```typescript
export class ConsoleWrapperComponent implements OnInit, OnDestroy {
  currentZIndex: number;
  private destroy$ = new Subject<void>();

  constructor(
    private zIndexService: ZIndexService,
    private elementRef: ElementRef
  ) {
    this.currentZIndex = Z_INDEX_LAYERS.WEB_CONSOLE;
  }

  ngOnInit() {
    this.elementRef.nativeElement.style.zIndex = String(Z_INDEX_LAYERS.WEB_CONSOLE);
    this.subscribeToZIndexChanges();
  }

  @HostListener('click')
  bringToFront(): void {
    this.zIndexService.bringToFront(this.elementRef.nativeElement);
    this.currentZIndex = Z_INDEX_LAYERS.TEMP_TOP;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

#### 4. `src/app/components/project-map/ai-chat/chat-session-list.component.ts`

**Changes**:
- Added `Renderer2` to constructor
- Modified `onMenuOpened()` to use `requestAnimationFrame` and data attributes
- Modified `onMenuClosed()` to clean up data attributes
- Modified `deleteSession()` to use `applyLayerZIndex()`

**Key Implementation**:
```typescript
constructor(
  private dialog: MatDialog,
  private aiChatService: AiChatService,
  private zIndexService: ZIndexService,
  private renderer: Renderer2
) {}

onMenuOpened(): void {
  requestAnimationFrame(() => {
    const menuPanels = document.querySelectorAll('.mat-menu-panel');
    if (menuPanels.length > 0) {
      const lastMenu = menuPanels[menuPanels.length - 1] as HTMLElement;
      const overlayPane = lastMenu.closest('.cdk-overlay-pane') as HTMLElement;

      if (overlayPane) {
        // Mark as session menu overlay
        this.renderer.setAttribute(overlayPane, 'data-session-menu', 'true');
        // Set z-index
        this.zIndexService.applyLayerZIndex('SESSION_MENU', overlayPane);
      }
    }
  });
}

onMenuClosed(): void {
  requestAnimationFrame(() => {
    const sessionMenuOverlay = document.querySelector('[data-session-menu="true"]') as HTMLElement;
    if (sessionMenuOverlay) {
      this.renderer.removeAttribute(sessionMenuOverlay, 'data-session-menu');
      sessionMenuOverlay.style.removeProperty('z-index');
    }
  });
}

deleteSession(session: ChatSession): void {
  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    data: { message },
    panelClass: 'confirmation-dialog-panel'
  });

  dialogRef.afterOpened().subscribe(() => {
    const dialogPane = document.querySelector('.confirmation-dialog-panel') as HTMLElement;
    if (dialogPane) {
      this.zIndexService.applyLayerZIndex('CONFIRM_DIALOG', dialogPane);
    }
  });
}
```

#### 5. `src/styles.scss`

**Changes**:
- Removed hardcoded z-index values for session menu and confirm dialog
- Added documentation comment explaining z-index management

```scss
/* ============================================================================
 * Material overlays z-index fix
 * AI Chat container uses z-index: 1000
 * Material overlays use default z-index: 1000
 * Session Menu (1300) and Confirm Dialog (1400) are set via ZIndexService
 * ============================================================================ */
```

#### 6. `src/app/components/project-map/ai-chat/ai-chat.component.scss`

**Changes**:
- Removed hardcoded session menu z-index rule
- Added comment explaining ZIndexService handles it

```scss
/* NOTE: Session menu and confirm dialog z-index are now handled by ZIndexService
 * See styles.scss for global overlay z-index configuration */
```

## Usage Examples

### Example 1: Creating a New Floating Window

```typescript
@Component({
  selector: 'app-my-window',
  template: `<div class="my-window">Content</div>`
})
export class MyWindowComponent implements OnInit, OnDestroy {
  currentZIndex: number;
  private destroy$ = new Subject<void>();

  constructor(
    private zIndexService: ZIndexService,
    private elementRef: ElementRef
  ) {
    this.currentZIndex = ZIndexService.getLayerZIndex('MY_WINDOW'); // Define new layer if needed
  }

  ngOnInit() {
    // Initialize DOM z-index
    this.elementRef.nativeElement.style.zIndex = String(this.currentZIndex);
    this.subscribeToZIndexChanges();
  }

  @HostListener('click')
  bringToFront(): void {
    this.zIndexService.bringToFront(this.elementRef.nativeElement);
    this.currentZIndex = Z_INDEX_LAYERS.TEMP_TOP;
  }

  private subscribeToZIndexChanges(): void {
    this.zIndexService.getZIndexChanged().pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const isAtTop = this.zIndexService.isAtTop(this.elementRef.nativeElement);
      if (!isAtTop) {
        this.currentZIndex = Z_INDEX_LAYERS.MY_WINDOW;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Example 2: Adding a New Fixed Layer

If you need a new fixed layer (e.g., for a notification panel):

```typescript
// In z-index.service.ts
export const Z_INDEX_LAYERS = {
  // ... existing layers
  NOTIFICATION: 1500,  // New layer above confirm dialog
} as const;

// Usage
this.zIndexService.applyLayerZIndex('NOTIFICATION', notificationElement);
```

### Example 3: Opening a Dialog Above Windows

```typescript
openMyDialog(): void {
  const dialogRef = this.dialog.open(MyDialogComponent, {
    data: { message: 'Hello' }
  });

  dialogRef.afterOpened().subscribe(() => {
    const dialogPane = document.querySelector('.my-dialog') as HTMLElement;
    if (dialogPane) {
      // Ensure dialog is above all windows
      this.zIndexService.applyLayerZIndex('CONFIRM_DIALOG', dialogPane);
    }
  });
}
```

## Best Practices

### ✅ DO

1. **Use fixed layers for component types**
   ```typescript
   this.currentZIndex = Z_INDEX_LAYERS.AI_CHAT;
   ```

2. **Use TEMP_TOP for active windows**
   ```typescript
   this.zIndexService.bringToFront(this.elementRef.nativeElement);
   ```

3. **Initialize DOM z-index in ngOnInit**
   ```typescript
   ngOnInit() {
     this.elementRef.nativeElement.style.zIndex = String(Z_INDEX_LAYERS.AI_CHAT);
   }
   ```

4. **Clean up observables in ngOnDestroy**
   ```typescript
   ngOnDestroy(): void {
     this.destroy$.next();
     this.destroy$.complete();
   }
   ```

5. **Use requestAnimationFrame for overlay timing**
   ```typescript
   onMenuOpened(): void {
     requestAnimationFrame(() => {
       // Manipulate overlay here
     });
   }
   ```

### ❌ DON'T

1. **Don't use hardcoded z-index values**
   ```typescript
   // ❌ WRONG
   element.style.zIndex = '9999';

   // ✅ CORRECT
   this.zIndexService.applyLayerZIndex('SESSION_MENU', element);
   ```

2. **Don't skip DOM initialization**
   ```typescript
   // ❌ WRONG - rely only on data binding
   @Input() set zIndex(value) { this.currentZIndex = value; }

   // ✅ CORRECT - initialize DOM immediately
   ngOnInit() {
     this.elementRef.nativeElement.style.zIndex = String(value);
   }
   ```

3. **Don't forget to cleanup**
   ```typescript
   // ❌ WRONG - memory leak
   ngOnInit() {
     this.zIndexService.getZIndexChanged().subscribe(...);
   }

   // ✅ CORRECT - proper cleanup
   private destroy$ = new Subject<void>();
   ngOnInit() {
     this.zIndexService.getZIndexChanged().pipe(
       takeUntil(this.destroy$)
     ).subscribe(...);
   }
   ```

4. **Don't query DOM too early**
   ```typescript
   // ❌ WRONG - overlay might not exist
   onMenuOpened(): void {
     const pane = document.querySelector('.cdk-overlay-pane');
   }

   // ✅ CORRECT - wait for render frame
   onMenuOpened(): void {
     requestAnimationFrame(() => {
       const pane = document.querySelector('.cdk-overlay-pane');
     });
   }
   ```

## Troubleshooting

### Issue 1: Menu shows z-index 1000 instead of 1300

**Symptom**: Debug script shows `inline: '(none)', computed: '1000'`

**Possible Causes**:
1. `onMenuOpened()` not being called
2. `applyLayerZIndex()` selecting wrong element
3. Code running before DOM is ready

**Solutions**:
1. Add console log to verify method is called
2. Use `data-*` attributes to uniquely identify elements
3. Use `requestAnimationFrame` for timing

### Issue 2: Clicking window doesn't bring it to front

**Symptom**: Window stays behind other windows after clicking

**Check**:
```typescript
// Verify @HostListener is registered
@HostListener('click')
bringToFront(): void {
  console.log('Window clicked');  // Should see this
  this.zIndexService.bringToFront(this.elementRef.nativeElement);
}

// Verify elementRef is correct
console.log('Element:', this.elementRef.nativeElement);
```

### Issue 3: Multiple windows stuck at TEMP_TOP

**Symptom**: More than one window has z-index 1200

**Cause**: Auto-restore mechanism not working

**Fix**: Verify ZIndexService is tracking elements correctly:
```typescript
// In browser console
const service = ng.getInjector(document.querySelector('app-root')).get(ZIndexService);
console.log('Elements at top:', service.elementsAtTop.size);  // Should be 1
```

### Issue 4: Component state not updating

**Symptom**: `currentZIndex` variable doesn't match DOM

**Fix**: Subscribe to z-index changes:
```typescript
private subscribeToZIndexChanges(): void {
  this.zIndexService.getZIndexChanged().pipe(
    takeUntil(this.destroy$)
  ).subscribe(() => {
    const isAtTop = this.zIndexService.isAtTop(this.elementRef.nativeElement);
    if (!isAtTop) {
      this.currentZIndex = Z_INDEX_LAYERS.AI_CHAT;
      this.cdr.markForCheck();  // Trigger Angular change detection
    }
  });
}
```

## Testing

### Manual Testing Checklist

- [ ] AI Chat window starts at z-index 1001
- [ ] Web Console starts at z-index 1002
- [ ] Clicking AI Chat brings it to 1200
- [ ] Clicking Web Console brings it to 1200, restores AI Chat to 1001
- [ ] Session menu opens at z-index 1300
- [ ] Confirm dialog opens at z-index 1400
- [ ] All elements properly restore on cleanup
- [ ] No memory leaks (observables cleaned up)

### Debug Scripts

Two debug scripts are available in the project root:

1. **debug-zindex.js**: Comprehensive z-index monitoring
2. **debug-menu-zindex.js**: Focused on session menu and confirm dialog

**Usage**:
```javascript
// Copy script content and paste in browser console
checkZIndex();        // Check all z-index values
checkMenuZIndex();    // Check menu/dialog z-index values
```

## Migration Guide

### For Existing Components

If you have components using the old z-index system:

1. **Remove counter-based calls**:
   ```typescript
   // Before
   this.currentZIndex = this.zIndexService.getNextZIndex();

   // After
   this.zIndexService.bringToFront(this.elementRef.nativeElement);
   this.currentZIndex = Z_INDEX_LAYERS.TEMP_TOP;
   ```

2. **Add ngOnInit initialization**:
   ```typescript
   ngOnInit() {
     this.elementRef.nativeElement.style.zIndex = String(Z_INDEX_LAYERS.MY_LAYER);
   }
   ```

3. **Add cleanup**:
   ```typescript
   ngOnDestroy(): void {
     this.destroy$.next();
     this.destroy$.complete();
   }
   ```

## Performance Considerations

### Memory Management

- ✅ `Map` and `Set` for O(1) lookups
- ✅ Cleanup on element restoration
- ✅ Observable cleanup with `takeUntil`

### DOM Manipulation

- ✅ Minimal reflows (direct style updates)
- ✅ `requestAnimationFrame` for overlays
- ✅ Single overlay pane query per event

## Future Improvements

1. **Add TypeScript strict mode for layer keys**
   ```typescript
   type ZIndexLayer = keyof typeof Z_INDEX_LAYERS;
   ```

2. **Add z-index visualization tool**
   - Show all layers and their current elements
   - Highlight conflicts

3. **Add automated tests**
   - Unit tests for ZIndexService
   - Integration tests for window switching

4. **Add config file for easy layer management**
   ```typescript
   // z-index.config.ts
   export const Z_INDEX_CONFIG = {
     layers: { ... },
     enableDebug: false
   };
   ```

## Related Documents

- [AI Chat Delete Fix](./ai-chat-delete-fix.md) - Previous z-index issues
- [Z-Index Best Practices](https://www.sitepoint.com/z-index-css-property-explained/)
- [CSS Stacking Context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index)

## Summary

The refactored z-index management system provides:
- ✅ Predictable fixed layers
- ✅ Automatic element restoration
- ✅ No infinite growth
- ✅ Centralized configuration
- ✅ Type-safe API
- ✅ Easy to extend

---

**Metadata**:
- **Last Updated**: 2026-03-08
- **Author**: Claude Code
- **Type**: Refactor
- **Severity**: High (affects multiple components)
- **Affected Files**:
  - `src/app/services/z-index.service.ts`
  - `src/app/components/project-map/ai-chat/ai-chat.component.ts`
  - `src/app/components/project-map/console-wrapper/console-wrapper.component.ts`
  - `src/app/components/project-map/ai-chat/chat-session-list.component.ts`
  - `src/styles.scss`
  - `src/app/components/project-map/ai-chat/ai-chat.component.scss`

**Keywords**: Angular, z-index, layer management, Material overlay, window management, TypeScript, refactoring
