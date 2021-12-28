import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {User} from "@models/users/user";

@Component({
  selector: 'app-remove-user-to-group-dialog',
  templateUrl: './remove-user-to-group-dialog.component.html',
  styleUrls: ['./remove-user-to-group-dialog.component.scss']
})
export class RemoveUserToGroupDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<RemoveUserToGroupDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { user: User }) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    this.dialogRef.close(this.data.user);
  }
}
