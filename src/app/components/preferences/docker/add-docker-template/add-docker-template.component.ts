import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { v4 as uuid } from 'uuid';
import { DockerImage } from '@models/docker/docker-image';
import { Controller } from '@models/controller';
import { NetmikoDeviceTypeSelectComponent } from '@components/netmiko-device-type-select/netmiko-device-type-select.component';
import { DockerTemplate } from '@models/templates/docker-template';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';
import { TemplateInfoFieldsComponent } from '../../common/template-info-fields/template-info-fields.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-docker-template',
  templateUrl: './add-docker-template.component.html',
  styleUrls: ['./add-docker-template.component.scss', '../../preferences.component.scss'],
  imports: [
    NetmikoDeviceTypeSelectComponent,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    TemplateInfoFieldsComponent,
    CdkTextareaAutosize,
  ],
})
export class AddDockerTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private dockerService = inject(DockerService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private templateMocksService = inject(TemplateMocksService);
  private configurationService = inject(DockerConfigurationService);
  private validationService = inject(ValidationService);
  private cd = inject(ChangeDetectorRef);

  controller?: Controller;
  dockerTemplate?: DockerTemplate;
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  dockerImages: DockerImage[] = [];
  selectedImage?: DockerImage;
  newImageSelected: boolean = false;
  isLocalComputerChosen: boolean = true;
  readonly selectedStepIndex = signal(0);

  // Model signals for form fields
  filename = model('');
  templateName = model('');
  adapters = model(1);
  startCommand = model('');
  consoleType = model('');
  auxConsoleType = model('');
  environment = model('');
  netmikoDeviceType = model('');
  usage = model('');
  symbol = model('docker_guest');

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();

        this.consoleTypes = this.configurationService.getConsoleTypes();
        this.auxConsoleTypes = this.configurationService.getAuxConsoleTypes();

        this.templateMocksService.getDockerTemplate().subscribe({
          next: (dockerTemplate: DockerTemplate) => {
            this.dockerTemplate = dockerTemplate;
            this.cd.markForCheck();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load template';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });

        this.dockerService.getImages(controller).subscribe({
          next: (images) => {
            this.dockerImages = images;
            this.cd.markForCheck();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load docker images';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  setDiskImage(value: string) {
    this.newImageSelected = value === 'newImage';
  }

  canAdvance(): boolean {
    switch (this.selectedStepIndex()) {
      case 0:
        return this.isLocalComputerChosen;
      case 1:
        return this.newImageSelected ? !!this.filename() : !!this.selectedImage;
      case 2:
        return !!this.templateName();
      case 3:
        return this.adapters() > 0;
      default:
        return true;
    }
  }

  canCreateTemplate(): boolean {
    const hasImage = this.newImageSelected ? !!this.filename() : !!this.selectedImage;
    return !!this.controller && !!this.dockerTemplate && hasImage && !!this.templateName() && this.adapters() > 0;
  }

  goBack() {
    const controllerId = this.controller?.id ?? parseInt(this.route.snapshot.paramMap.get('controller_id'), 10);
    this.router.navigate(['/controller', controllerId, 'preferences']);
  }

  addTemplate() {
    const controller = this.controller;
    const template = this.dockerTemplate;
    const selectedImage = this.selectedImage;
    if (
      !this.canCreateTemplate() ||
      !controller ||
      !template ||
      (!this.newImageSelected && !selectedImage)
    ) {
      this.toasterService.error(`Fill all required fields`);
      return;
    }

    const netmikoValidation = this.validationService.validateNetmikoDeviceType(this.netmikoDeviceType());
    if (!netmikoValidation.isValid) {
      this.toasterService.error(netmikoValidation.errorMessage);
      return;
    }

    template.template_id = uuid();
    template.image = this.newImageSelected ? this.filename() : selectedImage.image;
    template.name = this.templateName();
    template.adapters = this.adapters();
    template.compute_id = 'local';
    template.start_command = this.startCommand();
    template.console_type = this.consoleType() || 'none';
    template.aux_type = this.auxConsoleType() || 'none';
    template.environment = this.environment();
    template.netmiko_device_type = this.netmikoDeviceType().trim() || null;
    template.usage = this.usage();
    template.symbol = this.symbol();

    this.dockerService.addTemplate(controller, template).subscribe({
      next: () => {
        this.goBack();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to add template';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }
}
