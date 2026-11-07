import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { DockerService } from '@services/docker.service';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';

export type DockerImagePullPhase = 'idle' | 'queued' | 'downloading';

/**
 * Pulls a Docker image on a compute and tracks its progress from the global
 * notification stream (`docker.image.pull`, filtered by this request's
 * `progress_id`).
 *
 * The compute processes pulls serially, so the phase stays `queued` until the
 * `started` event arrives. `downloading` reports completed/total layers — the
 * server throttles those events to at most one per second.
 *
 * The HTTP request is blocking: it resolves (204) when the pull finished or
 * fails (409) with the daemon error. Both the event and the HTTP outcome
 * settle the same pull, so completion is reported once.
 */
@Injectable()
export class DockerImagePullService implements OnDestroy {
  private dockerService = inject(DockerService);
  private notificationService = inject(NotificationService);
  private toasterService = inject(ToasterService);

  readonly phase = signal<DockerImagePullPhase>('idle');
  readonly imageName = signal('');
  readonly layersDone = signal(0);
  readonly layersTotal = signal(0);
  readonly message = signal('');
  readonly isPulling = computed(() => this.phase() !== 'idle');

  /** Null when the server has not reported layer counts yet. */
  readonly progressPercent = computed<number | null>(() => {
    const total = this.layersTotal();
    if (total <= 0) {
      return null;
    }
    return Math.min(100, Math.round((100 * this.layersDone()) / total));
  });

  readonly statusLabel = computed(() => {
    if (this.phase() === 'queued') {
      return 'Queued…';
    }
    const total = this.layersTotal();
    if (total > 0) {
      return `${this.layersDone()} / ${total} layers`;
    }
    return 'Downloading…';
  });

  /** Emits the image reference once the pull completed. */
  readonly completed = new Subject<string>();

  private progressId: string | null = null;
  private settled = true;
  private requestSubscription?: Subscription;
  private notificationSubscription?: Subscription;

  start(controller: Controller, image: string, computeId = 'local'): void {
    if (!controller || !image || this.isPulling()) {
      return;
    }

    const progressId = uuid();
    this.progressId = progressId;
    this.settled = false;
    this.imageName.set(image);
    this.layersDone.set(0);
    this.layersTotal.set(0);
    this.message.set('');
    this.phase.set('queued');

    this.notificationSubscription = this.notificationService.dockerImagePullEmitter.subscribe((notification) => {
      const event = notification?.event;
      if (!event || event.progress_id !== progressId) {
        return;
      }
      if (event.compute_id && event.compute_id !== computeId) {
        return;
      }
      switch (event.state) {
        case 'started':
          this.phase.set('downloading');
          break;
        case 'downloading':
          this.phase.set('downloading');
          this.layersTotal.set(event.layers_total ?? 0);
          this.layersDone.set(event.layers_done ?? 0);
          this.message.set(event.message || '');
          break;
        case 'completed':
          this.finish(true, event.message);
          break;
        case 'failed':
          this.finish(false, event.message);
          break;
      }
    });

    this.requestSubscription = this.dockerService.pullImage(controller, image, computeId, progressId).subscribe({
      // The request only resolves once the pull finished; the completed event
      // normally arrives first, this covers a missed notification.
      next: () => this.finish(true),
      error: (err) => this.finish(false, err?.message || err?.error?.message),
    });
  }

  private finish(succeeded: boolean, detail?: string): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    const image = this.imageName();
    this.cleanup();
    this.reset();
    if (succeeded) {
      this.toasterService.success(`Docker image '${image}' pulled`);
      this.completed.next(image);
      return;
    }
    this.toasterService.error(detail || `Failed to pull Docker image '${image}'`);
  }

  private cleanup(): void {
    this.requestSubscription?.unsubscribe();
    this.requestSubscription = undefined;
    this.notificationSubscription?.unsubscribe();
    this.notificationSubscription = undefined;
    this.progressId = null;
  }

  private reset(): void {
    this.phase.set('idle');
    this.imageName.set('');
    this.layersDone.set(0);
    this.layersTotal.set(0);
    this.message.set('');
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
