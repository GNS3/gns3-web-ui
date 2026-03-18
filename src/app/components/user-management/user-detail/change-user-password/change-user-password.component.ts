import {Component, Inject, OnInit} from '@angular/core';
import {AbstractControl, UntypedFormControl, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators} from "@angular/forms";
import {User} from "@models/users/user";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserService} from "@services/user.service";
import {Controller} from "@models/controller";
import {ToasterService} from "@services/toaster.service";
import {matchingPassword} from "@components/user-management/ConfirmPasswordValidator";

@Component({
  selector: 'app-change-user-password',
  templateUrl: './change-user-password.component.html',
  styleUrls: ['./change-user-password.component.scss']
})
export class ChangeUserPasswordComponent implements OnInit {

  editPasswordForm: UntypedFormGroup;
  user: User;

  constructor(private dialogRef: MatDialogRef<ChangeUserPasswordComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { user: User, controller: Controller, self_update: boolean },
              private userService: UserService,
              private toasterService: ToasterService) { }

  ngOnInit(): void {
    const password_regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    this.user = this.data.user;
    this.editPasswordForm = new UntypedFormGroup({
      password: new UntypedFormControl(null,
        [Validators.minLength(6), Validators.maxLength(100), Validators.pattern(password_regex), Validators.required] ),
      confirmPassword: new UntypedFormControl(null,
        [Validators.minLength(6), Validators.maxLength(100), Validators.pattern(password_regex), Validators.required] ),
    },{
      validators: [matchingPassword]
    })
  }

  get passwordForm() {
    return this.editPasswordForm.controls;
  }


  onCancel() {
    this.dialogRef.close();
  }

  onPasswordSave() {
    if (!this.editPasswordForm.valid) {
      return;
    }

    const updatedUser = {};
    updatedUser['password'] = this.editPasswordForm.get('password').value;
    updatedUser['user_id'] = this.user.user_id;

    this.userService.update(this.data.controller, updatedUser, this.data.self_update)
      .subscribe((user: User) => {
          this.toasterService.success(`User ${user.username} password updated`);
          this.editPasswordForm.reset();
          this.dialogRef.close(true);
        },
        (error) => {
          this.toasterService.error('Cannot update password for user: ' + error);
        })
  }
}
