import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-add-controller-dialog',
  templateUrl: 'add-controller-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
})
export class AddControllerDialogComponent {
  private dialogRef = inject(MatDialogRef<AddControllerDialogComponent>);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  private changeDetector = inject(ChangeDetectorRef);
  readonly data = inject(MAT_DIALOG_DATA);

  protocols = [
    { key: 'http:', name: 'HTTP' },
    { key: 'https:', name: 'HTTPS' },
  ];
  connectionError: string = '';
  canAddAnyway = false;
  isCheckingConnection = false;
  duplicateNameError: string = '';

  controllerForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required]),
    host: new UntypedFormControl('', [Validators.required]),
    port: new UntypedFormControl('', [Validators.required, Validators.min(1)]),
    protocol: new UntypedFormControl('http:'),
  });

  getDefaultHost() {
    return '127.0.0.1';
  }

  getDefaultPort() {
    return 3080;
  }

  constructor() {
    this.controllerForm.get('host').setValue(this.getDefaultHost());
    this.controllerForm.get('port').setValue(this.getDefaultPort());
  }

  /**
   * Auto-detect controller location based on host address
   * 127.0.0.1 or localhost → local
   * Other addresses → remote
   */
  private detectLocation(host: string): 'local' | 'remote' {
    return host === '127.0.0.1' || host === 'localhost' ? 'local' : 'remote';
  }

  onAddClick(): void {
    if (!this.controllerForm.valid) {
      return;
    }

    const controllerName = this.controllerForm.get('name').value;

    // Check for duplicate name first
    if (this.controllerService.isControllerNameTaken(controllerName)) {
      this.duplicateNameError = `Controller with name "${controllerName}" already exists`;
      this.toasterService.error(this.duplicateNameError);
      this.changeDetector.markForCheck();
      return;
    }

    this.connectionError = '';
    this.duplicateNameError = '';
    this.canAddAnyway = false;
    this.isCheckingConnection = true;
    this.changeDetector.markForCheck();

    const controller: Controller = Object.assign({}, this.controllerForm.value);

    // Auto-detect location based on host
    controller.location = this.detectLocation(controller.host);

    this.controllerService.checkControllerVersion(controller).subscribe({
      next: (controllerInfo) => {
        this.isCheckingConnection = false;
        if (controllerInfo.version.split('.')[0] >= 3) {
          this.dialogRef.close(controller);
          this.toasterService.success(`Controller ${controller.name} added.`);
        } else {
          this.connectionError = 'Controller version is not supported.';
          this.canAddAnyway = true;
          this.toasterService.error(`Controller version is not supported.`);
        }
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.isCheckingConnection = false;
        this.connectionError = 'Cannot connect to the controller. It appears offline.';
        this.canAddAnyway = true;
        const message = err.error?.message || err.message || 'Cannot connect to the controller';
        this.toasterService.error(message);
        this.changeDetector.markForCheck();
      },
    });
  }

  onAddAnywayClick(): void {
    if (!this.controllerForm.valid) {
      return;
    }

    const controllerName = this.controllerForm.get('name').value;

    // Check for duplicate name first
    if (this.controllerService.isControllerNameTaken(controllerName)) {
      this.duplicateNameError = `Controller with name "${controllerName}" already exists`;
      this.toasterService.error(this.duplicateNameError);
      this.changeDetector.markForCheck();
      return;
    }

    const controller: Controller = Object.assign({}, this.controllerForm.value);

    // Auto-detect location based on host
    controller.location = this.detectLocation(controller.host);

    this.dialogRef.close(controller);
    this.toasterService.warning(`Controller ${controller.name} added in offline mode.`);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
