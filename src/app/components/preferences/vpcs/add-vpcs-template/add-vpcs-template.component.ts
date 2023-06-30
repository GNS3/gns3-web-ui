import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Compute } from '../../../../models/compute';
import{ Controller } from '../../../../models/controller';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ComputeService } from '../../../../services/compute.service';
import { ControllerService } from '../../../../services/controller.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { VpcsService } from '../../../../services/vpcs.service';

@Component({
  selector: 'app-add-vpcs-template',
  templateUrl: './add-vpcs-template.component.html',
  styleUrls: ['./add-vpcs-template.component.scss', '../../preferences.component.scss'],
})
export class AddVpcsTemplateComponent implements OnInit {
  controller:Controller ;
  templateName: string = '';
  templateNameForm: UntypedFormGroup;
  isLocalComputerChosen: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private vpcsService: VpcsService,
    private router: Router,
    private toasterService: ToasterService,
    private templateMocksService: TemplateMocksService,
    private formBuilder: UntypedFormBuilder,
    private computeService: ComputeService
  ) {
    this.templateNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl(null, [Validators.required]),
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
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'vpcs', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.templateName = this.templateNameForm.get('templateName').value;

      let vpcsTemplate: VpcsTemplate;

      this.templateMocksService.getVpcsTemplate().subscribe((template: VpcsTemplate) => {
        vpcsTemplate = template;
      });

      (vpcsTemplate.template_id = uuid()),
      (vpcsTemplate.name = this.templateName),
      (vpcsTemplate.compute_id = 'local');

      this.vpcsService.addTemplate(this.controller, vpcsTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
