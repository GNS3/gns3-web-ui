import { Component, Inject, OnInit, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-delete-confirmation-dialog',
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrls: ['./delete-confirmation-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule]
})
export class DeleteConfirmationDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<DeleteConfirmationDialogComponent>);

  templateName: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.templateName = data['templateName'];
  }

  ngOnInit() {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
