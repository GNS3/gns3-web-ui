import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { DockerImageLoadService } from '@components/common/docker-image-load/docker-image-load.service';
import { DockerImagePullService } from '@services/docker-image-pull.service';
import { Controller } from '@models/controller';
import { DockerImage } from '@models/docker/docker-image';
import { Image, ImageSyncJob } from '@models/images';
import { ControllerService } from '@services/controller.service';
import { DockerService } from '@services/docker.service';
import { ImageManagerService } from '@services/image-manager.service';
import { NotificationService } from '@services/notification.service';
import { ImageUploadEvent, ImageUploadSessionService } from '@services/image-upload-session.service';
import { ToasterService } from '@services/toaster.service';
import { Observable, Subscription, timer, switchMap, exhaustMap, takeWhile, finalize } from 'rxjs';
import { AddImageDialogComponent } from './add-image-dialog/add-image-dialog.component';
import { DockerImagePullDialogComponent } from './docker-image-pull-dialog/docker-image-pull-dialog.component';
import { DeleteAllImageFilesDialogComponent } from './deleteallfiles-dialog/deleteallfiles-dialog.component';
import { ImageTableRow } from './image-database-file';

type ImageViewMode = 'list' | 'grid';
type ImageSortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-image-manager',
  templateUrl: './image-manager.component.html',
  styleUrl: './image-manager.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatSortModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  providers: [DockerImageLoadService, DockerImagePullService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageManagerComponent implements OnInit, OnDestroy {
  controller: Controller;
  controllerId: number;
  readonly searchText = model('');
  readonly viewMode = signal<ImageViewMode>('list');
  readonly selectedImage = signal<ImageTableRow | null>(null);
  readonly filterType = signal('all');
  readonly sortActive = signal('filename');
  readonly sortDirection = signal<ImageSortDirection>('asc');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly rows = signal<ImageTableRow[]>([]);
  readonly syncing = signal(false);

  // Docker images live on the compute's Docker daemon, not in the image
  // directory, but they are merged into the same table as file images so
  // search, the type filter and bulk selection work across all types.
  readonly dockerImages = signal<DockerImage[]>([]);
  /** Registry pull progress, fed by the global `docker.image.pull` stream. */
  readonly dockerPull = inject(DockerImagePullService);
  /** Tar upload state; the progress row lives under the toolbar row. */
  readonly dockerLoad = inject(DockerImageLoadService);
  private dockerLoadSubscription?: Subscription;
  private dockerPullSubscription?: Subscription;
  private dockerDeletedSubscription?: Subscription;
  readonly pageSizeOptions = [5, 10, 25, 50, 100];
  readonly displayedColumns = ['select', 'filename', 'status', 'image_type', 'image_size', 'created_at', 'actions'];
  readonly dateTimeFormatShort = 'yyyy-MM-dd HH:mm';
  readonly dateTimeFormatFull = 'yyyy-MM-dd HH:mm:ss';

  readonly imageTypes = computed(() =>
    Array.from(
      new Set(
        this.rows()
          .map((row) => row.image_type)
          .filter((type): type is string => !!type)
      )
    ).sort((a, b) => a.localeCompare(b))
  );

  readonly filteredRows = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const type = this.filterType();
    let rows = this.rows();

    if (search) {
      rows = rows.filter((row) =>
        [row.filename, row.image_type, row.path, row.checksum, row.uploadStatus, row.availability]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
      );
    }

    if (type !== 'all') {
      rows = rows.filter((row) => row.image_type === type);
    }

    const active = this.sortActive();
    const direction = this.sortDirection();
    if (!active || !direction) {
      return rows;
    }

    return [...rows].sort((left, right) => {
      const a = this.sortValue(left, active);
      const b = this.sortValue(right, active);
      const comparison =
        typeof a === 'number' && typeof b === 'number'
          ? a - b
          : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
      return comparison * (direction === 'asc' ? 1 : -1);
    });
  });

  readonly paginatedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  selectedPaths = new Set<string>();
  /**
   * Bumped on every selection change. Checkbox bindings live inside Material
   * Table's throttled/OnPush view, so mutating a plain Set does not mark them
   * dirty in zoneless mode; reading this signal in the selection getters makes
   * the header and row checkboxes update.
   */
  private readonly selectionVersion = signal(0);
  highlightedFilename: string | null = null;

  private images: Image[] = [];
  private uploadRows = new Map<string, ImageTableRow>();
  private uploadEventsSubscription: Subscription;
  private queryParamsSubscription: Subscription;
  private refreshAfterUploadTimer: ReturnType<typeof setTimeout>;
  private highlightTimer: ReturnType<typeof setTimeout>;
  private lastSelectedKey: string | null = null;
  private syncSubscription?: Subscription;
  private destroyed = false;

  private imageService = inject(ImageManagerService);
  private dockerService = inject(DockerService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);
  private imageUploadSessionService = inject(ImageUploadSessionService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.controllerId = parseInt(this.route.snapshot.paramMap.get('controller_id'), 10);

    this.uploadEventsSubscription = this.imageUploadSessionService.events$.subscribe((event: ImageUploadEvent) => {
      this.onUploadEvent(event);
    });

    this.queryParamsSubscription = this.route.queryParams.subscribe((params) => {
      if (params['highlight']) {
        this.flashRow(params['highlight']);
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      }
    });

    // Refresh the table when a tar archive finished loading on the compute.
    this.dockerLoadSubscription = this.dockerLoad.imageLoaded.subscribe(() => this.getDockerImages());
    // Refresh after a registry pull completes.
    this.dockerPullSubscription = this.dockerPull.completed.subscribe(() => this.getDockerImages());
    // Another client (or session) may delete an image; the server announces
    // it on the global stream so every open Image Manager stays in sync.
    this.dockerDeletedSubscription = this.notificationService.dockerImageDeletedEmitter.subscribe((notification) => {
      const computeId = notification?.event?.compute_id;
      if (!computeId || computeId === 'local') {
        this.getDockerImages();
      }
    });

    this.controllerService.get(this.controllerId).then(
      (controller: Controller) => {
        if (this.destroyed) return;
        this.controller = controller;
        if (controller.authToken) {
          this.getImages();
          this.getDockerImages();
          const pendingJob = this.pendingSyncJob();
          if (pendingJob) this.followSync(this.pollSyncJob(pendingJob));
        }
      },
      (err) => {
        if (this.destroyed) return;
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.syncSubscription?.unsubscribe();
    this.uploadEventsSubscription?.unsubscribe();
    this.queryParamsSubscription?.unsubscribe();
    this.dockerLoadSubscription?.unsubscribe();
    this.dockerPullSubscription?.unsubscribe();
    this.dockerDeletedSubscription?.unsubscribe();
    if (this.refreshAfterUploadTimer) {
      clearTimeout(this.refreshAfterUploadTimer);
    }
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }
  }

  /** List the Docker images present on the local compute's Docker daemon. */
  getDockerImages(): void {
    if (!this.controller) return;
    this.dockerService.getImagesForCompute(this.controller, 'local').subscribe({
      next: (images) => {
        this.dockerImages.set(images || []);
        this.refreshTableRows();
        this.cd.markForCheck();
      },
      error: () => {
        // The image page stays usable when the compute has no Docker support.
        this.dockerImages.set([]);
        this.refreshTableRows();
        this.cd.markForCheck();
      },
    });
  }

  /** Start a tar upload from the toolbar's hidden file input. */
  onDockerLoadFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.controller) return;
    this.dockerLoad.start(this.controller, 'local', file);
  }

  /** Ask for an image reference and pull it onto the local compute. */
  openPullDockerImageDialog(): void {
    const dialogRef = this.dialog.open(DockerImagePullDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel', 'docker-image-pull-dialog-panel'],
      autoFocus: 'input',
    });
    dialogRef.afterClosed().subscribe((image: string | undefined) => {
      const name = image?.trim();
      if (!name || !this.controller) return;
      this.dockerPull.start(this.controller, name, 'local');
    });
  }

  /** Remove a Docker image from the local daemon, offering force on a 409. */
  deleteDockerImage(row: ImageTableRow): void {
    const image = row?.dockerImage;
    if (!image || !this.controller) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete Docker image?',
        message: `"${image}" will be removed from the local server.`,
        note: 'Containers using this image are not deleted.',
        confirmButtonText: 'Delete image',
        tone: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }
      this.removeDockerImage(image, false);
    });
  }

  /**
   * Delete a Docker image. A 409 carries a structured `code` identifying the
   * conflict; each code is confirmed at most once, so forcing past template
   * references can still surface the running-container conflict, but a code
   * repeating after its confirmation is reported instead of looping.
   */
  private removeDockerImage(image: string, force: boolean, confirmedCode?: string): void {
    this.dockerService.deleteImage(this.controller, 'local', image, force).subscribe({
      next: () => {
        if (this.selectedImage()?.dockerImage === image) {
          this.closeDetails();
        }
        this.getDockerImages();
        this.toasterService.success(`Docker image '${image}' deleted`);
        this.cd.markForCheck();
      },
      error: (err) => {
        // HttpController rewrites failures to ControllerError; the parsed
        // response body ({message, code, details}) stays on
        // `originalError.error`.
        const body = err?.originalError?.error ?? err?.error;
        const status = err?.originalError?.status ?? err?.status;
        const code = body?.code;
        if (status === 409 && code && code !== confirmedCode) {
          this.confirmForceRemoveDockerImage(image, code, body, err?.message);
          return;
        }
        const message = err?.message || body?.message || `Failed to delete Docker image '${image}'`;
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  private confirmForceRemoveDockerImage(image: string, code: string, body: any, fallbackMessage?: string): void {
    const isTemplateConflict = code === 'image_referenced_by_templates';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: isTemplateConflict
        ? {
            title: 'Image is used by templates',
            message: `"${image}" is referenced by templates. Nodes created from these templates cannot start once the image is deleted.`,
            details: body?.details?.referenced_by_templates?.length
              ? body.details.referenced_by_templates
              : undefined,
            note: 'Deleting the image does not delete the templates.',
            confirmButtonText: 'Delete anyway',
            tone: 'warning',
          }
        : {
            title: 'Image is in use',
            // compute_conflict messages are already human readable (node + project).
            message: body?.message || fallbackMessage || `"${image}" is still in use.`,
            note: 'Force removal may break the node that uses this image.',
            confirmButtonText: 'Force remove',
            tone: 'warning',
          },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }
      this.removeDockerImage(image, true, code);
    });
  }

  getImages(): void {
    this.imageService.getImages(this.controller).subscribe({
      next: (images: Image[]) => {
        this.images = images || [];
        this.syncUploadedRowsWithPersistedData();
        this.refreshTableRows();
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to get images';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  syncImages(): void {
    if (this.destroyed || !this.controller || this.syncing()) return;
    const pendingJob = this.pendingSyncJob();
    if (pendingJob) {
      this.followSync(this.pollSyncJob(pendingJob));
      return;
    }
    this.followSync(
      this.imageService.syncImages(this.controller).pipe(
        switchMap((job) => {
          try {
            sessionStorage.setItem(this.syncStorageKey(), job.job_id);
          } catch {
            /* Polling still works without browser storage. */
          }
          return this.pollSyncJob(job.job_id);
        })
      )
    );
  }

  private pendingSyncJob(): string | null {
    try {
      return sessionStorage.getItem(this.syncStorageKey());
    } catch {
      return null; // Storage can be unavailable in restricted browser contexts.
    }
  }

  private syncStorageKey(): string {
    return `gns3-image-sync-${this.controller.id}`;
  }

  private pollSyncJob(jobId: string): Observable<ImageSyncJob> {
    return timer(0, 1000).pipe(
      exhaustMap(() => this.imageService.getSyncJob(this.controller, jobId)),
      takeWhile((result) => result.status === 'queued' || result.status === 'running', true)
    );
  }

  private followSync(source: Observable<ImageSyncJob>): void {
    this.syncing.set(true);
    this.syncSubscription = source.pipe(finalize(() => this.syncing.set(false))).subscribe({
      next: (job) => {
        if (job.status === 'queued' || job.status === 'running') return;
        try {
          sessionStorage.removeItem(this.syncStorageKey());
        } catch {
          /* Storage is optional. */
        }
        this.getImages();
        const message = this.syncResultMessage(job);
        if (job.status === 'completed') {
          this.toasterService.success(message);
        } else if (job.status === 'partial') {
          this.toasterService.warning(message);
        } else {
          this.toasterService.error(`${message}. You can retry synchronization.`);
        }
      },
      error: (err) => {
        if (err.status === 404) {
          try {
            sessionStorage.removeItem(this.syncStorageKey());
          } catch {
            /* Storage is optional. */
          }
        }
        this.toasterService.error(
          err.error?.message || err.error?.detail || err.message || 'Failed to synchronize images'
        );
      },
    });
  }

  private syncResultMessage(job: ImageSyncJob): string {
    const status = job.status.charAt(0).toUpperCase() + job.status.slice(1);
    const counts = ['scanned', 'added', 'updated', 'missing', 'deferred', 'errors']
      .map((name) => `${job.counts[name] || 0} ${name}`)
      .join(' · ');
    const details = job.errors.slice(0, 5).map((error) => `${error.path}: ${error.reason}`);
    if (job.counts['errors'] > details.length) {
      details.push(`Showing the first ${details.length} issues. Synchronize again after resolving them.`);
    }
    return [`Synchronization: ${status} · ${counts}`, ...details].join('\n');
  }

  onPageEvent(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.unChecked();
    this.resetPage();
  }

  onTypeFilterChange(value: string): void {
    this.filterType.set(value);
    this.unChecked();
    this.resetPage();
  }

  onSortByChange(value: string): void {
    this.sortActive.set(value);
    if (!this.sortDirection()) {
      this.sortDirection.set('asc');
    }
    this.resetPage();
  }

  onSortChange(sort: Sort): void {
    this.sortActive.set(sort.active || 'filename');
    this.sortDirection.set(sort.direction);
    this.resetPage();
  }

  toggleView(mode: ImageViewMode): void {
    this.viewMode.set(mode);
  }

  selectImage(row: ImageTableRow): void {
    this.selectedImage.set(row);
  }

  closeDetails(): void {
    this.selectedImage.set(null);
  }

  isHighlighted(row: ImageTableRow): boolean {
    return !!this.highlightedFilename && row.filename === this.highlightedFilename;
  }

  isPersistedRow(row: ImageTableRow): boolean {
    return row?.rowType === 'image';
  }

  isDockerRow(row: ImageTableRow): boolean {
    return row?.rowType === 'docker';
  }

  /** Checkbox-selectable rows: file images and Docker images (not uploads). */
  isSelectableRow(row: ImageTableRow): boolean {
    return row?.rowType === 'image' || row?.rowType === 'docker';
  }

  hasUploadState(row: ImageTableRow): boolean {
    return row?.rowType === 'upload';
  }

  formatImageSize(row: ImageTableRow): string {
    // Pre-3.1 computes do not report Docker image sizes, so "unknown" must not
    // be rendered as a real 0 MB.
    if (row.image_size == null) {
      return '—';
    }
    const size = Number(row.image_size);
    if (!size) {
      return '0 MB';
    }
    return `${(size / 1_000_000).toFixed(2)} MB`;
  }

  imageTypeIcon(row: ImageTableRow): string {
    const type = (row.image_type || '').toLowerCase();
    if (type.includes('docker')) return 'deployed_code';
    if (type.includes('qemu') || type.includes('disk')) return 'hard_drive';
    if (type.includes('iou') || type.includes('ios')) return 'router';
    return 'memory';
  }

  imageStatusLabel(row: ImageTableRow): string {
    return this.hasUploadState(row) ? row.uploadStatus || 'queued' : row.availability || 'Available';
  }

  imageStatusIsError(row: ImageTableRow): boolean {
    return this.hasUploadState(row)
      ? row.uploadStatus === 'error'
      : ['missing', 'invalid', 'unavailable'].includes(row.availability || '');
  }

  deleteFile(path: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete image?',
        message: 'This image will be permanently deleted.',
        note: 'This action cannot be undone.',
        confirmButtonText: 'Delete image',
        tone: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.imageService.deleteFile(this.controller, path).subscribe({
        next: () => {
          if (this.selectedImage()?.path === path) {
            this.closeDetails();
          }
          this.getImages();
          this.unChecked();
          this.toasterService.success('File deleted');
          this.cd.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to delete file';
          this.toasterService.error(message);
          this.getImages();
          this.unChecked();
          this.cd.markForCheck();
        },
      });
    });
  }

  cancelUpload(row: ImageTableRow): void {
    if (!row?.tempId) {
      return;
    }
    this.imageUploadSessionService.requestCancel(row.tempId);
    this.toasterService.warning('Image file uploading canceled');
  }

  onRowCheckboxClick(event: MouseEvent, row: ImageTableRow): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isSelectableRow(row)) {
      return;
    }

    const key = this.rowKey(row);
    const shouldSelect = !this.isRowSelected(row);
    if (event.shiftKey && this.lastSelectedKey) {
      const selectedRange = this.selectRowRange(this.lastSelectedKey, key, shouldSelect);
      if (!selectedRange) {
        this.toggleRowSelection(row, shouldSelect);
      }
    } else {
      this.toggleRowSelection(row, shouldSelect);
    }
    this.lastSelectedKey = key || null;
  }

  trackByRow(index: number, row: ImageTableRow): string {
    // MatTable calls the trackBy function detached from the component, so this
    // method must not rely on `this`. Inline the row key here.
    return (
      row?.tempId ||
      row?.path ||
      (row?.dockerImage ? `docker:${row.dockerImage}` : '') ||
      `${row?.filename}-${index}`
    );
  }

  private rowKey(row: ImageTableRow): string {
    return row.tempId || row.path || (row.dockerImage ? `docker:${row.dockerImage}` : '');
  }

  isAllSelected(): boolean {
    this.selectionVersion();
    const selectableKeys = new Set(
      this.getSelectableRows()
        .map((row) => this.rowKey(row))
        .filter((key): key is string => !!key)
    );
    const numSelected = Array.from(this.selectedPaths).filter((key) => selectableKeys.has(key)).length;
    return selectableKeys.size > 0 && numSelected === selectableKeys.size;
  }

  selectAllImages(): void {
    this.isAllSelected() ? this.unChecked() : this.allChecked();
  }

  unChecked(): void {
    this.selectedPaths.clear();
    this.lastSelectedKey = null;
    this.touchSelection();
  }

  allChecked(): void {
    this.getSelectableRows().forEach((row) => {
      const key = this.rowKey(row);
      if (key) {
        this.selectedPaths.add(key);
      }
    });
    this.touchSelection();
  }

  private touchSelection(): void {
    this.selectionVersion.update((version) => version + 1);
  }

  hasSelection(): boolean {
    this.selectionVersion();
    return this.selectedPaths.size > 0;
  }

  selectedCount(): number {
    this.selectionVersion();
    return this.selectedPaths.size;
  }

  installAllImages(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-neutral-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Install all images?',
        message:
          'GNS3 will attempt to create templates automatically from the available image checksums. ' +
          'Docker images are not included in this automatic installation; use Pull Docker Image or Load from tar file instead.',
        confirmButtonText: 'Install images',
        tone: 'neutral',
        icon: 'install_desktop',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.imageService.installImages(this.controller).subscribe({
          next: () => {
            this.toasterService.success('Images installed');
            this.cd.markForCheck();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to install images';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      }
    });
  }

  pruneImages(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Prune unused images?',
        message:
          'All image files that are not used by a template will be permanently deleted. ' +
          'Docker images are not affected, because they are managed separately by the Docker daemon.',
        note: 'This action cannot be undone.',
        confirmButtonText: 'Prune images',
        tone: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.imageService.pruneImages(this.controller).subscribe({
          next: () => {
            this.getImages();
            this.unChecked();
            this.toasterService.success('Images pruned');
            this.cd.markForCheck();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to prune images';
            this.toasterService.error(message);
            this.getImages();
            this.unChecked();
            this.cd.markForCheck();
          },
        });
      }
    });
  }

  addImageDialog(): void {
    const dialogRef = this.dialog.open(AddImageDialogComponent, {
      panelClass: ['base-dialog-panel', 'add-image-dialog-panel', 'dialog-small-panel'],
      autoFocus: false,
      data: this.controller,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getImages();
      this.unChecked();
    });
  }

  deleteAllFiles(): void {
    const images = this.getSelectedRows();
    const confirmationRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete selected images?',
        message: `${images.length} selected ${images.length === 1 ? 'image' : 'images'} will be permanently deleted.`,
        details: images.map((image) => image.filename),
        note: 'Images used by templates or running containers will be reported and kept.',
        confirmButtonText: images.length === 1 ? 'Delete image' : 'Delete images',
        tone: 'danger',
      },
    });

    confirmationRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      this.openImageDeletionProgress(images);
    });
  }

  private openImageDeletionProgress(images: ImageTableRow[]): void {
    const dialogRef = this.dialog.open(DeleteAllImageFilesDialogComponent, {
      panelClass: [
        'base-confirmation-dialog-panel',
        'confirmation-danger-panel',
        'delete-all-images-dialog-panel',
        'dialog-small-panel',
      ],
      autoFocus: false,
      disableClose: true,
      data: {
        controller: this.controller,
        computeId: 'local',
        deleteFilesPaths: images,
        autoStart: true,
      },
    });

    dialogRef.afterClosed().subscribe((allFilesDeleted: boolean) => {
      this.unChecked();
      this.getImages();
      // Selected rows may include Docker images, which live on the daemon.
      this.getDockerImages();
      if (allFilesDeleted) {
        this.toasterService.success('All files deleted');
      }
    });
  }

  private resetPage(): void {
    this.pageIndex.set(0);
  }

  private sortValue(row: ImageTableRow, active: string): string | number {
    if (active === 'image_size') {
      return Number(row.image_size || 0);
    }
    if (active === 'created_at' || active === 'updated_at') {
      const value = row[active];
      return value ? new Date(value).getTime() : 0;
    }
    return String(row[active as keyof ImageTableRow] || '').toLowerCase();
  }

  private flashRow(filename: string): void {
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.highlightedFilename = filename;
    this.highlightTimer = setTimeout(() => {
      this.highlightedFilename = null;
      this.cd.markForCheck();
    }, 2000);
  }

  private onUploadEvent(event: ImageUploadEvent): void {
    if (!event) {
      return;
    }

    if (event.status === 'canceled') {
      this.uploadRows.delete(event.tempId);
      if (this.selectedImage()?.tempId === event.tempId) {
        this.closeDetails();
      }
      this.refreshTableRows();
      return;
    }

    const existing = this.uploadRows.get(event.tempId);
    const uploadRow: ImageTableRow = {
      rowType: 'upload',
      tempId: event.tempId,
      filename: event.filename,
      path: event.path,
      image_type: event.image_type,
      image_size: event.image_size,
      uploadProgress: event.progress,
      uploadStatus: event.status,
      errorMessage: event.errorMessage,
      created_at: '',
      updated_at: '',
    };

    this.uploadRows.set(event.tempId, { ...(existing || {}), ...uploadRow });
    this.refreshTableRows();

    if (event.status === 'uploaded') {
      this.scheduleImagesRefresh();
    }
  }

  private scheduleImagesRefresh(): void {
    if (this.refreshAfterUploadTimer) {
      clearTimeout(this.refreshAfterUploadTimer);
    }

    this.refreshAfterUploadTimer = setTimeout(() => {
      this.getImages();
    }, 300);
  }

  private refreshTableRows(): void {
    const persistedRows: ImageTableRow[] = this.images.map((image: Image) => ({
      ...image,
      rowType: 'image' as const,
    }));
    // Docker images are not files on disk, but they belong in the same table so
    // search, the type filter and sorting work across every image type.
    const dockerRows: ImageTableRow[] = this.dockerImages().map((image) => ({
      rowType: 'docker' as const,
      filename: image.image,
      image_type: 'docker',
      image_size: image.size,
      created_at: image.created != null ? new Date(Number(image.created) * 1000).toISOString() : undefined,
      availability: 'available',
      dockerImage: image.image,
      dockerId: image.id,
    }));
    const uploadingRows = Array.from(this.uploadRows.values());
    const rows = [...uploadingRows, ...persistedRows, ...dockerRows];
    this.removeInvalidSelections([...persistedRows, ...dockerRows]);
    this.rows.set(rows);

    const selected = this.selectedImage();
    if (selected) {
      const selectedKey = this.rowKey(selected);
      const refreshedSelection = rows.find((row) => this.rowKey(row) === selectedKey);
      this.selectedImage.set(refreshedSelection || null);
    }

    const lastPage = Math.max(0, Math.ceil(this.filteredRows().length / this.pageSize()) - 1);
    if (this.pageIndex() > lastPage) {
      this.pageIndex.set(lastPage);
    }
  }

  private removeInvalidSelections(validRows: ImageTableRow[]): void {
    const validKeys = new Set(validRows.map((row) => this.rowKey(row)).filter((key): key is string => !!key));
    let changed = false;
    Array.from(this.selectedPaths).forEach((key) => {
      if (!validKeys.has(key)) {
        this.selectedPaths.delete(key);
        changed = true;
      }
    });
    if (changed) {
      this.touchSelection();
    }
    if (this.lastSelectedKey && !validKeys.has(this.lastSelectedKey)) {
      this.lastSelectedKey = null;
    }
  }

  private syncUploadedRowsWithPersistedData(): void {
    const persistedNames = new Set(this.images.map((image) => image.filename));
    const persistedPaths = new Set(this.images.map((image) => image.path));
    this.uploadRows.forEach((row, key) => {
      if (
        row.uploadStatus === 'uploaded' &&
        (row.path ? persistedPaths.has(row.path) : persistedNames.has(row.filename))
      ) {
        this.uploadRows.delete(key);
      }
    });
  }

  private getSelectableRows(): ImageTableRow[] {
    return this.filteredRows().filter((row) => this.isSelectableRow(row));
  }

  private getVisibleSelectableRows(): ImageTableRow[] {
    return this.paginatedRows().filter((row) => this.isSelectableRow(row));
  }

  private selectRowRange(fromKey: string, toKey: string, shouldSelect: boolean): boolean {
    const visibleRows = this.getVisibleSelectableRows();
    const fromIndex = visibleRows.findIndex((row) => this.rowKey(row) === fromKey);
    const toIndex = visibleRows.findIndex((row) => this.rowKey(row) === toKey);

    if (fromIndex < 0 || toIndex < 0) {
      return false;
    }

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    visibleRows.slice(start, end + 1).forEach((row) => this.toggleRowSelection(row, shouldSelect));
    return true;
  }

  private toggleRowSelection(row: ImageTableRow, shouldSelect: boolean): void {
    if (shouldSelect) {
      this.selectRow(row);
      return;
    }
    this.deselectRow(row);
  }

  isRowSelected(row: ImageTableRow): boolean {
    this.selectionVersion();
    const key = this.rowKey(row);
    return !!key && this.selectedPaths.has(key);
  }

  /** Whether this row is the one currently shown in the details panel. */
  isDetailsRow(row: ImageTableRow): boolean {
    const selected = this.selectedImage();
    // Docker rows have no path, so comparing paths would match every docker
    // row at once (`undefined === undefined`); compare unified row keys.
    return !!selected && this.rowKey(selected) === this.rowKey(row);
  }

  private selectRow(row: ImageTableRow): void {
    const key = this.rowKey(row);
    if (key) {
      this.selectedPaths.add(key);
      this.touchSelection();
    }
  }

  private deselectRow(row: ImageTableRow): void {
    const key = this.rowKey(row);
    if (key) {
      this.selectedPaths.delete(key);
      this.touchSelection();
    }
  }

  private getSelectedRows(): ImageTableRow[] {
    return this.rows().filter((row) => {
      const key = this.rowKey(row);
      return this.isSelectableRow(row) && !!key && this.selectedPaths.has(key);
    });
  }
}
