import { describe, it, expect } from 'vitest';
import { ImageManagerComponent } from './image-manager.component';

describe('ImageManagerComponent', () => {
  it('keeps completed uploads until their exact nested path is in the catalog', () => {
    const row = { filename: 'router.qcow2', path: '/images/QEMU/VendorB/router.qcow2', uploadStatus: 'uploaded' };
    const context = {
      images: [{ filename: row.filename, path: '/images/QEMU/VendorA/router.qcow2' }],
      uploadRows: new Map([['upload', row]]),
    };
    const sync = (ImageManagerComponent.prototype as any).syncUploadedRowsWithPersistedData;
    sync.call(context);
    expect(context.uploadRows.size).toBe(1);
    context.images.push({ filename: row.filename, path: row.path });
    sync.call(context);
    expect(context.uploadRows.size).toBe(0);
  });

  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have getImages method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).getImages).toBe('function');
    });

    it('should have onPageEvent method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).onPageEvent).toBe('function');
    });

    it('should have onSearchChange method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).onSearchChange).toBe('function');
    });

    it('should have list and grid view controls', () => {
      expect(typeof (ImageManagerComponent.prototype as any).toggleView).toBe('function');
    });

    it('should have image detail controls', () => {
      expect(typeof (ImageManagerComponent.prototype as any).selectImage).toBe('function');
      expect(typeof (ImageManagerComponent.prototype as any).closeDetails).toBe('function');
    });

    it('should have filter and sort controls', () => {
      expect(typeof (ImageManagerComponent.prototype as any).onTypeFilterChange).toBe('function');
      expect(typeof (ImageManagerComponent.prototype as any).onSortByChange).toBe('function');
      expect(typeof (ImageManagerComponent.prototype as any).onSortChange).toBe('function');
    });

    it('should have isHighlighted method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).isHighlighted).toBe('function');
    });

    it('should have isPersistedRow method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).isPersistedRow).toBe('function');
    });

    it('should have hasUploadState method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).hasUploadState).toBe('function');
    });

    it('should have formatImageSize method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).formatImageSize).toBe('function');
    });

    it('should have deleteFile method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).deleteFile).toBe('function');
    });

    it('should have cancelUpload method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).cancelUpload).toBe('function');
    });

    it('should have onRowCheckboxClick method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).onRowCheckboxClick).toBe('function');
    });

    it('should have trackByRow method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).trackByRow).toBe('function');
    });

    it('should have isAllSelected method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).isAllSelected).toBe('function');
    });

    it('should have selectAllImages method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).selectAllImages).toBe('function');
    });

    it('should have unChecked method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).unChecked).toBe('function');
    });

    it('should have allChecked method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).allChecked).toBe('function');
    });

    it('should have hasSelection method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).hasSelection).toBe('function');
    });

    it('should have selectedCount method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).selectedCount).toBe('function');
    });

    it('should have installAllImages method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).installAllImages).toBe('function');
    });

    it('should have pruneImages method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).pruneImages).toBe('function');
    });

    it('should have addImageDialog method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).addImageDialog).toBe('function');
    });

    it('should have deleteAllFiles method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).deleteAllFiles).toBe('function');
    });

    it('should have isRowSelected method', () => {
      expect(typeof (ImageManagerComponent.prototype as any).isRowSelected).toBe('function');
    });
  });
});
