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
import {ChangeDetectionStrategy, Component, Inject, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BehaviorSubject, forkJoin, timer} from "rxjs";
import {User} from "@models/users/user";
import {MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from "@angular/material/dialog";
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Controller} from "@models/controller";
import {Group} from "@models/groups/group";
import {UserService} from "@services/user.service";
import {GroupService} from "@services/group.service";
import {ToasterService} from "@services/toaster.service";
import {Role} from "@models/api/role";
import {RoleService} from "@services/role.service";

@Component({
  standalone: true,
  selector: 'app-add-role-to-group',
  templateUrl: './add-role-to-group.component.html',
  styleUrls: ['./add-role-to-group.component.scss'],
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AddRoleToGroupComponent implements OnInit {
  private dialog = inject(MatDialogRef<AddRoleToGroupComponent>);
  private groupService = inject(GroupService);
  private roleService = inject(RoleService);
  private toastService = inject(ToasterService);

  roles = new BehaviorSubject<Role[]>([]);
  displayedRoles = new BehaviorSubject<Role[]>([]);

  searchText: string;
  loading = false;

  constructor(
              @Inject(MAT_DIALOG_DATA) public data: { controller: Controller; group: Group }) {
  }

  ngOnInit(): void {
    this.getRoles();
  }

  onSearch() {
    timer(500)
      .subscribe(() => {
        const displayedUsers = this.roles.value.filter((roles: Role) => {
          return roles.name.includes(this.searchText);
        });

        this.displayedRoles.next(displayedUsers);
      });
  }

  getRoles() {
    forkJoin([
      this.roleService.get(this.data.controller),
      this.groupService.getGroupRole(this.data.controller, this.data.group.user_group_id)
    ]).subscribe((results) => {
      const [globalRoles, groupRoles] = results;
      const roles = globalRoles.filter((role: Role) => {
        return !groupRoles.find((r: Role) => r.role_id === role.role_id);
      });

      this.roles.next(roles);
      this.displayedRoles.next(roles);

    });

  }

  addRole(role: Role) {
    this.loading = true;
    this.groupService
      .addRoleToGroup(this.data.controller, this.data.group, role)
      .subscribe(() => {
        this.toastService.success(`role ${role.name} was added`);
        this.getRoles();
        this.loading = false;
      }, (err) => {
        console.log(err);
        this.toastService.error(`error while adding role ${role.name} to group ${this.data.group.name}`);
        this.loading = false;
      });
  }
}
