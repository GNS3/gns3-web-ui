import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-information-dialog',
  templateUrl: 'information-dialog.component.html',
  styleUrls: ['information-dialog.component.scss']
})
export class InformationDialogComponent implements OnInit {
  public confirmationMessage: string;
  constructor(public dialogRef: MatDialogRef<InformationDialogComponent>) {}

  ngOnInit() {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
