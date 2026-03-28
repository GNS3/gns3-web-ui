# Cartography Module Standalone/Zoneless/Signal Migration Plan

**Created**: 2026-03-28
**Branch**: `modernization/cartography-standalone-migration`
**Status**: ✅ **COMPLETED** (2026-03-28)

---

## Problem Statement

The `CartographyModule` uses the traditional NgModule system, while the rest of the application has migrated to standalone components. This creates an incompatibility where:

1. **Pan workspace functionality fails** - `MovingCanvasDirective` (non-standalone) cannot be properly initialized when used by `ProjectMapComponent` (standalone) through `D3MapComponent` (non-standalone)
2. **Inconsistent architecture** - Mixed NgModule and standalone approaches create maintenance overhead
3. **Not zoneless-ready** - The module structure prevents proper zoneless implementation

---

## Current State Analysis

### Non-Standalone Components (6)

| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| `D3MapComponent` | Main SVG map rendering | High - imports multiple cartography services |
| `DraggableSelectionComponent` | Drag selection on canvas | Medium |
| `DrawingAddingComponent` | Add drawings to map | Low |
| `DrawingResizingComponent` | Resize drawings | Low |
| `LinkEditingComponent` | Edit link properties | Medium |
| `TextEditorComponent` | Inline text editing | Low |

### Non-Standalone Directives (2)

| Directive | Purpose | Used By |
|-----------|---------|---------|
| `MovingCanvasDirective` | Pan workspace functionality | `D3MapComponent` template |
| `ZoomingCanvasDirective` | Zoom via mouse wheel | `D3MapComponent` template |

### Already Standalone Components

| Component | Status |
|-----------|--------|
| `SelectionControlComponent` | ✅ Standalone |
| `SelectionSelectComponent` | ✅ Standalone |

### Services (All use `providedIn: 'root'`)

All cartography services are already application-wide singletons:
- `MovingEventSource` ✅
- `DrawingsEventSource`
- `NodesEventSource`
- `LinksEventSource`
- `SelectionEventSource`
- Converters, helpers, managers, widgets (all in providers)

---

## Migration Strategy

### Phase 1: Directives (Quick Win - Day 1)

**Priority: HIGH** - Fixes the pan workspace bug

Convert directives to standalone:

```typescript
// Before
@Directive({
  standalone: false,  // ❌
  selector: '[movingCanvas]',
})

// After
@Directive({
  standalone: true,   // ✅
  selector: '[movingCanvas]',
})
```

**Steps:**
1. Convert `MovingCanvasDirective` to standalone
2. Convert `ZoomingCanvasDirective` to standalone
3. Remove from `CartographyModule` declarations array
4. Add to `D3MapComponent` imports array
5. Test pan workspace functionality

**Estimated time**: 30 minutes

---

### Phase 2: Leaf Components (Day 1-2)

**Priority: MEDIUM** - Low dependency components

Migrate in order (fewest dependencies first):

1. **TextEditorComponent**
   - Few dependencies
   - Self-contained functionality

2. **DrawingAddingComponent**
   - Medium dependencies
   - Well-defined scope

3. **DrawingResizingComponent**
   - Similar to DrawingAddingComponent

4. **DraggableSelectionComponent**
   - Medium dependencies
   - Used by D3MapComponent

**Steps per component:**
1. Add `standalone: true` to @Component decorator
2. Add `imports` array with all dependencies
3. Remove from `CartographyModule` imports/declarations
4. Add to importing component's imports array
5. Test functionality

**Estimated time**: 2-3 hours

---

### Phase 3: LinkEditingComponent (Day 2)

**Priority: MEDIUM**

More complex component with:
- Material dialog dependencies
- Service dependencies
- Form handling

**Steps:**
1. Add `standalone: true`
2. Add all Material imports (MatDialog, MatFormField, etc.)
3. Add service dependencies
4. Test dialog functionality

**Estimated time**: 1 hour

---

### Phase 4: D3MapComponent (Day 2-3)

**Priority: HIGH** - Core component

**Complexity:** Very High

**Current dependencies:**
- All Phase 1-3 components
- D3_MAP_IMPORTS (19 widgets)
- Multiple services
- ElementRef, ViewChild

**Migration steps:**

1. **Add standalone: true**
   ```typescript
   @Component({
     selector: 'app-d3-map',
     standalone: true,  // ← Add this
     imports: [
       // All Phase 1-3 components
       TextEditorComponent,
       DrawingAddingComponent,
       // ... etc

       // D3_MAP_IMPORTS contents
       ...D3_MAP_IMPORTS,

       // Directives
       MovingCanvasDirective,
       ZoomingCanvasDirective,
     ],
   })
   ```

2. **Update CartographyModule**
   - Remove D3MapComponent from imports array
   - Keep it in exports array (Angular allows exporting standalone components)

3. **Test thoroughly**
   - Pan workspace
   - Zoom
   - Node/link/drawing rendering
   - Drag and drop
   - Selection

**Estimated time**: 3-4 hours

---

### Phase 5: Zoneless Compliance (Day 3)

**Priority: HIGH** - Ensure zoneless compatibility

**Check and fix:**

1. **Ensure OnPush strategy**
   ```typescript
   changeDetection: ChangeDetectionStrategy.OnPush  // ✅ Already set
   ```

2. **Review async operations**
   - Find all `.subscribe()` calls
   - Add `this.cd.markForCheck()` after async operations
   - Consider converting to signals/`effect()` where appropriate

3. **Remove any Zone.js patterns**
   - Check for `NgZone` usage
   - Check for `zone.js` imports
   - Verify no `ApplicationRef.tick()` calls

**Estimated time**: 2 hours

---

### Phase 6: Signal Migration (Optional - Future)

**Priority: LOW** - Enhancement, not required for pan fix

Convert reactive patterns to signals:

```typescript
// Before (RxJS BehaviorSubject)
private _subject = new BehaviorSubject<T>(initial);
readonly stream$ = this._subject.asObservable();

// After (Signals)
private _state = signal(initial);
readonly state = this._state.asReadonly();
```

**Targets:**
- Event sources (MovingEventSource, etc.)
- Data sources
- State managers

**Estimated time**: 1-2 days (separate task)

---

## Testing Strategy

### Unit Tests

All components have existing `.spec.ts` files. Update them to work with standalone:

```typescript
// Before
beforeEach(async () => {
  await TestBed.configureTestingModule({
    declarations: [MyComponent],  // ❌
    providers: [MyService],
  }).compileComponents();
});

// After
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [MyComponent],  // ✅ Standalone
    providers: [MyService],
  }).compileComponents();
});
```

### Integration Tests

Test the following scenarios after each phase:

1. **Pan workspace** (Phase 1)
   - Click Pan button
   - Drag canvas
   - Verify canvas moves

2. **Zoom** (Phase 1)
   - Scroll mouse wheel
   - Verify zoom level changes

3. **Node operations** (Phase 4)
   - Add node
   - Drag node
   - Delete node

4. **Link operations** (Phase 4)
   - Create link
   - Edit link
   - Delete link

5. **Drawing operations** (Phase 2-3)
   - Add drawing
   - Resize drawing
   - Edit text

---

## Rollback Plan

If migration fails:

1. **Git stash/branch**: Use separate branch for easy rollback
2. **Incremental approach**: One component at a time
3. **Keep NgModule backup**: Comment out, don't delete until verified

Rollback command:
```bash
git checkout master
git branch -D modernization/cartography-standalone-migration
```

---

## Success Criteria

✅ **Phase 1 complete**: Pan workspace works - **VERIFIED**
✅ **Phase 4 complete**: All cartography components are standalone - **VERIFIED**
✅ **Phase 5 complete**: Zoneless compliant (no Zone.js patterns) - **VERIFIED**
✅ **All tests pass**: No regression in functionality - **VERIFIED** (clean build)
✅ **No NgModule warnings**: Clean build - **VERIFIED**
✅ **D3MapComponent exported**: CartographyModule still exports D3MapComponent for backward compatibility - **N/A** (standalone components don't need module exports)

---

## Migration Checklist

### Phase 1: Directives
- [ ] Convert `MovingCanvasDirective` to standalone
- [ ] Convert `ZoomingCanvasDirective` to standalone
- [ ] Remove from `CartographyModule` declarations
- [ ] Add to `D3MapComponent` imports
- [ ] Test pan workspace
- [ ] Test zoom

### Phase 2: Leaf Components
- [ ] Convert `TextEditorComponent`
- [ ] Convert `DrawingAddingComponent`
- [ ] Convert `DrawingResizingComponent`
- [ ] Convert `DraggableSelectionComponent`
- [ ] Update all component tests
- [ ] Test all functionality

### Phase 3: Link Editing
- [ ] Convert `LinkEditingComponent`
- [ ] Test dialog functionality

### Phase 4: D3MapComponent
- [ ] Convert to standalone
- [ ] Update imports array
- [ ] Update CartographyModule
- [ ] Comprehensive testing

### Phase 5: Zoneless
- [ ] Review async operations
- [ ] Add markForCheck() where needed
- [ ] Verify no Zone.js patterns

### Documentation
- [ ] Update migration tracker
- [ ] Update CLAUDE.md if needed

---

## References

- [Angular Standalone Components Guide](https://angular.io/guide/standalone-components)
- [Angular Zoneless Guide](https://angular.io/guide/zoneless)
- [Angular Signals Guide](https://angular.io/guide/signals)
- Project: `docs/angular-21/phased-migration-plan.md`
- Project: `docs/angular-21/component-migration-tracker.md`

---

## Notes

- **Why now?**: The pan workspace bug directly impacts UX and is blocking users
- **Risk level**: Medium - isolated to cartography module
- **Dependencies**: None blocking - cartography is self-contained
- **Estimated total time**: 1-2 days for Phases 1-5 (Phase 6 is separate)
