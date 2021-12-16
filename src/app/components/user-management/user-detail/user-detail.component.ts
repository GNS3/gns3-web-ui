import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Group} from "@models/groups/group";
import {UserService} from "@services/user.service";
import {ToasterService} from "@services/toaster.service";
import {User} from "@models/users/user";
import {Server} from "@models/server";
import {userNameAsyncValidator} from "@components/user-management/add-user-dialog/userNameAsyncValidator";
import {userEmailAsyncValidator} from "@components/user-management/add-user-dialog/userEmailAsyncValidator";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {

  editUserForm: FormGroup;
  groups: Group[];
  user: User;
  server: Server;
  user_id: string;

  constructor(public userService: UserService,
              private toasterService: ToasterService,
              private route: ActivatedRoute,
              private router: Router) {

  }

  ngOnInit(): void {
    this.server = this.route.snapshot.data['server'];
    if (!this.server) this.router.navigate(['/servers']);

    this.user_id = this.route.snapshot.paramMap.get('user_id');
    this.userService.get(this.server, this.user_id).subscribe((user: User) => {
      console.log(user)
      this.user = user;
      this.userService.getGroupsByUserId(this.server, this.user.user_id).subscribe(
        (groups: Group[]) => {
          this.groups = groups;
        });
      this.initForm();
    })
  }

  initForm() {
    this.editUserForm = new FormGroup({
      username: new FormControl(this.user.username, [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern("[a-zA-Z0-9_-]+$")],
        [userNameAsyncValidator(this.server, this.userService, this.user.username)]),
      full_name: new FormControl(this.user.full_name),
      email: new FormControl(this.user.email,
        [Validators.email, Validators.required],
        [userEmailAsyncValidator(this.server, this.userService, this.user.email)]),
      password: new FormControl(null,
        [Validators.minLength(6), Validators.maxLength(100)]),
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

    this.userService.update(this.server, updatedUser)
      .subscribe((user: User) => {
          console.log("Done ", user)
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

        if (currentControl.dirty && currentControl.value !== this.user[key] && currentControl.value !== '') {
            dirtyValues[key] = currentControl.value;
        }
      });

    return dirtyValues;
  }


}
