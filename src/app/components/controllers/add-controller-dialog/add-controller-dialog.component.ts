import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
export class AddControllerDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AddControllerDialogComponent>);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  private changeDetector = inject(ChangeDetectorRef);
  readonly data = inject(MAT_DIALOG_DATA);

  protocols = [
    { key: 'http:', name: 'HTTP' },
    { key: 'https:', name: 'HTTPS' },
  ];
  locations = [];
  connectionError: string = '';
  canAddAnyway = false;
  isCheckingConnection = false;
  duplicateNameError: string = '';

  controllerForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required]),
    location: new UntypedFormControl(''),
    path: new UntypedFormControl(''),
    ubridge_path: new UntypedFormControl(''),
    host: new UntypedFormControl('', [Validators.required]),
    port: new UntypedFormControl('', [Validators.required, Validators.min(1)]),
    protocol: new UntypedFormControl('http:'),
  });

  constructor() {}

  async getLocations() {
    const localControllers = await this.numberOfLocalControllers();

    let locations = [];
    locations.push({ key: 'remote', name: 'Remote' });
    return locations;
  }

  async getDefaultLocation() {
    return 'remote';
  }

  async numberOfLocalControllers() {
    const controllers = await this.controllerService.findAll();

    return controllers.filter((controller) => controller.location === 'local').length;
  }

  getDefaultHost() {
    return '127.0.0.1';
  }

  getDefaultPort() {
    return 3080;
  }

  async ngOnInit() {
    this.locations = await this.getLocations();

    this.controllerForm.get('location').valueChanges.subscribe((location: string) => {
      const pathControl = this.controllerForm.get('path');
      const ubridgePathControl = this.controllerForm.get('ubridge_path');

      if (location === 'local') {
        pathControl.setValidators([Validators.required]);

        ubridgePathControl.setValidators([Validators.required]);
      } else {
        pathControl.setValue('');
        pathControl.clearValidators();

        ubridgePathControl.setValue('');
        ubridgePathControl.clearValidators();
      }

      [pathControl, ubridgePathControl].forEach((control) => {
        control.updateValueAndValidity({
          onlySelf: true,
        });
      });
    });

    const defaultLocation = await this.getDefaultLocation();
    this.controllerForm.get('location').setValue(defaultLocation);
    this.controllerForm.get('host').setValue(this.getDefaultHost());
    this.controllerForm.get('port').setValue(this.getDefaultPort());
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
    this.controllerService.checkControllerVersion(controller).subscribe(
      (controllerInfo) => {
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
      (error) => {
        this.isCheckingConnection = false;
        this.connectionError = 'Cannot connect to the controller. It appears offline.';
        this.canAddAnyway = true;
        this.toasterService.error('Cannot connect to the controller: ' + error);
        this.changeDetector.markForCheck();
      }
    );
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
    this.dialogRef.close(controller);
    this.toasterService.warning(`Controller ${controller.name} added in offline mode.`);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
