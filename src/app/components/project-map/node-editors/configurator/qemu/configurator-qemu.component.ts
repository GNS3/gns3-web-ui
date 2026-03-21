import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { CustomAdaptersTableComponent } from '@components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { QemuBinary } from '@models/qemu/qemu-binary';
import { QemuImage } from '@models/qemu/qemu-image';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { QemuService } from '@services/qemu.service';
import { ToasterService } from '@services/toaster.service';
import { QemuImageCreatorComponent } from './qemu-image-creator/qemu-image-creator.component';

@Component({
  standalone: true,
  selector: 'app-configurator-qemu',
  templateUrl: './configurator-qemu.component.html',
  styleUrls: ['../configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatCheckboxModule,
  ],
})
export class ConfiguratorDialogQemuComponent implements OnInit {
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogQemuComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private qemuService = inject(QemuService);
  private qemuConfigurationService = inject(QemuConfigurationService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  networkSettingsForm: UntypedFormGroup;
  consoleTypes: string[] = [];
  onCloseOptions = [];
  bootPriorities = [];
  diskInterfaces: string[] = [];

  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  networkTypes = [];
  qemuImages: QemuImage[] = [];
  selectPlatform: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  private conf = {
    autoFocus: false,
    width: '800px',
    disableClose: true,
  };
  dialogRefQemuImageCreator;

  readonly customAdapters = viewChild<CustomAdaptersTableComponent>('customAdapters');

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      ram: new UntypedFormControl('', Validators.required),
    });

    this.networkSettingsForm = this.formBuilder.group({
      mac_address: new UntypedFormControl('', Validators.pattern(this.qemuConfigurationService.getMacAddrRegex())),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.getConfiguration();
      this.cd.markForCheck();
    });

    this.qemuService.getImages(this.controller).subscribe((qemuImages: QemuImage[]) => {
      this.qemuImages = qemuImages;
      this.cd.markForCheck();
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
    if (this.generalSettingsForm.valid && this.networkSettingsForm.valid) {
      // this.node.custom_adapters = [];
      // this.customAdapters.adapters.forEach((n) => {
      //   this.node.custom_adapters.push({
      //     adapter_number: n.adapter_number,
      //     adapter_type: n.adapter_type,
      //   });
      // });
      //
      // this.node.properties.adapters = this.node.custom_adapters.length;

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

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.node) {
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.node.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.node.tags) {
      return;
    }
    const index = this.node.tags.indexOf(tag);

    if (index >= 0) {
      this.node.tags.splice(index, 1);
    }
  }
}
