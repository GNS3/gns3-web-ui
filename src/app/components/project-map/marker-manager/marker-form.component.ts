import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

/** A capture-node dropdown option — one of the link's endpoints. */
export interface MarkerCaptureOption {
  id: string;
  name: string;
}

/**
 * Shared create/edit form for per-link markers — the single source of truth for the
 * marker field layout (BPF, Name, Capture node, Direction, Highlight ms, Color).
 *
 * Presentational: the {@link UntypedFormGroup} (and which controls are disabled) is
 * owned by the parent ({@link MarkerManagerComponent}); this component only renders
 * it and emits {@link save} / {@link cancel}. Because disabled-state is driven by the
 * reactive form control, edit mode (name + `capture_node_id` disabled) just works —
 * the parent disables those controls on the group it passes in.
 *
 * `capture_node_id` is honored only on create (immutable afterwards); definitions
 * don't have it, so this component is used for private per-link markers only.
 */
@Component({
  selector: 'app-marker-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CdkTextareaAutosize,
  ],
  template: `
    <form class="marker-form" [formGroup]="form()" (ngSubmit)="save.emit()">
      <div class="marker-form__row marker-form__row--full">
        <mat-form-field class="marker-form__field">
          <mat-label>BPF expression</mat-label>
          <textarea
            matInput
            formControlName="bpf"
            placeholder="tcp port 80"
            rows="1"
            cdkTextareaAutosize
            cdkAutosizeMinRows="1"
            cdkAutosizeMaxRows="4"
          ></textarea>
          @if (form().get('bpf')?.hasError('required')) {
            <mat-error>BPF is required</mat-error>
          }
        </mat-form-field>
      </div>
      <div class="marker-form__row marker-form__row--identity">
        <mat-form-field class="marker-form__field">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="my-filter" />
          @if (form().get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          } @if (form().get('name')?.hasError('notGlobalName')) {
            <mat-error>Name cannot start with "global"</mat-error>
          }
        </mat-form-field>
        <mat-form-field class="marker-form__field">
          <mat-label>Capture node</mat-label>
          <mat-select formControlName="capture_node_id">
            <mat-option [value]="null">Auto</mat-option>
            @for (ep of captureOptions(); track ep.id) {
              <mat-option [value]="ep.id">{{ ep.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field class="marker-form__field">
          <mat-label>Direction</mat-label>
          <mat-select formControlName="direction">
            <mat-option value="both">Both</mat-option>
            <mat-option value="tx">Tx</mat-option>
            <mat-option value="rx">Rx</mat-option>
          </mat-select>
        </mat-form-field>
        @if (isSerial()) {
          <mat-form-field class="marker-form__field">
            <mat-label>Serial encapsulation</mat-label>
            <mat-select formControlName="data_link_type" matTooltip="WAN encapsulation (matches the router's IOS setting)">
              @for (dlt of dataLinkOptions(); track dlt.value) {
                <mat-option [value]="dlt.value">{{ dlt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </div>
      <div class="marker-form__row marker-form__row--style">
        <mat-form-field class="marker-form__field">
          <mat-label>Highlight ms</mat-label>
          <input matInput type="number" formControlName="highlight_duration" placeholder="500" />
          @if (form().get('highlight_duration')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
          @if (form().get('highlight_duration')?.hasError('min')) {
            <mat-error>Must be ≥ 1</mat-error>
          }
        </mat-form-field>
        <mat-form-field class="marker-form__field">
          <mat-label>Color</mat-label>
          <input matInput type="color" formControlName="color" class="marker-form__color" />
        </mat-form-field>
        <mat-form-field class="marker-form__field">
          <mat-label>Tag</mat-label>
          <input matInput type="number" formControlName="tag" placeholder="—" />
        </mat-form-field>
        <div class="marker-form__actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="form().invalid || submitting()">
            @if (submitting()) {
              <mat-spinner class="marker-form__submit-spinner" [diameter]="16" />
              {{ mode() === 'edit' ? 'Saving…' : 'Adding…' }}
            } @else {
              {{ submitLabel() }}
            }
          </button>
          <button mat-stroked-button type="button" (click)="cancel.emit()">Cancel</button>
        </div>
      </div>
    </form>
  `,
  styleUrl: './marker-form.component.scss',
})
export class MarkerFormComponent {
  /** The reactive form group — owned by the parent. */
  readonly form = input.required<UntypedFormGroup>();
  /** `'create'` (name + capture_node_id editable) or `'edit'` (both disabled by parent). */
  readonly mode = input<'create' | 'edit'>('create');
  /** Endpoint options for the Capture node dropdown (the link's nodes). */
  readonly captureOptions = input<MarkerCaptureOption[]>([]);
  /** Encapsulation (uBridge DLT) options for the Data link type dropdown. */
  readonly dataLinkOptions = input<{ label: string; value: string }[]>([]);
  /** Protocol `link_type` of the link this form targets (`'ethernet'` / `'serial`). */
  readonly linkType = input<string>('ethernet');
  /** WAN encapsulation only applies to serial links — hide the picker on Ethernet. */
  readonly isSerial = computed(() => this.linkType() === 'serial');
  /** Submit button label, derived from mode (`Add` / `Save`). */
  readonly submitLabel = computed(() => (this.mode() === 'edit' ? 'Save' : 'Add'));
  /** When true, the submit button shows a spinner and the label changes to "Saving…" / "Adding…". */
  readonly submitting = input<boolean>(false);
  readonly save = output<void>();
  readonly cancel = output<void>();
}
