
import { DataSource } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { Image } from '@models/images';

export type ImageUploadStatus = 'queued' | 'uploading' | 'uploaded' | 'error' | 'canceled';

export interface ImageTableRow extends Partial<Image> {
  rowType: 'image' | 'upload';
  tempId?: string;
  uploadProgress?: number;
  uploadStatus?: ImageUploadStatus;
  errorMessage?: string;
}

export class imageDatabase {
  dataChange: BehaviorSubject<ImageTableRow[]> = new BehaviorSubject<ImageTableRow[]>([]);

  get data(): ImageTableRow[] {
    return this.dataChange.value;
  }

  public addImages(fileData: ImageTableRow[]) {
    this.dataChange.next(fileData);
  }
}

export class imageDataSource extends DataSource<ImageTableRow> {
  private filterChange: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private controllerDatabase: imageDatabase,
    private sort?: MatSort,
    private paginator?: MatPaginator
  ) {
    super();
  }

  setFilter(filter: string) {
    this.filterChange.next((filter || '').trim().toLowerCase());
  }

  connect(): Observable<ImageTableRow[]> {
    const sortChanges = this.sort ? this.sort.sortChange : new BehaviorSubject(null);
    const pageChanges = this.paginator ? this.paginator.page : new BehaviorSubject(null);
    return merge(this.controllerDatabase.dataChange, sortChanges, this.filterChange, pageChanges).pipe(
      map(() => {
        let data = this.controllerDatabase.data.slice();
        const filter = this.filterChange.value;

        // Apply filter
        if (filter) {
          data = data.filter((row: ImageTableRow) => {
            const searchable = [
              row.filename,
              row.image_type,
              row.image_size,
              row.created_at,
              row.uploadStatus,
            ]
              .map((value) => String(value || '').toLowerCase())
              .join(' ');
            return searchable.includes(filter);
          });
        }

        // Apply sort
        if (!this.sort || !this.sort.active || this.sort.direction === '') {
          // Keep original order
        } else {
          data = data.sort((a: ImageTableRow, b: ImageTableRow) => {
            const valueA = this.getSortValue(a, this.sort.active);
            const valueB = this.getSortValue(b, this.sort.active);
            return (valueA < valueB ? -1 : 1) * (this.sort.direction === 'asc' ? 1 : -1);
          });
        }

        // Update paginator length
        if (this.paginator) {
          this.paginator.length = data.length;
        }

        // Apply pagination
        if (this.paginator) {
          const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
          const endIndex = startIndex + this.paginator.pageSize;
          data = data.slice(startIndex, endIndex);
        }

        return data;
      })
    );
  }

  private getSortValue(row: ImageTableRow, active: string): any {
    const value = row[active];
    if (active === 'image_size') {
      return Number(value || 0);
    }

    if (active === 'created_at' || active === 'updated_at') {
      const parsed = Date.parse(String(value || ''));
      return isNaN(parsed) ? 0 : parsed;
    }

    return String(value || '').toLowerCase();
  }

  disconnect() { }
}
