import {Component, Inject, OnInit} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {Group} from "@models/groups/group";
import {UserService} from "@services/user.service";
import {ToasterService} from "@services/toaster.service";
import {User} from "@models/users/user";
import {Controller} from "@models/controller";
import {userNameAsyncValidator} from "@components/user-management/add-user-dialog/userNameAsyncValidator";
import {userEmailAsyncValidator} from "@components/user-management/add-user-dialog/userEmailAsyncValidator";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ChangeUserPasswordComponent} from "@components/user-management/user-detail/change-user-password/change-user-password.component";
import {ACE, ACEDetailed} from "@models/api/ACE";
import {MatTableDataSource} from "@angular/material/table";
import {AclService} from "@services/acl.service";
import {RoleService} from "@services/role.service";
import {Role} from "@models/api/role";
import {Endpoint} from "@models/api/endpoint";


@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {

  editUserForm: UntypedFormGroup;
  groups: Group[];
  user: User;
  controller: Controller;
  user_id: string;
  changingPassword: boolean = false;
  aces: ACE[];
  aceDatasource = new MatTableDataSource<ACEDetailed>();
  public aceDisplayedColumns = ['endpoint', 'role', 'propagate', 'allowed'];

  constructor(public userService: UserService,
              private toasterService: ToasterService,
              private route: ActivatedRoute,
              private router: Router,
              public dialog: MatDialog,
              private aclService: AclService,
              private roleService: RoleService) {

  }

  ngOnInit(): void {
    this.controller = this.route.snapshot.data['controller'];
    if (!this.controller) this.router.navigate(['/controllers']);

    this.route.data.subscribe((d: { controller: Controller; user: User, groups: Group[], aces: ACE[]}) => {
      this.user = d.user;
      this.user_id = this.user.user_id;
      this.groups = d.groups;
      this.aces = d.aces;
      this.initForm();

      this.roleService.get(this.controller).subscribe((roles: Role[]) => {
        this.aclService.getEndpoints(this.controller).subscribe((endps: Endpoint[]) => {
          this.aceDatasource.data = this.aces.map((ace: ACE) => {
            const endpoint = endps.filter((endp: Endpoint) => endp.endpoint === ace.path)[0]
            const role = roles.filter((r: Role) => r.role_id === ace.role_id)[0]
            return {...ace, endpoint_name: endpoint.name, role_name: role.name}
          })
        })
      })
    });

  }

  initForm() {
    this.editUserForm = new UntypedFormGroup({
      username: new UntypedFormControl(this.user.username, [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern("[a-zA-Z0-9_-]+$")],
        [userNameAsyncValidator(this.controller, this.userService, this.user.username)]),
      full_name: new UntypedFormControl(this.user.full_name),
      email: new UntypedFormControl(this.user.email,
        [Validators.email, Validators.required],
        [userEmailAsyncValidator(this.controller, this.userService, this.user.email)]),
      is_active: new UntypedFormControl(this.user.is_active)
    });
  }

  get form() {
    return this.editUserForm.controls;
  }

  onEditClick() {
    if (!this.editUserForm.valid) {
      return;
    }

    const updatedUser = this.getUpdatedValues();
    updatedUser['user_id'] = this.user.user_id;

    this.userService.update(this.controller, updatedUser)
      .subscribe((user: User) => {
          this.toasterService.success(`User ${user.username} updated`);
        },
        (error) => {
          this.toasterService.error('Cannot update user : ' + error);
        })
  }

  getUpdatedValues() {
    let dirtyValues = {};

    Object.keys(this.editUserForm.controls)
      .forEach(key => {
        const currentControl = this.editUserForm.get(key);

        if (currentControl.dirty && currentControl.value !== this.user[key]) {
            dirtyValues[key] = currentControl.value;
        }
      });

    return dirtyValues;
  }

  onChangePassword() {
    this.dialog.open<ChangeUserPasswordComponent>(ChangeUserPasswordComponent,
      {width: '400px', height: '300px', data: {user: this.user, controller: this.controller}});
  }
}
