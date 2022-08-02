import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { CustomAdaptersTableComponent } from '../../../../../components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { QemuBinary } from '../../../../../models/qemu/qemu-binary';
import { QemuImage } from '../../../../../models/qemu/qemu-image';
import{ Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { QemuConfigurationService } from '../../../../../services/qemu-configuration.service';
import { QemuService } from '../../../../../services/qemu.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { QemuImageCreatorComponent } from './qemu-image-creator/qemu-image-creator.component';

@Component({
  selector: 'app-configurator-qemu',
  templateUrl: './configurator-qemu.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogQemuComponent implements OnInit {
  controller:Controller ;
  node: Node;
  name: string;
  generalSettingsForm: FormGroup;
  consoleTypes: string[] = [];
  binaries: QemuBinary[] = [];
  onCloseOptions = [];
  bootPriorities = [];
  diskInterfaces: string[] = [];

  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  networkTypes = [];
  qemuImages: QemuImage[] = [];
  selectPlatform: string[] = [];

  private conf = {
    autoFocus: false,
    width: '800px',
    disableClose: true,
  };
  dialogRefQemuImageCreator;

  @ViewChild('customAdapters') customAdapters: CustomAdaptersTableComponent;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ConfiguratorDialogQemuComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder,
    private qemuService: QemuService,
    private qemuConfigurationService: QemuConfigurationService
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      name: new FormControl('', Validators.required),
      ram: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      this.getConfiguration();
    });

    this.qemuService.getImages(this.controller).subscribe((qemuImages: QemuImage[]) => {
      this.qemuImages = qemuImages;
    });
    this.selectPlatform = this.qemuConfigurationService.getPlatform();

  }

  openQemuImageCreator() {
    this.dialogRefQemuImageCreator = this.dialog.open(QemuImageCreatorComponent, this.conf);
    let instance = this.dialogRefQemuImageCreator.componentInstance;
    instance.controller = this.controller;
  }

  uploadCdromImageFile(event) {
    this.node.properties.cdrom_image = event.target.files[0].name;
  }

  uploadInitrdFile(event) {
    this.node.properties.initrd = event.target.files[0].name;
  }

  uploadKernelImageFile(event) {
    this.node.properties.kernel_image = event.target.files[0].name;
  }

  uploadBiosFile(event) {
    this.node.properties.bios_image = event.target.files[0].name;
  }

  getConfiguration() {
    this.consoleTypes = this.qemuConfigurationService.getConsoleTypes();
    this.onCloseOptions = this.qemuConfigurationService.getOnCloseOptions();
    this.qemuConfigurationService.getNetworkTypes().forEach((n) => {
      this.networkTypes.push(n);
    });
    this.bootPriorities = this.qemuConfigurationService.getBootPriorities();
    this.diskInterfaces = this.qemuConfigurationService.getDiskInterfaces();
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      this.node.custom_adapters = [];
      this.customAdapters.adapters.forEach((n) => {
        this.node.custom_adapters.push({
          adapter_number: n.adapter_number,
          adapter_type: n.adapter_type,
        });
      });

      this.node.properties.adapters = this.node.custom_adapters.length;

      this.nodeService.updateNodeWithCustomAdapters(this.controller, this.node).subscribe(() => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      });
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
