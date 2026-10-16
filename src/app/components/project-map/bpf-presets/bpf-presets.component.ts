import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BpfPresetsService } from '@services/bpf-presets.service';

@Component({
  selector: 'app-bpf-presets',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './bpf-presets.component.scss',
  template: `
    <div class="bpf-presets__row">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ multiline() ? 'Add BPF preset' : 'Use BPF preset' }}</mat-label>
        <mat-select [value]="null" (selectionChange)="select($event.value); $event.source.value = null">
          <mat-optgroup label="Built-in">
            @for (preset of presets.builtInBpfPresets; track preset.name) {
            <mat-option [value]="preset.expression">{{ preset.name }}: {{ preset.expression }}</mat-option>
            }
          </mat-optgroup>
          @if (presets.customBpfPresets().length) {
          <mat-optgroup label="Custom (this browser)">
            @for (preset of presets.customBpfPresets(); track preset.name) {
            <mat-option [value]="preset.expression">{{ preset.name }}: {{ preset.expression }}</mat-option>
            }
          </mat-optgroup>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Preset name</mat-label>
        <input matInput [formControl]="bpfPresetName" (keydown.enter)="$event.preventDefault(); save()" />
      </mat-form-field>
      <button
        type="button"
        mat-stroked-button
        (click)="save()"
        [disabled]="!bpfPresetName.value.trim() || !expression().trim()"
      >
        Save preset
      </button>
    </div>
    <p class="bpf-presets__hint">Saved in this browser. Use an existing name to update a preset.</p>
    @if (presets.customBpfPresets().length) {
    <div class="bpf-presets__saved" aria-label="Custom BPF presets">
      @for (preset of presets.customBpfPresets(); track preset.name) {
      <button type="button" mat-button (click)="presets.delete(preset.name)">Delete {{ preset.name }}</button>
      }
    </div>
    }
  `,
})
export class BpfPresetsComponent {
  readonly presets = inject(BpfPresetsService);
  readonly expression = input('');
  readonly multiline = input(false);
  readonly expressionChange = output<string>();
  readonly bpfPresetName = new FormControl('', { nonNullable: true });

  select(expression: string) {
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

  save() {
    // Newlines separate packet-filter rules, but are only whitespace in a
    // marker expression. Preserve that distinction when sharing presets.
    const expression = this.multiline() ? this.expression() : this.expression().replace(/\r?\n/g, ' ');
    if (this.presets.save(this.bpfPresetName.value, expression)) this.bpfPresetName.setValue('');
  }
}
