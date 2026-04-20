import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
})
export class CreateSnapshotDialogComponent {
  private dialogRef = inject(MatDialogRef<CreateSnapshotDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private snapshotService = inject(SnapshotService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  snapshot: Snapshot = new Snapshot();
  inputForm: UntypedFormGroup;
  existingSnapshotNames: string[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.controller = data['controller'];
    this.project = data['project'];

    this.inputForm = this.formBuilder.group({
      snapshotName: new UntypedFormControl('', Validators.required),
    });

    if (this.project?.project_id) {
      this.snapshotService.list(this.controller, this.project.project_id).subscribe((snapshots: Snapshot[]) => {
        this.existingSnapshotNames = snapshots.map((s) => s.name);
        this.cd.markForCheck();
      });
    }
  }

  onAddClick(): void {
    const snapshotName = this.inputForm.get('snapshotName').value?.trim();

    if (this.inputForm.invalid || !snapshotName) {
      this.toasterService.error('Fill all required fields');
    } else if (this.existingSnapshotNames.includes(snapshotName)) {
      this.toasterService.error('Snapshot with this name already exists');
    } else {
      this.snapshot.name = snapshotName;
      this.dialogRef.close(this.snapshot);
    }
  }
}
