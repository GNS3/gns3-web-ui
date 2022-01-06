import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Role} from "@models/api/role";
import {Server} from "@models/server";
import {Permission} from "@models/api/permission";
import {MatDialog} from "@angular/material/dialog";
import {PermissionEditorValidateDialogComponent} from "@components/role-management/role-detail/permission-editor/permission-editor-validate-dialog/permission-editor-validate-dialog.component";
import {forkJoin, Observable} from "rxjs";
import {RoleService} from "@services/role.service";
import {ToasterService} from "@services/toaster.service";

@Component({
  selector: 'app-permission-editor',
  templateUrl: './permission-editor.component.html',
  styleUrls: ['./permission-editor.component.scss']
})
export class PermissionEditorComponent implements OnInit {
  server: Server;
  role: Role;
  private permissions: Permission[];
  owned: Set<Permission>;
  available: Set<Permission>;

  constructor(private route: ActivatedRoute,
              private dialog: MatDialog,
              private toastService: ToasterService,
              private router: Router,
              private roleService: RoleService) {
    this.route.data.subscribe((data: { server: Server, role: Role, permissions: Permission[] }) => {
      this.server = data.server;
      this.role = data.role;
      this.permissions = data.permissions;
      this.reset();
    });
  }

  ngOnInit(): void {
  }

  add(permission: Permission) {
    this.available.delete(permission);
    this.owned.add(permission);
  }

  remove(permission: Permission) {
    this.owned.delete(permission);
    this.available.add(permission);
  }

  reset() {
    const ownedPermissionId = this.role.permissions.map(p => p.permission_id);
    this.owned = new Set(this.role.permissions);
    this.available = new Set(this.permissions.filter(p => !ownedPermissionId.includes(p.permission_id)));
  }

  update() {
    const {add, remove} = this.diff();
    this.dialog
      .open(PermissionEditorValidateDialogComponent,
        {width: '700px', height: '500px', data: {add, remove}})
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          const obs: Observable<any>[] = [];
          add.forEach((permission: Permission) => {
            obs.push(this.roleService.addPermission(this.server, this.role, permission));
          });
          remove.forEach((permission: Permission) => {
            obs.push(this.roleService.removePermission(this.server, this.role, permission));
          });

          forkJoin(obs)
            .subscribe(() => {
                this.toastService.success(`permissions updated`);
                this.router.navigate(['/server', this.server.id, 'management', 'roles', this.role.role_id]);
              },
              (error) => {
                this.toastService.error(error);
              });
        }

      });
  }

  private diff() {
    const add: Permission[] = [];

    const currentRolePermissionId = this.role.permissions.map(p => p.permission_id);
    this.owned.forEach((permission: Permission) => {
      if (!currentRolePermissionId.includes(permission.permission_id)) {
        add.push(permission);
      }
    });

    const remove: Permission[] = [];
    this.role.permissions.forEach((permission: Permission) => {
      if (!this.owned.has(permission)) {
        remove.push(permission);
      }
    });

    return {add, remove};
  }
}
