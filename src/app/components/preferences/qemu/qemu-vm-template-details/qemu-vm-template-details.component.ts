import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { QemuBinary } from '@models/qemu/qemu-binary';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { QemuService } from '@services/qemu.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { CustomAdaptersComponent } from '../../common/custom-adapters/custom-adapters.component';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-qemu-virtual-machine-template-details',
  templateUrl: './qemu-vm-template-details.component.html',
  styleUrls: ['./qemu-vm-template-details.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatExpansionModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, MatCheckboxModule, MatCardModule, CustomAdaptersComponent, SymbolsMenuComponent]
})
export class QemuVmTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private qemuService = inject(QemuService);
  private toasterService = inject(ToasterService);
  private configurationService = inject(QemuConfigurationService);
  private formBuilder = inject(UntypedFormBuilder);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  qemuTemplate: QemuTemplate;
  isSymbolSelectionOpened: boolean = false;
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  diskInterfaces: string[] = [];
  networkTypes = [];
  bootPriorities = [];
  onCloseOptions = [];
  categories = [];
  priorities: string[] = [];
  activateCpuThrottling: boolean = true;
  isConfiguratorOpened: boolean = false;
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  generalSettingsForm: UntypedFormGroup;
  selectPlatform: string[] = [];
  selectedPlatform: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];


  @ViewChild('customAdaptersConfigurator')
  customAdaptersConfigurator: CustomAdaptersComponent;

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      symbol: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.getConfiguration();
      this.qemuService.getTemplate(this.controller, template_id).subscribe((qemuTemplate: QemuTemplate) => {
        this.qemuTemplate = qemuTemplate;
        if (!this.qemuTemplate.tags) {
          this.qemuTemplate.tags = [];
        }
        this.fillCustomAdapters();
        this.cd.markForCheck();
      });
    });

    this.selectPlatform = this.configurationService.getPlatform();
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

  uploadCdromImageFile(event) {
    this.qemuTemplate.cdrom_image = event.target.files[0].name;
  }

  uploadInitrdFile(event) {
    this.qemuTemplate.initrd = event.target.files[0].name;
  }

  uploadKernelImageFile(event) {
    this.qemuTemplate.kernel_image = event.target.files[0].name;
  }

  uploadBiosFile(event) {
    this.qemuTemplate.bios_image = event.target.files[0].name;
  }

  setCustomAdaptersConfiguratorState(state: boolean) {
    this.isConfiguratorOpened = state;

    if (state) {
      this.fillCustomAdapters();
      this.customAdaptersConfigurator.numberOfAdapters = this.qemuTemplate.adapters;
      this.customAdaptersConfigurator.adapters = [];
      this.qemuTemplate.custom_adapters.forEach((adapter: CustomAdapter) => {
        this.customAdaptersConfigurator.adapters.push({
          adapter_number: adapter.adapter_number,
          adapter_type: adapter.adapter_type,
        });
      });
    }
  }

  saveCustomAdapters(adapters: CustomAdapter[]) {
    this.setCustomAdaptersConfiguratorState(false);
    this.qemuTemplate.custom_adapters = adapters;
  }

  fillCustomAdapters() {
    let copyOfAdapters = this.qemuTemplate.custom_adapters ? this.qemuTemplate.custom_adapters : [];
    this.qemuTemplate.custom_adapters = [];

    for (let i = 0; i < this.qemuTemplate.adapters; i++) {
      if (copyOfAdapters[i]) {
        this.qemuTemplate.custom_adapters.push(copyOfAdapters[i]);
      } else {
        this.qemuTemplate.custom_adapters.push({
          adapter_number: i,
          adapter_type: 'e1000',
        });
      }
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'qemu', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid) {
      const missingFields: string[] = [];

      if (this.generalSettingsForm.get('templateName').invalid) {
        missingFields.push('Template name');
      }
      if (this.generalSettingsForm.get('defaultName').invalid) {
        missingFields.push('Default name format');
      }
      if (this.generalSettingsForm.get('symbol').invalid) {
        missingFields.push('Symbol');
      }

      this.toasterService.error(`Missing required fields: ${missingFields.join(', ')}`);
    } else {
      if (!this.activateCpuThrottling) {
        this.qemuTemplate.cpu_throttling = 0;
      }
      this.fillCustomAdapters();

      this.qemuService.saveTemplate(this.controller, this.qemuTemplate).subscribe((savedTemplate: QemuTemplate) => {
        this.toasterService.success('Changes saved');
      });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.qemuTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.qemuTemplate) {
      if (!this.qemuTemplate.tags) {
        this.qemuTemplate.tags = [];
      }
      this.qemuTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.qemuTemplate.tags) {
      return;
    }
    const index = this.qemuTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.qemuTemplate.tags.splice(index, 1);
    }
  }
}
