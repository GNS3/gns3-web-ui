import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-question-dialog',
  templateUrl: './question-dialog.component.html',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionDialogComponent {
  public dialogRef = inject(MatDialogRef<QuestionDialogComponent>);
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; question: string }) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
