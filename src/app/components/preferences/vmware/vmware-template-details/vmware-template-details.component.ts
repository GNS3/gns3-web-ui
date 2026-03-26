import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject, viewChild } from '@angular/core';
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
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { VmwareConfigurationService } from '@services/vmware-configuration.service';
import { VmwareService } from '@services/vmware.service';
import { CustomAdaptersComponent } from '../../common/custom-adapters/custom-adapters.component';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

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
    CustomAdaptersComponent,
    SymbolsMenuComponent,
  ],
})
export class VmwareTemplateDetailsComponent implements OnInit {
  readonly customAdaptersConfigurator = viewChild<CustomAdaptersComponent>('customAdaptersConfigurator');
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private vmwareService = inject(VmwareService);
  private toasterService = inject(ToasterService);
  private vmwareConfigurationService = inject(VmwareConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  vmwareTemplate: VmwareTemplate;
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  isConfiguratorOpened: boolean = false;
  isSymbolSelectionOpened: boolean = false;
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
        this.fillCustomAdapters();
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

    this.fillCustomAdapters();

    this.vmwareService
      .saveTemplate(this.controller, this.vmwareTemplate)
      .subscribe((vmwareTemplate: VmwareTemplate) => {
        this.toasterService.success('Changes saved');
      });
  }

  setCustomAdaptersConfiguratorState(state: boolean) {
    this.isConfiguratorOpened = state;

    if (state) {
      this.fillCustomAdapters();
      this.customAdaptersConfigurator().numberOfAdapters = this.adapters();
      this.customAdaptersConfigurator().adapters = [];
      this.vmwareTemplate.custom_adapters.forEach((adapter: CustomAdapter) => {
        this.customAdaptersConfigurator().adapters.push({
          adapter_number: adapter.adapter_number,
          adapter_type: adapter.adapter_type,
        });
      });
    }
  }

  saveCustomAdapters(adapters: CustomAdapter[]) {
    this.setCustomAdaptersConfiguratorState(false);
    this.vmwareTemplate.custom_adapters = adapters;
  }

  fillCustomAdapters() {
    let copyOfAdapters = this.vmwareTemplate.custom_adapters ? this.vmwareTemplate.custom_adapters : [];
    this.vmwareTemplate.custom_adapters = [];

    for (let i = 0; i < this.adapters(); i++) {
      if (copyOfAdapters[i]) {
        this.vmwareTemplate.custom_adapters.push(copyOfAdapters[i]);
      } else {
        this.vmwareTemplate.custom_adapters.push({
          adapter_number: i,
          adapter_type: 'e1000',
        });
      }
    }
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
      case 'network':
        this.networkExpanded = !this.networkExpanded;
        break;
      case 'usage':
        this.usageExpanded = !this.usageExpanded;
        break;
    }
  }
}
