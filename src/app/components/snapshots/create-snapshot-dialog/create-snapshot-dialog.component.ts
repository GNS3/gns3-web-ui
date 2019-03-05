import { Component, Inject } from '@angular/core';
import { Snapshot } from '../../../models/snapshot';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Server } from '../../../models/server';
import { Project } from '../../../models/project';


@Component({
  selector: 'app-create-snapshot-dialog',
  templateUrl: './create-snapshot-dialog.component.html',
  styleUrls: ['./create-snapshot-dialog.component.scss']
})
export class CreateSnapshotDialogComponent {
  server: Server;
  project: Project;
  snapshot: Snapshot = new Snapshot();

  constructor(
    public dialogRef: MatDialogRef<CreateSnapshotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.server = data['server'];
    this.project = data['project'];
  }

  onAddClick(): void {
    this.dialogRef.close(this.snapshot);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
