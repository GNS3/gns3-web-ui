import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {User} from "@models/users/user";

@Component({
  selector: 'app-remove-user-to-group-dialog',
  templateUrl: './remove-to-group-dialog.component.html',
  styleUrls: ['./remove-to-group-dialog.component.scss']
})
export class RemoveToGroupDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<RemoveToGroupDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { name: string }) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}
