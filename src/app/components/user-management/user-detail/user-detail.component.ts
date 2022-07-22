import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Group} from "@models/groups/group";
import {UserService} from "@services/user.service";
import {ToasterService} from "@services/toaster.service";
import {User} from "@models/users/user";
import {Controller} from "@models/controller";
import {userNameAsyncValidator} from "@components/user-management/add-user-dialog/userNameAsyncValidator";
import {userEmailAsyncValidator} from "@components/user-management/add-user-dialog/userEmailAsyncValidator";
import {ActivatedRoute, Router} from "@angular/router";
import {Permission} from "@models/api/permission";
import {Role} from "@models/api/role";
import {AddUserDialogComponent} from "@components/user-management/add-user-dialog/add-user-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {ChangeUserPasswordComponent} from "@components/user-management/user-detail/change-user-password/change-user-password.component";
import {RemoveToGroupDialogComponent} from "@components/group-details/remove-to-group-dialog/remove-to-group-dialog.component";

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {

  editUserForm: FormGroup;
  groups: Group[];
  user: User;
  controller: Controller;
  user_id: string;
  permissions: Permission[];
  changingPassword: boolean = false;

  constructor(public userService: UserService,
              private toasterService: ToasterService,
              private route: ActivatedRoute,
              private router: Router,
              public dialog: MatDialog) {

  }

  ngOnInit(): void {
    this.controller = this.route.snapshot.data['controller'];
    if (!this.controller) this.router.navigate(['/controllers']);

    this.route.data.subscribe((d: { controller: Controller; user: User, groups: Group[], permissions: Permission[]}) => {
      this.user = d.user;
      this.user_id = this.user.user_id;
      this.groups = d.groups;
      this.permissions = d.permissions;
      this.initForm();
    });

  }

  initForm() {
    this.editUserForm = new FormGroup({
      username: new FormControl(this.user.username, [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern("[a-zA-Z0-9_-]+$")],
        [userNameAsyncValidator(this.controller, this.userService, this.user.username)]),
      full_name: new FormControl(this.user.full_name),
      email: new FormControl(this.user.email,
        [Validators.email, Validators.required],
        [userEmailAsyncValidator(this.controller, this.userService, this.user.email)]),
      is_active: new FormControl(this.user.is_active)
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
