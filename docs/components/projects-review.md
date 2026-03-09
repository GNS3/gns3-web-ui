# Projects Component - Code Review Documentation

---

**Document Generated**: 2026-03-07
**Review Tool**: Claude Code (Sonnet 4.5)
**Review Scope**: src/app/components/projects/ (Projects Component)

---

## Overview

Project management module handles project list display, creation, editing, importing, exporting, and deletion.

---

## Module Functions


### Main Components

#### **ProjectsComponent**
- Project list display (Material table)
- Project search, filtering, sorting
- Batch selection and operations
- Project create, import, delete

#### **AddBlankProjectDialogComponent**
- Create blank project dialog
- Project name duplicate check

#### **EditProjectDialogComponent**
- Edit project properties
- README editor
- Project variable management

#### **ImportProjectDialogComponent**
- Project import functionality
- File upload handling

#### **DeleteProjectDialogComponent**
- Delete project confirmation dialog

---

## Issues Found

### Critical Issues

#### 1. **Memory Leak - Subscription Not Cancelled** (Critical)
**File**: `projects.component.ts:87-93`

**Description**:
```typescript
const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
  if (result) {
    this.projectService.delete(this.controller, project.project_id).subscribe(() => {
      this.refresh();
    });
  }
});
// Subscription not stored or cancelled
```

**Impact**: Subscription persists when component is destroyed, causing memory leak

**Fix Recommendation**:
```typescript
export class ProjectsComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private destroy$ = new Subject<void>();

  onDeleteProject(project: Project) {
    const bottomSheetRef = this.bottomSheet.open(DeleteProjectComponent, {
      data: { project }
    });

    const subscription = bottomSheetRef.afterDismissed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((result: boolean) => {
      if (result) {
        this.projectService.delete(this.controller, project.project_id).pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => {
          this.refresh();
        });
      }
    });

    this.subscriptions.add(subscription);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }
}
```

#### 2. **Insufficient XSS Protection** (Critical)
**File**: `readme-editor/readme-editor.component.ts:34-35`

**Description**:
```typescript
const html = marked(this.markdown) as string;
return this.sanitizer.bypassSecurityTrustHtml(html);
```

**Risk**: Markdown may contain malicious HTML/JavaScript

**Fix Recommendation**:
```typescript
import DOMPurify from 'dompurify';

private renderMarkdown(): SafeHtml {
  if (!this.markdown) {
    return '';
  }

  try {
    // Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false
    });

    // Sanitize with DOMPurify
    const dirtyHtml = marked(this.markdown);
    const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                     'ul', 'ol', 'li', 'code', 'pre', 'blockquote',
                     'strong', 'em', 'del', 'a', 'table', 'thead',
                     'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'title', 'class'],
      ALLOW_DATA_ATTR: false
    });

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return this.sanitizer.bypassSecurityTrustHtml(
      this.escapeHtml(this.markdown)
    );
  }
}

private escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

#### 3. **projectListSubject Subscription Not Cancelled** (Critical)
**File**: `projects.component.ts:69`

**Description**:
```typescript
this.projectService.projectListSubject.subscribe(() => this.refresh());
// Subscription reference not stored
```

**Fix Recommendation**:
```typescript
export class ProjectsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.projectService.projectListSubject.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.refresh());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### Performance Issues

#### 4. **Real-time Search Without Debounce** (Medium)
**File**: `projects.component.html:22`

**Description**:
```html
[dataSource]="dataSource | projectsfilter: searchText"
```

**Issue**: Filtering triggers on every input, affecting performance with large number of projects

**Fix Recommendation**:
```typescript
// projects.component.ts
export class ProjectsComponent implements OnInit {
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchText => {
      this.searchText = searchText;
    });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }
}
```

```html
<!-- Template -->
<input matInput (input)="onSearchInput($event)" placeholder="Search">
```

#### 5. **Unnecessary Array Operations** (Medium)
**File**: `projects.component.ts:225`

**Description**:
```typescript
this.projectDatabase.data.forEach((row) => this.selection.select(row));
```

**Fix Recommendation**:
```typescript
isAllSelected() {
  const numSelected = this.selection.selected.length;
  const numRows = this.projectDatabase.data.length;
  return numSelected === numRows;
}

masterToggle() {
  if (this.isAllSelected()) {
    this.selection.clear();
  } else {
    this.projectDatabase.data.forEach(row => this.selection.select(row));
  }
}
```

#### 6. **Duplicate API Calls** (Medium)
**File**: `add-blank-project-dialog/add-blank-project-dialog.component.ts:54-63`

**Description**:
```typescript
this.projectService.list(this.controller).subscribe((projects: Project[]) => {
  // Gets full list every time a project is added
});
```

**Fix Recommendation**:
```typescript
// Use service cache
const existingProject = this.projectService.getCachedProject(projectName);

if (existingProject) {
  this.openConfirmationDialog(existingProject);
} else {
  this.addProject();
}
```

---

### Code Quality Issues

#### 7. **Method Naming Does Not Follow Conventions**
**File**: `projects.component.ts:230`

**Description**:
```typescript
exportSelectProject(project: Project){  // Missing space
```

**Fix Recommendation**:
```typescript
exportSelectProject(project: Project) {
```

#### 8. **Direct Access to Private Properties**
**File**: `projects.component.ts:85, 116, 170`

**Description**:
```typescript
let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
```

**Fix Recommendation**:
```typescript
// Use public API or create service to track state
@Injectable({ providedIn: 'root' })
export class BottomSheetStateService {
  private openedSubject = new BehaviorSubject<boolean>(false);

  isOpened$ = this.openedSubject.asObservable();

  open() {
    this.openedSubject.next(true);
  }

  close() {
    this.openedSubject.next(false);
  }
}
```

#### 9. **Typo**
**File**: `import-project-dialog/import-project-dialog.component.ts:122`

**Description**:
```typescript
panelClass: 'uplaoding-file-snackabar'  // Typo
```

**Fix Recommendation**:
```typescript
// Create constants
export const SNACKBAR_CLASSES = {
  UPLOADING: 'uploading-file-snackbar'
};

// Usage
this.snackBar.openFromComponent(UploadingProcessbarComponent, {
  panelClass: SNACKBAR_CLASSES.UPLOADING
});
```

#### 10. **Incomplete Error Handling**
**File**: `edit-project-dialog/edit-project-dialog.component.ts:94-99`

**Description**:
```typescript
this.projectService.update(this.controller, this.project).subscribe((project: Project) => {
  this.projectService.postReadmeFile(this.controller, this.project.project_id, this.editor.markdown).subscribe((response) => {
    this.toasterService.success(`Project ${project.name} updated.`);
    this.onNoClick();
  });
}, (error) => {
  // Only handled update error, postReadmeFile error not handled
})
```

**Fix Recommendation**:
```typescript
this.projectService.update(this.controller, this.project).pipe(
  switchMap(project =>
    this.projectService.postReadmeFile(
      this.controller,
      this.project.project_id,
      this.editor.markdown
    ).pipe(
      map(() => project),
      catchError(error => {
        this.toasterService.error('Failed to save README');
        return of(project);  // Continue closing dialog
      })
    )
  ),
  catchError(error => {
    this.toasterService.error('Failed to update project');
    return of(null);
  })
).subscribe(project => {
  if (project) {
    this.toasterService.success(`Project ${project.name} updated.`);
    this.onNoClick();
  }
});
```

---

## Recommendations

### Priority 1 - Immediate Fixes

#### 1. Fix All Memory Leaks
```typescript
export class ProjectsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private subscriptions = new Subscription();

  ngOnInit() {
    // All subscriptions use takeUntil
    this.projectService.projectListSubject.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.refresh());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }
}
```

#### 2. Fix XSS Vulnerability
```typescript
// Install DOMPurify
// npm install dompurify @types/dompurify

// Configure marked
marked.setOptions({
  sanitize: true,
  sanitizer: (html) => DOMPurify.sanitize(html)
});
```

#### 3. Add File Upload Validation
```typescript
// import-project-dialog.component.ts
validateUploadFile(file: File): boolean {
  // File type validation
  const validTypes = ['.gns3project', '.zip'];
  const hasValidExtension = validTypes.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    this.toasterService.error('Invalid file type. Please upload a .gns3project or .zip file.');
    return false;
  }

  // File size validation (e.g., max 2GB)
  const maxSize = 2 * 1024 * 1024 * 1024;
  if (file.size > maxSize) {
    this.toasterService.error('File too large. Maximum size is 2GB.');
    return false;
  }

  return true;
}
```

### Priority 2 - Short-term Improvements

#### 1. Implement Search Debounce
```typescript
export class ProjectsComponent {
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchText => {
      this.applyFilter(searchText);
    });
  }

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  private applyFilter(filter: string) {
    this.dataSource.filter = filter.trim().toLowerCase();
  }
}
```

#### 2. Improve Loading State
```typescript
export class ProjectsComponent {
  loading = false;
  loadingMore = false;

  refresh() {
    this.loading = true;
    this.projectService.list(this.controller).pipe(
      finalize(() => this.loading = false)
    ).subscribe(projects => {
      this.projectDatabase.data = projects;
      this.dataSource.connect().next(projects);
    });
  }
}
```

#### 3. Add Operation Confirmation
```typescript
deleteProjects(projects: Project[]) {
  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    width: '450px',
    data: {
      title: 'Delete Projects',
      message: `Are you sure you want to delete ${projects.length} project(s)?`,
      details: projects.map(p => p.name).join(', ')
    }
  });

  dialogRef.afterClosed().pipe(
    takeUntil(this.destroy$)
  ).subscribe(confirmed => {
    if (confirmed) {
      this.performDelete(projects);
    }
  });
}
```

### Priority 3 - Long-term Improvements

#### 1. Implement Virtual Scrolling
```html
<cdk-virtual-scroll-viewport itemSize="50" maxBufferPx="500" minBufferPx="200">
  <mat-table #table [dataSource]="dataSource" matSort>
    <!-- Table content -->
  </mat-table>
</cdk-virtual-scroll-viewport>
```

#### 2. Implement Project Caching
```typescript
@Injectable({ providedIn: 'root' })
export class ProjectCacheService {
  private cache = new Map<string, Project[]>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(controllerId: string): Project[] | null {
    const cached = this.cache.get(controllerId);
    if (!cached) return null;

    const timestamp = cached[0] as any;
    if (Date.now() - timestamp > this.ttl) {
      this.cache.delete(controllerId);
      return null;
    }

    return cached[1] as Project[];
  }

  set(controllerId: string, projects: Project[]) {
    this.cache.set(controllerId, [Date.now(), projects]);
  }

  clear(controllerId: string) {
    this.cache.delete(controllerId);
  }
}
```

#### 3. Add Undo Functionality
```typescript
export class ProjectsComponent {
  private undoStack: UndoAction[] = [];

  deleteProjects(projects: Project[]) {
    // Save for undo
    this.undoStack.push({
      type: 'delete',
      projects: projects.map(p => ({ ...p })),
      timestamp: Date.now()
    });

    // Execute deletion
  }

  undo() {
    const lastAction = this.undoStack.pop();
    if (lastAction && lastAction.type === 'delete') {
      // Restore projects
      lastAction.projects.forEach(project => {
        this.projectService.create(this.controller, project).subscribe();
      });
    }
  }
}
```

---

## Testing Recommendations

### Unit Tests
```typescript
describe('ProjectsComponent', () => {
  it('should clean up subscriptions on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });

  it('should sanitize markdown HTML', () => {
    const malicious = '<script>alert("xss")</script>';
    component.editor.markdown = malicious;
    const sanitized = component.editor.renderMarkdown();
    expect(sanitized).not.toContain('<script>');
  });
});
```

### E2E Tests
```typescript
it('should prevent deleting multiple projects without confirmation', () => {
  page.selectProjects(['project1', 'project2']);
  page.clickDelete();
  expect(page.confirmationDialog).toBeVisible();
});
```
