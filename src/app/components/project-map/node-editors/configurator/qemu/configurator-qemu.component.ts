import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { Node } from '../../../../../cartography/models/node';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { QemuBinary } from '@models/qemu/qemu-binary';
import { QemuImage } from '@models/qemu/qemu-image';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { QemuService } from '@services/qemu.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';
import { ImageManagerService } from '@services/image-manager.service';
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
  private qemuService = inject(QemuService);
  private qemuConfigurationService = inject(QemuConfigurationService);
  private cd = inject(ChangeDetectorRef);
  private imageManagerService = inject(ImageManagerService);
  private validationService = inject(ValidationService);

  controller: Controller;
  node: Node;
  name: string;
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  onCloseOptions = [];
  bootPriorities = [];
  diskInterfaces: string[] = [];

  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  networkTypes = [];
  qemuImages: QemuImage[] = [];
  filteredImages: QemuImage[] = [];
  projectDiskFiles: string[] = [];
  projectIsoFiles: string[] = [];
  globalIsoImages: string[] = [];
  allNodeFiles: string[] = [];
  allGlobalFiles: string[] = [];
  filteredNodeFiles: string[] = [];
  filteredGlobalFiles: string[] = [];
  filteredIsoFiles: string[] = [];
  filteredGlobalIsoImages: string[] = [];
  selectPlatform: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  private conf = {
    autoFocus: false,
    panelClass: ['base-dialog-panel', 'qemu-configurator-dialog-panel'],
    disableClose: true,
  };
  dialogRefQemuImageCreator;

  // Model signals
  readonly nodeName = model('');
  readonly ram = model('');
  readonly platform = model('');
  readonly cpus = model('');
  readonly bootPriority = model('');
  readonly onClose = model('');
  readonly consoleType = model('');
  readonly auxType = model('');
  readonly consoleAutoStart = model(false);
  // HDD
  readonly hdaDiskImage = model(''); readonly hdaDiskInterface = model('');
  readonly hdbDiskImage = model(''); readonly hdbDiskInterface = model('');
  readonly hdcDiskImage = model(''); readonly hdcDiskInterface = model('');
  readonly hddDiskImage = model(''); readonly hddDiskInterface = model('');
  // CD/DVD
  readonly cdromImage = model('');
  // Advanced
  readonly initrd = model(''); readonly kernelImage = model('');
  readonly kernelCommandLine = model(''); readonly biosImage = model('');
  readonly activateCpuThrottling = model(false);
  readonly cpuThrottling = model('');
  readonly processPriority = model(''); readonly qemuPath = model('');
  readonly options = model(''); readonly tpm = model(false);
  readonly uefi = model(false);
  readonly usage = model('');
  readonly linkedClone = model(false);
  readonly maxcpus = model('');
  readonly createConfigDisk = model(false);
  // Network
  readonly adapters = model(''); readonly macAddress = model('');
  readonly adapterType = model('');
  readonly replicateNetworkState = model(false);

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        // Update model signals
        this.nodeName.set(node.name || '');
        this.ram.set(node.properties.ram?.toString() || '');
        this.platform.set(node.properties.platform || '');
        this.cpus.set(node.properties.cpus?.toString() || '');
        this.bootPriority.set(node.properties.boot_priority || '');
        this.onClose.set(node.properties.on_close || '');
        this.consoleType.set(node.console_type || '');
        this.auxType.set(node.aux_type || '');
        this.consoleAutoStart.set(node.console_auto_start || false);
        this.hdaDiskImage.set(node.properties.hda_disk_image || '');
        this.hdaDiskInterface.set(node.properties.hda_disk_interface || '');
        this.hdbDiskImage.set(node.properties.hdb_disk_image || '');
        this.hdbDiskInterface.set(node.properties.hdb_disk_interface || '');
        this.hdcDiskImage.set(node.properties.hdc_disk_image || '');
        this.hdcDiskInterface.set(node.properties.hdc_disk_interface || '');
        this.hddDiskImage.set(node.properties.hdd_disk_image || '');
        this.hddDiskInterface.set(node.properties.hdd_disk_interface || '');
        this.cdromImage.set(node.properties.cdrom_image || '');
        this.initrd.set(node.properties.initrd || '');
        this.kernelImage.set(node.properties.kernel_image || '');
        this.kernelCommandLine.set(node.properties.kernel_command_line || '');
        this.biosImage.set(node.properties.bios_image || '');
        this.cpuThrottling.set(node.properties.cpu_throttling?.toString() || '');
        this.processPriority.set(node.properties.process_priority || '');
        this.qemuPath.set(node.properties.qemu_path || '');
        this.options.set(node.properties.options || '');
        this.tpm.set(node.properties.tpm || false);
        this.uefi.set(node.properties.uefi || false);
        this.usage.set(node.properties.usage || '');
        this.linkedClone.set(node.properties.linked_clone ?? true);
        this.maxcpus.set(node.properties.maxcpus?.toString() || '');
        this.createConfigDisk.set(node.properties.create_config_disk ?? false);
        this.adapters.set(node.properties.adapters?.toString() || '');
        this.macAddress.set(node.properties.mac_address || '');
        this.adapterType.set(node.properties.adapter_type || '');
        this.replicateNetworkState.set(node.properties.replicate_network_connection_state || false);

        if (!this.node.tags) {
          this.node.tags = [];
        }
        // Load node files for HDD autocomplete
        this.nodeService.getNodeFiles(this.controller, node.project_id, node.node_id).subscribe({
          next: (files: any[]) => {
            const extSet = new Set(['qcow2', 'qcow', 'vmdk', 'vhd', 'vdi', 'raw', 'img']);
            this.allNodeFiles = files.map((f: any) => f.path);
            this.projectDiskFiles = files
              .filter((f: any) => extSet.has(f.extension?.toLowerCase()))
              .map((f: any) => f.path);
            this.projectIsoFiles = files
              .filter((f: any) => f.extension?.toLowerCase() === 'iso')
              .map((f: any) => f.path);
            this.cd.markForCheck();
          },
          error: () => {},
        });
        // Load global ISO images
        this.imageManagerService.getImages(this.controller).subscribe({
          next: (images: any[]) => {
            this.globalIsoImages = images
              .filter((img: any) => img.filename?.endsWith('.iso'))
              .map((img: any) => img.filename);
            this.cd.markForCheck();
          },
          error: () => {},
        });
        // allGlobalFiles is already loaded by qemuService.getImages() above
        this.getConfiguration();
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load node';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });

    this.qemuService.getImages(this.controller).subscribe({
      next: (qemuImages: QemuImage[]) => {
        this.qemuImages = qemuImages;
        this.filteredImages = qemuImages;
        this.allGlobalFiles = qemuImages.map((img) => img.filename);
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load QEMU images';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
    this.selectPlatform = this.qemuConfigurationService.getPlatform();
  }

  openQemuImageCreator() {
    this.dialogRefQemuImageCreator = this.dialog.open(QemuImageCreatorComponent, this.conf);
    let instance = this.dialogRefQemuImageCreator.componentInstance;
    instance.controller = this.controller;
    instance.nodeId = this.node.node_id;
    instance.projectId = this.node.project_id;

    this.dialogRefQemuImageCreator.afterClosed().subscribe((result: any) => {
      if (result?.mountPoint && result?.filename) {
        const mp = result.mountPoint.toLowerCase();
        const diskSignalMap: Record<string, any> = {
          hda: this.hdaDiskImage,
          hdb: this.hdbDiskImage,
          hdc: this.hdcDiskImage,
          hdd: this.hddDiskImage,
        };
        if (diskSignalMap[mp]) {
          diskSignalMap[mp].set(result.filename);
          this.cd.markForCheck();
        }
      }
    });
  }

  openIsoAutocomplete(trigger: any) {
    // Force autocomplete panel to open by triggering change detection
    if (trigger && trigger.openPanel) {
      trigger.openPanel();
    }
  }

  private refreshQemuImages() {
    this.qemuService.getImages(this.controller).subscribe({
      next: (qemuImages: QemuImage[]) => {
        this.qemuImages = qemuImages;
        this.filteredImages = qemuImages;
        this.allGlobalFiles = qemuImages.map((img) => img.filename);
        this.cd.markForCheck();
      },
      error: () => {},
    });
  }

  private refreshNodeFiles() {
    this.nodeService.getNodeFiles(this.controller, this.node.project_id, this.node.node_id).subscribe({
      next: (files: any[]) => {
        this.allNodeFiles = files.map((f: any) => f.path);
        const extSet = new Set(['qcow2', 'qcow', 'vmdk', 'vhd', 'vdi', 'raw', 'img']);
        this.projectIsoFiles = files.filter((f: any) => f.extension?.toLowerCase() === 'iso').map((f: any) => f.path);
        this.projectDiskFiles = files
          .filter((f: any) => extSet.has(f.extension?.toLowerCase()))
          .map((f: any) => f.path);
        this.cd.markForCheck();
      },
      error: () => {},
    });
  }

  private refreshGlobalImages() {
    this.imageManagerService.getImages(this.controller).subscribe({
      next: (images: any[]) => {
        this.globalIsoImages = images.filter((img: any) => img.filename?.endsWith('.iso')).map((img: any) => img.filename);
        this.cd.markForCheck();
      },
      error: () => {},
    });
  }

  uploadCdromImageFile(event, target: 'global' | 'device' = 'global') {
    const file = event.target.files[0];
    if (!file) return;
    const filename = file.name;
    const upload$ = target === 'device'
      ? this.nodeService.uploadNodeFile(this.controller, this.node.project_id, this.node.node_id, filename, file)
      : this.imageManagerService.uploadedImage(this.controller, false, filename, file);
    upload$.subscribe({
      next: () => {
        this.node.properties.cdrom_image = filename;
        this.cdromImage.set(filename);
        if (target === 'device') {
          this.refreshNodeFiles();
        } else {
          this.refreshGlobalImages();
        }
        this.toasterService.success(`Uploaded ${filename}`);
        this.cd.markForCheck();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Failed to upload image';
        this.toasterService.error(msg);
      },
    });
  }

  private uploadFile(file: File, signal: { set: (v: string) => void }, propKey: string, target: 'device' | 'global') {
    const filename = file.name;
    const upload$ = target === 'device'
      ? this.nodeService.uploadNodeFile(this.controller, this.node.project_id, this.node.node_id, filename, file)
      : this.imageManagerService.uploadedImage(this.controller, false, filename, file);
    upload$.subscribe({
      next: () => {
        (this.node.properties as any)[propKey] = filename;
        signal.set(filename);
        if (target === 'device') this.refreshNodeFiles();
        else this.refreshGlobalImages();
        this.toasterService.success(`Uploaded ${filename}`);
        this.cd.markForCheck();
      },
      error: (err) => {
        this.toasterService.error(err.error?.message || err.message || 'Failed to upload');
      },
    });
  }

  uploadInitrdFile(event, target: 'device' | 'global' = 'global') {
    if (event.target.files[0]) this.uploadFile(event.target.files[0], this.initrd, 'initrd', target);
  }

  uploadKernelImageFile(event, target: 'device' | 'global' = 'global') {
    if (event.target.files[0]) this.uploadFile(event.target.files[0], this.kernelImage, 'kernel_image', target);
  }

  uploadBiosFile(event, target: 'device' | 'global' = 'global') {
    if (event.target.files[0]) this.uploadFile(event.target.files[0], this.biosImage, 'bios_image', target);
  }

  getConfiguration() {
    this.consoleTypes = this.qemuConfigurationService.getConsoleTypes();
    this.auxConsoleTypes = this.qemuConfigurationService.getAuxConsoleTypes();
    this.onCloseOptions = this.qemuConfigurationService.getOnCloseOptions();
    this.qemuConfigurationService.getNetworkTypes().forEach((n) => {
      this.networkTypes.push(n);
    });
    this.bootPriorities = this.qemuConfigurationService.getBootPriorities();
    this.diskInterfaces = this.qemuConfigurationService.getDiskInterfaces();
  }

  filterImages(event: Event): QemuImage[] {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    return this.qemuImages.filter((image) => image.filename.toLowerCase().includes(filterValue));
  }

  onAdvancedFileInput(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredNodeFiles = this.allNodeFiles.filter((f) => f.toLowerCase().includes(value));
    this.filteredGlobalFiles = this.allGlobalFiles.filter((f) => f.toLowerCase().includes(value));
  }

  onCdromInput(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredIsoFiles = this.projectIsoFiles.filter((f) => f.toLowerCase().includes(value));
    this.filteredGlobalIsoImages = this.globalIsoImages.filter((f) => f.toLowerCase().includes(value));
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
          this.adapters.set(result.requiredAdapters.toString());
        }
        this.cd.markForCheck();
      }
    });
  }

  onSaveClick() {
    // Validate required fields
    const nameValidation = this.validationService.required(this.nodeName(), 'Name');
    if (!nameValidation.isValid) { this.toasterService.error(nameValidation.errorMessage); return; }
    const ramValidation = this.validationService.required(this.ram(), 'RAM');
    if (!ramValidation.isValid) { this.toasterService.error(ramValidation.errorMessage); return; }

    // Merge signal values back into node
    this.node.name = this.nodeName();
    this.node.properties.ram = parseInt(this.ram(), 10) || 0;
    this.node.properties.platform = this.platform();
    this.node.properties.cpus = parseFloat(this.cpus()) || 0;
    this.node.properties.boot_priority = this.bootPriority();
    this.node.properties.on_close = this.onClose();
    this.node.console_type = this.consoleType();
    this.node.aux_type = this.auxType();
    this.node.console_auto_start = this.consoleAutoStart();
    this.node.properties.hda_disk_image = this.hdaDiskImage();
    this.node.properties.hda_disk_interface = this.hdaDiskInterface();
    this.node.properties.hdb_disk_image = this.hdbDiskImage();
    this.node.properties.hdb_disk_interface = this.hdbDiskInterface();
    this.node.properties.hdc_disk_image = this.hdcDiskImage();
    this.node.properties.hdc_disk_interface = this.hdcDiskInterface();
    this.node.properties.hdd_disk_image = this.hddDiskImage();
    this.node.properties.hdd_disk_interface = this.hddDiskInterface();
    this.node.properties.cdrom_image = this.cdromImage();
    this.node.properties.initrd = this.initrd();
    this.node.properties.kernel_image = this.kernelImage();
    this.node.properties.kernel_command_line = this.kernelCommandLine();
    this.node.properties.bios_image = this.biosImage();
    this.node.properties.cpu_throttling = parseInt(this.cpuThrottling(), 10) || null;
    this.node.properties.process_priority = this.processPriority();
    this.node.properties.qemu_path = this.qemuPath();
    this.node.properties.options = this.options();
    this.node.properties.tpm = this.tpm();
    this.node.properties.uefi = this.uefi();
    this.node.properties.usage = this.usage();
    this.node.properties.linked_clone = this.linkedClone();
    this.node.properties.maxcpus = parseInt(this.maxcpus(), 10) || undefined;
    this.node.properties.create_config_disk = this.createConfigDisk();
    this.node.properties.adapters = parseInt(this.adapters(), 10) || 0;
    this.node.properties.mac_address = this.macAddress();
    this.node.properties.adapter_type = this.adapterType();
    this.node.properties.replicate_network_connection_state = this.replicateNetworkState();

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
