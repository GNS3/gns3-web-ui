import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Group} from "@models/groups/group";
import {Permission} from "@models/api/permission";

@Component({
  selector: 'app-permission-editor-validate-dialog',
  templateUrl: './permission-editor-validate-dialog.component.html',
  styleUrls: ['./permission-editor-validate-dialog.component.scss']
})
export class PermissionEditorValidateDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<PermissionEditorValidateDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { add: Permission[], remove: Permission[] }) { }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close(false);
  }

  update() {
    this.dialogRef.close(true);
  }
}
