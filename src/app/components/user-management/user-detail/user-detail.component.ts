import { ChangeDetectionStrategy, Component, Inject, OnInit, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTabsModule } from "@angular/material/tabs";
import { Group} from "@models/groups/group";
import {UserService} from "@services/user.service";
import {ToasterService} from "@services/toaster.service";
import {User} from "@models/users/user";
import {Controller} from "@models/controller";
import { ACE, ACEDetailed } from "@models/api/ACE";
import { Endpoint } from "@models/api/endpoint";
import {AclService} from "@services/acl.service";
import {RoleService} from "@services/role.service";
import {Role} from "@models/api/role";
import { userEmailAsyncValidator } from "@components/user-management/add-user-dialog/userEmailAsyncValidator";
import { userNameAsyncValidator } from "@components/user-management/add-user-dialog/userNameAsyncValidator";
import { ChangeUserPasswordComponent } from "@components/user-management/user-detail/change-user-password/change-user-password.component";
import { AiProfileTabComponent } from "@components/user-management/user-detail/ai-profile-tab/ai-profile-tab.component";


@Component({
  standalone: true,
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatDialogModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatTabsModule, AiProfileTabComponent],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class UserDetailComponent implements OnInit {
  private userService = inject(UserService);
  private toasterService = inject(ToasterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public dialog = inject(MatDialog);
  private aclService = inject(AclService);
  private roleService = inject(RoleService);

  editUserForm: UntypedFormGroup;
  groups: Group[];
  user: User;
  controller: Controller;
  user_id: string;
  changingPassword: boolean = false;
  aces: ACE[];
  aceDatasource = new MatTableDataSource<ACEDetailed>();
  public aceDisplayedColumns = ['endpoint', 'role', 'propagate', 'allowed'];

  constructor() {
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

    this.userService.update(this.controller, updatedUser, false)
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
