import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docker-template-details',
  templateUrl: './docker-template-details.component.html',
  styleUrls: ['./docker-template-details.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
  ],
})
export class DockerTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private dockerService = inject(DockerService);
  private toasterService = inject(ToasterService);
  private configurationService = inject(DockerConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);

  controller: Controller;
  dockerTemplate: DockerTemplate;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  generalSettingsExpanded = false;
  advancedExpanded = false;
  usageExpanded = false;

  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  consoleResolutions: string[] = [];
  categories: any[] = [];
  adapters: CustomAdapter[] = [];
  displayedColumns: string[] = ['adapter_number', 'port_name'];

  // Model signals for form fields
  name = model('');
  defaultNameFormat = model('');
  category = model('');
  symbol = model('');
  tags = model<string[]>([]);
  startCommand = model('');
  macAddress = model('');
  adaptersCount = model(0);
  consoleType = model('');
  auxConsoleType = model('');
  consoleAutoStart = model(false);
  consoleResolution = model('');
  consoleHttpPort = model(0);
  consoleHttpPath = model('');
  environment = model('');
  extraHosts = model('');
  usage = model('');

  constructor() {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();

        this.getConfiguration();
        this.dockerService.getTemplate(this.controller, template_id).subscribe({
          next: (dockerTemplate: DockerTemplate) => {
            this.dockerTemplate = dockerTemplate;
            // Initialize model signals from dockerTemplate
            this.name.set(dockerTemplate.name || '');
            this.defaultNameFormat.set(dockerTemplate.default_name_format || '');
            this.category.set(dockerTemplate.category || '');
            this.symbol.set(dockerTemplate.symbol || '');
            this.tags.set(dockerTemplate.tags || []);
            this.startCommand.set(dockerTemplate.start_command || '');
            this.macAddress.set(dockerTemplate.mac_address || '');
            this.adaptersCount.set(dockerTemplate.adapters || 0);
            this.consoleType.set(dockerTemplate.console_type || '');
            this.auxConsoleType.set(dockerTemplate.aux_type || '');
            this.consoleAutoStart.set(dockerTemplate.console_auto_start || false);
            this.consoleResolution.set(dockerTemplate.console_resolution || '');
            this.consoleHttpPort.set(dockerTemplate.console_http_port || 0);
            this.consoleHttpPath.set(dockerTemplate.console_http_path || '');
            this.environment.set(dockerTemplate.environment || '');
            this.extraHosts.set(dockerTemplate.extra_hosts || '');
            this.usage.set(dockerTemplate.usage || '');
            this.cd.markForCheck();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load template';
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

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.auxConsoleTypes = this.configurationService.getAuxConsoleTypes();
    this.categories = this.configurationService.getCategories();
    this.consoleResolutions = this.configurationService.getConsoleResolutions();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'docker', 'templates']);
  }

  toggleSection(section: string) {
    switch (section) {
      case 'general':
        this.generalSettingsExpanded = !this.generalSettingsExpanded;
        break;
      case 'advanced':
        this.advancedExpanded = !this.advancedExpanded;
        break;
      case 'usage':
        this.usageExpanded = !this.usageExpanded;
        break;
    }
  }

  onSave() {
    // Update dockerTemplate from model signals
    this.dockerTemplate.name = this.name();
    this.dockerTemplate.default_name_format = this.defaultNameFormat();
    this.dockerTemplate.category = this.category();
    this.dockerTemplate.symbol = this.symbol();
    this.dockerTemplate.tags = this.tags();
    this.dockerTemplate.start_command = this.startCommand();
    this.dockerTemplate.mac_address = this.macAddress();
    this.dockerTemplate.adapters = this.adaptersCount();
    this.dockerTemplate.console_type = this.consoleType();
    this.dockerTemplate.aux_type = this.auxConsoleType();
    this.dockerTemplate.console_auto_start = this.consoleAutoStart();
    this.dockerTemplate.console_resolution = this.consoleResolution();
    this.dockerTemplate.console_http_port = this.consoleHttpPort();
    this.dockerTemplate.console_http_path = this.consoleHttpPath();
    this.dockerTemplate.environment = this.environment();
    this.dockerTemplate.extra_hosts = this.extraHosts();
    this.dockerTemplate.usage = this.usage();

    this.dockerService.saveTemplate(this.controller, this.dockerTemplate).subscribe({
      next: (savedTemplate: DockerTemplate) => {
        this.toasterService.success('Changes saved');
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to save template';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  chooseSymbol() {
    const dialogConfig = this.dialogConfig.openConfig('templateSymbol', {
      autoFocus: false,
      disableClose: false,
      data: {
        controller: this.controller,
        symbol: this.symbol(),
      },
    });
    const dialogRef = this.dialog.open(TemplateSymbolDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.symbol.set(result);
      }
    });
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
