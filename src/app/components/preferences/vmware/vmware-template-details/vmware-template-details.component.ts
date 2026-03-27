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
import { VmwareTemplate } from '@models/templates/vmware-template';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { VmwareConfigurationService } from '@services/vmware-configuration.service';
import { VmwareService } from '@services/vmware.service';
import {
  CustomAdaptersComponent,
  CustomAdaptersDialogData,
  CustomAdaptersDialogResult,
} from '../../common/custom-adapters/custom-adapters.component';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vmware-template-details',
  templateUrl: './vmware-template-details.component.html',
  styleUrls: ['./vmware-template-details.component.scss', '../../preferences.component.scss'],
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
  ],
})
export class VmwareTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private vmwareService = inject(VmwareService);
  private toasterService = inject(ToasterService);
  private vmwareConfigurationService = inject(VmwareConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);

  controller: Controller;
  vmwareTemplate: VmwareTemplate;
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'mac_address', 'actions'];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  categories = [];
  onCloseOptions = [];
  networkTypes = [];

  // Section collapse states
  generalSettingsExpanded: boolean = false;
  networkExpanded: boolean = false;
  usageExpanded: boolean = false;

  // Model signals for form fields
  templateName = model('');
  defaultName = model('');
  symbol = model('');
  category = model('');
  consoleType = model('');
  consoleAutoStart = model(false);
  onClose = model('');
  headless = model(false);
  linkedClone = model(false);

  // Network
  adapters = model(0);
  firstPortName = model('');
  nameFormat = model('');
  segmentSize = model(0);
  networkType = model('');
  useAnyAdapter = model(false);

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
      this.vmwareService.getTemplate(this.controller, template_id).subscribe((vmwareTemplate: VmwareTemplate) => {
        this.vmwareTemplate = vmwareTemplate;
        if (!this.vmwareTemplate.tags) {
          this.vmwareTemplate.tags = [];
        }
        // Custom adapters will be managed through the dialog (incremental save)
        this.initFormFromTemplate();
        this.cd.markForCheck();
      });
    });
  }

  initFormFromTemplate() {
    this.templateName.set(this.vmwareTemplate.name || '');
    this.defaultName.set(this.vmwareTemplate.default_name_format || '');
    this.symbol.set(this.vmwareTemplate.symbol || '');
    this.category.set(this.vmwareTemplate.category || '');
    this.consoleType.set(this.vmwareTemplate.console_type || '');
    this.consoleAutoStart.set(this.vmwareTemplate.console_auto_start || false);
    this.onClose.set(this.vmwareTemplate.on_close || '');
    this.headless.set(this.vmwareTemplate.headless || false);
    this.linkedClone.set(this.vmwareTemplate.linked_clone || false);

    this.adapters.set(this.vmwareTemplate.adapters || 0);
    this.firstPortName.set(this.vmwareTemplate.first_port_name || '');
    this.nameFormat.set(this.vmwareTemplate.port_name_format || '');
    this.segmentSize.set(this.vmwareTemplate.port_segment_size || 0);
    this.networkType.set(this.vmwareTemplate.adapter_type || '');
    this.useAnyAdapter.set(this.vmwareTemplate.use_any_adapter || false);

    this.usage.set(this.vmwareTemplate.usage || '');
    this.tags.set(this.vmwareTemplate.tags || []);
  }

  getConfiguration() {
    this.consoleTypes = this.vmwareConfigurationService.getConsoleTypes();
    this.categories = this.vmwareConfigurationService.getCategories();
    this.onCloseOptions = this.vmwareConfigurationService.getOnCloseoptions();
    this.networkTypes = this.vmwareConfigurationService.getNetworkTypes();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'vmware', 'templates']);
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

    // Update vmwareTemplate from model signals
    this.vmwareTemplate.name = this.templateName();
    this.vmwareTemplate.default_name_format = this.defaultName();
    this.vmwareTemplate.symbol = this.symbol();
    this.vmwareTemplate.category = this.category();
    this.vmwareTemplate.console_type = this.consoleType();
    this.vmwareTemplate.console_auto_start = this.consoleAutoStart();
    this.vmwareTemplate.on_close = this.onClose();
    this.vmwareTemplate.headless = this.headless();
    this.vmwareTemplate.linked_clone = this.linkedClone();

    this.vmwareTemplate.adapters = this.adapters();
    this.vmwareTemplate.first_port_name = this.firstPortName();
    this.vmwareTemplate.port_name_format = this.nameFormat();
    this.vmwareTemplate.port_segment_size = this.segmentSize();
    this.vmwareTemplate.adapter_type = this.networkType();
    this.vmwareTemplate.use_any_adapter = this.useAnyAdapter();

    this.vmwareTemplate.usage = this.usage();
    this.vmwareTemplate.tags = this.tags();

    // Custom adapters are already managed through the dialog (incremental save)

    this.vmwareService.saveTemplate(this.controller, this.vmwareTemplate).subscribe({
      next: (vmwareTemplate: VmwareTemplate) => {
        this.toasterService.success('Changes saved');
        // Update local template with server response to reflect changes immediately
        this.vmwareTemplate = vmwareTemplate;
        this.initFormFromTemplate();
        this.cd.markForCheck();
      },
      error: (error) => {
        this.toasterService.error('Failed to save template: ' + (error.message || 'Unknown error'));
      },
    });
  }

  openCustomAdaptersDialog() {
    // Generate complete adapter list for display
    const portNameFormat = this.nameFormat() || 'Ethernet{0}';
    const segmentSize = this.segmentSize() || 0;
    const defaultAdapterType = this.networkType() || 'e1000';
    const adapterCount = this.adapters();

    // Get custom adapters from server
    const serverCustomAdapters = this.vmwareTemplate.custom_adapters || [];

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
        this.vmwareTemplate.custom_adapters = result.adapters;
        if (result.requiredAdapters !== undefined) {
          this.adapters.set(result.requiredAdapters);
        }
        this.cd.markForCheck();
      }
    });
  }

  chooseSymbol() {
    const dialogConfig = this.dialogConfig.openConfig('templateSymbol', {
      autoFocus: false,
      disableClose: false,
      data: {
        controller: this.controller,
        symbol: this.symbol(),
      },
    });
    const dialogRef = this.dialog.open(TemplateSymbolDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.symbol.set(result);
      }
    });
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
      case 'network':
        this.networkExpanded = !this.networkExpanded;
        break;
      case 'usage':
        this.usageExpanded = !this.usageExpanded;
        break;
    }
  }
}
