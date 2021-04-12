import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';
import { Server } from '../../../../models/server';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';
import { DockerService } from '../../../../services/docker.service';
import { ServerService } from '../../../../services/server.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-docker-template-details',
  templateUrl: './docker-template-details.component.html',
  styleUrls: ['./docker-template-details.component.scss', '../../preferences.component.scss'],
})
export class DockerTemplateDetailsComponent implements OnInit {
  server: Server;
  dockerTemplate: DockerTemplate;

  isSymbolSelectionOpened: boolean = false;

  consoleTypes: string[] = [];
  consoleResolutions: string[] = [];
  categories = [];
  adapters: CustomAdapter[] = [];
  displayedColumns: string[] = ['adapter_number', 'port_name'];

  generalSettingsForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private dockerService: DockerService,
    private toasterService: ToasterService,
    private configurationService: DockerConfigurationService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      templateName: new FormControl('', Validators.required),
      defaultName: new FormControl('', Validators.required),
      adapter: new FormControl('', Validators.required),
      symbol: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;

      this.getConfiguration();
      this.dockerService.getTemplate(this.server, template_id).subscribe((dockerTemplate: DockerTemplate) => {
        this.dockerTemplate = dockerTemplate;
      });
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.categories = this.configurationService.getCategories();
    this.consoleResolutions = this.configurationService.getConsoleResolutions();
  }

  goBack() {
    this.router.navigate(['/server', this.server.id, 'preferences', 'docker', 'templates']);
  }

  onSave() {
    if (this.generalSettingsForm.invalid) {
      this.toasterService.error(`Fill all required fields`);
    } else {
      this.dockerService.saveTemplate(this.server, this.dockerTemplate).subscribe((savedTemplate: DockerTemplate) => {
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
}
