import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BpfPreset, BpfPresetsService } from '@services/bpf-presets.service';
import {
  BpfRuleLibraryDialogComponent,
  BpfRuleLibraryDialogResult,
} from '../bpf-rule-library-dialog/bpf-rule-library-dialog.component';

/**
 * Searchable BPF preset picker shared by the marker forms and the packet-filter
 * editor. Picking a rule emits its expression through {@link expressionChange};
 * the rule library dialog (opened from the book button) manages the rule set.
 */
@Component({
  selector: 'app-bpf-presets',
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './bpf-presets.component.scss',
  template: `
    <div class="bpf-presets__row">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ multiline() ? 'Add BPF preset' : 'Use BPF preset' }}</mat-label>
        <input
          matInput
          [value]="searchText()"
          (input)="searchText.set($event.target.value)"
          [matAutocomplete]="presetAuto"
          placeholder="Search presets…"
        />
        <mat-autocomplete
          #presetAuto="matAutocomplete"
          [displayWith]="displayPreset"
          (optionSelected)="onPresetSelected($event.option.value)"
        >
          @for (group of presetGroups(); track group.label) {
            <mat-optgroup [label]="group.label">
              @for (preset of group.presets; track preset.name) {
                <mat-option [value]="preset">{{ preset.name }}: {{ preset.expression }}</mat-option>
              }
            </mat-optgroup>
          }
        </mat-autocomplete>
      </mat-form-field>
      <button
        mat-icon-button
        type="button"
        class="bpf-presets__library"
        (click)="openLibrary()"
        matTooltip="Manage BPF rules"
        aria-label="Manage BPF rules"
      >
        <mat-icon>menu_book</mat-icon>
      </button>
    </div>
  `,
})
export class BpfPresetsComponent {
  readonly presets = inject(BpfPresetsService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly expression = input('');
  readonly multiline = input(false);
  readonly expressionChange = output<string>();

  /** Autocomplete query — also shows the picked rule's name after a selection. */
  readonly searchText = signal('');

  /** Built-in rules grouped by category plus the user's own rules, filtered by the query. */
  readonly presetGroups = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const matches = (preset: BpfPreset) =>
      !query ||
      preset.name.toLowerCase().includes(query) ||
      preset.expression.toLowerCase().includes(query) ||
      preset.category.toLowerCase().includes(query);

    const groups: { label: string; presets: BpfPreset[] }[] = [];
    for (const preset of this.presets.builtInBpfPresets) {
      if (!matches(preset)) continue;
      let group = groups.find((candidate) => candidate.label === preset.category);
      if (!group) {
        group = { label: preset.category, presets: [] };
        groups.push(group);
      }
      group.presets.push(preset);
    }
    const custom = this.presets.customBpfPresets().filter(matches);
    if (custom.length > 0) groups.push({ label: 'Custom', presets: custom });
    return groups;
  });

  displayPreset(preset: BpfPreset | null): string {
    return preset?.name ?? '';
  }

  onPresetSelected(preset: BpfPreset): void {
    this.searchText.set(preset.name);
    this.select(preset.expression);
  }

  /** Opens the rule library; the expression it returns is applied like a picked preset. */
  openLibrary(): void {
    this.dialog
      .open(BpfRuleLibraryDialogComponent, {
        panelClass: [
          'base-dialog-panel',
          'dialog-medium-panel',
          'dialog-height-60-panel',
          'bpf-rule-library-dialog-panel',
        ],
        data: { currentExpression: this.expression(), multiline: this.multiline() },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: BpfRuleLibraryDialogResult | undefined) => {
        if (result?.expression) this.select(result.expression);
      });
  }

  select(expression: string): void {
    // Packet filters treat lines as separate rules; markers take one BPF expression.
    const lines = expression
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const selected =
      this.multiline() || lines.length <= 1 ? expression.trim() : lines.map((line) => `(${line})`).join(' or ');
    const current = this.expression().trim();
    this.expressionChange.emit(this.multiline() && current ? `${current}\n${selected}` : selected);
  }
}
