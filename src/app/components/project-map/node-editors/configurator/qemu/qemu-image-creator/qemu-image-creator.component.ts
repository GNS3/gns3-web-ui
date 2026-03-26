import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { QemuService, QemuDiskImageOptions } from '@services/qemu.service';
import { ToasterService } from '@services/toaster.service';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-qemu-image-creator',
  templateUrl: './qemu-image-creator.component.html',
  styleUrl: '../../configurator.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
    MatAutocompleteModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QemuImageCreatorComponent {
  controller: Controller;
  nodeId: string;
  projectId: string;

  diskOptions: string[] = ['hda', 'hdb', 'hdc', 'hdd', 'ide0', 'ide1', 'scsi0', 'scsi1', 'scsi2'];
  formatOptions: string[] = ['qcow2', 'qcow', 'vhd', 'vdi', 'vmdk', 'raw'];
  preallocationsOptions: string[] = ['off', 'metadata', 'falloc', 'full'];

  inputForm: UntypedFormGroup;
  filteredDisks$: Observable<string[]>;

  public dialogRef = inject(MatDialogRef<QemuImageCreatorComponent>);
  public nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private qemuService = inject(QemuService);

  constructor() {
    this.inputForm = this.formBuilder.group({
      disk_name: new UntypedFormControl('', [Validators.required]),
      format: new UntypedFormControl('', Validators.required),
      size: new UntypedFormControl('', [Validators.required, Validators.min(1)]),
      preallocation: new UntypedFormControl(''),
      lazy_refcounts: new UntypedFormControl(''),
    });

    // Setup autocomplete filtering
    this.filteredDisks$ = this.inputForm.get('disk_name')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterDisks(value || ''))
    );
  }

  private _filterDisks(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.diskOptions.filter(disk => disk.toLowerCase().includes(filterValue));
  }

  onSaveClick() {
    if (this.inputForm.valid) {
      const formValue = this.inputForm.value;
      const options: QemuDiskImageOptions = {
        format: formValue.format,
        size: formValue.size,
      };

      if (formValue.preallocation) options.preallocation = formValue.preallocation;
      if (formValue.lazy_refcounts) options.lazy_refcounts = formValue.lazy_refcounts;

      this.qemuService.createDiskImage(
        this.controller,
        this.projectId,
        this.nodeId,
        formValue.disk_name,
        options
      ).subscribe({
        next: () => {
          this.dialogRef.close();
        },
        error: (error) => {
          const errorMessage = error.error?.detail || error.message || 'Failed to create image';
          this.toasterService.error(errorMessage);
        },
      });
    } else {
      const missingFields: string[] = [];
      if (!this.inputForm.get('disk_name')?.value) missingFields.push('Disk name');
      if (!this.inputForm.get('format')?.value) missingFields.push('Format');
      if (!this.inputForm.get('size')?.value) missingFields.push('Size (MB)');
      this.toasterService.error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
