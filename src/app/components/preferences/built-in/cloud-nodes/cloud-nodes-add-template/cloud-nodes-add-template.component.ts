import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Compute } from '@models/compute';
import { Controller } from '@models/controller';
import { CloudTemplate } from '@models/templates/cloud-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-cloud-nodes-add-template',
  templateUrl: './cloud-nodes-add-template.component.html',
  styleUrls: ['./cloud-nodes-add-template.component.scss', '../../../preferences.component.scss'],
})
export class CloudNodesAddTemplateComponent implements OnInit {
  controller: Controller;
  templateName: string = '';
  formGroup: UntypedFormGroup;
  isLocalComputerChosen: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private builtInTemplatesService: BuiltInTemplatesService,
    private router: Router,
    private toasterService: ToasterService,
    private templateMocksService: TemplateMocksService,
    private formBuilder: UntypedFormBuilder,
    private computeService: ComputeService
  ) {
    this.formGroup = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
    });
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'cloud-nodes']);
  }

  addTemplate() {
    if (!this.formGroup.invalid) {
      let cloudTemplate: CloudTemplate;

      this.templateMocksService.getCloudNodeTemplate().subscribe((template: CloudTemplate) => {
        cloudTemplate = template;
      });

      cloudTemplate.template_id = uuid();
      cloudTemplate.name = this.formGroup.get('templateName').value;
      cloudTemplate.compute_id = 'local';

      this.builtInTemplatesService.addTemplate(this.controller, cloudTemplate).subscribe((cloudNodeTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
