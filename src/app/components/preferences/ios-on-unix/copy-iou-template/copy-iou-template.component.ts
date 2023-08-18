import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import{ Controller } from '../../../../models/controller';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouService } from '../../../../services/iou.service';
import { ControllerService } from '../../../../services/controller.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-copy-iou-template',
  templateUrl: './copy-iou-template.component.html',
  styleUrls: ['./copy-iou-template.component.scss', '../../preferences.component.scss'],
})
export class CopyIouTemplateComponent implements OnInit {
  controller:Controller ;
  templateName: string = '';
  iouTemplate: IouTemplate;
  templateNameForm: UntypedFormGroup;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private qemuService: IouService,
    private toasterService: ToasterService,
    private router: Router,
    private formBuilder: UntypedFormBuilder
  ) {
    this.templateNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.qemuService.getTemplate(this.controller, template_id).subscribe((iouTemplate: IouTemplate) => {
        this.iouTemplate = iouTemplate;
        this.templateName = `Copy of ${this.iouTemplate.name}`;
      });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'iou', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.iouTemplate.template_id = uuid();
      this.iouTemplate.name = this.templateName;

      this.qemuService.addTemplate(this.controller, this.iouTemplate).subscribe((template: IouTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
