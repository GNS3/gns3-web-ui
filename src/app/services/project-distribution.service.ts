import { Injectable, inject, signal } from '@angular/core';
import { Subscription, timer, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Controller } from '@models/controller';
import { ProjectDistribution, isTerminalDistributionStatus } from '@models/project';
import { ProjectService } from '@services/project.service';
import { UserPreferencesService } from '@services/user-preferences.service';
import { NotificationCenterService } from '@services/notification-center.service';

/**
 * localStorage key mirrored to the controller's per-user preferences
 * document. The value holds pointers to RUNNING server-side jobs only:
 * a ref is dropped the moment its job reaches a terminal state, so stale
 * refs can only exist when a session died mid-run. Restoring such a ref
 * hits 404 (server restart or retention cleanup) and prunes itself.
 */
const ACTIVE_DISTRIBUTIONS_STORAGE_KEY = 'gns3-active-distributions';

const POLL_INTERVAL_MS = 1000;

/** A distribution job shown in the corner widget. */
export interface TrackedDistribution {
  controller: Controller;
  /** Latest known job state. */
  job: ProjectDistribution;
  /** The server no longer remembers the job (restart or retention cleanup). */
  expired: boolean;
  /** A cancellation request is in flight (guards the Cancel button). */
  cancelPending: boolean;
}

/** Persisted pointer to a running job, so another browser can resume tracking it. */
interface StoredDistributionRef {
  controller_id: number;
  project_id: string;
  distribution_id: string;
  name: string;
  total: number;
}

/**
 * Tracks server-side project distribution jobs and polls their progress.
 *
 * Dismissing a card only stops the tracking: the server job keeps running
 * on its own. `cancel` requests cancellation of a running job; cancellation
 * is cooperative, so "cancelling" is a live state and keeps polling until
 * the job reports "cancelled".
 */
@Injectable({ providedIn: 'root' })
export class ProjectDistributionService {
  private readonly projectService = inject(ProjectService);
  private readonly userPreferences = inject(UserPreferencesService);
  private readonly notifications = inject(NotificationCenterService);

  private readonly trackedState = signal<TrackedDistribution[]>([]);
  /** Poll subscription per distribution_id (running jobs only). */
  private readonly pollers = new Map<string, Subscription>();
  private readonly restoredControllers = new Set<number>();

  /** Jobs to render in the corner widget, oldest first. */
  readonly tracked = this.trackedState.asReadonly();

  /** Starts tracking a job returned by a distribute call or found in the project's job list. */
  track(controller: Controller, job: ProjectDistribution): void {
    if (this.trackedState().some((entry) => entry.job.distribution_id === job.distribution_id)) {
      return;
    }
    if (isTerminalDistributionStatus(job.status)) {
      // A finished job adopted after the fact: only its outcome is news.
      // Prune the ref too, or every later login re-toasts the same summary.
      this.pruneRef(job.distribution_id);
      this.pushSummary(job);
      return;
    }
    const entry: TrackedDistribution = { controller, job, expired: false, cancelPending: false };
    this.trackedState.update((entries) => [...entries, entry]);
    this.writeRef(entry);
    this.startPolling(entry);
  }

  /**
   * Resumes tracking the running jobs referenced by the stored refs for
   * this controller. Called on login: jobs still running come back as
   * cards, finished ones only push their missed outcome notification and
   * forgotten ones (404/403) are pruned silently.
   */
  restore(controller: Controller): void {
    if (!controller || this.restoredControllers.has(controller.id)) {
      return;
    }
    this.restoredControllers.add(controller.id);
    for (const ref of this.readRefs().filter((candidate) => candidate.controller_id === controller.id)) {
      this.projectService.getDistribution(controller, ref.project_id, ref.distribution_id).subscribe({
        next: (job) => this.track(controller, job),
        error: () => this.pruneRef(ref.distribution_id),
      });
    }
  }

  /** Removes the card and stops polling (the server job keeps running). */
  dismiss(distribution_id: string): void {
    this.stopPolling(distribution_id);
    this.trackedState.update((entries) => entries.filter((entry) => entry.job.distribution_id !== distribution_id));
    this.pruneRef(distribution_id);
  }

  /**
   * Stops all tracking and forgets the restore latch (logout / session
   * expiry). The persisted refs are untouched: they live in the outgoing
   * user's server-side preferences document and the same user's next
   * login re-restores them. Without this reset the next user on this
   * browser would inherit the previous user's cards (whose pollers hold
   * a Controller copy with a dead token), while the controller-id latch
   * would keep their own running distributions untracked forever.
   */
  invalidate(): void {
    for (const poller of this.pollers.values()) {
      poller.unsubscribe();
    }
    this.pollers.clear();
    this.trackedState.set([]);
    this.restoredControllers.clear();
  }

  /**
   * Requests cancellation of a running job. The in-flight copy completes
   * before the job stops, so the card moves to "cancelling" and keeps
   * polling; copies already made are kept by their recipients.
   */
  cancel(distribution_id: string): void {
    const entry = this.trackedState().find((candidate) => candidate.job.distribution_id === distribution_id);
    if (!entry || entry.expired || entry.job.status !== 'running' || entry.cancelPending) {
      return;
    }
    this.setCancelPending(distribution_id, true);
    this.projectService.cancelDistribution(entry.controller, entry.job.project_id, distribution_id).subscribe({
      next: (job) => {
        this.setCancelPending(distribution_id, false);
        if (job === null) {
          // 204: the job finished between the last poll and the click, so
          // the server deleted its terminal record instead of cancelling
          // it. There is no state left to poll or re-fetch.
          this.markExpired(distribution_id);
          return;
        }
        this.onPolled(distribution_id, job);
      },
      error: (err: unknown) => {
        this.setCancelPending(distribution_id, false);
        const status = (err as { originalError?: { status?: number } })?.originalError?.status;
        if (status === 409) {
          // The job finished between the last poll and the click: adopt its real state.
          this.projectService
            .getDistribution(entry.controller, entry.job.project_id, distribution_id)
            .subscribe({ next: (job) => this.onPolled(distribution_id, job), error: () => undefined });
          return;
        }
        this.notifications.add(
          'error',
          `Could not cancel the distribution of "${entry.job.name}": ${err instanceof Error ? err.message : 'unknown error'}`
        );
      },
    });
  }

  private startPolling(entry: TrackedDistribution): void {
    const id = entry.job.distribution_id;
    this.stopPolling(id);
    this.pollers.set(
      id,
      timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS)
        .pipe(
          // Errors are mapped into the tick result: an inner error would
          // otherwise kill the whole timer chain and freeze the card at
          // "running" after one transient network hiccup.
          switchMap(() =>
            this.projectService.getDistribution(entry.controller, entry.job.project_id, id).pipe(
              map((job) => ({ job })),
              catchError((err: unknown) => of({ err }))
            )
          )
        )
        .subscribe((event) => {
          if ('job' in event) {
            this.onPolled(id, event.job);
          } else {
            this.onPollError(id, event.err);
          }
        })
    );
  }

  private stopPolling(distribution_id: string): void {
    this.pollers.get(distribution_id)?.unsubscribe();
    this.pollers.delete(distribution_id);
  }

  private onPolled(distribution_id: string, job: ProjectDistribution): void {
    this.trackedState.update((entries) =>
      entries.map((entry) => (entry.job.distribution_id === distribution_id ? { ...entry, job } : entry))
    );
    if (isTerminalDistributionStatus(job.status)) {
      this.stopPolling(distribution_id);
      this.pruneRef(distribution_id);
      this.pushSummary(job);
    }
  }

  private setCancelPending(distribution_id: string, pending: boolean): void {
    this.trackedState.update((entries) =>
      entries.map((entry) => (entry.job.distribution_id === distribution_id ? { ...entry, cancelPending: pending } : entry))
    );
  }

  private onPollError(distribution_id: string, err: unknown): void {
    const status = (err as { originalError?: { status?: number } })?.originalError?.status;
    if (status === 404 || status === 403) {
      // 404: the job record is gone (server restart or retention cleanup) —
      // copies already created are real projects and stay with their owners.
      // 403: a ref left behind by another account on this browser.
      this.markExpired(distribution_id);
    }
    // Other errors (controller briefly unreachable): keep polling.
  }

  /** Stops tracking a job the server no longer remembers; the card says so. */
  private markExpired(distribution_id: string): void {
    this.stopPolling(distribution_id);
    this.pruneRef(distribution_id);
    this.trackedState.update((entries) =>
      entries.map((entry) => (entry.job.distribution_id === distribution_id ? { ...entry, expired: true } : entry))
    );
  }

  private pushSummary(job: ProjectDistribution): void {
    if (job.status === 'failed') {
      this.notifications.add('error', `Distribution of "${job.name}" failed: ${job.error?.message ?? 'unknown error'}`);
      return;
    }
    if (job.status === 'cancelled') {
      this.notifications.add(
        'warning',
        `Cancelled the distribution of "${job.name}" after ${job.results.length} of ${job.total} recipients. Copies already made are kept.`
      );
      return;
    }
    const failed = job.results.filter((result) => !result.project);
    if (failed.length === 0 && job.results.length === 1) {
      const result = job.results[0];
      this.notifications.add(
        'success',
        `Distributed "${result.project?.name ?? job.name}" to ${result.username}. The copy belongs to ${result.username} and will not appear in your projects.`
      );
    } else if (failed.length === 0) {
      this.notifications.add(
        'success',
        `Distributed "${job.name}" to ${job.results.length} users. Each copy is named "${job.name}-{username}", belongs to its recipient and will not appear in your projects.`
      );
    } else {
      this.notifications.add(
        'warning',
        `Distributed "${job.name}" to ${job.results.length - failed.length} of ${job.total} users. Failed: ${failed
          .map((result) => result.username)
          .join(', ')}.`
      );
    }
  }

  private writeRef(entry: TrackedDistribution): void {
    const ref: StoredDistributionRef = {
      controller_id: entry.controller.id,
      project_id: entry.job.project_id,
      distribution_id: entry.job.distribution_id,
      name: entry.job.name,
      total: entry.job.total,
    };
    const refs = this.readRefs().filter((candidate) => candidate.distribution_id !== ref.distribution_id);
    this.userPreferences.setItem(ACTIVE_DISTRIBUTIONS_STORAGE_KEY, JSON.stringify([...refs, ref]));
  }

  private pruneRef(distribution_id: string): void {
    const refs = this.readRefs().filter((candidate) => candidate.distribution_id !== distribution_id);
    this.userPreferences.setItem(ACTIVE_DISTRIBUTIONS_STORAGE_KEY, JSON.stringify(refs));
  }

  private readRefs(): StoredDistributionRef[] {
    try {
      const parsed = JSON.parse(this.userPreferences.getItem(ACTIVE_DISTRIBUTIONS_STORAGE_KEY) ?? '[]');
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(
        (ref): ref is StoredDistributionRef =>
          typeof ref?.controller_id === 'number' &&
          typeof ref?.project_id === 'string' &&
          typeof ref?.distribution_id === 'string' &&
          typeof ref?.name === 'string' &&
          typeof ref?.total === 'number'
      );
    } catch {
      return [];
    }
  }
}
