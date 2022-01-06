import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Role} from "@models/api/role";

@Component({
  selector: 'app-delete-role-dialog',
  templateUrl: './delete-role-dialog.component.html',
  styleUrls: ['./delete-role-dialog.component.scss']
})
export class DeleteRoleDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<DeleteRoleDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { roles: Role[] }) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDelete() {
    this.dialogRef.close(true);
  }


}
