import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { VmwareConfigurationService } from '@services/vmware-configuration.service';
import { VmwareService } from '@services/vmware.service';
import { CustomAdaptersComponent } from '../../common/custom-adapters/custom-adapters.component';

@Component({
  selector: 'app-vmware-template-details',
  templateUrl: './vmware-template-details.component.html',
  styleUrls: ['./vmware-template-details.component.scss', '../../preferences.component.scss'],
})
export class VmwareTemplateDetailsComponent implements OnInit {
  controller: Controller;
  vmwareTemplate: VmwareTemplate;
  generalSettingsForm: UntypedFormGroup;
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  isConfiguratorOpened: boolean = false;
  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  categories = [];
  onCloseOptions = [];
  networkTypes = [];

  @ViewChild('customAdaptersConfigurator')
  customAdaptersConfigurator: CustomAdaptersComponent;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private vmwareService: VmwareService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private vmwareConfigurationService: VmwareConfigurationService,
    private router: Router
  ) {
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

      this.getConfiguration();
      this.vmwareService.getTemplate(this.controller, template_id).subscribe((vmwareTemplate: VmwareTemplate) => {
        this.vmwareTemplate = vmwareTemplate;
        if (!this.vmwareTemplate.tags) {
          this.vmwareTemplate.tags = [];
        }
        this.fillCustomAdapters();
      });
    });
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
    if (this.generalSettingsForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.fillCustomAdapters();

      this.vmwareService.saveTemplate(this.controller, this.vmwareTemplate).subscribe((vmwareTemplate: VmwareTemplate) => {
        this.toasterService.success('Changes saved');
      });
    }
  }

  setCustomAdaptersConfiguratorState(state: boolean) {
    this.isConfiguratorOpened = state;

    if (state) {
      this.fillCustomAdapters();
      this.customAdaptersConfigurator.numberOfAdapters = this.vmwareTemplate.adapters;
      this.customAdaptersConfigurator.adapters = [];
      this.vmwareTemplate.custom_adapters.forEach((adapter: CustomAdapter) => {
        this.customAdaptersConfigurator.adapters.push({
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

    for (let i = 0; i < this.vmwareTemplate.adapters; i++) {
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
    this.vmwareTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.vmwareTemplate) {
      if (!this.vmwareTemplate.tags) {
        this.vmwareTemplate.tags = [];
      }
      this.vmwareTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.vmwareTemplate.tags) {
      return;
    }
    const index = this.vmwareTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.vmwareTemplate.tags.splice(index, 1);
    }
  }
}
