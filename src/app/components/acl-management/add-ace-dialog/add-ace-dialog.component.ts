/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2023 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 *
 * Author: Sylvain MATHIEU, Elise LEBEAU
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule } from '@angular/material/tree';
import { CdkTreeModule, NestedTreeControl } from '@angular/cdk/tree';
import { ArrayDataSource } from '@angular/cdk/collections';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { AclService } from '@services/acl.service';
import { Controller } from '@models/controller';
import { Endpoint, RessourceType } from '@models/api/endpoint';
import { ACE, AceType } from '@models/api/ACE';
import { Group } from '@models/groups/group';
import { GroupService } from '@services/group.service';
import { User } from '@models/users/user';
import { Role } from '@models/api/role';
import { RoleService } from '@services/role.service';
import { EndpointNode, EndpointTreeAdapter } from '@components/acl-management/add-ace-dialog/EndpointTreeAdapter';
import { AutocompleteComponent } from '@components/acl-management/add-ace-dialog/autocomplete/autocomplete.component';

@Component({
  standalone: true,
  selector: 'app-add-ace-dialog',
  templateUrl: './add-ace-dialog.component.html',
  styleUrls: ['./add-ace-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTreeModule,
    CdkTreeModule,
    AutocompleteComponent,
  ],
})
export class AddAceDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AddAceDialogComponent>);
  private aclService = inject(AclService);
  private userService = inject(UserService);
  private groupService = inject(GroupService);
  private roleService = inject(RoleService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  addAceForm: UntypedFormGroup;
  allowed: boolean = true;
  types = Object.values(AceType);

  endpoints: Endpoint[];
  selectedEndpoint: Endpoint;
  filteredEndpoint: Endpoint[] = [];
  endpointTypes: string[];

  groups: Group[] = [];
  selectedGroup: Group;

  users: User[] = [];
  selectedUser: User;

  roles: Role[] = [];
  selectedRole: Role;

  TREE_DATA: EndpointNode[] = [];
  treeControl = new NestedTreeControl<EndpointNode>((node) => node.children);
  treeDataSource: ArrayDataSource<EndpointNode>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { endpoints: Endpoint[] }) {
    this.endpoints = data.endpoints;
    const treeAdapter = new EndpointTreeAdapter(this.endpoints);
    const data_tree = treeAdapter.buildTreeFromEndpoints();
    this.treeDataSource = new ArrayDataSource(data_tree);
    console.log(data_tree);
  }

  ngOnInit(): void {
    this.addAceForm = new UntypedFormGroup({
      type: new UntypedFormControl(AceType.user),
      role_id: new UntypedFormControl(),
      propagate: new UntypedFormControl(true),
    });
    this.groupService.getGroups(this.controller).subscribe({
      next: (groups: Group[]) => {
        this.groups = groups;
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load groups';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
    this.userService.list(this.controller).subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load users';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
    this.roleService.get(this.controller).subscribe({
      next: (roles: Role[]) => {
        this.roles = roles;
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load roles';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  get form() {
    return this.addAceForm.controls;
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  onAddClick() {
    if (!this.selectedEndpoint || !this.selectedRole) {
      return;
    }
    if (!this.selectedUser && !this.selectedGroup) {
      return;
    }

    const ACE = {
      ace_type: this.form.type.value,
      allowed: this.allowed,
      group_id: this.form.type.value === AceType.group ? this.selectedGroup.user_group_id : null,
      path: this.selectedEndpoint.endpoint,
      propagate: this.form.propagate.value,
      role_id: this.selectedRole.role_id,
      user_id: this.form.type.value === AceType.user ? this.selectedUser.user_id : null,
    };

    if (ACE.path && ACE.role_id && (ACE.user_id || ACE.group_id)) {
      this.aclService.add(this.controller, ACE).subscribe({
        next: (ace: ACE) => {
          this.toasterService.success(`ACE was added for path ${ACE.path}`);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to create ACE';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });
      this.dialogRef.close();
    }
  }

  changeAllowed() {
    this.allowed = !this.allowed;
  }

  displayFn(value): string {
    return value && value.name ? value.name : '';
  }

  displayFnUser(value): string {
    if (!value || !value.username) return '';
    return value.full_name ? value.username.concat(' - ', value.full_name) : value.username;
  }

  _filter(value: string, data: any): any {
    if (typeof value === 'string' && data) {
      const filterValue = value.toLowerCase();

      return data.filter((option) => option.name.toLowerCase().includes(filterValue));
    }
    return [];
  }

  _filterUser(value: string, users: User[]): User[] {
    if (typeof value === 'string' && users) {
      const filterValue = value.toLowerCase();

      return users.filter(
        (option) =>
          (option.full_name?.toLowerCase().includes(filterValue) ?? false) ||
          option.username.toLowerCase().includes(filterValue)
      );
    }
  }

  _filterRole(value: string, roles: Role[]) {
    if (typeof value === 'string' && roles) {
      const filterValue = value.toLowerCase();

      return roles.filter((option) => option.name.toLowerCase().includes(filterValue));
    }
  }

  userSelection(value: any) {
    this.selectedUser = value;
  }

  groupSelection(value: any) {
    this.selectedGroup = value;
  }

  roleSelection(value: any) {
    this.selectedRole = value;
  }

  endpointSelection(value: EndpointNode) {
    const endp: Endpoint = {
      endpoint: value.endpoint,
      endpoint_type: value.endpoint_type,
      name: value.name,
    };
    this.selectedEndpoint = endp;
  }

  hasChild = (_: number, node: EndpointNode) => !!node.children && node.children.length > 0;
}
