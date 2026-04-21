import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { v4 as uuid } from 'uuid';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-copy-docker-template',
  templateUrl: './copy-docker-template.component.html',
  styleUrls: ['./copy-docker-template.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class CopyDockerTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private dockerService = inject(DockerService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);
  controller: Controller;
  templateName: string = '';
  dockerTemplate: DockerTemplate;
  templateNameForm: UntypedFormGroup;

  constructor() {
    this.templateNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.dockerService.getTemplate(this.controller, template_id).subscribe((dockerTemplate: DockerTemplate) => {
        this.dockerTemplate = dockerTemplate;
        this.templateName = `Copy of ${this.dockerTemplate.name}`;
        this.cd.markForCheck();
      });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'docker', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.dockerTemplate.template_id = uuid();
      this.dockerTemplate.name = this.templateNameForm.get('templateName').value;

      this.dockerService.addTemplate(this.controller, this.dockerTemplate).subscribe({
        next: (template: DockerTemplate) => {
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to copy docker template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        }
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
