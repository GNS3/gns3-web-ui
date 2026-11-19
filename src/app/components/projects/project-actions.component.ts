import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Project } from '@models/project';
import { HasPrivilegeDirective } from '@directives/has-privilege.directive';

export type ProjectActionVariant = 'card' | 'details';

/**
 * The per-project action buttons shared by the card overlay and the details
 * panel — the two clusters render the same actions with the same privilege
 * gates and were verbatim copies before.
 *
 * The variant switches the button style family (`projects__action-button`
 * vs `projects__details-action-btn`) and the two placement-specific
 * entries: the card overlay carries the details/info button, the details
 * panel the unfreeze button. Card clicks stop propagation so they never hit
 * the card link behind the overlay. The start/delete handlers of the
 * details panel additionally close the panel — that stays with the host's
 * event bindings.
 */
@Component({
  selector: 'app-project-actions',
  templateUrl: './project-actions.component.html',
  styleUrl: './project-actions.component.scss',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, HasPrivilegeDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectActionsComponent {
  readonly project = input.required<Project>();
  readonly variant = input.required<ProjectActionVariant>();
  readonly canManageShares = input.required<boolean>();
  readonly canDistribute = input.required<boolean>();
  /** Unfreezing is reserved to the template owner and superadmins. */
  readonly canUnfreeze = input.required<boolean>();
  readonly isFrozen = input.required<boolean>();
  readonly isProvidedByTeacher = input.required<boolean>();
  readonly isProjectLoading = input.required<boolean>();

  readonly start = output<void>();
  readonly stop = output<void>();
  readonly details = output<void>();
  readonly edit = output<void>();
  readonly unfreeze = output<void>();
  readonly duplicate = output<void>();
  readonly distribute = output<void>();
  readonly share = output<void>();
  readonly exportProject = output<void>();
  readonly deleteProject = output<void>();

  private readonly buttonClass = computed(() =>
    this.variant() === 'card' ? 'projects__action-button' : 'projects__details-action-btn',
  );

  /** Base + modifier classes of one action button in the active variant. */
  actionClass(modifier: string): string {
    const base = this.buttonClass();
    return `${base} ${base}--${modifier}`;
  }

  /** Card overlay clicks must not bubble into the card link behind them. */
  onAction(action: { emit: () => void }, event: Event): void {
    if (this.variant() === 'card') {
      event.stopPropagation();
    }
    action.emit();
  }
}
