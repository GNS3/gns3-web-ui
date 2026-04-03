import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { RoleDetailComponent } from './role-detail.component';
import { RoleService } from '@services/role.service';
import { PrivilegeService } from '@services/privilege.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Role } from '@models/api/role';
import { Privilege } from '@models/api/Privilege';
import { IPrivilegesChange } from '@components/role-management/role-detail/privilege/IPrivilegesChange';
import { PrivilegeComponent } from '@components/role-management/role-detail/privilege/privilege.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('RoleDetailComponent', () => {
  let component: RoleDetailComponent;
  let fixture: ComponentFixture<RoleDetailComponent>;

  let mockRoleService: Record<string, ReturnType<typeof vi.fn>>;
  let mockPrivilegeService: Record<string, ReturnType<typeof vi.fn>>;
  let mockToastService: Record<string, ReturnType<typeof vi.fn>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockActivatedRoute: Record<string, any>;

  let roleSubject: BehaviorSubject<Role>;

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
  };

  const mockRole: Role = {
    name: 'Admin',
    description: 'Administrator role',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    role_id: 'role-123',
    is_builtin: false,
    privileges: [
      {
        name: 'system.read',
        description: 'Read system info',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        privilege_id: 'priv-1',
      },
    ],
  };

  const mockPrivileges: Privilege[] = [
    {
      name: 'system.read',
      description: 'Read system info',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      privilege_id: 'priv-1',
    },
    {
      name: 'system.write',
      description: 'Write system info',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      privilege_id: 'priv-2',
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    roleSubject = new BehaviorSubject<Role>({ ...mockRole });

    mockRoleService = {
      getById: vi.fn().mockReturnValue(roleSubject.asObservable()),
      update: vi.fn().mockReturnValue(of(mockRole)),
      setPrivileges: vi.fn().mockReturnValue(of(undefined)),
      removePrivileges: vi.fn().mockReturnValue(of(undefined)),
    };

    mockPrivilegeService = {
      get: vi.fn().mockReturnValue(of(mockPrivileges)),
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockActivatedRoute = {
      get data() {
        return of({
          controller: mockController,
          role: mockRole,
        });
      },
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RoleDetailComponent, PrivilegeComponent],
      providers: [
        { provide: RoleService, useValue: mockRoleService },
        { provide: PrivilegeService, useValue: mockPrivilegeService },
        { provide: ToasterService, useValue: mockToastService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with role from route data', () => {
      expect(component.controller).toEqual(mockController);
      expect(mockRoleService.getById).toHaveBeenCalledWith(mockController, mockRole.role_id);
    });

    it('should load privileges', () => {
      expect(mockPrivilegeService.get).toHaveBeenCalledWith(mockController);
    });

    it('should build editRoleForm from role data', () => {
      expect(component.editRoleForm).toBeDefined();
      expect(component.editRoleForm.get('rolename')?.value).toBe(mockRole.name);
      expect(component.editRoleForm.get('description')?.value).toBe(mockRole.description);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to route data and load role', () => {
      const newRole: Role = { ...mockRole, name: 'Updated Admin' };
      roleSubject.next(newRole);
      fixture.detectChanges();

      expect(mockRoleService.getById).toHaveBeenCalledWith(mockController, mockRole.role_id);
    });

    it('should reload role after onUpdate success', () => {
      component.onUpdate();
      fixture.detectChanges();

      expect(mockRoleService.update).toHaveBeenCalled();
      expect(mockRoleService.getById).toHaveBeenCalledTimes(2);
    });
  });

  describe('onUpdate', () => {
    it('should update role name in form', () => {
      component.editRoleForm.patchValue({ rolename: 'New Admin Name' });
      expect(component.editRoleForm.get('rolename')?.value).toBe('New Admin Name');
    });

    it('should update role description in form', () => {
      component.editRoleForm.patchValue({ description: 'New description' });
      expect(component.editRoleForm.get('description')?.value).toBe('New description');
    });

    it('should call roleService.update with current role data', () => {
      component.editRoleForm.patchValue({ rolename: 'Updated Name', description: 'Updated desc' });

      component.onUpdate();

      expect(mockRoleService.update).toHaveBeenCalledWith(mockController, expect.objectContaining({
        name: 'Updated Name',
        description: 'Updated desc',
      }));
    });

    it('should show success toast after update', () => {
      component.onUpdate();

      expect(mockToastService.success).toHaveBeenCalledWith(`Role ${mockRole.name} was updated`);
    });

    it('should reload role after successful update', () => {
      component.onUpdate();
      fixture.detectChanges();

      expect(mockRoleService.getById).toHaveBeenCalledTimes(2);
    });

    it('should show error toast on update failure', () => {
      const errorResponse = { message: 'Update failed', error: { message: 'Server error' } } as any;
      mockRoleService.update.mockReturnValue(throwError(() => errorResponse));

      component.onUpdate();

      expect(mockToastService.error).toHaveBeenCalledWith(`${errorResponse.message}\n${errorResponse.error.message}`);
    });
  });

  describe('onPrivilegesUpdate', () => {
    it('should call setPrivileges for each privilege to add', () => {
      const privilegesChange: IPrivilegesChange = {
        add: ['priv-2', 'priv-3'],
        delete: [],
      };

      mockRoleService.setPrivileges.mockReturnValue(of(undefined));
      mockRoleService.removePrivileges.mockReturnValue(of(undefined));
      mockRoleService.getById.mockReturnValue(of(mockRole));

      component.onPrivilegesUpdate(privilegesChange);
      fixture.detectChanges();

      expect(mockRoleService.setPrivileges).toHaveBeenCalledWith(mockController, mockRole.role_id, 'priv-2');
      expect(mockRoleService.setPrivileges).toHaveBeenCalledWith(mockController, mockRole.role_id, 'priv-3');
    });

    it('should call removePrivileges for each privilege to delete', () => {
      const privilegesChange: IPrivilegesChange = {
        add: [],
        delete: ['priv-1'],
      };

      mockRoleService.setPrivileges.mockReturnValue(of(undefined));
      mockRoleService.removePrivileges.mockReturnValue(of(undefined));
      mockRoleService.getById.mockReturnValue(of(mockRole));

      component.onPrivilegesUpdate(privilegesChange);
      fixture.detectChanges();

      expect(mockRoleService.removePrivileges).toHaveBeenCalledWith(mockController, mockRole.role_id, 'priv-1');
    });

    it('should reload role after privileges update completes', () => {
      const privilegesChange: IPrivilegesChange = { add: ['priv-2'], delete: [] };

      mockRoleService.setPrivileges.mockReturnValue(of(undefined));
      mockRoleService.getById.mockReturnValue(of(mockRole));

      component.onPrivilegesUpdate(privilegesChange);
      fixture.detectChanges();

      expect(mockRoleService.getById).toHaveBeenCalledTimes(2);
    });
  });

  describe('Template Bindings', () => {
    it('should expose $role observable', () => {
      expect(component.$role).toBeDefined();
    });

    it('should expose $ownedPrivilegesId observable derived from $role', () => {
      expect(component.$ownedPrivilegesId).toBeDefined();
    });

    it('should expose privileges observable', () => {
      expect(component.privileges).toBeDefined();
    });
  });
});
