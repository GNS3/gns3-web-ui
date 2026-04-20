import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AddAceDialogComponent } from './add-ace-dialog.component';
import { AceType, ACE } from '@models/api/ACE';
import { Endpoint, RessourceType } from '@models/api/endpoint';
import { EndpointNode } from '@components/acl-management/add-ace-dialog/EndpointTreeAdapter';
import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import { Group } from '@models/groups/group';
import { Role } from '@models/api/role';
import { AclService } from '@services/acl.service';
import { UserService } from '@services/user.service';
import { GroupService } from '@services/group.service';
import { RoleService } from '@services/role.service';
import { ToasterService } from '@services/toaster.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddAceDialogComponent', () => {
  let component: AddAceDialogComponent;
  let fixture: ComponentFixture<AddAceDialogComponent>;

  let mockDialogRef: any;
  let mockAclService: any;
  let mockUserService: any;
  let mockGroupService: any;
  let mockRoleService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;

  const mockController: Controller = {
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

  const mockEndpoints: Endpoint[] = [
    { endpoint: '/access', name: 'Root', endpoint_type: RessourceType.root },
    { endpoint: '/access/projects', name: 'Projects', endpoint_type: RessourceType.project },
    { endpoint: '/access/nodes', name: 'All Nodes', endpoint_type: RessourceType.node },
  ];

  const mockUsers: User[] = [
    { user_id: 'u1', username: 'john', full_name: 'John Doe' } as User,
    { user_id: 'u2', username: 'jane', full_name: 'Jane Smith' } as User,
  ];

  const mockGroups: Group[] = [
    { user_group_id: 'g1', name: 'Admin' } as Group,
    { user_group_id: 'g2', name: 'Users' } as Group,
  ];

  const mockRoles: Role[] = [{ role_id: 'r1', name: 'Admin' } as Role, { role_id: 'r2', name: 'Viewer' } as Role];

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockAclService = {
      add: vi.fn().mockReturnValue(of({} as ACE)),
    };

    mockUserService = {
      list: vi.fn().mockReturnValue(of(mockUsers)),
    };

    mockGroupService = {
      getGroups: vi.fn().mockReturnValue(of(mockGroups)),
    };

    mockRoleService = {
      get: vi.fn().mockReturnValue(of(mockRoles)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddAceDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { endpoints: mockEndpoints } },
        { provide: AclService, useValue: mockAclService },
        { provide: UserService, useValue: mockUserService },
        { provide: GroupService, useValue: mockGroupService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAceDialogComponent);
    component = fixture.componentInstance;
    // Inject controller from service
    component.controller = mockController;
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

    it('should initialize with allowed true', () => {
      expect(component.allowed).toBe(true);
    });

    it('should have correct AceType values', () => {
      expect(component.types).toEqual(Object.values(AceType));
    });
  });

  describe('ngOnInit', () => {
    it('should initialize form with default values', () => {
      component.ngOnInit();

      expect(component.addAceForm).toBeTruthy();
      expect(component.form.type.value).toBe(AceType.user);
      expect(component.form.propagate.value).toBe(true);
    });

    it('should load groups from groupService', () => {
      component.ngOnInit();

      expect(mockGroupService.getGroups).toHaveBeenCalledWith(mockController);
      expect(component.groups).toEqual(mockGroups);
    });

    it('should load users from userService', () => {
      component.ngOnInit();

      expect(mockUserService.list).toHaveBeenCalledWith(mockController);
      expect(component.users).toEqual(mockUsers);
    });

    it('should load roles from roleService', () => {
      component.ngOnInit();

      expect(mockRoleService.get).toHaveBeenCalledWith(mockController);
      expect(component.roles).toEqual(mockRoles);
    });
  });

  describe('onCancelClick', () => {
    it('should close the dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('changeAllowed', () => {
    it('should toggle allowed from true to false', () => {
      component.allowed = true;

      component.changeAllowed();

      expect(component.allowed).toBe(false);
    });

    it('should toggle allowed from false to true', () => {
      component.allowed = false;

      component.changeAllowed();

      expect(component.allowed).toBe(true);
    });
  });

  describe('displayFn', () => {
    it('should return name when value has name property', () => {
      const result = component.displayFn({ name: 'Test' });

      expect(result).toBe('Test');
    });

    it('should return empty string when value is null', () => {
      const result = component.displayFn(null);

      expect(result).toBe('');
    });

    it('should return empty string when value has no name', () => {
      const result = component.displayFn({});

      expect(result).toBe('');
    });
  });

  describe('displayFnUser', () => {
    it('should return username when full_name is missing', () => {
      const result = component.displayFnUser({ username: 'john' });

      expect(result).toBe('john');
    });

    it('should return username - full_name when full_name exists', () => {
      const result = component.displayFnUser({ username: 'john', full_name: 'John Doe' });

      expect(result).toBe('john - John Doe');
    });

    it('should return empty string when value is null', () => {
      const result = component.displayFnUser(null);

      expect(result).toBe('');
    });

    it('should return empty string when username is missing', () => {
      const result = component.displayFnUser({ full_name: 'John Doe' });

      expect(result).toBe('');
    });
  });

  describe('_filter', () => {
    it('should filter data by name case-insensitively', () => {
      const data = [{ name: 'Apple' }, { name: 'Banana' }, { name: 'apricot' }];

      const result = component._filter('ap', data);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Apple');
      expect(result[1].name).toBe('apricot');
    });

    it('should return empty array when no matches', () => {
      const data = [{ name: 'Apple' }, { name: 'Banana' }];

      const result = component._filter('xyz', data);

      expect(result).toEqual([]);
    });

    it('should return empty array when value is not a string', () => {
      const data = [{ name: 'Apple' }];

      const result = component._filter(123 as any, data);

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', () => {
      const result = component._filter('test', null);

      expect(result).toEqual([]);
    });
  });

  describe('_filterUser', () => {
    it('should filter users by username case-insensitively', () => {
      const result = component._filterUser('jo', mockUsers);

      expect(result.length).toBe(1);
      expect(result[0].username).toBe('john');
    });

    it('should filter users by full_name case-insensitively', () => {
      const result = component._filterUser('john', mockUsers);

      expect(result.length).toBe(1);
      expect(result[0].username).toBe('john');
    });

    it('should return empty array when no matches', () => {
      const result = component._filterUser('xyz', mockUsers);

      expect(result).toEqual([]);
    });
  });

  describe('_filterRole', () => {
    it('should filter roles by name case-insensitively', () => {
      const result = component._filterRole('admin', mockRoles);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Admin');
    });

    it('should return empty array when no matches', () => {
      const result = component._filterRole('xyz', mockRoles);

      expect(result).toEqual([]);
    });
  });

  describe('userSelection', () => {
    it('should set selectedUser', () => {
      const user = mockUsers[0];

      component.userSelection(user);

      expect(component.selectedUser).toBe(user);
    });
  });

  describe('groupSelection', () => {
    it('should set selectedGroup', () => {
      const group = mockGroups[0];

      component.groupSelection(group);

      expect(component.selectedGroup).toBe(group);
    });
  });

  describe('roleSelection', () => {
    it('should set selectedRole', () => {
      const role = mockRoles[0];

      component.roleSelection(role);

      expect(component.selectedRole).toBe(role);
    });
  });

  describe('endpointSelection', () => {
    it('should set selectedEndpoint from EndpointNode', () => {
      const endpointNode: EndpointNode = {
        endpoint: '/projects',
        endpoint_type: RessourceType.project,
        name: 'Projects',
        depth: 0,
        splitEndp: ['projects'],
      };

      component.endpointSelection(endpointNode);

      expect(component.selectedEndpoint).toEqual({
        endpoint: '/projects',
        endpoint_type: RessourceType.project,
        name: 'Projects',
      });
    });
  });

  describe('hasChild', () => {
    it('should return true when node has children', () => {
      const node: EndpointNode = {
        endpoint: '/projects',
        endpoint_type: RessourceType.project,
        name: 'Projects',
        depth: 0,
        splitEndp: ['projects'],
        children: [
          {
            endpoint: '/projects/vpcs',
            name: 'VPCs',
            endpoint_type: RessourceType.node,
            depth: 1,
            splitEndp: ['projects', 'vpcs'],
          },
        ],
      };

      const result = component.hasChild(0, node);

      expect(result).toBe(true);
    });

    it('should return false when node has no children', () => {
      const node: EndpointNode = {
        endpoint: '/projects',
        endpoint_type: RessourceType.project,
        name: 'Projects',
        depth: 0,
        splitEndp: ['projects'],
        children: [],
      };

      const result = component.hasChild(0, node);

      expect(result).toBe(false);
    });

    it('should return false when node has undefined children', () => {
      const node: EndpointNode = {
        endpoint: '/projects',
        endpoint_type: RessourceType.project,
        name: 'Projects',
        depth: 0,
        splitEndp: ['projects'],
      };

      const result = component.hasChild(0, node);

      expect(result).toBe(false);
    });
  });

  describe('form getter', () => {
    it('should return form controls', () => {
      component.ngOnInit();

      expect(component.form).toBeTruthy();
      expect(component.form.type).toBeTruthy();
      expect(component.form.propagate).toBeTruthy();
    });
  });

  describe('onAddClick', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should not call aclService.add when path is missing', () => {
      component.selectedEndpoint = null;
      component.selectedRole = mockRoles[0];
      component.selectedUser = mockUsers[0];

      component.onAddClick();

      expect(mockAclService.add).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not call aclService.add when role_id is missing', () => {
      component.selectedEndpoint = { endpoint: '/projects', name: 'Projects', endpoint_type: RessourceType.project };
      component.selectedRole = null;
      component.selectedUser = mockUsers[0];

      component.onAddClick();

      expect(mockAclService.add).not.toHaveBeenCalled();
    });

    it('should not call aclService.add when user_id and group_id are missing', () => {
      component.selectedEndpoint = { endpoint: '/projects', name: 'Projects', endpoint_type: RessourceType.project };
      component.selectedRole = mockRoles[0];
      component.selectedUser = null;
      component.selectedGroup = null;

      component.onAddClick();

      expect(mockAclService.add).not.toHaveBeenCalled();
    });

    it('should call aclService.add with user_id when type is user', () => {
      component.selectedEndpoint = { endpoint: '/projects', name: 'Projects', endpoint_type: RessourceType.project };
      component.selectedRole = mockRoles[0];
      component.selectedUser = mockUsers[0];
      component.selectedGroup = null;
      component.form.type.setValue(AceType.user);

      component.onAddClick();

      expect(mockAclService.add).toHaveBeenCalledWith(
        mockController,
        expect.objectContaining({
          ace_type: AceType.user,
          user_id: 'u1',
          group_id: null,
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should call aclService.add with group_id when type is group', () => {
      component.selectedEndpoint = { endpoint: '/projects', name: 'Projects', endpoint_type: RessourceType.project };
      component.selectedRole = mockRoles[0];
      component.selectedUser = null;
      component.selectedGroup = mockGroups[0];
      component.form.type.setValue(AceType.group);

      component.onAddClick();

      expect(mockAclService.add).toHaveBeenCalledWith(
        mockController,
        expect.objectContaining({
          ace_type: AceType.group,
          user_id: null,
          group_id: 'g1',
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should call aclService.add with propagate value', () => {
      component.selectedEndpoint = { endpoint: '/projects', name: 'Projects', endpoint_type: RessourceType.project };
      component.selectedRole = mockRoles[0];
      component.selectedUser = mockUsers[0];
      component.form.propagate.setValue(false);

      component.onAddClick();

      expect(mockAclService.add).toHaveBeenCalledWith(
        mockController,
        expect.objectContaining({
          propagate: false,
        })
      );
    });

    it('should call aclService.add with allowed value', () => {
      component.selectedEndpoint = { endpoint: '/projects', name: 'Projects', endpoint_type: RessourceType.project };
      component.selectedRole = mockRoles[0];
      component.selectedUser = mockUsers[0];
      component.allowed = false;

      component.onAddClick();

      expect(mockAclService.add).toHaveBeenCalledWith(
        mockController,
        expect.objectContaining({
          allowed: false,
        })
      );
    });

    it('should show success toast on successful add', () => {
      component.selectedEndpoint = { endpoint: '/projects', name: 'Projects', endpoint_type: RessourceType.project };
      component.selectedRole = mockRoles[0];
      component.selectedUser = mockUsers[0];

      component.onAddClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('ACE was added for path /projects');
    });

    it('should show error toast on failed add', () => {
      mockAclService.add.mockReturnValue(throwError(() => ({ error: { message: 'Failed to add ACE' } })));
      component.selectedEndpoint = { endpoint: '/projects', name: 'Projects', endpoint_type: RessourceType.project };
      component.selectedRole = mockRoles[0];
      component.selectedUser = mockUsers[0];

      component.onAddClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot create ACE: Failed to add ACE');
    });
  });
});
