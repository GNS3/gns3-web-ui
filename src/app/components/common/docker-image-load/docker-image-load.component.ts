import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Controller } from '@models/controller';
import { DockerImageLoadService } from './docker-image-load.service';

/**
 * "Load from tar file" action with inline feedback: uploads a `docker save`
 * archive (plain tar or gzip) to a compute via `/docker/images/load` and shows
 * byte progress followed by the daemon's load phase.
 *
 * Hosts that want the progress somewhere else (e.g. the Image Manager renders
 * it as its own row) inject `DockerImageLoadService` directly instead.
 */
@Component({
  selector: 'app-docker-image-load',
  templateUrl: './docker-image-load.component.html',
  styleUrl: './docker-image-load.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  providers: [DockerImageLoadService],
})
export class DockerImageLoadComponent {
  private load = inject(DockerImageLoadService);

  /** Controller used for the upload request. */
  readonly controller = input.required<Controller>();
  /** Compute that should receive the image. */
  readonly computeId = input('local');
  /** Lets the parent disable the action (e.g. while another one is running). */
  readonly disabled = input(false);
  /**
   * Button emphasis. `raised` matches toolbars whose actions are filled
   * primary buttons; `stroked` fits inline form rows.
   */
  readonly variant = input<'raised' | 'stroked'>('stroked');
  /** Emits the archive file name once the compute finished loading it. */
  readonly imageLoaded = output<string>();

  readonly loadState = this.load.loadState;
  readonly loadProgress = this.load.loadProgress;
  readonly loadFileName = this.load.loadFileName;
  readonly isBusy = this.load.isBusy;
  readonly buttonLabel = this.load.buttonLabel;

  constructor() {
    this.load.imageLoaded.subscribe((fileName) => this.imageLoaded.emit(fileName));
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file || this.disabled()) {
      return;
    }
    this.load.start(this.controller(), this.computeId(), file);
  }

  cancel(): void {
    this.load.cancel();
  }
}
