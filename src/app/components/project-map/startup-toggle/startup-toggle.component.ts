import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StartupToggleState } from '@models/startup-configuration';

/** The ON/OFF startup switch shared by the project dialog and the node configuration tab. */
@Component({
  selector: 'app-startup-toggle',
  standalone: true,
  imports: [MatTooltipModule],
  template: `<button
    type="button"
    class="startup-toggle"
    role="switch"
    [attr.data-state]="state()"
    [attr.aria-checked]="state() === 'on'"
    [attr.aria-label]="label()"
    [attr.aria-description]="description() || null"
    [title]="description()"
    [matTooltip]="tooltip()"
    [disabled]="disabled()"
    (click)="toggled.emit()"
  >
    <span class="startup-toggle-label" aria-hidden="true">{{ state() === 'on' ? 'ON' : 'OFF' }}</span>
  </button>`,
  styleUrl: './startup-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartupToggleComponent {
  readonly state = input.required<StartupToggleState>();
  readonly label = input.required<string>();
  /** Native title and aria-description. */
  readonly description = input('');
  /** Material tooltip, for hosts that prefer it over the native title. */
  readonly tooltip = input('');
  readonly disabled = input(false);
  readonly toggled = output<void>();
}
