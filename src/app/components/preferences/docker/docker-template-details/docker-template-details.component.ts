import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject, signal, computed } from '@angular/core';
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
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatDialog } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { finalize } from 'rxjs';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { ApplianceMetadata } from '@models/appliance-metadata';
import { NetmikoDeviceTypeSelectComponent } from '@components/netmiko-device-type-select/netmiko-device-type-select.component';
import {
  applianceCredentialValue,
  ApplianceCredentialField,
  setApplianceCredential,
} from '../../template-metadata-section/appliance-metadata-field';
import { ExtraConfig } from '@models/templates/extra-config';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { DockerValidationService } from '@services/validation';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { TemplateMetadataSectionComponent } from '../../template-metadata-section/template-metadata-section.component';
import { DialogConfigService } from '@services/dialog-config.service';
import { ConfigureCustomAdaptersDialogComponent } from '../../../project-map/node-editors/configurator/docker/configure-custom-adapters/configure-custom-adapters.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docker-template-details',
  templateUrl: './docker-template-details.component.html',
  styleUrls: [
    './docker-template-details.component.scss',
    '../../preferences.component.scss',
    '../../common/template-edit-page.scss',
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    TemplateMetadataSectionComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    NetmikoDeviceTypeSelectComponent,
    CdkTextareaAutosize,
  ],
})
export class DockerTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private dockerService = inject(DockerService);
  private toasterService = inject(ToasterService);
  private validationService = inject(DockerValidationService);
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
  activeSection = 'general';

  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  consoleResolutions: string[] = [];
  categories: any[] = [];
  displayedColumns: string[] = ['adapter_number', 'port_name'];

  // Model signals for form fields
  name = model('');
  defaultNameFormat = model('');
  category = model('');
  symbol = model('');
  tags = model<string[]>([]);
  image = model('');
  startCommand = model('');
  macAddress = model('');
  adaptersCount = model(0);
  memory = model(0);
  cpus = model(0);
  consoleType = model('');
  auxConsoleType = model('');
  consoleAutoStart = model(false);
  consoleResolution = model('');
  consoleHttpPort = model(0);
  consoleHttpPath = model('');
  environment = model('');
  extraHosts = model('');
  extraVolumes = model('');
  extraConfigs = signal<ExtraConfig[]>([]);
  usage = model('');
  netmikoDeviceType = model('');
  readonly applianceMetadata = signal<ApplianceMetadata | null>(null);
  readonly defaultUsername = computed(() => applianceCredentialValue(this.applianceMetadata(), 'default_username'));
  readonly defaultPassword = computed(() => applianceCredentialValue(this.applianceMetadata(), 'default_password'));
  readonly isPulling = signal(false);

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
            this.image.set(dockerTemplate.image || '');
            this.startCommand.set(dockerTemplate.start_command || '');
            this.macAddress.set(dockerTemplate.mac_address || '');
            this.adaptersCount.set(dockerTemplate.adapters || 0);
            this.consoleType.set(dockerTemplate.console_type || '');
            this.auxConsoleType.set(dockerTemplate.aux_type || '');
            this.consoleAutoStart.set(dockerTemplate.console_auto_start || false);
            this.consoleResolution.set(dockerTemplate.console_resolution || '');
            this.consoleHttpPort.set(dockerTemplate.console_http_port || 0);
            this.consoleHttpPath.set(dockerTemplate.console_http_path || '');
            this.memory.set(dockerTemplate.memory || 0);
            this.cpus.set(dockerTemplate.cpus || 0);
            this.environment.set(dockerTemplate.environment || '');
            this.extraHosts.set(dockerTemplate.extra_hosts || '');
            this.extraVolumes.set((dockerTemplate.extra_volumes || []).join('\n'));
            this.extraConfigs.set(
              (dockerTemplate.extra_configs || []).map((c) => ({ target: c.target || '', content: c.content ?? '' }))
            );
            this.usage.set(dockerTemplate.usage || '');
            this.netmikoDeviceType.set(dockerTemplate.netmiko_device_type || '');
            this.applianceMetadata.set(dockerTemplate.appliance_metadata ?? null);
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
    this.router.navigate(['/controller', this.controller.id, 'preferences']);
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

  onCredentialInput(field: ApplianceCredentialField, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.applianceMetadata.set(setApplianceCredential(this.applianceMetadata(), field, value));
  }

  selectSection(section: string): void { this.activeSection = section; }

  onSave() {
    // Validate name (required)
    const nameValidation = this.validationService.validateName(this.name());
    if (!nameValidation.isValid) {
      this.toasterService.error(nameValidation.errorMessage || 'Name is required');
      return;
    }

    // Validate image (required)
    const imageValidation = this.validationService.validateName(this.image());
    if (!imageValidation.isValid) {
      this.toasterService.error('Image is required');
      return;
    }

    // Validate adapters (0-100 for templates)
    const adapterValidation = this.validationService.validateAdapters(this.adaptersCount().toString(), 100);
    if (!adapterValidation.isValid) {
      this.toasterService.error(adapterValidation.errorMessage);
      return;
    }

    // Validate MAC address format if provided
    const macValidation = this.validationService.validateMacAddress(this.macAddress());
    if (!macValidation.isValid) {
      this.toasterService.error(macValidation.errorMessage);
      return;
    }

    // Validate memory (non-negative integer)
    const memoryValidation = this.validationService.validateMemory(this.memory().toString());
    if (!memoryValidation.isValid) {
      this.toasterService.error(memoryValidation.errorMessage);
      return;
    }

    // Validate CPUs (non-negative number)
    const cpusValidation = this.validationService.validateCpus(this.cpus().toString());
    if (!cpusValidation.isValid) {
      this.toasterService.error(cpusValidation.errorMessage);
      return;
    }

    // Validate console HTTP port if provided
    if (this.consoleHttpPort()) {
      const portValidation = this.validationService.validateConsoleHttpPort(this.consoleHttpPort().toString());
      if (!portValidation.isValid) {
        this.toasterService.error(portValidation.errorMessage || 'Console HTTP port must be between 1 and 65535');
        return;
      }
    }

    // Validate environment variables format if provided
    const envValidation = this.validationService.validateEnvironment(this.environment(), 'Advanced > Environment');
    if (!envValidation.isValid) {
      this.toasterService.error(envValidation.errorMessage);
      return;
    }

    // Validate extra config files (target required with content, absolute path, no '..', unique)
    const extraConfigsValidation = this.validationService.validateExtraConfigs(this.extraConfigs());
    if (!extraConfigsValidation.isValid) {
      this.toasterService.error(extraConfigsValidation.errorMessage);
      return;
    }

    // Validate netmiko device type format if provided
    const netmikoValidation = this.validationService.validateNetmikoDeviceType(this.netmikoDeviceType());
    if (!netmikoValidation.isValid) {
      this.toasterService.error(netmikoValidation.errorMessage);
      return;
    }

    // Update dockerTemplate from model signals
    this.dockerTemplate.name = this.name();
    this.dockerTemplate.default_name_format = this.defaultNameFormat();
    this.dockerTemplate.category = this.category();
    this.dockerTemplate.symbol = this.symbol();
    this.dockerTemplate.tags = this.tags();
    this.dockerTemplate.image = this.image();
    this.dockerTemplate.start_command = this.startCommand();
    this.dockerTemplate.mac_address = this.macAddress();
    this.dockerTemplate.adapters = this.adaptersCount();
    this.dockerTemplate.console_type = this.consoleType();
    this.dockerTemplate.aux_type = this.auxConsoleType();
    this.dockerTemplate.console_auto_start = this.consoleAutoStart();
    this.dockerTemplate.console_resolution = this.consoleResolution();
    this.dockerTemplate.console_http_port = this.consoleHttpPort();
    this.dockerTemplate.console_http_path = this.consoleHttpPath();
    this.dockerTemplate.memory = this.memory();
    this.dockerTemplate.cpus = this.cpus();
    this.dockerTemplate.environment = this.environment();
    this.dockerTemplate.extra_hosts = this.extraHosts();
    this.dockerTemplate.extra_volumes = this.extraVolumes()
      ? this.extraVolumes()
          .split('\n')
          .filter((v) => v.trim())
      : [];
    const extraConfigs = this.extraConfigs()
      .filter((c) => (c.target || '').trim())
      .map((c) => ({ target: c.target.trim(), content: c.content ?? '' }));
    this.dockerTemplate.extra_configs = extraConfigs;
    this.extraConfigs.set(extraConfigs); // drop blank rows so the editor matches what was saved
    this.dockerTemplate.usage = this.usage();
    this.dockerTemplate.netmiko_device_type = this.netmikoDeviceType().trim() || null;
    this.dockerTemplate.appliance_metadata = this.applianceMetadata();

    this.dockerService.saveTemplate(this.controller, this.dockerTemplate).subscribe({
      next: () => {
        this.toasterService.success('Changes saved');
        this.goBack();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to save template';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  pullImage() {
    const image = this.image().trim();
    if (!image || this.isPulling()) {
      return;
    }

    this.isPulling.set(true);
    this.dockerService
      .pullImage(this.controller, image, this.dockerTemplate.compute_id)
      .pipe(
        finalize(() => {
          this.isPulling.set(false);
          this.cd.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.toasterService.success(`Docker image '${image}' updated`);
        },
        error: (err) => {
          const message = err.error?.message || err.message || `Failed to pull Docker image '${image}'`;
          this.toasterService.error(message);
        },
      });
  }

  editCustomAdapters() {
    // Use existing custom_adapters, or generate from adaptersCount
    let adapters = this.dockerTemplate.custom_adapters || [];
    if (adapters.length === 0) {
      adapters = Array.from(
        { length: this.adaptersCount() || 1 },
        (_, i) =>
          ({
            adapter_number: i,
            port_name: '',
            adapter_type: '',
          } as any)
      );
    }
    const dialogConfig = this.dialogConfig.openConfig('base', {
      autoFocus: false,
      panelClass: ['base-dialog-panel', 'docker-configurator-dialog-panel'],
      disableClose: true,
      data: {},
    });
    dialogConfig.data = {};
    const dialogRef = this.dialog.open(ConfigureCustomAdaptersDialogComponent, {
      ...dialogConfig,
      data: {},
    });
    const instance = dialogRef.componentInstance;
    instance.adapters.set(adapters);
    instance.saveHandler = (updatedAdapters: any[]) => {
      this.dockerTemplate.custom_adapters = updatedAdapters.map((a: any) => ({
        ...a,
        mac_address: a.mac_address || null,
      })) as any;
      this.adaptersCount.set(updatedAdapters.length);
    };
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

  addExtraConfig() {
    this.extraConfigs.update((configs) => [...configs, { target: '', content: '' }]);
  }

  removeExtraConfig(index: number) {
    this.extraConfigs.update((configs) => configs.filter((_, i) => i !== index));
  }

  updateExtraConfigTarget(index: number, value: string) {
    this.extraConfigs.update((configs) => configs.map((c, i) => (i === index ? { ...c, target: value } : c)));
  }

  updateExtraConfigContent(index: number, value: string) {
    this.extraConfigs.update((configs) => configs.map((c, i) => (i === index ? { ...c, content: value } : c)));
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
