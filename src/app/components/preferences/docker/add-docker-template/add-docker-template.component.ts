import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Compute } from '../../../../models/compute';
import { DockerImage } from '../../../../models/docker/docker-image';
import { Controller } from '../../../../models/controller';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { ComputeService } from '../../../../services/compute.service';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';
import { DockerService } from '../../../../services/docker.service';
import { ControllerService } from '../../../../services/controller.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-add-docker-template',
  templateUrl: './add-docker-template.component.html',
  styleUrls: ['./add-docker-template.component.scss', '../../preferences.component.scss'],
})
export class AddDockerTemplateComponent implements OnInit {
  controller:Controller ;
  dockerTemplate: DockerTemplate;
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  isRemoteComputerChosen: boolean = false;
  dockerImages: DockerImage[] = [];
  selectedImage: DockerImage;
  newImageSelected: boolean = false;

  virtualMachineForm: UntypedFormGroup;
  containerNameForm: UntypedFormGroup;
  networkAdaptersForm: UntypedFormGroup;
  isLocalComputerChosen: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private dockerService: DockerService,
    private toasterService: ToasterService,
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    private templateMocksService: TemplateMocksService,
    private configurationService: DockerConfigurationService,
    private computeService: ComputeService
  ) {
    this.dockerTemplate = new DockerTemplate();

    this.virtualMachineForm = this.formBuilder.group({
      filename: new UntypedFormControl(null, Validators.required),
    });

    this.containerNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl(null, Validators.required),
    });

    this.networkAdaptersForm = this.formBuilder.group({
      adapters: new UntypedFormControl('1', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;

      this.consoleTypes = this.configurationService.getConsoleTypes();
      this.auxConsoleTypes = this.configurationService.getAuxConsoleTypes();

      this.templateMocksService.getDockerTemplate().subscribe((dockerTemplate: DockerTemplate) => {
        this.dockerTemplate = dockerTemplate;
      });

      this.dockerService.getImages(controller).subscribe((images) => {
        this.dockerImages = images;
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
      (!this.virtualMachineForm.invalid || (!this.newImageSelected && this.selectedImage)) &&
      !this.containerNameForm.invalid &&
      !this.networkAdaptersForm.invalid
    ) {
      this.dockerTemplate.template_id = uuid();

      if (this.newImageSelected) {
        this.dockerTemplate.image = this.virtualMachineForm.get('filename').value;
      } else {
        this.dockerTemplate.image = this.selectedImage.image;
      }

      this.dockerTemplate.name = this.containerNameForm.get('templateName').value;
      this.dockerTemplate.adapters = +this.networkAdaptersForm.get('adapters').value;
      this.dockerTemplate.compute_id = 'local';

      this.dockerService.addTemplate(this.controller, this.dockerTemplate).subscribe((template: DockerTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
