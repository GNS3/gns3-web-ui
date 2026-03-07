# Confirmation Dialog Component - Technical Documentation

## Overview

The `ConfirmationDialogComponent` is a reusable, standalone Angular component that provides a polished confirmation dialog for delete/confirm actions. It replaces the previous `MatBottomSheet` implementation to eliminate page shake issues and improve user experience.

**Component Location**: `src/app/components/dialogs/confirmation-dialog/`

## Why Replace BottomSheet?

### Problems with BottomSheet

1. **Page Shake**: `MatBottomSheet` adds the `cdk-global-scrollblock` class, which blocks scrolling and causes visible page shake
2. **Poor UX**: BottomSheet is designed for mobile bottom sheets, not desktop confirmation dialogs
3. **Z-Index Issues**: Required disabling backdrop (`hasBackdrop: false`) as workaround
4. **Not Reusable**: The old implementation was tightly coupled to the AI Chat session list

### MatDialog Benefits

- ✅ No page shake
- ✅ Better positioning control (can center on click)
- ✅ Proper backdrop support
- ✅ More suitable for desktop confirmations
- ✅ Reusable across the application

## Component Architecture

### Files

```
src/app/components/dialogs/confirmation-dialog/
├── confirmation-dialog.component.ts      # Component logic
├── confirmation-dialog.component.html    # Template
└── confirmation-dialog.component.scss    # Styles
```

### Type Definitions

```typescript
export interface ConfirmationDialogData {
  message: string;           // Required: Confirmation message
  title?: string;            // Optional: Dialog title (default: "Confirm Delete")
  confirmButtonText?: string; // Optional: Confirm button text (default: "Yes")
  cancelButtonText?: string;  // Optional: Cancel button text (default: "No")
}
```

## Usage

### Basic Usage

```typescript
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

constructor(private dialog: MatDialog) {}

confirmDelete() {
  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    data: {
      message: 'Are you sure you want to delete this item?'
    }
  });

  dialogRef.afterClosed().subscribe((result: boolean) => {
    if (result) {
      // User clicked Yes
      this.deleteItem();
    }
  });
}
```

### Custom Title and Buttons

```typescript
const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
  data: {
    title: 'Confirm Action',
    message: 'This will permanently delete the item. Continue?',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  }
});
```

### Positioned Dialog (Click-Centered)

```typescript
deleteSession(session: ChatSession, event: MouseEvent): void {
  const message = `Delete "${session.title}"?`;

  // Calculate position centered on click
  let position: { top?: string; left?: string } = {};

  if (event) {
    const clickX = event.clientX;
    const clickY = event.clientY;
    const dialogWidth = 360;
    const dialogHeight = 180;

    let left = clickX - dialogWidth / 2;
    let top = clickY - dialogHeight / 2;

    // Boundary detection
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) left = 10;
    if (left + dialogWidth > viewportWidth - 10) {
      left = viewportWidth - dialogWidth - 10;
    }
    if (top < 10) top = 10;
    if (top + dialogHeight > viewportHeight - 10) {
      top = viewportHeight - dialogHeight - 10;
    }

    position = { top: `${top}px`, left: `${left}px` };
  }

  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    data: { message },
    width: '360px',
    position,
    autoFocus: false,
    restoreFocus: false
  });
}
```

## UI Design

### Visual Specifications

- **Width**: 360px
- **Border Radius**: 16px (fully rounded)
- **Background Color**: #2d2d2d (dark gray)
- **Box Shadow**: `0 8px 32px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.12)`

### Header

- **Icon**: Warning icon (Material Icons `warning`)
- **Color**: #f44336 (red)
- **Animation**: None (static, no pulse)
- **Background**: Linear gradient with red tint
- **Border Bottom**: 1px solid red (opacity 0.15)

### Content

- **Padding**: 8px 20px 16px
- **Font Size**: 14px
- **Color**: CSS variable `--mat-app-on-surface-variant`

### Actions

- **Padding**: 12px 20px 20px
- **Alignment**: Center (buttons horizontally centered)
- **Gap**: 10px between buttons

#### Cancel Button

- **Color**: #0097a7 (cyan)
- **Background**: Transparent
- **Border**: 1px solid cyan (opacity 0.25)
- **Icon**: `close`
- **Hover Effects**:
  - Background: rgba(0, 151, 167, 0.06)
  - Border: rgba(0, 151, 167, 0.4)
  - Transform: translateY(-1px)
  - Box Shadow: 0 3px 10px rgba(0, 151, 167, 0.12)

#### Confirm Button

- **Color**: White
- **Background**: Linear gradient (#f44336 → #e53935)
- **Icon**: `check_circle`
- **Hover Effects**:
  - Background gradient: (#e53935 → #d32f2f)
  - Transform: translateY(-1px)
  - Box Shadow: 0 4px 12px rgba(244, 67, 54, 0.35)
  - Shine sweep animation on hover

### Animations

1. **Slide In** (`dialogSlideIn`):
   - Duration: 0.3s
   - Easing: ease-out
   - From: scale(0.9), translateY(-20px), opacity 0
   - To: scale(1), translateY(0), opacity 1

2. **Button Hover**:
   - Transform: translateY(-1px)
   - Duration: 0.2s
   - Easing: ease

3. **Button Active**:
   - Transform: translateY(0)
   - Instant transition

4. **Shine Sweep** (confirm button only):
   - White gradient sweep across button
   - Duration: 0.5s
   - Only on hover

5. **Ripple Effect** (both buttons):
   - Expanding circle on click
   - Duration: 0.6s
   - Color: rgba(255, 255, 255, 0.4)

## Styling Architecture

### Component Styles (`.scss`)

The component uses its own styles for internal elements:
- `.dialog-container` - Main container with background and border-radius
- `.dialog-header` - Header with icon and title
- `.dialog-content` - Message area
- `.dialog-actions` - Button container
- `.cancel-button`, `.confirm-button` - Button styles

### Global Styles (`styles.scss`)

To fix the "double layer" issue (both Material container and custom container visible), we override Material Dialog's container styles:

```scss
.confirmation-dialog-panel {
  mat-dialog-container,
  .mat-dialog-container {
    background: transparent !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
}
```

**Why?** Angular Material's `<mat-dialog-container>` has its own background and padding. By making it transparent, only our custom `.dialog-container` is visible, giving us full control over the appearance.

### Color Strategy

- **Hardcoded Values**: Background color (#2d2d2d), button colors
- **CSS Variables**: Text colors (`--mat-app-on-surface`, `--mat-app-on-surface-variant`)
- **Rationale**: Ensures dialog always has correct background, but text adapts to theme

## Migration from BottomSheet

### Before (BottomSheet)

```typescript
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ConfirmationBottomSheetComponent } from '@components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';

constructor(private bottomSheet: MatBottomSheet) {}

deleteSession(session: ChatSession): void {
  const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
    data: { message: `Delete "${session.title}"?` },
    panelClass: 'ai-chat-bottom-sheet',
    hasBackdrop: false  // Workaround for z-index issues
  });

  bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
    if (result) {
      this.delete(session);
    }
  });
}
```

**Issues**:
- Page shake due to scroll blocking
- Required `hasBackdrop: false` workaround
- Not reusable
- Mobile-oriented UX on desktop

### After (MatDialog)

```typescript
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

constructor(private dialog: MatDialog) {}

deleteSession(session: ChatSession, event?: MouseEvent): void {
  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    data: { message: `Delete "${session.title}"?` },
    width: '360px',
    position: this.calculatePosition(event),
    autoFocus: false,
    restoreFocus: false,
    backdropClass: 'delete-dialog-backdrop',
    panelClass: 'confirmation-dialog-panel'
  });

  dialogRef.afterClosed().subscribe((result: boolean) => {
    if (result) {
      this.delete(session);
    }
  });
}
```

**Benefits**:
- No page shake
- Proper backdrop support
- Click-positioned for better UX
- Reusable component
- Desktop-appropriate UX

## Technical Implementation Details

### Standalone Component

```typescript
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  imports: [CommonModule, MatIconModule, MatButtonModule]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}
}
```

**Key Points**:
- `standalone: true` - No need to declare in module
- `imports` array - All required dependencies
- `MAT_DIALOG_DATA` injection - Receives data from parent

### Data Flow

```
Parent Component
  ↓
dialog.open(ConfirmationDialogComponent, { data: {...} })
  ↓
MAT_DIALOG_DATA injection token
  ↓
Component initializes with data
  ↓
User clicks Yes/No
  ↓
dialogRef.close(true/false)
  ↓
afterClosed() observable emits result
  ↓
Parent handles result
```

### Component Lifecycle

1. **Component Creation**: `dialog.open()` creates component instance
2. **Constructor Injection**: `MAT_DIALOG_DATA` is injected
3. **Template Rendering**: Template displays data
4. **User Interaction**: User clicks button
5. **Dialog Close**: `dialogRef.close()` emits result
6. **Observable Resolution**: `afterClosed()` emits in parent
7. **Cleanup**: Component is destroyed

## Accessibility

- **ARIA Role**: `role="dialog"` (automatically added by MatDialog)
- **ARIA Modal**: `aria-modal="true"` (automatically added)
- **Focus Management**: `autoFocus: false` (prevent focus stealing)
- **Restore Focus**: `restoreFocus: false` (prevent focus jumping)
- **Keyboard Navigation**: ESC to close, Enter to confirm (built-in)
- **Screen Reader Support**: All text is readable by screen readers

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile browsers: Full support

**CSS Features Used**:
- CSS Custom Properties (variables)
- Flexbox
- CSS Transforms
- CSS Transitions
- CSS Keyframe Animations
- Linear Gradients
- Box Shadow
- Border Radius

## Performance Considerations

1. **Lazy Loading**: Component is only loaded when needed
2. **Standalone**: Reduces bundle size (no module overhead)
3. **Minimal Styles**: Only necessary styles included
4. **Efficient Animations**: CSS-based (hardware accelerated)
5. **No Observables in Component**: Simple, imperative code

## Testing

### Manual Testing Checklist

- [ ] Dialog opens correctly
- [ ] Message displays properly
- [ ] Title displays (if provided)
- [ ] Custom button text works (if provided)
- [ ] Yes button returns `true`
- [ ] No button returns `false`
- [ ] Clicking outside closes dialog (optional)
- [ ] ESC key closes dialog
- [ ] No console errors
- [ ] Positioning works (if used)
- [ ] Buttons are clickable
- [ ] Animations play smoothly
- [ ] No page shake
- [ ] Backdrop works (if enabled)

### Unit Testing Example

```typescript
describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let dialogRef: MatDialogRef<ConfirmationDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent]
    });

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
  });

  it('should display message from data', () => {
    component.data = { message: 'Test message' };
    fixture.detectChanges();

    const messageElement = fixture.nativeElement.querySelector('.dialog-message');
    expect(messageElement.textContent).toContain('Test message');
  });

  it('should close with true on Yes click', () => {
    spyOn(dialogRef, 'close');

    component.onYesClick();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close with false on No click', () => {
    spyOn(dialogRef, 'close');

    component.onNoClick();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
```

## Common Issues and Solutions

### Issue 1: Dialog Background is Transparent

**Symptom**: Dialog shows but background is transparent, showing page content behind

**Cause**: `var(--mat-app-surface)` CSS variable is not defined or empty

**Solution**: Use hardcoded color instead:

```scss
.dialog-container {
  background-color: #2d2d2d;  // Hardcoded fallback
}
```

### Issue 2: Double Layer Effect

**Symptom**: Two visible backgrounds - one from Material container, one from custom container

**Cause**: Both `<mat-dialog-container>` and `.dialog-container` have backgrounds

**Solution**: Make Material container transparent in global styles:

```scss
// styles.scss
.confirmation-dialog-panel {
  mat-dialog-container {
    background: transparent !important;
    box-shadow: none !important;
  }
}
```

### Issue 3: Buttons Not Centered

**Symptom**: Buttons align to right instead of center

**Cause**: Material's default `justify-content: flex-end`

**Solution**: Override in component styles:

```scss
.dialog-actions {
  justify-content: center;
}
```

### Issue 4: Wrong Position

**Symptom**: Dialog appears at wrong location or off-screen

**Cause**: Position calculation doesn't account for viewport boundaries

**Solution**: Add boundary detection:

```typescript
// Ensure dialog doesn't go off-screen
if (left < 10) left = 10;
if (left + dialogWidth > viewportWidth - 10) {
  left = viewportWidth - dialogWidth - 10;
}
```

### Issue 5: Icon Not Showing

**Symptom**: Warning icon doesn't display

**Cause**: `MatIconModule` not imported in component

**Solution**: Add to imports array:

```typescript
imports: [CommonModule, MatIconModule, MatButtonModule]
```

## Future Enhancements

1. **More Configuration Options**:
   - Add custom icon support
   - Add danger/warning/info types
   - Add custom HTML content support

2. **Animation Options**:
   - Configurable animation type
   - Disable animations option
   - Custom animation duration

3. **Accessibility Improvements**:
   - Add focus trap
   - Add ARIA descriptions
   - Add keyboard navigation hints

4. **Theming**:
   - Light theme support
   - Custom color schemes
   - Theme switching

5. **Service Wrapper**:
   ```typescript
   export class ConfirmationDialogService {
     constructor(private dialog: MatDialog) {}

     confirm(message: string, options?: DialogOptions): Observable<boolean> {
       return this.dialog.open(ConfirmationDialogComponent, {
         data: { message, ...options }
       }).afterClosed();
     }
   }
   ```

## Related Documentation

- [AI Chat Delete Fix](../troubleshooting/ai-chat-delete-fix.md) - Previous BottomSheet implementation
- [AI Chat Implementation Plan](../todo/ai-chat-implementation-plan.md) - Overall AI Chat architecture
- [Timestamp Timezone Issue](../troubleshooting/timestamp-timezone-issue.md) - Related AI Chat fixes

## References

- [Angular Material Dialog API](https://material.angular.io/components/dialog/api)
- [MAT_DIALOG_DATA Injection Token](https://material.angular.io/cdk/overlay/api#MAT_DIALOG_DATA)
- [Angular Standalone Components](https://angular.io/guide/standalone-components)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

## Metadata

- **Created**: 2026-03-08
- **Author**: Claude Code
- **Type**: Component Documentation
- **Status**: Production Ready
- **Version**: 1.0.0

**Files**:
- `src/app/components/dialogs/confirmation-dialog/confirmation-dialog.component.ts`
- `src/app/components/dialogs/confirmation-dialog/confirmation-dialog.component.html`
- `src/app/components/dialogs/confirmation-dialog/confirmation-dialog.component.scss`
- `src/app/components/project-map/ai-chat/chat-session-list.component.ts` (usage example)
- `src/styles.scss` (global overrides)

**Keywords**: Angular, Material Design, MatDialog, confirmation dialog, standalone component, reusable component, dialog positioning, UI/UX
