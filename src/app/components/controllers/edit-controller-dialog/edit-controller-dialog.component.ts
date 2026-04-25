import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
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
  selector: 'app-edit-controller-dialog',
  templateUrl: 'edit-controller-dialog.component.html',
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
export class EditControllerDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<EditControllerDialogComponent>);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  private changeDetector = inject(ChangeDetectorRef);

  controller: Controller;
  controllerForm: UntypedFormGroup;
  duplicateNameError: string = '';

  ngOnInit() {
    this.controllerForm = new UntypedFormGroup({
      name: new UntypedFormControl(this.controller.name, [Validators.required]),
      host: new UntypedFormControl(this.controller.host, [Validators.required]),
      port: new UntypedFormControl(this.controller.port, [Validators.required, Validators.min(1)]),
      protocol: new UntypedFormControl(this.controller.protocol || 'http:'),
    });
  }

  onSave(): void {
    if (!this.controllerForm.valid) {
      return;
    }

    const newName = this.controllerForm.value.name;

    // Check for duplicate name if name has changed
    if (newName !== this.controller.name) {
      if (this.controllerService.isControllerNameTaken(newName)) {
        this.duplicateNameError = `Controller with name "${newName}" already exists`;
        this.toasterService.error(this.duplicateNameError);
        this.changeDetector.markForCheck();
        return;
      }
    }

    this.duplicateNameError = '';

    const updatedController: Controller = {
      ...this.controller,
      name: newName,
      host: this.controllerForm.value.host,
      port: this.controllerForm.value.port,
      protocol: this.controllerForm.value.protocol,
    };

    this.controllerService.update(updatedController).then(
      () => {
        // Update the controller in the database
        this.dialogRef.close(updatedController);
        this.toasterService.success(`Controller ${updatedController.name} updated.`);
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to update controller';
        this.toasterService.error(message);
        this.changeDetector.markForCheck();
      }
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
