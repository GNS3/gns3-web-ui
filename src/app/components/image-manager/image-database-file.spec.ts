import { Subject } from 'rxjs';
import { MatSort } from '@angular/material/sort';
import { imageDatabase, imageDataSource, ImageTableRow } from './image-database-file';

describe('imageDataSource', () => {
  let database: imageDatabase;
  let sortChange: Subject<void>;
  let sort: MatSort;
  let dataSource: imageDataSource;
  let latestRows: ImageTableRow[];

  beforeEach(() => {
    database = new imageDatabase();
    sortChange = new Subject<void>();
    sort = {
      active: 'filename',
      direction: 'asc',
      sortChange: sortChange.asObservable(),
    } as unknown as MatSort;
    dataSource = new imageDataSource(database, sort);
    dataSource.connect().subscribe((rows) => {
      latestRows = rows;
    });
  });

  it('filters rows by filename and type', () => {
    database.addImages([
      { rowType: 'image', filename: 'ubuntu.qcow2', image_type: 'qemu', image_size: 2000000 },
      { rowType: 'image', filename: 'ios.bin', image_type: 'iou', image_size: 1500000 },
    ]);

    dataSource.setFilter('ubuntu');
    expect(latestRows.length).toBe(1);
    expect(latestRows[0].filename).toBe('ubuntu.qcow2');

    dataSource.setFilter('iou');
    expect(latestRows.length).toBe(1);
    expect(latestRows[0].filename).toBe('ios.bin');
  });

  it('sorts by image size numerically', () => {
    sort.active = 'image_size';
    database.addImages([
      { rowType: 'image', filename: 'small.bin', image_type: 'iou', image_size: 1000000 },
      { rowType: 'image', filename: 'large.bin', image_type: 'iou', image_size: 4000000 },
    ]);

    sort.direction = 'desc';
    sortChange.next();
    expect(latestRows[0].filename).toBe('large.bin');

    sort.direction = 'asc';
    sortChange.next();
    expect(latestRows[0].filename).toBe('small.bin');
  });

  it('sorts by created_at as a date', () => {
    sort.active = 'created_at';
    database.addImages([
      { rowType: 'image', filename: 'new.bin', image_type: 'iou', created_at: '2026-01-02T10:00:00.000Z' },
      { rowType: 'image', filename: 'old.bin', image_type: 'iou', created_at: '2025-01-02T10:00:00.000Z' },
    ]);

    sort.direction = 'asc';
    sortChange.next();
    expect(latestRows[0].filename).toBe('old.bin');
  });
});
