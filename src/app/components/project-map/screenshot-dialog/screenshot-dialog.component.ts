import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: false,
  selector: 'app-screenshot-dialog',
  templateUrl: './screenshot-dialog.component.html',
  styleUrls: ['./screenshot-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScreenshotDialogComponent implements OnInit {
  nameForm: UntypedFormGroup;
  isPngAvailable: boolean;
  filetype: string = 'svg';

  constructor(
    public dialogRef: MatDialogRef<ScreenshotDialogComponent>,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private deviceService: DeviceDetectorService,
    private cd: ChangeDetectorRef
  ) {
    this.nameForm = this.formBuilder.group({
      screenshotName: new UntypedFormControl(`screenshot-${Date.now()}`, [Validators.required]),
    });
    this.isPngAvailable = this.deviceService.getDeviceInfo().os === 'Windows';
  }

  ngOnInit() {
    this.cd.markForCheck();
  }

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
      this.cd.markForCheck();
    }
  }
}

export class Screenshot {
  name: string;
  filetype: string;
}
