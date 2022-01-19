import { Component, OnInit } from '@angular/core';
import {Server} from "@models/server";
import {Role} from "@models/api/role";
import {Permission} from "@models/api/permission";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ToasterService} from "@services/toaster.service";
import {RoleService} from "@services/role.service";
import {forkJoin} from "rxjs";
import {Observable} from "rxjs/Rx";
import {UserService} from "@services/user.service";
import {User} from "@models/users/user";

@Component({
  selector: 'app-user-permissions',
  templateUrl: './user-permissions.component.html',
  styleUrls: ['./user-permissions.component.scss']
})
export class UserPermissionsComponent implements OnInit {

  server: Server;
  user: User;
  userPermissions: Permission[];
  permissions: Permission[];

  constructor(private route: ActivatedRoute,
              private dialog: MatDialog,
              private toastService: ToasterService,
              private router: Router,
              private userService: UserService) {
    this.route.data.subscribe((data: { server: Server, user: User, userPermissions: Permission[], permissions: Permission[] }) => {
      this.server = data.server;
      this.user = data.user;
      this.userPermissions = data.userPermissions;
      this.permissions = data.permissions;
    });
  }

  ngOnInit(): void {
  }

  updatePermissions(toUpdate) {
    const {add, remove} = toUpdate;
    const obs: Observable<any>[] = [];
    add.forEach((permission: Permission) => {
      obs.push(this.userService.addPermission(this.server, this.user.user_id, permission));
    });
    remove.forEach((permission: Permission) => {
      obs.push(this.userService.removePermission(this.server, this.user.user_id, permission));
    });

    forkJoin(obs)
      .subscribe(() => {
          this.toastService.success(`permissions updated`);
          this.router.navigate(['/server', this.server.id, 'management', 'users', this.user.user_id]);
        },
        (error) => {
          this.toastService.error(error);
        });
  }

}
