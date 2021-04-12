import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Node } from '../../../cartography/models/node';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { Snapshot } from '../../../models/snapshot';
import { SnapshotService } from '../../../services/snapshot.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-create-snapshot-dialog',
  templateUrl: './create-snapshot-dialog.component.html',
  styleUrls: ['./create-snapshot-dialog.component.scss'],
})
export class CreateSnapshotDialogComponent {
  server: Server;
  project: Project;
  snapshot: Snapshot = new Snapshot();
  inputForm: FormGroup;
  snapshots: string[] = [];
  isInRunningState: boolean;

  constructor(
    public dialogRef: MatDialogRef<CreateSnapshotDialogComponent>,
    private formBuilder: FormBuilder,
    private toasterService: ToasterService,
    private snapshotService: SnapshotService,
    private nodesDataSource: NodesDataSource,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.server = data['server'];
    this.project = data['project'];

    this.inputForm = this.formBuilder.group({
      snapshotName: new FormControl('', Validators.required),
    });

    this.snapshotService.list(this.server, this.project.project_id).subscribe((snapshots: Snapshot[]) => {
      snapshots.forEach((snapshot: Snapshot) => {
        this.snapshots.push(snapshot.name);
      });
    });

    this.nodesDataSource.getItems().forEach((node: Node) => {
      if (node.status !== 'stopped' && !this.isAlwaysRunningNode(node.node_type)) {
        this.isInRunningState = true;
      }
    });
  }

  isAlwaysRunningNode(nodeType: string) {
    return !['qemu', 'docker', 'dynamips', 'vpcs', 'vmware', 'virtualbox', 'iou', 'traceng'].includes(nodeType);
  }

  onAddClick(): void {
    if (this.inputForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else if (this.snapshots.includes(this.inputForm.get('snapshotName').value)) {
      this.toasterService.error(`Snapshot with this name already exists`);
    } else if (this.isInRunningState) {
      this.toasterService.error(`Project must be stopped in order to export it`);
    } else {
      this.snapshot.name = this.inputForm.get('snapshotName').value;
      this.dialogRef.close(this.snapshot);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
