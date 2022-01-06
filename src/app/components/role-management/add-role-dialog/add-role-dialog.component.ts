import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Server} from "@models/server";
import {GroupNameValidator} from "@components/group-management/add-group-dialog/GroupNameValidator";
import {GroupService} from "@services/group.service";
import {groupNameAsyncValidator} from "@components/group-management/add-group-dialog/groupNameAsyncValidator";

@Component({
  selector: 'app-add-role-dialog',
  templateUrl: './add-role-dialog.component.html',
  styleUrls: ['./add-role-dialog.component.scss']
})
export class AddRoleDialogComponent implements OnInit {

  roleNameForm: FormGroup;

  constructor(private dialogRef: MatDialogRef<AddRoleDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { server: Server },
              private formBuilder: FormBuilder) {
  }

  ngOnInit(): void {
    this.roleNameForm = this.formBuilder.group({
      name: new FormControl(),
      description: new FormControl()
    });
  }

  get form() {
    return this.roleNameForm.controls;
  }

  onAddClick() {
    if (this.roleNameForm.invalid) {
      return;
    }
    const roleName = this.roleNameForm.controls['name'].value;
    const description = this.roleNameForm.controls['description'].value;
    this.dialogRef.close({name: roleName, description});
  }

  onNoClick() {
    this.dialogRef.close();
  }


}
