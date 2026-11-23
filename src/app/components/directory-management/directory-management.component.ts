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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AddGroupDialogComponent } from '@components/group-management/add-group-dialog/add-group-dialog.component';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import { LdapSection } from '@models/server-settings/server-settings';
import { ControllerService } from '@services/controller.service';
import { GroupService } from '@services/group.service';
import { ServerSettingsService } from '@services/server-settings.service';
import { ToasterService } from '@services/toaster.service';
import { VersionService } from '@services/version.service';

export type DirectoryType = 'active_directory' | 'openldap' | 'custom';

export interface GroupMappingRow {
  directoryGroup: string;
  targetGroup: string;
  isSuperadmin?: boolean;
}

export function isValidHostOrIp(value: string | null | undefined): boolean {
  if (!value || !value.trim()) {
    return false;
  }
  // Host or IP must not contain any whitespace (leading, trailing, or internal)
  if (/\s/.test(value)) {
    return false;
  }
  const clean = value.replace(/^ldaps?:\/\//, '');
  if (!clean) {
    return false;
  }

  // If value consists of numbers separated by dots (looks like an IPv4)
  if (/^(\d+\.){3}\d+$/.test(clean)) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(clean);
  }

  const rawIpv6 = clean.replace(/^\[/, '').replace(/\]$/, '');
  const ipv6Regex =
    /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}$|^:(?::[0-9a-fA-F]{1,4}){1,7}$|^::$|^fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+$/;
  if (ipv6Regex.test(rawIpv6)) {
    return true;
  }

  // RFC 1123: Dotted domain names must not end with an all-numeric TLD
  if (clean.includes('.') && /^\d+$/.test(clean.split('.').pop() || '')) {
    return false;
  }

  const fqdnRegex =
    /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-_]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-_]{0,61}[a-zA-Z0-9])?$/;
  return fqdnRegex.test(clean);
}

export function isValidPort(port: number | string | null | undefined): boolean {
  if (port === null || port === undefined || port === '') {
    return false;
  }
  const num = typeof port === 'number' ? port : Number(port);
  return Number.isInteger(num) && num >= 1 && num <= 65535;
}

export function isValidTimeout(timeout: number | string | null | undefined): boolean {
  if (timeout === null || timeout === undefined || timeout === '') {
    return false;
  }
  const num = typeof timeout === 'number' ? timeout : Number(timeout);
  return Number.isInteger(num) && num >= 1 && num <= 120;
}

export class HostErrorStateMatcher implements ErrorStateMatcher {
  constructor(private isHostValidFn: () => boolean) {}

  isErrorState(control: any | null, form: any | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && (control.touched || control.dirty || isSubmitted) && !this.isHostValidFn());
  }
}

export const DEFAULT_LDAP_SETTINGS: LdapSection = {
  enabled: false,
  uri: 'ldaps://localhost:636',
  bind_dn: null,
  bind_password: null,
  base_dn: '',
  user_search_filter:
    '(&(objectClass=user)(|(sAMAccountName={username})(userPrincipalName={username})(mail={username})))',
  user_attr_username: 'sAMAccountName',
  user_attr_email: 'mail',
  user_attr_fullname: 'displayName',
  group_search_base: null,
  group_search_filter: '(&(objectClass=group)(member={user_dn}))',
  group_mapping: {},
  superadmin_groups: [],
  default_group: 'Users',
  start_tls: false,
  verify_cert: true,
  ca_cert_file: null,
  fallback_to_local: true,
  timeout: 10,
};

@Component({
  standalone: true,
  selector: 'app-directory-management',
  templateUrl: './directory-management.component.html',
  styleUrl: './directory-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
  ],
})
export class DirectoryManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private serverSettingsService = inject(ServerSettingsService);
  private groupService = inject(GroupService);
  private toasterService = inject(ToasterService);
  private versionService = inject(VersionService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isTesting = signal(false);
  readonly isServerSupported = signal(true);
  readonly serverVersion = signal<string | null>(null);
  readonly isAdvancedExpanded = signal(false);

  controller: Controller | undefined;
  availableGroups: Group[] = [];
  groupMappings: GroupMappingRow[] = [];
  displayedMappingColumns: string[] = ['directoryGroup', 'targetGroup', 'isSuperadmin', 'actions'];

  // Host and port separation for protocol toggle
  serverHost = 'localhost';
  serverPort = 636;
  useLdaps = true;
  readonly hostErrorStateMatcher = new HostErrorStateMatcher(() => this.isHostValid());

  directoryType: DirectoryType = 'active_directory';
  allowShortUsername = true;
  allowUpn = true;
  allowEmail = true;

  hidePassword = true;
  bindPassword = '';
  passwordChanged = false;

  ldapSettings: LdapSection = { ...DEFAULT_LDAP_SETTINGS };
  private initialSettings: LdapSection | null = null;

  ngOnInit(): void {
    const controllerId =
      this.route.snapshot.paramMap.get('controller_id') ??
      this.route.parent?.snapshot.paramMap.get('controller_id') ??
      '';

    if (!controllerId) {
      this.isLoading.set(false);
      this.toasterService.error('Controller ID missing');
      return;
    }

    this.controllerService.get(Number.parseInt(controllerId, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.loadData();
      },
      (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(msg);
        this.cd.markForCheck();
      },
    );
  }

  loadData(): void {
    if (!this.controller) {
      return;
    }
    this.isLoading.set(true);

    forkJoin({
      settings: this.serverSettingsService.getServerSettings(this.controller),
      groups: this.groupService.getGroups(this.controller).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ settings, groups }) => {
        this.availableGroups = groups || [];
        const hasLdap = settings?.LDAP !== undefined && settings?.LDAP !== null;
        this.isServerSupported.set(hasLdap);
        if (hasLdap) {
          this.initForm(settings.LDAP);
        } else {
          this.versionService.get(this.controller!).subscribe({
            next: (v) => {
              this.serverVersion.set(v.version);
              this.cd.markForCheck();
            },
            error: () => {
              this.serverVersion.set(null);
              this.cd.markForCheck();
            },
          });
        }
        this.isLoading.set(false);
        this.cd.markForCheck();
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.message || 'Failed to load directory settings';
        this.toasterService.error(msg);
        this.cd.markForCheck();
      },
    });
  }

  parseUri(uri: string): void {
    if (!uri) {
      this.useLdaps = true;
      this.serverHost = 'localhost';
      this.serverPort = 636;
      return;
    }

    const isLdaps = uri.startsWith('ldaps://');
    this.useLdaps = isLdaps;

    const clean = uri.replace(/^ldaps?:\/\//, '');
    const parts = clean.split(':');
    this.serverHost = parts[0] || 'localhost';
    if (parts[1]) {
      const parsedPort = parseInt(parts[1], 10);
      this.serverPort = isNaN(parsedPort) ? (isLdaps ? 636 : 389) : parsedPort;
    } else {
      this.serverPort = isLdaps ? 636 : 389;
    }
  }

  computeUri(): string {
    const protocol = this.useLdaps ? 'ldaps://' : 'ldap://';
    const host = (this.serverHost || 'localhost').trim().replace(/^ldaps?:\/\//, '');
    const port = this.serverPort || (this.useLdaps ? 636 : 389);
    return `${protocol}${host}:${port}`;
  }

  onProtocolToggle(): void {
    if (this.useLdaps && this.serverPort === 389) {
      this.serverPort = 636;
    } else if (!this.useLdaps && this.serverPort === 636) {
      this.serverPort = 389;
    }
    this.cd.markForCheck();
  }

  initForm(ldap: LdapSection | undefined): void {
    const raw = ldap ? { ...ldap } : { ...DEFAULT_LDAP_SETTINGS };
    this.ldapSettings = {
      ...DEFAULT_LDAP_SETTINGS,
      ...raw,
      group_mapping: { ...(raw.group_mapping || {}) },
    };
    this.initialSettings = JSON.parse(JSON.stringify(this.ldapSettings));

    this.parseUri(this.ldapSettings.uri);

    this.directoryType = this.detectDirectoryType(this.ldapSettings);
    this.initFormatFlags(this.ldapSettings, this.directoryType);

    this.bindPassword = '';
    this.passwordChanged = false;

    const superadminSet = new Set((this.ldapSettings.superadmin_groups || []).map((s) => s.trim().toLowerCase()));
    this.groupMappings = Object.entries(this.ldapSettings.group_mapping || {}).map(([directoryGroup, targetGroup]) => ({
      directoryGroup,
      targetGroup,
      isSuperadmin: superadminSet.has(directoryGroup.trim().toLowerCase()),
    }));

    if (!this.ldapSettings.default_group) {
      this.ldapSettings.default_group = 'Users';
    }
  }

  isHostValid(): boolean {
    return isValidHostOrIp(this.serverHost);
  }

  isPortValid(): boolean {
    return isValidPort(this.serverPort);
  }

  isTimeoutValid(): boolean {
    return isValidTimeout(this.ldapSettings.timeout);
  }

  isPlainHttp(): boolean {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.protocol === 'http:';
    }
    return false;
  }

  isFormValid(): boolean {
    if (!this.ldapSettings.enabled) {
      return true;
    }
    return this.isHostValid() && this.isPortValid() && this.isTimeoutValid();
  }

  detectDirectoryType(settings: LdapSection): DirectoryType {
    const filter = settings.user_search_filter || '';
    const userAttr = settings.user_attr_username || '';

    if (
      userAttr === 'sAMAccountName' ||
      filter.includes('sAMAccountName') ||
      filter.includes('userPrincipalName') ||
      filter.includes('objectClass=user')
    ) {
      return 'active_directory';
    }

    if (
      (userAttr === 'uid' || filter.includes('uid=')) &&
      (filter.includes('objectClass=person') || filter.includes('objectClass=inetOrgPerson'))
    ) {
      return 'openldap';
    }

    if (!filter) {
      return 'active_directory';
    }

    return 'custom';
  }

  initFormatFlags(settings: LdapSection, type: DirectoryType): void {
    const filter = settings.user_search_filter || '';
    if (type === 'active_directory') {
      this.allowShortUsername = !filter || filter.includes('sAMAccountName');
      this.allowUpn = filter.includes('userPrincipalName');
      this.allowEmail = filter.includes('mail=');
      if (!this.allowShortUsername && !this.allowUpn && !this.allowEmail) {
        this.allowShortUsername = true;
        this.allowUpn = true;
        this.allowEmail = true;
      }
    } else if (type === 'openldap') {
      this.allowShortUsername = !filter || filter.includes('uid=');
      this.allowUpn = false;
      this.allowEmail = filter.includes('mail=');
      if (!this.allowShortUsername && !this.allowEmail) {
        this.allowShortUsername = true;
        this.allowEmail = true;
      }
    } else {
      this.allowShortUsername = true;
      this.allowUpn = true;
      this.allowEmail = true;
    }
  }

  get generatedFilter(): string {
    if (this.directoryType === 'active_directory') {
      const criteria: string[] = [];
      if (this.allowShortUsername) {
        criteria.push('(sAMAccountName={username})');
      }
      if (this.allowUpn) {
        criteria.push('(userPrincipalName={username})');
      }
      if (this.allowEmail) {
        criteria.push('(mail={username})');
      }

      if (criteria.length === 0) {
        criteria.push('(sAMAccountName={username})');
      }

      const match = criteria.length === 1 ? criteria[0] : `(|${criteria.join('')})`;
      return `(&(objectClass=user)${match})`;
    } else if (this.directoryType === 'openldap') {
      const criteria: string[] = [];
      if (this.allowShortUsername) {
        criteria.push('(uid={username})');
      }
      if (this.allowEmail) {
        criteria.push('(mail={username})');
      }

      if (criteria.length === 0) {
        criteria.push('(uid={username})');
      }

      const match = criteria.length === 1 ? criteria[0] : `(|${criteria.join('')})`;
      return `(&(objectClass=person)${match})`;
    }
    return this.ldapSettings.user_search_filter;
  }

  onDirectoryTypeChange(): void {
    if (this.directoryType === 'active_directory') {
      this.ldapSettings.user_attr_username = 'sAMAccountName';
      this.ldapSettings.user_attr_email = 'mail';
      this.ldapSettings.user_attr_fullname = 'displayName';
      this.ldapSettings.group_search_filter = '(&(objectClass=group)(member={user_dn}))';
    } else if (this.directoryType === 'openldap') {
      this.ldapSettings.user_attr_username = 'uid';
      this.ldapSettings.user_attr_email = 'mail';
      this.ldapSettings.user_attr_fullname = 'cn';
      this.ldapSettings.group_search_filter = '(&(objectClass=groupOfNames)(member={user_dn}))';
    } else if (this.directoryType === 'custom') {
      this.isAdvancedExpanded.set(true);
    }
    this.cd.markForCheck();
  }

  onPasswordInput(): void {
    this.passwordChanged = true;
  }

  addGroupMapping(): void {
    const defaultTarget = this.availableGroups.length > 0 ? this.availableGroups[0].name : 'Users';
    this.groupMappings = [
      ...this.groupMappings,
      {
        directoryGroup: '',
        targetGroup: defaultTarget,
        isSuperadmin: false,
      },
    ];
    this.cd.markForCheck();
  }

  removeGroupMapping(index: number): void {
    this.groupMappings = this.groupMappings.filter((_, i) => i !== index);
    this.cd.markForCheck();
  }

  onTargetGroupSelect(event: MatSelectChange, row: GroupMappingRow): void {
    if (event.value === '__ADD_NEW_GROUP__') {
      event.source.value = row.targetGroup;
      this.openAddGroupDialog(row);
    } else {
      row.targetGroup = event.value;
    }
    this.cd.markForCheck();
  }

  onDefaultGroupSelect(event: MatSelectChange): void {
    if (event.value === '__ADD_NEW_GROUP__') {
      event.source.value = this.ldapSettings.default_group;
      this.openAddGroupDialogForDefault();
    } else {
      this.ldapSettings.default_group = event.value;
    }
    this.cd.markForCheck();
  }

  openAddGroupDialog(row?: GroupMappingRow): void {
    if (!this.controller) {
      return;
    }
    const previousGroups = new Set(this.availableGroups.map((g) => g.name));

    this.dialog
      .open(AddGroupDialogComponent, {
        panelClass: ['base-dialog-panel', 'dialog-small-panel'],
        autoFocus: false,
        disableClose: true,
        data: { controller: this.controller },
      })
      .afterClosed()
      .subscribe((added: boolean) => {
        if (added && this.controller) {
          this.groupService.getGroups(this.controller).subscribe({
            next: (groups: Group[]) => {
              this.availableGroups = groups || [];
              const newlyAdded = this.availableGroups.find((g) => !previousGroups.has(g.name));
              if (newlyAdded && row) {
                row.targetGroup = newlyAdded.name;
              }
              this.cd.markForCheck();
            },
            error: (err) => {
              const msg = err.error?.message || err.message || 'Failed to refresh groups';
              this.toasterService.error(msg);
              this.cd.markForCheck();
            },
          });
        }
      });
  }

  openAddGroupDialogForDefault(): void {
    if (!this.controller) {
      return;
    }
    const previousGroups = new Set(this.availableGroups.map((g) => g.name));

    this.dialog
      .open(AddGroupDialogComponent, {
        panelClass: ['base-dialog-panel', 'dialog-small-panel'],
        autoFocus: false,
        disableClose: true,
        data: { controller: this.controller },
      })
      .afterClosed()
      .subscribe((added: boolean) => {
        if (added && this.controller) {
          this.groupService.getGroups(this.controller).subscribe({
            next: (groups: Group[]) => {
              this.availableGroups = groups || [];
              const newlyAdded = this.availableGroups.find((g) => !previousGroups.has(g.name));
              if (newlyAdded) {
                this.ldapSettings.default_group = newlyAdded.name;
              }
              this.cd.markForCheck();
            },
            error: (err) => {
              const msg = err.error?.message || err.message || 'Failed to refresh groups';
              this.toasterService.error(msg);
              this.cd.markForCheck();
            },
          });
        }
      });
  }

  discardChanges(): void {
    if (this.initialSettings) {
      this.initForm(this.initialSettings);
      this.toasterService.info('Changes discarded');
      this.cd.markForCheck();
    }
  }

  buildLdapPayload(): Partial<LdapSection> {
    const mapping: Record<string, string> = {};
    const superadminGroups: string[] = [];
    for (const row of this.groupMappings) {
      const key = row.directoryGroup.trim();
      if (key && row.targetGroup) {
        mapping[key] = row.targetGroup;
        if (row.isSuperadmin) {
          superadminGroups.push(key);
        }
      }
    }

    const filter = this.directoryType === 'custom' ? this.ldapSettings.user_search_filter : this.generatedFilter;
    const uri = this.computeUri();

    const payload: Partial<LdapSection> = {
      enabled: this.ldapSettings.enabled,
      uri: uri,
      bind_dn: this.ldapSettings.bind_dn?.trim() || null,
      base_dn: this.ldapSettings.base_dn.trim(),
      user_search_filter: filter,
      user_attr_username: this.ldapSettings.user_attr_username,
      user_attr_email: this.ldapSettings.user_attr_email,
      user_attr_fullname: this.ldapSettings.user_attr_fullname,
      group_search_base: this.ldapSettings.base_dn.trim(),
      group_search_filter: this.ldapSettings.group_search_filter,
      group_mapping: mapping,
      superadmin_groups: superadminGroups,
      default_group: this.ldapSettings.default_group || 'Users',
      start_tls: this.ldapSettings.start_tls,
      verify_cert: this.ldapSettings.verify_cert,
      ca_cert_file: this.ldapSettings.ca_cert_file?.trim() || null,
      fallback_to_local: this.ldapSettings.fallback_to_local,
      timeout: this.ldapSettings.timeout,
    };

    if (this.passwordChanged) {
      payload.bind_password = this.bindPassword;
    }

    return payload;
  }

  save(): void {
    if (!this.controller || !this.isServerSupported() || !this.isFormValid() || this.isSaving()) {
      return;
    }
    this.isSaving.set(true);
    const payload = this.buildLdapPayload();
    this.serverSettingsService.updateServerSettings(this.controller, { LDAP: payload }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.toasterService.success('Directory settings saved successfully');
        this.initForm(res.LDAP);
        this.cd.markForCheck();
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err.error?.message || err.message || 'Failed to save directory settings';
        this.toasterService.error(msg);
        this.cd.markForCheck();
      },
    });
  }

  testConnection(): void {
    if (!this.controller || !this.isServerSupported() || this.isTesting()) {
      return;
    }
    this.isTesting.set(true);
    const payload = this.buildLdapPayload();
    this.serverSettingsService.testLdapConnection(this.controller, payload).subscribe({
      next: (result) => {
        this.isTesting.set(false);
        if (result.status === 'success') {
          this.toasterService.success('Directory server bind successful');
        } else {
          this.toasterService.error(result.message);
        }
        this.cd.markForCheck();
      },
      error: (err) => {
        this.isTesting.set(false);
        const msg = err.error?.message || err.message || 'Directory connection test failed';
        this.toasterService.error(msg);
        this.cd.markForCheck();
      },
    });
  }
}
