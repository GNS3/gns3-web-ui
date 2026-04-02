import { describe, it, expect, beforeEach } from 'vitest';
import { InstalledSoftwareComponent, InstalledSoftwareDataSource } from './installed-software.component';
import { InstalledSoftwareService } from '@services/installed-software.service';
import { of } from 'rxjs';

describe('InstalledSoftwareComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (InstalledSoftwareComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have onInstalled method', () => {
      expect(typeof (InstalledSoftwareComponent.prototype as any).onInstalled).toBe('function');
    });
  });
});

describe('InstalledSoftwareDataSource', () => {
  let dataSource: InstalledSoftwareDataSource;
  let mockService: Partial<InstalledSoftwareService>;

  beforeEach(() => {
    mockService = {
      list: () => [{ type: 'test' }],
    };
    dataSource = new InstalledSoftwareDataSource(mockService as InstalledSoftwareService);
  });

  it('should create', () => {
    expect(dataSource).toBeTruthy();
  });

  it('should have connect method', () => {
    expect(typeof dataSource.connect).toBe('function');
  });

  it('should have disconnect method', () => {
    expect(typeof dataSource.disconnect).toBe('function');
  });

  it('should have refresh method', () => {
    expect(typeof dataSource.refresh).toBe('function');
  });

  it('should add adbutler to installed list on refresh', () => {
    dataSource.refresh();
    expect(dataSource.installed.value).toContainEqual({ type: 'adbutler' });
  });
});
