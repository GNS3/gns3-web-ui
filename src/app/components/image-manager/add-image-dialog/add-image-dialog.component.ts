import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { Controller } from '@models/controller';
import { BackgroundUploadService } from '@services/background-upload.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-add-image-dialog',
  templateUrl: './add-image-dialog.component.html',
  styleUrls: ['./add-image-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatRadioModule]
})
export class AddImageDialogComponent implements OnInit {
  private backgroundUploadService = inject(BackgroundUploadService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  isInstallAppliance: boolean = false;
  install_appliance: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddImageDialogComponent>
  ) {}

  ngOnInit() {
    this.controller = this.data;
    this.cd.markForCheck();
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
    this.cd.markForCheck();
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}