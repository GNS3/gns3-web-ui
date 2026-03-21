import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-screenshot-dialog',
  templateUrl: './screenshot-dialog.component.html',
  styleUrls: ['./screenshot-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatRadioModule,
    ReactiveFormsModule,
  ],
})
export class ScreenshotDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ScreenshotDialogComponent>);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private deviceService = inject(DeviceDetectorService);
  private cd = inject(ChangeDetectorRef);

  nameForm: UntypedFormGroup;
  isPngAvailable: boolean;
  filetype: string = 'svg';

  constructor() {
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
