import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EMPTY, of } from 'rxjs';
import { WritableSignal, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';

import { DefaultLayoutComponent } from './default-layout.component';
import { ControllerManagementService } from '@services/controller-management.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { UserService } from '@services/user.service';
import { ProgressService } from '../../common/progress/progress.service';
import { ConnectionManagerService } from '@services/connection-manager.service';
import { NotificationCenterService } from '@services/notification-center.service';
import { PermissionService } from '@services/permission.service';
import { SessionResetService } from '@services/session-reset.service';
import { ProjectDistributionService } from '@services/project-distribution.service';

describe('DefaultLayoutComponent (sidebar privilege links)', () => {
  let fixture: ComponentFixture<DefaultLayoutComponent>;
  let privileges: WritableSignal<ReadonlySet<string>>;

  const notificationCenter = {
    notifications: signal<unknown[]>([]),
    panelOpen: signal(false),
    unreadCount: signal(0),
    activityCount: signal(0),
    errorCount: signal(0),
    warningCount: signal(0),
    clear: vi.fn(),
    closePanel: vi.fn(),
    markAllAsRead: vi.fn(),
    markAsRead: vi.fn(),
    remove: vi.fn(),
    togglePanel: vi.fn(),
  };

  function createLayout(heldPrivileges: string[]): void {
    privileges.set(new Set(heldPrivileges));
    fixture = TestBed.createComponent(DefaultLayoutComponent);
    fixture.detectChanges();
  }

  /** The sidebar's Access Management anchor (null when the privilege gate hides it). */
  function accessManagementHref(): string | null {
    const anchors = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'));
    const link = anchors.find((anchor) => anchor.textContent?.includes('Access Management'));
    return link?.getAttribute('href') ?? null;
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    privileges = signal<ReadonlySet<string>>(new Set());

    const permissionService = {
      privileges,
      isSuperadmin: signal(false),
      loaded: signal(true),
      has: (privilege: string) => privileges().has(privilege),
      hasAny: (list: string[]) => list.some((privilege) => privileges().has(privilege)),
      activate: vi.fn(),
      cachedPrivileges: vi.fn(() => privileges()),
      invalidate: vi.fn(),
      ready: vi.fn().mockResolvedValue(privileges()),
    };

    await TestBed.configureTestingModule({
      imports: [DefaultLayoutComponent, RouterModule.forRoot([])],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'controller_id' ? '1' : null) } },
            // The sidebar derives its privilege gates from this layout's
            // route config — mirror the app-routing structure (the privilege
            // sets live only there, which is the point of the derivation).
            routeConfig: {
              children: [
                {
                  path: 'controller/:controller_id/image-manager',
                  data: { privileges: ['Image.Audit'], privilegesAny: ['Image.Allocate', 'Compute.Modify'] },
                },
                {
                  path: 'controller/:controller_id/preferences',
                  data: { privileges: ['Template.Audit'], privilegesAny: ['Template.Allocate', 'Template.Modify'] },
                },
                {
                  path: 'controller/:controller_id/computes',
                  data: { privileges: ['Compute.Audit'], privilegesAny: ['Compute.Allocate', 'Compute.Modify'] },
                },
                {
                  path: 'controller/:controller_id/management',
                  children: [
                    { path: 'users', data: { privileges: ['User.Audit'] } },
                    { path: 'groups', data: { privileges: ['Group.Audit'] } },
                    { path: 'roles', data: { privileges: ['Role.Audit'] } },
                    { path: 'pools', data: { privileges: ['Pool.Audit'] } },
                    { path: 'ACL', data: { privileges: ['ACE.Audit'] } },
                  ],
                },
              ],
            },
          },
        },
        { provide: ControllerManagementService, useValue: { controllerStatusChanged: EMPTY, stopAll: vi.fn() } },
        {
          provide: ControllerService,
          useValue: { get: vi.fn().mockResolvedValue({ id: 1, username: 'tester' }), update: vi.fn() },
        },
        { provide: ToasterService, useValue: { error: vi.fn(), success: vi.fn() } },
        { provide: UserService, useValue: { getInformationAboutLoggedUser: vi.fn().mockReturnValue(of({})) } },
        { provide: ProgressService, useValue: { state: of({ visible: false }), clear: vi.fn() } },
        { provide: ConnectionManagerService, useValue: { disconnect: vi.fn() } },
        { provide: NotificationCenterService, useValue: notificationCenter },
        { provide: PermissionService, useValue: permissionService },
        { provide: SessionResetService, useValue: { reset: vi.fn() } },
        { provide: ProjectDistributionService, useValue: { tracked: signal([]), dismiss: vi.fn(), cancel: vi.fn() } },
        { provide: BreakpointObserver, useValue: { observe: vi.fn().mockReturnValue(of({ matches: false, breakpoints: {} })) } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  it('links to Users when the user holds User.Audit', () => {
    createLayout(['User.Audit']);

    expect(accessManagementHref()).toBe('/controller/1/management/users');
  });

  it('links to the first tab the user may open (Groups, not the denied Users tab)', () => {
    createLayout(['Group.Audit']);

    expect(accessManagementHref()).toBe('/controller/1/management/groups');
  });

  it('skips every denied tab and lands on the first allowed one in tab order', () => {
    createLayout(['ACE.Audit', 'Role.Audit']);

    expect(accessManagementHref()).toBe('/controller/1/management/roles');
  });

  it('hides the entry when the user holds no management privilege', () => {
    createLayout(['Project.Audit']);

    expect(accessManagementHref()).toBeNull();
  });
});
