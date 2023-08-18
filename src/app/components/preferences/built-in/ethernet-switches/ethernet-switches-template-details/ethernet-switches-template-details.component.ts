import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import{ Controller } from '../../../../../models/controller';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';
import { BuiltInTemplatesConfigurationService } from '../../../../../services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ControllerService } from '../../../../../services/controller.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { PortsComponent } from '../../../common/ports/ports.component';

@Component({
  selector: 'app-ethernet-switches-template-details',
  templateUrl: './ethernet-switches-template-details.component.html',
  styleUrls: ['./ethernet-switches-template-details.component.scss', '../../../preferences.component.scss'],
})
export class EthernetSwitchesTemplateDetailsComponent implements OnInit {
  @ViewChild(PortsComponent) portsComponent: PortsComponent;
  controller:Controller ;
  ethernetSwitchTemplate: EthernetSwitchTemplate;
  inputForm: UntypedFormGroup;
  isSymbolSelectionOpened: boolean = false;
  categories = [];
  consoleTypes: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private builtInTemplatesService: BuiltInTemplatesService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private builtInTemplatesConfigurationService: BuiltInTemplatesConfigurationService,
    private router: Router
  ) {
    this.inputForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      symbol: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.getConfiguration();
      this.builtInTemplatesService
        .getTemplate(this.controller, template_id)
        .subscribe((ethernetSwitchTemplate: EthernetSwitchTemplate) => {
          this.ethernetSwitchTemplate = ethernetSwitchTemplate;
        });
    });
  }

  getConfiguration() {
    this.categories = this.builtInTemplatesConfigurationService.getCategoriesForEthernetSwitches();
    this.consoleTypes = this.builtInTemplatesConfigurationService.getConsoleTypesForEthernetSwitches();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'ethernet-switches']);
  }

  onSave() {
    if (this.inputForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.ethernetSwitchTemplate.ports_mapping = this.portsComponent.ethernetPorts;
      this.builtInTemplatesService
        .saveTemplate(this.controller, this.ethernetSwitchTemplate)
        .subscribe((ethernetSwitchTemplate: EthernetSwitchTemplate) => {
          this.toasterService.success('Changes saved');
        });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.ethernetSwitchTemplate.symbol = chosenSymbol;
  }
}
