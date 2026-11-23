/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2026 GNS3 Technologies Inc.
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import { LdapSection, LdapTestResult, ServerSettings } from '@models/server-settings/server-settings';
import { ControllerService } from '@services/controller.service';
import { GroupService } from '@services/group.service';
import { ServerSettingsService } from '@services/server-settings.service';
import { ToasterService } from '@services/toaster.service';
import { UserService } from '@services/user.service';
import { VersionService } from '@services/version.service';
import {
  DirectoryManagementComponent,
  isValidHostOrIp,
  isValidPort,
  isValidTimeout,
} from './directory-management.component';

describe('DirectoryManagementComponent', () => {
  let component: DirectoryManagementComponent;
  let fixture: ComponentFixture<DirectoryManagementComponent>;
  let mockControllerService: any;
  let mockServerSettingsService: any;
  let mockGroupService: any;
  let mockToasterService: any;
  let mockActivatedRoute: any;
  let mockDialog: any;
  let mockVersionService: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    authToken: 'token-123',
    tokenExpired: false,
  } as Controller;

  const mockGroups: Group[] = [
    {
      name: 'Administrators',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      user_group_id: 'grp-1',
      is_builtin: true,
    },
    {
      name: 'Users',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      user_group_id: 'grp-2',
      is_builtin: true,
    },
    {
      name: 'Guests',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      user_group_id: 'grp-3',
      is_builtin: false,
    },
  ];

  const mockLdapSettings: LdapSection = {
    enabled: true,
    uri: 'ldaps://dc1.example.com:636',
    bind_dn: 'svc-gns3@example.com',
    bind_password: '••••••••',
    base_dn: 'DC=example,DC=com',
    user_search_filter:
      '(&(objectClass=user)(|(sAMAccountName={username})(userPrincipalName={username})(mail={username})))',
    user_attr_username: 'sAMAccountName',
    user_attr_email: 'mail',
    user_attr_fullname: 'displayName',
    group_search_base: 'DC=example,DC=com',
    group_search_filter: '(&(objectClass=group)(member={user_dn}))',
    group_mapping: {
      'Domain Admins': 'Administrators',
      'Domain Users': 'Users',
    },
    default_group: 'Users',
    start_tls: false,
    verify_cert: true,
    ca_cert_file: null,
    fallback_to_local: true,
    timeout: 15,
  };

  const mockServerSettings: Partial<ServerSettings> = {
    LDAP: mockLdapSettings,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockServerSettingsService = {
      getServerSettings: vi.fn().mockReturnValue(of(mockServerSettings)),
      updateServerSettings: vi.fn().mockReturnValue(of(mockServerSettings)),
      testLdapConnection: vi.fn().mockReturnValue(
        of({
          status: 'success',
          bind_successful: true,
          user_search_successful: true,
          users_found: 42,
          latency_ms: 12.5,
          message: 'Successfully connected to LDAP server in 12.5ms. Found 42 sample user(s) in base DN.',
        } as LdapTestResult),
      ),
    };

    mockGroupService = {
      getGroups: vi.fn().mockReturnValue(of(mockGroups)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(true)),
      }),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
      parent: {
        snapshot: {
          paramMap: {
            get: vi.fn().mockReturnValue('1'),
          },
        },
      },
    };

    mockVersionService = {
      get: vi.fn().mockReturnValue(of({ version: '3.1.0' })),
    };

    await TestBed.configureTestingModule({
      imports: [DirectoryManagementComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ServerSettingsService, useValue: mockServerSettingsService },
        { provide: GroupService, useValue: mockGroupService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: UserService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
        { provide: VersionService, useValue: mockVersionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectoryManagementComponent);
    component = fixture.componentInstance;
    component['dialog'] = mockDialog;
    fixture.detectChanges();
  });
  it('should create and load controller and directory settings', () => {
    expect(component).toBeTruthy();
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
    expect(mockServerSettingsService.getServerSettings).toHaveBeenCalledWith(mockController);
    expect(mockGroupService.getGroups).toHaveBeenCalledWith(mockController);
    expect(component.isServerSupported()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.serverHost).toBe('dc1.example.com');
    expect(component.serverPort).toBe(636);
    expect(component.useLdaps).toBe(true);
    expect(component.availableGroups.length).toBe(3);
  });

  it('should detect unsupported server when settings.LDAP is missing and fetch version', () => {
    mockServerSettingsService.getServerSettings.mockReturnValue(of({} as ServerSettings));
    mockVersionService.get.mockReturnValue(of({ version: '3.1.0a6' }));

    component.loadData();

    expect(component.isServerSupported()).toBe(false);
    expect(mockVersionService.get).toHaveBeenCalledWith(mockController);
    expect(component.serverVersion()).toBe('3.1.0a6');
  });

  it('should not call updateServerSettings on save if server is unsupported', () => {
    (component.isServerSupported as any).set(false);
    mockServerSettingsService.updateServerSettings.mockClear();

    component.save();

    expect(mockServerSettingsService.updateServerSettings).not.toHaveBeenCalled();
  });

  it('should not call testLdapConnection if server is unsupported', () => {
    (component.isServerSupported as any).set(false);
    mockServerSettingsService.testLdapConnection.mockClear();

    component.testConnection();

    expect(mockServerSettingsService.testLdapConnection).not.toHaveBeenCalled();
  });

  it('should display error when controller loading fails', async () => {
    vi.clearAllMocks();
    mockControllerService.get = vi.fn().mockRejectedValue({ error: { message: 'Controller not found' } });

    component.ngOnInit();
    await vi.runAllTimersAsync();

    expect(component.isLoading()).toBe(false);
    expect(mockToasterService.error).toHaveBeenCalledWith('Controller not found');
  });

  it('should display error when server settings loading fails', () => {
    vi.clearAllMocks();
    mockServerSettingsService.getServerSettings = vi
      .fn()
      .mockReturnValue(throwError(() => ({ error: { message: 'Failed to load settings' } })));

    component.loadData();

    expect(component.isLoading()).toBe(false);
    expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load settings');
  });

  describe('Protocol and URI handling', () => {
    it('should parse ldaps URI and set useLdaps to true', () => {
      component.parseUri('ldaps://ad.example.com:636');
      expect(component.useLdaps).toBe(true);
      expect(component.serverHost).toBe('ad.example.com');
      expect(component.serverPort).toBe(636);
      expect(component.computeUri()).toBe('ldaps://ad.example.com:636');
    });

    it('should parse ldap URI and set useLdaps to false', () => {
      component.parseUri('ldap://openldap.example.com:389');
      expect(component.useLdaps).toBe(false);
      expect(component.serverHost).toBe('openldap.example.com');
      expect(component.serverPort).toBe(389);
      expect(component.computeUri()).toBe('ldap://openldap.example.com:389');
    });

    it('should toggle protocol and update default port', () => {
      component.useLdaps = false;
      component.serverPort = 389;
      component.useLdaps = true;
      component.onProtocolToggle();
      expect(component.serverPort).toBe(636);

      component.useLdaps = false;
      component.onProtocolToggle();
      expect(component.serverPort).toBe(389);
    });
  });

  describe('Directory Type Presets and Filter Generation', () => {
    it('should detect Active Directory from search filter', () => {
      expect(component.directoryType).toBe('active_directory');
    });

    it('should generate AD filter with short username, UPN, and email', () => {
      component.directoryType = 'active_directory';
      component.allowShortUsername = true;
      component.allowUpn = true;
      component.allowEmail = true;
      expect(component.generatedFilter).toBe(
        '(&(objectClass=user)(|(sAMAccountName={username})(userPrincipalName={username})(mail={username})))',
      );
    });

    it('should generate AD filter with only short username', () => {
      component.directoryType = 'active_directory';
      component.allowShortUsername = true;
      component.allowUpn = false;
      component.allowEmail = false;
      expect(component.generatedFilter).toBe('(&(objectClass=user)(sAMAccountName={username}))');
    });

    it('should generate AD filter with only UPN', () => {
      component.directoryType = 'active_directory';
      component.allowShortUsername = false;
      component.allowUpn = true;
      component.allowEmail = false;
      expect(component.generatedFilter).toBe('(&(objectClass=user)(userPrincipalName={username}))');
    });

    it('should generate AD filter with only email', () => {
      component.directoryType = 'active_directory';
      component.allowShortUsername = false;
      component.allowUpn = false;
      component.allowEmail = true;
      expect(component.generatedFilter).toBe('(&(objectClass=user)(mail={username}))');
    });

    it('should switch to OpenLDAP preset and update attributes and filters', () => {
      component.directoryType = 'openldap';
      component.onDirectoryTypeChange();

      expect(component.ldapSettings.user_attr_username).toBe('uid');
      expect(component.ldapSettings.user_attr_email).toBe('mail');
      expect(component.ldapSettings.user_attr_fullname).toBe('cn');
      expect(component.ldapSettings.group_search_filter).toBe('(&(objectClass=groupOfNames)(member={user_dn}))');

      component.allowShortUsername = true;
      component.allowEmail = true;
      expect(component.generatedFilter).toBe('(&(objectClass=person)(|(uid={username})(mail={username})))');

      component.allowShortUsername = true;
      component.allowEmail = false;
      expect(component.generatedFilter).toBe('(&(objectClass=person)(uid={username}))');

      component.allowShortUsername = false;
      component.allowEmail = true;
      expect(component.generatedFilter).toBe('(&(objectClass=person)(mail={username}))');
    });

    it('should auto-expand advanced accordion when custom directory type is selected', () => {
      component.directoryType = 'custom';
      component.onDirectoryTypeChange();

      expect(component.isAdvancedExpanded()).toBe(true);
    });

    it('should return raw user_search_filter in custom mode', () => {
      component.directoryType = 'custom';
      component.ldapSettings.user_search_filter = '(&(customClass=account)(customUser={username}))';
      expect(component.generatedFilter).toBe('(&(customClass=account)(customUser={username}))');
    });
  });

  describe('Group Mapping Table', () => {
    it('should parse loaded group_mapping into table rows', () => {
      expect(component.groupMappings).toEqual([
        { directoryGroup: 'Domain Admins', targetGroup: 'Administrators' },
        { directoryGroup: 'Domain Users', targetGroup: 'Users' },
      ]);
    });

    it('should add a new group mapping row with default group', () => {
      component.addGroupMapping();
      expect(component.groupMappings.length).toBe(3);
      expect(component.groupMappings[2]).toEqual({
        directoryGroup: '',
        targetGroup: 'Administrators',
      });
    });

    it('should remove a group mapping row by index', () => {
      component.removeGroupMapping(0);
      expect(component.groupMappings.length).toBe(1);
      expect(component.groupMappings[0].directoryGroup).toBe('Domain Users');
    });

    it('should package group mappings into JSON object map on buildLdapPayload', () => {
      component.groupMappings = [
        { directoryGroup: 'Domain Admins', targetGroup: 'Administrators' },
        { directoryGroup: '  ', targetGroup: 'Users' },
        { directoryGroup: 'CN=Domain Users,CN=Users,DC=example,DC=com', targetGroup: 'Users' },
      ];

      const payload = component.buildLdapPayload();
      expect(payload.group_mapping).toEqual({
        'Domain Admins': 'Administrators',
        'CN=Domain Users,CN=Users,DC=example,DC=com': 'Users',
      });
    });
  });

  describe('Live Diagnostic Test Connection', () => {
    it('should test in-flight LDAP settings and toast result on success', () => {
      component.testConnection();

      expect(mockServerSettingsService.testLdapConnection).toHaveBeenCalledWith(
        mockController,
        expect.objectContaining({
          uri: 'ldaps://dc1.example.com:636',
          user_search_filter: component.generatedFilter,
        }),
      );
      expect(mockToasterService.success).toHaveBeenCalledWith('Directory server bind successful');
      expect(component.isTesting()).toBe(false);
    });

    it('should toast error message when test fails', () => {
      mockServerSettingsService.testLdapConnection.mockReturnValue(
        of({
          status: 'error',
          bind_successful: false,
          user_search_successful: false,
          users_found: 0,
          latency_ms: 5.0,
          message: 'LDAP protocol error: Invalid credentials',
        } as LdapTestResult),
      );

      component.testConnection();

      expect(mockToasterService.error).toHaveBeenCalledWith('LDAP protocol error: Invalid credentials');
      expect(component.isTesting()).toBe(false);
    });

    it('should toast error on test network failure', () => {
      mockServerSettingsService.testLdapConnection.mockReturnValue(
        throwError(() => ({ error: { message: 'Connection timed out' } })),
      );

      component.testConnection();

      expect(mockToasterService.error).toHaveBeenCalledWith('Connection timed out');
      expect(component.isTesting()).toBe(false);
    });

    it('should not trigger test connection if already testing', () => {
      (component.isTesting as any).set(true);
      mockServerSettingsService.testLdapConnection.mockClear();

      component.testConnection();

      expect(mockServerSettingsService.testLdapConnection).not.toHaveBeenCalled();
    });
  });

  describe('Save and Discard Changes', () => {
    it('should call updateServerSettings with LDAP payload on save', () => {
      component.serverHost = 'new-dc.example.com';
      component.serverPort = 636;
      component.useLdaps = true;
      component.save();

      expect(mockServerSettingsService.updateServerSettings).toHaveBeenCalledWith(
        mockController,
        expect.objectContaining({
          LDAP: expect.objectContaining({
            uri: 'ldaps://new-dc.example.com:636',
          }),
        }),
      );
      expect(mockToasterService.success).toHaveBeenCalledWith('Directory settings saved successfully');
      expect(component.isSaving()).toBe(false);
    });

    it('should handle save error', () => {
      mockServerSettingsService.updateServerSettings.mockReturnValue(
        throwError(() => ({ error: { message: 'Permission denied' } })),
      );

      component.save();

      expect(mockToasterService.error).toHaveBeenCalledWith('Permission denied');
      expect(component.isSaving()).toBe(false);
    });

    it('should include bind_password only if password was changed', () => {
      const payloadUnchanged = component.buildLdapPayload();
      expect(payloadUnchanged.bind_password).toBeUndefined();

      component.bindPassword = 'placeholder_password';
      component.onPasswordInput();

      const payloadChanged = component.buildLdapPayload();
      expect(payloadChanged.bind_password).toBe('placeholder_password');
    });

    it('should discard edits and revert to initial settings', () => {
      component.serverHost = 'modified.example.com';
      component.discardChanges();

      expect(component.serverHost).toBe('dc1.example.com');
      expect(mockToasterService.info).toHaveBeenCalledWith('Changes discarded');
    });

    it('should save settings and display success toast on save()', () => {
      component.serverHost = 'dc.example.com';
      component.save();

      expect(mockServerSettingsService.updateServerSettings).toHaveBeenCalled();
      expect(mockToasterService.success).toHaveBeenCalledWith('Directory settings saved successfully');
    });
  });

  describe('Add Group on the Fly', () => {
    it('should open AddGroupDialog and auto-select new group in row', () => {
      const row = component.groupMappings[0];
      mockGroupService.getGroups.mockReturnValue(
        of([
          ...mockGroups,
          {
            name: 'Security-Auditors',
            user_group_id: 'grp-4',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
            is_builtin: false,
          },
        ]),
      );

      component.openAddGroupDialog(row);

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: { controller: mockController },
        }),
      );
      expect(row.targetGroup).toBe('Security-Auditors');
    });

    it('should open AddGroupDialog and auto-select new default fallback group', () => {
      mockGroupService.getGroups.mockReturnValue(
        of([
          ...mockGroups,
          {
            name: 'Default-Staff',
            user_group_id: 'grp-5',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
            is_builtin: false,
          },
        ]),
      );

      component.openAddGroupDialogForDefault();

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: { controller: mockController },
        }),
      );
      expect(component.ldapSettings.default_group).toBe('Default-Staff');
    });

    it('should handle onTargetGroupSelect with regular group', () => {
      const row = component.groupMappings[0];
      const event: any = { value: 'Users', source: { value: 'Users' } };
      component.onTargetGroupSelect(event, row);
      expect(row.targetGroup).toBe('Users');
    });

    it('should intercept onTargetGroupSelect with __ADD_NEW_GROUP__ and open dialog', () => {
      const row = component.groupMappings[0];
      const event: any = { value: '__ADD_NEW_GROUP__', source: { value: '__ADD_NEW_GROUP__' } };
      component.onTargetGroupSelect(event, row);
      expect(event.source.value).toBe(row.targetGroup);
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should handle onDefaultGroupSelect with regular group', () => {
      const event: any = { value: 'Guests', source: { value: 'Guests' } };
      component.onDefaultGroupSelect(event);
      expect(component.ldapSettings.default_group).toBe('Guests');
    });

    it('should intercept onDefaultGroupSelect with __ADD_NEW_GROUP__ and open dialog', () => {
      const event: any = { value: '__ADD_NEW_GROUP__', source: { value: '__ADD_NEW_GROUP__' } };
      component.onDefaultGroupSelect(event);
      expect(event.source.value).toBe(component.ldapSettings.default_group);
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('Input Validation Suite', () => {
    it('should validate hostnames and FQDNs', () => {
      expect(isValidHostOrIp('dc1.example.com')).toBe(true);
      expect(isValidHostOrIp('ldap.corp.internal')).toBe(true);
      expect(isValidHostOrIp('ad-server')).toBe(true);
      expect(isValidHostOrIp('localhost')).toBe(true);
      expect(isValidHostOrIp('')).toBe(false);
      expect(isValidHostOrIp('   ')).toBe(false);
      expect(isValidHostOrIp('dc1.example.com ')).toBe(false);
      expect(isValidHostOrIp(' 192.168.1.1')).toBe(false);
      expect(isValidHostOrIp('192.168.1.1 ')).toBe(false);
      expect(isValidHostOrIp('invalid..host')).toBe(false);
    });

    it('should validate IPv4 addresses', () => {
      expect(isValidHostOrIp('192.168.1.1')).toBe(true);
      expect(isValidHostOrIp('10.0.0.254')).toBe(true);
      expect(isValidHostOrIp('172.16.0.1')).toBe(true);
      expect(isValidHostOrIp('999.999.999.999')).toBe(false);
      expect(isValidHostOrIp('192.168.1')).toBe(false);
    });

    it('should validate IPv6 addresses', () => {
      expect(isValidHostOrIp('::1')).toBe(true);
      expect(isValidHostOrIp('[::1]')).toBe(true);
      expect(isValidHostOrIp('2001:db8::1')).toBe(true);
      expect(isValidHostOrIp('[2001:db8::1]')).toBe(true);
      expect(isValidHostOrIp('2001:db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isValidHostOrIp('12345::1')).toBe(false);
    });

    it('should validate port numbers (1-65535)', () => {
      expect(isValidPort(1)).toBe(true);
      expect(isValidPort(389)).toBe(true);
      expect(isValidPort(636)).toBe(true);
      expect(isValidPort(65535)).toBe(true);
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(-1)).toBe(false);
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort('636')).toBe(true);
      expect(isValidPort('invalid')).toBe(false);
      expect(isValidPort(null)).toBe(false);
    });

    it('should validate timeout range (1-120 seconds)', () => {
      expect(isValidTimeout(1)).toBe(true);
      expect(isValidTimeout(10)).toBe(true);
      expect(isValidTimeout(120)).toBe(true);
      expect(isValidTimeout(0)).toBe(false);
      expect(isValidTimeout(-1)).toBe(false);
      expect(isValidTimeout(121)).toBe(false);
      expect(isValidTimeout('15')).toBe(true);
      expect(isValidTimeout('abc')).toBe(false);
    });

    it('should check isFormValid and block saving if invalid', () => {
      component.serverHost = 'valid.example.com';
      component.serverPort = 636;
      component.ldapSettings.timeout = 10;
      expect(component.isFormValid()).toBe(true);

      component.serverHost = '';
      expect(component.isFormValid()).toBe(false);
      component.save();
      expect(mockServerSettingsService.updateServerSettings).not.toHaveBeenCalled();
    });
  });

  describe('Manual Save & Fallback Flexibility', () => {
    it('should only persist changes when save() is explicitly called', () => {
      const saveSpy = vi.spyOn(mockServerSettingsService, 'updateServerSettings');
      saveSpy.mockClear();

      component.serverHost = 'dc.example.com';
      component.serverPort = 636;
      component.ldapSettings.timeout = 10;

      // Modifying fields without calling save() does not trigger API updates
      expect(saveSpy).not.toHaveBeenCalled();

      component.save();
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should default default_group to Users when not configured or empty', () => {
      component.ldapSettings.default_group = '';
      const payload = component.buildLdapPayload();
      expect(payload.default_group).toBe('Users');
    });

    it('should update default_group when another valid group is selected', () => {
      const event: any = { value: 'Administrators', source: { value: 'Administrators' } };
      component.onDefaultGroupSelect(event);
      expect(component.ldapSettings.default_group).toBe('Administrators');
      const payload = component.buildLdapPayload();
      expect(payload.default_group).toBe('Administrators');
    });

    it('should allow saving when ldapSettings.enabled is false even if host is invalid', () => {
      component.ldapSettings.enabled = false;
      component.serverHost = 'invalid..host';
      expect(component.isFormValid()).toBe(true);
    });
  });

  describe('HostErrorStateMatcher', () => {
    it('should return true when control is dirty or touched and host is invalid', () => {
      component.serverHost = 'invalid..host';
      const matcher = component.hostErrorStateMatcher;
      expect(matcher.isErrorState({ touched: true } as any, null)).toBe(true);
      expect(matcher.isErrorState({ dirty: true } as any, null)).toBe(true);
    });

    it('should return false when host is valid', () => {
      component.serverHost = 'dc1.example.com';
      const matcher = component.hostErrorStateMatcher;
      expect(matcher.isErrorState({ touched: true } as any, null)).toBe(false);
    });

    it('should return false when control is untouched and pristine', () => {
      component.serverHost = 'invalid..host';
      const matcher = component.hostErrorStateMatcher;
      expect(matcher.isErrorState({ touched: false, dirty: false } as any, null)).toBe(false);
    });
  });

  describe('Insecure HTTP Security Warning', () => {
    it('should detect plain HTTP when window.location.protocol is http:', () => {
      expect(component.isPlainHttp()).toBe(true);
    });

    it('should render security warning banner when ldapSettings.enabled is true and protocol is http:', () => {
      component.ldapSettings.enabled = true;
      fixture.detectChanges();
      const warningElement = fixture.nativeElement.querySelector('.directory-management__security-warning');
      expect(warningElement).not.toBeNull();
      expect(warningElement.textContent).toContain('Insecure HTTP Connection Detected');
    });

    it('should not render security warning banner when ldapSettings.enabled is false', () => {
      component.ldapSettings.enabled = false;
      fixture.detectChanges();
      const warningElement = fixture.nativeElement.querySelector('.directory-management__security-warning');
      expect(warningElement).toBeNull();
    });

    it('should not render security warning banner when isPlainHttp returns false (HTTPS)', () => {
      vi.spyOn(component, 'isPlainHttp').mockReturnValue(false);
      component.ldapSettings.enabled = true;
      fixture.detectChanges();
      const warningElement = fixture.nativeElement.querySelector('.directory-management__security-warning');
      expect(warningElement).toBeNull();
    });
  });
});
