import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { QemuService, QemuDiskImageOptions } from '@services/qemu.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';

@Component({
  selector: 'app-qemu-image-creator',
  templateUrl: './qemu-image-creator.component.html',
  styleUrl: '../../configurator.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QemuImageCreatorComponent {
  controller: Controller;
  nodeId: string;
  projectId: string;

  formatOptions: string[] = ['qcow2', 'qcow', 'vhd', 'vdi', 'vmdk', 'raw'];
  preallocationsOptions: string[] = ['off', 'metadata', 'falloc', 'full'];

  public dialogRef = inject(MatDialogRef<QemuImageCreatorComponent>);
  public nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private qemuService = inject(QemuService);
  private validationService = inject(ValidationService);

  // Model signals
  readonly diskName = model('');
  readonly mountPoint = model('');
  readonly format = model('');
  readonly size = model('');
  readonly preallocation = model('');
  readonly lazyRefcounts = model('');
  readonly clusterSize = model('');
  readonly refcountBits = model('');
  readonly subformat = model('');
  readonly static = model('');
  readonly adapterType = model('');
  readonly zeroedGrain = model('');

  readonly mountPointOptions = ['hda', 'hdb', 'hdc', 'hdd'];

  // Format-specific options
  readonly clusterSizeOptions = [16, 32, 64, 128, 256];
  readonly refcountBitsOptions = [1, 2, 4, 8, 12, 16];
  readonly vmdkSubformatOptions = ['monolithicSparse', 'monolithicFlat', 'twoGbMaxExtentSparse', 'twoGbMaxExtentFlat', 'streamOptimized', 'vmfs', 'vmfsThin', 'vmfsDefault'];
  readonly vhdSubformatOptions = ['dynamic', 'fixed'];
  readonly adapterTypeOptions = ['ide', 'lsilogic', 'buslogic', 'legacyESX'];

  onSaveClick() {
    // Validate mount point
    const mountValidation = this.validationService.required(this.mountPoint(), 'Mount point');
    if (!mountValidation.isValid) { this.toasterService.error(mountValidation.errorMessage); return; }
    // Validate filename
    const nameValidation = this.validationService.required(this.diskName(), 'Filename');
    if (!nameValidation.isValid) { this.toasterService.error(nameValidation.errorMessage); return; }
    const ext = '.' + this.format();
    if (!this.diskName().toLowerCase().endsWith(ext)) {
      this.toasterService.error(`Filename must end with ${ext} extension for ${this.format()} format`);
      return;
    }
    // Validate format
    const formatValidation = this.validationService.required(this.format(), 'Format');
    if (!formatValidation.isValid) { this.toasterService.error(formatValidation.errorMessage); return; }
    // Validate size
    const sizeValidation = this.validationService.required(this.size(), 'Size');
    if (!sizeValidation.isValid) { this.toasterService.error(sizeValidation.errorMessage); return; }
    const sizeNum = parseInt(this.size(), 10);
    if (isNaN(sizeNum) || sizeNum < 1) {
      this.toasterService.error('Size must be a positive integer (at least 1 MB)');
      return;
    }

    const options: QemuDiskImageOptions = {
      format: this.format(),
      size: sizeNum,
    };
    if (this.preallocation()) options.preallocation = this.preallocation();
    if (this.lazyRefcounts()) options.lazy_refcounts = this.lazyRefcounts();
    if (this.clusterSize()) options.cluster_size = parseInt(this.clusterSize(), 10);
    if (this.refcountBits()) options.refcount_bits = parseInt(this.refcountBits(), 10);
    if (this.subformat()) options.subformat = this.subformat();
    if (this.static()) options.static = this.static();
    if (this.adapterType()) options.adapter_type = this.adapterType();
    if (this.zeroedGrain()) options.zeroed_grain = this.zeroedGrain();

    this.qemuService.createDiskImage(this.controller, this.projectId, this.nodeId, this.diskName(), options).subscribe({
      next: () => {
        this.dialogRef.close({ mountPoint: this.mountPoint(), filename: this.diskName() });
      },
      error: (error) => {
        const errorMessage = error.error?.detail || error.message || 'Failed to create image';
        this.toasterService.error(errorMessage);
      },
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
