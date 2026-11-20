import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TrackedDistribution, ProjectDistributionService } from '@services/project-distribution.service';
import { ProjectDistribution } from '@models/project';

/** Fully successful jobs linger this long before the card disappears on its own. */
const AUTO_DISMISS_MS = 6000;

/**
 * Corner stack of running project distributions (bottom right). Mounted in
 * the app shell next to the notification center; renders nothing when no
 * job is tracked. Dismissing a card only stops the tracking — the server
 * job keeps running.
 */
@Component({
  selector: 'app-distribution-tasks',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './distribution-tasks.component.html',
  styleUrl: './distribution-tasks.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistributionTasksComponent implements OnDestroy {
  private readonly distributionService = inject(ProjectDistributionService);
  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());
  private readonly autoDismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly tracked = this.distributionService.tracked;

  constructor() {
    // Fully successful jobs dismiss themselves once their final state has
    // been on screen long enough to be read.
    effect(() => {
      for (const entry of this.tracked()) {
        const id = entry.job.distribution_id;
        if (this.isCompleteSuccess(entry) && !this.autoDismissTimers.has(id)) {
          this.autoDismissTimers.set(
            id,
            setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS)
          );
        }
      }
    });
  }

  ngOnDestroy(): void {
    for (const pending of this.autoDismissTimers.values()) {
      clearTimeout(pending);
    }
  }

  toggleExpanded(distribution_id: string): void {
    this.expandedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(distribution_id)) {
        next.delete(distribution_id);
      } else {
        next.add(distribution_id);
      }
      return next;
    });
  }

  dismiss(distribution_id: string): void {
    const pending = this.autoDismissTimers.get(distribution_id);
    if (pending) {
      clearTimeout(pending);
      this.autoDismissTimers.delete(distribution_id);
    }
    this.distributionService.dismiss(distribution_id);
  }

  cancel(distribution_id: string): void {
    this.distributionService.cancel(distribution_id);
  }

  isExpanded(distribution_id: string): boolean {
    return this.expandedIds().has(distribution_id);
  }

  iconFor(entry: TrackedDistribution): string {
    if (entry.expired) {
      return 'help_outline';
    }
    switch (entry.job.status) {
      case 'running':
      case 'cancelling':
        return 'autorenew';
      case 'failed':
        return 'error';
      case 'completed':
        return entry.job.results.some((result) => !result.project) ? 'warning' : 'check_circle';
      case 'cancelled':
        return 'cancel';
    }
  }

  isRunning(entry: TrackedDistribution): boolean {
    return !entry.expired && entry.job.status === 'running';
  }

  isCancelling(entry: TrackedDistribution): boolean {
    return !entry.expired && entry.job.status === 'cancelling';
  }

  /** The job is still working (an in-flight copy counts as work). */
  isActive(entry: TrackedDistribution): boolean {
    return this.isRunning(entry) || this.isCancelling(entry);
  }

  progress(job: ProjectDistribution): number {
    return job.total > 0 ? (job.completed / job.total) * 100 : 0;
  }

  remaining(job: ProjectDistribution): number {
    return Math.max(0, job.total - job.results.length);
  }

  private isCompleteSuccess(entry: TrackedDistribution): boolean {
    return entry.job.status === 'completed' && !entry.expired && entry.job.results.every((result) => result.project);
  }
}
