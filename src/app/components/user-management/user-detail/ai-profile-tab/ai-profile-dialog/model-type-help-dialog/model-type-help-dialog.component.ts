import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-model-type-help-dialog',
  standalone: true,
  templateUrl: './model-type-help-dialog.component.html',
  styleUrl: './model-type-help-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
})
export class ModelTypeHelpDialogComponent {
  private dialogRef = inject(MatDialogRef<ModelTypeHelpDialogComponent>);

  close() {
    this.dialogRef.close();
  }
}
