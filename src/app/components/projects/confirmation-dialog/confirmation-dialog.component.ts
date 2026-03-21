import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Project } from '@models/project';

@Component({
  standalone: true,
  selector: 'app-import-project-dialog',
  templateUrl: 'confirmation-dialog.component.html',
  styleUrls: ['confirmation-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ConfirmationDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  private existingProject: Project;
  public confirmationMessage = signal('');
  public isOpen = signal(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.existingProject = data['existingProject'];
  }

  ngOnInit() {
    if (this.existingProject.status === 'opened') {
      this.confirmationMessage.set(`Project ${this.existingProject.name} is open. You can not overwrite it.`);
      this.isOpen.set(true);
    } else {
      this.confirmationMessage.set(`Project ${this.existingProject.name} already exist, overwrite it?`);
    }
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
