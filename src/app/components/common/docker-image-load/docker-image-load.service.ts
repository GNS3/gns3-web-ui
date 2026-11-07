import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { Controller } from '@models/controller';
import { DockerService } from '@services/docker.service';
import { ToasterService } from '@services/toaster.service';

export type DockerImageLoadState = 'idle' | 'uploading' | 'loading';

/**
 * Upload state for a `docker save` archive (plain tar or gzip).
 *
 * The request streams bytes first (`uploading`, determinate progress) and then
 * waits for the blocking 204 while the compute's Docker daemon loads the image
 * (`loading`, indeterminate). Cancelling aborts the XHR; the server recovers
 * on its own.
 *
 * Provide it per host component so a page and the shared dialog do not share
 * a single upload slot.
 */
@Injectable()
export class DockerImageLoadService implements OnDestroy {
  private dockerService = inject(DockerService);
  private toasterService = inject(ToasterService);

  readonly loadState = signal<DockerImageLoadState>('idle');
  readonly loadProgress = signal(0);
  readonly loadFileName = signal('');
  readonly isBusy = computed(() => this.loadState() !== 'idle');
  readonly buttonLabel = computed(() => {
    switch (this.loadState()) {
      case 'uploading':
        return `Loading ${this.loadProgress()}%`;
      case 'loading':
        return 'Loading…';
      default:
        return 'Load from tar file';
    }
  });

  /** Emits the archive name once the compute finished loading the image. */
  readonly imageLoaded = new Subject<string>();

  private subscription?: Subscription;

  start(controller: Controller, computeId: string, file: File): void {
    if (!file || !controller || this.isBusy()) {
      return;
    }

    this.loadFileName.set(file.name);
    this.loadProgress.set(0);
    this.loadState.set('uploading');

    this.subscription = this.dockerService.loadImage(controller, computeId, file).subscribe({
      next: (httpEvent) => {
        if (httpEvent.type === HttpEventType.UploadProgress) {
          const percent = httpEvent.total ? Math.round((100 * httpEvent.loaded) / httpEvent.total) : 0;
          this.loadProgress.set(percent);
          if (percent >= 100) {
            // All bytes transferred; the request stays open until docker load finishes.
            this.loadState.set('loading');
          }
        } else if (httpEvent.type === HttpEventType.Response) {
          const fileName = this.loadFileName();
          this.reset();
          this.toasterService.success(`Docker image '${fileName}' loaded`);
          this.imageLoaded.next(fileName);
        }
      },
      error: (err) => {
        this.reset();
        const message = err?.error?.message || err?.message || `Failed to load Docker image '${file.name}'`;
        this.toasterService.error(message);
      },
    });
  }

  cancel(): void {
    // Unsubscribing aborts the underlying XHR; the server recovers on its own.
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.reset();
    this.toasterService.warning('Docker image load cancelled');
  }

  private reset(): void {
    this.loadState.set('idle');
    this.loadProgress.set(0);
    this.loadFileName.set('');
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
