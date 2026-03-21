import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-config-dialog',
  templateUrl: './config-dialog.component.html',
  styleUrls: ['./config-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfigDialogComponent {
  dialogRef = inject(MatDialogRef<ConfigDialogComponent>);

  close(fileType: string) {
    this.dialogRef.close(fileType);
  }
}
