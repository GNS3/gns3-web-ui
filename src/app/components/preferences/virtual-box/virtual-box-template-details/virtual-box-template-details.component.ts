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
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { VirtualBoxConfigurationService } from '@services/virtual-box-configuration.service';
import { VirtualBoxService } from '@services/virtual-box.service';
import {
  CustomAdaptersComponent,
  CustomAdaptersDialogData,
  CustomAdaptersDialogResult,
} from '../../common/custom-adapters/custom-adapters.component';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-virtual-box-template-details',
  templateUrl: './virtual-box-template-details.component.html',
  styleUrls: ['./virtual-box-template-details.component.scss', '../../preferences.component.scss'],
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
export class VirtualBoxTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private virtualBoxService = inject(VirtualBoxService);
  private toasterService = inject(ToasterService);
  private virtualBoxConfigurationService = inject(VirtualBoxConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  controller: Controller;
  virtualBoxTemplate: VirtualBoxTemplate;
  isSymbolSelectionOpened = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  onCloseOptions: any[] = [];
  categories: any[] = [];
  networkTypes: any[] = [];
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'mac_address', 'actions'];

  // Model signals for form fields
  templateName = model('');
  defaultName = model('');
  symbol = model('');
  category = model('');
  consoleType = model('');
  consoleAutoStart = model(false);
  ram = model(256);
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
      this.virtualBoxService
        .getTemplate(this.controller, template_id)
        .subscribe((virtualBoxTemplate: VirtualBoxTemplate) => {
          this.virtualBoxTemplate = virtualBoxTemplate;
          if (!this.virtualBoxTemplate.tags) {
            this.virtualBoxTemplate.tags = [];
          }
          this.fillCustomAdapters();
          this.initFormFromTemplate();
          this.cd.markForCheck();
        });
    });
  }

  initFormFromTemplate() {
    this.templateName.set(this.virtualBoxTemplate.name || '');
    this.defaultName.set(this.virtualBoxTemplate.default_name_format || '');
    this.symbol.set(this.virtualBoxTemplate.symbol || '');
    this.category.set(this.virtualBoxTemplate.category || '');
    this.consoleType.set(this.virtualBoxTemplate.console_type || '');
    this.consoleAutoStart.set(this.virtualBoxTemplate.console_auto_start || false);
    this.ram.set(this.virtualBoxTemplate.ram || 256);
    this.onClose.set(this.virtualBoxTemplate.on_close || '');
    this.headless.set(this.virtualBoxTemplate.headless || false);
    this.linkedClone.set(this.virtualBoxTemplate.linked_clone || false);

    this.adapters.set(this.virtualBoxTemplate.adapters || 0);
    this.firstPortName.set(this.virtualBoxTemplate.first_port_name || '');
    this.nameFormat.set(this.virtualBoxTemplate.port_name_format || '');
    this.segmentSize.set(this.virtualBoxTemplate.port_segment_size || 0);
    this.networkType.set(this.virtualBoxTemplate.adapter_type || '');
    this.useAnyAdapter.set(this.virtualBoxTemplate.use_any_adapter || false);

    this.usage.set(this.virtualBoxTemplate.usage || '');
    this.tags.set(this.virtualBoxTemplate.tags || []);
  }

  getConfiguration() {
    this.consoleTypes = this.virtualBoxConfigurationService.getConsoleTypes();
    this.onCloseOptions = this.virtualBoxConfigurationService.getOnCloseoptions();
    this.categories = this.virtualBoxConfigurationService.getCategories();
    this.networkTypes = this.virtualBoxConfigurationService.getNetworkTypes();
  }

  openCustomAdaptersDialog() {
    // Don't call fillCustomAdapters() here as it will override server data
    // Use custom_adapters directly from server response
    const adapters = this.virtualBoxTemplate.custom_adapters ? [...this.virtualBoxTemplate.custom_adapters] : [];

    const dialogRef = this.dialog.open(CustomAdaptersComponent, {
      panelClass: 'custom-adapters-dialog-panel',
      data: {
        adapters: adapters,
        networkTypes: this.networkTypes,
        portNameFormat: this.nameFormat() || 'Ethernet{0}',
        portSegmentSize: this.segmentSize() || 0,
        currentAdapters: this.adapters(),
      } as CustomAdaptersDialogData,
    });

    dialogRef.afterClosed().subscribe((result: CustomAdaptersDialogResult) => {
      if (result) {
        this.virtualBoxTemplate.custom_adapters = result.adapters;
        // Auto-update adapters count based on custom adapters configuration
        if (result.requiredAdapters !== undefined) {
          this.adapters.set(result.requiredAdapters);
        }
        this.cd.markForCheck();
      }
    });
  }

  fillCustomAdapters() {
    let copyOfAdapters = this.virtualBoxTemplate.custom_adapters ? this.virtualBoxTemplate.custom_adapters : [];
    this.virtualBoxTemplate.custom_adapters = [];

    const portNameFormat = this.nameFormat() || 'Ethernet{0}';
    const segmentSize = this.segmentSize() || 0;

    for (let i = 0; i < this.adapters(); i++) {
      if (copyOfAdapters[i]) {
        this.virtualBoxTemplate.custom_adapters.push(copyOfAdapters[i]);
      } else {
        // Calculate port name based on format
        let portName: string;
        if (segmentSize > 0) {
          const segment = Math.floor(i / segmentSize);
          const portInSegment = i % segmentSize;
          portName = portNameFormat.replace('{0}', String(segment * segmentSize + portInSegment));
        } else {
          portName = portNameFormat.replace('{0}', String(i));
        }

        this.virtualBoxTemplate.custom_adapters.push({
          adapter_number: i,
          adapter_type: 'e1000',
          port_name: portName,
        });
      }
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'virtualbox', 'templates']);
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

    // Update virtualBoxTemplate from model signals
    this.virtualBoxTemplate.name = this.templateName();
    this.virtualBoxTemplate.default_name_format = this.defaultName();
    this.virtualBoxTemplate.symbol = this.symbol();
    this.virtualBoxTemplate.category = this.category();
    this.virtualBoxTemplate.console_type = this.consoleType();
    this.virtualBoxTemplate.console_auto_start = this.consoleAutoStart();
    this.virtualBoxTemplate.ram = this.ram();
    this.virtualBoxTemplate.on_close = this.onClose();
    this.virtualBoxTemplate.headless = this.headless();
    this.virtualBoxTemplate.linked_clone = this.linkedClone();

    this.virtualBoxTemplate.adapters = this.adapters();
    this.virtualBoxTemplate.first_port_name = this.firstPortName();
    this.virtualBoxTemplate.port_name_format = this.nameFormat();
    this.virtualBoxTemplate.port_segment_size = this.segmentSize();
    this.virtualBoxTemplate.adapter_type = this.networkType();
    this.virtualBoxTemplate.use_any_adapter = this.useAnyAdapter();

    this.virtualBoxTemplate.usage = this.usage();
    this.virtualBoxTemplate.tags = this.tags();

    // Don't call fillCustomAdapters() here as it will override user's custom adapters
    // User configures custom adapters through the dialog

    this.virtualBoxService.saveTemplate(this.controller, this.virtualBoxTemplate).subscribe({
      next: (virtualBoxTemplate: VirtualBoxTemplate) => {
        this.toasterService.success('Changes saved');
        // Update local template with server response to reflect changes immediately
        this.virtualBoxTemplate = virtualBoxTemplate;
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
}
