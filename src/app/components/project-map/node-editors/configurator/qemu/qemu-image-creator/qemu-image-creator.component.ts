import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { QemuImg } from '../../../../../../models/qemu/qemu-img';
import { Controller } from '../../../../../../models/controller';
import { NodeService } from '../../../../../../services/node.service';
import { QemuService } from '../../../../../../services/qemu.service';
import { ToasterService } from '../../../../../../services/toaster.service';

@Component({
  selector: 'app-qemu-image-creator',
  templateUrl: './qemu-image-creator.component.html',
  styleUrls: ['../../configurator.component.scss'],
})
export class QemuImageCreatorComponent implements OnInit {
  controller:Controller ;
  qemuImg: QemuImg;

  formatOptions: string[] = ['qcow2', 'qcow', 'vhd', 'vdi', 'vmdk', 'raw'];
  preallocationsOptions: string[] = ['off', 'metadata', 'falloc', 'full'];
  clusterSizeOptions: ClusterSize[] = [
    {
      name: '512',
      value: 512,
    },
    {
      name: '1k',
      value: 1024,
    },
    {
      name: '2k',
      value: 2048,
    },
    {
      name: '4k',
      value: 4096,
    },
    {
      name: '8k',
      value: 8192,
    },
    {
      name: '16k',
      value: 16384,
    },
    {
      name: '32k',
      value: 32768,
    },
    {
      name: '64k',
      value: 65536,
    },
    {
      name: '128k',
      value: 131072,
    },
    {
      name: '256k',
      value: 262144,
    },
    {
      name: '512k',
      value: 524288,
    },
    {
      name: '1024k',
      value: 1048576,
    },
    {
      name: '2048k',
      value: 2097152,
    },
  ];
  lazyRefcountsOptions: string[] = ['off', 'on'];
  refcountBitsOptions: number[] = [1, 2, 4, 8, 16, 32, 64];
  zeroedGrainOptions: string[] = ['on', 'off'];
  inputForm: UntypedFormGroup;

  constructor(
    public dialogRef: MatDialogRef<QemuImageCreatorComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private qemuService: QemuService
  ) {
    this.inputForm = this.formBuilder.group({
      qemu_img: new UntypedFormControl('', Validators.required),
      path: new UntypedFormControl('', Validators.required),
      size: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.qemuImg = {} as QemuImg;
  }

  setSubformat(subformat: string) {
    this.qemuImg.subformat = subformat;
  }

  onSaveClick() {
    if (this.inputForm.valid && this.qemuImg.format) {
      this.qemuService.addImage(this.controller, this.qemuImg).subscribe(() => {
        this.dialogRef.close();
      });
    } else {
      this.toasterService.error('Fill all required fields.');
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}

export interface ClusterSize {
  name: string;
  value: number;
}
