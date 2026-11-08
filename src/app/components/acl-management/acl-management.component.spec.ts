import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AclManagementComponent } from './acl-management.component';
import { AddAceDialogComponent } from '@components/acl-management/add-ace-dialog/add-ace-dialog.component';
import { ControllerService } from '@services/controller.service';
import { AclService } from '@services/acl.service';
import { ToasterService } from '@services/toaster.service';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { Controller } from '@models/controller';
import { ACE, AceType } from '@models/api/ACE';
import { Endpoint, RessourceType } from '@models/api/endpoint';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AclManagementComponent', () => {
  let component: AclManagementComponent;
  let fixture: ComponentFixture<AclManagementComponent>;
  let mockControllerService: any;
  let mockAclService: any;
  let mockToasterService: any;
  let mockDialog: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockDialogRef: any;
  let mockActivatedRoute: any;

  const mockEndpoints: Endpoint[] = [
    { endpoint: '/projects/uuid1', name: 'Project Alpha', endpoint_type: RessourceType.project },
    { endpoint: '/projects/uuid2', name: 'Project Beta', endpoint_type: RessourceType.project },
    { endpoint: '/computes', name: 'Computes', endpoint_type: RessourceType.root },
    { endpoint: '/users/u1', name: 'John Doe', endpoint_type: RessourceType.user },
    { endpoint: '/user_groups/g1', name: 'Students', endpoint_type: RessourceType.group },
    { endpoint: '/roles/role1', name: 'Administrator', endpoint_type: RessourceType.user },
    { endpoint: '/roles/role2', name: 'Viewer', endpoint_type: RessourceType.user },
  ];

  const mockAces: ACE[] = [
    {
      ace_id: 'ace1',
      ace_type: AceType.user,
      path: '/computes',
      propagate: true,
      allowed: true,
      user_id: 'u1',
      role_id: 'role2',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
    },
    {
      ace_id: 'ace2',
      ace_type: AceType.user,
      path: '/projects/uuid1',
      propagate: false,
      allowed: false,
      user_id: 'u1',
      role_id: 'role1',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
    },
    {
      ace_id: 'ace3',
      ace_type: AceType.group,
      path: '/projects/uuid2',
      propagate: true,
      allowed: true,
      group_id: 'g1',
      role_id: 'role1',
      created_at: '2024-01-03',
      updated_at: '2024-01-04',
    },
  ];

  const mockPools: ResourcePool[] = [{ resource_pool_id: 'pool1', name: 'Lab Pool' } as ResourcePool];

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
      success: vi.fn(),
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
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
      imports: [AclManagementComponent],
      providers: [
        { provide: ControllerService, useValue: mockControllerService },
        { provide: AclService, useValue: mockAclService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ResourcePoolsService, useValue: { getAll: vi.fn().mockReturnValue(of(mockPools)) } },
      ],
    })
      // The component imports MatDialogModule itself, which registers MatDialog at the
      // component-level injector and shadows TestBed providers — override instead.
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(AclManagementComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  /** Seeds endpoints + aces without going through ngOnInit HTTP flow. */
  function seedAces() {
    component.endpoints.set(mockEndpoints);
    component.aces.set(mockAces);
  }

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize isReady as false', () => {
      expect(component.isReady()).toBe(false);
    });

    it('should initialize with empty selection', () => {
      expect(component.selection.isEmpty()).toBe(true);
    });

    it('should initialize with all groups collapsed', () => {
      seedAces();

      expect(component.expandedGroups().size).toBe(0);
      expect(component.filteredGroups().every((group) => !component.isExpanded(group))).toBe(true);
    });
  });

  describe('aceGroups', () => {
    it('should group ACE rules by subject', () => {
      seedAces();

      const groups = component.aceGroups();

      expect(groups.length).toBe(2);
      expect(groups[0].key).toBe('user:u1');
      expect(groups[0].aces.length).toBe(2);
      expect(groups[1].key).toBe('group:g1');
      expect(groups[1].aces.length).toBe(1);
    });

    it('should resolve subject display names from endpoints', () => {
      seedAces();

      const groups = component.aceGroups();

      expect(groups[0].name).toBe('John Doe');
      expect(groups[1].name).toBe('Students');
    });

    it('should sort groups by subject name', () => {
      seedAces();

      const names = component.aceGroups().map((group) => group.name);

      expect(names).toEqual(['John Doe', 'Students']);
    });

    it('should sort rules within a group by path display name', () => {
      seedAces();

      const paths = component.aceGroups()[0].aces.map((ace) => ace.path);

      expect(paths).toEqual(['/computes', '/projects/uuid1']);
    });
  });

  describe('filteredGroups', () => {
    it('should return all groups when search is empty', () => {
      seedAces();

      expect(component.filteredGroups().length).toBe(2);
    });

    it('should keep only groups with matching rules when searching by path name', () => {
      seedAces();
      component.searchText.set('alpha');

      const groups = component.filteredGroups();

      expect(groups.length).toBe(1);
      expect(groups[0].key).toBe('user:u1');
      expect(groups[0].aces.length).toBe(1);
      expect(groups[0].aces[0].path).toBe('/projects/uuid1');
    });

    it('should match by subject name', () => {
      seedAces();
      component.searchText.set('students');

      const groups = component.filteredGroups();

      expect(groups.length).toBe(1);
      expect(groups[0].key).toBe('group:g1');
      expect(groups[0].aces.length).toBe(1);
    });

    it('should match by role name', () => {
      seedAces();
      component.searchText.set('administrator');

      const groups = component.filteredGroups();

      expect(groups.length).toBe(2);
      expect(groups[0].aces.length).toBe(1);
      expect(groups[1].aces.length).toBe(1);
    });

    it('should return no groups when nothing matches', () => {
      seedAces();
      component.searchText.set('nomatch');

      expect(component.filteredGroups()).toEqual([]);
    });
  });

  describe('expansion', () => {
    it('should expand a collapsed group on toggle', () => {
      seedAces();
      const group = component.aceGroups()[0];

      component.toggleGroup(group);

      expect(component.isExpanded(group)).toBe(true);
    });

    it('should collapse an expanded group on toggle', () => {
      seedAces();
      const group = component.aceGroups()[0];

      component.toggleGroup(group);
      component.toggleGroup(group);

      expect(component.isExpanded(group)).toBe(false);
    });

    it('should force groups expanded while searching', () => {
      seedAces();
      const group = component.aceGroups()[0];
      component.searchText.set('alpha');

      expect(component.isExpanded(group)).toBe(true);
    });

    it('should restore collapsed state after clearing the search', () => {
      seedAces();
      const group = component.aceGroups()[0];
      component.searchText.set('alpha');
      component.searchText.set('');

      expect(component.isExpanded(group)).toBe(false);
    });
  });

  describe('per-group rule pagination', () => {
    it('should default to the first page size option', () => {
      seedAces();
      const group = component.aceGroups()[0];

      const page = component.rulePageOf(group);

      expect(page.pageSize).toBe(component.rulePageSizeOptions[0]);
      expect(page.pageIndex).toBe(0);
    });

    it('should slice the group rules to the page', () => {
      seedAces();
      const group = component.aceGroups()[0];
      component.rulePageByGroup.set({ [group.key]: { pageIndex: 0, pageSize: 1 } });

      const paged = component.pagedAcesFor(group);

      expect(paged.length).toBe(1);
      expect(paged[0].ace_id).toBe('ace1');
    });

    it('should return the next page slice', () => {
      seedAces();
      const group = component.aceGroups()[0];
      component.rulePageByGroup.set({ [group.key]: { pageIndex: 1, pageSize: 1 } });

      const paged = component.pagedAcesFor(group);

      expect(paged.length).toBe(1);
      expect(paged[0].ace_id).toBe('ace2');
    });

    it('should clamp an out-of-range page index to the last page', () => {
      seedAces();
      const group = component.aceGroups()[0];
      component.rulePageByGroup.set({ [group.key]: { pageIndex: 9, pageSize: 1 } });

      const paged = component.pagedAcesFor(group);

      expect(component.rulePageOf(group).pageIndex).toBe(1);
      expect(paged[0].ace_id).toBe('ace2');
    });

    it('should keep page state independent per group', () => {
      seedAces();
      const [userGroup, groupGroup] = component.aceGroups();
      component.rulePageByGroup.set({ [userGroup.key]: { pageIndex: 0, pageSize: 1 } });
      component.onRulePageChange(groupGroup, { pageIndex: 0, pageSize: 5, length: 1, previousPageIndex: 0 } as any);

      expect(component.rulePageOf(userGroup).pageSize).toBe(1);
      expect(component.rulePageOf(groupGroup).pageSize).toBe(5);
    });

    it('should reset rule pages when the search changes', () => {
      seedAces();
      const group = component.aceGroups()[0];
      component.onRulePageChange(group, { pageIndex: 1, pageSize: 1, length: 2, previousPageIndex: 0 } as any);

      component.onSearchChange('alpha');

      expect(component.rulePageByGroup()).toEqual({});
      expect(component.searchText()).toBe('alpha');
    });
  });

  describe('selection', () => {
    it('should report a group fully selected when all its visible rules are selected', () => {
      seedAces();
      const group = component.filteredGroups()[0];

      group.aces.forEach((ace) => component.selection.select(ace));

      expect(component.isGroupAllSelected(group)).toBe(true);
      expect(component.isGroupPartiallySelected(group)).toBe(false);
    });

    it('should report a group partially selected when only some rules are selected', () => {
      seedAces();
      const group = component.filteredGroups()[0];

      component.selection.select(group.aces[0]);

      expect(component.isGroupAllSelected(group)).toBe(false);
      expect(component.isGroupPartiallySelected(group)).toBe(true);
    });

    it('should select all visible rules of a group via toggleGroupSelection', () => {
      seedAces();
      const group = component.filteredGroups()[0];

      component.toggleGroupSelection(group);

      expect(group.aces.every((ace) => component.selection.isSelected(ace))).toBe(true);
    });

    it('should deselect all rules of a fully selected group via toggleGroupSelection', () => {
      seedAces();
      const group = component.filteredGroups()[0];

      component.toggleGroupSelection(group);
      component.toggleGroupSelection(group);

      expect(group.aces.some((ace) => component.selection.isSelected(ace))).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should load ACEs and set isReady', async () => {
      component.controller = mockController;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockAclService.list).toHaveBeenCalledWith(mockController);
      expect(component.aces()).toEqual(mockAces);
      expect(component.isReady()).toBe(true);
    });

    it('should clear selection after refresh', async () => {
      component.controller = mockController;
      component.selection.select(mockAces[0]);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selection.isEmpty()).toBe(true);
    });

    it('should display error when list fails', async () => {
      mockAclService.list.mockReturnValue(throwError(() => ({ error: { message: 'Failed to load ACL' } })));
      component.controller = mockController;
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      fixture.detectChanges();

      component.refresh();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load ACL');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error when list fails with no message', async () => {
      mockAclService.list.mockReturnValue(throwError(() => new Error('Network error')));
      component.controller = mockController;
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');
      fixture.detectChanges();

      component.refresh();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnInit error handling', () => {
    it('should display error when getEndpoints fails', async () => {
      mockAclService.getEndpoints.mockReturnValue(throwError(() => ({ error: { message: 'Failed to load endpoints' } })));
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.ngOnInit();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load endpoints');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error when getEndpoints fails with no message', async () => {
      mockAclService.getEndpoints.mockReturnValue(throwError(() => ({})));
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      component.ngOnInit();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load endpoints');
      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('addACE', () => {
    it('should open the create dialog with endpoints as dialog data', () => {
      component.controller = mockController;
      component.endpoints.set(mockEndpoints);

      component.addACE();

      expect(mockDialog.open).toHaveBeenCalledWith(
        AddAceDialogComponent,
        expect.objectContaining({
          data: { endpoints: mockEndpoints },
        })
      );
    });
  });

  describe('onEdit', () => {
    it('should open the edit dialog with the ACE as dialog data', () => {
      component.controller = mockController;
      component.endpoints.set(mockEndpoints);

      component.onEdit(mockAces[0]);

      expect(mockDialog.open).toHaveBeenCalledWith(
        AddAceDialogComponent,
        expect.objectContaining({
          data: { endpoints: mockEndpoints, ace: mockAces[0] },
        })
      );
      expect((mockDialog.open as any).mock.results[0].value.componentInstance.controller).toBe(mockController);
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
    it('should return resource pool name for /pools paths', () => {
      component.resourcePools.set(mockPools);

      const result = component.getNameByUuidFromEndpoint('/pools/pool1');

      expect(result).toBe('Resource pool "Lab Pool"');
    });

    it('should return endpoint name when uuid matches', () => {
      component.endpoints.set(mockEndpoints);

      const result = component.getNameByUuidFromEndpoint('/projects/uuid1');

      expect(result).toBe('Project Alpha');
    });

    it('should return path when no match found in endpoints', () => {
      component.endpoints.set(mockEndpoints);

      const result = component.getNameByUuidFromEndpoint('/nonexistent');

      expect(result).toBe('/nonexistent');
    });

    it('should return empty string for empty input', () => {
      component.endpoints.set(mockEndpoints);

      const result = component.getNameByUuidFromEndpoint('');

      expect(result).toBe('');
    });
  });

  describe('track functions', () => {
    it('should track groups by key', () => {
      seedAces();
      const group = component.aceGroups()[0];

      expect(component.trackGroup(0, group)).toBe(group.key);
    });

    it('should track aces by ace_id', () => {
      expect(component.trackAce(0, mockAces[0])).toBe('ace1');
    });
  });
});
