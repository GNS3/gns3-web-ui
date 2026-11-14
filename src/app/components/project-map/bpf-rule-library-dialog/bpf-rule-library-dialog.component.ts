import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BpfPreset, BpfPresetsService, CUSTOM_BPF_CATEGORY } from '@services/bpf-presets.service';

export interface BpfRuleLibraryDialogData {
  /** Expression currently in the calling form; prefills the "New rule" editor. */
  currentExpression?: string;
  /** True for packet filters, where newlines separate rules instead of being whitespace. */
  multiline?: boolean;
}

export interface BpfRuleLibraryDialogResult {
  expression: string;
}

interface RuleEntry extends BpfPreset {
  source: 'built-in' | 'custom';
}

interface RuleGroup {
  label: string;
  rules: RuleEntry[];
}

/**
 * Manages the shared BPF rule set: built-in presets (read-only, copyable to the
 * user's own rules) plus user-created rules. Returns the expression of the
 * rule the user picked via "Use rule".
 */
@Component({
  selector: 'app-bpf-rule-library-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    CdkTextareaAutosize,
  ],
  templateUrl: './bpf-rule-library-dialog.component.html',
  styleUrl: './bpf-rule-library-dialog.component.scss',
})
export class BpfRuleLibraryDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<BpfRuleLibraryDialogComponent>);
  private readonly library = inject(BpfPresetsService);
  private readonly data = inject<BpfRuleLibraryDialogData>(MAT_DIALOG_DATA);

  readonly searchText = signal('');
  readonly activeCategory = signal('All');
  readonly selected = signal<RuleEntry | null>(null);

  /** Inline create/edit panel. */
  readonly editorOpen = signal(false);
  readonly editorName = signal('');
  readonly editorExpression = signal('');
  /** Name of the custom rule being edited; null when creating a new one. */
  readonly editingName = signal<string | null>(null);
  /** Built-in rule the editor was opened from; saving creates a personal copy. */
  readonly basedOn = signal<string | null>(null);

  readonly entries = computed<RuleEntry[]>(() => [
    ...this.library.builtInBpfPresets.map((preset) => ({ ...preset, source: 'built-in' as const })),
    ...this.library.customBpfPresets().map((preset) => ({ ...preset, source: 'custom' as const })),
  ]);

  readonly categories = computed<string[]>(() => {
    const builtInCategories = [...new Set(this.library.builtInBpfPresets.map((preset) => preset.category))];
    return ['All', ...builtInCategories, CUSTOM_BPF_CATEGORY];
  });

  readonly groups = computed<RuleGroup[]>(() => {
    const query = this.searchText().trim().toLowerCase();
    const category = this.activeCategory();
    const matches = (rule: RuleEntry) =>
      (category === 'All' || rule.category === category) &&
      (!query ||
        rule.name.toLowerCase().includes(query) ||
        rule.expression.toLowerCase().includes(query) ||
        rule.category.toLowerCase().includes(query));

    const labels = [...new Set(this.entries().map((rule) => rule.category))];
    return labels
      .map((label) => ({ label, rules: this.entries().filter((rule) => rule.category === label && matches(rule)) }))
      .filter((group) => group.rules.length > 0);
  });

  constructor() {
    // Preselect the rule that produced the expression currently in the form.
    const current = (this.data.currentExpression ?? '').trim();
    if (!current) return;
    const match = this.entries().find((rule) => rule.expression === current);
    if (match) this.selected.set(match);
  }

  isSelected(rule: RuleEntry): boolean {
    const selected = this.selected();
    return selected !== null && selected.name === rule.name && selected.source === rule.source;
  }

  selectRule(rule: RuleEntry): void {
    this.selected.set(rule);
  }

  startNew(): void {
    this.editingName.set(null);
    this.basedOn.set(null);
    this.editorName.set('');
    this.editorExpression.set(this.data.currentExpression?.trim() ?? '');
    this.editorOpen.set(true);
  }

  startEdit(rule: RuleEntry): void {
    // Editing a built-in rule is how users create a personalized copy: the
    // editor opens prefilled and saving creates a custom rule.
    const builtIn = rule.source === 'built-in';
    this.editingName.set(builtIn ? null : rule.name);
    this.basedOn.set(builtIn ? rule.name : null);
    this.editorName.set(rule.name);
    this.editorExpression.set(rule.expression);
    this.editorOpen.set(true);
  }

  cancelEditor(): void {
    this.editorOpen.set(false);
  }

  saveEditor(useAfterSave = false): void {
    const name = this.editorName().trim();
    // Packet filters treat newlines as rule separators; marker expressions
    // treat them as whitespace, so flatten them for that caller.
    const rawExpression = this.editorExpression();
    const expression = (this.data.multiline ? rawExpression : rawExpression.replace(/\r?\n/g, ' ')).trim();
    if (!name || !expression) return;
    if (!this.library.save(name, expression)) return; // the service reports storage failures
    const previousName = this.editingName();
    if (previousName && previousName !== name) this.library.delete(previousName);
    this.selected.set({ name, expression, category: CUSTOM_BPF_CATEGORY, source: 'custom' });
    this.editorOpen.set(false);
    if (useAfterSave) this.dialogRef.close({ expression } satisfies BpfRuleLibraryDialogResult);
  }

  deleteRule(rule: RuleEntry): void {
    this.library.delete(rule.name);
    if (this.isSelected(rule)) this.selected.set(null);
  }

  /** Applies a rule straight away (row double-click). */
  useRule(rule: RuleEntry): void {
    this.dialogRef.close({ expression: rule.expression } satisfies BpfRuleLibraryDialogResult);
  }

  useSelected(): void {
    const selected = this.selected();
    if (!selected) return;
    this.dialogRef.close({ expression: selected.expression } satisfies BpfRuleLibraryDialogResult);
  }

  close(): void {
    this.dialogRef.close();
  }
}
