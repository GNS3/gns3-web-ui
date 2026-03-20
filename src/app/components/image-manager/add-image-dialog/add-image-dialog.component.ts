import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Controller } from '@models/controller';
import { BackgroundUploadService } from '@services/background-upload.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: false,
  selector: 'app-add-image-dialog',
  templateUrl: './add-image-dialog.component.html',
  styleUrls: ['./add-image-dialog.component.scss'],
})
export class AddImageDialogComponent implements OnInit {
  controller: Controller;
  isInstallAppliance: boolean = false;
  install_appliance: boolean = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddImageDialogComponent>,
    private backgroundUploadService: BackgroundUploadService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    this.controller = this.data;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const fileCount = input.files.length;
    for (let i = 0; i < fileCount; i++) {
      this.backgroundUploadService.queueFile(this.controller, input.files[i], this.install_appliance);
    }

    input.value = '';
    const label = fileCount === 1 ? '1 file' : `${fileCount} files`;
    this.toasterService.success(`${label} queued — uploading in the background`);
    this.dialogRef.close(true);
  }

  selectInstallApplianceOption(ev: any) {
    this.install_appliance = ev.value === true;
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}