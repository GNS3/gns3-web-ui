import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-config-dialog',
  templateUrl: './config-dialog.component.html',
  styleUrl: './config-dialog.component.scss',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigDialogComponent {
  dialogRef = inject(MatDialogRef<ConfigDialogComponent>);

  close(fileType: string) {
    this.dialogRef.close(fileType);
  }

  onClose() {
    this.dialogRef.close();
  }
}
