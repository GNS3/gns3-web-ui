# Dialog Code Templates

Copy-paste scaffolds for every dialog type. Replace `<Noun>` with your
entity name (e.g. `Project`, `Node`, `Image`).

---

## 1. Standard Dialog (`base-dialog-panel`)

### Open call
```typescript
this.dialog.open(EditNounDialogComponent, {
  panelClass: ['base-dialog-panel'],
  data: { noun } satisfies EditNounDialogData,
});
```

### Component
```typescript
@Component({
  selector: 'app-edit-noun-dialog',
  templateUrl: './edit-noun-dialog.component.html',
})
export class EditNounDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditNounDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditNounDialogData,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      name: [data.noun.name, Validators.required],
      // ... other fields
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value as EditNounDialogResult);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

export interface EditNounDialogData { noun: Noun; }
export interface EditNounDialogResult { name: string; /* ... */ }
```

### Template
```html
<h2 mat-dialog-title>Edit Noun</h2>

<mat-dialog-content>
  <form [formGroup]="form">
    <mat-form-field class="form-field">
      <mat-label>Name</mat-label>
      <input matInput formControlName="name" />
    </mat-form-field>
    <!-- additional fields -->
  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">Cancel</button>
  <button mat-flat-button color="primary"
          [disabled]="form.invalid"
          (click)="submit()">Save</button>
</mat-dialog-actions>
```

---

## 2. Configurator Dialog (`base-dialog-panel` + `configurator-dialog-panel`)

Use for node / resource configuration with tabs or form grids (800px wide).

### Open call
```typescript
this.dialog.open(ConfigureNounDialogComponent, {
  panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
  data: { noun } satisfies ConfigureNounDialogData,
});
```

### Component
```typescript
@Component({
  selector: 'app-configure-noun-dialog',
  templateUrl: './configure-noun-dialog.component.html',
})
export class ConfigureNounDialogComponent {
  form: FormGroup;
  selectedTabIndex = 0;

  constructor(
    private dialogRef: MatDialogRef<ConfigureNounDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfigureNounDialogData,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      general: this.fb.group({
        name: [data.noun.name, Validators.required],
      }),
      advanced: this.fb.group({
        // advanced fields
      }),
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value as ConfigureNounDialogResult);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

export interface ConfigureNounDialogData { noun: Noun; }
export interface ConfigureNounDialogResult { /* typed result */ }
```

### Template
```html
<h2 mat-dialog-title>Configure Noun</h2>

<mat-dialog-content>
  <form [formGroup]="form">
    <mat-tab-group [(selectedIndex)]="selectedTabIndex">

      <mat-tab label="General">
        <div class="form-grid" formGroupName="general">
          <mat-form-field class="form-field">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <!-- more fields in 2-column grid -->
        </div>
      </mat-tab>

      <mat-tab label="Advanced">
        <div class="form-grid" formGroupName="advanced">
          <!-- advanced fields -->
        </div>
      </mat-tab>

    </mat-tab-group>
  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">Cancel</button>
  <button mat-flat-button color="primary"
          [disabled]="form.invalid"
          (click)="submit()">Apply</button>
</mat-dialog-actions>
```

---

## 3. Simple Sub-Dialog (`simple-dialog-panel`)

Use when launching a child dialog from inside another dialog (500px wide).

### Open call
```typescript
this.dialog.open(SelectNounDialogComponent, {
  panelClass: ['simple-dialog-panel'],
  data: { options } satisfies SelectNounDialogData,
});
```

### Template
```html
<h2 mat-dialog-title>Select Noun</h2>

<mat-dialog-content>
  <!-- compact single-purpose content, no tabs -->
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">Cancel</button>
  <button mat-flat-button color="primary" (click)="confirm()">Select</button>
</mat-dialog-actions>
```

---

## 4. Confirmation Dialogs (`base-confirmation-dialog-panel` + variant)

Minimal: title + one short sentence + two buttons only. No forms, no tabs.

### 4a. Danger (delete / remove)
```typescript
this.dialog.open(ConfirmDeleteNounDialogComponent, {
  panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
  data: { nounName: noun.name } satisfies ConfirmDeleteNounDialogData,
});
```

```html
<h2 mat-dialog-title>Delete {{ data.nounName }}?</h2>

<mat-dialog-content>
  <p>This action cannot be undone. The noun and all associated data
     will be permanently removed.</p>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="dialogRef.close(false)">Cancel</button>
  <button mat-flat-button color="warn"
          (click)="dialogRef.close(true)">Delete</button>
</mat-dialog-actions>
```

### 4b. Warning (unlock / risky action)
```typescript
panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel']
```
```html
<h2 mat-dialog-title>Unlock Noun?</h2>
<mat-dialog-content>
  <p>Unlocking will allow edits. Make sure you coordinate with your team
     before proceeding.</p>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button (click)="dialogRef.close(false)">Cancel</button>
  <button mat-flat-button color="accent"
          (click)="dialogRef.close(true)">Unlock</button>
</mat-dialog-actions>
```

### 4c. Info (acknowledge / confirm)
```typescript
panelClass: ['base-confirmation-dialog-panel', 'confirmation-info-panel']
```
```html
<h2 mat-dialog-title>Confirm Action</h2>
<mat-dialog-content>
  <p>You are about to submit these changes. Please review before confirming.</p>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button (click)="dialogRef.close(false)">Cancel</button>
  <button mat-flat-button color="primary"
          (click)="dialogRef.close(true)">Confirm</button>
</mat-dialog-actions>
```

---

## Typed Result Pattern (caller side)

Always type the dialog result at the call site:

```typescript
this.dialog
  .open(EditNounDialogComponent, { ... })
  .afterClosed()
  .pipe(filter(Boolean))
  .subscribe((result: EditNounDialogResult) => {
    // handle result
  });
```