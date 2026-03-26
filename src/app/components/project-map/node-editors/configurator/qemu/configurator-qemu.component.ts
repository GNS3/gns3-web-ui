import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable, map, startWith } from 'rxjs';
import { Node } from '../../../../../cartography/models/node';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { QemuBinary } from '@models/qemu/qemu-binary';
import { QemuImage } from '@models/qemu/qemu-image';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { QemuService } from '@services/qemu.service';
import { ToasterService } from '@services/toaster.service';
import {
  CustomAdaptersComponent,
  CustomAdaptersDialogData,
  CustomAdaptersDialogResult,
} from '@components/preferences/common/custom-adapters/custom-adapters.component';
import { QemuImageCreatorComponent } from './qemu-image-creator/qemu-image-creator.component';

@Component({
  standalone: true,
  selector: 'app-configurator-qemu',
  templateUrl: './configurator-qemu.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
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
    MatAutocompleteModule,
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
  filteredImages: QemuImage[] = [];
  selectPlatform: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  private conf = {
    autoFocus: false,
    width: '500px',
    disableClose: true,
    panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
  };
  dialogRefQemuImageCreator;

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      ram: new UntypedFormControl('', Validators.required),
      platform: new UntypedFormControl(''),
      cpus: new UntypedFormControl(''),
      boot_priority: new UntypedFormControl(''),
      on_close: new UntypedFormControl(''),
      console_type: new UntypedFormControl(''),
      aux_type: new UntypedFormControl(''),
      console_auto_start: new UntypedFormControl(false),
      // HDD fields
      hda_disk_image: new UntypedFormControl(''),
      hda_disk_interface: new UntypedFormControl(''),
      hdb_disk_image: new UntypedFormControl(''),
      hdb_disk_interface: new UntypedFormControl(''),
      hdc_disk_image: new UntypedFormControl(''),
      hdc_disk_interface: new UntypedFormControl(''),
      hdd_disk_image: new UntypedFormControl(''),
      hdd_disk_interface: new UntypedFormControl(''),
      // CD/DVD
      cdrom_image: new UntypedFormControl(''),
      // Advanced
      initrd: new UntypedFormControl(''),
      kernel_image: new UntypedFormControl(''),
      kernel_command_line: new UntypedFormControl(''),
      bios_image: new UntypedFormControl(''),
      activateCpuThrottling: new UntypedFormControl(false),
      cpu_throttling: new UntypedFormControl(''),
      process_priority: new UntypedFormControl(''),
      qemu_path: new UntypedFormControl(''),
      options: new UntypedFormControl(''),
      tpm: new UntypedFormControl(false),
      uefi: new UntypedFormControl(false),
      // Usage
      usage: new UntypedFormControl(''),
    });

    this.networkSettingsForm = this.formBuilder.group({
      adapters: new UntypedFormControl(''),
      mac_address: new UntypedFormControl('', Validators.pattern(this.qemuConfigurationService.getMacAddrRegex())),
      adapter_type: new UntypedFormControl(''),
      replicate_network_connection_state: new UntypedFormControl(false),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;

      // Update form values
      this.generalSettingsForm.patchValue({
        name: node.name,
        ram: node.properties.ram || '',
        platform: node.properties.platform || '',
        cpus: node.properties.cpus || '',
        boot_priority: node.properties.boot_priority || '',
        on_close: node.properties.on_close || '',
        console_type: node.console_type || '',
        aux_type: node.properties.aux_type || '',
        console_auto_start: node.console_auto_start || false,
        // HDD fields
        hda_disk_image: node.properties.hda_disk_image || '',
        hda_disk_interface: node.properties.hda_disk_interface || '',
        hdb_disk_image: node.properties.hdb_disk_image || '',
        hdb_disk_interface: node.properties.hdb_disk_interface || '',
        hdc_disk_image: node.properties.hdc_disk_image || '',
        hdc_disk_interface: node.properties.hdc_disk_interface || '',
        hdd_disk_image: node.properties.hdd_disk_image || '',
        hdd_disk_interface: node.properties.hdd_disk_interface || '',
        // CD/DVD
        cdrom_image: node.properties.cdrom_image || '',
        // Advanced
        initrd: node.properties.initrd || '',
        kernel_image: node.properties.kernel_image || '',
        kernel_command_line: node.properties.kernel_command_line || '',
        bios_image: node.properties.bios_image || '',
        activateCpuThrottling: false,
        cpu_throttling: node.properties.cpu_throttling || '',
        process_priority: node.properties.process_priority || '',
        qemu_path: node.properties.qemu_path || '',
        options: node.properties.options || '',
        tpm: node.properties.tpm || false,
        uefi: node.properties.uefi || false,
        // Usage
        usage: node.properties.usage || '',
      });

      // Update network settings form
      this.networkSettingsForm.patchValue({
        adapters: node.properties.adapters || '',
        mac_address: node.properties.mac_address || '',
        adapter_type: node.properties.adapter_type || '',
        replicate_network_connection_state: node.properties.replicate_network_connection_state || false,
      });

      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.getConfiguration();
      this.cd.markForCheck();
    });

    this.qemuService.getImages(this.controller).subscribe((qemuImages: QemuImage[]) => {
      this.qemuImages = qemuImages;
      this.filteredImages = qemuImages;
      this.cd.markForCheck();
    });
    this.selectPlatform = this.qemuConfigurationService.getPlatform();
  }

  openQemuImageCreator() {
    this.dialogRefQemuImageCreator = this.dialog.open(QemuImageCreatorComponent, this.conf);
    let instance = this.dialogRefQemuImageCreator.componentInstance;
    instance.controller = this.controller;
    instance.nodeId = this.node.node_id;
    instance.projectId = this.node.project_id;
  }

  uploadCdromImageFile(event) {
    const filename = event.target.files[0].name;
    this.node.properties.cdrom_image = filename;
    this.generalSettingsForm.patchValue({ cdrom_image: filename });
  }

  uploadInitrdFile(event) {
    const filename = event.target.files[0].name;
    this.node.properties.initrd = filename;
    this.generalSettingsForm.patchValue({ initrd: filename });
  }

  uploadKernelImageFile(event) {
    const filename = event.target.files[0].name;
    this.node.properties.kernel_image = filename;
    this.generalSettingsForm.patchValue({ kernel_image: filename });
  }

  uploadBiosFile(event) {
    const filename = event.target.files[0].name;
    this.node.properties.bios_image = filename;
    this.generalSettingsForm.patchValue({ bios_image: filename });
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

  filterImages(event: Event): QemuImage[] {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    return this.qemuImages.filter(image => image.filename.toLowerCase().includes(filterValue));
  }

  onHdaImageInput(event: Event) {
    this.filteredImages = this.filterImages(event);
  }

  onHdbImageInput(event: Event) {
    this.filteredImages = this.filterImages(event);
  }

  onHdcImageInput(event: Event) {
    this.filteredImages = this.filterImages(event);
  }

  onHddImageInput(event: Event) {
    this.filteredImages = this.filterImages(event);
  }

  openCustomAdaptersDialog() {
    // Generate complete adapter list for display
    const portNameFormat = this.node.port_name_format || 'Ethernet{0}';
    const segmentSize = this.node.port_segment_size || 0;
    const defaultAdapterType = this.node.properties.adapter_type || 'e1000';
    const adapterCount = this.node.properties.adapters || 0;

    // Get custom adapters from server
    const serverCustomAdapters = this.node.custom_adapters || [];

    // Build complete adapter list for display
    const adaptersForDialog: CustomAdapter[] = [];

    for (let i = 0; i < adapterCount; i++) {
      const customAdapter = serverCustomAdapters.find((adapter) => adapter.adapter_number === i);

      if (customAdapter) {
        adaptersForDialog.push({
          adapter_number: customAdapter.adapter_number,
          adapter_type: customAdapter.adapter_type,
          port_name: customAdapter.port_name,
          mac_address: customAdapter.mac_address || '',
        });
      } else {
        // Generate default port name
        let portName: string;
        if (segmentSize > 0) {
          const segment = Math.floor(i / segmentSize);
          const portInSegment = i % segmentSize;
          portName = portNameFormat.replace('{0}', String(segment * segmentSize + portInSegment));
        } else {
          portName = portNameFormat.replace('{0}', String(i));
        }

        adaptersForDialog.push({
          adapter_number: i,
          adapter_type: defaultAdapterType,
          port_name: portName,
          mac_address: '',
        });
      }
    }

    const dialogRef = this.dialog.open(CustomAdaptersComponent, {
      panelClass: 'custom-adapters-dialog-panel',
      data: {
        adapters: adaptersForDialog,
        networkTypes: this.networkTypes,
        portNameFormat: portNameFormat,
        portSegmentSize: segmentSize,
        defaultAdapterType: defaultAdapterType,
        currentAdapters: adapterCount,
      } as CustomAdaptersDialogData,
    });

    dialogRef.afterClosed().subscribe((result: CustomAdaptersDialogResult) => {
      if (result) {
        this.node.custom_adapters = result.adapters;
        if (result.requiredAdapters !== undefined) {
          this.node.properties.adapters = result.requiredAdapters;
        }
        this.cd.markForCheck();
      }
    });
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid && this.networkSettingsForm.valid) {
      // Merge form values back into node
      const formValues = { ...this.generalSettingsForm.value };
      const networkFormValues = { ...this.networkSettingsForm.value };

      // Update general settings
      this.node.name = formValues.name;
      this.node.properties.ram = formValues.ram;
      this.node.properties.platform = formValues.platform;
      this.node.properties.cpus = formValues.cpus;
      this.node.properties.boot_priority = formValues.boot_priority;
      this.node.properties.on_close = formValues.on_close;
      this.node.console_type = formValues.console_type;
      this.node.properties.aux_type = formValues.aux_type;
      this.node.console_auto_start = formValues.console_auto_start;

      // Update HDD settings
      this.node.properties.hda_disk_image = formValues.hda_disk_image;
      this.node.properties.hda_disk_interface = formValues.hda_disk_interface;
      this.node.properties.hdb_disk_image = formValues.hdb_disk_image;
      this.node.properties.hdb_disk_interface = formValues.hdb_disk_interface;
      this.node.properties.hdc_disk_image = formValues.hdc_disk_image;
      this.node.properties.hdc_disk_interface = formValues.hdc_disk_interface;
      this.node.properties.hdd_disk_image = formValues.hdd_disk_image;
      this.node.properties.hdd_disk_interface = formValues.hdd_disk_interface;

      // Update CD/DVD
      this.node.properties.cdrom_image = formValues.cdrom_image;

      // Update Advanced settings
      this.node.properties.initrd = formValues.initrd;
      this.node.properties.kernel_image = formValues.kernel_image;
      this.node.properties.kernel_command_line = formValues.kernel_command_line;
      this.node.properties.bios_image = formValues.bios_image;
      this.node.properties.cpu_throttling = formValues.cpu_throttling || null;
      this.node.properties.process_priority = formValues.process_priority;
      this.node.properties.qemu_path = formValues.qemu_path;
      this.node.properties.options = formValues.options;
      this.node.properties.tpm = formValues.tpm;
      this.node.properties.uefi = formValues.uefi;
      this.node.properties.usage = formValues.usage;

      // Update network settings
      this.node.properties.adapters = networkFormValues.adapters;
      this.node.properties.mac_address = networkFormValues.mac_address;
      this.node.properties.adapter_type = networkFormValues.adapter_type;
      this.node.properties.replicate_network_connection_state = networkFormValues.replicate_network_connection_state;

      this.nodeService.updateNodeWithCustomAdapters(this.controller, this.node).subscribe({
        next: () => {
          this.toasterService.success(`Node ${this.node.name} updated.`);
          this.onCancelClick();
        },
        error: (error) => {
          const errorMessage = error.error?.message || error.message || 'Failed to update node';
          this.toasterService.error(errorMessage);
        },
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
