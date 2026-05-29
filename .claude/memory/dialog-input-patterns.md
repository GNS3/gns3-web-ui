---
name: dialog-input-patterns
description: Autocomplete, chip selection, and scrollbar patterns for dialog inputs
metadata:
  type: reference
---

# Dialog Input Patterns

## Single Selection with Search (mat-autocomplete)

Used in: Create New ACE dialog (User, Group, Role)

### Key Pattern

```typescript
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
```

```typescript
searchControl = new UntypedFormControl();
filteredItems: Observable<Item[]>;
items: Item[] = [];
selectedItem: Item;

@ViewChild('trigger', { read: MatAutocompleteTrigger }) autoTrigger: MatAutocompleteTrigger;

// Load data + setup filter
this.service.list(controller).subscribe({
  next: (items: Item[]) => {
    this.items = items;
    this.filteredItems = this.searchControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value, items))
    );
  },
});

// Filter: handle null → show all
_filter(value: string, data: any[]): any[] {
  const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
  if (data) return data.filter((item) => item.name.toLowerCase().includes(filterValue));
  return [];
}

// Selection: setValue shows the selected item via displayWith
onSelection(value: any) {
  this.selectedItem = value;
  this.searchControl.setValue(value);
}

// Click: clear + open panel
openPanel() {
  this.searchControl.setValue('');
  if (this.autoTrigger) this.autoTrigger.openPanel();
}
```

Template:
```html
<input type="text" matInput [matAutocomplete]="auto" [formControl]="searchControl"
       #trigger="matAutocompleteTrigger" (click)="openPanel()" />
<mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn"
                  (optionSelected)="onSelection($event.option.value)">
  @for (item of filteredItems | async; track item.id) {
  <mat-option [value]="item">{{ item.name }}</mat-option>
  }
</mat-autocomplete>
```

**Key rules:**
- `reset()` clears input — use `setValue(value)` to show selected item
- Use `#trigger="matAutocompleteTrigger"` + `openPanel()` to reopen on click
- Filter must handle `null` by treating it as empty string
- `displayWith` formats the selected value in input

---

## Multi Selection (Chips + Autocomplete)

Used in: Create New User dialog (Groups)

```html
<mat-chip-grid #chipGrid>
  @for (item of selectedItems; track item.name) {
  <mat-chip-row (removed)="remove(item)">
    {{ item.name }}
    <button matChipRemove><mat-icon>cancel</mat-icon></button>
  </mat-chip-row>
  }
  <input [matChipInputFor]="chipGrid" [matAutocomplete]="auto" [formControl]="autocompleteControl" />
</mat-chip-grid>
<mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSelect($event.option.value)">
  @for (item of filteredItems | async; track item.name) {
  <mat-option [value]="item">{{ item.name }}</mat-option>
  }
</mat-autocomplete>
```

Selection clears input for next selection:
```typescript
onSelect(value: any) {
  selectedSet.add(value);
  autocompleteControl.reset();
}
```

---

## Dialog Scrollbar Prevention

When dialog content grows (chips, dynamic lists) and internal scrollbar appears:

**If template uses `mat-dialog-content`**: add to panel class in `_dialogs.scss`:
```scss
.panel-class {
  .mat-mdc-dialog-content {
    overflow: visible;
    flex: none;
  }
}
```

**If template has no `mat-dialog-content`**: remove fixed height on the form container.
