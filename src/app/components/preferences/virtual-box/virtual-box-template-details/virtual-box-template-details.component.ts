import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { VirtualBoxConfigurationService } from '@services/virtual-box-configuration.service';
import { VirtualBoxService } from '@services/virtual-box.service';
import { CustomAdaptersComponent } from '../../common/custom-adapters/custom-adapters.component';

@Component({
  selector: 'app-virtual-box-template-details',
  templateUrl: './virtual-box-template-details.component.html',
  styleUrls: ['./virtual-box-template-details.component.scss', '../../preferences.component.scss'],
})
export class VirtualBoxTemplateDetailsComponent implements OnInit {
  controller: Controller;
  virtualBoxTemplate: VirtualBoxTemplate;
  isSymbolSelectionOpened: boolean = false;
  consoleTypes: string[] = [];
  onCloseOptions = [];
  categories = [];
  networkTypes = [];
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  isConfiguratorOpened: boolean = false;
  generalSettingsForm: UntypedFormGroup;
  networkForm: UntypedFormGroup;

  @ViewChild('customAdaptersConfigurator')
  customAdaptersConfigurator: CustomAdaptersComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private virtualBoxService: VirtualBoxService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private virtualBoxConfigurationService: VirtualBoxConfigurationService,
    private router: Router
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      symbol: new UntypedFormControl('', Validators.required),
      ram: new UntypedFormControl('', Validators.required),
    });

    this.networkForm = this.formBuilder.group({
      adapters: new UntypedFormControl('', Validators.required),
      nameFormat: new UntypedFormControl('', Validators.required),
      size: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;

      this.getConfiguration();
      this.virtualBoxService
        .getTemplate(this.controller, template_id)
        .subscribe((virtualBoxTemplate: VirtualBoxTemplate) => {
          this.virtualBoxTemplate = virtualBoxTemplate;
          this.fillCustomAdapters();
        });
    });
  }

  getConfiguration() {
    this.consoleTypes = this.virtualBoxConfigurationService.getConsoleTypes();
    this.onCloseOptions = this.virtualBoxConfigurationService.getOnCloseoptions();
    this.categories = this.virtualBoxConfigurationService.getCategories();
    this.networkTypes = this.virtualBoxConfigurationService.getNetworkTypes();
  }

  setCustomAdaptersConfiguratorState(state: boolean) {
    this.isConfiguratorOpened = state;

    if (state) {
      this.fillCustomAdapters();
      this.customAdaptersConfigurator.numberOfAdapters = this.virtualBoxTemplate.adapters;
      this.customAdaptersConfigurator.adapters = [];
      this.virtualBoxTemplate.custom_adapters.forEach((adapter: CustomAdapter) => {
        this.customAdaptersConfigurator.adapters.push({
          adapter_number: adapter.adapter_number,
          adapter_type: adapter.adapter_type,
        });
      });
    }
  }

  saveCustomAdapters(adapters: CustomAdapter[]) {
    this.setCustomAdaptersConfiguratorState(false);
    this.virtualBoxTemplate.custom_adapters = adapters;
  }

  fillCustomAdapters() {
    let copyOfAdapters = this.virtualBoxTemplate.custom_adapters ? this.virtualBoxTemplate.custom_adapters : [];
    this.virtualBoxTemplate.custom_adapters = [];

    for (let i = 0; i < this.virtualBoxTemplate.adapters; i++) {
      if (copyOfAdapters[i]) {
        this.virtualBoxTemplate.custom_adapters.push(copyOfAdapters[i]);
      } else {
        this.virtualBoxTemplate.custom_adapters.push({
          adapter_number: i,
          adapter_type: 'e1000',
        });
      }
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'virtualbox', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid || this.networkForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.fillCustomAdapters();

      this.virtualBoxService
        .saveTemplate(this.controller, this.virtualBoxTemplate)
        .subscribe((virtualBoxTemplate: VirtualBoxTemplate) => {
          this.toasterService.success('Changes saved');
        });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.virtualBoxTemplate.symbol = chosenSymbol;
  }
}
