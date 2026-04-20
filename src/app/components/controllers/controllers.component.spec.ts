import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ControllerDataSource } from './controllers.component';
import { MatSort, Sort } from '@angular/material/sort';
import { ControllerDatabase } from '@services/controller.database';
import { Controller } from '@models/controller';
import { BehaviorSubject, Subject } from 'rxjs';

describe('ControllerDataSource', () => {
  let dataSource: ControllerDataSource;
  let controllerDatabase: ControllerDatabase;
  let mockSort: MatSort;

  const createController = (overrides: Partial<Controller> = {}): Controller =>
    ({
      id: 1,
      name: 'Controller A',
      host: 'localhost',
      port: 3080,
      status: 'running',
      location: 'bundled',
      protocol: 'http:',
      authToken: '',
      path: '',
      ubridge_path: '',
      username: '',
      password: '',
      tokenExpired: false,
      ...overrides,
    } as Controller);

  beforeEach(() => {
    vi.clearAllMocks();

    controllerDatabase = new ControllerDatabase();

    mockSort = {
      active: '',
      direction: '',
      sortChange: new Subject<void>(),
    } as unknown as MatSort;
  });

  describe('setFilter', () => {
    beforeEach(() => {
      dataSource = new ControllerDataSource(controllerDatabase, mockSort);
    });

    it('should trim and lowercase the filter value', () => {
      dataSource.setFilter('  Controller A  ');
      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([createController({ name: 'Controller A' })]);
      expect(emittedValue).toHaveLength(1);
    });

    it('should emit empty filter when setFilter receives empty string', () => {
      dataSource.setFilter('');
      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([createController({ name: 'Controller A' })]);
      expect(emittedValue).toHaveLength(1);
    });

    it('should filter controllers by name', () => {
      dataSource.setFilter('controller b');

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 1, name: 'Controller A' }),
        createController({ id: 2, name: 'Controller B' }),
      ]);

      expect(emittedValue).toHaveLength(1);
      expect(emittedValue?.[0].name).toBe('Controller B');
    });

    it('should filter controllers by status', () => {
      dataSource.setFilter('stopped');

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 1, name: 'Controller A', status: 'running' }),
        createController({ id: 2, name: 'Controller B', status: 'stopped' }),
      ]);

      expect(emittedValue).toHaveLength(1);
      expect(emittedValue?.[0].status).toBe('stopped');
    });

    it('should filter controllers by host', () => {
      dataSource.setFilter('remotehost');

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 1, name: 'Local Controller', host: 'localhost' }),
        createController({ id: 2, name: 'Remote Controller', host: 'remotehost' }),
      ]);

      expect(emittedValue).toHaveLength(1);
      expect(emittedValue?.[0].host).toBe('remotehost');
    });

    it('should return all controllers when filter is empty', () => {
      dataSource.setFilter('');

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 1, name: 'Controller A' }),
        createController({ id: 2, name: 'Controller B' }),
      ]);

      expect(emittedValue).toHaveLength(2);
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      dataSource = new ControllerDataSource(controllerDatabase, mockSort);
    });

    it('should return an observable', () => {
      const connected$ = dataSource.connect();
      expect(connected$).toBeDefined();
      expect(typeof connected$.subscribe).toBe('function');
    });

    it('should emit updated data when controllerDatabase data changes', () => {
      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      const controllers = [
        createController({ id: 1, name: 'Controller A' }),
        createController({ id: 2, name: 'Controller B' }),
      ];
      controllerDatabase.dataChange.next(controllers);

      expect(emittedValue).toEqual(controllers);
    });

    it('should apply sort when sort is active with direction', () => {
      mockSort = {
        active: 'name',
        direction: 'asc',
        sortChange: new Subject<void>(),
      } as unknown as MatSort;

      dataSource = new ControllerDataSource(controllerDatabase, mockSort);

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 1, name: 'Zebra' }),
        createController({ id: 2, name: 'Alpha' }),
      ]);

      expect(emittedValue).toHaveLength(2);
      expect(emittedValue?.[0].name).toBe('Alpha');
      expect(emittedValue?.[1].name).toBe('Zebra');
    });

    it('should apply descending sort when direction is desc', () => {
      mockSort = {
        active: 'name',
        direction: 'desc',
        sortChange: new Subject<void>(),
      } as unknown as MatSort;

      dataSource = new ControllerDataSource(controllerDatabase, mockSort);

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 1, name: 'Alpha' }),
        createController({ id: 2, name: 'Zebra' }),
      ]);

      expect(emittedValue).toHaveLength(2);
      expect(emittedValue?.[0].name).toBe('Zebra');
      expect(emittedValue?.[1].name).toBe('Alpha');
    });

    it('should emit on sortChange event', () => {
      mockSort = {
        active: 'name',
        direction: 'asc',
        sortChange: new Subject<void>(),
      } as unknown as MatSort;

      dataSource = new ControllerDataSource(controllerDatabase, mockSort);

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 1, name: 'Zebra' }),
        createController({ id: 2, name: 'Alpha' }),
      ]);

      // Re-sort by id descending
      (mockSort as unknown as { active: string; direction: string }).active = 'id';
      (mockSort as unknown as { active: string; direction: string }).direction = 'desc';
      mockSort.sortChange.next(undefined);

      expect(emittedValue).toHaveLength(2);
      expect(emittedValue?.[0].id).toBe(2);
      expect(emittedValue?.[1].id).toBe(1);
    });

    it('should not sort when sort direction is empty', () => {
      mockSort = {
        active: 'name',
        direction: '',
        sortChange: new Subject<void>(),
      } as unknown as MatSort;

      dataSource = new ControllerDataSource(controllerDatabase, mockSort);

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 2, name: 'Zebra' }),
        createController({ id: 1, name: 'Alpha' }),
      ]);

      // Data should be returned in original order when no sort direction
      expect(emittedValue).toHaveLength(2);
      expect(emittedValue?.[0].id).toBe(2);
      expect(emittedValue?.[1].id).toBe(1);
    });

    it('should filter and sort together', () => {
      mockSort = {
        active: 'name',
        direction: 'asc',
        sortChange: new Subject<void>(),
      } as unknown as MatSort;

      dataSource = new ControllerDataSource(controllerDatabase, mockSort);
      dataSource.setFilter('controller');

      const connected$ = dataSource.connect();
      let emittedValue: Controller[] | undefined;

      connected$.subscribe((data) => {
        emittedValue = data;
      });

      controllerDatabase.dataChange.next([
        createController({ id: 1, name: 'ZController' }),
        createController({ id: 2, name: 'AController' }),
        createController({ id: 3, name: 'BController' }),
      ]);

      expect(emittedValue).toHaveLength(3);
      expect(emittedValue?.[0].name).toBe('AController');
      expect(emittedValue?.[1].name).toBe('BController');
      expect(emittedValue?.[2].name).toBe('ZController');
    });
  });

  describe('disconnect', () => {
    it('should not throw when called', () => {
      dataSource = new ControllerDataSource(controllerDatabase, mockSort);
      expect(() => dataSource.disconnect()).not.toThrow();
    });
  });
});
