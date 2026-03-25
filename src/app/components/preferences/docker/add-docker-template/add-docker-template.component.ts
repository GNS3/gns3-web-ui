import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { v4 as uuid } from 'uuid';
import { Compute } from '@models/compute';
import { DockerImage } from '@models/docker/docker-image';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { ComputeService } from '@services/compute.service';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-docker-template',
  templateUrl: './add-docker-template.component.html',
  styleUrls: ['./add-docker-template.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatRadioModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatStepperModule, MatCheckboxModule]
})
export class AddDockerTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private dockerService = inject(DockerService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private templateMocksService = inject(TemplateMocksService);
  private configurationService = inject(DockerConfigurationService);
  private computeService = inject(ComputeService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  dockerTemplate: DockerTemplate;
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  dockerImages: DockerImage[] = [];
  selectedImage: DockerImage;
  newImageSelected: boolean = false;
  isLocalComputerChosen: boolean = true;

  // Model signals for form fields
  filename = model('');
  templateName = model('');
  adapters = model(1);
  startCommand = model('');
  consoleType = model('');
  auxConsoleType = model('');
  environment = model('');

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.consoleTypes = this.configurationService.getConsoleTypes();
      this.auxConsoleTypes = this.configurationService.getAuxConsoleTypes();

      this.templateMocksService.getDockerTemplate().subscribe((dockerTemplate: DockerTemplate) => {
        this.dockerTemplate = dockerTemplate;
        this.cd.markForCheck();
      });

      this.dockerService.getImages(controller).subscribe((images) => {
        this.dockerImages = images;
        this.cd.markForCheck();
      });
    });
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  setDiskImage(value: string) {
    this.newImageSelected = value === 'newImage';
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'docker', 'templates']);
  }

  addTemplate() {
    if (
      (!this.newImageSelected && this.selectedImage) ||
      (this.newImageSelected && this.filename()) &&
      this.templateName() &&
      this.adapters()
    ) {
      this.dockerTemplate.template_id = uuid();

      if (this.newImageSelected) {
        this.dockerTemplate.image = this.filename();
      } else {
        this.dockerTemplate.image = this.selectedImage.image;
      }

      this.dockerTemplate.name = this.templateName();
      this.dockerTemplate.adapters = this.adapters();
      this.dockerTemplate.compute_id = 'local';
      this.dockerTemplate.start_command = this.startCommand();
      this.dockerTemplate.console_type = this.consoleType();
      this.dockerTemplate.aux_type = this.auxConsoleType();
      this.dockerTemplate.environment = this.environment();

      this.dockerService.addTemplate(this.controller, this.dockerTemplate).subscribe((template: DockerTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}