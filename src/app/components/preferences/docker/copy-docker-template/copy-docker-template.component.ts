import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-copy-docker-template',
  templateUrl: './copy-docker-template.component.html',
  styleUrls: ['./copy-docker-template.component.scss', '../../preferences.component.scss'],
})
export class CopyDockerTemplateComponent implements OnInit {
  controller: Controller;
  templateName: string = '';
  dockerTemplate: DockerTemplate;
  templateNameForm: UntypedFormGroup;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private dockerService: DockerService,
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
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;

      this.dockerService.getTemplate(this.controller, template_id).subscribe((dockerTemplate: DockerTemplate) => {
        this.dockerTemplate = dockerTemplate;
        this.templateName = `Copy of ${this.dockerTemplate.name}`;
      });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'docker', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.dockerTemplate.template_id = uuid();
      this.dockerTemplate.name = this.templateName;

      this.dockerService.addTemplate(this.controller, this.dockerTemplate).subscribe((template: DockerTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
