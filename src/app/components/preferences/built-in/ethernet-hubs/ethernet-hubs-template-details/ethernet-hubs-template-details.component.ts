import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Controller } from '@models/controller';
import { EthernetHubTemplate } from '@models/templates/ethernet-hub-template';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: false,
  selector: 'app-ethernet-hubs-template-details',
  templateUrl: './ethernet-hubs-template-details.component.html',
  styleUrls: ['./ethernet-hubs-template-details.component.scss', '../../../preferences.component.scss'],
})
export class EthernetHubsTemplateDetailsComponent implements OnInit {
  controller: Controller;
  ethernetHubTemplate: EthernetHubTemplate;
  numberOfPorts: number;
  inputForm: UntypedFormGroup;
  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  categories = [];

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
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;

      this.categories = this.builtInTemplatesConfigurationService.getCategoriesForEthernetHubs();
      this.builtInTemplatesService
        .getTemplate(this.controller, template_id)
        .subscribe((ethernetHubTemplate: EthernetHubTemplate) => {
          this.ethernetHubTemplate = ethernetHubTemplate;
          if (!this.ethernetHubTemplate.ports_mapping) {
            this.ethernetHubTemplate.ports_mapping = [];
          }
          this.numberOfPorts = this.ethernetHubTemplate.ports_mapping.length;
          if (!this.ethernetHubTemplate.tags) {
            this.ethernetHubTemplate.tags = [];
          }
        });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'ethernet-hubs']);
  }

  onSave() {
    if (this.inputForm.invalid || !this.numberOfPorts) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.ethernetHubTemplate.ports_mapping = [];
      for (let i = 0; i < this.numberOfPorts; i++) {
        this.ethernetHubTemplate.ports_mapping.push({
          name: `Ethernet${i}`,
          port_number: i,
        });
      }

      this.builtInTemplatesService
        .saveTemplate(this.controller, this.ethernetHubTemplate)
        .subscribe((ethernetHubTemplate: EthernetHubTemplate) => {
          this.toasterService.success('Changes saved');
        });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.ethernetHubTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.ethernetHubTemplate) {
      if (!this.ethernetHubTemplate.tags) {
        this.ethernetHubTemplate.tags = [];
      }
      this.ethernetHubTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.ethernetHubTemplate.tags) {
      return;
    }
    const index = this.ethernetHubTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.ethernetHubTemplate.tags.splice(index, 1);
    }
  }
}
