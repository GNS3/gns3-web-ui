import { Component, OnInit } from '@angular/core';
import { MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-configure-gns3-vm-dialog',
  templateUrl: 'configure-gns3vm-dialog.component.html',
  styleUrls: ['configure-gns3vm-dialog.component.scss']
})
export class ConfigureGns3VMDialogComponent implements OnInit {
  public message: string = 'Do you want to configure GNS3 VM?';
  constructor(public dialogRef: MatDialogRef<ConfigureGns3VMDialogComponent>) {}

  ngOnInit() {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
