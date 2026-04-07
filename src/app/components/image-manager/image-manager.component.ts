import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal, viewChild, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ControllerService } from '@services/controller.service';
import { Image } from '@models/images';
import { Controller } from '@models/controller';
import { ImageManagerService } from '@services/image-manager.service';
import { AddImageDialogComponent } from './add-image-dialog/add-image-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToasterService } from '@services/toaster.service';
import { DeleteAllImageFilesDialogComponent } from './deleteallfiles-dialog/deleteallfiles-dialog.component';
import { ImageTableRow, imageDataSource, imageDatabase } from './image-database-file';
import { QuestionDialogComponent } from '@components/dialogs/question-dialog/question-dialog.component';
import { MatSort, MatSortable, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { ImageUploadEvent, ImageUploadSessionService } from '@services/image-upload-session.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ControllerDiscoveryComponent } from '@components/controllers/controller-discovery/controller-discovery.component';

@Component({
  selector: 'app-image-manager',
  templateUrl: './image-manager.component.html',
  styleUrl: './image-manager.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule,
    MatSortModule,
    MatPaginatorModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatListModule,
    MatTooltipModule,
    ControllerDiscoveryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageManagerComponent implements OnInit, OnDestroy {
  controller: Controller;
  controllerId: number;
  public version: string;
  dataSource: imageDataSource;
  imageDatabase = new imageDatabase();
  readonly searchText = model('');
  isAllDelete: boolean = false;
  selectedPaths = new Set<string>();
  private images: Image[] = [];
  private uploadRows = new Map<string, ImageTableRow>();
  private uploadEventsSubscription: Subscription;
  private dataRowsSubscription: Subscription;
  private refreshAfterUploadTimer: ReturnType<typeof setTimeout>;
  private displayedRows: ImageTableRow[] = [];
  private lastSelectedPath: string | null = null;
  highlightedFilename: string | null = null;
  private highlightTimer: ReturnType<typeof setTimeout>;

  // Pagination properties
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  defaultPageSize = 10;
  currentPage = 0;

  readonly displayedColumns = signal(['select', 'filename', 'image_type', 'image_size', 'created_at', 'delete']);
  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  private imageService = inject(ImageManagerService);
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);
  private imageUploadSessionService = inject(ImageUploadSessionService);
  private router = inject(Router);

  constructor() {}

  ngOnInit(): void {
    this.controllerId = parseInt(this.route.snapshot.paramMap.get('controller_id'), 10);
    const sort = this.sort();
    if (sort) {
      sort.sort(<MatSortable>{
        id: 'filename',
        start: 'asc',
      });
    }

    // Initialize paginator
    const paginator = this.paginator();
    if (paginator) {
      paginator.pageIndex = this.currentPage;
      paginator.pageSize = this.defaultPageSize;
    }

    this.dataSource = new imageDataSource(this.imageDatabase, sort, paginator);
    this.dataRowsSubscription = this.dataSource.connect().subscribe((rows: ImageTableRow[]) => {
      this.displayedRows = rows || [];
    });

    this.uploadEventsSubscription = this.imageUploadSessionService.events$.subscribe((event: ImageUploadEvent) => {
      this.onUploadEvent(event);
    });

    this.route.queryParams.subscribe((params) => {
      if (params['highlight']) {
        this.flashRow(params['highlight']);
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      }
    });

    this.controllerService.get(this.controllerId).then((controller: Controller) => {
      this.controller = controller;
      if (controller.authToken) {
        this.getImages();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.uploadEventsSubscription) {
      this.uploadEventsSubscription.unsubscribe();
    }
    if (this.dataRowsSubscription) {
      this.dataRowsSubscription.unsubscribe();
    }
    if (this.refreshAfterUploadTimer) {
      clearTimeout(this.refreshAfterUploadTimer);
    }
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }
  }

  getImages() {
    this.imageService.getImages(this.controller).subscribe(
      (images: Image[]) => {
        this.images = images || [];
        this.syncUploadedRowsWithPersistedData();
        this.refreshTableRows();
      },
      (error) => {
        this.toasterService.error(error.error.message);
      }
    );
  }

  onPageEvent(event: any) {
    this.currentPage = event.pageIndex;
  }

  onSearchChange(value: string) {
    this.searchText.set(value);
    if (this.dataSource) {
      this.dataSource.setFilter(value);
      // Reset to first page when searching
      const paginator = this.paginator();
      if (paginator) {
        paginator.pageIndex = 0;
      }
    }
  }

  isHighlighted(row: ImageTableRow): boolean {
    return !!this.highlightedFilename && row.filename === this.highlightedFilename;
  }

  private flashRow(filename: string) {
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.highlightedFilename = filename;
    this.highlightTimer = setTimeout(() => {
      this.highlightedFilename = null;
    }, 2000);
  }

  isPersistedRow(row: ImageTableRow): boolean {
    return row && row.rowType === 'image';
  }

  hasUploadState(row: ImageTableRow): boolean {
    return row && row.rowType === 'upload';
  }

  formatImageSize(row: ImageTableRow): string {
    const size = Number(row.image_size || 0);
    if (!size) {
      return '0 MB';
    }
    return `${(size / 1000000).toFixed(2)} MB`;
  }

  deleteFile(path: string) {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'question-dialog-panel'],
      data: { title: 'Delete image', question: 'Are you sure you want to delete this image?' },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.imageService.deleteFile(this.controller, path).subscribe(
        (res) => {
          this.getImages();
          this.unChecked();
          this.toasterService.success('File deleted');
        },
        (error) => {
          this.getImages();
          this.unChecked();
          this.toasterService.error(error.error.message);
        }
      );
    });
  }

  cancelUpload(row: ImageTableRow) {
    if (!row || !row.tempId) {
      return;
    }
    this.imageUploadSessionService.requestCancel(row.tempId);
    this.toasterService.warning('Image file uploading canceled');
  }

  onRowCheckboxClick(event: MouseEvent, row: ImageTableRow) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isPersistedRow(row)) {
      return;
    }

    const isSelected = this.isRowSelected(row);
    const shouldSelect = !isSelected;

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

  isAllSelected() {
    const selectablePaths = new Set(this.getSelectableRows().map((row) => row.path));
    const numSelected = Array.from(this.selectedPaths).filter((path) => selectablePaths.has(path)).length;
    const numRows = selectablePaths.size;
    if (numRows === 0) {
      return false;
    }
    return numSelected === numRows;
  }

  selectAllImages() {
    this.isAllSelected() ? this.unChecked() : this.allChecked();
  }

  unChecked() {
    this.selectedPaths.clear();
    this.isAllDelete = false;
    this.lastSelectedPath = null;
  }

  allChecked() {
    this.getSelectableRows().forEach((row) => {
      if (row.path) {
        this.selectedPaths.add(row.path);
      }
    });
    this.isAllDelete = true;
  }

  hasSelection(): boolean {
    return this.selectedPaths.size > 0;
  }

  selectedCount(): number {
    return this.selectedPaths.size;
  }

  installAllImages() {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-info-panel', 'question-dialog-panel'],
      data: {
        title: 'Install all images',
        question: 'This will attempt to automatically create templates based on image checksums. Continue?',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.imageService.installImages(this.controller).subscribe(
          () => {
            this.toasterService.success('Images installed');
          },
          (error) => {
            this.toasterService.error(error.error.message);
          }
        );
      }
    });
  }

  pruneImages() {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'question-dialog-panel'],
      data: { title: 'Prune images', question: 'Delete all images not used by a template? This cannot be reverted.' },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.imageService.pruneImages(this.controller).subscribe(
          () => {
            this.getImages();
            this.unChecked();
            this.toasterService.success('Images pruned');
          },
          (error) => {
            this.getImages();
            this.unChecked();
            this.toasterService.error(error.error.message);
          }
        );
      }
    });
  }

  public addImageDialog() {
    const dialogRef = this.dialog.open(AddImageDialogComponent, {
      panelClass: ['base-dialog-panel', 'add-image-dialog-panel'],
      autoFocus: false,
      data: this.controller,
    });

    dialogRef.afterClosed().subscribe((isAddes: boolean) => {
      this.getImages();
      this.unChecked();
    });
  }

  deleteAllFiles() {
    const dialogRef = this.dialog.open(DeleteAllImageFilesDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'delete-all-images-dialog-panel'],
      autoFocus: false,
      disableClose: true,
      data: {
        controller: this.controller,
        deleteFilesPaths: this.getSelectedRows(),
      },
    });

    dialogRef.afterClosed().subscribe((isAllfilesdeleted: boolean) => {
      if (isAllfilesdeleted) {
        this.unChecked();
        this.getImages();
        this.toasterService.success('All files deleted');
      } else {
        this.unChecked();
        this.getImages();
        return false;
      }
    });
  }

  private onUploadEvent(event: ImageUploadEvent) {
    if (!event) {
      return;
    }

    if (event.status === 'canceled') {
      this.uploadRows.delete(event.tempId);
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

  private scheduleImagesRefresh() {
    if (this.refreshAfterUploadTimer) {
      clearTimeout(this.refreshAfterUploadTimer);
    }

    this.refreshAfterUploadTimer = setTimeout(() => {
      this.getImages();
    }, 300);
  }

  private refreshTableRows() {
    const persistedRows = this.images.map((image: Image) => ({ ...image, rowType: 'image' as const }));
    const uploadingRows = Array.from(this.uploadRows.values());
    this.removeInvalidSelections(persistedRows);
    this.imageDatabase.addImages([...uploadingRows, ...persistedRows]);
  }

  private removeInvalidSelections(persistedRows: ImageTableRow[]) {
    const persistedPaths = new Set(persistedRows.map((row) => row.path).filter((path) => !!path));
    Array.from(this.selectedPaths).forEach((path) => {
      if (!persistedPaths.has(path)) {
        this.selectedPaths.delete(path);
      }
    });
    if (this.lastSelectedPath && !persistedRows.some((row) => row.path === this.lastSelectedPath)) {
      this.lastSelectedPath = null;
    }
  }

  private syncUploadedRowsWithPersistedData() {
    const persistedNames = new Set(this.images.map((image) => image.filename));
    this.uploadRows.forEach((row, key) => {
      if (row.uploadStatus === 'uploaded' && persistedNames.has(row.filename)) {
        this.uploadRows.delete(key);
      }
    });
  }

  private getSelectableRows(): ImageTableRow[] {
    return this.imageDatabase.data.filter((row) => this.isPersistedRow(row));
  }

  private getVisibleSelectableRows(): ImageTableRow[] {
    const rows = this.displayedRows && this.displayedRows.length ? this.displayedRows : this.getSelectableRows();
    return rows.filter((row) => this.isPersistedRow(row));
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

  private toggleRowSelection(row: ImageTableRow, shouldSelect: boolean) {
    if (shouldSelect) {
      this.selectRow(row);
      return;
    }
    this.deselectRow(row);
  }

  isRowSelected(row: ImageTableRow): boolean {
    if (!row || !row.path) {
      return false;
    }
    return this.selectedPaths.has(row.path);
  }

  private selectRow(row: ImageTableRow) {
    if (!row || !row.path) {
      return;
    }
    this.selectedPaths.add(row.path);
  }

  private deselectRow(row: ImageTableRow) {
    if (!row || !row.path) {
      return;
    }
    this.selectedPaths.delete(row.path);
  }

  private getSelectedRows(): ImageTableRow[] {
    const selectableRows = this.getSelectableRows();
    return selectableRows.filter((row) => row.path && this.selectedPaths.has(row.path));
  }
}
