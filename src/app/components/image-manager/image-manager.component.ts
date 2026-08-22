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
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Controller } from '@models/controller';
import { Image } from '@models/images';
import { ControllerService } from '@services/controller.service';
import { ImageManagerService } from '@services/image-manager.service';
import { ImageUploadEvent, ImageUploadSessionService } from '@services/image-upload-session.service';
import { ToasterService } from '@services/toaster.service';
import { Subscription } from 'rxjs';
import { AddImageDialogComponent } from './add-image-dialog/add-image-dialog.component';
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
  ],
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
  readonly pageSizeOptions = [5, 10, 25, 50, 100];
  readonly displayedColumns = ['select', 'filename', 'image_type', 'image_size', 'created_at', 'actions'];

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
        [row.filename, row.image_type, row.path, row.checksum, row.uploadStatus]
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
  highlightedFilename: string | null = null;

  private images: Image[] = [];
  private uploadRows = new Map<string, ImageTableRow>();
  private uploadEventsSubscription: Subscription;
  private queryParamsSubscription: Subscription;
  private refreshAfterUploadTimer: ReturnType<typeof setTimeout>;
  private highlightTimer: ReturnType<typeof setTimeout>;
  private lastSelectedPath: string | null = null;

  private imageService = inject(ImageManagerService);
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

    this.controllerService.get(this.controllerId).then(
      (controller: Controller) => {
        this.controller = controller;
        if (controller.authToken) {
          this.getImages();
        }
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  ngOnDestroy(): void {
    this.uploadEventsSubscription?.unsubscribe();
    this.queryParamsSubscription?.unsubscribe();
    if (this.refreshAfterUploadTimer) {
      clearTimeout(this.refreshAfterUploadTimer);
    }
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }
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

  hasUploadState(row: ImageTableRow): boolean {
    return row?.rowType === 'upload';
  }

  formatImageSize(row: ImageTableRow): string {
    const size = Number(row.image_size || 0);
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
    return this.hasUploadState(row) ? row.uploadStatus || 'queued' : 'Available';
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

    if (!this.isPersistedRow(row)) {
      return;
    }

    const shouldSelect = !this.isRowSelected(row);
    if (event.shiftKey && this.lastSelectedPath) {
      const selectedRange = this.selectRowRange(this.lastSelectedPath, row.path, shouldSelect);
      if (!selectedRange) {
        this.toggleRowSelection(row, shouldSelect);
      }
    } else {
      this.toggleRowSelection(row, shouldSelect);
    }
    this.lastSelectedPath = row.path || null;
  }

  trackByRow(index: number, row: ImageTableRow): string {
    return row.tempId || row.path || `${row.filename}-${index}`;
  }

  isAllSelected(): boolean {
    const selectablePaths = new Set(
      this.getSelectableRows()
        .map((row) => row.path)
        .filter((path): path is string => !!path)
    );
    const numSelected = Array.from(this.selectedPaths).filter((path) => selectablePaths.has(path)).length;
    return selectablePaths.size > 0 && numSelected === selectablePaths.size;
  }

  selectAllImages(): void {
    this.isAllSelected() ? this.unChecked() : this.allChecked();
  }

  unChecked(): void {
    this.selectedPaths.clear();
    this.lastSelectedPath = null;
  }

  allChecked(): void {
    this.getSelectableRows().forEach((row) => {
      if (row.path) {
        this.selectedPaths.add(row.path);
      }
    });
  }

  hasSelection(): boolean {
    return this.selectedPaths.size > 0;
  }

  selectedCount(): number {
    return this.selectedPaths.size;
  }

  installAllImages(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-neutral-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Install all images?',
        message: 'GNS3 will attempt to create templates automatically from the available image checksums.',
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
        message: 'All images that are not used by a template will be permanently deleted.',
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
        note: 'Images used by templates will be reported and kept.',
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
        deleteFilesPaths: images,
        autoStart: true,
      },
    });

    dialogRef.afterClosed().subscribe((allFilesDeleted: boolean) => {
      this.unChecked();
      this.getImages();
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
    const uploadingRows = Array.from(this.uploadRows.values());
    const rows = [...uploadingRows, ...persistedRows];
    this.removeInvalidSelections(persistedRows);
    this.rows.set(rows);

    const selected = this.selectedImage();
    if (selected) {
      const selectedKey = selected.tempId || selected.path;
      const refreshedSelection = rows.find((row) => (row.tempId || row.path) === selectedKey);
      this.selectedImage.set(refreshedSelection || null);
    }

    const lastPage = Math.max(0, Math.ceil(this.filteredRows().length / this.pageSize()) - 1);
    if (this.pageIndex() > lastPage) {
      this.pageIndex.set(lastPage);
    }
  }

  private removeInvalidSelections(persistedRows: ImageTableRow[]): void {
    const persistedPaths = new Set(persistedRows.map((row) => row.path).filter((path): path is string => !!path));
    Array.from(this.selectedPaths).forEach((path) => {
      if (!persistedPaths.has(path)) {
        this.selectedPaths.delete(path);
      }
    });
    if (this.lastSelectedPath && !persistedRows.some((row) => row.path === this.lastSelectedPath)) {
      this.lastSelectedPath = null;
    }
  }

  private syncUploadedRowsWithPersistedData(): void {
    const persistedNames = new Set(this.images.map((image) => image.filename));
    this.uploadRows.forEach((row, key) => {
      if (row.uploadStatus === 'uploaded' && persistedNames.has(row.filename)) {
        this.uploadRows.delete(key);
      }
    });
  }

  private getSelectableRows(): ImageTableRow[] {
    return this.filteredRows().filter((row) => this.isPersistedRow(row));
  }

  private getVisibleSelectableRows(): ImageTableRow[] {
    return this.paginatedRows().filter((row) => this.isPersistedRow(row));
  }

  private selectRowRange(fromPath: string, toPath: string, shouldSelect: boolean): boolean {
    const visibleRows = this.getVisibleSelectableRows();
    const fromIndex = visibleRows.findIndex((row) => row.path === fromPath);
    const toIndex = visibleRows.findIndex((row) => row.path === toPath);

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
    return !!row?.path && this.selectedPaths.has(row.path);
  }

  private selectRow(row: ImageTableRow): void {
    if (row?.path) {
      this.selectedPaths.add(row.path);
    }
  }

  private deselectRow(row: ImageTableRow): void {
    if (row?.path) {
      this.selectedPaths.delete(row.path);
    }
  }

  private getSelectedRows(): ImageTableRow[] {
    return this.rows().filter((row) => this.isPersistedRow(row) && !!row.path && this.selectedPaths.has(row.path));
  }
}
