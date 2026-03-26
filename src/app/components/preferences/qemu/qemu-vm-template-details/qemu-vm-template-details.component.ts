import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { QemuService } from '@services/qemu.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import {
  CustomAdaptersComponent,
  CustomAdaptersDialogData,
  CustomAdaptersDialogResult,
} from '../../common/custom-adapters/custom-adapters.component';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-qemu-virtual-machine-template-details',
  templateUrl: './qemu-vm-template-details.component.html',
  styleUrls: ['./qemu-vm-template-details.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    SymbolsMenuComponent,
  ],
})
export class QemuVmTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private qemuService = inject(QemuService);
  private toasterService = inject(ToasterService);
  private configurationService = inject(QemuConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  controller: Controller;
  qemuTemplate: QemuTemplate;
  isSymbolSelectionOpened = false;
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  diskInterfaces: string[] = [];
  networkTypes: any[] = [];
  bootPriorities: any[] = [];
  onCloseOptions: any[] = [];
  categories: any[] = [];
  priorities: string[] = [];
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'mac_address', 'actions'];
  selectPlatform: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  // Section collapse states
  generalSettingsExpanded = false;
  hddExpanded = false;
  cdDvdExpanded = false;
  networkExpanded = false;
  advancedExpanded = false;
  usageExpanded = false;

  // Model signals for form fields
  templateName = model('');
  defaultName = model('');
  symbol = model('');
  category = model('');
  platform = model('');
  ram = model(256);
  cpus = model(1);
  bootPriority = model('');
  onClose = model('');
  consoleType = model('');
  auxConsoleType = model('');
  consoleAutoStart = model(false);

  // HDD fields
  hdaDiskImage = model('');
  hdaDiskInterface = model('');
  hdbDiskImage = model('');
  hdbDiskInterface = model('');
  hdcDiskImage = model('');
  hdcDiskInterface = model('');
  hddDiskImage = model('');
  hddDiskInterface = model('');

  // CD/DVD
  cdromImage = model('');

  // Network
  adapters = model(0);
  firstPortName = model('');
  portNameFormat = model('');
  portSegmentSize = model(0);
  macAddress = model('');
  networkType = model('');
  replicateNetworkConnectionState = model(false);

  // Advanced
  initrd = model('');
  kernelImage = model('');
  kernelCommandLine = model('');
  biosImage = model('');
  activateCpuThrottling = model(false);
  cpuThrottling = model(0);
  processPriority = model('');
  qemuPath = model('');
  options = model('');
  linkedClone = model(false);
  tpm = model(false);
  uefi = model(false);

  // Usage & Tags
  usage = model('');
  tags = model<string[]>([]);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.getConfiguration();
      this.qemuService.getTemplate(this.controller, template_id).subscribe((qemuTemplate: QemuTemplate) => {
        this.qemuTemplate = qemuTemplate;
        if (!this.qemuTemplate.tags) {
          this.qemuTemplate.tags = [];
        }

        // Custom adapters will be managed through the dialog (incremental save)
        this.initFormFromTemplate();
        this.cd.markForCheck();
      });
    });

    this.selectPlatform = this.configurationService.getPlatform();
  }

  initFormFromTemplate() {
    this.templateName.set(this.qemuTemplate.name || '');
    this.defaultName.set(this.qemuTemplate.default_name_format || '');
    this.symbol.set(this.qemuTemplate.symbol || '');
    this.category.set(this.qemuTemplate.category || '');
    this.platform.set(this.qemuTemplate.platform || '');
    this.ram.set(this.qemuTemplate.ram || 256);
    this.cpus.set(this.qemuTemplate.cpus || 1);
    this.bootPriority.set(this.qemuTemplate.boot_priority || '');
    this.onClose.set(this.qemuTemplate.on_close || '');
    this.consoleType.set(this.qemuTemplate.console_type || '');
    this.auxConsoleType.set(this.qemuTemplate.aux_type || '');
    this.consoleAutoStart.set(this.qemuTemplate.console_auto_start || false);

    this.hdaDiskImage.set(this.qemuTemplate.hda_disk_image || '');
    this.hdaDiskInterface.set(this.qemuTemplate.hda_disk_interface || '');
    this.hdbDiskImage.set(this.qemuTemplate.hdb_disk_image || '');
    this.hdbDiskInterface.set(this.qemuTemplate.hdb_disk_interface || '');
    this.hdcDiskImage.set(this.qemuTemplate.hdc_disk_image || '');
    this.hdcDiskInterface.set(this.qemuTemplate.hdc_disk_interface || '');
    this.hddDiskImage.set(this.qemuTemplate.hdd_disk_image || '');
    this.hddDiskInterface.set(this.qemuTemplate.hdd_disk_interface || '');

    this.cdromImage.set(this.qemuTemplate.cdrom_image || '');

    this.adapters.set(this.qemuTemplate.adapters || 0);
    this.firstPortName.set(this.qemuTemplate.first_port_name || '');
    this.portNameFormat.set(this.qemuTemplate.port_name_format || '');
    this.portSegmentSize.set(this.qemuTemplate.port_segment_size || 0);
    this.macAddress.set(this.qemuTemplate.mac_address || '');
    this.networkType.set(this.qemuTemplate.adapter_type || '');
    this.replicateNetworkConnectionState.set(this.qemuTemplate.replicate_network_connection_state || false);

    this.initrd.set(this.qemuTemplate.initrd || '');
    this.kernelImage.set(this.qemuTemplate.kernel_image || '');
    this.kernelCommandLine.set(this.qemuTemplate.kernel_command_line || '');
    this.biosImage.set(this.qemuTemplate.bios_image || '');
    this.activateCpuThrottling.set(
      this.qemuTemplate.cpu_throttling !== undefined && this.qemuTemplate.cpu_throttling > 0
    );
    this.cpuThrottling.set(this.qemuTemplate.cpu_throttling || 0);
    this.processPriority.set(this.qemuTemplate.process_priority || '');
    this.qemuPath.set(this.qemuTemplate.qemu_path || '');
    this.options.set(this.qemuTemplate.options || '');
    this.linkedClone.set(this.qemuTemplate.linked_clone || false);
    this.tpm.set(this.qemuTemplate.tpm || false);
    this.uefi.set(this.qemuTemplate.uefi || false);

    this.usage.set(this.qemuTemplate.usage || '');
    this.tags.set(this.qemuTemplate.tags || []);
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.auxConsoleTypes = this.configurationService.getAuxConsoleTypes();
    this.diskInterfaces = this.configurationService.getDiskInterfaces();
    this.networkTypes = this.configurationService.getNetworkTypes();
    this.bootPriorities = this.configurationService.getBootPriorities();
    this.onCloseOptions = this.configurationService.getOnCloseOptions();
    this.categories = this.configurationService.getCategories();
    this.priorities = this.configurationService.getPriorities();
  }

  uploadCdromImageFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.cdromImage.set(input.files[0].name);
    }
  }

  uploadInitrdFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.initrd.set(input.files[0].name);
    }
  }

  uploadKernelImageFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.kernelImage.set(input.files[0].name);
    }
  }

  uploadBiosFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.biosImage.set(input.files[0].name);
    }
  }

  openCustomAdaptersDialog() {
    // Generate complete adapter list for display
    // Use server custom_adapters if available, otherwise use defaults
    const portNameFormat = this.portNameFormat() || 'Ethernet{0}';
    const segmentSize = this.portSegmentSize() || 0;
    const defaultAdapterType = this.networkType() || 'e1000';
    const adapterCount = this.adapters();

    // Get custom adapters from server
    const serverCustomAdapters = this.qemuTemplate.custom_adapters || [];

    // Build complete adapter list for display
    const adaptersForDialog: CustomAdapter[] = [];

    for (let i = 0; i < adapterCount; i++) {
      // Check if server has custom config for this adapter_number
      const customAdapter = serverCustomAdapters.find((adapter) => adapter.adapter_number === i);

      if (customAdapter) {
        // Use server's custom configuration
        adaptersForDialog.push({
          adapter_number: customAdapter.adapter_number,
          adapter_type: customAdapter.adapter_type,
          port_name: customAdapter.port_name,
          mac_address: customAdapter.mac_address || '',
        });
      } else {
        // Use default configuration
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
        // Save only non-default custom adapters (incremental save like Desktop GUI)
        this.qemuTemplate.custom_adapters = result.adapters;
        if (result.requiredAdapters !== undefined) {
          this.adapters.set(result.requiredAdapters);
        }
        this.cd.markForCheck();
      }
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'qemu', 'templates']);
  }

  onSave() {
    if (!this.templateName() || !this.defaultName() || !this.symbol()) {
      const missingFields: string[] = [];
      if (!this.templateName()) missingFields.push('Template name');
      if (!this.defaultName()) missingFields.push('Default name format');
      if (!this.symbol()) missingFields.push('Symbol');
      this.toasterService.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Update qemuTemplate from model signals
    this.qemuTemplate.name = this.templateName();
    this.qemuTemplate.default_name_format = this.defaultName();
    this.qemuTemplate.symbol = this.symbol();
    this.qemuTemplate.category = this.category();
    this.qemuTemplate.platform = this.platform();
    this.qemuTemplate.ram = this.ram();
    this.qemuTemplate.cpus = this.cpus();
    this.qemuTemplate.boot_priority = this.bootPriority();
    this.qemuTemplate.on_close = this.onClose();
    this.qemuTemplate.console_type = this.consoleType();
    this.qemuTemplate.aux_type = this.auxConsoleType();
    this.qemuTemplate.console_auto_start = this.consoleAutoStart();

    this.qemuTemplate.hda_disk_image = this.hdaDiskImage();
    this.qemuTemplate.hda_disk_interface = this.hdaDiskInterface();
    this.qemuTemplate.hdb_disk_image = this.hdbDiskImage();
    this.qemuTemplate.hdb_disk_interface = this.hdbDiskInterface();
    this.qemuTemplate.hdc_disk_image = this.hdcDiskImage();
    this.qemuTemplate.hdc_disk_interface = this.hdcDiskInterface();
    this.qemuTemplate.hdd_disk_image = this.hddDiskImage();
    this.qemuTemplate.hdd_disk_interface = this.hddDiskInterface();

    this.qemuTemplate.cdrom_image = this.cdromImage();

    this.qemuTemplate.adapters = this.adapters();
    this.qemuTemplate.first_port_name = this.firstPortName();
    this.qemuTemplate.port_name_format = this.portNameFormat();
    this.qemuTemplate.port_segment_size = this.portSegmentSize();
    this.qemuTemplate.mac_address = this.macAddress();
    this.qemuTemplate.adapter_type = this.networkType();
    this.qemuTemplate.replicate_network_connection_state = this.replicateNetworkConnectionState();

    this.qemuTemplate.initrd = this.initrd();
    this.qemuTemplate.kernel_image = this.kernelImage();
    this.qemuTemplate.kernel_command_line = this.kernelCommandLine();
    this.qemuTemplate.bios_image = this.biosImage();
    this.qemuTemplate.cpu_throttling = this.activateCpuThrottling() ? this.cpuThrottling() : 0;
    this.qemuTemplate.process_priority = this.processPriority();
    this.qemuTemplate.qemu_path = this.qemuPath();
    this.qemuTemplate.options = this.options();
    this.qemuTemplate.linked_clone = this.linkedClone();
    this.qemuTemplate.tpm = this.tpm();
    this.qemuTemplate.uefi = this.uefi();

    this.qemuTemplate.usage = this.usage();
    this.qemuTemplate.tags = this.tags();

    // Custom adapters are already managed through the dialog (incremental save)

    this.qemuService.saveTemplate(this.controller, this.qemuTemplate).subscribe({
      next: (savedTemplate: QemuTemplate) => {
        this.toasterService.success('Changes saved');
        // Update local template with server response to reflect changes immediately
        this.qemuTemplate = savedTemplate;
        this.initFormFromTemplate();
        this.cd.markForCheck();
      },
      error: (error) => {
        this.toasterService.error('Failed to save template: ' + (error.message || 'Unknown error'));
      },
    });
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.symbol.set(chosenSymbol);
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const currentTags = this.tags();

    if (value) {
      this.tags.set([...currentTags, value]);
    }

    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    const currentTags = this.tags();
    const index = currentTags.indexOf(tag);

    if (index >= 0) {
      const newTags = [...currentTags];
      newTags.splice(index, 1);
      this.tags.set(newTags);
    }
  }

  toggleSection(section: string): void {
    switch (section) {
      case 'general':
        this.generalSettingsExpanded = !this.generalSettingsExpanded;
        break;
      case 'hdd':
        this.hddExpanded = !this.hddExpanded;
        break;
      case 'cddvd':
        this.cdDvdExpanded = !this.cdDvdExpanded;
        break;
      case 'network':
        this.networkExpanded = !this.networkExpanded;
        break;
      case 'advanced':
        this.advancedExpanded = !this.advancedExpanded;
        break;
      case 'usage':
        this.usageExpanded = !this.usageExpanded;
        break;
    }
  }
}
