import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ElectronService } from 'ngx-electron';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-screenshot-dialog',
  templateUrl: './screenshot-dialog.component.html',
  styleUrls: ['./screenshot-dialog.component.scss'],
})
export class ScreenshotDialogComponent implements OnInit {
  nameForm: UntypedFormGroup;
  isPngAvailable: boolean;
  filetype: string = 'svg';

  constructor(
    public dialogRef: MatDialogRef<ScreenshotDialogComponent>,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private electronService: ElectronService,
    private deviceService: DeviceDetectorService
  ) {
    this.nameForm = this.formBuilder.group({
      screenshotName: new UntypedFormControl(`screenshot-${Date.now()}`, [Validators.required]),
    });
    this.isPngAvailable = this.electronService.isWindows || this.deviceService.getDeviceInfo().os === 'Windows';
  }

  ngOnInit() {}

  get form() {
    return this.nameForm.controls;
  }

  onAddClick(): void {
    if (this.nameForm.invalid) {
      return;
    }

    let screenshotProperties: Screenshot = {
      name: this.nameForm.get('screenshotName').value,
      filetype: this.filetype,
    };
    this.dialogRef.close(screenshotProperties);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.onAddClick();
    }
  }

  setFiletype(type: string) {
    if (this.isPngAvailable) {
      this.filetype = type;
    }
  }
}

export class Screenshot {
  name: string;
  filetype: string;
}
