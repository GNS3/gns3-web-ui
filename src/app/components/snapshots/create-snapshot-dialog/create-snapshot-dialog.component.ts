import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Snapshot } from '@models/snapshot';
import { SnapshotService } from '@services/snapshot.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-create-snapshot-dialog',
  templateUrl: './create-snapshot-dialog.component.html',
  styleUrls: ['./create-snapshot-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
})
export class CreateSnapshotDialogComponent {
  public dialogRef = inject(MatDialogRef<CreateSnapshotDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private snapshotService = inject(SnapshotService);
  private nodesDataSource = inject(NodesDataSource);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  snapshot: Snapshot = new Snapshot();
  inputForm: UntypedFormGroup;
  snapshots: string[] = [];
  isInRunningState: boolean;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.controller = data['controller'];
    this.project = data['project'];

    this.inputForm = this.formBuilder.group({
      snapshotName: new UntypedFormControl('', Validators.required),
    });

    if (this.project && this.project.project_id) {
      this.snapshotService.list(this.controller, this.project.project_id).subscribe((snapshots: Snapshot[]) => {
        snapshots.forEach((snapshot: Snapshot) => {
          this.snapshots.push(snapshot.name);
        });
        this.cd.markForCheck();
      });
    }

    if (this.nodesDataSource) {
      this.nodesDataSource.getItems().forEach((node: Node) => {
        if (node.status !== 'stopped' && !this.isAlwaysRunningNode(node.node_type)) {
          this.isInRunningState = true;
        }
      });
      this.cd.markForCheck();
    }
  }

  isAlwaysRunningNode(nodeType: string) {
    return !['qemu', 'docker', 'dynamips', 'vpcs', 'vmware', 'virtualbox', 'iou'].includes(nodeType);
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
