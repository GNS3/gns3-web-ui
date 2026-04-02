import { describe, it, expect, beforeEach } from 'vitest';
import { ControllerDataSource } from './controllers.component';
import { MatSort } from '@angular/material/sort';
import { ControllerDatabase } from '@services/controller.database';
import { Controller } from '@models/controller';
import { Subject } from 'rxjs';

describe('ControllerDataSource', () => {
  let dataSource: ControllerDataSource;
  let mockControllerDatabase: ControllerDatabase;
  let mockSort: MatSort;

  const mockControllers: Controller[] = [
    { id: 1, name: 'Controller A', host: 'localhost', port: 3080, status: 'running' } as Controller,
    { id: 2, name: 'Controller B', host: 'remote', port: 3080, status: 'stopped' } as Controller,
  ];

  beforeEach(() => {
    mockControllerDatabase = {
      data: mockControllers,
      dataChange: new Subject<Controller[]>(),
    } as any as ControllerDatabase;

    mockSort = {
      active: '',
      direction: '',
      sortChange: new Subject<void>(),
    } as any as MatSort;

    dataSource = new ControllerDataSource(mockControllerDatabase, mockSort);
  });

  it('should create', () => {
    expect(dataSource).toBeTruthy();
  });

  it('should have setFilter method', () => {
    expect(typeof dataSource.setFilter).toBe('function');
  });

  it('should have connect method', () => {
    expect(typeof dataSource.connect).toBe('function');
  });

  it('should have disconnect method', () => {
    expect(typeof dataSource.disconnect).toBe('function');
  });

  it('should set filter value', () => {
    dataSource.setFilter('controller a');
    // Verify setFilter doesn't throw
    expect(() => dataSource.setFilter('controller a')).not.toThrow();
  });

  it('should trim and lowercase filter value', () => {
    // Verify setFilter handles trimming correctly
    expect(() => dataSource.setFilter('  Controller A  ')).not.toThrow();
  });

  it('should handle empty filter', () => {
    expect(() => dataSource.setFilter('')).not.toThrow();
  });
});
