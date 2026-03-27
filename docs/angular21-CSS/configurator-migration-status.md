# Configurator Dialog Migration Status

> Node Configurator Dialogs - Reactive Forms & Tags Structure Migration

**Last Updated**: 2026-03-27

---

## Overview

This document tracks the migration status of all node configurator dialogs to:
1. **Reactive Forms** - Remove all `ngModel` usage
2. **Correct Tags Structure** - Fix Material Chips input placement
3. **Consistent Styling** - Use centralized dialog styles

---

## Current Status Summary

| Status | Count | Configurators |
|--------|-------|---------------|
| ✅ **Fully Migrated** | 5 | QEMU, VPCS, IOS, NAT, Ethernet Hub |
| ❌ **Not Migrated** | 7 | Ethernet Switch, Cloud, IOU, VirtualBox, VMware, Docker, ATM Switch |
| N/A | 1 | Frame Relay Switch (no tags, no ngModel) |

---

## Detailed Status

### ✅ Fully Migrated (3)

#### QEMU Configurator
- **File**: `qemu/configurator-qemu.component.html`
- **Reactive Forms**: ✅ Complete
- **Tags Structure**: ✅ Correct (input outside chip-grid)
- **Styling**: ✅ Centralized

#### VPCS Configurator
- **File**: `vpcs/configurator-vpcs.component.html`
- **Reactive Forms**: ✅ Complete
- **Tags Structure**: ✅ Correct (input outside chip-grid)
- **Styling**: ✅ Centralized

#### IOS Configurator
- **File**: `ios/configurator-ios.component.html`
- **Reactive Forms**: ✅ Complete (including Slots/WICs)
- **Tags Structure**: ✅ Correct (input outside chip-grid)
- **Styling**: ✅ Hybrid (shared + component-specific)

---

### ⚠️ Partial Migration (1)

#### NAT Configurator
- **File**: `nat/configurator-nat.component.html`
- **Reactive Forms**: ✅ Complete
- **Tags Structure**: ✅ Correct (input outside chip-grid)
- **Styling**: ✅ Centralized
- **Migrated**: 2026-03-27

---

### ❌ Not Migrated (8)

#### 1. ~~Ethernet Hub Configurator~~
- **File**: `ethernet_hub/configurator-ethernet-hub.component.html`
- **Reactive Forms**: ✅ Complete
- **Tags Structure**: ✅ Correct (input outside chip-grid)
- **Styling**: ✅ Centralized
- **Migrated**: 2026-03-27

#### 2. Ethernet Switch Configurator
- **File**: `ethernet-switch/configurator-ethernet-switch.component.html`
- **Reactive Forms**: ❌ Uses `ngModel`
- **Tags Structure**: ❌ Input inside chip-grid
- **Issues**:
  - Console type uses `[(ngModel)]`
  - Tags input structure wrong

#### 3. Cloud Configurator
- **File**: `cloud/configurator-cloud.component.html`
- **Reactive Forms**: ❌ Uses `ngModel`
- **Tags Structure**: ❌ Input inside chip-grid
- **Issues**:
  - Multiple `ngModel` bindings
  - Tags input structure wrong

#### 4. IOU Configurator
- **File**: `iou/configurator-iou.component.html`
- **Reactive Forms**: ❌ Uses `ngModel`
- **Tags Structure**: ❌ Input inside chip-grid
- **Issues**:
  - Console type uses `[(ngModel)]`
  - Console auto start uses `[(ngModel)]`
  - Use default IOU values checkbox uses `[(ngModel)]`
  - RAM/NVRAM fields use `[(ngModel)]`
  - Usage textarea uses `[(ngModel)]`
  - Tags input structure wrong

#### 5. VirtualBox Configurator
- **File**: `virtualbox/configurator-virtualbox.component.html`
- **Reactive Forms**: ❌ Uses `ngModel`
- **Tags Structure**: ❌ Input inside chip-grid
- **Issues**:
  - Console type uses `[(ngModel)]`
  - Console auto start uses `[(ngModel)]`
  - On close uses `[(ngModel)]`
  - Headless mode uses `[(ngModel)]`
  - Usage textarea uses `[(ngModel)]`
  - Tags input structure wrong

#### 6. VMware Configurator
- **File**: `vmware/configurator-vmware.component.html`
- **Reactive Forms**: ❌ Uses `ngModel`
- **Tags Structure**: ❌ Input inside chip-grid
- **Issues**:
  - Console type uses `[(ngModel)]`
  - Console auto start uses `[(ngModel)]`
  - On close uses `[(ngModel)]`
  - Headless mode uses `[(ngModel)]`
  - Linked clone uses `[(ngModel)]`
  - Usage textarea uses `[(ngModel)]`
  - Tags input structure wrong

#### 7. Docker Configurator
- **File**: `docker/configurator-docker.component.html`
- **Reactive Forms**: ❌ Uses `ngModel`
- **Tags Structure**: ❌ Input inside chip-grid
- **Issues**:
  - Console type uses `[(ngModel)]`
  - Aux console type uses `[(ngModel)]`
  - Console auto start uses `[(ngModel)]`
  - VNC resolution uses `[(ngModel)]`
  - Environment textarea uses `[(ngModel)]`
  - Extra hosts textarea uses `[(ngModel)]`
  - Extra volumes textarea uses `[(ngModel)]`
  - Usage textarea uses `[(ngModel)]`
  - Tags input structure wrong

#### 8. ATM Switch Configurator
- **File**: `atm_switch/configurator-atm-switch.component.html`
- **Reactive Forms**: ❌ Uses `ngModel` (checkbox)
- **Tags Structure**: N/A (no tags field)
- **Issues**:
  - "Use VPI only" checkbox uses `[(ngModel)]`

---

### N/A (1)

#### Frame Relay Switch Configurator
- **File**: `switch/configurator-switch.component.html`
- **Reactive Forms**: ✅ No ngModel
- **Tags Structure**: N/A (no tags field)
- **Status**: Complete

---

## Migration Patterns

### ~~Pattern 1: Fix Tags Structure Only~~

**For**: ~~NAT~~ (already has Reactive Forms) - **COMPLETED** ✅

**Steps**:
1. Move `<input>` element outside `<mat-chip-grid>`
2. Keep all other code unchanged

**Example**:
```html
<!-- BEFORE -->
<mat-chip-grid #chipList>
  @for (tag of node?.tags; track tag) {
  <mat-chip (removed)="removeTag(tag)">
    {{ tag }}
    <mat-icon matChipRemove>cancel</mat-icon>
  </mat-chip>
  }
  <input matInput placeholder="Add tags" [matChipInputFor]="chipList" />
</mat-chip-grid>

<!-- AFTER -->
<mat-chip-grid #chipList>
  @for (tag of node?.tags; track tag) {
  <mat-chip (removed)="removeTag(tag)">
    {{ tag }}
    <mat-icon matChipRemove>cancel</mat-icon>
  </mat-chip>
  }
</mat-chip-grid>
<input matInput placeholder="Add tags" [matChipInputFor]="chipList" />
```

---

### Pattern 2: Migrate Simple Fields to Reactive Forms

**For**: Ethernet Hub, Ethernet Switch

**Component Changes**:
```typescript
// 1. Add form controls to constructor
constructor() {
  this.inputForm = this.formBuilder.group({
    name: new UntypedFormControl('', Validators.required),
    console_type: new UntypedFormControl(''),
    console_auto_start: new UntypedFormControl(false),
  });
}

// 2. Initialize form data in ngOnInit
ngOnInit() {
  this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
    this.node = node;
    this.name = node.name;

    this.inputForm.patchValue({
      name: node.name,
      console_type: node.console_type || '',
      console_auto_start: node.console_auto_start || false,
    });

    if (!this.node.tags) {
      this.node.tags = [];
    }
  });
}

// 3. Sync form values on save
onSaveClick() {
  if (this.inputForm.valid) {
    const formValues = this.inputForm.value;

    this.node.name = formValues.name;
    this.node.console_type = formValues.console_type;
    this.node.console_auto_start = formValues.console_auto_start;

    this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
      this.toasterService.success(`Node ${this.node.name} updated.`);
      this.onCancelClick();
    });
  } else {
    this.toasterService.error(`Fill all required fields.`);
  }
}
```

**Template Changes**:
```html
<!-- BEFORE -->
<mat-form-field class="form-field">
  <input matInput type="text" [(ngModel)]="node.name" placeholder="Name" />
</mat-form-field>

<mat-form-field class="select">
  <mat-select placeholder="Console type" [(ngModel)]="node.console_type">
    @for (type of consoleTypes; track type) {
    <mat-option [value]="type">{{ type }}</mat-option>
    }
  </mat-select>
</mat-form-field>

<mat-checkbox [(ngModel)]="node.console_auto_start">
  Auto start console
</mat-checkbox>

<!-- AFTER -->
<mat-form-field class="form-field">
  <mat-label>Name</mat-label>
  <input matInput type="text" formControlName="name" />
</mat-form-field>

<mat-form-field class="form-field">
  <mat-label>Console type</mat-label>
  <mat-select formControlName="console_type">
    @for (type of consoleTypes; track type) {
    <mat-option [value]="type">{{ type }}</mat-option>
    }
  </mat-select>
</mat-form-field>

<mat-checkbox formControlName="console_auto_start">
  Auto start console
</mat-checkbox>
```

---

### Pattern 3: Migrate Complex Fields with Properties

**For**: IOU, VirtualBox, VMware, Docker

**Additional considerations**:
- Properties like `node.properties.ram`, `node.properties.usage` need form controls
- Use `formControlName` for all fields
- Initialize all values in `ngOnInit` with `patchValue()`
- Merge form values back to node properties in `onSaveClick()`

**Example - IOU**:
```typescript
constructor() {
  this.generalSettingsForm = this.formBuilder.group({
    name: new UntypedFormControl('', Validators.required),
    console_type: new UntypedFormControl(''),
    console_auto_start: new UntypedFormControl(false),
    use_default_iou_values: new UntypedFormControl(true),
    ram: new UntypedFormControl(''),
    nvram: new UntypedFormControl(''),
  });
}

ngOnInit() {
  this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
    this.node = node;
    this.name = node.name;

    this.generalSettingsForm.patchValue({
      name: node.name,
      console_type: node.console_type || '',
      console_auto_start: node.console_auto_start || false,
      use_default_iou_values: node.properties.use_default_iou_values || true,
      ram: node.properties.ram || '',
      nvram: node.properties.nvram || '',
    });

    if (!this.node.tags) {
      this.node.tags = [];
    }
  });
}

onSaveClick() {
  if (this.generalSettingsForm.valid) {
    const formValues = this.generalSettingsForm.value;

    this.node.name = formValues.name;
    this.node.console_type = formValues.console_type;
    this.node.console_auto_start = formValues.console_auto_start;
    this.node.properties.use_default_iou_values = formValues.use_default_iou_values;
    this.node.properties.ram = formValues.ram;
    this.node.properties.nvram = formValues.nvram;

    this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
      this.toasterService.success(`Node ${this.node.name} updated.`);
      this.onCancelClick();
    });
  } else {
    this.toasterService.error(`Fill all required fields.`);
  }
}
```

---

## Migration Checklist

For each configurator, ensure:

### HTML Template
- [ ] All `placeholder` replaced with `<mat-label>`
- [ ] All `[(ngModel)]` replaced with `formControlName`
- [ ] Tags input moved outside `<mat-chip-grid>`
- [ ] All form fields wrapped in `<form [formGroup]="...">`
- [ ] Removed `[ngModelOptions]="{ standalone: true }"`
- [ ] Removed local `.select` class (use centralized styles)

### Component TypeScript
- [ ] Added all fields to form group in constructor
- [ ] Added `patchValue()` call in `ngOnInit()`
- [ ] Added form value merging in `onSaveClick()`
- [ ] Removed `[(ngModel)]` related imports (if any)
- [ ] Ensured tags array initialization in `ngOnInit()`

### Styling
- [ ] Removed `styleUrls` (if using centralized styles)
- [ ] Added `panelClass: ['base-dialog-panel', 'configurator-dialog-panel']` in config-action.component.ts
- [ ] Using BEM naming for component-specific styles (if needed)

---

## Reference Implementation

See these configurators for correct patterns:
- **QEMU**: Full Reactive Forms migration + correct tags structure
- **VPCS**: Simple Reactive Forms migration + correct tags structure
- **IOS**: Complex Reactive Forms migration (Slots/WICs) + hybrid styling

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `docs/angular21-CSS/dialog-style-isolation-guide.md` | Dialog styling best practices |
| `docs/angular-21/model-input-signals.md` | Signal input patterns |
| `src/styles/_dialogs.scss` | Centralized dialog styles |

---

_Last Updated: 2026-03-27_
