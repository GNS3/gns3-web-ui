import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * The per-project indicator badges (shared count, distributed, frozen,
 * provided-by-teacher) rendered after the project name. One implementation
 * for the table view and the grid card view — the blocks were verbatim
 * copies that could drift apart.
 *
 * The predicates and the share tooltip text stay with the projects page
 * (they read its state); this component only renders and reports clicks.
 */
@Component({
  selector: 'app-project-badges',
  templateUrl: './project-badges.component.html',
  styleUrl: './project-badges.component.scss',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectBadgesComponent {
  /** Number of shares (from the server; only the owner receives it). */
  readonly shareCount = input.required<number>();
  /** Whether the viewer may manage the shares (opens the manage popover). */
  readonly canManageShares = input.required<boolean>();
  readonly isDistributed = input.required<boolean>();
  readonly isFrozen = input.required<boolean>();
  readonly isProvidedByTeacher = input.required<boolean>();
  /** Tooltip of the share badge (recipient names once they load). */
  readonly shareTooltip = input.required<string>();

  /** Click on the share badge (positioned popover opener). */
  readonly manageSharesClick = output<MouseEvent>();
  /** Hover on the share badge — lazy-loads the recipient names. */
  readonly recipientsHover = output<void>();
  /** Click on the distributed/frozen badge (distribution history). */
  readonly historyClick = output<MouseEvent>();
}
