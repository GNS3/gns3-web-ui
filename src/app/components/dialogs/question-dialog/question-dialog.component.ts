import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Inject } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-question-dialog',
  templateUrl: './question-dialog.component.html',
  imports: [MatDialogModule, MatButtonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class QuestionDialogComponent {
  public dialogRef = inject(MatDialogRef<QuestionDialogComponent>);
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string, question: string}) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
