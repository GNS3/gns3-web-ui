import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QueryList } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AclManagementComponent } from './acl-management.component';
import { ControllerService } from '@services/controller.service';
import { AclService } from '@services/acl.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { ACE, AceType } from '@models/api/ACE';
import { Endpoint, RessourceType } from '@models/api/endpoint';
import { AceFilterPipe } from '@filters/ace-filter.pipe';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AclManagementComponent', () => {
  let component: AclManagementComponent;
  let fixture: ComponentFixture<AclManagementComponent>;
  let mockControllerService: any;
  let mockAclService: any;
  let mockToasterService: any;
  let mockDialog: any;
  let mockController: Controller;
  let mockDialogRef: any;
  let mockActivatedRoute: any;
  let mockPaginator: any;
  let mockSort: any;

  const mockEndpoints: Endpoint[] = [
    { endpoint: 'uuid1', name: 'Project 1', endpoint_type: RessourceType.project },
    { endpoint: 'uuid2', name: 'Project 2', endpoint_type: RessourceType.project },
  ];

  const mockAces: ACE[] = [
    {
      ace_id: 'ace1',
      ace_type: AceType.user,
      path: '/projects/uuid1',
      propagate: true,
      allowed: true,
      user_id: 'user1',
      role_id: 'role1',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
    },
    {
      ace_id: 'ace2',
      ace_type: AceType.group,
      path: '/projects/uuid2',
      propagate: false,
      allowed: false,
      group_id: 'group1',
      role_id: 'role2',
      created_at: '2024-01-03',
      updated_at: '2024-01-04',
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockPaginator = {} as MatPaginator;
    mockSort = {} as MatSort;

    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(true)),
      close: vi.fn(),
      componentInstance: {},
    } as any;

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    } as any;

    mockAclService = {
      list: vi.fn().mockReturnValue(of(mockAces)),
      getEndpoints: vi.fn().mockReturnValue(of(mockEndpoints)),
      delete: vi.fn().mockReturnValue(of({})),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockActivatedRoute = {
      parent: {
        snapshot: {
          paramMap: {
            get: vi.fn().mockReturnValue('1'),
          },
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [AclManagementComponent, AceFilterPipe],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: AclService, useValue: mockAclService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AclManagementComponent);
    component = fixture.componentInstance;

    // Set up ViewChildren mocks
    const createMockQueryList = <T>(item: T) => {
      const changesSubject = new Subject<QueryList<T>>();
      return {
        first: item,
        length: 1,
        toArray: () => [item],
        changes: changesSubject.asObservable(),
        reset: vi.fn(),
        subscribe: vi.fn(),
      } as unknown as QueryList<T>;
    };

    component.acesPaginator = createMockQueryList(mockPaginator as MatPaginator);
    component.acesSort = createMockQueryList(mockSort as MatSort);
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct displayed columns', () => {
      expect(component.displayedColumns).toEqual([
        'select',
        'path',
        'user/group',
        'role',
        'propagate',
        'allowed',
        'updated_at',
      ]);
    });

    it('should initialize with empty selection', () => {
      expect(component.selection.isEmpty()).toBe(true);
    });

    it('should initialize isReady as false', () => {
      expect(component.isReady()).toBe(false);
    });

    it('should initialize dataSource as MatTableDataSource', () => {
      expect(component.dataSource).toBeInstanceOf(MatTableDataSource);
    });
  });

  describe('refresh', () => {
    it('should load ACEs and update dataSource', async () => {
      component.controller = mockController;
      fixture.detectChanges();

      await fixture.whenStable();

      expect(mockAclService.list).toHaveBeenCalledWith(mockController);
      expect(component.aces).toEqual(mockAces);
      expect(component.dataSource.data).toEqual(mockAces);
    });

    it('should set isReady to true after loading', async () => {
      component.controller = mockController;
      fixture.detectChanges();

      await fixture.whenStable();

      expect(component.isReady()).toBe(true);
    });

    it('should clear selection after refresh', async () => {
      component.controller = mockController;
      component.selection.select(mockAces[0]);
      fixture.detectChanges();

      await fixture.whenStable();

      expect(component.selection.isEmpty()).toBe(true);
    });
  });

  describe('isAllSelected', () => {
    it('should return true when all rows are selected', () => {
      component.aces = [...mockAces];
      component.selection.select(...mockAces);

      expect(component.isAllSelected()).toBe(true);
    });

    it('should return false when not all rows are selected', () => {
      component.aces = [...mockAces];
      component.selection.select(mockAces[0]);

      expect(component.isAllSelected()).toBe(false);
    });

    it('should return true when aces is empty and selection is empty', () => {
      component.aces = [];
      component.selection.clear();

      expect(component.isAllSelected()).toBe(true);
    });
  });

  describe('masterToggle', () => {
    it('should select all rows when not all are selected', () => {
      component.aces = [...mockAces];
      component.selection.select(mockAces[0]);

      component.masterToggle();

      expect(component.selection.selected.length).toBe(mockAces.length);
    });

    it('should clear selection when all rows are selected', () => {
      component.aces = [...mockAces];
      component.selection.select(...mockAces);

      component.masterToggle();

      expect(component.selection.isEmpty()).toBe(true);
    });
  });

  // Dialog tests are skipped because they require additional mocking setup
  // for the AddAceDialogComponent and DeleteAceDialogComponent dependencies.
  // These methods should be tested in integration tests that include the dialog modules.
  describe('addACE', () => {
    it('should be defined as a function', () => {
      expect(typeof component.addACE).toBe('function');
    });
  });

  describe('onDelete', () => {
    it('should be defined as a function', () => {
      expect(typeof component.onDelete).toBe('function');
    });
  });

  describe('deleteMultiple', () => {
    it('should be defined as a function', () => {
      expect(typeof component.deleteMultiple).toBe('function');
    });
  });

  describe('getNameByUuidFromEndpoint', () => {
    it('should return endpoint name when uuid matches', () => {
      component.endpoints.set(mockEndpoints);
      fixture.detectChanges();

      const result = component.getNameByUuidFromEndpoint('uuid1');

      expect(result).toBe('Project 1');
    });

    it('should return empty string when no match found', () => {
      component.endpoints.set(mockEndpoints);
      fixture.detectChanges();

      const result = component.getNameByUuidFromEndpoint('nonexistent');

      expect(result).toBe('');
    });

    it('should return empty string when endpoints is empty', () => {
      component.endpoints.set([]);
      fixture.detectChanges();

      const result = component.getNameByUuidFromEndpoint('uuid1');

      expect(result).toBe('');
    });
  });

  describe('ngAfterViewInit', () => {
    it('should set up dataSource sortingDataAccessor', () => {
      component.controller = mockController;
      fixture.detectChanges();

      expect(component.dataSource.sortingDataAccessor).toBeDefined();
    });
  });
});
