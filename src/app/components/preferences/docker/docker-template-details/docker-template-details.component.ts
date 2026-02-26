import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-docker-template-details',
  templateUrl: './docker-template-details.component.html',
  styleUrls: ['./docker-template-details.component.scss', '../../preferences.component.scss'],
})
export class DockerTemplateDetailsComponent implements OnInit {
  controller: Controller;
  dockerTemplate: DockerTemplate;

  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  consoleResolutions: string[] = [];
  categories = [];
  adapters: CustomAdapter[] = [];
  displayedColumns: string[] = ['adapter_number', 'port_name'];

  generalSettingsForm: UntypedFormGroup;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private dockerService: DockerService,
    private toasterService: ToasterService,
    private configurationService: DockerConfigurationService,
    private formBuilder: UntypedFormBuilder,
    private router: Router
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new UntypedFormControl('', Validators.required),
      defaultName: new UntypedFormControl('', Validators.required),
      adapter: new UntypedFormControl('', Validators.required),
      symbol: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;

      this.getConfiguration();
      this.dockerService.getTemplate(this.controller, template_id).subscribe((dockerTemplate: DockerTemplate) => {
        this.dockerTemplate = dockerTemplate;
        if (!this.dockerTemplate.tags) {
          this.dockerTemplate.tags = [];
        }
      });
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.auxConsoleTypes = this.configurationService.getAuxConsoleTypes();
    this.categories = this.configurationService.getCategories();
    this.consoleResolutions = this.configurationService.getConsoleResolutions();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'docker', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.dockerService.saveTemplate(this.controller, this.dockerTemplate).subscribe((savedTemplate: DockerTemplate) => {
        this.toasterService.success('Changes saved');
      });
    }
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.dockerTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.dockerTemplate) {
      if (!this.dockerTemplate.tags) {
        this.dockerTemplate.tags = [];
      }
      this.dockerTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.dockerTemplate.tags) {
      return;
    }
    const index = this.dockerTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.dockerTemplate.tags.splice(index, 1);
    }
  }
}
