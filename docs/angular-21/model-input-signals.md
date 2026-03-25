# Migrating from ngModel to Angular 17+ model() Input Signals

## Overview

This document describes the migration process from Angular's `ngModel` directive to Angular 17+ `model()` input signals for two-way data binding in the Docker Template Details component.

## Why Migrate to model()?

1. **Signal-based reactivity**: `model()` is part of Angular's signal system, providing better performance and automatic change detection
2. **No formGroup conflicts**: Unlike `ngModel`, `model()` signals can be used freely without conflicts with `formGroup` directives
3. **Modern Angular**: `model()` is the recommended approach for two-way binding in Angular 17+
4. **Standalone by default**: No need to specify `standalone: true` in `ngModelOptions`

## Implementation Process

### Step 1: Import model from @angular/core

```typescript
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject } from '@angular/core';
```

### Step 2: Remove ReactiveFormsModule and FormBuilder

Since we're using `model()` signals instead of reactive forms, remove the following imports and dependencies:

```typescript
// Remove these imports
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

// Remove formBuilder injection
private formBuilder = inject(UntypedFormBuilder);

// Remove generalSettingsForm declaration
generalSettingsForm: UntypedFormGroup;
```

### Step 3: Replace form group fields with model() signals

Instead of creating a `FormGroup` with `FormControl`s, declare each field as a `model()` signal:

**Before:**
```typescript
generalSettingsForm: UntypedFormGroup;

constructor() {
  this.generalSettingsForm = this.formBuilder.group({
    templateName: new UntypedFormControl('', Validators.required),
    defaultName: new UntypedFormControl('', Validators.required),
    adapter: new UntypedFormControl('', Validators.required),
    symbol: new UntypedFormControl('', Validators.required),
  });
}
```

**After:**
```typescript
// Model signals for form fields
name = model('');
defaultNameFormat = model('');
category = model('');
symbol = model('');
tags = model<string[]>([]);
startCommand = model('');
macAddress = model('');
adaptersCount = model(0);
consoleType = model('');
auxConsoleType = model('');
consoleAutoStart = model(false);
consoleResolution = model('');
consoleHttpPort = model(0);
consoleHttpPath = model('');
environment = model('');
extraHosts = model('');
usage = model('');
```

### Step 4: Initialize model signals in ngOnInit

When data is loaded from the API, initialize the model signals:

```typescript
ngOnInit() {
  // ... API call to get dockerTemplate ...

  this.dockerService.getTemplate(this.controller, template_id).subscribe((dockerTemplate: DockerTemplate) => {
    this.dockerTemplate = dockerTemplate;

    // Initialize model signals from dockerTemplate
    this.name.set(dockerTemplate.name || '');
    this.defaultNameFormat.set(dockerTemplate.default_name_format || '');
    this.category.set(dockerTemplate.category || '');
    this.symbol.set(dockerTemplate.symbol || '');
    this.tags.set(dockerTemplate.tags || []);
    this.startCommand.set(dockerTemplate.start_command || '');
    this.macAddress.set(dockerTemplate.mac_address || '');
    this.adaptersCount.set(dockerTemplate.adapters || 0);
    this.consoleType.set(dockerTemplate.console_type || '');
    this.auxConsoleType.set(dockerTemplate.aux_type || '');
    this.consoleAutoStart.set(dockerTemplate.console_auto_start || false);
    this.consoleResolution.set(dockerTemplate.console_resolution || '');
    this.consoleHttpPort.set(dockerTemplate.console_http_port || 0);
    this.consoleHttpPath.set(dockerTemplate.console_http_path || '');
    this.environment.set(dockerTemplate.environment || '');
    this.extraHosts.set(dockerTemplate.extra_hosts || '');
    this.usage.set(dockerTemplate.usage || '');

    this.cd.markForCheck();
  });
}
```

### Step 5: Sync model signals back to data object on save

In the `onSave()` method, push all signal values back to the original object:

```typescript
onSave() {
  // Update dockerTemplate from model signals
  this.dockerTemplate.name = this.name();
  this.dockerTemplate.default_name_format = this.defaultNameFormat();
  this.dockerTemplate.category = this.category();
  this.dockerTemplate.symbol = this.symbol();
  this.dockerTemplate.tags = this.tags();
  this.dockerTemplate.start_command = this.startCommand();
  this.dockerTemplate.mac_address = this.macAddress();
  this.dockerTemplate.adapters = this.adaptersCount();
  this.dockerTemplate.console_type = this.consoleType();
  this.dockerTemplate.aux_type = this.auxConsoleType();
  this.dockerTemplate.console_auto_start = this.consoleAutoStart();
  this.dockerTemplate.console_resolution = this.consoleResolution();
  this.dockerTemplate.console_http_port = this.consoleHttpPort();
  this.dockerTemplate.console_http_path = this.consoleHttpPath();
  this.dockerTemplate.environment = this.environment();
  this.dockerTemplate.extra_hosts = this.extraHosts();
  this.dockerTemplate.usage = this.usage();

  this.dockerService.saveTemplate(this.controller, this.dockerTemplate).subscribe((savedTemplate: DockerTemplate) => {
    this.toasterService.success('Changes saved');
  });
}
```

### Step 6: Update template to use model signals

Replace `[(ngModel)]` with explicit value/input bindings:

**Text Input:**
```html
<!-- Before -->
<input matInput [(ngModel)]="dockerTemplate.name" type="text" placeholder="Template name" />

<!-- After -->
<input matInput [value]="name()" (input)="name.set($event.target.value)" type="text" placeholder="Template name" />
```

**Number Input:**
```html
<!-- For numbers, use + to convert string to number -->
<input matInput [value]="adaptersCount()" (input)="adaptersCount.set(+$event.target.value)" type="number" />
```

**Select/Dropdown:**
```html
<!-- Before -->
<mat-select [(ngModel)]="dockerTemplate.console_type" placeholder="Console type">
  <mat-option [value]="type">{{ type }}</mat-option>
</mat-select>

<!-- After -->
<mat-select [value]="consoleType()" (selectionChange)="consoleType.set($event.value)" placeholder="Console type">
  <mat-option [value]="type">{{ type }}</mat-option>
</mat-select>
```

**Checkbox:**
```html
<!-- Before -->
<mat-checkbox [(ngModel)]="dockerTemplate.console_auto_start">Auto start console</mat-checkbox>

<!-- After -->
<mat-checkbox [checked]="consoleAutoStart()" (change)="consoleAutoStart.set($event.checked)">Auto start console</mat-checkbox>
```

**Textarea:**
```html
<!-- After -->
<textarea matInput [value]="environment()" (input)="environment.set($event.target.value)" type="text"></textarea>
```

**Chip List (for tags):**
```html
<!-- For @for loops, use the signal as the data source -->
@for (tag of tags(); track tag) {
  <mat-chip (removed)="removeTag(tag)">
    {{ tag }}
    <mat-icon matChipRemove>cancel</mat-icon>
  </mat-chip>
}
```

### Step 7: Update form structure

Remove the `[formGroup]` directive from the form element since we're no longer using reactive forms:

```html
<!-- Before -->
<form [formGroup]="generalSettingsForm" class="docker-details__form">

<!-- After -->
<form class="docker-details__form">
```

### Step 8: Update component imports

Remove unused imports:

```typescript
// Before
imports: [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  RouterModule,
  MatIconModule,
  MatButtonModule,
  MatCardModule,
  MatTabsModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatChipsModule,
  MatCheckboxModule,
  SymbolsMenuComponent
]

// After
imports: [
  CommonModule,
  FormsModule,
  RouterModule,
  MatIconModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatChipsModule,
  MatCheckboxModule,
  SymbolsMenuComponent
]
```

## Key Benefits of This Approach

1. **No ngModel conflicts**: Eliminates the Angular NG01350 error when using `ngModel` inside `formGroup`
2. **Better performance**: Signals provide more efficient change detection
3. **Cleaner code**: No need for `standalone: true` workarounds
4. **Type-safe**: Model signals are typed (e.g., `model<string[]>([])`)
5. **Predictable updates**: Changes propagate immediately through signal system

## Default Form State

To make all form sections collapsed by default:

```typescript
generalSettingsExpanded = false;
advancedExpanded = false;
usageExpanded = false;
```

## Files Changed

1. `docker-template-details.component.ts` - Component logic
2. `docker-template-details.component.html` - Template
3. `docker-template-details.component.scss` - Styles (unchanged)

## Migration Status

### Completed
- [x] Docker Template Details (`docker-template-details`)
- [x] Cloud Nodes Template Details (`cloud-nodes-template-details`)
- [x] Ethernet Hubs Template Details (`ethernet-hubs-template-details`)
- [x] Ethernet Switches Template Details (`ethernet-switches-template-details`)
- [x] IOU Template Details (`iou-template-details`)
- [x] QEMU VM Template Details (`qemu-vm-template-details`)

### Pending Migration (preferences)

The following components in `src/app/components/preferences/` still use `ngModel` and need to be migrated:

#### Template Details (view/edit)
- `virtual-box-template-details`
- `vmware-template-details`
- `vpcs-template-details`

#### Add Template Dialogs
- `add-docker-template`
- `add-ios-template`
- `add-iou-template`
- `add-qemu-vm-template`
- `add-virtual-box-template`
- `add-vmware-template`

#### Preferences Pages
- `dynamips-preferences`
- `qemu-preferences`
- `virtual-box-preferences`
- `vmware-preferences`
- `vpcs-preferences`

#### Common Components
- `custom-adapters-table`
- `ports`
- `symbols`
- `udp-tunnels`

#### Other
- `ios-template-details` (uses mixed approach with formGroup + standalone ngModel)

## Reference

For more information about Angular model inputs, see:
- [Angular Model Inputs Documentation](https://angular.dev/guide/components/inputs#model-inputs)
- [Two-way binding with model signals](https://angular.dev/tutorials/signals/6-two-way-binding-with-model-signals)
