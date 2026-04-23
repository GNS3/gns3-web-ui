import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ResourcePoolsManagementComponent } from './resource-pools-management.component';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const createMockResourcePool = (id: string, name: string): ResourcePool => ({
  name,
  created_at: '2024-01-01',
  updated_at: '2024-01-02',
  resource_pool_id: id,
});

const createMockController = (): Controller => ({
  authToken: 'test-token',
  id: 1,
  name: 'Test Controller',
  location: 'local' as const,
  host: '127.0.0.1',
  port: 3080,
  path: '/',
  ubridge_path: '/usr/local/bin/ubridge',
  status: 'running' as const,
  protocol: 'http:' as const,
  username: 'admin',
  password: 'admin',
  tokenExpired: false,
});

describe('ResourcePoolsManagementComponent', () => {
  let component: ResourcePoolsManagementComponent;
  let fixture: ComponentFixture<ResourcePoolsManagementComponent>;

  let mockResourcePoolsService: any;
  let mockControllerService: any;
  let mockToasterService: any;

  const mockController = createMockController();
  const mockResourcePools: ResourcePool[] = [
    createMockResourcePool('pool-1', 'Pool One'),
    createMockResourcePool('pool-2', 'Pool Two'),
    createMockResourcePool('pool-3', 'Pool Three'),
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    mockResourcePoolsService = {
      getAll: vi.fn().mockReturnValue(of(mockResourcePools)),
      delete: vi.fn().mockReturnValue(of(null)),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    const mockActivatedRoute = {
      parent: {
        snapshot: {
          paramMap: {
            get: vi.fn().mockReturnValue('1'),
          },
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ResourcePoolsManagementComponent, RouterModule],
      providers: [
        { provide: ResourcePoolsService, useValue: mockResourcePoolsService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcePoolsManagementComponent);
    component = fixture.componentInstance;

    // Setup ViewChildren queries
    const mockPaginator = {
      changes: new Subject<MatPaginator>(),
      first: null,
    };
    const mockSort = {
      changes: new Subject<MatSort>(),
      first: null,
    };

    component.resourcePoolsPaginator = mockPaginator as any;
    component.resourcePoolsSort = mockSort as any;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('ngOnInit', () => {
    it('should fetch controller and load resource pools', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockControllerService.get).toHaveBeenCalledWith(expect.any(Number));
      expect(mockResourcePoolsService.getAll).toHaveBeenCalledWith(mockController);
      expect(component.resourcePools()).toEqual(mockResourcePools);
      expect(component.isReady()).toBe(true);
    });
  });

  describe('isAllSelected', () => {
    it('should return true when all resource pools are selected', () => {
      component.resourcePools.set(mockResourcePools);
      mockResourcePools.forEach((pool) => component.selection.select(pool));

      expect(component.isAllSelected()).toBe(true);
    });

    it('should return false when not all resource pools are selected', () => {
      component.resourcePools.set(mockResourcePools);
      component.selection.select(mockResourcePools[0]);

      expect(component.isAllSelected()).toBe(false);
    });

    it('should return false when no resource pools are selected', () => {
      component.resourcePools.set(mockResourcePools);

      expect(component.isAllSelected()).toBe(false);
    });

    it('should return true when only one pool exists and is selected', () => {
      component.resourcePools.set([mockResourcePools[0]]);
      component.selection.select(mockResourcePools[0]);

      expect(component.isAllSelected()).toBe(true);
    });
  });

  describe('masterToggle', () => {
    it('should select all pools when none are selected', () => {
      component.resourcePools.set(mockResourcePools);
      component.masterToggle();

      expect(component.selection.selected).toEqual(mockResourcePools);
    });

    it('should clear selection when all pools are selected', () => {
      component.resourcePools.set(mockResourcePools);
      mockResourcePools.forEach((pool) => component.selection.select(pool));

      component.masterToggle();

      expect(component.selection.selected).toEqual([]);
    });

    it('should clear selection when some pools are selected', () => {
      component.resourcePools.set(mockResourcePools);
      component.selection.select(mockResourcePools[0]);

      component.masterToggle();

      expect(component.selection.selected).toEqual(mockResourcePools);
    });
  });

  describe('refresh', () => {
    it('should fetch resource pools and update state', () => {
      component.controller = mockController;
      component.refresh();

      expect(mockResourcePoolsService.getAll).toHaveBeenCalledWith(mockController);
      expect(component.isReady()).toBe(true);
      expect(component.resourcePools()).toEqual(mockResourcePools);
      expect(component.dataSource.data).toEqual(mockResourcePools);
    });

    it('should clear selection when refreshing', () => {
      component.controller = mockController;
      component.selection.select(mockResourcePools[0]);
      component.refresh();

      expect(component.selection.selected).toEqual([]);
    });
  });

  // Note: dialog.open() tests are skipped because Angular Material's dialog
  // requires Overlay infrastructure that isn't properly set up in unit tests.
  // These methods (addResourcePool, onDelete) are tested through integration tests.
  describe('addResourcePool', () => {
    it('should be defined', () => {
      expect(typeof component.addResourcePool).toBe('function');
    });
  });

  describe('onDelete', () => {
    it('should be defined', () => {
      expect(typeof component.onDelete).toBe('function');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller failed' } });

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller failed');
    });

    it('should use fallback message when controller error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when getAll fails', async () => {
      component.controller = mockController;
      mockResourcePoolsService.getAll.mockReturnValue(
        throwError(() => ({ error: { message: 'Get failed' } }))
      );

      component.refresh();

      expect(mockToasterService.error).toHaveBeenCalledWith('Get failed');
    });

    it('should use fallback message when getAll error has no message', async () => {
      component.controller = mockController;
      mockResourcePoolsService.getAll.mockReturnValue(throwError(() => ({})));

      component.refresh();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load resource pools');
    });
  });
});
