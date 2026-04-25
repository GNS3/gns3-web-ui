/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 *
 * Author: Sylvain MATHIEU, Elise LEBEAU
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Controller } from '@models/controller';
import { Role } from '@models/api/role';
import { RoleManagementComponent } from './role-management.component';
import { RoleService } from '@services/role.service';
import { ControllerService } from '@services/controller.service';
import { ProgressService } from '../../common/progress/progress.service';
import { ToasterService } from '@services/toaster.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';

describe('RoleManagementComponent', () => {
  let component: RoleManagementComponent;
  let fixture: ComponentFixture<RoleManagementComponent>;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockRoleService: any;
  let mockControllerService: any;
  let mockProgressService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
  let mockDialogRef: any;

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

  const mockRoles: Role[] = [
    {
      name: 'Admin',
      description: 'Administrator role',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      role_id: 'role-1',
      is_builtin: true,
      privileges: [],
    },
    {
      name: 'User',
      description: 'User role',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      role_id: 'role-2',
      is_builtin: false,
      privileges: [],
    },
  ];

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn(),
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

    mockRoleService = {
      get: vi.fn().mockReturnValue(of(mockRoles)),
      create: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockProgressService = {
      setError: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(null)),
      componentInstance: {},
    };

    await TestBed.configureTestingModule({
      imports: [RoleManagementComponent, MatDialogModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: RoleService, useValue: mockRoleService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: Overlay, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleManagementComponent);
    component = fixture.componentInstance;
    // Manually set controller since ngOnInit uses a promise that needs to resolve
    component.controller = mockController;
    // Run initial change detection and timers
    vi.runAllTimers();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should fetch controller and load roles', () => {
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should set isReady signal to true after roles load', () => {
      expect(component.isReady()).toBe(true);
    });

    it('should set dataSource data after roles load', () => {
      expect(component.dataSource.data).toEqual(mockRoles);
    });

    it('should initialize with empty selection', () => {
      expect(component.selection.isEmpty()).toBe(true);
    });
  });

  describe('isAllSelected', () => {
    it('should return true when all rows are selected', () => {
      component.selection.select(...mockRoles);
      expect(component.isAllSelected()).toBe(true);
    });

    it('should return false when not all rows are selected', () => {
      component.selection.select(mockRoles[0]);
      expect(component.isAllSelected()).toBe(false);
    });

    it('should return false when no rows are selected', () => {
      expect(component.isAllSelected()).toBe(false);
    });
  });

  describe('masterToggle', () => {
    it('should select all rows when none are selected', () => {
      component.masterToggle();
      expect(component.selection.selected.length).toBe(mockRoles.length);
    });

    it('should clear selection when all rows are selected', () => {
      component.selection.select(...mockRoles);
      component.masterToggle();
      expect(component.selection.isEmpty()).toBe(true);
    });
  });

  describe('addRole', () => {
    it('should open add role dialog', () => {
      vi.spyOn(component.dialog, 'open').mockReturnValue(mockDialogRef as any);
      component.addRole();
      expect(component.dialog.open).toHaveBeenCalled();
    });

    it('should not create role when dialog is closed without result', () => {
      mockDialogRef.afterClosed.mockReturnValue(of(null));
      component.addRole();
      expect(mockRoleService.create).not.toHaveBeenCalled();
    });
  });

  describe('onDelete', () => {
    it('should open delete role dialog', () => {
      vi.spyOn(component.dialog, 'open').mockReturnValue(mockDialogRef as any);
      component.onDelete(mockRoles);
      expect(component.dialog.open).toHaveBeenCalled();
    });

    it('should not delete roles when dialog is closed without confirmation', () => {
      mockDialogRef.afterClosed.mockReturnValue(of(false));
      component.onDelete(mockRoles);
      expect(mockRoleService.delete).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should fetch roles from service', () => {
      mockRoleService.get.mockClear();
      component.refresh();
      vi.runAllTimers();
      fixture.detectChanges();
      expect(mockRoleService.get).toHaveBeenCalledWith(mockController);
    });

    it('should set error on progress service when fetch fails', () => {
      const error = { error: { message: 'Failed to load' } };
      mockRoleService.get.mockReturnValue(throwError(() => error));
      component.refresh();
      vi.runAllTimers();
      fixture.detectChanges();
      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load');
      expect(mockProgressService.setError).toHaveBeenCalledWith(error);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller failed' } });

      const newFixture = TestBed.createComponent(RoleManagementComponent);
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller failed');
    });

    it('should use fallback message when controller error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      const newFixture = TestBed.createComponent(RoleManagementComponent);
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should use fallback message when refresh error has no message', async () => {
      mockRoleService.get.mockReturnValue(throwError(() => ({})));
      component.refresh();
      vi.runAllTimers();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load roles');
    });

    it('should show error toaster when create role fails', async () => {
      const dialogMock = {
        afterClosed: vi.fn().mockReturnValue(of({ name: 'Admin', description: 'Test' })),
        componentInstance: {},
      };
      vi.spyOn(component.dialog, 'open').mockReturnValue(dialogMock as any);
      mockRoleService.create.mockReturnValue(throwError(() => ({ error: { message: 'Create failed' } })));

      component.addRole();

      expect(mockToasterService.error).toHaveBeenCalledWith('Create failed');
    });

    it('should use fallback message when create error has no message', async () => {
      const dialogMock = {
        afterClosed: vi.fn().mockReturnValue(of({ name: 'Admin', description: 'Test' })),
        componentInstance: {},
      };
      vi.spyOn(component.dialog, 'open').mockReturnValue(dialogMock as any);
      mockRoleService.create.mockReturnValue(throwError(() => ({})));

      component.addRole();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to create role');
    });

    it('should show error toaster when delete roles fails', async () => {
      const dialogMock = {
        afterClosed: vi.fn().mockReturnValue(of(true)),
        componentInstance: {},
      };
      vi.spyOn(component.dialog, 'open').mockReturnValue(dialogMock as any);
      mockRoleService.delete.mockReturnValue(throwError(() => ({ error: { message: 'Delete failed' } })));

      component.onDelete(mockRoles);

      expect(mockToasterService.error).toHaveBeenCalledWith('Delete failed');
    });

    it('should use fallback message when delete error has no message', async () => {
      const dialogMock = {
        afterClosed: vi.fn().mockReturnValue(of(true)),
        componentInstance: {},
      };
      vi.spyOn(component.dialog, 'open').mockReturnValue(dialogMock as any);
      mockRoleService.delete.mockReturnValue(throwError(() => ({})));

      component.onDelete(mockRoles);

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to delete roles');
    });
  });
});
