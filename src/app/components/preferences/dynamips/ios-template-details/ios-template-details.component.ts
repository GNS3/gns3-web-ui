import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { IosService } from '@services/ios.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { IosValidationService } from '@services/validation';
import { ProgressService } from '../../../../common/progress/progress.service';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ios-template-details',
  templateUrl: './ios-template-details.component.html',
  styleUrls: ['./ios-template-details.component.scss', '../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatCheckboxModule,
  ],
})
export class IosTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iosService = inject(IosService);
  private toasterService = inject(ToasterService);
  private iosConfigurationService = inject(IosConfigurationService);
  private progressService = inject(ProgressService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);
  private validationService = inject(IosValidationService);

  controller: Controller;
  iosTemplate: IosTemplate;
  platforms: string[] = [];
  consoleTypes: string[] = [];
  categories = [];
  platformsWithEtherSwitchRouterOption = {};
  platformsWithChassis = {};
  chassis = {};
  defaultRam = {};
  defaultNvram = {};
  networkAdaptersForTemplate: string[] = [];
  wicsForTemplate: string[] = [];
  adapterMatrix = {};
  wicMatrix = {};
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  // Section collapse states
  generalSettingsExpanded = false;
  memoryExpanded = false;
  slotsExpanded = false;
  advancedExpanded = false;
  usageExpanded = false;

  // Model signals
  readonly templateName = model('');
  readonly defaultName = model('');
  readonly symbol = model('');
  readonly imagePath = model('');
  readonly initialConfig = model('');
  readonly ram = model('');
  readonly nvram = model('');
  readonly iomemory = model('');
  readonly disk0 = model('');
  readonly disk1 = model('');
  readonly systemId = model('');
  readonly idlemax = model('');
  readonly idlesleep = model('');
  readonly execArea = model('');
  readonly idlepc = model('');
  readonly baseMac = model('');
  readonly mmap = model(true);
  readonly sparsemem = model(true);
  readonly usage = model('');

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();

        this.getConfiguration();
        this.iosService.getTemplate(this.controller, template_id).subscribe({
          next: (iosTemplate: IosTemplate) => {
            this.iosTemplate = iosTemplate;
            if (!this.iosTemplate.tags) {
              this.iosTemplate.tags = [];
            }
            this.fillSlotsData();
            this.populateForms();
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
    this.platforms = this.iosConfigurationService.getAvailablePlatforms();
    this.platformsWithEtherSwitchRouterOption = this.iosConfigurationService.getPlatformsWithEtherSwitchRouterOption();
    this.platformsWithChassis = this.iosConfigurationService.getPlatformsWithChassis();
    this.chassis = this.iosConfigurationService.getChassis();
    this.defaultRam = this.iosConfigurationService.getDefaultRamSettings();
    this.consoleTypes = this.iosConfigurationService.getConsoleTypes();
    this.categories = this.iosConfigurationService.getCategories();
    this.adapterMatrix = this.iosConfigurationService.getAdapterMatrix();
    this.wicMatrix = this.iosConfigurationService.getWicMatrix();
  }

  findIdlePC() {
    let data = {
      image: this.iosTemplate.image,
      platform: this.iosTemplate.platform,
      ram: this.iosTemplate.ram,
    };
    this.progressService.activate();
    this.iosService.findIdlePC(this.controller, data).subscribe(
      (result: any) => {
        this.progressService.deactivate();
        if (result.idlepc !== null) {
          this.iosTemplate.idlepc = result.idlepc;
          this.idlepc.set(result.idlepc);
          this.toasterService.success(`Idle-PC value found: ${result.idlepc}`);
        }
      },
      (error) => {
        this.progressService.deactivate();
        this.toasterService.error(`Error while finding an idle-PC value`);
      }
    );
  }

  generateBaseMAC() {
    const hexChars = '0123456789abcdef';
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    let mac = '';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const byteIndex = i * 2 + Math.floor(j / 2);
        const nibbleIndex = j % 2;
        const nibble = (randomBytes[byteIndex] >> (nibbleIndex * 4)) & 0x0f;
        mac += hexChars[nibble];
      }
      if (i < 2) mac += '.';
    }
    this.iosTemplate.mac_addr = mac;
    this.baseMac.set(mac);
    this.toasterService.success(`Base MAC generated: ${mac}`);
  }

  fillSlotsData() {
    // load network adapters
    for (let i = 0; i <= 6; i++) {
      if (this.iosTemplate[`slot${i}`]) {
        this.networkAdaptersForTemplate[i] = this.iosTemplate[`slot${i}`];
      }
    }

    // load WICs
    for (let i = 0; i <= 3; i++) {
      if (this.iosTemplate[`wic${i}`]) {
        this.wicsForTemplate[i] = this.iosTemplate[`wic${i}`];
      }
    }
  }

  populateForms() {
    this.templateName.set(this.iosTemplate.name || '');
    this.defaultName.set(this.iosTemplate.default_name_format || '');
    this.symbol.set(this.iosTemplate.symbol || '');
    this.imagePath.set(this.iosTemplate.image || '');
    this.initialConfig.set(this.iosTemplate.startup_config || '');
    this.ram.set(this.iosTemplate.ram?.toString() || '');
    this.nvram.set(this.iosTemplate.nvram?.toString() || '');
    this.iomemory.set(this.iosTemplate.iomem?.toString() || '');
    this.disk0.set(this.iosTemplate.disk0?.toString() || '');
    this.disk1.set(this.iosTemplate.disk1?.toString() || '');
    this.systemId.set(this.iosTemplate.system_id || '');
    this.idlemax.set(this.iosTemplate.idlemax?.toString() || '');
    this.idlesleep.set(this.iosTemplate.idlesleep?.toString() || '');
    this.execArea.set(this.iosTemplate.exec_area?.toString() || '');
    this.idlepc.set(this.iosTemplate.idlepc || '');
    this.baseMac.set(this.iosTemplate.mac_addr || '');
    this.mmap.set(this.iosTemplate.mmap ?? true);
    this.sparsemem.set(this.iosTemplate.sparsemem ?? true);
    this.usage.set(this.iosTemplate.usage || '');
  }

  saveSlotsData() {
    // save network adapters
    for (let i = 0; i <= 6; i++) {
      const slotAdapters = this.adapterMatrix?.[this.iosTemplate.platform]?.[this.iosTemplate.chassis || '']?.[i];
      if (slotAdapters) {
        if (this.networkAdaptersForTemplate[i] === undefined) this.iosTemplate[`slot${i}`] = '';
        else this.iosTemplate[`slot${i}`] = this.networkAdaptersForTemplate[i];
      } else {
        // Remove slot properties that don't exist on this platform/chassis
        delete this.iosTemplate[`slot${i}`];
      }
    }

    // save WICs
    for (let i = 0; i <= 3; i++) {
      const wicAdapters = this.wicMatrix?.[this.iosTemplate.platform]?.[i];
      if (wicAdapters) {
        if (this.wicsForTemplate[i] === undefined) this.iosTemplate[`wic${i}`] = '';
        else this.iosTemplate[`wic${i}`] = this.wicsForTemplate[i];
      } else {
        // Remove WIC properties that don't exist on this platform
        delete this.iosTemplate[`wic${i}`];
      }
    }
  }

  onSave() {
    // Validate required fields
    const nameValidation = this.validationService.validateName(this.templateName());
    if (!nameValidation.isValid) { this.toasterService.error(nameValidation.errorMessage); return; }
    const pathValidation = this.validationService.validateImagePath(this.imagePath());
    if (!pathValidation.isValid) { this.toasterService.error(pathValidation.errorMessage); return; }
    const platform = this.iosTemplate.platform;
    const ramValidation = this.validationService.validateRamForPlatform(this.ram(), platform);
    if (!ramValidation.isValid) { this.toasterService.error(ramValidation.errorMessage); return; }
    const nvramValidation = this.validationService.validateNvramForPlatform(this.nvram(), platform);
    if (!nvramValidation.isValid) { this.toasterService.error(nvramValidation.errorMessage); return; }
    const macValidation = this.validationService.validateMacAddress(this.baseMac());
    if (!macValidation.isValid) { this.toasterService.error(macValidation.errorMessage); return; }
    const idlepcValidation = this.validationService.validateIdlepc(this.idlepc());
    if (!idlepcValidation.isValid) { this.toasterService.error(idlepcValidation.errorMessage); return; }

    this.saveSlotsData();

    this.iosTemplate.name = this.templateName();
    this.iosTemplate.default_name_format = this.defaultName();
    this.iosTemplate.symbol = this.symbol();
    this.iosTemplate.image = this.imagePath();
    this.iosTemplate.startup_config = this.initialConfig();
    this.iosTemplate.ram = parseInt(this.ram(), 10) || 0;
    this.iosTemplate.nvram = parseInt(this.nvram(), 10) || 0;
    this.iosTemplate.iomem = this.iomemory() ? parseInt(this.iomemory(), 10) : undefined;
    this.iosTemplate.disk0 = parseInt(this.disk0(), 10) || 0;
    this.iosTemplate.disk1 = parseInt(this.disk1(), 10) || 0;
    this.iosTemplate.system_id = this.systemId();
    this.iosTemplate.idlemax = parseInt(this.idlemax(), 10) || 0;
    this.iosTemplate.idlesleep = parseInt(this.idlesleep(), 10) || 0;
    this.iosTemplate.exec_area = parseInt(this.execArea(), 10) || 0;
    this.iosTemplate.idlepc = this.idlepc();
    this.iosTemplate.mac_addr = this.baseMac();
    this.iosTemplate.mmap = this.mmap();
    this.iosTemplate.sparsemem = this.sparsemem();
    this.iosTemplate.usage = this.usage();

    this.iosService.saveTemplate(this.controller, this.iosTemplate).subscribe({
      next: () => { this.toasterService.success('Changes saved'); },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to save template';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'dynamips', 'templates']);
  }

  chooseSymbol() {
    const dialogConfig = this.dialogConfig.openConfig('templateSymbol', {
      autoFocus: false, disableClose: false,
      data: { controller: this.controller, symbol: this.iosTemplate.symbol },
    });
    const dialogRef = this.dialog.open(TemplateSymbolDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) { this.iosTemplate.symbol = result; this.symbol.set(result); }
    });
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.iosTemplate) {
      if (!this.iosTemplate.tags) {
        this.iosTemplate.tags = [];
      }
      this.iosTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.iosTemplate.tags) {
      return;
    }
    const index = this.iosTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.iosTemplate.tags.splice(index, 1);
    }
  }

  toggleSection(section: string): void {
    switch (section) {
      case 'general':
        this.generalSettingsExpanded = !this.generalSettingsExpanded;
        break;
      case 'memory':
        this.memoryExpanded = !this.memoryExpanded;
        break;
      case 'slots':
        this.slotsExpanded = !this.slotsExpanded;
        break;
      case 'advanced':
        this.advancedExpanded = !this.advancedExpanded;
        break;
      case 'usage':
        this.usageExpanded = !this.usageExpanded;
        break;
    }
  }
}
