# ESLint Migration Report - Code Quality Issues

**Generated:** 2026-03-30
**Total Issues:** 69 problems (60 errors, 9 warnings)
**Files Affected:** 49 TypeScript files + HTML templates

---

## Executive Summary

| Error Type | Count | Severity | Priority |
|------------|-------|----------|----------|
| Empty lifecycle methods | 33 | Error | Medium |
| Missing lifecycle interfaces | 9 | Warning | Low |
| Template equality checks (== vs ===) | 9 | Error | High |
| Parsing errors (files not in tsconfig) | 8 | Error | High |
| Template: ngIf instead of @if | 4 | Error | Low |
| Output named with "on" prefix | 3 | Error | Medium |
| Directive selector prefix | 2 | Error | Low |
| Component selector prefix | 1 | Error | Low |

---

## 1. Parsing Errors (HIGH PRIORITY)

**Root Cause:** Files not included in `tsconfig.app.json`

| File | Issue | Fix |
|------|-------|-----|
| `src/app/cartography/tool.ts` | Not in tsconfig | Add to tsconfig or exclude from lint |
| `src/app/cartography/widgets/drawings.backup.ts` | Backup file | Exclude from lint |
| `src/app/components/user-management/edit-user-dialog/edit-user-dialog.component.ts` | Not in tsconfig | Add to tsconfig |
| `src/app/converters/converter.ts` | Not in tsconfig | Add to tsconfig or exclude |
| `src/app/directives/LazyImg.directive.ts` | Not in tsconfig | Add to tsconfig |
| `src/app/models/LocalStorage.ts` | Not in tsconfig | Add to tsconfig |
| `src/app/models/software.ts` | Not in tsconfig | Add to tsconfig |
| `src/app/services/controller-version.service.ts` | Not in tsconfig | Add to tsconfig |

**Recommended Fix:**
```json
// .eslintrc.json - Add to ignorePatterns
"ignorePatterns": [
  "src/app/cartography/tool.ts",
  "src/app/cartography/widgets/drawings.backup.ts",
  "src/app/converters/converter.ts",
  "src/app/models/software.ts",
  "src/app/services/testing.ts"
]
```

---

## 2. Empty Lifecycle Methods (33 occurrences)

**Rule:** `@angular-eslint/no-empty-lifecycle-method`
**Severity:** Error
**Impact:** Code smell, may indicate incomplete implementation

### 2.1 Components with Empty Lifecycle Methods

| Component | Empty Methods | Line | Suggested Action |
|-----------|---------------|------|------------------|
| `progress-dialog.component.ts` | `ngOnInit`, `ngOnDestroy` | 27, 33 | Remove or implement |
| `uploading-processbar.component.ts` | `ngOnDestroy` | 16 | Remove or implement |
| `acl-management.component.ts` | `ngOnDestroy` | 32 | Remove or implement |
| `autocomplete.component.ts` | `ngOnInit` | 27 | Remove or implement |
| `delete-ace-dialog.component.ts` | `ngOnInit`, `ngOnDestroy` | 24, 30 | Remove or implement |
| `delete-group-dialog.component.ts` | `ngOnInit` | 35 | Remove or implement |
| `bring-to-front-action.component.ts` | `ngOnInit` | 21 | Remove or implement |
| `console-device-action.component.ts` | `ngOnInit` | 22 | Remove or implement |
| `delete-action.component.ts` | `ngOnInit` | 27 | Remove or implement |
| `edit-link-style-action.component.ts` | `ngOnInit` | 29 | Remove or implement |
| `edit-text-action.component.ts` | `ngOnInit` | 42 | Remove or implement |
| `http-console-action.component.ts` | `ngOnDestroy` | 23 | Remove or implement |
| `isolate-node-action.component.ts` | `ngOnInit` | 24 | Remove or implement |
| `start-node-action.component.ts` | `ngOnInit` | 29 | Remove or implement |
| `stop-node-action.component.ts` | `ngOnInit` | 33 | Remove or implement |
| `suspend-node-action.component.ts` | `ngOnInit` | 18 | Remove or implement |
| `unisolate-node-action.component.ts` | `ngOnInit` | 27 | Remove or implement |
| `appliance-info-dialog.component.ts` | `ngOnInit` | 30 | Remove or implement |
| `delete-resource-confirmation-dialog.component.ts` | `ngOnInit` | 50 | Remove or implement |
| `delete-resource-pool.component.ts` | `ngOnInit` | 49 | Remove or implement |
| `delete-role-dialog.component.ts` | `ngOnInit` | 29 | Remove or implement |
| `confirmation-delete-all-projects.component.ts` | `ngOnInit` | 27 | Remove or implement |
| `change-user-password.component.ts` | `ngOnDestroy` | 32 | Remove or implement |
| `chat-input-area.component.ts` | `ngOnDestroy` | 24 | Remove or implement |
| `tool-call-display.component.ts` | `ngOnDestroy` | 22 | Remove or implement |
| `align-horizontally.component.ts` | `ngOnInit` | 39 | Remove or implement |
| `align_vertically.component.ts` | `ngOnInit` | 35 | Remove or implement |

**Recommended Fix:**
```typescript
// Option A: Remove empty lifecycle hook
export class MyComponent {
  // Remove ngOnInit/ngOnDestroy if empty
}

// Option B: Implement interface
export class MyComponent implements OnInit {
  ngOnInit(): void {
    // TODO: Implement
  }
}
```

---

## 3. Missing Lifecycle Interfaces (9 warnings)

**Rule:** `@angular-eslint/use-lifecycle-interface`
**Severity:** Warning
**Impact:** Code style, not functional

| Component | Missing Interface | Method |
|-----------|------------------|--------|
| `progress-dialog.component.ts` | `OnDestroy` | `ngOnDestroy` |
| `delete-ace-dialog.component.ts` | `OnChanges` | `ngOnChanges` |
| `autocomplete.component.ts` | `OnInit` | `ngOnInit` |
| `delete-ace-dialog.component.ts` | `OnDestroy` | `ngOnDestroy` |
| `group-management.component.ts` | `AfterViewInit` | `ngAfterViewInit` |
| `appliance-info-dialog.component.ts` | `AfterViewInit` | `ngAfterViewInit` |
| `resource-pools-management.component.ts` | `AfterViewInit` | `ngAfterViewInit` |
| `template.component.ts` | `OnInit` | `ngOnInit` |
| `edit-user-dialog.component.ts` | `AfterViewInit` | `ngAfterViewInit` |

**Recommended Fix:**
```typescript
// Add interface implementation
export class ProgressDialogComponent implements OnDestroy {
  ngOnDestroy(): void { /* ... */ }
}
```

---

## 4. Template Equality Checks (9 errors)

**Rule:** `@angular-eslint/template/eqeqeq`
**Severity:** Error
**Impact:** Potential bugs - type coercion issues

### 4.1 Files with == or != in Templates

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `delete-confirmation-dialog.component.html` | 28 | `!=` should be `!==` | Update template |
| `install-software.component.html` | 66, 70, 78, 99 | `==` should be `===` | Update template |
| `delete-group-dialog.component.html` | 25 | `!=` should be `!==` | Update template |
| `node-select-interface.component.html` | 65 (3×) | `!=` should be `!==` | Update template |
| `chat-input-area.component.html` | 65 | `!=` should be `!==` | Update template |
| `tool-call-display.component.html` | 65, 73 | `!=` should be `!==` | Update template |

**Example Fix:**
```html
<!-- Before -->
<div *ngIf="user.id != null">

<!-- After -->
<div *ngIf="user.id !== null">
```

---

## 5. Template: ngIf vs @if (4 errors)

**Rule:** `@angular-eslint/template/prefer-control-flow`
**Severity:** Error
**Impact:** Not using Angular 21+ built-in control flow

| File | Line | Current | Recommended |
|------|------|---------|--------------|
| `project-map-menu.component.html` | 53 | `*ngIf` | `@if` |
| `drawing.component.html` | 19 | `*ngIf` | `@if` |
| `drawing.component.html` | 24 | `*ngIf` | `@if` |
| `drawing.component.html` | 25 | `*ngIf` | `@if` |

**Example Migration:**
```html
<!-- Before -->
<div *ngIf="isVisible">Content</div>

<!-- After (Angular 17+) -->
@if (isVisible) {
  <div>Content</div>
}
```

---

## 6. Output Naming Convention (3 errors)

**Rule:** `@angular-eslint/no-output-on-prefix`
**Severity:** Error
**Impact:** Naming convention violation

| Component | Output Name | Line | Issue |
|-----------|-------------|------|-------|
| `moving-canvas.directive.ts` | `onMovingCanvas` | 27 | Should not start with "on" |
| `zooming-canvas.directive.ts` | `onZoomingCanvas` | 29 | Should not start with "on" |

**Recommended Fix:**
```typescript
// Before
@Output() onMovingCanvas = new EventEmitter();

// After
@Output() movingCanvasChange = new EventEmitter();
```

---

## 7. Selector Prefix Issues (3 errors)

**Rule:** `@angular-eslint/directive-selector`, `@angular-eslint/component-selector`
**Severity:** Error
**Impact:** Naming convention violation

| File | Selector | Issue | Required Prefix |
|------|----------|-------|-----------------|
| `moving-canvas.directive.ts` | `[movingCanvas]` | Missing "app" prefix | `appMovingCanvas` |
| `zooming-canvas.directive.ts` | `[zoomingCanvas]` | Missing "app" prefix | `appZoomingCanvas` |
| `delete-role-dialog.component.ts` | `app-delete-role-dialog` | Uses hyphens (should be camelCase) | `appDeleteRoleDialog` |

---

## 8. Files by Issue Count

| File | Errors | Warnings | Total |
|------|--------|-----------|-------|
| `delete-ace-dialog.component.ts` | 3 | 2 | 5 |
| `install-software.component.html` | 4 | 0 | 4 |
| `node-select-interface.component.html` | 3 | 0 | 3 |
| `group-management.component.ts` | 1 | 1 | 2 |
| `appliance-info-dialog.component.ts` | 1 | 1 | 2 |
| `resource-pools-management.component.ts` | 1 | 1 | 2 |
| `template.component.ts` | 1 | 1 | 2 |
| `progress-dialog.component.ts` | 2 | 0 | 2 |
| `autocomplete.component.ts` | 2 | 0 | 2 |
| `chat-input-area.component.ts` | 1 | 1 | 2 |
| `tool-call-display.component.ts` | 1 | 1 | 2 |

---

## 9. Module/Component Breakdown

### 9.1 Cartography Module

| Component/File | Issues | Priority |
|----------------|--------|----------|
| `moving-canvas.directive.ts` | 2 (selector, output name) | Medium |
| `zooming-canvas.directive.ts` | 2 (selector, output name) | Medium |
| `tool.ts` | 1 (parsing error) | High |
| `drawings.backup.ts` | 1 (parsing error) | Low (backup file) |

### 9.2 Components Module - Dialogs

| Component | Issues | Type |
|-----------|--------|------|
| `progress-dialog.component.ts` | 2 (empty lifecycle) | Empty methods |
| `delete-confirmation-dialog.component.ts` | 1 (empty lifecycle) + 1 (template !=) | Mixed |
| `delete-group-dialog.component.ts` | 1 (empty lifecycle) + 1 (template !=) | Mixed |
| `delete-role-dialog.component.ts` | 1 (empty lifecycle) + 1 (selector) | Mixed |
| `delete-resource-confirmation-dialog.component.ts` | 1 (empty lifecycle) | Empty method |
| `appliance-info-dialog.component.ts` | 1 (empty lifecycle) + 1 (interface) | Mixed |

### 9.3 Project Map Module - Context Menu Actions

**Pattern:** Most action components have empty `ngOnInit()` for future implementation

| Component | Issue | Common Pattern |
|-----------|-------|----------------|
| `bring-to-front-action.component.ts` | Empty `ngOnInit` | Placeholder for action |
| `console-device-action.component.ts` | Empty `ngOnInit` | Placeholder for action |
| `delete-action.component.ts` | Empty `ngOnInit` | Placeholder for action |
| `start-node-action.component.ts` | Empty `ngOnInit` | Placeholder for action |
| `stop-node-action.component.ts` | Empty `ngOnInit` | Placeholder for action |
| `suspend-node-action.component.ts` | Empty `ngOnInit` | Placeholder for action |
| `isolate-node-action.component.ts` | Empty `ngOnInit` | Placeholder for action |
| `unisolate-node-action.component.ts` | Empty `ngOnInit` | Placeholder for action |

**Total Action Components:** ~30 components with similar empty lifecycle methods

### 9.4 User Management Module

| Component/File | Issues | Priority |
|----------------|--------|----------|
| `edit-user-dialog.component.ts` | Parsing error | High (not in tsconfig) |
| `delete-user-dialog.component.ts` | Empty `ngOnInit` | Low |
| `change-user-password.component.ts` | Empty `ngOnDestroy` | Low |

### 9.5 AI Chat Module (New in Angular 21)

| Component | Issues | Type |
|-----------|--------|------|
| `chat-input-area.component.ts` | Empty `ngOnDestroy` + template `!=` | Mixed |
| `tool-call-display.component.ts` | Empty `ngOnDestroy` + 2× template `!=` | Mixed |

---

## 10. Recommended Migration Strategy

### Phase 1: Quick Wins (1-2 hours)

1. **Fix Parsing Errors** - Add to `.eslintrc.json` ignorePatterns:
   ```json
   "ignorePatterns": [
     "src/app/cartography/tool.ts",
     "src/app/cartography/widgets/drawings.backup.ts",
     "src/app/converters/converter.ts",
     "src/app/models/software.ts",
     "src/app/services/testing.ts",
     "src/app/directives/LazyImg.directive.ts",
     "src/app/models/LocalStorage.ts"
   ]
   ```

2. **Fix Template Equality** - Run ESLint --fix:
   ```bash
   yarn ng lint --fix
   ```

3. **Update CI** - Already done: `yarn ng lint gns3-web-ui` (excludes e2e)

### Phase 2: Medium Effort (4-8 hours)

1. **Fix Output Naming** (2 occurrences):
   - `moving-canvas.directive.ts`: `onMovingCanvas` → `movingCanvasChange`
   - `zooming-canvas.directive.ts`: `onZoomingCanvas` → `zoomingCanvasChange`

2. **Fix Selector Prefixes** (3 occurrences):
   - Add "app" prefix to directives
   - Fix component selector naming

3. **Remove Empty Lifecycle Methods** (33 occurrences):
   - Bulk remove empty `ngOnInit()`, `ngOnDestroy()`
   - Keep lifecycle interfaces only if methods have content

### Phase 3: Low Priority / Technical Debt

1. **Add Lifecycle Interfaces** (9 warnings) - Optional, not critical
2. **Migrate ngIf to @if** (4 occurrences) - Angular 17+ feature, not urgent
3. **Implement Empty Lifecycle Hooks** - If business logic needed

---

## 11. ESLint Configuration Recommendations

### 11.1 Strict Configuration (For New Code)
```json
{
  "extends": [
    "plugin:@angular-eslint/recommended",
    "plugin:@angular-eslint/template/recommended"
  ],
  "rules": {
    // Keep strict for new code
    "@angular-eslint/no-empty-lifecycle-method": "error",
    "@angular-eslint/template/prefer-control-flow": "warn"
  }
}
```

### 11.2 Lenient Configuration (For Legacy Code)
```json
{
  "extends": [
    "plugin:@angular-eslint/recommended",
    "plugin:@angular-eslint/template/recommended"
  ],
  "rules": {
    "@angular-eslint/no-empty-lifecycle-method": "off",
    "@angular-eslint/use-lifecycle-interface": "off",
    "@angular-eslint/template/prefer-control-flow": "off",
    "@angular-eslint/no-output-on-prefix": "warn"
  }
}
```

---

## 12. Automated Fixes

### 12.1 Fix Template Equality
```bash
# ESLint can auto-fix === issues
yarn ng lint --fix
```

### 12.2 Remove Empty Lifecycle Hooks
```bash
# Manual fix required - remove empty methods
# Use regex search: (ngOnInit|ngOnDestroy)\(\)\s*\{\s*\}
```

---

## 13. Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Files with Issues** | 49 | - |
| **Total Problems** | 69 | 100% |
| - Errors | 60 | 87% |
| - Warnings | 9 | 13% |
| **Parsing Errors** | 8 | 12% |
| **Empty Lifecycle Methods** | 33 | 48% |
| **Template Issues** | 13 | 19% |
| **Naming Convention Issues** | 6 | 9% |
| **Interface Issues** | 9 | 13% |

**Most Affected Modules:**
1. Context Menu Actions (~30 components)
2. Dialog Components (~15 components)
3. Cartography (2 directives + legacy files)

---

## 14. Next Steps

1. ✅ **Review this document** - Done
2. ⏳ **Choose migration strategy** - Strict vs Lenient
3. ⏳ **Apply Phase 1 fixes** - Parsing errors + quick wins
4. ⏳ **Update .eslintrc.json** - Based on chosen strategy
5. ⏳ **Run CI to verify** - Ensure checks pass
6. ⏳ **Create follow-up issues** - For Phase 2 & 3 items

---

**Document Version:** 1.0
**Last Updated:** 2026-03-30
**Maintainer:** Development Team
