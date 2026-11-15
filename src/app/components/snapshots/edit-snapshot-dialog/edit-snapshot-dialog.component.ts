import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Snapshot } from '@models/snapshot';

/** Edits a snapshot's description. Closes with the trimmed text — an empty
 *  string asks the server to reset the description to its default text. */
@Component({
  selector: 'app-edit-snapshot-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './edit-snapshot-dialog.component.html',
  styleUrl: './edit-snapshot-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSnapshotDialogComponent {
  private dialogRef = inject(MatDialogRef<EditSnapshotDialogComponent>);

  readonly description = signal('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: EditSnapshotDialogData) {
    this.description.set(data.snapshot.description ?? '');
  }

  save(): void {
    this.dialogRef.close(this.description().trim());
  }
}

export interface EditSnapshotDialogData {
  snapshot: Snapshot;
}
