import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import{ Controller } from '../../../../models/controller';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosService } from '../../../../services/ios.service';
import { ControllerService } from '../../../../services/controller.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-copy-ios-template',
  templateUrl: './copy-ios-template.component.html',
  styleUrls: ['./copy-ios-template.component.scss', '../../preferences.component.scss'],
})
export class CopyIosTemplateComponent implements OnInit {
  controller:Controller ;
  templateName: string = '';
  iosTemplate: IosTemplate;
  formGroup: UntypedFormGroup;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private iosService: IosService,
    private toasterService: ToasterService,
    private router: Router,
    private formBuilder: UntypedFormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.iosService.getTemplate(this.controller, template_id).subscribe((iosTemplate: IosTemplate) => {
        this.iosTemplate = iosTemplate;
        this.templateName = `Copy of ${this.iosTemplate.name}`;
      });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'dynamips', 'templates']);
  }

  addTemplate() {
    if (!this.formGroup.invalid) {
      this.iosTemplate.template_id = uuid();
      this.iosTemplate.name = this.templateName;

      this.iosService.addTemplate(this.controller, this.iosTemplate).subscribe((template: IosTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
