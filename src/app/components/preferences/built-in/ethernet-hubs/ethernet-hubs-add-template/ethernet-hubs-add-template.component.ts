import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Compute } from '../../../../../models/compute';
import{ Controller } from '../../../../../models/controller';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ComputeService } from '../../../../../services/compute.service';
import { ControllerService } from '../../../../../services/controller.service';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-ethernet-hubs-add-template',
  templateUrl: './ethernet-hubs-add-template.component.html',
  styleUrls: ['./ethernet-hubs-add-template.component.scss', '../../../preferences.component.scss'],
})
export class EthernetHubsAddTemplateComponent implements OnInit {
  controller:Controller ;
  templateName: string = '';
  formGroup: FormGroup;
  isLocalComputerChosen: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private builtInTemplatesService: BuiltInTemplatesService,
    private router: Router,
    private toasterService: ToasterService,
    private templateMocksService: TemplateMocksService,
    private formBuilder: FormBuilder,
    private computeService: ComputeService
  ) {
    this.formGroup = this.formBuilder.group({
      templateName: new FormControl('', Validators.required),
      numberOfPorts: new FormControl(8, Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;
    });
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'ethernet-hubs']);
  }

  addTemplate() {
    if (!this.formGroup.invalid) {
      let ethernetHubTemplate: EthernetHubTemplate;

      this.templateMocksService.getEthernetHubTemplate().subscribe((template: EthernetHubTemplate) => {
        ethernetHubTemplate = template;
      });

      ethernetHubTemplate.template_id = uuid();
      ethernetHubTemplate.name = this.formGroup.get('templateName').value;
      ethernetHubTemplate.compute_id = 'local';

      for (let i = 0; i < this.formGroup.get('numberOfPorts').value; i++) {
        ethernetHubTemplate.ports_mapping.push({
          name: `Ethernet${i}`,
          port_number: i,
        });
      }

      this.builtInTemplatesService.addTemplate(this.controller, ethernetHubTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
